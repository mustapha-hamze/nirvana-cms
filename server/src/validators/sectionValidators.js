import { SECTION_TYPE_VALUES, SECTION_LAYOUTS } from "../constants/sectionTypes.js";
import { PAGE_COMPONENT_TYPE_VALUES, PAGE_COMPONENT_LAYOUTS, MAX_COMPONENTS_PER_SECTION } from "../constants/pageComponentTypes.js";

// Checks the one thing the Mongoose schema can't express: that each content
// section's `type` is a known layout and its `elements` match that layout's
// slots (see SECTION_LAYOUTS) in count, type, and order. Per-field checks
// (required/maxlength on text/url/alt/etc.) are intentionally NOT duplicated
// here — the schema's own discriminators already enforce those and surface
// as a Mongoose ValidationError on .save().
export function validateContentSections(sections) {
  if (sections === undefined) return { valid: true };
  if (!Array.isArray(sections)) {
    return { valid: false, message: "sections must be an array" };
  }
  if (sections.length > 40) {
    return { valid: false, message: "A content body may have at most 40 sections" };
  }
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const layout = SECTION_LAYOUTS[section?.type];
    if (!layout) {
      return {
        valid: false,
        message: `sections[${i}]: type must be one of: ${SECTION_TYPE_VALUES.join(", ")}`,
      };
    }
    const elements = Array.isArray(section.elements) ? section.elements : [];
    const expectedCount = layout.slots.reduce((sum, slot) => sum + slot.count, 0);
    if (elements.length !== expectedCount) {
      return {
        valid: false,
        message: `sections[${i}] (${section.type}) must contain exactly ${expectedCount} element(s)`,
      };
    }
    let cursor = 0;
    for (const slot of layout.slots) {
      for (let s = 0; s < slot.count; s++) {
        const element = elements[cursor];
        if (!slot.elementTypes.includes(element?.elementType)) {
          return {
            valid: false,
            message: `sections[${i}] (${section.type}): element at position ${cursor} must be one of: ${slot.elementTypes.join(", ")}`,
          };
        }
        cursor++;
      }
    }
  }
  return { valid: true };
}

// Checks the one thing the Mongoose schema can't express: that each page
// component's `type` is a known page component and its `elements` are all
// the one element type that component holds, within that type's min/max
// count (see PAGE_COMPONENT_LAYOUTS). A section itself has no `type` and no
// min/max — it's a generic container, so an empty `components` array is
// valid (a freshly added, still-empty section). Per-field checks
// (maxlength/enum/etc.) are intentionally NOT duplicated here — the schema's
// own discriminators already enforce those and surface as a Mongoose
// ValidationError on .save().
export function validatePageSections(sections) {
  if (sections === undefined) return { valid: true };
  if (!Array.isArray(sections)) {
    return { valid: false, message: "sections must be an array" };
  }
  if (sections.length > 40) {
    return { valid: false, message: "A page may have at most 40 sections" };
  }
  for (let i = 0; i < sections.length; i++) {
    const components = Array.isArray(sections[i]?.components) ? sections[i].components : [];
    if (components.length > MAX_COMPONENTS_PER_SECTION) {
      return {
        valid: false,
        message: `sections[${i}]: a section may have at most ${MAX_COMPONENTS_PER_SECTION} components`,
      };
    }
    for (let j = 0; j < components.length; j++) {
      const component = components[j];
      const layout = PAGE_COMPONENT_LAYOUTS[component?.type];
      if (!layout) {
        return {
          valid: false,
          message: `sections[${i}].components[${j}]: type must be one of: ${PAGE_COMPONENT_TYPE_VALUES.join(", ")}`,
        };
      }
      const elements = Array.isArray(component.elements) ? component.elements : [];
      if (elements.length < layout.min || elements.length > layout.max) {
        const range = layout.min === layout.max ? `exactly ${layout.min}` : `between ${layout.min} and ${layout.max}`;
        return {
          valid: false,
          message: `sections[${i}].components[${j}] (${component.type}) must contain ${range} element(s)`,
        };
      }
      const wrongType = elements.find((el) => el?.elementType !== layout.elementType);
      if (wrongType) {
        return {
          valid: false,
          message: `sections[${i}].components[${j}] (${component.type}): every element must be of type "${layout.elementType}"`,
        };
      }
    }
  }
  return { valid: true };
}
