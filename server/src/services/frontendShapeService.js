import { LANGUAGE_VALUES } from "../constants/languages.js";

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
export function shapeTaxonomyRef(item, langKey) {
  const translation = pickTranslation(item.translations, langKey);
  return { publicId: item.publicId, title: translation?.title ?? "", slug: translation?.slug ?? "" };
}

export function shapeCategory(category, langKey, publicIdByMongoId) {
  return {
    ...shapeTaxonomyRef(category, langKey),
    parentPublicId: category.parentId ? (publicIdByMongoId.get(category.parentId.toString()) ?? null) : null,
  };
}

export function shapeContent(content, detail, langKey, { detail: includeDetail = false } = {}) {
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

export function shapePage(page, detail, { detail: includeDetail = false } = {}) {
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
