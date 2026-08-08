import type { Request, Response } from "express";
import mongoose from "mongoose";
import Content from "../models/content/Content.js";
import ContentDetails from "../models/content/ContentDetails.js";
import Application from "../models/application/Application.js";
import Category from "../models/Category.js";
import Tag from "../models/Tag.js";
import Author from "../models/Author.js";
import { userCanAccessApplication, userIsAppAdmin } from "../middleware/auth.js";
import { LANGUAGE_VALUES } from "../constants/languages.js";
import { slugify } from "../utils/slugify.js";
import { saveContentImage } from "../utils/contentImageUpload.js";
import { saveVideo, saveDocument } from "../utils/rawFileUpload.js";
import { paginateList, normalizePaging, SORT_BY_VALUES, SORT_ORDER_VALUES } from "../utils/paginateList.js";
import { getPreviewTitle } from "../utils/previewTitle.js";
import { getAllowedLanguages } from "../services/applicationSettingsService.js";
import { findAvailableDetailSlug } from "../services/detailSlugService.js";
import { applyMetadata } from "../services/metadataService.js";
import { attachDetailsToParents } from "../services/detailAttachmentService.js";
import { validateIdsInApplication } from "../validators/taxonomyValidator.js";
import { validateContentSections } from "../validators/sectionValidators.js";
import { generateContentTranslation as aiGenerateContentTranslation } from "../services/aiTranslationService.js";

const STATUS_VALUES = ContentDetails.schema.path("status").enumValues as string[];

function isValidStatus(status: unknown): status is string {
  return typeof status === "string" && STATUS_VALUES.includes(status);
}

function findAvailableSlug({ application, langKey, baseSlug }: { application: unknown; langKey: string; baseSlug: string }) {
  return findAvailableDetailSlug(ContentDetails as any, { application, langKey, baseSlug });
}

function validateCategoryIds(categoryIds: unknown, applicationId: unknown) {
  return validateIdsInApplication(Category as any, categoryIds, applicationId);
}

function validateTagIds(tagIds: unknown, applicationId: unknown) {
  return validateIdsInApplication(Tag as any, tagIds, applicationId);
}

// Single ref, not an array — unlike validateIdsInApplication, `null`/`undefined`
// (clearing/omitting the author) is valid and short-circuits without a query.
async function validateAuthorId(authorId: unknown, applicationId: any): Promise<boolean> {
  if (authorId === null || authorId === undefined) return true;
  if (typeof authorId !== "string" || !mongoose.isValidObjectId(authorId)) return false;
  return Boolean(await Author.exists({ _id: authorId, application: applicationId }));
}

// Only replaces `sections` when the caller actually sent it, matching
// applyMetadata's partial-update idiom. Mongoose casts each plain object into
// the right element discriminator via its `elementType` key automatically.
function applySections(detail: any, sections: unknown) {
  if (sections !== undefined) detail.sections = sections;
}

function attachDetails(contents: any[], { application, langKey, status }: { application?: unknown; langKey?: string; status?: string } = {}) {
  return attachDetailsToParents(ContentDetails as any, "content", contents, { application, langKey, status });
}

export async function getContents(req: Request, res: Response) {
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
      .json({
        message: `langKey must be one of: ${LANGUAGE_VALUES.join(", ")}`,
      });
  }
  if (sortBy && !(SORT_BY_VALUES as readonly string[]).includes(sortBy as string)) {
    return res.status(400).json({ message: `sortBy must be one of: ${SORT_BY_VALUES.join(", ")}` });
  }
  if (sortOrder && !(SORT_ORDER_VALUES as readonly string[]).includes(sortOrder as string)) {
    return res.status(400).json({ message: `sortOrder must be one of: ${SORT_ORDER_VALUES.join(", ")}` });
  }

  const filter: Record<string, unknown> = { application };
  // status/langKey live on ContentDetails, so resolve matching Content ids first.
  // `application` is included even though the ids are re-filtered by it via
  // `filter` below — ContentDetails denormalizes `application` specifically
  // so this lookup isn't a status/langKey scan across every application.
  if (status || langKey) {
    const detailFilter: Record<string, unknown> = { application };
    if (status) detailFilter.status = status;
    if (langKey) detailFilter.langKey = langKey;
    filter._id = {
      $in: await ContentDetails.find(detailFilter).distinct("content"),
    };
  }

  res.json(await listContents(filter, { application, langKey, status, search, sortBy, sortOrder, page, limit }));
}

// `title` isn't a field on Content itself (it lives per-language on
// ContentDetails), so a title search/sort can't be expressed as a plain
// Mongo filter/sort without an aggregation join — for that path we still
// fetch every matching content item and paginate in memory (paginateList),
// same as before. Otherwise (the common case: no search, default or
// createdAt sort) skip/limit/sort go straight to MongoDB, so a large
// application's content list no longer pulls every row just to show one page.
async function listContents(filter: Record<string, unknown>, { application, langKey, status, search, sortBy, sortOrder, page, limit }: Record<string, any>) {
  if (search || sortBy === "title") {
    const contents = await Content.find(filter)
      .sort({ createdAt: -1 })
      .populate("categories", "translations parentId")
      .populate("tags", "translations")
      .populate("author", "firstName lastName displayName avatar slug status");
    const withDetails: any[] = await attachDetails(contents, { application, langKey, status });
    return paginateList(withDetails, {
      idOf: (c) => c._id.toString(),
      titleOf: (c) => getPreviewTitle(c.details),
      createdAtOf: (c) => c.createdAt,
      search,
      sortBy,
      sortOrder,
      page,
      limit,
    });
  }

  const direction = sortOrder === "asc" ? 1 : -1;
  const { page: effectivePage, limit: effectiveLimit } = normalizePaging(page, limit);

  const total = await Content.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / effectiveLimit));
  const contents = await Content.find(filter)
    .sort({ createdAt: direction })
    .skip((effectivePage - 1) * effectiveLimit)
    .limit(effectiveLimit)
    .populate("categories", "translations parentId")
    .populate("tags", "translations")
    .populate("author", "firstName lastName displayName avatar slug status");
  const items = await attachDetails(contents, { application, langKey, status });

  return { items, total, page: effectivePage, limit: effectiveLimit, totalPages };
}

export async function getContent(req: Request, res: Response) {
  const content = await Content.findById(req.params.id)
    .populate("categories", "translations parentId")
    .populate("tags", "translations")
    .populate("author", "firstName lastName displayName avatar slug status");
  if (!content) return res.status(404).json({ message: "Content not found" });
  if (!userCanAccessApplication(req.user!, content.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  const details = await ContentDetails.find({ content: content._id }).sort({
    langKey: 1,
  });
  res.json({ ...content.toObject(), details });
}

export async function createContent(req: Request, res: Response) {
  const { application, details, categories = [], tags = [], author = null } = req.body;

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
  if (!(await validateCategoryIds(categories, application))) {
    return res
      .status(400)
      .json({ message: "categories must reference existing categories in the same application" });
  }
  if (!(await validateTagIds(tags, application))) {
    return res
      .status(400)
      .json({ message: "tags must reference existing tags in the same application" });
  }
  if (!(await validateAuthorId(author, application))) {
    return res
      .status(400)
      .json({ message: "author must reference an existing author in the same application" });
  }
  // Assigning categories/tags/author is admin-only, same as their own endpoints.
  if ((categories.length > 0 || tags.length > 0 || author) && !userIsAppAdmin(req.user!, application)) {
    return res.status(403).json({
      message: "Only a SuperAdmin or WebSite Admin can assign categories, tags, or an author to content",
    });
  }
  const allowedLanguages = await getAllowedLanguages(application);
  for (const d of details) {
    if (!d.langKey || !allowedLanguages.includes(d.langKey)) {
      return res
        .status(400)
        .json({
          message: `langKey must be one of: ${allowedLanguages.join(", ")}`,
        });
    }
    if (!d.title)
      return res
        .status(400)
        .json({ message: "title is required for each language" });
    if (d.status !== undefined && !isValidStatus(d.status)) {
      return res
        .status(400)
        .json({
          message: `status must be one of: ${STATUS_VALUES.join(", ")}`,
        });
    }
    // Setting a non-default status (e.g. publishing right away) is an app-admin
    // action; a plain staff/content-creator can only create content as a draft.
    if (
      d.status !== undefined &&
      d.status !== "draft" &&
      !userIsAppAdmin(req.user!, application)
    ) {
      return res.status(403).json({
        message: "Only a SuperAdmin or WebSite Admin can set content status to " + d.status,
      });
    }
    const sectionsCheck = validateContentSections(d.sections);
    if (!sectionsCheck.valid) {
      return res.status(400).json({ message: sectionsCheck.message });
    }
  }

  const content = await Content.create({ application, categories, tags, author });

  try {
    // create() (not insertMany) so the pre('save') hook stamps publishedAt when created as published.
    const created = await Promise.all(
      details.map(async (d: any) => {
        const slug = d.slug
          ? slugify(d.slug)
          : await findAvailableSlug({ application, langKey: d.langKey, baseSlug: slugify(d.title) });
        const detail = new ContentDetails({
          content: content._id,
          application,
          langKey: d.langKey,
          title: d.title,
          slug,
          headline: d.headline,
          abstract: d.abstract,
          status: d.status,
        });
        applyMetadata(detail, d.metadata);
        applySections(detail, d.sections);
        return detail.save();
      }),
    );
    await content.populate("categories", "translations parentId");
    await content.populate("tags", "translations");
    await content.populate("author", "firstName lastName displayName avatar slug status");
    res.status(201).json({ ...content.toObject(), details: created });
  } catch (err: any) {
    await Content.findByIdAndDelete(content._id);
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

// Parent-level fields only — categories/tags/author today. Per-language fields
// (title, metadata, status, ...) go through upsertContentDetails instead.
// Assigning categories/tags/author is admin-only, same as their own endpoints.
export async function updateContent(req: Request, res: Response) {
  const { categories, tags, author } = req.body;

  const content = await Content.findById(req.params.id);
  if (!content) return res.status(404).json({ message: "Content not found" });
  if (!userIsAppAdmin(req.user!, content.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  if (categories !== undefined) {
    if (!(await validateCategoryIds(categories, content.application))) {
      return res
        .status(400)
        .json({ message: "categories must reference existing categories in the same application" });
    }
    content.categories = categories;
  }
  if (tags !== undefined) {
    if (!(await validateTagIds(tags, content.application))) {
      return res
        .status(400)
        .json({ message: "tags must reference existing tags in the same application" });
    }
    content.tags = tags;
  }
  if (author !== undefined) {
    if (!(await validateAuthorId(author, content.application))) {
      return res
        .status(400)
        .json({ message: "author must reference an existing author in the same application" });
    }
    content.author = author;
  }

  await content.save();
  await content.populate("categories", "translations parentId");
  await content.populate("tags", "translations");
  await content.populate("author", "firstName lastName displayName avatar slug status");
  res.json(content);
}

export async function deleteContent(req: Request, res: Response) {
  const content = await Content.findById(req.params.id);
  if (!content) return res.status(404).json({ message: "Content not found" });
  if (!userIsAppAdmin(req.user!, content.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  content.isDeleted = true;
  await content.save();
  await ContentDetails.updateMany(
    { content: content._id },
    { isDeleted: true },
  );

  res.status(204).send();
}

export async function upsertContentDetails(req: Request, res: Response) {
  const { id, langKey } = req.params as { id: string; langKey: string };
  const { title, slug, headline, abstract, status, metadata, sections } = req.body;

  if (status !== undefined && !isValidStatus(status)) {
    return res
      .status(400)
      .json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }
  const sectionsCheck = validateContentSections(sections);
  if (!sectionsCheck.valid) {
    return res.status(400).json({ message: sectionsCheck.message });
  }

  const content = await Content.findById(id);
  if (!content) return res.status(404).json({ message: "Content not found" });
  if (!userCanAccessApplication(req.user!, content.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  const allowedLanguages = await getAllowedLanguages(content.application);
  if (!allowedLanguages.includes(langKey)) {
    return res
      .status(400)
      .json({
        message: `langKey must be one of: ${allowedLanguages.join(", ")}`,
      });
  }
  if (!title) return res.status(400).json({ message: "title is required" });

  // Fetch-then-save (not findOneAndUpdate) so the pre('save') publishedAt hook fires.
  // Look up including soft-deleted rows: a previously removed translation still
  // occupies the {content, langKey} unique index, so re-adding it must revive
  // that row instead of inserting a new one (which would hit a duplicate key error).
  let detail: any = await ContentDetails.findOne({ content: id, langKey, isDeleted: { $in: [true, false] } });
  const isNew = !detail;
  const currentStatus = isNew || detail.isDeleted ? "draft" : detail.status;
  if (isNew) {
    detail = new ContentDetails({ content: id, application: content.application, langKey });
  } else if (detail.isDeleted) {
    detail.isDeleted = false;
  }

  // Actually changing status (draft <-> published) is an app-admin action; a plain
  // staff/content-creator can still edit title/headline/abstract on this translation.
  if (
    status !== undefined &&
    status !== currentStatus &&
    !userIsAppAdmin(req.user!, content.application)
  ) {
    return res.status(403).json({
      message: "Only a SuperAdmin or WebSite Admin can change content status",
    });
  }

  detail.title = title;
  // Slug is auto-derived from the title only when first created; once set, it's
  // stable across title edits unless explicitly changed, so published links don't break.
  if (slug !== undefined) {
    detail.slug = slugify(slug);
  } else if (isNew) {
    detail.slug = await findAvailableSlug({
      application: content.application,
      langKey,
      baseSlug: slugify(title),
    });
  }
  if (headline !== undefined) detail.headline = headline;
  if (abstract !== undefined) detail.abstract = abstract;
  if (status !== undefined) detail.status = status;
  applyMetadata(detail, metadata);
  applySections(detail, sections);

  try {
    await detail.save();
    res.json(detail);
  } catch (err: any) {
    if (err.code === 11000 && err.keyPattern?.slug) {
      return res.status(409).json({
        message: "Duplicate slug — this slug is already used by another content item in this application",
      });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    throw err;
  }
}

export async function deleteContentDetails(req: Request, res: Response) {
  const { id, langKey } = req.params as { id: string; langKey: string };

  const content = await Content.findById(id);
  if (!content) return res.status(404).json({ message: "Content not found" });
  if (!userIsAppAdmin(req.user!, content.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  const detail = await ContentDetails.findOneAndUpdate(
    { content: id, langKey },
    { isDeleted: true },
  );
  if (!detail)
    return res.status(404).json({ message: "Translation not found" });

  res.status(204).send();
}

// Used for image/imageGallery elements in a content body. Not scoped under a
// specific Content id — the image may be uploaded before the content item
// itself has ever been saved (e.g. mid-way through the "Create Content" form).
// Returns just the bare filename (not a URL) — that's what gets stored in
// the database; the admin panel reconstructs a displayable URL itself from
// {kind: 'images', domain: 'content', filename} (client/src/utils/mediaUrl.ts).
export async function uploadContentImage(req: Request, res: Response) {
  const { application } = req.body;
  if (!application)
    return res.status(400).json({ message: "application is required" });
  if (!userCanAccessApplication(req.user!, application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (!req.file)
    return res.status(400).json({ message: "image is required" });

  const filename = await saveContentImage(req.file.buffer, req.file.mimetype);
  res.status(201).json({ filename });
}

// Self-hosted video upload for content's videoEmbed elements — an
// alternative to pasting an external YouTube/Vimeo URL. Same access-check
// and unscoped-storage rationale as uploadContentImage above.
export async function uploadContentVideo(req: Request, res: Response) {
  const { application } = req.body;
  if (!application)
    return res.status(400).json({ message: "application is required" });
  if (!userCanAccessApplication(req.user!, application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (!req.file)
    return res.status(400).json({ message: "video is required" });

  const filename = await saveVideo(req.file.buffer, req.file.mimetype, "content");
  res.status(201).json({ filename });
}

// Generates a draft translation via AI from an existing translation on this
// same Content item, for review/editing in the client before Save — never
// persisted here (see upsertContentDetails for the actual save path).
// userCanAccessApplication (not userIsAppAdmin) gates this: generating draft
// text is a content-authoring action a ContentCreator can do, same as typing
// it by hand; publishing/status changes remain admin-only elsewhere.
export async function generateContentTranslation(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const { sourceLangKey, targetLangKey } = req.body;

  const content = await Content.findById(id)
    .populate("categories", "translations")
    .populate("tags", "translations");
  if (!content) return res.status(404).json({ message: "Content not found" });
  if (!userCanAccessApplication(req.user!, content.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  if (!sourceLangKey || !targetLangKey) {
    return res.status(400).json({ message: "sourceLangKey and targetLangKey are required" });
  }
  if (sourceLangKey === targetLangKey) {
    return res.status(400).json({ message: "sourceLangKey and targetLangKey must be different" });
  }
  const allowedLanguages = await getAllowedLanguages(content.application);
  if (!allowedLanguages.includes(sourceLangKey) || !allowedLanguages.includes(targetLangKey)) {
    return res
      .status(400)
      .json({ message: `sourceLangKey and targetLangKey must be one of: ${allowedLanguages.join(", ")}` });
  }

  const sourceDetail = await ContentDetails.findOne({ content: id, langKey: sourceLangKey });
  if (!sourceDetail) {
    return res.status(404).json({ message: "Source translation not found" });
  }

  // Best-effort context for the prompt — category/tag titles in the source
  // language, if any are assigned and populated.
  const topics = ([...(content.categories ?? []), ...(content.tags ?? [])] as any[])
    .map((t) => t?.translations?.find((tr: any) => tr.langKey === sourceLangKey)?.title)
    .filter((title): title is string => Boolean(title));

  const draft = await aiGenerateContentTranslation({
    applicationId: content.application,
    sourceDetail: sourceDetail.toObject(),
    sourceLangKey,
    targetLangKey,
    topics,
  });

  const sectionsCheck = validateContentSections(draft.sections);
  if (!sectionsCheck.valid) {
    return res.status(502).json({ message: `AI produced an invalid draft: ${sectionsCheck.message}` });
  }

  res.status(200).json(draft);
}

// No content element type consumes this yet (content has no document-bearing
// element, unlike page's galleryItem) — provided for parity with page's
// upload surface, ready for whenever content gains one.
export async function uploadContentDocument(req: Request, res: Response) {
  const { application } = req.body;
  if (!application)
    return res.status(400).json({ message: "application is required" });
  if (!userCanAccessApplication(req.user!, application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (!req.file)
    return res.status(400).json({ message: "document is required" });

  const filename = await saveDocument(req.file.buffer, req.file.mimetype, "content");
  res.status(201).json({ filename });
}
