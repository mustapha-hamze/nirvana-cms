import { LANGUAGE_VALUES } from "../constants/languages.js";

interface Translation {
  langKey: string;
  title: string;
  slug: string;
}

// Picks the translation/detail matching the resolved language, falling back
// to whichever language comes first in LANGUAGE_VALUES order — same
// fallback convention as utils/previewTitle.js's getPreviewTitle, but
// returning the whole matched object (title + slug) rather than just a title.
function pickTranslation<T extends { langKey: string }>(items: T[], langKey: string): T | null {
  return (
    items.find((t) => t.langKey === langKey) ??
    LANGUAGE_VALUES.map((l) => items.find((t) => t.langKey === l)).find(Boolean) ??
    null
  );
}

// Shared shape for a Tag, or a Category referenced from a Content item —
// {publicId, title, slug} is all either needs once we're not building the
// category tree itself (see shapeCategory for that).
export function shapeTaxonomyRef(item: { publicId: string; translations: Translation[] }, langKey: string) {
  const translation = pickTranslation(item.translations, langKey);
  return { publicId: item.publicId, title: translation?.title ?? "", slug: translation?.slug ?? "" };
}

interface AuthorTranslation {
  langKey: string;
  bio: string;
}

interface AuthorLike {
  publicId: string;
  slug: string;
  displayName: string;
  avatar: string;
  jobTitle: string;
  websiteUrl: string;
  translations: AuthorTranslation[];
}

// Public byline shape embedded in a shaped Content item, or returned by the
// author list/profile endpoints — deliberately excludes admin-only fields
// (email, firstName/lastName, status) that the public API has no reason to
// leak.
export function shapeAuthorRef(author: AuthorLike, langKey: string) {
  const translation = pickTranslation(author.translations ?? [], langKey);
  return {
    publicId: author.publicId,
    slug: author.slug,
    displayName: author.displayName,
    avatar: author.avatar || null,
    jobTitle: author.jobTitle || "",
    bio: translation?.bio ?? "",
    websiteUrl: author.websiteUrl || "",
  };
}

// Fuller shape for the standalone author profile endpoint — adds social
// links, which a content item's embedded byline doesn't need.
export function shapeAuthorProfile(
  author: AuthorLike & { socialLinks?: { linkedin?: string; x?: string; instagram?: string } },
  langKey: string,
) {
  return {
    ...shapeAuthorRef(author, langKey),
    socialLinks: {
      linkedin: author.socialLinks?.linkedin || "",
      x: author.socialLinks?.x || "",
      instagram: author.socialLinks?.instagram || "",
    },
  };
}

export function shapeCategory(
  category: { publicId: string; translations: Translation[]; parentId: unknown },
  langKey: string,
  publicIdByMongoId: Map<string, string>,
) {
  return {
    ...shapeTaxonomyRef(category, langKey),
    parentPublicId: category.parentId
      ? (publicIdByMongoId.get((category.parentId as { toString(): string }).toString()) ?? null)
      : null,
  };
}

export function shapeContent(
  content: any,
  detail: any,
  langKey: string,
  { detail: includeDetail = false }: { detail?: boolean } = {},
) {
  const shaped: Record<string, unknown> = {
    id: content._id,
    slug: detail.slug,
    title: detail.title,
    headline: detail.headline,
    abstract: detail.abstract,
    publishedAt: detail.publishedAt,
    categories: (content.categories ?? [])
      .filter((c: any) => c.status === "active")
      .map((c: any) => shapeTaxonomyRef(c, langKey)),
    tags: (content.tags ?? []).filter((t: any) => t.status === "active").map((t: any) => shapeTaxonomyRef(t, langKey)),
    // An inactive (or soft-deleted, which never survives populate() at all —
    // see softDeletePlugin) author is hidden entirely rather than shown as a
    // minimal/non-clickable byline — a simpler, unambiguous contract for
    // frontend consumers than two different "author present" shapes.
    author: content.author && content.author.status === "active" ? shapeAuthorRef(content.author, langKey) : null,
  };
  if (includeDetail) {
    shaped.metadata = detail.metadata;
    shaped.sections = detail.sections;
  }
  return shaped;
}

export function shapePage(
  page: any,
  detail: any,
  { detail: includeDetail = false }: { detail?: boolean } = {},
) {
  const shaped: Record<string, unknown> = {
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
    shaped.sections = (detail.sections ?? []).filter((s: any) => s.isVisible !== false);
  }
  return shaped;
}
