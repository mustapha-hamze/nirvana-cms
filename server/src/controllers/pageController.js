import Page from "../models/page/Page.js";
import PageDetails from "../models/page/PageDetails.js";
import Application from "../models/application/Application.js";
import ApplicationSetting from "../models/application/ApplicationSetting.js";
import { userCanAccessApplication, userIsAppAdmin } from "../middleware/auth.js";
import { LANGUAGE_VALUES } from "../constants/languages.js";
import { PAGE_SECTION_TYPE_VALUES, PAGE_SECTION_LAYOUTS } from "../constants/pageSectionTypes.js";
import { slugify } from "../utils/slugify.js";

const STATUS_VALUES = PageDetails.schema.path("status").enumValues;

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
// collision — same behavior as content slugs. Checks soft-deleted rows too:
// they still occupy the unique index.
async function findAvailableSlug({ application, langKey, baseSlug }) {
  let slug = baseSlug;
  let suffix = 2;
  while (
    await PageDetails.exists({
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
// `type` is a known page section and its `elements` are all the one element
// type that section holds, within that type's min/max count (see
// PAGE_SECTION_LAYOUTS). Per-field checks (maxlength/enum/etc.) are
// intentionally NOT duplicated here — the schema's own discriminators already
// enforce those and surface as a Mongoose ValidationError on .save().
function validatePageSections(sections) {
  if (sections === undefined) return { valid: true };
  if (!Array.isArray(sections)) {
    return { valid: false, message: "sections must be an array" };
  }
  if (sections.length > 40) {
    return { valid: false, message: "A page may have at most 40 sections" };
  }
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const layout = PAGE_SECTION_LAYOUTS[section?.type];
    if (!layout) {
      return {
        valid: false,
        message: `sections[${i}]: type must be one of: ${PAGE_SECTION_TYPE_VALUES.join(", ")}`,
      };
    }
    const elements = Array.isArray(section.elements) ? section.elements : [];
    if (elements.length < layout.min || elements.length > layout.max) {
      const range = layout.min === layout.max ? `exactly ${layout.min}` : `between ${layout.min} and ${layout.max}`;
      return {
        valid: false,
        message: `sections[${i}] (${section.type}) must contain ${range} element(s)`,
      };
    }
    const wrongType = elements.find((el) => el?.elementType !== layout.elementType);
    if (wrongType) {
      return {
        valid: false,
        message: `sections[${i}] (${section.type}): every element must be of type "${layout.elementType}"`,
      };
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

// Demotes whatever page currently holds `isHomepage` for this application (if
// any, and if it isn't `keepId` itself) so the partial unique index never
// sees two `true` rows at once. Called before setting a new homepage, not
// wrapped in a transaction — this is an admin-only, low-frequency action and
// Mongo's index would reject a genuine race anyway.
async function demoteExistingHomepage(application, keepId) {
  await Page.updateMany(
    { application, isHomepage: true, _id: { $ne: keepId } },
    { isHomepage: false },
  );
}

async function attachDetails(pages, { langKey, status } = {}) {
  const pageIds = pages.map((p) => p._id);
  const filter = { page: { $in: pageIds } };
  if (langKey) filter.langKey = langKey;
  if (status) filter.status = status;

  const details = await PageDetails.find(filter).sort({ langKey: 1 });

  const byPageId = new Map();
  for (const detail of details) {
    const key = detail.page.toString();
    if (!byPageId.has(key)) byPageId.set(key, []);
    byPageId.get(key).push(detail);
  }

  return pages.map((p) => ({
    ...p.toObject(),
    details: byPageId.get(p._id.toString()) ?? [],
  }));
}

export async function getPages(req, res) {
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
      .json({ message: `langKey must be one of: ${LANGUAGE_VALUES.join(", ")}` });
  }

  const filter = { application };
  // status/langKey live on PageDetails, so resolve matching Page ids first.
  if (status || langKey) {
    const detailFilter = {};
    if (status) detailFilter.status = status;
    if (langKey) detailFilter.langKey = langKey;
    filter._id = { $in: await PageDetails.find(detailFilter).distinct("page") };
  }

  const pages = await Page.find(filter).sort({ isHomepage: -1, createdAt: 1 });
  res.json(await attachDetails(pages, { langKey, status }));
}

export async function getPage(req, res) {
  const page = await Page.findById(req.params.id);
  if (!page) return res.status(404).json({ message: "Page not found" });
  if (!userCanAccessApplication(req.user, page.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  const details = await PageDetails.find({ page: page._id }).sort({ langKey: 1 });
  res.json({ ...page.toObject(), details });
}

export async function createPage(req, res) {
  const { application, isHomepage, details } = req.body;

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
  if (isHomepage && !userIsAppAdmin(req.user, application)) {
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
    if (d.status !== undefined && d.status !== "draft" && !userIsAppAdmin(req.user, application)) {
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
      details.map(async (d) => {
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
  } catch (err) {
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
export async function updatePage(req, res) {
  const { isHomepage } = req.body;

  const page = await Page.findById(req.params.id);
  if (!page) return res.status(404).json({ message: "Page not found" });
  if (!userIsAppAdmin(req.user, page.application)) {
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

export async function deletePage(req, res) {
  const page = await Page.findById(req.params.id);
  if (!page) return res.status(404).json({ message: "Page not found" });
  if (!userIsAppAdmin(req.user, page.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  page.isDeleted = true;
  await page.save();
  await PageDetails.updateMany({ page: page._id }, { isDeleted: true });

  res.status(204).send();
}

export async function upsertPageDetails(req, res) {
  const { id, langKey } = req.params;
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
  if (!userCanAccessApplication(req.user, page.application)) {
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
  let detail = await PageDetails.findOne({ page: id, langKey, isDeleted: { $in: [true, false] } });
  const isNew = !detail;
  const currentStatus = isNew || detail.isDeleted ? "draft" : detail.status;
  if (isNew) {
    detail = new PageDetails({ page: id, application: page.application, langKey });
  } else if (detail.isDeleted) {
    detail.isDeleted = false;
  }

  // Actually changing status (draft <-> published) is an app-admin action; a plain
  // staff/content-creator can still edit title/sections on this translation.
  if (status !== undefined && status !== currentStatus && !userIsAppAdmin(req.user, page.application)) {
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
  } catch (err) {
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

export async function deletePageDetails(req, res) {
  const { id, langKey } = req.params;

  const page = await Page.findById(id);
  if (!page) return res.status(404).json({ message: "Page not found" });
  if (!userIsAppAdmin(req.user, page.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  const detail = await PageDetails.findOneAndUpdate(
    { page: id, langKey },
    { isDeleted: true },
  );
  if (!detail) return res.status(404).json({ message: "Translation not found" });

  res.status(204).send();
}
