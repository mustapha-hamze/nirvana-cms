import { jest } from "@jest/globals";

const Application = {
  exists: jest.fn(),
};

const ApplicationSetting = {
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
};

jest.unstable_mockModule("../src/models/application/Application.js", () => ({ default: Application }));
jest.unstable_mockModule("../src/models/application/ApplicationSetting.js", () => ({ default: ApplicationSetting }));

const { getApplicationSettings, upsertApplicationSettings } = (await import(
  "../src/controllers/applicationController.js"
)) as any;

function mockResponse() {
  const res: any = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

describe("applicationController — settings aiModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getApplicationSettings", () => {
    test("returns aiModel alongside the rest of the settings", async () => {
      ApplicationSetting.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({ domain: "example.com", aiModel: "gpt-4o", languages: ["en"] }),
      });
      const res = mockResponse();

      await getApplicationSettings({ params: { id: "app-1" } }, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ aiModel: "gpt-4o" }),
      );
    });
  });

  describe("upsertApplicationSettings", () => {
    test("persists a valid aiModel", async () => {
      Application.exists.mockResolvedValue(true);
      ApplicationSetting.findOneAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue({ aiModel: "gpt-4o" }),
      });
      const res = mockResponse();

      await upsertApplicationSettings({ params: { id: "app-1" }, body: { aiModel: "  gpt-4o  " } }, res);

      expect(ApplicationSetting.findOneAndUpdate).toHaveBeenCalledWith(
        { application: "app-1" },
        { $set: expect.objectContaining({ aiModel: "gpt-4o" }) },
        expect.any(Object),
      );
      expect(res.status).not.toHaveBeenCalledWith(400);
    });

    test("rejects a blank aiModel", async () => {
      Application.exists.mockResolvedValue(true);
      const res = mockResponse();

      await upsertApplicationSettings({ params: { id: "app-1" }, body: { aiModel: "   " } }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(ApplicationSetting.findOneAndUpdate).not.toHaveBeenCalled();
    });

    test("rejects a non-string aiModel", async () => {
      Application.exists.mockResolvedValue(true);
      const res = mockResponse();

      await upsertApplicationSettings({ params: { id: "app-1" }, body: { aiModel: 123 } }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(ApplicationSetting.findOneAndUpdate).not.toHaveBeenCalled();
    });

    test("omitting aiModel entirely leaves it untouched (schema default covers new settings)", async () => {
      Application.exists.mockResolvedValue(true);
      ApplicationSetting.findOneAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue({ domain: "example.com" }),
      });
      const res = mockResponse();

      await upsertApplicationSettings({ params: { id: "app-1" }, body: { domain: "example.com" } }, res);

      const updateArg = ApplicationSetting.findOneAndUpdate.mock.calls[0][1].$set;
      expect(updateArg).not.toHaveProperty("aiModel");
      expect(res.status).not.toHaveBeenCalledWith(400);
    });
  });
});
