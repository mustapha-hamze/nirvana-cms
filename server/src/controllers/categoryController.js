import Category from "../models/Category.js";
import Application from "../models/application/Application.js";
import { userCanAccessApplication } from "../middleware/auth.js";
import { generatePublicId } from "../utils/publicId.js";
import { slugify } from "../utils/slugify.js";
import { getAllowedLanguages } from "../services/applicationSettingsService.js";

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

// Auto-derived slugs disambiguate silently on collision — e.g. "sport" ->
// "sport-2" — same behavior as content slugs. Checks soft-deleted rows too:
// they still occupy the unique index.
async function findAvailableCategorySlug({ application, langKey, baseSlug, excludeId }) {
  let slug = baseSlug;
  let suffix = 2;
  while (
    await Category.exists({
      application,
      isDeleted: { $in: [true, false] },
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
      translations: { $elemMatch: { langKey, slug } },
    })
  ) {
    slug = `${baseSlug}-${suffix++}`;
  }
  return slug;
}

// Validates shape only (langKey is one of the app's allowed languages, title
// is non-empty) — slugs are never accepted from the client.
function validateTranslationsInput(translations, allowedLanguages) {
  if (!Array.isArray(translations) || translations.length === 0) {
    return "translations must include at least one language with a title";
  }
  const seen = new Set();
  for (const t of translations) {
    if (!t || typeof t !== "object") return "each translation must be an object";
    if (!allowedLanguages.includes(t.langKey)) {
      return `translations.langKey must be one of: ${allowedLanguages.join(", ")}`;
    }
    if (!t.title || !t.title.toString().trim()) {
      return "each translation requires a non-empty title";
    }
    if (seen.has(t.langKey)) return "each language may only appear once in translations";
    seen.add(t.langKey);
  }
  return null;
}

// Resolves a client-supplied translations array into stored shape, reusing an
// existing slug when a language's title hasn't changed (so saving the form
// again doesn't needlessly shift that language's URL) and auto-deriving a
// fresh one otherwise.
async function resolveTranslations({ application, translations, existing = [], excludeId }) {
  const existingByLang = new Map(existing.map((t) => [t.langKey, t]));
  const resolved = [];
  for (const t of translations) {
    const title = t.title.toString().trim();
    const prior = existingByLang.get(t.langKey);
    if (prior && prior.title === title) {
      resolved.push({ langKey: t.langKey, title, slug: prior.slug });
      continue;
    }
    const slug = await findAvailableCategorySlug({
      application,
      langKey: t.langKey,
      baseSlug: slugify(title),
      excludeId,
    });
    resolved.push({ langKey: t.langKey, title, slug });
  }
  return resolved;
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

  // Can't sort by "title" server-side anymore — which language's title is
  // "first" is a per-viewer choice, not a per-document fact — so this is
  // ordered by creation instead; the admin UI sorts by its own preview title.
  const categories = await Category.find(filter).sort({ createdAt: 1 });
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
  const { application, translations, parentId, status } = req.body;

  if (!application)
    return res.status(400).json({ message: "application is required" });
  if (!userCanAccessApplication(req.user, application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (!(await Application.exists({ _id: application }))) {
    return res.status(404).json({ message: "Application not found" });
  }
  const allowedLanguages = await getAllowedLanguages(application);
  const translationsError = validateTranslationsInput(translations, allowedLanguages);
  if (translationsError) return res.status(400).json({ message: translationsError });
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

  const resolvedTranslations = await resolveTranslations({ application, translations });
  const category = await createCategoryWithPublicId({
    application,
    translations: resolvedTranslations,
    parentId: parentId || null,
    status,
  });
  res.status(201).json(category);
}

export async function updateCategory(req, res) {
  const { translations, parentId, status } = req.body;

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

  if (translations !== undefined) {
    const allowedLanguages = await getAllowedLanguages(category.application);
    const translationsError = validateTranslationsInput(translations, allowedLanguages);
    if (translationsError) return res.status(400).json({ message: translationsError });
    category.translations = await resolveTranslations({
      application: category.application,
      translations,
      existing: category.translations,
      excludeId: category._id,
    });
  }
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
