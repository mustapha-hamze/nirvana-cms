// Factories for page sections/components/elements — split out of types/page.ts
// so that module holds only type declarations.
import { DEFAULT_SECTION_SETTINGS, PAGE_COMPONENT_LAYOUTS } from "../constants/pageSections";
import type { PageComponent, PageComponentType, PageElement, PageElementType, PageSection } from "../types/page";

export function createEmptyElementOfType(elementType: PageElementType): PageElement {
  switch (elementType) {
    case "richText": return { elementType, html: "" };
    case "image": return { elementType, url: "", alt: "", caption: "" };
    case "videoEmbed": return { elementType, url: "", caption: "" };
    case "slide": return { elementType, image: "", imageAlt: "", heading: "", subheading: "", ctaLabel: "", ctaUrl: "" };
    case "banner": return { elementType, image: "", imageAlt: "", logo: "", logoAlt: "", heading: "", subheading: "", ctaLabel: "", ctaUrl: "" };
    case "card": return { elementType, image: "", imageAlt: "", title: "", description: "", badge: "", ctaLabel: "", ctaUrl: "", highlighted: false };
    case "tab": return { elementType, label: "", content: "" };
    case "accordionItem": return { elementType, heading: "", content: "" };
    case "carouselItem": return { elementType, image: "", imageAlt: "", caption: "", linkUrl: "" };
    case "pricingPlan": return { elementType, name: "", price: "", billingPeriod: "", features: [], ctaLabel: "", ctaUrl: "", highlighted: false };
    case "step": return { elementType, title: "", description: "", icon: "" };
    case "teamMember": return { elementType, photo: "", name: "", role: "", bio: "", socialLinks: [] };
    case "testimonialItem": return { elementType, quote: "", authorName: "", authorRole: "", avatar: "", rating: null };
    case "chartData": return { elementType, chartType: "bar", title: "", labels: [], series: [] };
    case "galleryItem": return { elementType, mediaType: "image", url: "", thumbnailUrl: "", alt: "", caption: "", fileName: "" };
    case "cta": return { elementType, heading: "", subheading: "", ctaLabel: "", ctaUrl: "", secondaryCtaLabel: "", secondaryCtaUrl: "" };
    case "statItem": return { elementType, value: "", label: "", icon: "" };
    case "timelineItem": return { elementType, date: "", title: "", description: "" };
    case "map": return { elementType, address: "", latitude: null, longitude: null, zoom: 14, embedUrl: "" };
    case "portfolioItem": return { elementType, image: "", imageAlt: "", title: "", client: "", category: "", description: "", caseStudyUrl: "" };
    case "feature": return { elementType, image: "", imageAlt: "", heading: "", highlightText: "", description: "", items: [], badgeImage: "", badgeImageAlt: "" };
    case "heading": return { elementType, level: 2, text: "" };
    case "link": return { elementType, url: "", label: "", newTab: false };
  }
}

// Seeds a new component with its type's minimum element count — e.g. "Steps"
// starts with 2 empty steps (its min), "Banner" with exactly 1.
export function createEmptyComponentOfType(type: PageComponentType): PageComponent {
  const layout = PAGE_COMPONENT_LAYOUTS[type];
  const elements = Array.from({ length: layout.min }, () => createEmptyElementOfType(layout.elementType));
  return { cid: crypto.randomUUID(), type, elements };
}

// A fresh section is a blank container — no components until the editor adds
// some via the component picker inside it.
export function createEmptySection(): PageSection {
  return {
    cid: crypto.randomUUID(),
    title: "",
    isVisible: true,
    settings: { ...DEFAULT_SECTION_SETTINGS },
    components: [],
  };
}

// A section loaded from data saved before sections became generic containers
// still carries its old `type`/`elements` directly (the server migration
// script backfills this in the database, but the admin client stays
// defensive in case it's ever handed pre-migration data) — this detects that
// shape and wraps it into a single component, same transform as
// scripts/migratePageSectionsToComponents.js on the server.
function isOldShapeSection(section: unknown): section is { type: PageComponentType; elements: PageElement[]; [key: string]: unknown } {
  return !!section && typeof section === "object" && "type" in section && !("components" in section);
}

// Assigns a stable client key to sections (and their nested components)
// loaded from the server, which only carry a real `_id` — so freshly-loaded
// and freshly-created ones can share one dnd-kit/React key scheme. Mirrors
// factories/contentElements.ts's withClientKeys.
export function withClientKeys(sections: PageSection[]): PageSection[] {
  return sections.map((section) => {
    const normalized = isOldShapeSection(section)
      ? { ...section, components: [{ type: section.type, elements: section.elements ?? [] }] }
      : section;
    return {
      ...normalized,
      cid: normalized.cid ?? normalized._id ?? crypto.randomUUID(),
      title: normalized.title ?? "",
      components: (normalized.components ?? []).map((c) => ({ ...c, cid: c.cid ?? c._id ?? crypto.randomUUID() })),
    };
  });
}

// Strips the client-only `cid` (on both the section and each of its
// components) before sending sections to the API.
export function toPersistableSections(sections: PageSection[]): PageSection[] {
  return sections.map(({ cid: _cid, components, ...rest }) => ({
    ...rest,
    components: components.map(({ cid: _componentCid, ...componentRest }) => componentRest),
  }));
}
