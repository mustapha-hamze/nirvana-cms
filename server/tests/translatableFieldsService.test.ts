import { mergeContentTranslation, mergePageTranslation, stripForPrompt } from "../src/services/translatableFieldsService.js";

describe("translatableFieldsService — mergeContentTranslation", () => {
  const original = {
    _id: "detail-1",
    title: "Hello",
    headline: "Head",
    abstract: "Abs",
    status: "published",
    publishedAt: "2024-01-01",
    metadata: { keywords: ["a", "b"], author: "Jane Doe", description: "desc" },
    sections: [
      {
        _id: "sec1",
        type: "text-image",
        elements: [
          { _id: "el1", elementType: "paragraph", text: "Hello world" },
          { _id: "el2", elementType: "image", url: "abc123.png", alt: "An image", caption: "Caption" },
        ],
      },
    ],
  };

  test("translates leaf text fields and always forces status to draft", () => {
    const aiJson = {
      title: "Bonjour",
      headline: "Titre",
      abstract: "Résumé",
      status: "published",
      metadata: { keywords: ["x", "y"], author: "Jeanne Dupont", description: "description fr" },
      sections: original.sections,
    };

    const draft = mergeContentTranslation(original, aiJson);

    expect(draft.title).toBe("Bonjour");
    expect(draft.headline).toBe("Titre");
    expect(draft.abstract).toBe("Résumé");
    expect(draft.status).toBe("draft");
    expect(draft.metadata).toEqual({ keywords: ["x", "y"], author: "Jeanne Dupont", description: "description fr" });
    expect((draft as any).publishedAt).toBeUndefined();
    expect((draft as any)._id).toBeUndefined();
  });

  test("ignores the AI's structure entirely — _id/type/elementType/url are always the original's, never the AI's", () => {
    const aiJson = {
      title: "Bonjour",
      sections: [
        {
          _id: "malicious-id-should-be-ignored",
          type: "bogus-type-should-be-ignored",
          elements: [
            { elementType: "heading", text: "Bonjour le monde" },
            { elementType: "image", url: "https://evil.com/hacked.png", alt: "Une image", caption: "Légende" },
          ],
        },
      ],
    };

    const draft = mergeContentTranslation(original, aiJson);

    expect(draft.sections[0]).toMatchObject({ _id: "sec1", type: "text-image" });
    const elements = (draft.sections[0] as any).elements;
    // elementType comes from the ORIGINAL — which field(s) get translated is
    // decided by the original's elementType (paragraph → just `text`), and the
    // AI's bogus "heading" label for that slot is never consulted for structure.
    expect(elements[0]).toMatchObject({ _id: "el1", elementType: "paragraph", text: "Bonjour le monde" });
    expect(elements[1]).toMatchObject({ _id: "el2", elementType: "image", url: "abc123.png", alt: "Une image", caption: "Légende" });
  });

  test("keeps array length/order from the original even if the AI response is shorter, longer, or empty", () => {
    const aiJsonEmpty = { title: "T", sections: [] };
    const draftEmpty = mergeContentTranslation(original, aiJsonEmpty);
    expect(draftEmpty.sections).toHaveLength(1);
    expect((draftEmpty.sections[0] as any).elements[0].text).toBe("Hello world");

    const aiJsonExtra = {
      title: "T",
      sections: [
        {
          type: "text-image",
          elements: [
            { elementType: "paragraph", text: "one" },
            { elementType: "image", alt: "two" },
            { elementType: "paragraph", text: "should be dropped, original only has 2 elements" },
          ],
        },
      ],
    };
    const draftExtra = mergeContentTranslation(original, aiJsonExtra);
    expect((draftExtra.sections[0] as any).elements).toHaveLength(2);
  });

  test("sanitizes richText html output through sanitizeRichText, stripping scripts/handlers", () => {
    const richTextOriginal = {
      ...original,
      sections: [
        {
          type: "text-1-col",
          elements: [{ _id: "rt1", elementType: "richText", html: "<p>Hello</p>" }],
        },
      ],
    };
    const aiJson = {
      title: "T",
      sections: [
        {
          type: "text-1-col",
          elements: [{ elementType: "richText", html: '<p onclick="evil()">Bonjour</p><script>alert(1)</script>' }],
        },
      ],
    };

    const draft = mergeContentTranslation(richTextOriginal, aiJson);
    const html = (draft.sections[0] as any).elements[0].html;
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onclick");
    expect(html).toContain("Bonjour");
  });

  test("imageGallery images are translated positionally, urls preserved", () => {
    const galleryOriginal = {
      ...original,
      sections: [
        {
          type: "image-gallery",
          elements: [
            {
              elementType: "imageGallery",
              images: [
                { url: "a.png", alt: "Alt A", caption: "Caption A" },
                { url: "b.png", alt: "Alt B", caption: "Caption B" },
              ],
            },
          ],
        },
      ],
    };
    const aiJson = {
      title: "T",
      sections: [
        {
          type: "image-gallery",
          elements: [
            {
              elementType: "imageGallery",
              images: [
                { url: "https://evil.com/x.png", alt: "Alt A translated", caption: "Caption A translated" },
                { url: "https://evil.com/y.png", alt: "Alt B translated", caption: "Caption B translated" },
              ],
            },
          ],
        },
      ],
    };

    const draft = mergeContentTranslation(galleryOriginal, aiJson);
    const images = (draft.sections[0] as any).elements[0].images;
    expect(images[0]).toEqual({ url: "a.png", alt: "Alt A translated", caption: "Caption A translated" });
    expect(images[1]).toEqual({ url: "b.png", alt: "Alt B translated", caption: "Caption B translated" });
  });

  test("falls back to the original value when the AI omits a field or returns a non-string", () => {
    const aiJson = { title: 123, headline: null };
    const draft = mergeContentTranslation(original, aiJson);
    expect(draft.title).toBe("Hello");
    expect(draft.headline).toBe("Head");
  });
});

describe("translatableFieldsService — mergePageTranslation", () => {
  const original = {
    title: "About Us",
    status: "published",
    metadata: { keywords: [], author: "", description: "" },
    sections: [
      {
        _id: "psec1",
        title: "Our Plans",
        isVisible: true,
        settings: { backgroundColor: "#fff", spacing: "normal", width: "contained", textAlign: "left" },
        components: [
          {
            _id: "pcomp1",
            type: "pricing",
            elements: [
              {
                elementType: "pricingPlan",
                name: "Basic",
                price: "$10",
                billingPeriod: "per month",
                features: ["Feature one", "Feature two"],
                ctaLabel: "Buy now",
                ctaUrl: "/checkout",
                highlighted: false,
              },
            ],
          },
        ],
      },
    ],
  };

  test("translates section title and pricingPlan text fields, preserves ctaUrl/highlighted/settings", () => {
    const aiJson = {
      title: "À propos",
      sections: [
        {
          title: "Nos forfaits",
          isVisible: false,
          settings: { backgroundColor: "#000", spacing: "compact", width: "full", textAlign: "center" },
          components: [
            {
              type: "bogus",
              elements: [
                {
                  elementType: "pricingPlan",
                  name: "Basique",
                  price: "10 $",
                  billingPeriod: "par mois",
                  features: ["Fonction un", "Fonction deux"],
                  ctaLabel: "Acheter",
                  ctaUrl: "https://evil.com/checkout",
                  highlighted: true,
                },
              ],
            },
          ],
        },
      ],
    };

    const draft = mergePageTranslation(original, aiJson);

    expect(draft.title).toBe("À propos");
    expect(draft.status).toBe("draft");
    const section = draft.sections[0] as any;
    expect(section.title).toBe("Nos forfaits");
    // isVisible/settings are presentational — preserved regardless of AI output.
    expect(section.isVisible).toBe(true);
    expect(section.settings).toEqual(original.sections[0].settings);
    // component.type preserved even though the AI returned "bogus".
    expect(section.components[0].type).toBe("pricing");
    const plan = section.components[0].elements[0];
    expect(plan.name).toBe("Basique");
    expect(plan.features).toEqual(["Fonction un", "Fonction deux"]);
    expect(plan.ctaUrl).toBe("/checkout");
    expect(plan.highlighted).toBe(false);
  });
});

describe("translatableFieldsService — stripForPrompt", () => {
  test("strips _id fields recursively and omits headline/abstract for pages", () => {
    const detail = {
      _id: "d1",
      title: "T",
      headline: "H",
      abstract: "A",
      metadata: { _id: "m1", keywords: ["k"], author: "", description: "" },
      sections: [{ _id: "s1", type: "text-1-col", elements: [{ _id: "e1", elementType: "paragraph", text: "hi" }] }],
    };

    const contentPayload = stripForPrompt(detail, "content");
    expect(contentPayload).not.toHaveProperty("_id");
    expect(contentPayload.headline).toBe("H");
    expect(contentPayload.abstract).toBe("A");
    expect((contentPayload.metadata as any)._id).toBeUndefined();
    expect((contentPayload.sections as any[])[0]._id).toBeUndefined();
    expect((contentPayload.sections as any[])[0].elements[0]._id).toBeUndefined();

    const pagePayload = stripForPrompt(detail, "page");
    expect(pagePayload).not.toHaveProperty("headline");
    expect(pagePayload).not.toHaveProperty("abstract");
  });
});
