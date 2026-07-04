import Category from "../models/Category.js";
import Application from "../models/application/Application.js";
import { userCanAccessApplication } from "../middleware/auth.js";
import { generatePublicId } from "../utils/publicId.js";

const STATUS_VALUES = Category.schema.path("status").enumValues;
const MAX_PUBLIC_ID_ATTEMPTS = 5;

// publicId collisions are astronomically unlikely (1 in ~90M per attempt) but
// retry a few times rather than letting a fluke collision fail the request.
async function createCategoryWithPublicId(data) {
  for (let attempt = 0; attempt < MAX_PUBLIC_ID_ATTEMPTS; attempt++) {
    try {
      return await Category.create({ ...data, publicId: generatePublicId() });
    } catch (err) {
      if (err.code !== 11000 || !err.keyPattern?.publicId) throw err;
    }
  }
  throw new Error("Failed to generate a unique publicId after several attempts");
}

function isValidStatus(status) {
  return STATUS_VALUES.includes(status);
}

function assertParentInApplication(parentId, application) {
  return Category.exists({ _id: parentId, application });
}

// Prevent parentId from creating a cycle (parent chain must never reach categoryId).
async function wouldCreateCycle(categoryId, parentId) {
  let current = parentId;
  while (current) {
    if (current.toString() === categoryId.toString()) return true;
    const parent = await Category.findById(current).select("parentId");
    current = parent?.parentId ?? null;
  }
  return false;
}

export async function getCategories(req, res) {
  const { application, status, parentId } = req.query;

  if (!application)
    return res.status(400).json({ message: "application is required" });
  if (!userCanAccessApplication(req.user, application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (status && !isValidStatus(status)) {
    return res
      .status(400)
      .json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }

  const filter = { application };
  if (status) filter.status = status;
  if (parentId !== undefined) filter.parentId = parentId === "null" ? null : parentId;

  const categories = await Category.find(filter).sort({ title: 1 });
  res.json(categories);
}

export async function getCategory(req, res) {
  const category = await Category.findById(req.params.id);
  if (!category)
    return res.status(404).json({ message: "Category not found" });
  if (!userCanAccessApplication(req.user, category.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  res.json(category);
}

export async function createCategory(req, res) {
  const { application, title, parentId, status } = req.body;

  if (!application)
    return res.status(400).json({ message: "application is required" });
  if (!userCanAccessApplication(req.user, application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (!(await Application.exists({ _id: application }))) {
    return res.status(404).json({ message: "Application not found" });
  }
  if (!title) return res.status(400).json({ message: "title is required" });
  if (status !== undefined && !isValidStatus(status)) {
    return res
      .status(400)
      .json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }
  if (parentId && !(await assertParentInApplication(parentId, application))) {
    return res
      .status(400)
      .json({ message: "parentId must reference a category in the same application" });
  }

  const category = await createCategoryWithPublicId({
    application,
    title,
    parentId: parentId || null,
    status,
  });
  res.status(201).json(category);
}

export async function updateCategory(req, res) {
  const { title, parentId, status } = req.body;

  const category = await Category.findById(req.params.id);
  if (!category)
    return res.status(404).json({ message: "Category not found" });
  if (!userCanAccessApplication(req.user, category.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (status !== undefined && !isValidStatus(status)) {
    return res
      .status(400)
      .json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }

  if (parentId !== undefined) {
    if (parentId) {
      if (parentId.toString() === category._id.toString()) {
        return res.status(400).json({ message: "A category cannot be its own parent" });
      }
      if (!(await assertParentInApplication(parentId, category.application))) {
        return res
          .status(400)
          .json({ message: "parentId must reference a category in the same application" });
      }
      if (await wouldCreateCycle(category._id, parentId)) {
        return res.status(400).json({ message: "parentId would create a circular category tree" });
      }
    }
    category.parentId = parentId || null;
  }
  if (title !== undefined) category.title = title;
  if (status !== undefined) category.status = status;

  await category.save();
  res.json(category);
}

export async function updateCategoryStatus(req, res) {
  const { status } = req.body;
  if (!status || !isValidStatus(status)) {
    return res
      .status(400)
      .json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }

  const category = await Category.findById(req.params.id);
  if (!category)
    return res.status(404).json({ message: "Category not found" });
  if (!userCanAccessApplication(req.user, category.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  category.status = status;
  await category.save();
  res.json(category);
}

export async function deleteCategory(req, res) {
  const category = await Category.findById(req.params.id);
  if (!category)
    return res.status(404).json({ message: "Category not found" });
  if (!userCanAccessApplication(req.user, category.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  const hasChildren = await Category.exists({ parentId: category._id });
  if (hasChildren) {
    return res.status(409).json({
      message: "Cannot delete a category that has subcategories. Move or delete them first.",
    });
  }

  category.isDeleted = true;
  await category.save();
  res.status(204).send();
}
