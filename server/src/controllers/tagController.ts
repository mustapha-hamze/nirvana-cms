import type { Request, Response } from "express";
import Tag from "../models/Tag.js";
import Application from "../models/application/Application.js";
import { userCanAccessApplication } from "../middleware/auth.js";
import { generatePublicId } from "../utils/publicId.js";
import { slugify } from "../utils/slugify.js";
import { paginateList, SORT_BY_VALUES, SORT_ORDER_VALUES } from "../utils/paginateList.js";
import { getPreviewTitle } from "../utils/previewTitle.js";
import { getAllowedLanguages } from "../services/applicationSettingsService.js";

const STATUS_VALUES = Tag.schema.path("status").enumValues as string[];
const MAX_PUBLIC_ID_ATTEMPTS = 5;

// publicId collisions are astronomically unlikely (1 in ~90M per attempt) but
// retry a few times rather than letting a fluke collision fail the request.
async function createTagWithPublicId(data: Record<string, unknown>) {
  for (let attempt = 0; attempt < MAX_PUBLIC_ID_ATTEMPTS; attempt++) {
    try {
      return await Tag.create({ ...data, publicId: generatePublicId() });
    } catch (err: any) {
      if (err.code !== 11000 || !err.keyPattern?.publicId) throw err;
    }
  }
  throw new Error("Failed to generate a unique publicId after several attempts");
}

function isValidStatus(status: unknown): status is string {
  return typeof status === "string" && STATUS_VALUES.includes(status);
}

// Auto-derived slugs disambiguate silently on collision — e.g. "breaking" ->
// "breaking-2" — same behavior as content slugs. Checks soft-deleted rows too:
// they still occupy the unique index.
async function findAvailableTagSlug({
  application,
  langKey,
  baseSlug,
  excludeId,
}: {
  application: any;
  langKey: string;
  baseSlug: string;
  excludeId?: any;
}) {
  let slug = baseSlug;
  let suffix = 2;
  while (
    await Tag.exists({
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
function validateTranslationsInput(translations: unknown, allowedLanguages: readonly string[]) {
  if (!Array.isArray(translations) || translations.length === 0) {
    return "translations must include at least one language with a title";
  }
  const seen = new Set<string>();
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
async function resolveTranslations({
  application,
  translations,
  existing = [],
  excludeId,
}: {
  application: any;
  translations: any[];
  existing?: any[];
  excludeId?: any;
}) {
  const existingByLang = new Map(existing.map((t) => [t.langKey, t]));
  const resolved = [];
  for (const t of translations) {
    const title = t.title.toString().trim();
    const prior = existingByLang.get(t.langKey);
    if (prior && prior.title === title) {
      resolved.push({ langKey: t.langKey, title, slug: prior.slug });
      continue;
    }
    const slug = await findAvailableTagSlug({
      application,
      langKey: t.langKey,
      baseSlug: slugify(title),
      excludeId,
    });
    resolved.push({ langKey: t.langKey, title, slug });
  }
  return resolved;
}

export async function getTags(req: Request, res: Response) {
  const { application, status, search, sortBy, sortOrder, page, limit } = req.query;

  if (!application)
    return res.status(400).json({ message: "application is required" });
  if (!userCanAccessApplication(req.user!, application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (status && !isValidStatus(status)) {
    return res
      .status(400)
      .json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }
  if (sortBy && !(SORT_BY_VALUES as readonly string[]).includes(sortBy as string)) {
    return res.status(400).json({ message: `sortBy must be one of: ${SORT_BY_VALUES.join(", ")}` });
  }
  if (sortOrder && !(SORT_ORDER_VALUES as readonly string[]).includes(sortOrder as string)) {
    return res.status(400).json({ message: `sortOrder must be one of: ${SORT_ORDER_VALUES.join(", ")}` });
  }

  const filter: Record<string, unknown> = { application };
  if (status) filter.status = status;

  const tags = await Tag.find(filter);
  res.json(
    paginateList(tags, {
      idOf: (t) => t._id.toString(),
      titleOf: (t) => getPreviewTitle(t.translations),
      createdAtOf: (t) => (t as any).createdAt,
      search: search as string,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
      page,
      limit,
    }),
  );
}

export async function getTag(req: Request, res: Response) {
  const tag = await Tag.findById(req.params.id);
  if (!tag) return res.status(404).json({ message: "Tag not found" });
  if (!userCanAccessApplication(req.user!, tag.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  res.json(tag);
}

export async function createTag(req: Request, res: Response) {
  const { application, translations, status } = req.body;

  if (!application)
    return res.status(400).json({ message: "application is required" });
  if (!userCanAccessApplication(req.user!, application)) {
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

  const resolvedTranslations = await resolveTranslations({ application, translations });
  const tag = await createTagWithPublicId({
    application,
    translations: resolvedTranslations,
    status,
  });
  res.status(201).json(tag);
}

export async function updateTag(req: Request, res: Response) {
  const { translations, status } = req.body;

  const tag = await Tag.findById(req.params.id);
  if (!tag) return res.status(404).json({ message: "Tag not found" });
  if (!userCanAccessApplication(req.user!, tag.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (status !== undefined && !isValidStatus(status)) {
    return res
      .status(400)
      .json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }

  if (translations !== undefined) {
    const allowedLanguages = await getAllowedLanguages(tag.application);
    const translationsError = validateTranslationsInput(translations, allowedLanguages);
    if (translationsError) return res.status(400).json({ message: translationsError });
    tag.translations = (await resolveTranslations({
      application: tag.application,
      translations,
      existing: tag.translations,
      excludeId: tag._id,
    })) as any;
  }
  if (status !== undefined) tag.status = status;

  await tag.save();
  res.json(tag);
}

export async function updateTagStatus(req: Request, res: Response) {
  const { status } = req.body;
  if (!status || !isValidStatus(status)) {
    return res
      .status(400)
      .json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }

  const tag = await Tag.findById(req.params.id);
  if (!tag) return res.status(404).json({ message: "Tag not found" });
  if (!userCanAccessApplication(req.user!, tag.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  tag.status = status;
  await tag.save();
  res.json(tag);
}

export async function deleteTag(req: Request, res: Response) {
  const tag = await Tag.findById(req.params.id);
  if (!tag) return res.status(404).json({ message: "Tag not found" });
  if (!userCanAccessApplication(req.user!, tag.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  tag.isDeleted = true;
  await tag.save();
  res.status(204).send();
}
