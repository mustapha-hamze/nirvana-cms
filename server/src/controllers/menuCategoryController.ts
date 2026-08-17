import type { Request, Response } from "express";
import MenuCategory from "../models/menu/MenuCategory.js";
import MenuItem from "../models/menu/MenuItem.js";
import Application from "../models/application/Application.js";
import { userCanAccessApplication } from "../middleware/auth.js";
import { generatePublicId } from "../utils/publicId.js";
import { getAllowedLanguages } from "../services/applicationSettingsService.js";
import { saveMenuCategoryImage } from "../utils/menuImageUpload.js";
import {
  assertMenuInApplication,
  isValidObjectIdString,
  validateTranslationsInput,
  resolveTranslations,
} from "../validators/menuValidators.js";

const STATUS_VALUES = MenuCategory.schema.path("status").enumValues as string[];
const MAX_PUBLIC_ID_ATTEMPTS = 5;

// publicId collisions are astronomically unlikely (1 in ~90M per attempt) but
// retry a few times rather than letting a fluke collision fail the request.
async function createMenuCategoryWithPublicId(data: Record<string, unknown>) {
  for (let attempt = 0; attempt < MAX_PUBLIC_ID_ATTEMPTS; attempt++) {
    try {
      return await MenuCategory.create({ ...data, publicId: generatePublicId() });
    } catch (err: any) {
      if (err.code !== 11000 || !err.keyPattern?.publicId) throw err;
    }
  }
  throw new Error("Failed to generate a unique publicId after several attempts");
}

function isValidStatus(status: unknown): status is string {
  return typeof status === "string" && STATUS_VALUES.includes(status);
}

export async function getMenuCategories(req: Request, res: Response) {
  const { application, menu, status } = req.query;

  if (!application) return res.status(400).json({ message: "application is required" });
  if (!userCanAccessApplication(req.user!, application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (menu !== undefined && !isValidObjectIdString(menu)) {
    return res.status(400).json({ message: "menu must be a valid id" });
  }
  if (status && !isValidStatus(status)) {
    return res.status(400).json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }

  const filter: Record<string, unknown> = { application };
  if (menu) filter.menu = menu;
  if (status) filter.status = status;

  const categories = await MenuCategory.find(filter).sort({ sortOrder: 1, createdAt: 1 });
  res.json(categories);
}

export async function getMenuCategory(req: Request, res: Response) {
  const category = await MenuCategory.findById(req.params.id);
  if (!category) return res.status(404).json({ message: "Menu category not found" });
  if (!userCanAccessApplication(req.user!, category.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  res.json(category);
}

export async function createMenuCategory(req: Request, res: Response) {
  const { application, menu, translations, image, status, sortOrder } = req.body;

  if (!application) return res.status(400).json({ message: "application is required" });
  if (!userCanAccessApplication(req.user!, application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (!(await Application.exists({ _id: application }))) {
    return res.status(404).json({ message: "Application not found" });
  }
  if (!menu || !isValidObjectIdString(menu)) {
    return res.status(400).json({ message: "menu must be a valid id" });
  }
  if (!(await assertMenuInApplication(menu, application))) {
    return res.status(400).json({ message: "menu must reference a menu in the same application" });
  }
  const allowedLanguages = await getAllowedLanguages(application);
  const translationsError = validateTranslationsInput(translations, allowedLanguages);
  if (translationsError) return res.status(400).json({ message: translationsError });
  if (status !== undefined && !isValidStatus(status)) {
    return res.status(400).json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }
  if (sortOrder !== undefined && !Number.isFinite(Number(sortOrder))) {
    return res.status(400).json({ message: "sortOrder must be a number" });
  }

  const resolvedTranslations = await resolveTranslations({
    Model: MenuCategory,
    scope: { application, menu },
    translations,
  });
  const category = await createMenuCategoryWithPublicId({
    application,
    menu,
    translations: resolvedTranslations,
    image: image || "",
    status,
    sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
  });
  res.status(201).json(category);
}

export async function updateMenuCategory(req: Request, res: Response) {
  const { translations, image, status, sortOrder } = req.body;

  const category = await MenuCategory.findById(req.params.id);
  if (!category) return res.status(404).json({ message: "Menu category not found" });
  if (!userCanAccessApplication(req.user!, category.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (status !== undefined && !isValidStatus(status)) {
    return res.status(400).json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }
  if (sortOrder !== undefined && !Number.isFinite(Number(sortOrder))) {
    return res.status(400).json({ message: "sortOrder must be a number" });
  }

  if (translations !== undefined) {
    const allowedLanguages = await getAllowedLanguages(category.application);
    const translationsError = validateTranslationsInput(translations, allowedLanguages);
    if (translationsError) return res.status(400).json({ message: translationsError });
    category.translations = (await resolveTranslations({
      Model: MenuCategory,
      scope: { application: category.application, menu: category.menu },
      translations,
      existing: category.translations,
      excludeId: category._id,
    })) as any;
  }
  if (image !== undefined) category.image = image;
  if (sortOrder !== undefined) category.sortOrder = Number(sortOrder);
  if (status !== undefined) category.status = status;

  await category.save();
  res.json(category);
}

export async function updateMenuCategoryStatus(req: Request, res: Response) {
  const { status } = req.body;
  if (!status || !isValidStatus(status)) {
    return res.status(400).json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }

  const category = await MenuCategory.findById(req.params.id);
  if (!category) return res.status(404).json({ message: "Menu category not found" });
  if (!userCanAccessApplication(req.user!, category.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  category.status = status;
  await category.save();
  res.json(category);
}

export async function deleteMenuCategory(req: Request, res: Response) {
  const category = await MenuCategory.findById(req.params.id);
  if (!category) return res.status(404).json({ message: "Menu category not found" });
  if (!userCanAccessApplication(req.user!, category.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  const hasItems = await MenuItem.exists({ category: category._id });
  if (hasItems) {
    return res.status(409).json({
      message: "Cannot delete a menu category that still has items. Move or delete them first.",
    });
  }

  category.isDeleted = true;
  await category.save();
  res.status(204).send();
}

export async function uploadMenuCategoryImage(req: Request, res: Response) {
  const { application } = req.body;
  if (!application) return res.status(400).json({ message: "application is required" });
  if (!userCanAccessApplication(req.user!, application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (!req.file) return res.status(400).json({ message: "image is required" });

  const filename = await saveMenuCategoryImage(req.file.buffer, req.file.mimetype);
  res.status(201).json({ filename });
}
