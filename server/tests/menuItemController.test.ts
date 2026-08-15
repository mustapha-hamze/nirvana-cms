import { jest } from "@jest/globals";

const MenuItem = {
  schema: {
    path: jest.fn((name: string) =>
      name === "availability"
        ? { enumValues: ["available", "unavailable", "sold_out"] }
        : { enumValues: ["active", "inactive"] },
    ),
  },
  create: jest.fn(),
  exists: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
};

const Application = { exists: jest.fn() };
const Menu = { exists: jest.fn() };
const MenuCategory = { exists: jest.fn() };
const ApplicationSetting = { findOne: jest.fn() };

const userCanAccessApplication = jest.fn();
const userIsAppAdmin = jest.fn();
const generatePublicId = jest.fn();
const saveMenuItemImage = jest.fn();

jest.unstable_mockModule("../src/models/menu/MenuItem.js", () => ({ default: MenuItem }));
jest.unstable_mockModule("../src/models/menu/Menu.js", () => ({ default: Menu }));
jest.unstable_mockModule("../src/models/menu/MenuCategory.js", () => ({ default: MenuCategory }));
jest.unstable_mockModule("../src/models/application/Application.js", () => ({ default: Application }));
jest.unstable_mockModule("../src/models/application/ApplicationSetting.js", () => ({ default: ApplicationSetting }));
jest.unstable_mockModule("../src/middleware/auth.js", () => ({ userCanAccessApplication, userIsAppAdmin }));
jest.unstable_mockModule("../src/utils/publicId.js", () => ({ generatePublicId }));
jest.unstable_mockModule("../src/utils/menuImageUpload.js", () => ({
  saveMenuItemImage,
  menuImageUploadMiddleware: jest.fn(),
}));

const {
  createMenuItem,
  updateMenuItem,
  updateMenuItemStatus,
  updateMenuItemAvailability,
  deleteMenuItem,
} = (await import("../src/controllers/menuItemController.js")) as any;

function mockResponse() {
  const res: any = { status: jest.fn(), json: jest.fn(), send: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

function mockUser(role: string, applications = ["app-1"]) {
  return { role, applications: applications.map((_id) => ({ _id })) };
}

const validCreateBody = {
  application: "app-1",
  menu: "507f1f77bcf86cd799439011",
  category: "507f1f77bcf86cd799439012",
  translations: [{ langKey: "en", title: "Spring Rolls", description: "Crispy" }],
  price: 6.5,
};

describe("menuItemController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    generatePublicId.mockReturnValue("public-id-1");
    userCanAccessApplication.mockReturnValue(true);
    userIsAppAdmin.mockReturnValue(true);
    Application.exists.mockResolvedValue({ _id: "app-1" });
    Menu.exists.mockResolvedValue(true);
    MenuCategory.exists.mockResolvedValue(true);
    ApplicationSetting.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ languages: ["en", "fa"] }) });
  });

  describe("createMenuItem", () => {
    test("requires the category to belong to the same menu", async () => {
      MenuCategory.exists.mockResolvedValue(false);
      const res = mockResponse();

      await createMenuItem({ body: validCreateBody, user: mockUser("WebSiteAdmin") }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "category must reference a category in the same menu" });
    });

    test("requires a non-empty description per translation", async () => {
      const res = mockResponse();

      await createMenuItem(
        {
          body: { ...validCreateBody, translations: [{ langKey: "en", title: "Spring Rolls", description: "" }] },
          user: mockUser("WebSiteAdmin"),
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "each translation requires a non-empty description" });
    });

    test("rejects a negative price", async () => {
      const res = mockResponse();

      await createMenuItem({ body: { ...validCreateBody, price: -5 }, user: mockUser("WebSiteAdmin") }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "price must be a non-negative number" });
    });

    test("rejects a negative calories value", async () => {
      const res = mockResponse();

      await createMenuItem({ body: { ...validCreateBody, calories: -10 }, user: mockUser("WebSiteAdmin") }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "calories must be a non-negative number" });
    });

    test("a content creator with application access can create an item", async () => {
      const created = { _id: "item-1", publicId: "public-id-1" };
      MenuItem.create.mockResolvedValue(created);
      const res = mockResponse();

      await createMenuItem({ body: validCreateBody, user: mockUser("WebSiteContentCreator") }, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(MenuItem.create).toHaveBeenCalledWith(
        expect.objectContaining({ price: 6.5, category: "507f1f77bcf86cd799439012" }),
      );
    });

    test("rejects a user without application access, regardless of role", async () => {
      userCanAccessApplication.mockReturnValue(false);
      const res = mockResponse();

      await createMenuItem({ body: validCreateBody, user: mockUser("WebSiteContentCreator") }, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(MenuItem.create).not.toHaveBeenCalled();
    });
  });

  describe("updateMenuItem — content/availability editing (staff, not admin-gated)", () => {
    test("a content creator can update price and availability", async () => {
      const item: any = {
        _id: "item-1",
        application: "app-1",
        menu: "menu-1",
        category: "cat-1",
        price: 5,
        availability: "available",
        isSpicy: false,
        save: jest.fn().mockResolvedValue(undefined),
      };
      MenuItem.findById.mockResolvedValue(item);
      const res = mockResponse();

      await updateMenuItem(
        { params: { id: "item-1" }, body: { price: 7.25, availability: "sold_out" }, user: mockUser("WebSiteContentCreator") },
        res,
      );

      expect(item.price).toBe(7.25);
      expect(item.availability).toBe("sold_out");
      expect(item.save).toHaveBeenCalled();
      // userIsAppAdmin must never be consulted for content/availability edits.
      expect(userIsAppAdmin).not.toHaveBeenCalled();
    });

    test("rejects an unknown availability value", async () => {
      const item: any = { _id: "item-1", application: "app-1", save: jest.fn() };
      MenuItem.findById.mockResolvedValue(item);
      const res = mockResponse();

      await updateMenuItem(
        { params: { id: "item-1" }, body: { availability: "expired" }, user: mockUser("WebSiteContentCreator") },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(item.save).not.toHaveBeenCalled();
    });
  });

  describe("updateMenuItemStatus — admin only", () => {
    test("rejects a content creator", async () => {
      userIsAppAdmin.mockReturnValue(false);
      const item: any = { _id: "item-1", application: "app-1", status: "active", save: jest.fn() };
      MenuItem.findById.mockResolvedValue(item);
      const res = mockResponse();

      await updateMenuItemStatus(
        { params: { id: "item-1" }, body: { status: "inactive" }, user: mockUser("WebSiteContentCreator") },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(403);
      expect(item.save).not.toHaveBeenCalled();
    });

    test("allows a WebSiteAdmin", async () => {
      userIsAppAdmin.mockReturnValue(true);
      const item: any = { _id: "item-1", application: "app-1", status: "active", save: jest.fn().mockResolvedValue(undefined) };
      MenuItem.findById.mockResolvedValue(item);
      const res = mockResponse();

      await updateMenuItemStatus(
        { params: { id: "item-1" }, body: { status: "inactive" }, user: mockUser("WebSiteAdmin") },
        res,
      );

      expect(item.status).toBe("inactive");
      expect(res.json).toHaveBeenCalledWith(item);
    });
  });

  describe("updateMenuItemAvailability — any staff with application access", () => {
    test("does not require app-admin", async () => {
      const item: any = { _id: "item-1", application: "app-1", availability: "available", save: jest.fn().mockResolvedValue(undefined) };
      MenuItem.findById.mockResolvedValue(item);
      const res = mockResponse();

      await updateMenuItemAvailability(
        { params: { id: "item-1" }, body: { availability: "sold_out" }, user: mockUser("WebSiteContentCreator") },
        res,
      );

      expect(item.availability).toBe("sold_out");
      expect(userIsAppAdmin).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(item);
    });
  });

  describe("deleteMenuItem — admin only", () => {
    test("rejects a content creator", async () => {
      userIsAppAdmin.mockReturnValue(false);
      const item: any = { _id: "item-1", application: "app-1", save: jest.fn() };
      MenuItem.findById.mockResolvedValue(item);
      const res = mockResponse();

      await deleteMenuItem({ params: { id: "item-1" }, user: mockUser("WebSiteContentCreator") }, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(item.save).not.toHaveBeenCalled();
    });

    test("soft-deletes for an admin", async () => {
      userIsAppAdmin.mockReturnValue(true);
      const item: any = { _id: "item-1", application: "app-1", isDeleted: false, save: jest.fn().mockResolvedValue(undefined) };
      MenuItem.findById.mockResolvedValue(item);
      const res = mockResponse();

      await deleteMenuItem({ params: { id: "item-1" }, user: mockUser("WebSiteAdmin") }, res);

      expect(item.isDeleted).toBe(true);
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });
});
