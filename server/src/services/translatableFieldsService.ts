import { sanitizeRichText } from "../utils/sanitizeRichText.js";
import { ELEMENT_TYPES } from "../constants/elementTypes.js";
import { PAGE_ELEMENT_TYPES } from "../constants/pageElementTypes.js";

// Declarative merge engine for AI-generated translations. The merge always
// walks the ORIGINAL (already-persisted, already-valid) document tree and
// only ever pulls leaf string values from the AI's response, positionally,
// for fields explicitly marked translatable below — every other field
// (_id, elementType, type/component.type, urls, filenames, numbers, enums,
// booleans, array length/order) is copied straight from the original and the
// AI's opinion of it is never consulted. This is what makes "must not
// add/remove/reorder/rename fields" true by construction rather than
// something we have to hope the model respects.
type FieldRuleMap = Record<string, FieldRule>;

type FieldRule =
  | { kind: "preserve" }
  | { kind: "translate" }
  | { kind: "translateHtml" }
  | { kind: "translateArrayOfStrings" }
  | { kind: "object"; fields: FieldRuleMap }
  | { kind: "arrayOfObjects"; fields?: FieldRuleMap; itemRuleFor?: (item: any) => FieldRuleMap | undefined };

const PRESERVE: FieldRule = { kind: "preserve" };
const TRANSLATE: FieldRule = { kind: "translate" };
const TRANSLATE_HTML: FieldRule = { kind: "translateHtml" };
const TRANSLATE_ARRAY: FieldRule = { kind: "translateArrayOfStrings" };

function object(fields: FieldRuleMap): FieldRule {
  return { kind: "object", fields };
}

function arrayOfObjects(opts: { fields: FieldRuleMap } | { itemRuleFor: (item: any) => FieldRuleMap | undefined }): FieldRule {
  return { kind: "arrayOfObjects", ...opts };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function mergeValue(rule: FieldRule, original: unknown, aiValue: unknown): unknown {
  switch (rule.kind) {
    case "preserve":
      return original;
    case "translate":
      return typeof aiValue === "string" && aiValue.trim() ? aiValue : original;
    case "translateHtml":
      return typeof aiValue === "string" && aiValue.trim() ? sanitizeRichText(aiValue) : original;
    case "translateArrayOfStrings": {
      if (!Array.isArray(original)) return original;
      const aiArr = Array.isArray(aiValue) ? aiValue : [];
      return original.map((orig, i) => (typeof aiArr[i] === "string" && aiArr[i].trim() ? aiArr[i] : orig));
    }
    case "object":
      return mergeObject(rule.fields, original, aiValue);
    case "arrayOfObjects": {
      if (!Array.isArray(original)) return original;
      const aiArr = Array.isArray(aiValue) ? aiValue : [];
      return original.map((origItem, i) => {
        const fields = rule.itemRuleFor ? rule.itemRuleFor(origItem) : rule.fields;
        if (!fields) return origItem;
        return mergeObject(fields, origItem, aiArr[i]);
      });
    }
  }
}

// Spreads `original` first so any key not listed in `fields` (_id,
// elementType, type, newTab, highlighted, any url field not explicitly
// ruled, ...) survives untouched automatically — only keys with an explicit
// rule ever get overwritten, and only when the AI's value for that key is
// shaped the way the rule expects.
function mergeObject(fields: FieldRuleMap, original: unknown, aiValue: unknown): unknown {
  if (!original || typeof original !== "object") return original;
  const aiObj = isPlainObject(aiValue) ? aiValue : {};
  const originalObj = original as Record<string, unknown>;
  const result: Record<string, unknown> = { ...originalObj };
  for (const [key, rule] of Object.entries(fields)) {
    if (!(key in originalObj)) continue;
    result[key] = mergeValue(rule, originalObj[key], aiObj[key]);
  }
  return result;
}

// ── Element-level field rules ───────────────────────────────────────────────

const CONTENT_ELEMENT_FIELDS: Record<string, FieldRuleMap> = {
  [ELEMENT_TYPES.PARAGRAPH]: { text: TRANSLATE },
  [ELEMENT_TYPES.RICH_TEXT]: { html: TRANSLATE_HTML },
  [ELEMENT_TYPES.HEADING]: { level: PRESERVE, text: TRANSLATE },
  [ELEMENT_TYPES.TEXT_INPUT]: { text: TRANSLATE },
  [ELEMENT_TYPES.IMAGE]: { url: PRESERVE, alt: TRANSLATE, caption: TRANSLATE },
  [ELEMENT_TYPES.IMAGE_GALLERY]: {
    images: arrayOfObjects({ fields: { url: PRESERVE, alt: TRANSLATE, caption: TRANSLATE } }),
  },
  [ELEMENT_TYPES.LINK]: { url: PRESERVE, label: TRANSLATE, newTab: PRESERVE },
  [ELEMENT_TYPES.VIDEO_EMBED]: { url: PRESERVE, caption: TRANSLATE },
};

const SOCIAL_LINK_FIELDS: FieldRuleMap = { platform: PRESERVE, url: PRESERVE };

// Page elements reuse content's richText/image/videoEmbed/heading/link shapes
// verbatim (same schemas, see models/page/Elements.ts), plus page-specific types.
const PAGE_ELEMENT_FIELDS: Record<string, FieldRuleMap> = {
  [PAGE_ELEMENT_TYPES.RICH_TEXT]: CONTENT_ELEMENT_FIELDS[ELEMENT_TYPES.RICH_TEXT],
  [PAGE_ELEMENT_TYPES.IMAGE]: CONTENT_ELEMENT_FIELDS[ELEMENT_TYPES.IMAGE],
  [PAGE_ELEMENT_TYPES.VIDEO_EMBED]: CONTENT_ELEMENT_FIELDS[ELEMENT_TYPES.VIDEO_EMBED],
  [PAGE_ELEMENT_TYPES.HEADING]: CONTENT_ELEMENT_FIELDS[ELEMENT_TYPES.HEADING],
  [PAGE_ELEMENT_TYPES.LINK]: CONTENT_ELEMENT_FIELDS[ELEMENT_TYPES.LINK],
  [PAGE_ELEMENT_TYPES.SLIDE]: {
    image: PRESERVE, imageAlt: TRANSLATE, heading: TRANSLATE, subheading: TRANSLATE, ctaLabel: TRANSLATE, ctaUrl: PRESERVE,
  },
  [PAGE_ELEMENT_TYPES.BANNER]: {
    image: PRESERVE, imageAlt: TRANSLATE, logo: PRESERVE, logoAlt: TRANSLATE,
    heading: TRANSLATE, subheading: TRANSLATE, ctaLabel: TRANSLATE, ctaUrl: PRESERVE,
  },
  [PAGE_ELEMENT_TYPES.CARD]: {
    image: PRESERVE, imageAlt: TRANSLATE, title: TRANSLATE, description: TRANSLATE,
    badge: TRANSLATE, ctaLabel: TRANSLATE, ctaUrl: PRESERVE, highlighted: PRESERVE,
  },
  [PAGE_ELEMENT_TYPES.TAB]: { label: TRANSLATE, content: TRANSLATE_HTML },
  [PAGE_ELEMENT_TYPES.ACCORDION_ITEM]: { heading: TRANSLATE, content: TRANSLATE_HTML },
  [PAGE_ELEMENT_TYPES.CAROUSEL_ITEM]: { image: PRESERVE, imageAlt: TRANSLATE, caption: TRANSLATE, linkUrl: PRESERVE },
  [PAGE_ELEMENT_TYPES.PRICING_PLAN]: {
    name: TRANSLATE, price: TRANSLATE, billingPeriod: TRANSLATE, features: TRANSLATE_ARRAY,
    ctaLabel: TRANSLATE, ctaUrl: PRESERVE, highlighted: PRESERVE,
  },
  [PAGE_ELEMENT_TYPES.STEP]: { title: TRANSLATE, description: TRANSLATE, icon: PRESERVE },
  [PAGE_ELEMENT_TYPES.TEAM_MEMBER]: {
    photo: PRESERVE, name: PRESERVE, role: TRANSLATE, bio: TRANSLATE,
    socialLinks: arrayOfObjects({ fields: SOCIAL_LINK_FIELDS }),
  },
  [PAGE_ELEMENT_TYPES.TESTIMONIAL_ITEM]: {
    quote: TRANSLATE, authorName: PRESERVE, authorRole: TRANSLATE, avatar: PRESERVE, rating: PRESERVE,
  },
  [PAGE_ELEMENT_TYPES.CHART_DATA]: {
    chartType: PRESERVE, title: TRANSLATE, labels: TRANSLATE_ARRAY,
    series: arrayOfObjects({ fields: { label: TRANSLATE, color: PRESERVE, data: PRESERVE } }),
  },
  [PAGE_ELEMENT_TYPES.GALLERY_ITEM]: {
    mediaType: PRESERVE, url: PRESERVE, thumbnailUrl: PRESERVE, alt: TRANSLATE, caption: TRANSLATE, fileName: TRANSLATE,
  },
  [PAGE_ELEMENT_TYPES.CTA]: {
    heading: TRANSLATE, subheading: TRANSLATE, ctaLabel: TRANSLATE, ctaUrl: PRESERVE,
    secondaryCtaLabel: TRANSLATE, secondaryCtaUrl: PRESERVE,
  },
  [PAGE_ELEMENT_TYPES.STAT_ITEM]: { value: PRESERVE, label: TRANSLATE, icon: PRESERVE },
  [PAGE_ELEMENT_TYPES.TIMELINE_ITEM]: { date: PRESERVE, title: TRANSLATE, description: TRANSLATE },
  [PAGE_ELEMENT_TYPES.MAP]: { address: TRANSLATE, latitude: PRESERVE, longitude: PRESERVE, zoom: PRESERVE, embedUrl: PRESERVE },
  [PAGE_ELEMENT_TYPES.PORTFOLIO_ITEM]: {
    image: PRESERVE, imageAlt: TRANSLATE, title: TRANSLATE, client: TRANSLATE,
    category: TRANSLATE, description: TRANSLATE, caseStudyUrl: PRESERVE,
  },
  [PAGE_ELEMENT_TYPES.FEATURE]: {
    image: PRESERVE, imageAlt: TRANSLATE, heading: TRANSLATE, highlightText: TRANSLATE,
    description: TRANSLATE, items: TRANSLATE_ARRAY, badgeImage: PRESERVE, badgeImageAlt: TRANSLATE,
  },
};

// ── Section/component-level field rules ─────────────────────────────────────

const METADATA_FIELDS: FieldRuleMap = {
  keywords: TRANSLATE_ARRAY,
  author: TRANSLATE,
  description: TRANSLATE,
};

const CONTENT_SECTION_FIELDS: FieldRuleMap = {
  type: PRESERVE,
  elements: arrayOfObjects({ itemRuleFor: (el: any) => CONTENT_ELEMENT_FIELDS[el?.elementType] }),
};

const PAGE_COMPONENT_FIELDS: FieldRuleMap = {
  type: PRESERVE,
  elements: arrayOfObjects({ itemRuleFor: (el: any) => PAGE_ELEMENT_FIELDS[el?.elementType] }),
};

const PAGE_SECTION_FIELDS: FieldRuleMap = {
  title: TRANSLATE,
  isVisible: PRESERVE,
  settings: PRESERVE,
  components: arrayOfObjects({ fields: PAGE_COMPONENT_FIELDS }),
};

// ── Top-level detail merge ───────────────────────────────────────────────────
// Built explicitly field-by-field (not a generic object-spread merge like
// mergeObject above) so bookkeeping fields that must never carry over into a
// new translation — _id, content/page/application refs, slug, publishedAt,
// createdAt/updatedAt, isDeleted — are never present on the output at all,
// regardless of what `original` or the AI response contain.

export type ContentTranslationDraft = {
  title: string;
  headline: string;
  abstract: string;
  status: "draft";
  metadata: { keywords: string[]; author: string; description: string };
  sections: unknown[];
};

export function mergeContentTranslation(original: any, aiJson: unknown): ContentTranslationDraft {
  const ai = isPlainObject(aiJson) ? aiJson : {};
  return {
    title: mergeValue(TRANSLATE, original.title ?? "", ai.title) as string,
    headline: mergeValue(TRANSLATE, original.headline ?? "", ai.headline) as string,
    abstract: mergeValue(TRANSLATE, original.abstract ?? "", ai.abstract) as string,
    status: "draft",
    metadata: mergeValue(object(METADATA_FIELDS), original.metadata ?? {}, ai.metadata) as ContentTranslationDraft["metadata"],
    sections: mergeValue(arrayOfObjects({ fields: CONTENT_SECTION_FIELDS }), original.sections ?? [], ai.sections) as unknown[],
  };
}

export type PageTranslationDraft = {
  title: string;
  status: "draft";
  metadata: { keywords: string[]; author: string; description: string };
  sections: unknown[];
};

export function mergePageTranslation(original: any, aiJson: unknown): PageTranslationDraft {
  const ai = isPlainObject(aiJson) ? aiJson : {};
  return {
    title: mergeValue(TRANSLATE, original.title ?? "", ai.title) as string,
    status: "draft",
    metadata: mergeValue(object(METADATA_FIELDS), original.metadata ?? {}, ai.metadata) as PageTranslationDraft["metadata"],
    sections: mergeValue(arrayOfObjects({ fields: PAGE_SECTION_FIELDS }), original.sections ?? [], ai.sections) as unknown[],
  };
}

// ── What actually gets sent to the AI ────────────────────────────────────────
// A minimal subset of the source translation (title/headline/abstract/
// metadata/sections only), with every `_id`/`__v` stripped recursively — the
// merge functions above never read ids back from the AI's response anyway
// (they walk `original`'s structure, not the AI's), so there's no reason to
// spend request size on them or hand a third-party API more Mongo internals
// than necessary.
function stripIds(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripIds);
  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      if (key === "_id" || key === "__v") continue;
      result[key] = stripIds(v);
    }
    return result;
  }
  return value;
}

export function stripForPrompt(original: any, kind: "content" | "page"): Record<string, unknown> {
  const base: Record<string, unknown> = {
    title: original.title ?? "",
    metadata: stripIds(original.metadata ?? {}),
    sections: stripIds(original.sections ?? []),
  };
  if (kind === "content") {
    base.headline = original.headline ?? "";
    base.abstract = original.abstract ?? "";
  }
  return base;
}
