import type { Request, Response } from "express";
import Category from "../models/Category.js";
import Tag from "../models/Tag.js";
import Author from "../models/Author.js";
import Content from "../models/content/Content.js";
import ContentDetails from "../models/content/ContentDetails.js";
import Page from "../models/page/Page.js";
import PageDetails from "../models/page/PageDetails.js";
import Menu, { type MenuDoc } from "../models/menu/Menu.js";
import MenuCategory from "../models/menu/MenuCategory.js";
import MenuItem from "../models/menu/MenuItem.js";
import { LANGUAGE_VALUES } from "../constants/languages.js";
import { paginateList, normalizePaging, SORT_ORDER_VALUES } from "../utils/paginateList.js";
import {
  shapeTaxonomyRef,
  shapeCategory,
  shapeContent,
  shapePage,
  shapeAuthorRef,
  shapeAuthorProfile,
  shapeMenuCategory,
  shapeMenuItem,
} from "../services/frontendShapeService.js";
import {
  resolveCategoryRef,
  resolveTagRef,
  resolveAuthorRef,
  resolveMenuRef,
  resolveMenuCategoryRef,
} from "../services/taxonomyResolverService.js";

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

// ── Menu ─────────────────────────────────────────────────────────────────────

// Menu items/categories have no independent per-language publish state (see
// Menu model comments), so like Category/Tag/Author this whole section uses
// pickTranslation's base-language fallback convention (via shapeMenuCategory/
// shapeMenuItem), not Content/Page's strict "missing translation = doesn't
// exist" rule.

// A QR code encodes a menu's slug directly, so most real requests already
// pass ?menu=; this only matters for exploratory/general-purpose calls
// against the API without one. Ambiguous rather than picking silently, so a
// caller relying on "the app's only menu" finds out immediately when that
// stops being true instead of quietly hitting the wrong one.
async function resolveRequestedMenu(
  applicationId: any,
  menuRef: unknown,
): Promise<{ menu: MenuDoc } | { error: { status: number; message: string } }> {
  if (menuRef) {
    const menu = await resolveMenuRef(applicationId, menuRef as string);
    if (!menu) return { error: { status: 404, message: "Menu not found" } };
    return { menu };
  }
  const activeMenus = await Menu.find({ application: applicationId, status: "active" });
  if (activeMenus.length === 0) return { error: { status: 404, message: "Menu not found" } };
  if (activeMenus.length > 1) {
    return {
      error: {
        status: 400,
        message: "menu is required when an application has more than one active menu",
      },
    };
  }
  return { menu: activeMenus[0] };
}

// Shared by every menu endpoint below: active items only, plus dropping
// unavailable/sold-out items unless the menu opts in to showing them.
function buildActiveItemFilter(applicationId: any, menu: MenuDoc, extra: Record<string, unknown> = {}) {
  const filter: Record<string, unknown> = {
    application: applicationId,
    menu: menu._id,
    status: "active",
    ...extra,
  };
  if (!menu.settings.showUnavailableItems) filter.availability = "available";
  return filter;
}

export async function getFrontendMenu(req: Request, res: Response) {
  const { menu: menuRef } = req.query;
  const applicationId = req.frontendApp!._id;
  const langKey = req.langKey!;

  const resolved = await resolveRequestedMenu(applicationId, menuRef);
  if ("error" in resolved) return res.status(resolved.error.status).json({ message: resolved.error.message });
  const menu = resolved.menu;

  const categories = await MenuCategory.find({ application: applicationId, menu: menu._id, status: "active" }).sort({
    sortOrder: 1,
    createdAt: 1,
  });
  const items = await MenuItem.find(
    buildActiveItemFilter(applicationId, menu, { category: { $in: categories.map((c) => c._id) } }),
  ).sort({ sortOrder: 1, createdAt: 1 });

  const itemsByCategory = new Map<string, unknown[]>();
  for (const item of items) {
    const key = item.category.toString();
    if (!itemsByCategory.has(key)) itemsByCategory.set(key, []);
    itemsByCategory.get(key)!.push(shapeMenuItem(item, langKey, menu.settings));
  }

  res.json({
    menu: { publicId: menu.publicId, slug: menu.slug, currency: menu.currency, settings: menu.settings },
    categories: categories.map((category) => ({
      ...shapeMenuCategory(category, langKey, menu.settings),
      items: itemsByCategory.get(category._id.toString()) ?? [],
    })),
  });
}

export async function getFrontendMenuCategories(req: Request, res: Response) {
  const { menu: menuRef } = req.query;
  const applicationId = req.frontendApp!._id;
  const langKey = req.langKey!;

  const resolved = await resolveRequestedMenu(applicationId, menuRef);
  if ("error" in resolved) return res.status(resolved.error.status).json({ message: resolved.error.message });
  const menu = resolved.menu;

  const categories = await MenuCategory.find({ application: applicationId, menu: menu._id, status: "active" }).sort({
    sortOrder: 1,
    createdAt: 1,
  });
  res.json(categories.map((category) => shapeMenuCategory(category, langKey, menu.settings)));
}

export async function getFrontendMenuCategory(req: Request, res: Response) {
  const { slugOrPublicId } = req.params as { slugOrPublicId: string };
  const { menu: menuRef } = req.query;
  const applicationId = req.frontendApp!._id;
  const langKey = req.langKey!;

  const resolved = await resolveRequestedMenu(applicationId, menuRef);
  if ("error" in resolved) return res.status(resolved.error.status).json({ message: resolved.error.message });
  const menu = resolved.menu;

  const category = await resolveMenuCategoryRef(applicationId, menu._id, slugOrPublicId, langKey);
  if (!category) return res.status(404).json({ message: "Menu category not found" });

  const items = await MenuItem.find(buildActiveItemFilter(applicationId, menu, { category: category._id })).sort({
    sortOrder: 1,
    createdAt: 1,
  });

  res.json({
    ...shapeMenuCategory(category, langKey, menu.settings),
    items: items.map((item) => shapeMenuItem(item, langKey, menu.settings)),
  });
}

export async function getFrontendMenuItems(req: Request, res: Response) {
  const { menu: menuRef, category: categoryRef, page, limit } = req.query;
  const applicationId = req.frontendApp!._id;
  const langKey = req.langKey!;

  const resolved = await resolveRequestedMenu(applicationId, menuRef);
  if ("error" in resolved) return res.status(resolved.error.status).json({ message: resolved.error.message });
  const menu = resolved.menu;

  const extra: Record<string, unknown> = {};
  if (categoryRef !== undefined) {
    const category = await resolveMenuCategoryRef(applicationId, menu._id, categoryRef as string, langKey);
    if (!category) return res.json({ items: [], total: 0, page: 1, limit: Number(limit) || 20, totalPages: 1 });
    extra.category = category._id;
  }

  // Items are already in display order from the DB (sortOrder, then
  // createdAt) — pagination is applied directly rather than through
  // paginateList, which would otherwise re-sort by createdAt (its only
  // built-in sort key) and lose that ordering.
  const items = await MenuItem.find(buildActiveItemFilter(applicationId, menu, extra)).sort({
    sortOrder: 1,
    createdAt: 1,
  });
  const shaped = items.map((item) => shapeMenuItem(item, langKey, menu.settings));

  const { page: effectivePage, limit: effectiveLimit } = normalizePaging(page, limit);
  const total = shaped.length;
  const start = (effectivePage - 1) * effectiveLimit;
  res.json({
    items: shaped.slice(start, start + effectiveLimit),
    total,
    page: effectivePage,
    limit: effectiveLimit,
    totalPages: Math.max(1, Math.ceil(total / effectiveLimit)),
  });
}
