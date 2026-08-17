import Category from "../models/Category.js";
import Tag from "../models/Tag.js";
import Author from "../models/Author.js";
import Menu from "../models/menu/Menu.js";
import MenuCategory from "../models/menu/MenuCategory.js";

// Accepts either a Category/Tag's publicId or its per-language slug, so the
// frontend can link to a category/tag page however it wants — a stable
// publicId, or a pretty per-language slug — and filter content by the same value.

export function resolveCategoryRef(applicationId: any, ref: string | undefined | null, langKey: string) {
  if (!ref) return null;
  return Category.findOne({
    application: applicationId,
    status: "active",
    $or: [{ publicId: ref }, { translations: { $elemMatch: { langKey, slug: ref } } }],
  });
}

export function resolveTagRef(applicationId: any, ref: string | undefined | null, langKey: string) {
  if (!ref) return null;
  return Tag.findOne({
    application: applicationId,
    status: "active",
    $or: [{ publicId: ref }, { translations: { $elemMatch: { langKey, slug: ref } } }],
  });
}

// Author's slug isn't per-language (see Author model comment — only bio
// varies by language, not the identity fields), so unlike resolveCategoryRef/
// resolveTagRef this doesn't need a langKey-scoped $elemMatch.
export function resolveAuthorRef(applicationId: any, ref: string | undefined | null) {
  if (!ref) return null;
  return Author.findOne({
    application: applicationId,
    status: "active",
    $or: [{ publicId: ref }, { slug: ref }],
  });
}

// A Menu's slug isn't per-language either (see Menu model comment — the menu
// itself carries no translations at all), so like resolveAuthorRef this is a
// single flat $or, not a langKey-scoped $elemMatch.
export function resolveMenuRef(applicationId: any, ref: string | undefined | null) {
  if (!ref) return null;
  return Menu.findOne({
    application: applicationId,
    status: "active",
    $or: [{ publicId: ref }, { slug: ref }],
  });
}

// MenuCategory's slug *is* per-language (mirrors Category), but is scoped to
// the resolved menu, not the whole application — two different menus can
// each have their own "appetizers".
export function resolveMenuCategoryRef(
  applicationId: any,
  menuId: any,
  ref: string | undefined | null,
  langKey: string,
) {
  if (!ref) return null;
  return MenuCategory.findOne({
    application: applicationId,
    menu: menuId,
    status: "active",
    $or: [{ publicId: ref }, { translations: { $elemMatch: { langKey, slug: ref } } }],
  });
}
