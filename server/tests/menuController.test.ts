import { jest } from "@jest/globals";

const Menu = {
  schema: {
    path: jest.fn(() => ({ enumValues: ["active", "inactive"] })),
  },
  create: jest.fn(),
  exists: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
};

const Application = {
  exists: jest.fn(),
  findById: jest.fn(),
};

const ApplicationSetting = {
  findOne: jest.fn(),
};

const userCanAccessApplication = jest.fn();
const generatePublicId = jest.fn();

jest.unstable_mockModule("../src/models/menu/Menu.js", () => ({ default: Menu }));
jest.unstable_mockModule("../src/models/application/Application.js", () => ({ default: Application }));
jest.unstable_mockModule("../src/models/application/ApplicationSetting.js", () => ({ default: ApplicationSetting }));
jest.unstable_mockModule("../src/middleware/auth.js", () => ({ userCanAccessApplication }));
jest.unstable_mockModule("../src/utils/publicId.js", () => ({ generatePublicId }));

const {
  getMenus,
  getMenu,
  createMenu,
  updateMenu,
  updateMenuStatus,
  deleteMenu,
  getMenuPublicUrl,
} = (await import("../src/controllers/menuController.js")) as any;

function mockResponse() {
  const res: any = { status: jest.fn(), json: jest.fn(), send: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

function mockUser(applications = ["app-1"], role = "WebSiteAdmin") {
  return { role, applications: applications.map((_id) => ({ _id })) };
}

describe("menuController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    generatePublicId.mockReturnValue("public-id-1");
    userCanAccessApplication.mockReturnValue(true);
    Menu.exists.mockResolvedValue(false);
  });

  describe("getMenus", () => {
    test("requires an application query parameter", async () => {
      const res = mockResponse();

      await getMenus({ query: {}, user: mockUser() }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "application is required" });
    });

    test("rejects users without access to the requested application", async () => {
      userCanAccessApplication.mockReturnValue(false);
      const res = mockResponse();

      await getMenus({ query: { application: "app-1" }, user: mockUser() }, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test("paginates the application's menus", async () => {
      const menus = [{ _id: "menu-1", slug: "main-menu", createdAt: "2026-01-01" }];
      Menu.find.mockResolvedValue(menus);
      const res = mockResponse();

      await getMenus({ query: { application: "app-1" }, user: mockUser() }, res);

      expect(Menu.find).toHaveBeenCalledWith({ application: "app-1" });
      const payload = res.json.mock.calls[0][0];
      expect(payload.items).toEqual(menus);
    });
  });

  describe("createMenu", () => {
    test("requires a slug", async () => {
      Application.exists.mockResolvedValue({ _id: "app-1" });
      const res = mockResponse();

      await createMenu(
        { body: { application: "app-1", currency: "USD" }, user: mockUser() },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "slug is required" });
      expect(Menu.create).not.toHaveBeenCalled();
    });

    test("requires a currency", async () => {
      Application.exists.mockResolvedValue({ _id: "app-1" });
      const res = mockResponse();

      await createMenu(
        { body: { application: "app-1", slug: "main-menu" }, user: mockUser() },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "currency is required" });
      expect(Menu.create).not.toHaveBeenCalled();
    });

    test("slugifies and disambiguates the slug, then creates the menu", async () => {
      Application.exists.mockResolvedValue({ _id: "app-1" });
      Menu.exists.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
      const created = { _id: "menu-1", slug: "main-menu-2", publicId: "public-id-1" };
      Menu.create.mockResolvedValue(created);
      const res = mockResponse();

      await createMenu(
        { body: { application: "app-1", slug: "Main Menu", currency: "USD" }, user: mockUser() },
        res,
      );

      expect(Menu.create).toHaveBeenCalledWith(
        expect.objectContaining({ application: "app-1", slug: "main-menu-2", currency: "USD", publicId: "public-id-1" }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(created);
    });

    test("rejects a non-boolean settings field", async () => {
      Application.exists.mockResolvedValue({ _id: "app-1" });
      const res = mockResponse();

      await createMenu(
        {
          body: { application: "app-1", slug: "main-menu", currency: "USD", settings: { showImages: "yes" } },
          user: mockUser(),
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "settings.showImages must be a boolean" });
    });
  });

  describe("updateMenu", () => {
    test("keeps the existing slug when the requested slug is unchanged after slugifying", async () => {
      const menu: any = {
        _id: "menu-1",
        application: "app-1",
        slug: "main-menu",
        currency: "USD",
        settings: { showCalories: true, showImages: true, showUnavailableItems: true },
        save: jest.fn().mockResolvedValue(undefined),
      };
      Menu.findById.mockResolvedValue(menu);
      const res = mockResponse();

      await updateMenu({ params: { id: "menu-1" }, body: { slug: "Main Menu" }, user: mockUser() }, res);

      expect(menu.slug).toBe("main-menu");
      expect(Menu.exists).not.toHaveBeenCalled();
      expect(menu.save).toHaveBeenCalled();
    });

    test("merges settings rather than replacing the whole object", async () => {
      const menu: any = {
        _id: "menu-1",
        application: "app-1",
        slug: "main-menu",
        currency: "USD",
        settings: { showCalories: true, showImages: true, showUnavailableItems: false },
        save: jest.fn().mockResolvedValue(undefined),
      };
      Menu.findById.mockResolvedValue(menu);
      const res = mockResponse();

      await updateMenu(
        { params: { id: "menu-1" }, body: { settings: { showCalories: false } }, user: mockUser() },
        res,
      );

      expect(menu.settings).toEqual({ showCalories: false, showImages: true, showUnavailableItems: false });
    });
  });

  describe("updateMenuStatus / deleteMenu", () => {
    test("updateMenuStatus rejects an unknown status", async () => {
      const res = mockResponse();

      await updateMenuStatus({ params: { id: "menu-1" }, body: { status: "archived" }, user: mockUser() }, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("deleteMenu soft-deletes the menu", async () => {
      const menu: any = { _id: "menu-1", application: "app-1", isDeleted: false, save: jest.fn().mockResolvedValue(undefined) };
      Menu.findById.mockResolvedValue(menu);
      const res = mockResponse();

      await deleteMenu({ params: { id: "menu-1" }, user: mockUser() }, res);

      expect(menu.isDeleted).toBe(true);
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });

  describe("getMenuPublicUrl", () => {
    test("400s when the application's domain isn't configured", async () => {
      const menu = { _id: "menu-1", application: "app-1", slug: "main-menu" };
      Menu.findById.mockResolvedValue(menu);
      Application.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ appKey: "KEY-1" }) });
      ApplicationSetting.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ domain: "" }) });
      const res = mockResponse();

      await getMenuPublicUrl({ params: { id: "menu-1" }, user: mockUser() }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining("domain is not configured") }),
      );
    });

    test("builds the public URL from the application's domain, slug, and appKey", async () => {
      const menu = { _id: "menu-1", application: "app-1", slug: "main-menu" };
      Menu.findById.mockResolvedValue(menu);
      Application.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ appKey: "KEY-1" }) });
      ApplicationSetting.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ domain: "acme.com" }) });
      const res = mockResponse();

      await getMenuPublicUrl({ params: { id: "menu-1" }, user: mockUser() }, res);

      expect(res.json).toHaveBeenCalledWith({ url: "https://acme.com/menu/main-menu?appKey=KEY-1" });
    });
  });
});
