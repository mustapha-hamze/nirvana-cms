import { sanitizeRichText } from "../src/utils/sanitizeRichText.js";

describe("sanitizeRichText", () => {
  test("returns an empty string for non-string or empty input", () => {
    expect(sanitizeRichText(undefined)).toBe("");
    expect(sanitizeRichText(null)).toBe("");
    expect(sanitizeRichText("")).toBe("");
  });

  test("keeps tags the TipTap toolbar can actually produce", () => {
    const html = "<p>Hello <strong>world</strong>, <em>see</em> <a href=\"https://example.com\">this</a></p>";
    expect(sanitizeRichText(html)).toBe(
      '<p>Hello <strong>world</strong>, <em>see</em> <a href="https://example.com" rel="noopener noreferrer">this</a></p>',
    );
  });

  test("strips script tags and their content entirely", () => {
    expect(sanitizeRichText('<p>Hi</p><script>alert("xss")</script>')).toBe("<p>Hi</p>");
  });

  test("strips inline event handler attributes", () => {
    expect(sanitizeRichText('<p onclick="alert(1)">Click</p>')).toBe("<p>Click</p>");
  });

  test("strips disallowed tags like img and iframe", () => {
    expect(sanitizeRichText('<p>Text</p><img src="x.png"><iframe src="evil.com"></iframe>')).toBe("<p>Text</p>");
  });

  test("blocks javascript: URLs on links", () => {
    expect(sanitizeRichText('<a href="javascript:alert(1)">Click</a>')).toBe('<a rel="noopener noreferrer">Click</a>');
  });

  test("allows mailto: links", () => {
    expect(sanitizeRichText('<a href="mailto:a@b.com">Email</a>')).toBe(
      '<a href="mailto:a@b.com" rel="noopener noreferrer">Email</a>',
    );
  });
});
