import sanitizeHtml from "sanitize-html";

// Matches exactly what client/src/components/pageBody/RichTextArea.tsx's
// TipTap toolbar can produce (bold/italic/h2/h3/lists/link, plus a few
// StarterKit defaults reachable via markdown shortcuts/paste — blockquote,
// code, hr) — nothing else should ever legitimately arrive here.
const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "s", "u",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "a", "blockquote", "code", "pre", "hr",
];

const ALLOWED_ATTRIBUTES = {
  a: ["href", "target", "rel"],
};

// Strips anything a rich text editor shouldn't be able to produce — scripts,
// iframes, inline event handlers, style attributes, images (structured image
// elements exist separately) — before HTML is persisted. Applied as a
// Mongoose schema `set` transform (see content/Elements.js's richTextSchema
// and page/Elements.js's tabSchema/accordionItemSchema, which all author
// through this one RichTextArea editor) so it runs no matter which code path
// writes the field, not just whichever request handler remembers to call it.
export function sanitizeRichText(html) {
  if (typeof html !== "string" || !html) return "";
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto"],
    // Every link gets a safe `rel` regardless of `target`, since `target`
    // itself is caller-controlled and easy to get wrong.
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true),
    },
  });
}
