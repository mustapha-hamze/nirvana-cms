// Content section/element catalog — mirrors server/src/constants/elementTypes.js
// and server/src/constants/sectionTypes.js. Split out of types/content.ts so
// that module holds only type declarations; this one holds the runtime
// catalogs consumed by the section/element editors and pickers.
import type { ElementType, SectionType, SectionSlot } from "../types/content";
import type { TranslationKey } from "../i18n/types";

export const ELEMENT_TYPE_KEYS: Record<ElementType, TranslationKey> = {
  paragraph: "contentBuilder.elementParagraph",
  richText: "contentBuilder.elementRichText",
  heading: "contentBuilder.elementHeading",
  textInput: "contentBuilder.elementTextInput",
  image: "contentBuilder.elementImage",
  imageGallery: "contentBuilder.elementImageGallery",
  link: "contentBuilder.elementLink",
  videoEmbed: "contentBuilder.elementVideoEmbed",
};

export const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;

export const SECTION_TYPE_VALUES: SectionType[] = [
  "text-1-col", "text-2-col", "text-image", "text-video", "video-text",
  "image-only", "image-2-up", "image-gallery", "video-only", "document",
];

export const SECTION_TYPE_KEYS: Record<SectionType, TranslationKey> = {
  "text-1-col": "contentBuilder.sectionText1Col",
  "text-2-col": "contentBuilder.sectionText2Col",
  "text-image": "contentBuilder.sectionTextImage",
  "text-video": "contentBuilder.sectionTextVideo",
  "video-text": "contentBuilder.sectionVideoText",
  "image-only": "contentBuilder.elementImage",
  "image-2-up": "contentBuilder.sectionImage2Up",
  "image-gallery": "contentBuilder.elementImageGallery",
  "video-only": "contentBuilder.elementVideoEmbed",
  document: "contentBuilder.sectionDocument",
};

// Mirrors server/src/constants/sectionTypes.js SECTION_LAYOUTS — the single
// source of truth for how many elements a layout holds, in what order, and
// which element type(s) each slot accepts. Kept in sync by hand since there's
// no shared package between client/server in this repo (same existing pattern
// as LANGUAGE_VALUES/LangKey being duplicated rather than imported).
const TEXT_ELEMENT_TYPES: ElementType[] = ["paragraph", "richText", "heading", "textInput"];

export const SECTION_LAYOUTS: Record<SectionType, { slots: SectionSlot[] }> = {
  "text-1-col": { slots: [{ elementTypes: TEXT_ELEMENT_TYPES, count: 1 }] },
  "text-2-col": { slots: [{ elementTypes: TEXT_ELEMENT_TYPES, count: 2 }] },
  "text-image": {
    slots: [
      { elementTypes: TEXT_ELEMENT_TYPES, count: 1 },
      { elementTypes: ["image"], count: 1 },
    ],
  },
  "text-video": {
    slots: [
      { elementTypes: TEXT_ELEMENT_TYPES, count: 1 },
      { elementTypes: ["videoEmbed"], count: 1 },
    ],
  },
  "video-text": {
    slots: [
      { elementTypes: ["videoEmbed"], count: 1 },
      { elementTypes: TEXT_ELEMENT_TYPES, count: 1 },
    ],
  },
  "image-only": { slots: [{ elementTypes: ["image"], count: 1 }] },
  "image-2-up": { slots: [{ elementTypes: ["image"], count: 2 }] },
  "image-gallery": { slots: [{ elementTypes: ["imageGallery"], count: 1 }] },
  "video-only": { slots: [{ elementTypes: ["videoEmbed"], count: 1 }] },
  // Plain text only, no rich formatting/headings/links — a bare document block.
  document: { slots: [{ elementTypes: ["paragraph"], count: 1 }] },
};

// Which element types are allowed at a given position within a section's
// elements array — used to show a type switcher only where there's an actual
// choice (e.g. a "text" slot can be paragraph/richText/heading/textInput, but
// an "image" slot has just one option).
export function getSlotElementTypes(type: SectionType, index: number): ElementType[] {
  let cursor = 0;
  for (const slot of SECTION_LAYOUTS[type].slots) {
    if (index < cursor + slot.count) return slot.elementTypes;
    cursor += slot.count;
  }
  return [];
}
