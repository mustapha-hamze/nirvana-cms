import { jest } from "@jest/globals";

// Mimics a real Mongoose Query: every chain method returns itself, and it
// resolves to `value` however many (or few) chain calls preceded the await.
// Same helper as frontendController.test.ts.
function queryChain(value: unknown) {
  const chain: any = {
    populate: jest.fn(() => chain),
    then: (resolve: any, reject: any) => Promise.resolve(value).then(resolve, reject),
  };
  return chain;
}

const Content = {
  findById: jest.fn(),
};

const ContentDetailsCtor: any = {
  findOne: jest.fn(),
  schema: { path: jest.fn(() => ({ enumValues: ["draft", "published"] })) },
};

const ApplicationSetting = {
  findOne: jest.fn(() => ({ select: jest.fn().mockResolvedValue(null) })),
};

const userCanAccessApplication = jest.fn();
const userIsAppAdmin = jest.fn();

const aiGenerateContentTranslation = jest.fn();

jest.unstable_mockModule("../src/models/content/Content.js", () => ({ default: Content }));
jest.unstable_mockModule("../src/models/content/ContentDetails.js", () => ({ default: ContentDetailsCtor }));
jest.unstable_mockModule("../src/models/application/ApplicationSetting.js", () => ({ default: ApplicationSetting }));
jest.unstable_mockModule("../src/middleware/auth.js", () => ({ userCanAccessApplication, userIsAppAdmin }));
jest.unstable_mockModule("../src/services/aiTranslationService.js", () => ({
  generateContentTranslation: aiGenerateContentTranslation,
}));

const { generateContentTranslation } = (await import("../src/controllers/contentController.js")) as any;

function mockResponse() {
  const res: any = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

function mockUser(applications = ["app-1"], role = "WebSiteContentCreator") {
  return { role, applications: applications.map((_id) => ({ _id })) };
}

function makeContentDoc(overrides: any = {}) {
  return { _id: "content-1", application: "app-1", categories: [], tags: [], ...overrides };
}

const validDraft = {
  langKey: "fr",
  title: "Bonjour",
  headline: "",
  abstract: "",
  status: "draft",
  metadata: { keywords: [], author: "", description: "" },
  sections: [{ type: "text-1-col", elements: [{ elementType: "paragraph", text: "Bonjour" }] }],
};

describe("contentController — generateContentTranslation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    userCanAccessApplication.mockReturnValue(true);
    userIsAppAdmin.mockReturnValue(true);
    ApplicationSetting.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
  });

  test("generates a translation, validates its sections, and returns it with status 200", async () => {
    Content.findById.mockReturnValue(queryChain(makeContentDoc()));
    ContentDetailsCtor.findOne.mockResolvedValue({
      title: "Hello",
      toObject: () => ({ title: "Hello" }),
    });
    aiGenerateContentTranslation.mockResolvedValue(validDraft);
    const res = mockResponse();

    await generateContentTranslation(
      { params: { id: "content-1" }, body: { sourceLangKey: "en", targetLangKey: "fr" }, user: mockUser() },
      res,
    );

    expect(aiGenerateContentTranslation).toHaveBeenCalledWith(
      expect.objectContaining({ applicationId: "app-1", sourceLangKey: "en", targetLangKey: "fr" }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(validDraft);
  });

  test("a WebsiteContentCreator can generate (userCanAccessApplication gates this, not userIsAppAdmin)", async () => {
    Content.findById.mockReturnValue(queryChain(makeContentDoc()));
    ContentDetailsCtor.findOne.mockResolvedValue({ title: "Hello", toObject: () => ({ title: "Hello" }) });
    aiGenerateContentTranslation.mockResolvedValue(validDraft);
    userIsAppAdmin.mockReturnValue(false);
    const res = mockResponse();

    await generateContentTranslation(
      {
        params: { id: "content-1" },
        body: { sourceLangKey: "en", targetLangKey: "fr" },
        user: mockUser(["app-1"], "WebSiteContentCreator"),
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("rejects when the user cannot access the application", async () => {
    Content.findById.mockReturnValue(queryChain(makeContentDoc()));
    userCanAccessApplication.mockReturnValue(false);
    const res = mockResponse();

    await generateContentTranslation(
      { params: { id: "content-1" }, body: { sourceLangKey: "en", targetLangKey: "fr" }, user: mockUser() },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(aiGenerateContentTranslation).not.toHaveBeenCalled();
  });

  test("404s when the content item doesn't exist", async () => {
    Content.findById.mockReturnValue(queryChain(null));
    const res = mockResponse();

    await generateContentTranslation(
      { params: { id: "missing" }, body: { sourceLangKey: "en", targetLangKey: "fr" }, user: mockUser() },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("rejects an unrecognized target language with 400", async () => {
    Content.findById.mockReturnValue(queryChain(makeContentDoc()));
    const res = mockResponse();

    await generateContentTranslation(
      { params: { id: "content-1" }, body: { sourceLangKey: "en", targetLangKey: "de" }, user: mockUser() },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(aiGenerateContentTranslation).not.toHaveBeenCalled();
  });

  test("rejects identical source and target languages with 400", async () => {
    Content.findById.mockReturnValue(queryChain(makeContentDoc()));
    const res = mockResponse();

    await generateContentTranslation(
      { params: { id: "content-1" }, body: { sourceLangKey: "en", targetLangKey: "en" }, user: mockUser() },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("404s when the source translation doesn't exist", async () => {
    Content.findById.mockReturnValue(queryChain(makeContentDoc()));
    ContentDetailsCtor.findOne.mockResolvedValue(null);
    const res = mockResponse();

    await generateContentTranslation(
      { params: { id: "content-1" }, body: { sourceLangKey: "en", targetLangKey: "fr" }, user: mockUser() },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(aiGenerateContentTranslation).not.toHaveBeenCalled();
  });

  test("propagates a clear error when the application has no AI API key configured", async () => {
    Content.findById.mockReturnValue(queryChain(makeContentDoc()));
    ContentDetailsCtor.findOne.mockResolvedValue({ title: "Hello", toObject: () => ({ title: "Hello" }) });
    const notConfigured = Object.assign(
      new Error("AI translation is not configured for this application. Add an AI API key in the application settings."),
      { status: 400 },
    );
    aiGenerateContentTranslation.mockRejectedValue(notConfigured);
    const res = mockResponse();

    await expect(
      generateContentTranslation(
        { params: { id: "content-1" }, body: { sourceLangKey: "en", targetLangKey: "fr" }, user: mockUser() },
        res,
      ),
    ).rejects.toMatchObject({ status: 400, message: expect.stringContaining("AI API key") });
  });

  test("rejects a generated draft whose sections fail validation with 502", async () => {
    Content.findById.mockReturnValue(queryChain(makeContentDoc()));
    ContentDetailsCtor.findOne.mockResolvedValue({ title: "Hello", toObject: () => ({ title: "Hello" }) });
    aiGenerateContentTranslation.mockResolvedValue({
      ...validDraft,
      sections: [{ type: "not-a-real-section-type", elements: [] }],
    });
    const res = mockResponse();

    await generateContentTranslation(
      { params: { id: "content-1" }, body: { sourceLangKey: "en", targetLangKey: "fr" }, user: mockUser() },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(502);
  });
});
