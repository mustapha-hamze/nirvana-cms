import { jest } from "@jest/globals";

function makeContentDetailsInstance(fields = {}) {
  const instance = {
    content: fields.content,
    application: fields.application,
    langKey: fields.langKey,
    title: fields.title,
    slug: fields.slug,
    headline: fields.headline,
    abstract: fields.abstract,
    status: fields.status ?? "draft",
    isDeleted: fields.isDeleted ?? false,
    metadata: fields.metadata ?? { keywords: [], author: "", description: "" },
    sections: fields.sections ?? [],
  };
  instance.save = jest.fn().mockResolvedValue(instance);
  return instance;
}

const ContentDetailsCtor = jest.fn((fields) => makeContentDetailsInstance(fields));
ContentDetailsCtor.schema = {
  path: jest.fn(() => ({ enumValues: ["draft", "published"] })),
};
ContentDetailsCtor.findOne = jest.fn();
ContentDetailsCtor.find = jest.fn();
ContentDetailsCtor.exists = jest.fn();
ContentDetailsCtor.findOneAndUpdate = jest.fn();
ContentDetailsCtor.updateMany = jest.fn();

function makeContentInstance(fields = {}) {
  const instance = {
    _id: fields._id ?? "content-1",
    application: fields.application ?? "app-1",
    categories: fields.categories ?? [],
    tags: fields.tags ?? [],
    populate: jest.fn().mockResolvedValue(undefined),
  };
  instance.toObject = jest.fn(() => ({
    _id: instance._id,
    application: instance.application,
    categories: instance.categories,
    tags: instance.tags,
  }));
  return instance;
}

const Content = {
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
};

const Application = {
  exists: jest.fn(),
};

const ApplicationSetting = {
  findOne: jest.fn(() => ({ select: jest.fn().mockResolvedValue(null) })),
};

const userCanAccessApplication = jest.fn();
const userIsAppAdmin = jest.fn();

jest.unstable_mockModule("../src/models/content/Content.js", () => ({ default: Content }));
jest.unstable_mockModule("../src/models/content/ContentDetails.js", () => ({ default: ContentDetailsCtor }));
jest.unstable_mockModule("../src/models/application/Application.js", () => ({ default: Application }));
jest.unstable_mockModule("../src/models/application/ApplicationSetting.js", () => ({ default: ApplicationSetting }));
jest.unstable_mockModule("../src/middleware/auth.js", () => ({ userCanAccessApplication, userIsAppAdmin }));

const { createContent, upsertContentDetails } = await import("../src/controllers/contentController.js");

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

const validTextImageSection = {
  type: "text-image",
  elements: [
    { elementType: "paragraph", text: "hello world" },
    { elementType: "image", url: "https://example.com/a.png", alt: "an image" },
  ],
};

describe("contentController — dynamic section validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    userCanAccessApplication.mockReturnValue(true);
    userIsAppAdmin.mockReturnValue(true);
    ApplicationSetting.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
  });

  describe("createContent", () => {
    test("rejects a section with an unknown type", async () => {
      Application.exists.mockResolvedValue(true);
      const res = mockResponse();

      await createContent(
        {
          body: {
            application: "app-1",
            details: [{ langKey: "en", title: "T", sections: [{ type: "bogus", elements: [] }] }],
          },
          user: mockUser(),
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining("sections[0]: type must be one of"),
      });
      expect(Content.create).not.toHaveBeenCalled();
    });

    test("rejects a section whose element count doesn't match its layout", async () => {
      Application.exists.mockResolvedValue(true);
      const res = mockResponse();

      await createContent(
        {
          body: {
            application: "app-1",
            details: [
              {
                langKey: "en",
                title: "T",
                sections: [
                  {
                    type: "image-only",
                    elements: [
                      { elementType: "image", url: "https://example.com/a.png", alt: "a" },
                      { elementType: "image", url: "https://example.com/b.png", alt: "b" },
                    ],
                  },
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
        message: expect.stringContaining("must contain exactly 1 element(s)"),
      });
      expect(Content.create).not.toHaveBeenCalled();
    });

    test("rejects a section whose elements are in the wrong order/type for their slot", async () => {
      Application.exists.mockResolvedValue(true);
      const res = mockResponse();

      await createContent(
        {
          body: {
            application: "app-1",
            details: [
              {
                langKey: "en",
                title: "T",
                sections: [
                  {
                    type: "text-image",
                    elements: [
                      // Wrong order: text-image expects text first, image second.
                      { elementType: "image", url: "https://example.com/a.png", alt: "a" },
                      { elementType: "paragraph", text: "hello" },
                    ],
                  },
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
        message: expect.stringContaining("element at position 0 must be one of"),
      });
      expect(Content.create).not.toHaveBeenCalled();
    });

    test("creates content and persists valid sections onto each ContentDetails", async () => {
      Application.exists.mockResolvedValue(true);
      const contentInstance = makeContentInstance({});
      Content.create.mockResolvedValue(contentInstance);
      const res = mockResponse();

      await createContent(
        {
          body: {
            application: "app-1",
            details: [{ langKey: "en", title: "T", sections: [validTextImageSection] }],
          },
          user: mockUser(),
        },
        res,
      );

      expect(Content.create).toHaveBeenCalledWith({ application: "app-1", categories: [], tags: [] });
      expect(ContentDetailsCtor).toHaveBeenCalledTimes(1);
      const createdDetail = ContentDetailsCtor.mock.results[0].value;
      expect(createdDetail.sections).toEqual([validTextImageSection]);
      expect(createdDetail.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test("maps a Mongoose ValidationError from .save() to a 400 and rolls back the Content doc", async () => {
      Application.exists.mockResolvedValue(true);
      const contentInstance = makeContentInstance({});
      Content.create.mockResolvedValue(contentInstance);
      const res = mockResponse();

      // Force the per-language ContentDetails save to fail like a real Mongoose
      // discriminator/required-field validation error would.
      ContentDetailsCtor.mockImplementationOnce((fields) => {
        const instance = makeContentDetailsInstance(fields);
        instance.save = jest.fn().mockRejectedValue({
          name: "ValidationError",
          message: "ContentDetails validation failed: sections.0.elements.0.alt: Path `alt` is required.",
        });
        return instance;
      });

      await createContent(
        {
          body: {
            application: "app-1",
            details: [{ langKey: "en", title: "T", sections: [validTextImageSection] }],
          },
          user: mockUser(),
        },
        res,
      );

      expect(Content.findByIdAndDelete).toHaveBeenCalledWith(contentInstance._id);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining("Path `alt` is required"),
      });
    });
  });

  describe("upsertContentDetails", () => {
    test("rejects a non-array sections payload", async () => {
      Content.findById.mockResolvedValue(makeContentInstance({ application: "app-1" }));
      const res = mockResponse();

      await upsertContentDetails(
        { params: { id: "content-1", langKey: "en" }, body: { title: "T", sections: "oops" }, user: mockUser() },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "sections must be an array" });
    });

    test("omitting sections from the request leaves existing sections untouched", async () => {
      Content.findById.mockResolvedValue(makeContentInstance({ application: "app-1" }));
      const existingSections = [
        { type: "document", elements: [{ elementType: "paragraph", text: "existing" }] },
      ];
      const existingDetail = makeContentDetailsInstance({
        content: "content-1",
        application: "app-1",
        langKey: "en",
        title: "Old title",
        slug: "old-title",
        sections: existingSections,
      });
      ContentDetailsCtor.findOne.mockResolvedValue(existingDetail);
      const res = mockResponse();

      await upsertContentDetails(
        { params: { id: "content-1", langKey: "en" }, body: { title: "New title" }, user: mockUser() },
        res,
      );

      expect(existingDetail.sections).toBe(existingSections);
      expect(existingDetail.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(existingDetail);
    });

    test("persists new valid sections onto an existing ContentDetails", async () => {
      Content.findById.mockResolvedValue(makeContentInstance({ application: "app-1" }));
      const existingDetail = makeContentDetailsInstance({
        content: "content-1",
        application: "app-1",
        langKey: "en",
        title: "Old title",
        slug: "old-title",
        sections: [],
      });
      ContentDetailsCtor.findOne.mockResolvedValue(existingDetail);
      const res = mockResponse();

      await upsertContentDetails(
        {
          params: { id: "content-1", langKey: "en" },
          body: { title: "New title", sections: [validTextImageSection] },
          user: mockUser(),
        },
        res,
      );

      expect(existingDetail.sections).toEqual([validTextImageSection]);
      expect(existingDetail.save).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalledWith(400);
    });

    test("rejects sections with the wrong composition for their layout", async () => {
      Content.findById.mockResolvedValue(makeContentInstance({ application: "app-1" }));
      ContentDetailsCtor.findOne.mockResolvedValue(null);
      const res = mockResponse();

      await upsertContentDetails(
        {
          params: { id: "content-1", langKey: "en" },
          body: {
            title: "T",
            sections: [{ type: "video-only", elements: [{ elementType: "paragraph", text: "wrong type" }] }],
          },
          user: mockUser(),
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining("element at position 0 must be one of"),
      });
    });

    test("maps a Mongoose ValidationError from .save() to a 400", async () => {
      Content.findById.mockResolvedValue(makeContentInstance({ application: "app-1" }));
      const existingDetail = makeContentDetailsInstance({
        content: "content-1",
        application: "app-1",
        langKey: "en",
        title: "Old title",
        slug: "old-title",
      });
      existingDetail.save = jest.fn().mockRejectedValue({
        name: "ValidationError",
        message: "ContentDetails validation failed: sections.0.elements.0.url: Path `url` is invalid.",
      });
      ContentDetailsCtor.findOne.mockResolvedValue(existingDetail);
      const res = mockResponse();

      await upsertContentDetails(
        {
          params: { id: "content-1", langKey: "en" },
          body: { title: "T", sections: [validTextImageSection] },
          user: mockUser(),
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining("Path `url` is invalid"),
      });
    });
  });
});
