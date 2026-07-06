import Tag from "../models/Tag.js";
import Application from "../models/application/Application.js";
import ApplicationSetting from "../models/application/ApplicationSetting.js";
import { userCanAccessApplication } from "../middleware/auth.js";
import { generatePublicId } from "../utils/publicId.js";
import { slugify } from "../utils/slugify.js";
import { LANGUAGE_VALUES } from "../constants/languages.js";

const STATUS_VALUES = Tag.schema.path("status").enumValues;
const MAX_PUBLIC_ID_ATTEMPTS = 5;

// publicId collisions are astronomically unlikely (1 in ~90M per attempt) but
// retry a few times rather than letting a fluke collision fail the request.
async function createTagWithPublicId(data) {
  for (let attempt = 0; attempt < MAX_PUBLIC_ID_ATTEMPTS; attempt++) {
    try {
      return await Tag.create({ ...data, publicId: generatePublicId() });
    } catch (err) {
      if (err.code !== 11000 || !err.keyPattern?.publicId) throw err;
    }
  }
  throw new Error("Failed to generate a unique publicId after several attempts");
}

function isValidStatus(status) {
  return STATUS_VALUES.includes(status);
}

async function getAllowedLanguages(applicationId) {
  const settings = await ApplicationSetting.findOne({
    application: applicationId,
  }).select("languages");
  return settings?.languages?.length ? settings.languages : LANGUAGE_VALUES;
}

// Auto-derived slugs disambiguate silently on collision — e.g. "breaking" ->
// "breaking-2" — same behavior as content slugs. Checks soft-deleted rows too:
// they still occupy the unique index.
async function findAvailableTagSlug({ application, langKey, baseSlug, excludeId }) {
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

export async function getTags(req, res) {
  const { application, status } = req.query;

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

  // Can't sort by "title" server-side anymore — which language's title is
  // "first" is a per-viewer choice, not a per-document fact — so this is
  // ordered by creation instead; the admin UI sorts by its own preview title.
  const tags = await Tag.find(filter).sort({ createdAt: 1 });
  res.json(tags);
}

export async function getTag(req, res) {
  const tag = await Tag.findById(req.params.id);
  if (!tag) return res.status(404).json({ message: "Tag not found" });
  if (!userCanAccessApplication(req.user, tag.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  res.json(tag);
}

export async function createTag(req, res) {
  const { application, translations, status } = req.body;

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

  const resolvedTranslations = await resolveTranslations({ application, translations });
  const tag = await createTagWithPublicId({
    application,
    translations: resolvedTranslations,
    status,
  });
  res.status(201).json(tag);
}

export async function updateTag(req, res) {
  const { translations, status } = req.body;

  const tag = await Tag.findById(req.params.id);
  if (!tag) return res.status(404).json({ message: "Tag not found" });
  if (!userCanAccessApplication(req.user, tag.application)) {
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
    tag.translations = await resolveTranslations({
      application: tag.application,
      translations,
      existing: tag.translations,
      excludeId: tag._id,
    });
  }
  if (status !== undefined) tag.status = status;

  await tag.save();
  res.json(tag);
}

export async function updateTagStatus(req, res) {
  const { status } = req.body;
  if (!status || !isValidStatus(status)) {
    return res
      .status(400)
      .json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }

  const tag = await Tag.findById(req.params.id);
  if (!tag) return res.status(404).json({ message: "Tag not found" });
  if (!userCanAccessApplication(req.user, tag.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  tag.status = status;
  await tag.save();
  res.json(tag);
}

export async function deleteTag(req, res) {
  const tag = await Tag.findById(req.params.id);
  if (!tag) return res.status(404).json({ message: "Tag not found" });
  if (!userCanAccessApplication(req.user, tag.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  tag.isDeleted = true;
  await tag.save();
  res.status(204).send();
}
