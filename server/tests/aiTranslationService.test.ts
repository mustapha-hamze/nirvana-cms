import { jest } from "@jest/globals";
import { DEFAULT_AI_MODEL } from "../src/constants/ai.js";

const Application = { findById: jest.fn() };
const ApplicationSetting = { findOne: jest.fn() };

jest.unstable_mockModule("../src/models/application/Application.js", () => ({ default: Application }));
jest.unstable_mockModule("../src/models/application/ApplicationSetting.js", () => ({ default: ApplicationSetting }));

const { generateContentTranslation } = (await import("../src/services/aiTranslationService.js")) as any;

function mockAppLookup() {
  Application.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue({ name: "Acme", description: "A test app" }),
  });
}

function mockSettingsLookup(settingsFields: Record<string, unknown>) {
  ApplicationSetting.findOne.mockReturnValue({
    select: jest.fn().mockResolvedValue(settingsFields),
  });
}

function mockFetchOnce(jsonBody: unknown) {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({ choices: [{ message: { content: JSON.stringify(jsonBody) } }] }),
  });
  (global as any).fetch = fetchMock;
  return fetchMock;
}

const sourceDetail = {
  title: "Hello",
  headline: "Head",
  abstract: "Abs",
  metadata: { keywords: [], author: "", description: "" },
  sections: [],
};

describe("aiTranslationService — model selection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAppLookup();
  });

  test("uses the application's configured aiModel when present", async () => {
    mockSettingsLookup({ aiApiKey: "sk-test", aiModel: "gpt-4o", domain: "" });
    const fetchMock = mockFetchOnce({ title: "Bonjour" });

    await generateContentTranslation({
      applicationId: "app-1",
      sourceDetail,
      sourceLangKey: "en",
      targetLangKey: "fr",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchMock.mock.calls[0][1] as any).body);
    expect(body.model).toBe("gpt-4o");
  });

  test("falls back to DEFAULT_AI_MODEL when aiModel is not configured", async () => {
    mockSettingsLookup({ aiApiKey: "sk-test", domain: "" });
    const fetchMock = mockFetchOnce({ title: "Bonjour" });

    await generateContentTranslation({
      applicationId: "app-1",
      sourceDetail,
      sourceLangKey: "en",
      targetLangKey: "fr",
    });

    const body = JSON.parse((fetchMock.mock.calls[0][1] as any).body);
    expect(body.model).toBe(DEFAULT_AI_MODEL);
  });

  test("falls back to DEFAULT_AI_MODEL when aiModel is blank", async () => {
    mockSettingsLookup({ aiApiKey: "sk-test", aiModel: "   ", domain: "" });
    const fetchMock = mockFetchOnce({ title: "Bonjour" });

    await generateContentTranslation({
      applicationId: "app-1",
      sourceDetail,
      sourceLangKey: "en",
      targetLangKey: "fr",
    });

    const body = JSON.parse((fetchMock.mock.calls[0][1] as any).body);
    expect(body.model).toBe(DEFAULT_AI_MODEL);
  });

  test("never logs or otherwise includes the API key in the request body", async () => {
    mockSettingsLookup({ aiApiKey: "sk-super-secret", aiModel: "gpt-4o", domain: "" });
    const fetchMock = mockFetchOnce({ title: "Bonjour" });

    await generateContentTranslation({
      applicationId: "app-1",
      sourceDetail,
      sourceLangKey: "en",
      targetLangKey: "fr",
    });

    const body = (fetchMock.mock.calls[0][1] as any).body as string;
    expect(body).not.toContain("sk-super-secret");
    const headers = (fetchMock.mock.calls[0][1] as any).headers;
    expect(headers.Authorization).toBe("Bearer sk-super-secret");
  });

  test("still throws a clear error when aiApiKey is missing, regardless of aiModel", async () => {
    mockSettingsLookup({ aiModel: "gpt-4o", domain: "" });

    await expect(
      generateContentTranslation({
        applicationId: "app-1",
        sourceDetail,
        sourceLangKey: "en",
        targetLangKey: "fr",
      }),
    ).rejects.toMatchObject({ status: 400, message: expect.stringContaining("AI API key") });
  });
});
