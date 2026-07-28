import Category from "../models/Category.js";
import Tag from "../models/Tag.js";

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
