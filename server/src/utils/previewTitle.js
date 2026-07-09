import { LANGUAGE_VALUES } from "../constants/languages.js";

// Picks one title to represent a multi-language item (a Content/Page's
// `details`, a Category/Tag's `translations`) for admin-list search/sort,
// where the viewer's language preference isn't known — prefers languages in
// LANGUAGE_VALUES order, falling back to whatever exists first. Mirrors
// client/src/utils/translations.ts's getPreviewTitle exactly (no shared
// package between client/server in this repo, same existing precedent as
// LANGUAGE_VALUES/SECTION_LAYOUTS duplication).
export function getPreviewTitle(items) {
  for (const lang of LANGUAGE_VALUES) {
    const match = items.find((i) => i.langKey === lang);
    if (match) return match.title;
  }
  return items[0]?.title ?? "";
}
