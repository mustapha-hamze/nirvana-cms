import mongoose from "mongoose";
import Menu from "../models/menu/Menu.js";
import MenuCategory from "../models/menu/MenuCategory.js";
import { slugify } from "../utils/slugify.js";

// Reject anything that isn't a plain ObjectId string before it reaches a
// query — a client-supplied id can otherwise carry a query-operator shape
// (e.g. {"$ne": null}) into a Mongo filter.
export function isValidObjectIdString(value: unknown): value is string {
  return typeof value === "string" && mongoose.isValidObjectId(value);
}

export function assertMenuInApplication(menuId: any, application: any) {
  return Menu.exists({ _id: menuId, application });
}

// A MenuItem's category must belong to the same menu as the item itself, not
// just the same application — two different menus can each have their own
// "appetizers" category with unrelated items.
export function assertCategoryInMenu(categoryId: any, menuId: any, application: any) {
  return MenuCategory.exists({ _id: categoryId, menu: menuId, application });
}

interface TranslationInput {
  langKey?: unknown;
  title?: unknown;
  description?: unknown;
}

// Validates shape only (langKey is one of the app's allowed languages, title/
// description non-empty per the model's requirement, the app's base language
// is present) — slugs are never accepted from the client. Shared by
// MenuCategory and MenuItem, which both use the same embedded-translations
// shape as Category/Tag (see those controllers for the un-parameterized
// original this generalizes).
export function validateTranslationsInput(
  translations: unknown,
  allowedLanguages: readonly string[],
  { requireDescription = false }: { requireDescription?: boolean } = {},
): string | null {
  if (!Array.isArray(translations) || translations.length === 0) {
    return "translations must include at least one language with a title";
  }
  const baseLanguage = allowedLanguages[0];
  const seen = new Set<string>();
  let hasBaseLanguage = false;
  for (const t of translations as TranslationInput[]) {
    if (!t || typeof t !== "object") return "each translation must be an object";
    if (!allowedLanguages.includes(t.langKey as string)) {
      return `translations.langKey must be one of: ${allowedLanguages.join(", ")}`;
    }
    if (!t.title || !t.title.toString().trim()) {
      return "each translation requires a non-empty title";
    }
    if (requireDescription && (!t.description || !t.description.toString().trim())) {
      return "each translation requires a non-empty description";
    }
    if (seen.has(t.langKey as string)) return "each language may only appear once in translations";
    seen.add(t.langKey as string);
    if (t.langKey === baseLanguage) hasBaseLanguage = true;
  }
  if (!hasBaseLanguage) {
    return `translations must include the application's base language (${baseLanguage})`;
  }
  return null;
}

// Auto-derived slugs disambiguate silently on collision — e.g. "burger" ->
// "burger-2" — same behavior as Category/Tag/Content slugs. Checks
// soft-deleted rows too: they still occupy the unique index. `scope` pins
// the uniqueness check to the right index (application+menu for both
// MenuCategory and MenuItem).
async function findAvailableSlug({
  Model,
  scope,
  langKey,
  baseSlug,
  excludeId,
}: {
  Model: mongoose.Model<any>;
  scope: Record<string, unknown>;
  langKey: string;
  baseSlug: string;
  excludeId?: any;
}) {
  let slug = baseSlug;
  let suffix = 2;
  while (
    await Model.exists({
      ...scope,
      isDeleted: { $in: [true, false] },
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
      translations: { $elemMatch: { langKey, slug } },
    })
  ) {
    slug = `${baseSlug}-${suffix++}`;
  }
  return slug;
}

// Resolves a client-supplied translations array into stored shape, reusing
// an existing slug when a language's title hasn't changed (so saving the
// form again doesn't needlessly shift that language's URL) and
// auto-deriving a fresh one otherwise. Preserves `description` only when the
// caller's translation objects carry one (MenuCategory's is optional,
// MenuItem's is required — both pass whatever they have through unchanged).
export async function resolveTranslations({
  Model,
  scope,
  translations,
  existing = [],
  excludeId,
}: {
  Model: mongoose.Model<any>;
  scope: Record<string, unknown>;
  translations: TranslationInput[];
  existing?: any[];
  excludeId?: any;
}) {
  const existingByLang = new Map(existing.map((t) => [t.langKey, t]));
  const resolved = [];
  for (const t of translations) {
    const title = (t.title as string).toString().trim();
    // Normalized to "" when omitted (MenuCategory's description is
    // optional) rather than left undefined, matching the schema default —
    // deliberately excluded from the slug-reuse comparison below, same as
    // Category/Tag only keying reuse off title.
    const description = t.description != null ? t.description.toString().trim() : "";
    const prior = existingByLang.get(t.langKey as string);
    if (prior && prior.title === title) {
      resolved.push({ langKey: t.langKey, title, description, slug: prior.slug });
      continue;
    }
    const slug = await findAvailableSlug({
      Model,
      scope,
      langKey: t.langKey as string,
      baseSlug: slugify(title),
      excludeId,
    });
    resolved.push({ langKey: t.langKey, title, description, slug });
  }
  return resolved;
}

export function validateNonNegativeNumber(
  value: unknown,
  field: string,
  { required = false }: { required?: boolean } = {},
): string | null {
  if (value === undefined || value === null || value === "") {
    return required ? `${field} is required` : null;
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    return `${field} must be a non-negative number`;
  }
  return null;
}
