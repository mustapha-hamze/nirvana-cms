import { jest } from "@jest/globals";

// menuQrController imports resolveMenuPublicUrl from the real
// menuController.js module (not mocked, so both endpoints stay in sync on
// the same URL-building logic) — that module reads Menu.schema.path("status")
// at import time, so the mock needs that shape even though this file never
// exercises menu status directly.
const Menu = {
  schema: { path: jest.fn(() => ({ enumValues: ["active", "inactive"] })) },
  findById: jest.fn(),
};
const Application = { findById: jest.fn() };
const ApplicationSetting = { findOne: jest.fn() };
const userCanAccessApplication = jest.fn();

const QRCode = { toFileStream: jest.fn(), toString: jest.fn() };

jest.unstable_mockModule("../src/models/menu/Menu.js", () => ({ default: Menu }));
jest.unstable_mockModule("../src/models/application/Application.js", () => ({ default: Application }));
jest.unstable_mockModule("../src/models/application/ApplicationSetting.js", () => ({ default: ApplicationSetting }));
jest.unstable_mockModule("../src/middleware/auth.js", () => ({ userCanAccessApplication }));
jest.unstable_mockModule("qrcode", () => ({ default: QRCode }));

const { getMenuQrCode } = (await import("../src/controllers/menuQrController.js")) as any;

function mockResponse() {
  const res: any = {
    status: jest.fn(),
    json: jest.fn(),
    send: jest.fn(),
    setHeader: jest.fn(),
    on: jest.fn(),
    headersSent: false,
  };
  res.status.mockReturnValue(res);
  return res;
}

function mockUser(applications = ["app-1"], role = "WebSiteAdmin") {
  return { role, applications: applications.map((_id) => ({ _id })) };
}

const menu = { _id: "menu-1", application: "app-1", slug: "main-menu" };

describe("menuQrController.getMenuQrCode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    userCanAccessApplication.mockReturnValue(true);
    Menu.findById.mockResolvedValue(menu);
    Application.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ appKey: "KEY-1" }) });
    ApplicationSetting.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ domain: "acme.com" }) });
  });

  test("rejects an unknown format", async () => {
    const res = mockResponse();

    await getMenuQrCode({ params: { id: "menu-1" }, query: { format: "bmp" }, user: mockUser() }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(QRCode.toFileStream).not.toHaveBeenCalled();
  });

  test("404s when the menu doesn't exist", async () => {
    Menu.findById.mockResolvedValue(null);
    const res = mockResponse();

    await getMenuQrCode({ params: { id: "missing" }, query: {}, user: mockUser() }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("403s when the user can't access the menu's application", async () => {
    userCanAccessApplication.mockReturnValue(false);
    const res = mockResponse();

    await getMenuQrCode({ params: { id: "menu-1" }, query: {}, user: mockUser() }, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("400s when the application's domain isn't configured", async () => {
    ApplicationSetting.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ domain: "" }) });
    const res = mockResponse();

    await getMenuQrCode({ params: { id: "menu-1" }, query: {}, user: mockUser() }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("domain is not configured") }),
    );
  });

  test("streams a PNG by default, encoding the public menu URL", async () => {
    const res = mockResponse();

    await getMenuQrCode({ params: { id: "menu-1" }, query: {}, user: mockUser() }, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/png");
    expect(QRCode.toFileStream).toHaveBeenCalledWith(
      res,
      "https://acme.com/menu/main-menu?appKey=KEY-1",
      expect.objectContaining({ errorCorrectionLevel: "H" }),
    );
  });

  test("returns SVG with the right content-type when format=svg", async () => {
    QRCode.toString.mockResolvedValue("<svg>...</svg>");
    const res = mockResponse();

    await getMenuQrCode({ params: { id: "menu-1" }, query: { format: "svg" }, user: mockUser() }, res);

    expect(QRCode.toString).toHaveBeenCalledWith(
      "https://acme.com/menu/main-menu?appKey=KEY-1",
      expect.objectContaining({ type: "svg" }),
    );
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml");
    expect(res.send).toHaveBeenCalledWith("<svg>...</svg>");
    expect(QRCode.toFileStream).not.toHaveBeenCalled();
  });
});
