import Application from "../models/application/Application.js";
import ApplicationSetting from "../models/application/ApplicationSetting.js";
import Category from "../models/Category.js";
import Tag from "../models/Tag.js";
import Content from "../models/content/Content.js";
import ContentDetails from "../models/content/ContentDetails.js";
import Page from "../models/page/Page.js";
import PageDetails from "../models/page/PageDetails.js";
import { LANGUAGE_VALUES } from "../constants/languages.js";
import { paginateList, SORT_ORDER_VALUES } from "../utils/paginateList.js";

// "publishedAt", not admin's "createdAt" — a public listing's natural default
// date sort is when something went live, not when the draft was first created.
const CONTENT_SORT_BY_VALUES = ["title", "publishedAt"];

// Everything in this controller is read-only and served to the public
// website of an application — there's no logged-in user on that side, so
// unlike every other controller here, none of this sits behind `authenticate`.
// Identity instead comes from the application's own `appKey` (see
// resolveFrontendApp), the same way a Content Delivery API key scopes a
// request in headless CMSes generally.

const OBJECT_ID_RE = /^[0-9a-f]{24}$/i;
const EMPTY_PAGE = (limit) => ({ items: [], total: 0, page: 1, limit: Number(limit) || 20, totalPages: 1 });

// ── App/language resolution ─────────────────────────────────────────────────

// Resolves `req.frontendApp`/`req.frontendSettings`/`req.langKey` from
// `?appKey=` (or an `x-app-key` header) + `?lang=`, shared by every route
// below. An inactive application 404s exactly like a nonexistent one — the
// public site has no business distinguishing "disabled" from "never existed".
export async function resolveFrontendApp(req, res, next) {
  const appKey = req.query.appKey || req.headers["x-app-key"];
  if (!appKey) return res.status(400).json({ message: "appKey is required" });

  const application = await Application.findOne({ appKey, status: "active" });
  if (!application) return res.status(404).json({ message: "Application not found" });

  const settings = await ApplicationSetting.findOne({ application: application._id }).select(
    "domain googleAnalyticsScript languages",
  );
  const allowedLanguages = settings?.languages?.length ? settings.languages : LANGUAGE_VALUES;

  const { lang } = req.query;
  if (lang && !allowedLanguages.includes(lang)) {
    return res.status(400).json({ message: `lang must be one of: ${allowedLanguages.join(", ")}` });
  }

  req.frontendApp = application;
  req.frontendSettings = settings;
  req.langKey = lang || allowedLanguages[0];
  next();
}

// ── Shaping helpers ──────────────────────────────────────────────────────────

// Picks the translation/detail matching the resolved language, falling back
// to whichever language comes first in LANGUAGE_VALUES order — same
// fallback convention as utils/previewTitle.js's getPreviewTitle, but
// returning the whole matched object (title + slug) rather than just a title.
function pickTranslation(items, langKey) {
  return (
    items.find((t) => t.langKey === langKey) ??
    LANGUAGE_VALUES.map((l) => items.find((t) => t.langKey === l)).find(Boolean) ??
    null
  );
}

// Shared shape for a Tag, or a Category referenced from a Content item —
// {publicId, title, slug} is all either needs once we're not building the
// category tree itself (see shapeCategory for that).
function shapeTaxonomyRef(item, langKey) {
  const translation = pickTranslation(item.translations, langKey);
  return { publicId: item.publicId, title: translation?.title ?? "", slug: translation?.slug ?? "" };
}

function shapeCategory(category, langKey, publicIdByMongoId) {
  return {
    ...shapeTaxonomyRef(category, langKey),
    parentPublicId: category.parentId ? (publicIdByMongoId.get(category.parentId.toString()) ?? null) : null,
  };
}

function shapeContent(content, detail, langKey, { detail: includeDetail = false } = {}) {
  const shaped = {
    id: content._id,
    slug: detail.slug,
    title: detail.title,
    headline: detail.headline,
    abstract: detail.abstract,
    publishedAt: detail.publishedAt,
    categories: (content.categories ?? [])
      .filter((c) => c.status === "active")
      .map((c) => shapeTaxonomyRef(c, langKey)),
    tags: (content.tags ?? []).filter((t) => t.status === "active").map((t) => shapeTaxonomyRef(t, langKey)),
  };
  if (includeDetail) {
    shaped.metadata = detail.metadata;
    shaped.sections = detail.sections;
  }
  return shaped;
}

function shapePage(page, detail, { detail: includeDetail = false } = {}) {
  const shaped = {
    id: page._id,
    slug: detail.slug,
    title: detail.title,
    isHomepage: page.isHomepage,
    publishedAt: detail.publishedAt,
  };
  if (includeDetail) {
    shaped.metadata = detail.metadata;
    // The admin API (pageController) returns every section, including ones
    // an editor has hidden as a draft — but this is the public content
    // delivery surface, so anything not meant to render on the live site is
    // filtered out here rather than leaving that up to every frontend
    // consumer to remember. `!== false` (not `=== true`) so a section saved
    // before `isVisible` existed defaults to visible.
    shaped.sections = (detail.sections ?? []).filter((s) => s.isVisible !== false);
  }
  return shaped;
}

// ── Category/tag ref resolution ─────────────────────────────────────────────
// Accepts either a Category/Tag's publicId or its per-language slug, so the
// frontend can link to a category/tag page however it wants — a stable
// publicId, or a pretty per-language slug — and filter content by the same value.

function resolveCategoryRef(applicationId, ref, langKey) {
  if (!ref) return null;
  return Category.findOne({
    application: applicationId,
    status: "active",
    $or: [{ publicId: ref }, { translations: { $elemMatch: { langKey, slug: ref } } }],
  });
}

function resolveTagRef(applicationId, ref, langKey) {
  if (!ref) return null;
  return Tag.findOne({
    application: applicationId,
    status: "active",
    $or: [{ publicId: ref }, { translations: { $elemMatch: { langKey, slug: ref } } }],
  });
}

// ── Settings ─────────────────────────────────────────────────────────────────

// Public subset of ApplicationSetting — notably excludes aiApiKey, which is
// `select: false` on the schema and never selected here, so it can't leak
// even if this handler is ever touched carelessly.
export async function getFrontendSettings(req, res) {
  const { frontendApp: application, frontendSettings: settings } = req;
  res.json({
    name: application.name,
    logo: application.logo,
    languages: settings?.languages?.length ? settings.languages : LANGUAGE_VALUES,
    domain: settings?.domain ?? "",
    googleAnalyticsScript: settings?.googleAnalyticsScript ?? "",
  });
}

// ── Categories ───────────────────────────────────────────────────────────────

export async function getFrontendCategories(req, res) {
  const { parentId } = req.query;
  const filter = { application: req.frontendApp._id, status: "active" };
  if (parentId !== undefined) filter.parentId = parentId === "null" || parentId === "" ? null : parentId;

  const categories = await Category.find(filter).sort({ createdAt: 1 });
  // Parent references point at the Mongo _id — remapped to the parent's own
  // publicId here so the response never needs to expose a raw _id at all.
  const publicIdByMongoId = new Map(categories.map((c) => [c._id.toString(), c.publicId]));
  res.json(categories.map((c) => shapeCategory(c, req.langKey, publicIdByMongoId)));
}

// ── Tags ─────────────────────────────────────────────────────────────────────

export async function getFrontendTags(req, res) {
  const tags = await Tag.find({ application: req.frontendApp._id, status: "active" }).sort({ createdAt: 1 });
  res.json(tags.map((t) => shapeTaxonomyRef(t, req.langKey)));
}

// ── Contents ─────────────────────────────────────────────────────────────────

export async function getFrontendContents(req, res) {
  const { category, tag, page, limit, sortBy, sortOrder } = req.query;
  const applicationId = req.frontendApp._id;
  const langKey = req.langKey;

  if (sortBy && !CONTENT_SORT_BY_VALUES.includes(sortBy)) {
    return res.status(400).json({ message: `sortBy must be one of: ${CONTENT_SORT_BY_VALUES.join(", ")}` });
  }
  if (sortOrder && !SORT_ORDER_VALUES.includes(sortOrder)) {
    return res.status(400).json({ message: `sortOrder must be one of: ${SORT_ORDER_VALUES.join(", ")}` });
  }

  const filter = { application: applicationId };

  if (category !== undefined) {
    const categoryDoc = await resolveCategoryRef(applicationId, category, langKey);
    if (!categoryDoc) return res.json(EMPTY_PAGE(limit));
    filter.categories = categoryDoc._id;
  }
  if (tag !== undefined) {
    const tagDoc = await resolveTagRef(applicationId, tag, langKey);
    if (!tagDoc) return res.json(EMPTY_PAGE(limit));
    filter.tags = tagDoc._id;
  }

  const contents = await Content.find(filter)
    .sort({ createdAt: -1 })
    .populate("categories", "publicId translations status parentId")
    .populate("tags", "publicId translations status");

  const details = await ContentDetails.find({
    content: { $in: contents.map((c) => c._id) },
    langKey,
    status: "published",
  });
  const detailByContentId = new Map(details.map((d) => [d.content.toString(), d]));

  // A content item not yet published (or not translated) in the requested
  // language simply doesn't exist from this language's point of view.
  const shaped = contents
    .map((c) => {
      const detail = detailByContentId.get(c._id.toString());
      return detail ? shapeContent(c, detail, langKey) : null;
    })
    .filter(Boolean);

  res.json(
    paginateList(shaped, {
      idOf: (c) => c.id.toString(),
      titleOf: (c) => c.title,
      // paginateList only special-cases sortBy === "title"; anything else
      // (including our "publishedAt") falls through to createdAtOf below.
      createdAtOf: (c) => c.publishedAt,
      sortBy,
      sortOrder,
      page,
      limit,
    }),
  );
}

export async function getFrontendContent(req, res) {
  const { idOrSlug } = req.params;
  const applicationId = req.frontendApp._id;
  const langKey = req.langKey;

  const detail = OBJECT_ID_RE.test(idOrSlug)
    ? await ContentDetails.findOne({ content: idOrSlug, application: applicationId, langKey, status: "published" })
    : await ContentDetails.findOne({ application: applicationId, langKey, slug: idOrSlug, status: "published" });
  if (!detail) return res.status(404).json({ message: "Content not found" });

  const content = await Content.findOne({ _id: detail.content, application: applicationId })
    .populate("categories", "publicId translations status parentId")
    .populate("tags", "publicId translations status");
  if (!content) return res.status(404).json({ message: "Content not found" });

  res.json(shapeContent(content, detail, langKey, { detail: true }));
}

// ── Pages ────────────────────────────────────────────────────────────────────

export async function getFrontendPages(req, res) {
  const applicationId = req.frontendApp._id;
  const langKey = req.langKey;

  const pages = await Page.find({ application: applicationId }).sort({ isHomepage: -1, createdAt: 1 });
  const details = await PageDetails.find({
    page: { $in: pages.map((p) => p._id) },
    langKey,
    status: "published",
  });
  const detailByPageId = new Map(details.map((d) => [d.page.toString(), d]));

  const shaped = pages
    .map((p) => {
      const detail = detailByPageId.get(p._id.toString());
      return detail ? shapePage(p, detail) : null;
    })
    .filter(Boolean);

  res.json(shaped);
}

export async function getFrontendPage(req, res) {
  const { idOrSlug } = req.params;
  const applicationId = req.frontendApp._id;
  const langKey = req.langKey;

  const detail = OBJECT_ID_RE.test(idOrSlug)
    ? await PageDetails.findOne({ page: idOrSlug, application: applicationId, langKey, status: "published" })
    : await PageDetails.findOne({ application: applicationId, langKey, slug: idOrSlug, status: "published" });
  if (!detail) return res.status(404).json({ message: "Page not found" });

  const page = await Page.findOne({ _id: detail.page, application: applicationId });
  if (!page) return res.status(404).json({ message: "Page not found" });

  res.json(shapePage(page, detail, { detail: true }));
}
