import { jest } from "@jest/globals";

const Application = { findOne: jest.fn() };
const ApplicationSetting = { findOne: jest.fn() };
const Category = { find: jest.fn(), findOne: jest.fn() };
const Tag = { find: jest.fn(), findOne: jest.fn() };
const Content = { find: jest.fn(), findOne: jest.fn() };
const ContentDetails = { find: jest.fn(), findOne: jest.fn() };
const Page = { find: jest.fn(), findOne: jest.fn() };
const PageDetails = { find: jest.fn(), findOne: jest.fn() };

jest.unstable_mockModule("../src/models/application/Application.js", () => ({ default: Application }));
jest.unstable_mockModule("../src/models/application/ApplicationSetting.js", () => ({ default: ApplicationSetting }));
jest.unstable_mockModule("../src/models/Category.js", () => ({ default: Category }));
jest.unstable_mockModule("../src/models/Tag.js", () => ({ default: Tag }));
jest.unstable_mockModule("../src/models/content/Content.js", () => ({ default: Content }));
jest.unstable_mockModule("../src/models/content/ContentDetails.js", () => ({ default: ContentDetails }));
jest.unstable_mockModule("../src/models/page/Page.js", () => ({ default: Page }));
jest.unstable_mockModule("../src/models/page/PageDetails.js", () => ({ default: PageDetails }));

const {
  resolveFrontendApp,
  getFrontendSettings,
  getFrontendCategories,
  getFrontendTags,
  getFrontendContents,
  getFrontendContent,
  getFrontendPages,
  getFrontendPage,
} = await import("../src/controllers/frontendController.js");

function mockResponse() {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

// Mimics a real Mongoose Query: every chain method returns itself, and it
// resolves to `value` however many (or few) chain calls preceded the await.
function queryChain(value) {
  const chain = {
    sort: jest.fn(() => chain),
    populate: jest.fn(() => chain),
    select: jest.fn(() => chain),
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
  };
  return chain;
}

const app = { _id: "app-1", name: "Acme", logo: "/logo.png", appKey: "KEY-1" };

describe("frontendController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("resolveFrontendApp", () => {
    test("requires appKey", async () => {
      const res = mockResponse();
      const next = jest.fn();

      await resolveFrontendApp({ query: {}, headers: {} }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "appKey is required" });
      expect(next).not.toHaveBeenCalled();
    });

    test("404s when no active application matches the appKey", async () => {
      Application.findOne.mockResolvedValue(null);
      const res = mockResponse();
      const next = jest.fn();

      await resolveFrontendApp({ query: { appKey: "missing" }, headers: {} }, res, next);

      expect(Application.findOne).toHaveBeenCalledWith({ appKey: "missing", status: "active" });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).not.toHaveBeenCalled();
    });

    test("rejects a lang not in the application's allowed languages", async () => {
      Application.findOne.mockResolvedValue(app);
      ApplicationSetting.findOne.mockReturnValue(queryChain({ languages: ["en", "fr"] }));
      const res = mockResponse();
      const next = jest.fn();

      await resolveFrontendApp({ query: { appKey: "KEY-1", lang: "fa" }, headers: {} }, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "lang must be one of: en, fr" });
      expect(next).not.toHaveBeenCalled();
    });

    test("defaults lang to the first allowed language and attaches app/settings", async () => {
      Application.findOne.mockResolvedValue(app);
      ApplicationSetting.findOne.mockReturnValue(queryChain({ languages: ["fr", "en"] }));
      const req = { query: { appKey: "KEY-1" }, headers: {} };
      const res = mockResponse();
      const next = jest.fn();

      await resolveFrontendApp(req, res, next);

      expect(req.frontendApp).toBe(app);
      expect(req.langKey).toBe("fr");
      expect(next).toHaveBeenCalled();
    });

    test("accepts appKey from the x-app-key header", async () => {
      Application.findOne.mockResolvedValue(app);
      ApplicationSetting.findOne.mockReturnValue(queryChain(null));
      const req = { query: {}, headers: { "x-app-key": "KEY-1" } };
      const res = mockResponse();
      const next = jest.fn();

      await resolveFrontendApp(req, res, next);

      expect(Application.findOne).toHaveBeenCalledWith({ appKey: "KEY-1", status: "active" });
      expect(req.langKey).toBe("en"); // falls back to LANGUAGE_VALUES when settings/languages is missing
      expect(next).toHaveBeenCalled();
    });
  });

  describe("getFrontendSettings", () => {
    test("returns the public subset, excluding aiApiKey", async () => {
      const req = {
        frontendApp: app,
        frontendSettings: { domain: "acme.com", googleAnalyticsScript: "<script>", languages: ["en"], aiApiKey: "secret" },
      };
      const res = mockResponse();

      await getFrontendSettings(req, res);

      expect(res.json).toHaveBeenCalledWith({
        name: "Acme",
        logo: "/logo.png",
        languages: ["en"],
        domain: "acme.com",
        googleAnalyticsScript: "<script>",
      });
      expect(res.json.mock.calls[0][0]).not.toHaveProperty("aiApiKey");
    });
  });

  describe("getFrontendCategories", () => {
    test("filters to active categories and remaps parentId to the parent's publicId", async () => {
      const parent = {
        _id: "cat-parent",
        publicId: "pub-parent",
        parentId: null,
        translations: [{ langKey: "en", title: "News", slug: "news" }],
      };
      const child = {
        _id: "cat-child",
        publicId: "pub-child",
        parentId: "cat-parent",
        translations: [{ langKey: "en", title: "Sports", slug: "sports" }],
      };
      Category.find.mockReturnValue(queryChain([parent, child]));
      const req = { frontendApp: app, langKey: "en", query: {} };
      const res = mockResponse();

      await getFrontendCategories(req, res);

      expect(Category.find).toHaveBeenCalledWith({ application: "app-1", status: "active" });
      expect(res.json).toHaveBeenCalledWith([
        { publicId: "pub-parent", title: "News", slug: "news", parentPublicId: null },
        { publicId: "pub-child", title: "Sports", slug: "sports", parentPublicId: "pub-parent" },
      ]);
    });

    test("maps parentId=null query param to a root-only filter", async () => {
      Category.find.mockReturnValue(queryChain([]));
      const req = { frontendApp: app, langKey: "en", query: { parentId: "null" } };
      const res = mockResponse();

      await getFrontendCategories(req, res);

      expect(Category.find).toHaveBeenCalledWith({ application: "app-1", status: "active", parentId: null });
    });
  });

  describe("getFrontendTags", () => {
    test("shapes active tags for the resolved language", async () => {
      Tag.find.mockReturnValue(
        queryChain([{ publicId: "pub-1", translations: [{ langKey: "en", title: "Breaking", slug: "breaking" }] }]),
      );
      const req = { frontendApp: app, langKey: "en" };
      const res = mockResponse();

      await getFrontendTags(req, res);

      expect(Tag.find).toHaveBeenCalledWith({ application: "app-1", status: "active" });
      expect(res.json).toHaveBeenCalledWith([{ publicId: "pub-1", title: "Breaking", slug: "breaking" }]);
    });
  });

  describe("getFrontendContents", () => {
    test("returns an empty page when the category filter doesn't resolve", async () => {
      Category.findOne.mockResolvedValue(null);
      const req = { frontendApp: app, langKey: "en", query: { category: "missing" } };
      const res = mockResponse();

      await getFrontendContents(req, res);

      expect(res.json).toHaveBeenCalledWith({ items: [], total: 0, page: 1, limit: 20, totalPages: 1 });
      expect(Content.find).not.toHaveBeenCalled();
    });

    test("excludes content with no published detail in the requested language", async () => {
      const contents = [
        { _id: "content-1", categories: [], tags: [] },
        { _id: "content-2", categories: [], tags: [] },
      ];
      Content.find.mockReturnValue(queryChain(contents));
      ContentDetails.find.mockResolvedValue([
        {
          content: "content-1",
          langKey: "en",
          status: "published",
          slug: "hello",
          title: "Hello",
          headline: "",
          abstract: "",
          publishedAt: "2026-01-01T00:00:00.000Z",
        },
      ]);
      const req = { frontendApp: app, langKey: "en", query: {} };
      const res = mockResponse();

      await getFrontendContents(req, res);

      const payload = res.json.mock.calls[0][0];
      expect(payload.items).toHaveLength(1);
      expect(payload.items[0]).toMatchObject({ id: "content-1", slug: "hello", title: "Hello" });
      expect(payload.total).toBe(1);
    });

    test("rejects an unsupported sortBy", async () => {
      const req = { frontendApp: app, langKey: "en", query: { sortBy: "createdAt" } };
      const res = mockResponse();

      await getFrontendContents(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "sortBy must be one of: title, publishedAt" });
      expect(Content.find).not.toHaveBeenCalled();
    });

    test("rejects an unsupported sortOrder", async () => {
      const req = { frontendApp: app, langKey: "en", query: { sortOrder: "up" } };
      const res = mockResponse();

      await getFrontendContents(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "sortOrder must be one of: asc, desc" });
      expect(Content.find).not.toHaveBeenCalled();
    });

    function contentFixture(id) {
      return { _id: id, categories: [], tags: [] };
    }

    function detailFixture(contentId, title, publishedAt) {
      return {
        content: contentId,
        langKey: "en",
        status: "published",
        slug: title.toLowerCase(),
        title,
        headline: "",
        abstract: "",
        publishedAt,
      };
    }

    test("filters by tag, resolved by publicId or slug, with paging", async () => {
      Tag.findOne.mockResolvedValue({ _id: "tag-1" });
      Content.find.mockReturnValue(queryChain([contentFixture("content-1")]));
      ContentDetails.find.mockResolvedValue([detailFixture("content-1", "Hello", "2026-01-01T00:00:00.000Z")]);
      const req = { frontendApp: app, langKey: "en", query: { tag: "breaking", page: "2", limit: "5" } };
      const res = mockResponse();

      await getFrontendContents(req, res);

      expect(Tag.findOne).toHaveBeenCalledWith({
        application: "app-1",
        status: "active",
        $or: [{ publicId: "breaking" }, { translations: { $elemMatch: { langKey: "en", slug: "breaking" } } }],
      });
      expect(Content.find).toHaveBeenCalledWith(expect.objectContaining({ tags: "tag-1" }));
      const payload = res.json.mock.calls[0][0];
      expect(payload.page).toBe(2);
      expect(payload.limit).toBe(5);
    });

    test("returns an empty page when the tag filter doesn't resolve", async () => {
      Tag.findOne.mockResolvedValue(null);
      const req = { frontendApp: app, langKey: "en", query: { tag: "missing" } };
      const res = mockResponse();

      await getFrontendContents(req, res);

      expect(res.json).toHaveBeenCalledWith({ items: [], total: 0, page: 1, limit: 20, totalPages: 1 });
      expect(Content.find).not.toHaveBeenCalled();
    });

    test("sorts by title within a category filter", async () => {
      Category.findOne.mockResolvedValue({ _id: "cat-1" });
      const contents = [contentFixture("content-1"), contentFixture("content-2")];
      Content.find.mockReturnValue(queryChain(contents));
      ContentDetails.find.mockResolvedValue([
        detailFixture("content-1", "Zebra", "2026-01-01T00:00:00.000Z"),
        detailFixture("content-2", "Apple", "2026-02-01T00:00:00.000Z"),
      ]);
      const req = {
        frontendApp: app,
        langKey: "en",
        query: { category: "news", sortBy: "title", sortOrder: "asc" },
      };
      const res = mockResponse();

      await getFrontendContents(req, res);

      expect(Content.find).toHaveBeenCalledWith(expect.objectContaining({ categories: "cat-1" }));
      const payload = res.json.mock.calls[0][0];
      expect(payload.items.map((c) => c.title)).toEqual(["Apple", "Zebra"]);
    });

    test("sorts by publishedAt (newest first) within a tag filter by default", async () => {
      Tag.findOne.mockResolvedValue({ _id: "tag-1" });
      const contents = [contentFixture("content-1"), contentFixture("content-2")];
      Content.find.mockReturnValue(queryChain(contents));
      ContentDetails.find.mockResolvedValue([
        detailFixture("content-1", "Older", "2026-01-01T00:00:00.000Z"),
        detailFixture("content-2", "Newer", "2026-02-01T00:00:00.000Z"),
      ]);
      const req = { frontendApp: app, langKey: "en", query: { tag: "breaking" } };
      const res = mockResponse();

      await getFrontendContents(req, res);

      const payload = res.json.mock.calls[0][0];
      expect(payload.items.map((c) => c.title)).toEqual(["Newer", "Older"]);
    });
  });

  describe("getFrontendContent", () => {
    test("looks up by ContentDetails.slug when the identifier isn't a Mongo id", async () => {
      ContentDetails.findOne.mockResolvedValue({
        content: "content-1",
        langKey: "en",
        status: "published",
        slug: "hello-world",
        title: "Hello World",
        metadata: {},
        sections: [],
      });
      Content.findOne.mockReturnValue(queryChain({ _id: "content-1", categories: [], tags: [] }));
      const req = { frontendApp: app, langKey: "en", params: { idOrSlug: "hello-world" } };
      const res = mockResponse();

      await getFrontendContent(req, res);

      expect(ContentDetails.findOne).toHaveBeenCalledWith({
        application: "app-1",
        langKey: "en",
        slug: "hello-world",
        status: "published",
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: "content-1", slug: "hello-world", title: "Hello World", sections: [] }),
      );
    });

    test("looks up by content id when the identifier is a 24-char hex string", async () => {
      const id = "507f1f77bcf86cd799439011";
      ContentDetails.findOne.mockResolvedValue({
        content: id,
        langKey: "en",
        status: "published",
        slug: "hello",
        title: "Hello",
        metadata: {},
        sections: [],
      });
      Content.findOne.mockReturnValue(queryChain({ _id: id, categories: [], tags: [] }));
      const req = { frontendApp: app, langKey: "en", params: { idOrSlug: id } };
      const res = mockResponse();

      await getFrontendContent(req, res);

      expect(ContentDetails.findOne).toHaveBeenCalledWith({
        content: id,
        application: "app-1",
        langKey: "en",
        status: "published",
      });
    });

    test("404s when no published detail matches", async () => {
      ContentDetails.findOne.mockResolvedValue(null);
      const req = { frontendApp: app, langKey: "en", params: { idOrSlug: "missing" } };
      const res = mockResponse();

      await getFrontendContent(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Content not found" });
    });
  });

  describe("getFrontendPages", () => {
    test("excludes pages with no published detail in the requested language", async () => {
      Page.find.mockReturnValue(queryChain([{ _id: "page-1", isHomepage: true }]));
      PageDetails.find.mockResolvedValue([
        { page: "page-1", langKey: "en", status: "published", slug: "home", title: "Home", publishedAt: "2026-01-01" },
      ]);
      const req = { frontendApp: app, langKey: "en" };
      const res = mockResponse();

      await getFrontendPages(req, res);

      expect(res.json).toHaveBeenCalledWith([
        { id: "page-1", slug: "home", title: "Home", isHomepage: true, publishedAt: "2026-01-01" },
      ]);
    });
  });

  describe("getFrontendPage", () => {
    test("404s when no published detail matches", async () => {
      PageDetails.findOne.mockResolvedValue(null);
      const req = { frontendApp: app, langKey: "en", params: { idOrSlug: "missing" } };
      const res = mockResponse();

      await getFrontendPage(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Page not found" });
    });

    test("returns the shaped page detail including each section's title and components", async () => {
      PageDetails.findOne.mockResolvedValue({
        page: "page-1",
        langKey: "en",
        status: "published",
        slug: "about",
        title: "About",
        metadata: { author: "Jane" },
        sections: [
          { title: "Intro", isVisible: true, components: [{ type: "text", elements: [{ elementType: "richText", html: "<p>Hi</p>" }] }] },
        ],
      });
      Page.findOne.mockResolvedValue({ _id: "page-1", isHomepage: false });
      const req = { frontendApp: app, langKey: "en", params: { idOrSlug: "about" } };
      const res = mockResponse();

      await getFrontendPage(req, res);

      expect(res.json).toHaveBeenCalledWith({
        id: "page-1",
        slug: "about",
        title: "About",
        isHomepage: false,
        publishedAt: undefined,
        metadata: { author: "Jane" },
        sections: [
          { title: "Intro", isVisible: true, components: [{ type: "text", elements: [{ elementType: "richText", html: "<p>Hi</p>" }] }] },
        ],
      });
    });

    test("filters out sections hidden with isVisible: false", async () => {
      PageDetails.findOne.mockResolvedValue({
        page: "page-1",
        langKey: "en",
        status: "published",
        slug: "about",
        title: "About",
        metadata: {},
        sections: [
          { title: "Shown", isVisible: true, components: [] },
          { title: "Draft banner", isVisible: false, components: [] },
        ],
      });
      Page.findOne.mockResolvedValue({ _id: "page-1", isHomepage: false });
      const req = { frontendApp: app, langKey: "en", params: { idOrSlug: "about" } };
      const res = mockResponse();

      await getFrontendPage(req, res);

      const payload = res.json.mock.calls[0][0];
      expect(payload.sections).toEqual([{ title: "Shown", isVisible: true, components: [] }]);
    });

    test("keeps a section with no isVisible field, for compatibility with data saved before it existed", async () => {
      PageDetails.findOne.mockResolvedValue({
        page: "page-1",
        langKey: "en",
        status: "published",
        slug: "about",
        title: "About",
        metadata: {},
        sections: [{ title: "Old section", components: [] }],
      });
      Page.findOne.mockResolvedValue({ _id: "page-1", isHomepage: false });
      const req = { frontendApp: app, langKey: "en", params: { idOrSlug: "about" } };
      const res = mockResponse();

      await getFrontendPage(req, res);

      const payload = res.json.mock.calls[0][0];
      expect(payload.sections).toEqual([{ title: "Old section", components: [] }]);
    });
  });
});
