import type { Request, Response } from "express";
import Page from "../models/page/Page.js";
import PageDetails from "../models/page/PageDetails.js";
import Application from "../models/application/Application.js";
import { userCanAccessApplication, userIsAppAdmin } from "../middleware/auth.js";
import { LANGUAGE_VALUES } from "../constants/languages.js";
import { slugify } from "../utils/slugify.js";
import { paginateList, normalizePaging, SORT_BY_VALUES, SORT_ORDER_VALUES } from "../utils/paginateList.js";
import { getPreviewTitle } from "../utils/previewTitle.js";
import { savePageImage } from "../utils/pageImageUpload.js";
import { saveVideo, saveDocument } from "../utils/rawFileUpload.js";
import { getAllowedLanguages } from "../services/applicationSettingsService.js";
import { findAvailableDetailSlug } from "../services/detailSlugService.js";
import { applyMetadata } from "../services/metadataService.js";
import { attachDetailsToParents } from "../services/detailAttachmentService.js";
import { validatePageSections } from "../validators/sectionValidators.js";
import { generatePageTranslation as aiGeneratePageTranslation } from "../services/aiTranslationService.js";

const STATUS_VALUES = PageDetails.schema.path("status").enumValues as string[];

function isValidStatus(status: unknown): status is string {
  return typeof status === "string" && STATUS_VALUES.includes(status);
}

function findAvailableSlug({ application, langKey, baseSlug }: { application: unknown; langKey: string; baseSlug: string }) {
  return findAvailableDetailSlug(PageDetails as any, { application, langKey, baseSlug });
}

// Only replaces `sections` when the caller actually sent it, matching
// applyMetadata's partial-update idiom. Mongoose casts each plain object into
// the right element discriminator via its `elementType` key automatically.
function applySections(detail: any, sections: unknown) {
  if (sections !== undefined) detail.sections = sections;
}

// Demotes whatever page currently holds `isHomepage` for this application (if
// any, and if it isn't `keepId` itself) so the partial unique index never
// sees two `true` rows at once. Called before setting a new homepage, not
// wrapped in a transaction — this is an admin-only, low-frequency action and
// Mongo's index would reject a genuine race anyway.
async function demoteExistingHomepage(application: any, keepId: any) {
  await Page.updateMany(
    { application, isHomepage: true, _id: { $ne: keepId } },
    { isHomepage: false },
  );
}

function attachDetails(pages: any[], { application, langKey, status }: { application?: unknown; langKey?: string; status?: string } = {}) {
  return attachDetailsToParents(PageDetails as any, "page", pages, { application, langKey, status });
}

export async function getPages(req: Request, res: Response) {
  const { application, status, langKey, search, sortBy, sortOrder, page, limit } = req.query;

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
  if (langKey && !(LANGUAGE_VALUES as string[]).includes(langKey as string)) {
    return res
      .status(400)
      .json({ message: `langKey must be one of: ${LANGUAGE_VALUES.join(", ")}` });
  }
  if (sortBy && !(SORT_BY_VALUES as readonly string[]).includes(sortBy as string)) {
    return res.status(400).json({ message: `sortBy must be one of: ${SORT_BY_VALUES.join(", ")}` });
  }
  if (sortOrder && !(SORT_ORDER_VALUES as readonly string[]).includes(sortOrder as string)) {
    return res.status(400).json({ message: `sortOrder must be one of: ${SORT_ORDER_VALUES.join(", ")}` });
  }

  const filter: Record<string, unknown> = { application };
  // status/langKey live on PageDetails, so resolve matching Page ids first.
  // `application` is included even though the ids are re-filtered by it via
  // `filter` below — PageDetails denormalizes `application` specifically so
  // this lookup isn't a status/langKey scan across every application.
  if (status || langKey) {
    const detailFilter: Record<string, unknown> = { application };
    if (status) detailFilter.status = status;
    if (langKey) detailFilter.langKey = langKey;
    filter._id = { $in: await PageDetails.find(detailFilter).distinct("page") };
  }

  res.json(await listPages(filter, { application, langKey, status, search, sortBy, sortOrder, page, limit }));
}

// `title` isn't a field on Page itself (it lives per-language on
// PageDetails), so a title search/sort can't be expressed as a plain Mongo
// filter/sort without an aggregation join — for that path every matching
// page is still fetched and paginated in memory (paginateList), same as
// before. Otherwise (the common case: no search, default or createdAt sort)
// skip/limit/sort go straight to MongoDB.
async function listPages(filter: Record<string, unknown>, { application, langKey, status, search, sortBy, sortOrder, page, limit }: Record<string, any>) {
  if (search || sortBy === "title") {
    const pages = await Page.find(filter).sort({ isHomepage: -1, createdAt: 1 });
    const withDetails: any[] = await attachDetails(pages, { application, langKey, status });
    return paginateList(withDetails, {
      idOf: (p) => p._id.toString(),
      titleOf: (p) => getPreviewTitle(p.details),
      createdAtOf: (p) => p.createdAt,
      search,
      sortBy,
      sortOrder,
      page,
      limit,
    });
  }

  const direction = sortOrder === "asc" ? 1 : -1;
  const { page: effectivePage, limit: effectiveLimit } = normalizePaging(page, limit);

  const total = await Page.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / effectiveLimit));
  const pages = await Page.find(filter)
    .sort({ createdAt: direction, isHomepage: -1 })
    .skip((effectivePage - 1) * effectiveLimit)
    .limit(effectiveLimit);
  const items = await attachDetails(pages, { application, langKey, status });

  return { items, total, page: effectivePage, limit: effectiveLimit, totalPages };
}

export async function getPage(req: Request, res: Response) {
  const page = await Page.findById(req.params.id);
  if (!page) return res.status(404).json({ message: "Page not found" });
  if (!userCanAccessApplication(req.user!, page.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  const details = await PageDetails.find({ page: page._id }).sort({ langKey: 1 });
  res.json({ ...page.toObject(), details });
}

export async function createPage(req: Request, res: Response) {
  const { application, isHomepage, details } = req.body;

  if (!application)
    return res.status(400).json({ message: "application is required" });
  if (!userCanAccessApplication(req.user!, application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (!(await Application.exists({ _id: application }))) {
    return res.status(404).json({ message: "Application not found" });
  }
  if (!Array.isArray(details) || details.length === 0) {
    return res
      .status(400)
      .json({ message: "at least one language in details is required" });
  }
  if (isHomepage && !userIsAppAdmin(req.user!, application)) {
    return res.status(403).json({
      message: "Only a SuperAdmin or WebSite Admin can set a page as the homepage",
    });
  }

  const allowedLanguages = await getAllowedLanguages(application);
  for (const d of details) {
    if (!d.langKey || !allowedLanguages.includes(d.langKey)) {
      return res
        .status(400)
        .json({ message: `langKey must be one of: ${allowedLanguages.join(", ")}` });
    }
    if (!d.title)
      return res.status(400).json({ message: "title is required for each language" });
    if (d.status !== undefined && !isValidStatus(d.status)) {
      return res
        .status(400)
        .json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
    }
    // Setting a non-default status (e.g. publishing right away) is an app-admin
    // action; a plain staff/content-creator can only create a page as a draft.
    if (d.status !== undefined && d.status !== "draft" && !userIsAppAdmin(req.user!, application)) {
      return res.status(403).json({
        message: "Only a SuperAdmin or WebSite Admin can set page status to " + d.status,
      });
    }
    const sectionsCheck = validatePageSections(d.sections);
    if (!sectionsCheck.valid) {
      return res.status(400).json({ message: sectionsCheck.message });
    }
  }

  if (isHomepage) await demoteExistingHomepage(application, null);
  const page = await Page.create({ application, isHomepage: !!isHomepage });

  try {
    // create() (not insertMany) so the pre('save') hook stamps publishedAt when created as published.
    const created = await Promise.all(
      details.map(async (d: any) => {
        const slug = d.slug
          ? slugify(d.slug)
          : await findAvailableSlug({ application, langKey: d.langKey, baseSlug: slugify(d.title) });
        const detail = new PageDetails({
          page: page._id,
          application,
          langKey: d.langKey,
          title: d.title,
          slug,
          status: d.status,
        });
        applyMetadata(detail, d.metadata);
        applySections(detail, d.sections);
        return detail.save();
      }),
    );
    res.status(201).json({ ...page.toObject(), details: created });
  } catch (err: any) {
    await Page.findByIdAndDelete(page._id);
    if (err.code === 11000) {
      const message = err.keyPattern?.slug
        ? "Duplicate slug in details — each language's slug must be unique within this application"
        : "Duplicate language in details";
      return res.status(409).json({ message });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    throw err;
  }
}

// Parent-level fields only — isHomepage today. Per-language fields (title,
// metadata, status, sections, ...) go through upsertPageDetails instead.
export async function updatePage(req: Request, res: Response) {
  const { isHomepage } = req.body;

  const page = await Page.findById(req.params.id);
  if (!page) return res.status(404).json({ message: "Page not found" });
  if (!userIsAppAdmin(req.user!, page.application)) {
    return res.status(403).json({
      message: "Only a SuperAdmin or WebSite Admin can change a page's homepage status",
    });
  }

  if (isHomepage !== undefined) {
    if (isHomepage) await demoteExistingHomepage(page.application, page._id);
    page.isHomepage = !!isHomepage;
  }

  await page.save();
  res.json(page);
}

export async function deletePage(req: Request, res: Response) {
  const page = await Page.findById(req.params.id);
  if (!page) return res.status(404).json({ message: "Page not found" });
  if (!userIsAppAdmin(req.user!, page.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  page.isDeleted = true;
  await page.save();
  await PageDetails.updateMany({ page: page._id }, { isDeleted: true });

  res.status(204).send();
}

export async function upsertPageDetails(req: Request, res: Response) {
  const { id, langKey } = req.params as { id: string; langKey: string };
  const { title, slug, status, metadata, sections } = req.body;

  if (status !== undefined && !isValidStatus(status)) {
    return res
      .status(400)
      .json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }
  const sectionsCheck = validatePageSections(sections);
  if (!sectionsCheck.valid) {
    return res.status(400).json({ message: sectionsCheck.message });
  }

  const page = await Page.findById(id);
  if (!page) return res.status(404).json({ message: "Page not found" });
  if (!userCanAccessApplication(req.user!, page.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  const allowedLanguages = await getAllowedLanguages(page.application);
  if (!allowedLanguages.includes(langKey)) {
    return res
      .status(400)
      .json({ message: `langKey must be one of: ${allowedLanguages.join(", ")}` });
  }
  if (!title) return res.status(400).json({ message: "title is required" });

  // Fetch-then-save (not findOneAndUpdate) so the pre('save') publishedAt hook fires.
  // Look up including soft-deleted rows: a previously removed translation still
  // occupies the {page, langKey} unique index, so re-adding it must revive that
  // row instead of inserting a new one (which would hit a duplicate key error).
  let detail: any = await PageDetails.findOne({ page: id, langKey, isDeleted: { $in: [true, false] } });
  const isNew = !detail;
  const currentStatus = isNew || detail.isDeleted ? "draft" : detail.status;
  if (isNew) {
    detail = new PageDetails({ page: id, application: page.application, langKey });
  } else if (detail.isDeleted) {
    detail.isDeleted = false;
  }

  // Actually changing status (draft <-> published) is an app-admin action; a plain
  // staff/content-creator can still edit title/sections on this translation.
  if (status !== undefined && status !== currentStatus && !userIsAppAdmin(req.user!, page.application)) {
    return res.status(403).json({
      message: "Only a SuperAdmin or WebSite Admin can change page status",
    });
  }

  detail.title = title;
  // Slug is auto-derived from the title only when first created; once set, it's
  // stable across title edits unless explicitly changed, so published links don't break.
  if (slug !== undefined) {
    detail.slug = slugify(slug);
  } else if (isNew) {
    detail.slug = await findAvailableSlug({
      application: page.application,
      langKey,
      baseSlug: slugify(title),
    });
  }
  if (status !== undefined) detail.status = status;
  applyMetadata(detail, metadata);
  applySections(detail, sections);

  try {
    await detail.save();
    res.json(detail);
  } catch (err: any) {
    if (err.code === 11000 && err.keyPattern?.slug) {
      return res.status(409).json({
        message: "Duplicate slug — this slug is already used by another page in this application",
      });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    throw err;
  }
}

export async function deletePageDetails(req: Request, res: Response) {
  const { id, langKey } = req.params as { id: string; langKey: string };

  const page = await Page.findById(id);
  if (!page) return res.status(404).json({ message: "Page not found" });
  if (!userIsAppAdmin(req.user!, page.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  const detail = await PageDetails.findOneAndUpdate(
    { page: id, langKey },
    { isDeleted: true },
  );
  if (!detail) return res.status(404).json({ message: "Translation not found" });

  res.status(204).send();
}

// Generates a draft translation via AI from an existing translation on this
// same Page, for review/editing in the client before Save — never persisted
// here (see upsertPageDetails for the actual save path). userCanAccessApplication
// (not userIsAppAdmin) gates this — same rationale as
// contentController.generateContentTranslation.
export async function generatePageTranslation(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const { sourceLangKey, targetLangKey } = req.body;

  const page = await Page.findById(id);
  if (!page) return res.status(404).json({ message: "Page not found" });
  if (!userCanAccessApplication(req.user!, page.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  if (!sourceLangKey || !targetLangKey) {
    return res.status(400).json({ message: "sourceLangKey and targetLangKey are required" });
  }
  if (sourceLangKey === targetLangKey) {
    return res.status(400).json({ message: "sourceLangKey and targetLangKey must be different" });
  }
  const allowedLanguages = await getAllowedLanguages(page.application);
  if (!allowedLanguages.includes(sourceLangKey) || !allowedLanguages.includes(targetLangKey)) {
    return res
      .status(400)
      .json({ message: `sourceLangKey and targetLangKey must be one of: ${allowedLanguages.join(", ")}` });
  }

  const sourceDetail = await PageDetails.findOne({ page: id, langKey: sourceLangKey });
  if (!sourceDetail) {
    return res.status(404).json({ message: "Source translation not found" });
  }

  const draft = await aiGeneratePageTranslation({
    applicationId: page.application,
    sourceDetail: sourceDetail.toObject(),
    sourceLangKey,
    targetLangKey,
  });

  const sectionsCheck = validatePageSections(draft.sections);
  if (!sectionsCheck.valid) {
    return res.status(502).json({ message: `AI produced an invalid draft: ${sectionsCheck.message}` });
  }

  res.status(200).json(draft);
}

// Used for image elements across page sections (banner, cards, slides, ...).
// Not scoped under a specific Page id — an image may be uploaded before the
// page itself has ever been saved (e.g. mid-way through the "Create Page"
// form). Returns just the bare filename (not a URL) — that's what gets
// stored in the database; the admin panel reconstructs a displayable URL
// itself from {kind: 'images', domain: 'page', filename}
// (client/src/utils/mediaUrl.ts).
export async function uploadPageImage(req: Request, res: Response) {
  const { application } = req.body;
  if (!application)
    return res.status(400).json({ message: "application is required" });
  if (!userCanAccessApplication(req.user!, application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (!req.file)
    return res.status(400).json({ message: "image is required" });

  const filename = await savePageImage(req.file.buffer, req.file.mimetype);
  res.status(201).json({ filename });
}

// Self-hosted video upload for page's videoEmbed/gallery elements — an
// alternative to pasting an external YouTube/Vimeo URL.
export async function uploadPageVideo(req: Request, res: Response) {
  const { application } = req.body;
  if (!application)
    return res.status(400).json({ message: "application is required" });
  if (!userCanAccessApplication(req.user!, application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (!req.file)
    return res.status(400).json({ message: "video is required" });

  const filename = await saveVideo(req.file.buffer, req.file.mimetype, "page");
  res.status(201).json({ filename });
}

// Document upload for page's gallery elements (mediaType: "document").
export async function uploadPageDocument(req: Request, res: Response) {
  const { application } = req.body;
  if (!application)
    return res.status(400).json({ message: "application is required" });
  if (!userCanAccessApplication(req.user!, application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (!req.file)
    return res.status(400).json({ message: "document is required" });

  const filename = await saveDocument(req.file.buffer, req.file.mimetype, "page");
  res.status(201).json({ filename });
}
