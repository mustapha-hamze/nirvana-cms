export const SORT_BY_VALUES = Object.freeze(["title", "createdAt"]);
export const SORT_ORDER_VALUES = Object.freeze(["asc", "desc"]);

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Shared by paginateList below and by any caller doing its own DB-level
// skip/limit (see getContents/getPages) — keeps the page/limit clamping
// rules (and the resulting response envelope's page/limit values) identical
// whether pagination happens in memory or in the query itself.
export function normalizePaging(page, limit) {
  const effectivePage = Math.max(1, Math.trunc(Number(page)) || 1);
  const effectiveLimit = Math.min(MAX_LIMIT, Math.max(1, Math.trunc(Number(limit)) || DEFAULT_LIMIT));
  return { page: effectivePage, limit: effectiveLimit };
}

// Generic search + sort + paginate over an already-fetched array — these
// admin lists are small-scale (an application's own content/pages/tags, not
// a public multi-tenant feed), and "title" isn't a plain top-level DB field
// for Content/Page (it lives per-language on their details) or sortable via a
// simple index for Tag/Category (translations is an array), so doing this
// once in memory here is far simpler than three near-duplicate aggregation
// pipelines — and easy to unit test in isolation.
//
// `idOf`/`titleOf`/`createdAtOf` let each caller adapt its own shape (a
// Content item's `details` array, a Tag's `translations` array, ...) without
// this function knowing about any of them.
export function paginateList(items, { idOf, titleOf, createdAtOf, search, sortBy, sortOrder, page, limit }) {
  const term = (search ?? "").trim().toLowerCase();
  const filtered = term
    ? items.filter((item) => idOf(item).toLowerCase().includes(term) || titleOf(item).toLowerCase().includes(term))
    : items;

  const effectiveSortBy = sortBy || "createdAt";
  // Title defaults to A→Z, creation date defaults to newest-first — whichever
  // reads most naturally for that column when the caller hasn't picked a
  // direction explicitly.
  const effectiveSortOrder = sortOrder || (effectiveSortBy === "title" ? "asc" : "desc");
  const direction = effectiveSortOrder === "asc" ? 1 : -1;

  const sorted = filtered.slice().sort((a, b) => {
    if (effectiveSortBy === "title") {
      return titleOf(a).localeCompare(titleOf(b)) * direction;
    }
    return (new Date(createdAtOf(a)).getTime() - new Date(createdAtOf(b)).getTime()) * direction;
  });

  const { page: effectivePage, limit: effectiveLimit } = normalizePaging(page, limit);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / effectiveLimit));
  const start = (effectivePage - 1) * effectiveLimit;

  return {
    items: sorted.slice(start, start + effectiveLimit),
    total,
    page: effectivePage,
    limit: effectiveLimit,
    totalPages,
  };
}
