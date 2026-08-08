import type { Request, Response } from "express";
import Author from "../models/Author.js";
import Application from "../models/application/Application.js";
import { userCanAccessApplication } from "../middleware/auth.js";
import { generatePublicId } from "../utils/publicId.js";
import { slugify } from "../utils/slugify.js";
import { paginateList, SORT_BY_VALUES, SORT_ORDER_VALUES } from "../utils/paginateList.js";
import { getAllowedLanguages } from "../services/applicationSettingsService.js";
import { saveAuthorImage } from "../utils/authorImageUpload.js";

const STATUS_VALUES = Author.schema.path("status").enumValues as string[];
const MAX_PUBLIC_ID_ATTEMPTS = 5;
const SOCIAL_LINK_KEYS = ["linkedin", "x", "instagram"] as const;

// publicId collisions are astronomically unlikely (1 in ~90M per attempt) but
// retry a few times rather than letting a fluke collision fail the request.
async function createAuthorWithPublicId(data: Record<string, unknown>) {
  for (let attempt = 0; attempt < MAX_PUBLIC_ID_ATTEMPTS; attempt++) {
    try {
      return await Author.create({ ...data, publicId: generatePublicId() });
    } catch (err: any) {
      if (err.code !== 11000 || !err.keyPattern?.publicId) throw err;
    }
  }
  throw new Error("Failed to generate a unique publicId after several attempts");
}

function isValidStatus(status: unknown): status is string {
  return typeof status === "string" && STATUS_VALUES.includes(status);
}

// Auto-derived slugs disambiguate silently on collision — e.g. "jane-doe" ->
// "jane-doe-2" — same behavior as Tag/Content slugs. Checks soft-deleted rows
// too: they still occupy the unique index.
async function findAvailableAuthorSlug({
  application,
  baseSlug,
  excludeId,
}: {
  application: any;
  baseSlug: string;
  excludeId?: any;
}) {
  let slug = baseSlug;
  let suffix = 2;
  while (
    await Author.exists({
      application,
      isDeleted: { $in: [true, false] },
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
      slug,
    })
  ) {
    slug = `${baseSlug}-${suffix++}`;
  }
  return slug;
}

// Shape-only validation, mirroring Tag/Category's validateTranslationsInput —
// unlike those, bio is optional (an author can have a language entry with no
// bio yet), so only langKey/shape/duplicates are checked here.
function validateTranslationsInput(translations: unknown, allowedLanguages: readonly string[]) {
  if (translations === undefined) return null;
  if (!Array.isArray(translations)) return "translations must be an array";
  const seen = new Set<string>();
  for (const t of translations) {
    if (!t || typeof t !== "object") return "each translation must be an object";
    if (!allowedLanguages.includes(t.langKey)) {
      return `translations.langKey must be one of: ${allowedLanguages.join(", ")}`;
    }
    if (seen.has(t.langKey)) return "each language may only appear once in translations";
    seen.add(t.langKey);
  }
  return null;
}

function resolveTranslations(translations: unknown): { langKey: string; bio: string }[] {
  if (!Array.isArray(translations)) return [];
  return translations.map((t: any) => ({
    langKey: t.langKey,
    bio: (t.bio ?? "").toString().trim(),
  }));
}

function resolveDisplayName({
  firstName,
  lastName,
  displayName,
}: {
  firstName: string;
  lastName?: string;
  displayName?: unknown;
}): string {
  if (typeof displayName === "string" && displayName.trim()) return displayName.trim();
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

function resolveSocialLinks(socialLinks: unknown): Record<string, string> {
  const resolved: Record<string, string> = { linkedin: "", x: "", instagram: "" };
  if (!socialLinks || typeof socialLinks !== "object") return resolved;
  for (const key of SOCIAL_LINK_KEYS) {
    const value = (socialLinks as any)[key];
    if (typeof value === "string") resolved[key] = value.trim();
  }
  return resolved;
}

export async function getAuthors(req: Request, res: Response) {
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

  const authors = await Author.find(filter);
  res.json(
    paginateList(authors, {
      idOf: (a) => a._id.toString(),
      titleOf: (a) => a.displayName,
      createdAtOf: (a) => (a as any).createdAt,
      search: search as string,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
      page,
      limit,
    }),
  );
}

export async function getAuthor(req: Request, res: Response) {
  const author = await Author.findById(req.params.id);
  if (!author) return res.status(404).json({ message: "Author not found" });
  if (!userCanAccessApplication(req.user!, author.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  res.json(author);
}

export async function createAuthor(req: Request, res: Response) {
  const {
    application,
    firstName,
    lastName,
    displayName,
    email,
    jobTitle,
    websiteUrl,
    avatar,
    socialLinks,
    translations,
    status,
  } = req.body;

  if (!application)
    return res.status(400).json({ message: "application is required" });
  if (!userCanAccessApplication(req.user!, application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (!(await Application.exists({ _id: application }))) {
    return res.status(404).json({ message: "Application not found" });
  }
  if (!firstName || !firstName.toString().trim()) {
    return res.status(400).json({ message: "firstName is required" });
  }
  const allowedLanguages = await getAllowedLanguages(application);
  const translationsError = validateTranslationsInput(translations, allowedLanguages);
  if (translationsError) return res.status(400).json({ message: translationsError });
  if (status !== undefined && !isValidStatus(status)) {
    return res
      .status(400)
      .json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }

  const resolvedDisplayName = resolveDisplayName({ firstName, lastName, displayName });
  if (!resolvedDisplayName) {
    return res.status(400).json({ message: "displayName could not be resolved from firstName/lastName" });
  }
  const slug = await findAvailableAuthorSlug({ application, baseSlug: slugify(resolvedDisplayName) });

  const author = await createAuthorWithPublicId({
    application,
    firstName: firstName.toString().trim(),
    lastName: (lastName ?? "").toString().trim(),
    displayName: resolvedDisplayName,
    slug,
    email: (email ?? "").toString().trim(),
    jobTitle: (jobTitle ?? "").toString().trim(),
    websiteUrl: (websiteUrl ?? "").toString().trim(),
    avatar: (avatar ?? "").toString().trim(),
    socialLinks: resolveSocialLinks(socialLinks),
    translations: resolveTranslations(translations),
    status,
  });
  res.status(201).json(author);
}

export async function updateAuthor(req: Request, res: Response) {
  const {
    firstName,
    lastName,
    displayName,
    email,
    jobTitle,
    websiteUrl,
    avatar,
    socialLinks,
    translations,
    status,
  } = req.body;

  const author = await Author.findById(req.params.id);
  if (!author) return res.status(404).json({ message: "Author not found" });
  if (!userCanAccessApplication(req.user!, author.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (firstName !== undefined && !firstName.toString().trim()) {
    return res.status(400).json({ message: "firstName is required" });
  }
  if (status !== undefined && !isValidStatus(status)) {
    return res
      .status(400)
      .json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }

  if (translations !== undefined) {
    const allowedLanguages = await getAllowedLanguages(author.application);
    const translationsError = validateTranslationsInput(translations, allowedLanguages);
    if (translationsError) return res.status(400).json({ message: translationsError });
    author.translations = resolveTranslations(translations) as any;
  }

  const previousDisplayName = author.displayName;

  if (firstName !== undefined) author.firstName = firstName.toString().trim();
  if (lastName !== undefined) author.lastName = lastName.toString().trim();
  if (displayName !== undefined) author.displayName = displayName.toString().trim();
  // Re-derives displayName only when neither name field explicitly kept it —
  // i.e. an edit to firstName/lastName with no explicit displayName re-fills
  // the auto-computed value, matching the "auto-fill but stay editable" UX.
  if ((firstName !== undefined || lastName !== undefined) && displayName === undefined) {
    author.displayName = resolveDisplayName({
      firstName: author.firstName,
      lastName: author.lastName,
      displayName: undefined,
    }) || author.displayName;
  }
  if (email !== undefined) author.email = email.toString().trim();
  if (jobTitle !== undefined) author.jobTitle = jobTitle.toString().trim();
  if (websiteUrl !== undefined) author.websiteUrl = websiteUrl.toString().trim();
  if (avatar !== undefined) author.avatar = avatar.toString().trim();
  if (socialLinks !== undefined) author.socialLinks = resolveSocialLinks(socialLinks) as any;
  if (status !== undefined) author.status = status;

  // Only re-derive the slug when displayName actually changed text — reusing
  // the existing slug otherwise so saving the form again doesn't shift a
  // published author URL for no reason (same rationale as Tag's title/slug).
  if (author.displayName !== previousDisplayName) {
    author.slug = await findAvailableAuthorSlug({
      application: author.application,
      baseSlug: slugify(author.displayName),
      excludeId: author._id,
    });
  }

  await author.save();
  res.json(author);
}

export async function updateAuthorStatus(req: Request, res: Response) {
  const { status } = req.body;
  if (!status || !isValidStatus(status)) {
    return res
      .status(400)
      .json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }

  const author = await Author.findById(req.params.id);
  if (!author) return res.status(404).json({ message: "Author not found" });
  if (!userCanAccessApplication(req.user!, author.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  author.status = status;
  await author.save();
  res.json(author);
}

export async function deleteAuthor(req: Request, res: Response) {
  const author = await Author.findById(req.params.id);
  if (!author) return res.status(404).json({ message: "Author not found" });
  if (!userCanAccessApplication(req.user!, author.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  author.isDeleted = true;
  await author.save();
  res.status(204).send();
}

// Not scoped under a specific Author id — the avatar may be uploaded before
// the author itself has ever been saved (mid-way through the "Create Author"
// form), same rationale as uploadContentImage. Returns just the bare
// filename; the admin panel reconstructs a displayable URL itself from
// {kind: 'images', domain: 'author', filename} (client/src/utils/mediaUrl.ts).
export async function uploadAuthorAvatar(req: Request, res: Response) {
  const { application } = req.body;
  if (!application)
    return res.status(400).json({ message: "application is required" });
  if (!userCanAccessApplication(req.user!, application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (!req.file)
    return res.status(400).json({ message: "image is required" });

  const filename = await saveAuthorImage(req.file.buffer, req.file.mimetype);
  res.status(201).json({ filename });
}
