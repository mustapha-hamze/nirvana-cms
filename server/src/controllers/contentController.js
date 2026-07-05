import Content from "../models/content/Content.js";
import ContentDetails from "../models/content/ContentDetails.js";
import Application from "../models/application/Application.js";
import ApplicationSetting from "../models/application/ApplicationSetting.js";
import Category from "../models/Category.js";
import Tag from "../models/Tag.js";
import { userCanAccessApplication, userIsAppAdmin } from "../middleware/auth.js";
import { LANGUAGE_VALUES } from "../constants/languages.js";
import { SECTION_TYPE_VALUES, SECTION_LAYOUTS } from "../constants/sectionTypes.js";
import { slugify } from "../utils/slugify.js";
import { saveContentImage } from "../utils/contentImageUpload.js";

const STATUS_VALUES = ContentDetails.schema.path("status").enumValues;

function isValidStatus(status) {
  return STATUS_VALUES.includes(status);
}

async function getAllowedLanguages(applicationId) {
  const settings = await ApplicationSetting.findOne({
    application: applicationId,
  }).select("languages");
  return settings?.languages?.length ? settings.languages : LANGUAGE_VALUES;
}

// Auto-derived slugs (title unspecified by the caller) disambiguate silently on
// collision — e.g. "weekly-update" -> "weekly-update-2" — like WordPress/Drupal,
// since duplicate titles are routine and shouldn't block a content creator.
// Explicit, caller-provided slugs are NOT resolved here — a collision on those
// stays a hard validation error, since the creator deliberately chose that slug.
// Checks soft-deleted rows too: they still occupy the unique index.
async function findAvailableSlug({ application, langKey, baseSlug }) {
  let slug = baseSlug;
  let suffix = 2;
  while (
    await ContentDetails.exists({
      application,
      langKey,
      slug,
      isDeleted: { $in: [true, false] },
    })
  ) {
    slug = `${baseSlug}-${suffix++}`;
  }
  return slug;
}

// categories/tags are shared across every language of a Content item (see model
// comment), so they must all belong to the same application as the content.
async function validateIdsInApplication(Model, ids, applicationId) {
  if (!Array.isArray(ids)) return false;
  if (ids.length === 0) return true;
  const uniqueCount = new Set(ids.map(String)).size;
  const found = await Model.countDocuments({
    _id: { $in: ids },
    application: applicationId,
  });
  return found === uniqueCount;
}

function validateCategoryIds(categoryIds, applicationId) {
  return validateIdsInApplication(Category, categoryIds, applicationId);
}

function validateTagIds(tagIds, applicationId) {
  return validateIdsInApplication(Tag, tagIds, applicationId);
}

// Applies only the metadata subfields the caller actually sent, so a partial
// update (e.g. just `author`) doesn't wipe out keywords/description.
function applyMetadata(detail, metadata) {
  if (!metadata || typeof metadata !== "object") return;
  if (metadata.keywords !== undefined) {
    detail.metadata.keywords = Array.isArray(metadata.keywords)
      ? metadata.keywords.map((k) => String(k).trim()).filter(Boolean)
      : [];
  }
  if (metadata.author !== undefined) detail.metadata.author = String(metadata.author).trim();
  if (metadata.description !== undefined) detail.metadata.description = String(metadata.description).trim();
}

// Checks the one thing the Mongoose schema can't express: that each section's
// `type` is a known layout and its `elements` match that layout's slots (see
// SECTION_LAYOUTS) in count, type, and order. Per-field checks (required/
// maxlength on text/url/alt/etc.) are intentionally NOT duplicated here — the
// schema's own discriminators already enforce those and surface as a Mongoose
// ValidationError on .save().
function validateSections(sections) {
  if (sections === undefined) return { valid: true };
  if (!Array.isArray(sections)) {
    return { valid: false, message: "sections must be an array" };
  }
  if (sections.length > 40) {
    return { valid: false, message: "A content body may have at most 40 sections" };
  }
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const layout = SECTION_LAYOUTS[section?.type];
    if (!layout) {
      return {
        valid: false,
        message: `sections[${i}]: type must be one of: ${SECTION_TYPE_VALUES.join(", ")}`,
      };
    }
    const elements = Array.isArray(section.elements) ? section.elements : [];
    const expectedCount = layout.slots.reduce((sum, slot) => sum + slot.count, 0);
    if (elements.length !== expectedCount) {
      return {
        valid: false,
        message: `sections[${i}] (${section.type}) must contain exactly ${expectedCount} element(s)`,
      };
    }
    let cursor = 0;
    for (const slot of layout.slots) {
      for (let s = 0; s < slot.count; s++) {
        const element = elements[cursor];
        if (!slot.elementTypes.includes(element?.elementType)) {
          return {
            valid: false,
            message: `sections[${i}] (${section.type}): element at position ${cursor} must be one of: ${slot.elementTypes.join(", ")}`,
          };
        }
        cursor++;
      }
    }
  }
  return { valid: true };
}

// Only replaces `sections` when the caller actually sent it, matching
// applyMetadata's partial-update idiom. Mongoose casts each plain object into
// the right element discriminator via its `elementType` key automatically.
function applySections(detail, sections) {
  if (sections !== undefined) detail.sections = sections;
}

async function attachDetails(contents, { langKey, status } = {}) {
  const contentIds = contents.map((c) => c._id);
  const filter = { content: { $in: contentIds } };
  if (langKey) filter.langKey = langKey;
  if (status) filter.status = status;

  const details = await ContentDetails.find(filter).sort({ langKey: 1 });

  const byContentId = new Map();
  for (const detail of details) {
    const key = detail.content.toString();
    if (!byContentId.has(key)) byContentId.set(key, []);
    byContentId.get(key).push(detail);
  }

  return contents.map((c) => ({
    ...c.toObject(),
    details: byContentId.get(c._id.toString()) ?? [],
  }));
}

export async function getContents(req, res) {
  const { application, status, langKey } = req.query;

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
  if (langKey && !LANGUAGE_VALUES.includes(langKey)) {
    return res
      .status(400)
      .json({
        message: `langKey must be one of: ${LANGUAGE_VALUES.join(", ")}`,
      });
  }

  const filter = { application };
  // status/langKey live on ContentDetails, so resolve matching Content ids first.
  if (status || langKey) {
    const detailFilter = {};
    if (status) detailFilter.status = status;
    if (langKey) detailFilter.langKey = langKey;
    filter._id = {
      $in: await ContentDetails.find(detailFilter).distinct("content"),
    };
  }

  const contents = await Content.find(filter)
    .sort({ createdAt: -1 })
    .populate("categories", "title parentId")
    .populate("tags", "title");
  res.json(await attachDetails(contents, { langKey, status }));
}

export async function getContent(req, res) {
  const content = await Content.findById(req.params.id)
    .populate("categories", "title parentId")
    .populate("tags", "title");
  if (!content) return res.status(404).json({ message: "Content not found" });
  if (!userCanAccessApplication(req.user, content.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  const details = await ContentDetails.find({ content: content._id }).sort({
    langKey: 1,
  });
  res.json({ ...content.toObject(), details });
}

export async function createContent(req, res) {
  const { application, details, categories = [], tags = [] } = req.body;

  if (!application)
    return res.status(400).json({ message: "application is required" });
  if (!userCanAccessApplication(req.user, application)) {
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
  // Assigning categories/tags is admin-only, same as their own endpoints.
  if ((categories.length > 0 || tags.length > 0) && !userIsAppAdmin(req.user, application)) {
    return res.status(403).json({
      message: "Only a SuperAdmin or WebSite Admin can assign categories or tags to content",
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
      !userIsAppAdmin(req.user, application)
    ) {
      return res.status(403).json({
        message: "Only a SuperAdmin or WebSite Admin can set content status to " + d.status,
      });
    }
    const sectionsCheck = validateSections(d.sections);
    if (!sectionsCheck.valid) {
      return res.status(400).json({ message: sectionsCheck.message });
    }
  }

  const content = await Content.create({ application, categories, tags });

  try {
    // create() (not insertMany) so the pre('save') hook stamps publishedAt when created as published.
    const created = await Promise.all(
      details.map(async (d) => {
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
    await content.populate("categories", "title parentId");
    await content.populate("tags", "title");
    res.status(201).json({ ...content.toObject(), details: created });
  } catch (err) {
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

// Parent-level fields only — categories/tags today. Per-language fields (title,
// metadata, status, ...) go through upsertContentDetails instead. Assigning
// categories/tags is admin-only, same as their own endpoints.
export async function updateContent(req, res) {
  const { categories, tags } = req.body;

  const content = await Content.findById(req.params.id);
  if (!content) return res.status(404).json({ message: "Content not found" });
  if (!userIsAppAdmin(req.user, content.application)) {
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

  await content.save();
  await content.populate("categories", "title parentId");
  await content.populate("tags", "title");
  res.json(content);
}

export async function deleteContent(req, res) {
  const content = await Content.findById(req.params.id);
  if (!content) return res.status(404).json({ message: "Content not found" });
  if (!userIsAppAdmin(req.user, content.application)) {
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

export async function upsertContentDetails(req, res) {
  const { id, langKey } = req.params;
  const { title, slug, headline, abstract, status, metadata, sections } = req.body;

  if (status !== undefined && !isValidStatus(status)) {
    return res
      .status(400)
      .json({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` });
  }
  const sectionsCheck = validateSections(sections);
  if (!sectionsCheck.valid) {
    return res.status(400).json({ message: sectionsCheck.message });
  }

  const content = await Content.findById(id);
  if (!content) return res.status(404).json({ message: "Content not found" });
  if (!userCanAccessApplication(req.user, content.application)) {
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
  let detail = await ContentDetails.findOne({ content: id, langKey, isDeleted: { $in: [true, false] } });
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
    !userIsAppAdmin(req.user, content.application)
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
  } catch (err) {
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

export async function deleteContentDetails(req, res) {
  const { id, langKey } = req.params;

  const content = await Content.findById(id);
  if (!content) return res.status(404).json({ message: "Content not found" });
  if (!userIsAppAdmin(req.user, content.application)) {
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
// Returns an absolute URL (not a relative /storage path) since image/link/video
// elements are validated against ^https?:// and, more importantly, so any
// consuming frontend (a public site on a different domain than this API) can
// use the URL as-is with no extra base-URL configuration of its own.
export async function uploadContentImage(req, res) {
  const { application } = req.body;
  if (!application)
    return res.status(400).json({ message: "application is required" });
  if (!userCanAccessApplication(req.user, application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  if (!req.file)
    return res.status(400).json({ message: "image is required" });

  const relativePath = await saveContentImage(req.file.buffer, req.file.mimetype);
  const url = `${req.protocol}://${req.get("host")}${relativePath}`;
  res.status(201).json({ url });
}
