import { jest } from "@jest/globals";

const Page = {
  findById: jest.fn(),
};

const PageDetailsCtor: any = {
  findOne: jest.fn(),
  schema: { path: jest.fn(() => ({ enumValues: ["draft", "published"] })) },
};

const ApplicationSetting = {
  findOne: jest.fn(() => ({ select: jest.fn().mockResolvedValue(null) })),
};

const userCanAccessApplication = jest.fn();
const userIsAppAdmin = jest.fn();

const aiGeneratePageTranslation = jest.fn();

jest.unstable_mockModule("../src/models/page/Page.js", () => ({ default: Page }));
jest.unstable_mockModule("../src/models/page/PageDetails.js", () => ({ default: PageDetailsCtor }));
jest.unstable_mockModule("../src/models/application/ApplicationSetting.js", () => ({ default: ApplicationSetting }));
jest.unstable_mockModule("../src/middleware/auth.js", () => ({ userCanAccessApplication, userIsAppAdmin }));
jest.unstable_mockModule("../src/services/aiTranslationService.js", () => ({
  generatePageTranslation: aiGeneratePageTranslation,
}));

const { generatePageTranslation } = (await import("../src/controllers/pageController.js")) as any;

function mockResponse() {
  const res: any = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

function mockUser(applications = ["app-1"], role = "WebSiteContentCreator") {
  return { role, applications: applications.map((_id) => ({ _id })) };
}

function makePageDoc(overrides: any = {}) {
  return { _id: "page-1", application: "app-1", isHomepage: false, ...overrides };
}

const validDraft = {
  langKey: "fr",
  title: "Bonjour",
  status: "draft",
  metadata: { keywords: [], author: "", description: "" },
  sections: [{ title: "S", components: [{ type: "cards", elements: [{ elementType: "card", title: "Un" }] }] }],
};

describe("pageController — generatePageTranslation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    userCanAccessApplication.mockReturnValue(true);
    userIsAppAdmin.mockReturnValue(true);
    ApplicationSetting.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
  });

  test("generates a translation, validates its sections, and returns it with status 200", async () => {
    Page.findById.mockResolvedValue(makePageDoc());
    PageDetailsCtor.findOne.mockResolvedValue({ title: "Hello", toObject: () => ({ title: "Hello" }) });
    aiGeneratePageTranslation.mockResolvedValue(validDraft);
    const res = mockResponse();

    await generatePageTranslation(
      { params: { id: "page-1" }, body: { sourceLangKey: "en", targetLangKey: "fr" }, user: mockUser() },
      res,
    );

    expect(aiGeneratePageTranslation).toHaveBeenCalledWith(
      expect.objectContaining({ applicationId: "app-1", sourceLangKey: "en", targetLangKey: "fr" }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(validDraft);
  });

  test("a WebsiteContentCreator can generate (userCanAccessApplication gates this, not userIsAppAdmin)", async () => {
    Page.findById.mockResolvedValue(makePageDoc());
    PageDetailsCtor.findOne.mockResolvedValue({ title: "Hello", toObject: () => ({ title: "Hello" }) });
    aiGeneratePageTranslation.mockResolvedValue(validDraft);
    userIsAppAdmin.mockReturnValue(false);
    const res = mockResponse();

    await generatePageTranslation(
      {
        params: { id: "page-1" },
        body: { sourceLangKey: "en", targetLangKey: "fr" },
        user: mockUser(["app-1"], "WebSiteContentCreator"),
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("rejects when the user cannot access the application", async () => {
    Page.findById.mockResolvedValue(makePageDoc());
    userCanAccessApplication.mockReturnValue(false);
    const res = mockResponse();

    await generatePageTranslation(
      { params: { id: "page-1" }, body: { sourceLangKey: "en", targetLangKey: "fr" }, user: mockUser() },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(aiGeneratePageTranslation).not.toHaveBeenCalled();
  });

  test("404s when the page doesn't exist", async () => {
    Page.findById.mockResolvedValue(null);
    const res = mockResponse();

    await generatePageTranslation(
      { params: { id: "missing" }, body: { sourceLangKey: "en", targetLangKey: "fr" }, user: mockUser() },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("rejects an unrecognized target language with 400", async () => {
    Page.findById.mockResolvedValue(makePageDoc());
    const res = mockResponse();

    await generatePageTranslation(
      { params: { id: "page-1" }, body: { sourceLangKey: "en", targetLangKey: "de" }, user: mockUser() },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(aiGeneratePageTranslation).not.toHaveBeenCalled();
  });

  test("rejects identical source and target languages with 400", async () => {
    Page.findById.mockResolvedValue(makePageDoc());
    const res = mockResponse();

    await generatePageTranslation(
      { params: { id: "page-1" }, body: { sourceLangKey: "en", targetLangKey: "en" }, user: mockUser() },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("404s when the source translation doesn't exist", async () => {
    Page.findById.mockResolvedValue(makePageDoc());
    PageDetailsCtor.findOne.mockResolvedValue(null);
    const res = mockResponse();

    await generatePageTranslation(
      { params: { id: "page-1" }, body: { sourceLangKey: "en", targetLangKey: "fr" }, user: mockUser() },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(aiGeneratePageTranslation).not.toHaveBeenCalled();
  });

  test("propagates a clear error when the application has no AI API key configured", async () => {
    Page.findById.mockResolvedValue(makePageDoc());
    PageDetailsCtor.findOne.mockResolvedValue({ title: "Hello", toObject: () => ({ title: "Hello" }) });
    const notConfigured = Object.assign(
      new Error("AI translation is not configured for this application. Add an AI API key in the application settings."),
      { status: 400 },
    );
    aiGeneratePageTranslation.mockRejectedValue(notConfigured);
    const res = mockResponse();

    await expect(
      generatePageTranslation(
        { params: { id: "page-1" }, body: { sourceLangKey: "en", targetLangKey: "fr" }, user: mockUser() },
        res,
      ),
    ).rejects.toMatchObject({ status: 400, message: expect.stringContaining("AI API key") });
  });

  test("rejects a generated draft whose sections fail validation with 502", async () => {
    Page.findById.mockResolvedValue(makePageDoc());
    PageDetailsCtor.findOne.mockResolvedValue({ title: "Hello", toObject: () => ({ title: "Hello" }) });
    aiGeneratePageTranslation.mockResolvedValue({
      ...validDraft,
      sections: [{ title: "S", components: [{ type: "not-a-real-component-type", elements: [] }] }],
    });
    const res = mockResponse();

    await generatePageTranslation(
      { params: { id: "page-1" }, body: { sourceLangKey: "en", targetLangKey: "fr" }, user: mockUser() },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(502);
  });
});
