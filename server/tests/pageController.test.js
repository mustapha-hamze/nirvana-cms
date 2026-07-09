import { jest } from "@jest/globals";

function makePageDetailsInstance(fields = {}) {
  const instance = {
    page: fields.page,
    application: fields.application,
    langKey: fields.langKey,
    title: fields.title,
    slug: fields.slug,
    status: fields.status ?? "draft",
    isDeleted: fields.isDeleted ?? false,
    metadata: fields.metadata ?? { keywords: [], author: "", description: "" },
    sections: fields.sections ?? [],
  };
  instance.save = jest.fn().mockResolvedValue(instance);
  return instance;
}

const PageDetailsCtor = jest.fn((fields) => makePageDetailsInstance(fields));
PageDetailsCtor.schema = {
  path: jest.fn(() => ({ enumValues: ["draft", "published"] })),
};
PageDetailsCtor.findOne = jest.fn();
PageDetailsCtor.find = jest.fn();
PageDetailsCtor.exists = jest.fn();
PageDetailsCtor.findOneAndUpdate = jest.fn();
PageDetailsCtor.updateMany = jest.fn();

function makePageInstance(fields = {}) {
  const instance = {
    _id: fields._id ?? "page-1",
    application: fields.application ?? "app-1",
    isHomepage: fields.isHomepage ?? false,
    save: jest.fn().mockResolvedValue(undefined),
  };
  instance.toObject = jest.fn(() => ({
    _id: instance._id,
    application: instance.application,
    isHomepage: instance.isHomepage,
  }));
  return instance;
}

const Page = {
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
  updateMany: jest.fn(),
};

const Application = {
  exists: jest.fn(),
};

const ApplicationSetting = {
  findOne: jest.fn(() => ({ select: jest.fn().mockResolvedValue(null) })),
};

const userCanAccessApplication = jest.fn();
const userIsAppAdmin = jest.fn();

jest.unstable_mockModule("../src/models/page/Page.js", () => ({ default: Page }));
jest.unstable_mockModule("../src/models/page/PageDetails.js", () => ({ default: PageDetailsCtor }));
jest.unstable_mockModule("../src/models/application/Application.js", () => ({ default: Application }));
jest.unstable_mockModule("../src/models/application/ApplicationSetting.js", () => ({ default: ApplicationSetting }));
jest.unstable_mockModule("../src/middleware/auth.js", () => ({ userCanAccessApplication, userIsAppAdmin }));

const { createPage, updatePage, deletePage, upsertPageDetails } = await import(
  "../src/controllers/pageController.js"
);

function mockResponse() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
    send: jest.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

function mockUser(applications = ["app-1"], role = "WebSiteAdmin") {
  return {
    role,
    applications: applications.map((_id) => ({ _id })),
  };
}

// A section is now a generic container: `{ title, components: [...] }` where
// each component is the old `{type, elements}` shape (see
// models/page/Section.js). validCardsComponent below is one such component.
const validCardsComponent = {
  type: "cards",
  elements: [
    { elementType: "card", title: "One" },
    { elementType: "card", title: "Two" },
  ],
};

describe("pageController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    userCanAccessApplication.mockReturnValue(true);
    userIsAppAdmin.mockReturnValue(true);
    ApplicationSetting.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
  });

  describe("createPage — section validation", () => {
    test("rejects a component with an unknown type", async () => {
      Application.exists.mockResolvedValue(true);
      const res = mockResponse();

      await createPage(
        {
          body: {
            application: "app-1",
            details: [
              { langKey: "en", title: "About", sections: [{ title: "S", components: [{ type: "bogus", elements: [] }] }] },
            ],
          },
          user: mockUser(),
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining("sections[0].components[0]: type must be one of"),
      });
      expect(Page.create).not.toHaveBeenCalled();
    });

    test("rejects a component with fewer elements than its type allows", async () => {
      Application.exists.mockResolvedValue(true);
      const res = mockResponse();

      await createPage(
        {
          body: {
            application: "app-1",
            details: [
              {
                langKey: "en",
                title: "About",
                // "steps" requires at least 2 elements (see PAGE_COMPONENT_LAYOUTS).
                sections: [
                  { title: "S", components: [{ type: "steps", elements: [{ elementType: "step", title: "Only one" }] }] },
                ],
              },
            ],
          },
          user: mockUser(),
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining("must contain between 2 and 10 element(s)"),
      });
      expect(Page.create).not.toHaveBeenCalled();
    });

    test("rejects a component containing the wrong element type", async () => {
      Application.exists.mockResolvedValue(true);
      const res = mockResponse();

      await createPage(
        {
          body: {
            application: "app-1",
            details: [
              {
                langKey: "en",
                title: "About",
                sections: [
                  { title: "S", components: [{ type: "team", elements: [{ elementType: "card", title: "Not a team member" }] }] },
                ],
              },
            ],
          },
          user: mockUser(),
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining('every element must be of type "teamMember"'),
      });
      expect(Page.create).not.toHaveBeenCalled();
    });

    test("creates the page and persists valid sections/components onto each PageDetails", async () => {
      Application.exists.mockResolvedValue(true);
      const pageInstance = makePageInstance({});
      Page.create.mockResolvedValue(pageInstance);
      const res = mockResponse();
      const section = { title: "Our Channels", components: [validCardsComponent] };

      await createPage(
        {
          body: {
            application: "app-1",
            details: [{ langKey: "en", title: "About Us", sections: [section] }],
          },
          user: mockUser(),
        },
        res,
      );

      expect(Page.create).toHaveBeenCalledWith({ application: "app-1", isHomepage: false });
      expect(PageDetailsCtor).toHaveBeenCalledTimes(1);
      const createdDetail = PageDetailsCtor.mock.results[0].value;
      expect(createdDetail.sections).toEqual([section]);
      expect(createdDetail.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test("accepts a section with an empty components array (freshly added, not yet filled in)", async () => {
      Application.exists.mockResolvedValue(true);
      const pageInstance = makePageInstance({});
      Page.create.mockResolvedValue(pageInstance);
      const res = mockResponse();

      await createPage(
        {
          body: {
            application: "app-1",
            details: [{ langKey: "en", title: "About", sections: [{ title: "Empty section", components: [] }] }],
          },
          user: mockUser(),
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test("rejects a statistics component below its minimum of 2 elements", async () => {
      Application.exists.mockResolvedValue(true);
      const res = mockResponse();

      await createPage(
        {
          body: {
            application: "app-1",
            details: [
              {
                langKey: "en",
                title: "About",
                sections: [
                  { title: "S", components: [{ type: "statistics", elements: [{ elementType: "statItem", value: "10K+" }] }] },
                ],
              },
            ],
          },
          user: mockUser(),
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining("must contain between 2 and 12 element(s)"),
      });
      expect(Page.create).not.toHaveBeenCalled();
    });

    test("rejects a map component containing the wrong element type", async () => {
      Application.exists.mockResolvedValue(true);
      const res = mockResponse();

      await createPage(
        {
          body: {
            application: "app-1",
            details: [
              {
                langKey: "en",
                title: "Contact",
                sections: [{ title: "S", components: [{ type: "map", elements: [{ elementType: "image", url: "" }] }] }],
              },
            ],
          },
          user: mockUser(),
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining('every element must be of type "map"'),
      });
      expect(Page.create).not.toHaveBeenCalled();
    });

    test("persists a section title alongside its components", async () => {
      Application.exists.mockResolvedValue(true);
      const pageInstance = makePageInstance({});
      Page.create.mockResolvedValue(pageInstance);
      const res = mockResponse();
      const titledSection = { title: "Our Channels", components: [validCardsComponent] };

      await createPage(
        {
          body: {
            application: "app-1",
            details: [{ langKey: "en", title: "About", sections: [titledSection] }],
          },
          user: mockUser(),
        },
        res,
      );

      const createdDetail = PageDetailsCtor.mock.results[0].value;
      expect(createdDetail.sections[0].title).toBe("Our Channels");
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test("accepts a section with no title, for compatibility with data saved before the field existed", async () => {
      Application.exists.mockResolvedValue(true);
      const pageInstance = makePageInstance({});
      Page.create.mockResolvedValue(pageInstance);
      const res = mockResponse();

      await createPage(
        {
          body: {
            application: "app-1",
            // No `title` on this section — validatePageSections never
            // inspects it, so a titleless section isn't rejected here.
            // (The '' default itself is applied by Mongoose on the real
            // Section schema, which this mocked PageDetails doesn't run —
            // that's covered by the schema, not the controller.)
            details: [{ langKey: "en", title: "About", sections: [{ components: [validCardsComponent] }] }],
          },
          user: mockUser(),
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test("accepts a valid gallery component mixing image and document items", async () => {
      Application.exists.mockResolvedValue(true);
      const pageInstance = makePageInstance({});
      Page.create.mockResolvedValue(pageInstance);
      const res = mockResponse();
      const gallerySection = {
        title: "Gallery",
        components: [
          {
            type: "gallery",
            elements: [
              { elementType: "galleryItem", mediaType: "image", url: "https://example.com/a.png" },
              { elementType: "galleryItem", mediaType: "document", url: "https://example.com/brochure.pdf", fileName: "Brochure.pdf" },
            ],
          },
        ],
      };

      await createPage(
        {
          body: {
            application: "app-1",
            details: [{ langKey: "en", title: "Gallery", sections: [gallerySection] }],
          },
          user: mockUser(),
        },
        res,
      );

      const createdDetail = PageDetailsCtor.mock.results[0].value;
      expect(createdDetail.sections).toEqual([gallerySection]);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test("rejects a section with more components than the per-section limit", async () => {
      Application.exists.mockResolvedValue(true);
      const res = mockResponse();
      const tooManyComponents = Array.from({ length: 31 }, () => ({ ...validCardsComponent }));

      await createPage(
        {
          body: {
            application: "app-1",
            details: [{ langKey: "en", title: "About", sections: [{ title: "S", components: tooManyComponents }] }],
          },
          user: mockUser(),
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining("a section may have at most 30 components"),
      });
      expect(Page.create).not.toHaveBeenCalled();
    });
  });

  describe("createPage — homepage", () => {
    test("a plain content creator cannot create a page as the homepage", async () => {
      Application.exists.mockResolvedValue(true);
      userIsAppAdmin.mockReturnValue(false);
      const res = mockResponse();

      await createPage(
        {
          body: { application: "app-1", isHomepage: true, details: [{ langKey: "en", title: "Home" }] },
          user: mockUser(["app-1"], "WebSiteContentCreator"),
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(403);
      expect(Page.create).not.toHaveBeenCalled();
    });

    test("demotes the existing homepage before creating a new one", async () => {
      Application.exists.mockResolvedValue(true);
      Page.updateMany.mockResolvedValue({});
      const pageInstance = makePageInstance({ isHomepage: true });
      Page.create.mockResolvedValue(pageInstance);
      const res = mockResponse();

      await createPage(
        {
          body: { application: "app-1", isHomepage: true, details: [{ langKey: "en", title: "Home" }] },
          user: mockUser(),
        },
        res,
      );

      expect(Page.updateMany).toHaveBeenCalledWith(
        { application: "app-1", isHomepage: true, _id: { $ne: null } },
        { isHomepage: false },
      );
      expect(Page.create).toHaveBeenCalledWith({ application: "app-1", isHomepage: true });
    });
  });

  describe("updatePage", () => {
    test("demotes the previous homepage when promoting a different page", async () => {
      const page = makePageInstance({ _id: "page-2", isHomepage: false });
      Page.findById.mockResolvedValue(page);
      Page.updateMany.mockResolvedValue({});
      const res = mockResponse();

      await updatePage(
        { params: { id: "page-2" }, body: { isHomepage: true }, user: mockUser() },
        res,
      );

      expect(Page.updateMany).toHaveBeenCalledWith(
        { application: "app-1", isHomepage: true, _id: { $ne: "page-2" } },
        { isHomepage: false },
      );
      expect(page.isHomepage).toBe(true);
      expect(page.save).toHaveBeenCalled();
    });

    test("rejects non-admins", async () => {
      userIsAppAdmin.mockReturnValue(false);
      Page.findById.mockResolvedValue(makePageInstance({}));
      const res = mockResponse();

      await updatePage(
        { params: { id: "page-1" }, body: { isHomepage: true }, user: mockUser([], "WebSiteContentCreator") },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("deletePage", () => {
    test("soft deletes the page and cascades to its PageDetails", async () => {
      const page = makePageInstance({ _id: "page-1" });
      Page.findById.mockResolvedValue(page);
      PageDetailsCtor.updateMany.mockResolvedValue({});
      const res = mockResponse();

      await deletePage({ params: { id: "page-1" }, user: mockUser() }, res);

      expect(page.isDeleted).toBe(true);
      expect(page.save).toHaveBeenCalled();
      expect(PageDetailsCtor.updateMany).toHaveBeenCalledWith({ page: "page-1" }, { isDeleted: true });
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });

  describe("upsertPageDetails", () => {
    test("auto-generates a slug from the title for a new translation", async () => {
      Page.findById.mockResolvedValue(makePageInstance({ _id: "page-1" }));
      PageDetailsCtor.findOne.mockResolvedValue(null);
      PageDetailsCtor.exists.mockResolvedValue(false);
      const res = mockResponse();

      await upsertPageDetails(
        {
          params: { id: "page-1", langKey: "en" },
          body: { title: "Contact Us" },
          user: mockUser(),
        },
        res,
      );

      const savedDetail = PageDetailsCtor.mock.results.at(-1).value;
      expect(savedDetail.slug).toBe("contact-us");
      expect(savedDetail.save).toHaveBeenCalled();
    });

    test("keeps the existing slug stable when only the title changes", async () => {
      Page.findById.mockResolvedValue(makePageInstance({ _id: "page-1" }));
      const existing = makePageDetailsInstance({
        page: "page-1",
        langKey: "en",
        title: "Contact",
        slug: "contact",
        status: "draft",
      });
      PageDetailsCtor.findOne.mockResolvedValue(existing);
      const res = mockResponse();

      await upsertPageDetails(
        {
          params: { id: "page-1", langKey: "en" },
          body: { title: "Contact Us — Updated" },
          user: mockUser(),
        },
        res,
      );

      expect(existing.slug).toBe("contact");
      expect(existing.title).toBe("Contact Us — Updated");
    });

    test("a plain content creator cannot change page status", async () => {
      Page.findById.mockResolvedValue(makePageInstance({ _id: "page-1" }));
      const existing = makePageDetailsInstance({
        page: "page-1",
        langKey: "en",
        title: "Contact",
        slug: "contact",
        status: "draft",
      });
      PageDetailsCtor.findOne.mockResolvedValue(existing);
      userIsAppAdmin.mockReturnValue(false);
      const res = mockResponse();

      await upsertPageDetails(
        {
          params: { id: "page-1", langKey: "en" },
          body: { title: "Contact", status: "published" },
          user: mockUser([], "WebSiteContentCreator"),
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(403);
      expect(existing.save).not.toHaveBeenCalled();
    });
  });
});
