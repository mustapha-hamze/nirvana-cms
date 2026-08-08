import type { Request, Response } from "express";
import Category from "../models/Category.js";
import Tag from "../models/Tag.js";
import Author from "../models/Author.js";
import Content from "../models/content/Content.js";
import ContentDetails from "../models/content/ContentDetails.js";
import Page from "../models/page/Page.js";
import PageDetails from "../models/page/PageDetails.js";
import { LANGUAGE_VALUES } from "../constants/languages.js";
import { paginateList, SORT_ORDER_VALUES } from "../utils/paginateList.js";
import {
  shapeTaxonomyRef,
  shapeCategory,
  shapeContent,
  shapePage,
  shapeAuthorRef,
  shapeAuthorProfile,
} from "../services/frontendShapeService.js";
import { resolveCategoryRef, resolveTagRef, resolveAuthorRef } from "../services/taxonomyResolverService.js";

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
const EMPTY_PAGE = (limit: unknown) => ({ items: [], total: 0, page: 1, limit: Number(limit) || 20, totalPages: 1 });

// ── Settings ─────────────────────────────────────────────────────────────────

// Public subset of ApplicationSetting — notably excludes aiApiKey, which is
// `select: false` on the schema and never selected here, so it can't leak
// even if this handler is ever touched carelessly.
export async function getFrontendSettings(req: Request, res: Response) {
  const { frontendApp: application, frontendSettings: settings } = req;
  res.json({
    name: application!.name,
    logo: application!.logo,
    languages: settings?.languages?.length ? settings.languages : LANGUAGE_VALUES,
    domain: settings?.domain ?? "",
    googleAnalyticsScript: settings?.googleAnalyticsScript ?? "",
  });
}

// ── Categories ───────────────────────────────────────────────────────────────

export async function getFrontendCategories(req: Request, res: Response) {
  const { parentId } = req.query;
  const filter: Record<string, unknown> = { application: req.frontendApp!._id, status: "active" };
  if (parentId !== undefined) filter.parentId = parentId === "null" || parentId === "" ? null : parentId;

  const categories = await Category.find(filter).sort({ createdAt: 1 });
  // Parent references point at the Mongo _id — remapped to the parent's own
  // publicId here so the response never needs to expose a raw _id at all.
  const publicIdByMongoId = new Map(categories.map((c) => [c._id.toString(), c.publicId]));
  res.json(categories.map((c) => shapeCategory(c, req.langKey!, publicIdByMongoId)));
}

// ── Tags ─────────────────────────────────────────────────────────────────────

export async function getFrontendTags(req: Request, res: Response) {
  const tags = await Tag.find({ application: req.frontendApp!._id, status: "active" }).sort({ createdAt: 1 });
  res.json(tags.map((t) => shapeTaxonomyRef(t, req.langKey!)));
}

// ── Authors ──────────────────────────────────────────────────────────────────

export async function getFrontendAuthors(req: Request, res: Response) {
  const authors = await Author.find({ application: req.frontendApp!._id, status: "active" }).sort({ createdAt: 1 });
  res.json(authors.map((a) => shapeAuthorRef(a, req.langKey!)));
}

export async function getFrontendAuthor(req: Request, res: Response) {
  const { idOrSlug } = req.params as { idOrSlug: string };
  const applicationId = req.frontendApp!._id;

  const author = await Author.findOne({
    application: applicationId,
    status: "active",
    $or: [{ publicId: idOrSlug }, { slug: idOrSlug }],
  });
  if (!author) return res.status(404).json({ message: "Author not found" });

  res.json(shapeAuthorProfile(author, req.langKey!));
}

export async function getFrontendAuthorContents(req: Request, res: Response) {
  const { idOrSlug } = req.params as { idOrSlug: string };
  const { page, limit, sortBy, sortOrder } = req.query;
  const applicationId = req.frontendApp!._id;
  const langKey = req.langKey!;

  if (sortBy && !CONTENT_SORT_BY_VALUES.includes(sortBy as string)) {
    return res.status(400).json({ message: `sortBy must be one of: ${CONTENT_SORT_BY_VALUES.join(", ")}` });
  }
  if (sortOrder && !(SORT_ORDER_VALUES as readonly string[]).includes(sortOrder as string)) {
    return res.status(400).json({ message: `sortOrder must be one of: ${SORT_ORDER_VALUES.join(", ")}` });
  }

  const author = await resolveAuthorRef(applicationId, idOrSlug);
  if (!author) return res.status(404).json({ message: "Author not found" });

  res.json(
    await queryPublishedContents(applicationId, langKey, { author: author._id }, { page, limit, sortBy, sortOrder }),
  );
}

// ── Contents ─────────────────────────────────────────────────────────────────

// Shared by getFrontendContents and getFrontendAuthorContents — both list
// published Content in a resolved language, filtered by an already-resolved
// Mongo filter, shaped and paginated the same way. Mirrors the
// Content/Page controller pair's "extend the shared helper" convention (see
// CLAUDE.md).
async function queryPublishedContents(
  applicationId: any,
  langKey: string,
  contentFilter: Record<string, unknown>,
  { page, limit, sortBy, sortOrder }: { page?: unknown; limit?: unknown; sortBy?: unknown; sortOrder?: unknown },
) {
  // Start from ContentDetails (indexed on application+langKey, and small once
  // scoped to "published") rather than from Content — a taxonomy-unfiltered
  // list would otherwise populate() every Content item in the application,
  // including drafts and translations that don't even exist in this
  // language, just to throw most of them away below.
  const details = await ContentDetails.find({ application: applicationId, langKey, status: "published" });
  const detailByContentId = new Map(details.map((d) => [d.content.toString(), d]));

  const contents = await Content.find({ ...contentFilter, application: applicationId, _id: { $in: [...detailByContentId.keys()] } })
    .populate("categories", "publicId translations status parentId")
    .populate("tags", "publicId translations status")
    .populate("author", "publicId slug displayName avatar jobTitle websiteUrl translations status");

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
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return paginateList(shaped, {
    idOf: (c: any) => c.id.toString(),
    titleOf: (c: any) => c.title,
    // paginateList only special-cases sortBy === "title"; anything else
    // (including our "publishedAt") falls through to createdAtOf below.
    createdAtOf: (c: any) => c.publishedAt,
    sortBy: sortBy as any,
    sortOrder: sortOrder as any,
    page,
    limit,
  });
}

export async function getFrontendContents(req: Request, res: Response) {
  const { category, tag, author, page, limit, sortBy, sortOrder } = req.query;
  const applicationId = req.frontendApp!._id;
  const langKey = req.langKey!;

  if (sortBy && !CONTENT_SORT_BY_VALUES.includes(sortBy as string)) {
    return res.status(400).json({ message: `sortBy must be one of: ${CONTENT_SORT_BY_VALUES.join(", ")}` });
  }
  if (sortOrder && !(SORT_ORDER_VALUES as readonly string[]).includes(sortOrder as string)) {
    return res.status(400).json({ message: `sortOrder must be one of: ${SORT_ORDER_VALUES.join(", ")}` });
  }

  const contentFilter: Record<string, unknown> = {};

  if (category !== undefined) {
    const categoryDoc = await resolveCategoryRef(applicationId, category as string, langKey);
    if (!categoryDoc) return res.json(EMPTY_PAGE(limit));
    contentFilter.categories = categoryDoc._id;
  }
  if (tag !== undefined) {
    const tagDoc = await resolveTagRef(applicationId, tag as string, langKey);
    if (!tagDoc) return res.json(EMPTY_PAGE(limit));
    contentFilter.tags = tagDoc._id;
  }
  if (author !== undefined) {
    const authorDoc = await resolveAuthorRef(applicationId, author as string);
    if (!authorDoc) return res.json(EMPTY_PAGE(limit));
    contentFilter.author = authorDoc._id;
  }

  res.json(await queryPublishedContents(applicationId, langKey, contentFilter, { page, limit, sortBy, sortOrder }));
}

export async function getFrontendContent(req: Request, res: Response) {
  const { idOrSlug } = req.params as { idOrSlug: string };
  const applicationId = req.frontendApp!._id;
  const langKey = req.langKey!;

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

export async function getFrontendPages(req: Request, res: Response) {
  const applicationId = req.frontendApp!._id;
  const langKey = req.langKey!;

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
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  res.json(shaped);
}

export async function getFrontendPage(req: Request, res: Response) {
  const { idOrSlug } = req.params as { idOrSlug: string };
  const applicationId = req.frontendApp!._id;
  const langKey = req.langKey!;

  const detail = OBJECT_ID_RE.test(idOrSlug)
    ? await PageDetails.findOne({ page: idOrSlug, application: applicationId, langKey, status: "published" })
    : await PageDetails.findOne({ application: applicationId, langKey, slug: idOrSlug, status: "published" });
  if (!detail) return res.status(404).json({ message: "Page not found" });

  const page = await Page.findOne({ _id: detail.page, application: applicationId });
  if (!page) return res.status(404).json({ message: "Page not found" });

  res.json(shapePage(page, detail, { detail: true }));
}
