// Factories/converters for content sections & elements — split out of
// types/content.ts so that module holds only type declarations.
import { SECTION_LAYOUTS } from "../constants/contentSections";
import type { ContentElement, ContentSection, ElementType, SectionType } from "../types/content";
import { randomUUID } from "../utils/randomUUID";

export function createEmptyElementOfType(elementType: ElementType): ContentElement {
  switch (elementType) {
    case "paragraph": return { elementType, text: "" };
    case "richText": return { elementType, html: "" };
    case "heading": return { elementType, level: 2, text: "" };
    case "textInput": return { elementType, text: "" };
    case "image": return { elementType, url: "", alt: "", caption: "" };
    case "imageGallery":
      return { elementType, images: [{ url: "", alt: "", caption: "" }, { url: "", alt: "", caption: "" }] };
    case "link": return { elementType, url: "", label: "", newTab: false };
    case "videoEmbed": return { elementType, url: "", caption: "" };
  }
}

const TEXT_LIKE_ELEMENT_TYPES: ElementType[] = ["paragraph", "richText", "heading", "textInput"];

function extractPlainText(element: ContentElement): string {
  switch (element.elementType) {
    case "paragraph": return element.text;
    case "heading": return element.text;
    case "textInput": return element.text;
    case "richText": return new DOMParser().parseFromString(element.html, "text/html").body.textContent ?? "";
    default: return "";
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Switches an element to a different type, carrying its text over where
// possible — paragraph/richText/heading/textInput are all "just text" to the
// person editing, so switching between them shouldn't wipe what was typed.
// Switching to/from a non-text type (image, link, ...) can't meaningfully
// preserve anything, so that falls back to a blank element of the new type.
export function convertElementType(element: ContentElement, newType: ElementType): ContentElement {
  if (element.elementType === newType) return element;
  if (!TEXT_LIKE_ELEMENT_TYPES.includes(newType) || !TEXT_LIKE_ELEMENT_TYPES.includes(element.elementType)) {
    return createEmptyElementOfType(newType);
  }
  const text = extractPlainText(element);
  switch (newType) {
    case "paragraph": return { elementType: newType, text };
    case "textInput": return { elementType: newType, text };
    case "heading": return { elementType: newType, level: element.elementType === "heading" ? element.level : 2, text };
    case "richText": return { elementType: newType, html: text ? `<p>${escapeHtml(text)}</p>` : "" };
    default: return createEmptyElementOfType(newType);
  }
}

export function createEmptySection(type: SectionType): ContentSection {
  const elements: ContentElement[] = [];
  for (const slot of SECTION_LAYOUTS[type].slots) {
    for (let i = 0; i < slot.count; i++) elements.push(createEmptyElementOfType(slot.elementTypes[0]));
  }
  return { cid: randomUUID(), type, elements };
}

// Assigns a stable client key to sections loaded from the server (which only
// carry a real `_id`), so freshly-loaded and freshly-created sections can
// share one dnd-kit/React key scheme.
export function withClientKeys(sections: ContentSection[]): ContentSection[] {
  return sections.map((s) => ({ ...s, cid: s.cid ?? s._id ?? randomUUID() }));
}

// Strips the client-only `cid` before sending sections to the API.
export function toPersistableSections(sections: ContentSection[]): ContentSection[] {
  return sections.map(({ cid: _cid, ...rest }) => rest);
}
