import Category from "../models/Category.js";
import Tag from "../models/Tag.js";
import Content from "../models/content/Content.js";
import ContentDetails from "../models/content/ContentDetails.js";
import Page from "../models/page/Page.js";
import PageDetails from "../models/page/PageDetails.js";
import { LANGUAGE_VALUES } from "../constants/languages.js";
import { paginateList, SORT_ORDER_VALUES } from "../utils/paginateList.js";
import { shapeTaxonomyRef, shapeCategory, shapeContent, shapePage } from "../services/frontendShapeService.js";
import { resolveCategoryRef, resolveTagRef } from "../services/taxonomyResolverService.js";

// "publishedAt", not admin's "createdAt" — a public listing's natural default
// date sort is when something went live, not when the draft was first created.
const CONTENT_SORT_BY_VALUES = ["title", "publishedAt"];

// Everything in this controller is read-only and served to the public
// website of an application — there's no logged-in user on that side, so
// unlike every other controller here, none of this sits behind `authenticate`.
// Identity instead comes from the application's own `appKey` (see
// middleware/resolveFrontendApp.js), the same way a Content Delivery API key
// scopes a request in headless CMSes generally.

const OBJECT_ID_RE = /^[0-9a-f]{24}$/i;
const EMPTY_PAGE = (limit) => ({ items: [], total: 0, page: 1, limit: Number(limit) || 20, totalPages: 1 });

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

  const contentFilter = { application: applicationId };

  if (category !== undefined) {
    const categoryDoc = await resolveCategoryRef(applicationId, category, langKey);
    if (!categoryDoc) return res.json(EMPTY_PAGE(limit));
    contentFilter.categories = categoryDoc._id;
  }
  if (tag !== undefined) {
    const tagDoc = await resolveTagRef(applicationId, tag, langKey);
    if (!tagDoc) return res.json(EMPTY_PAGE(limit));
    contentFilter.tags = tagDoc._id;
  }

  // Start from ContentDetails (indexed on application+langKey, and small once
  // scoped to "published") rather than from Content — a taxonomy-unfiltered
  // list would otherwise populate() every Content item in the application,
  // including drafts and translations that don't even exist in this
  // language, just to throw most of them away below.
  const details = await ContentDetails.find({ application: applicationId, langKey, status: "published" });
  const detailByContentId = new Map(details.map((d) => [d.content.toString(), d]));

  const contents = await Content.find({ ...contentFilter, _id: { $in: [...detailByContentId.keys()] } })
    .populate("categories", "publicId translations status parentId")
    .populate("tags", "publicId translations status");

  // A content item not yet published (or not translated) in the requested
  // language simply doesn't exist from this language's point of view. (The
  // detail lookup above already excludes these, but Content.find is
  // re-checked here too since a mismatched _id list would otherwise shape
  // undefined-detail content silently.)
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

  // Start from PageDetails, same rationale as getFrontendContents — a page
  // with no published translation in this language never needs fetching.
  const details = await PageDetails.find({ application: applicationId, langKey, status: "published" });
  const detailByPageId = new Map(details.map((d) => [d.page.toString(), d]));

  const pages = await Page.find({ application: applicationId, _id: { $in: [...detailByPageId.keys()] } }).sort({
    isHomepage: -1,
    createdAt: 1,
  });

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
