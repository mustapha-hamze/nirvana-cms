import { jest } from "@jest/globals";

const MenuCategory = {
  schema: {
    path: jest.fn(() => ({ enumValues: ["active", "inactive"] })),
  },
  create: jest.fn(),
  exists: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
};

const MenuItem = { exists: jest.fn() };
const Application = { exists: jest.fn() };
const Menu = { exists: jest.fn() };
const ApplicationSetting = { findOne: jest.fn() };

const userCanAccessApplication = jest.fn();
const generatePublicId = jest.fn();
const saveMenuCategoryImage = jest.fn();

jest.unstable_mockModule("../src/models/menu/MenuCategory.js", () => ({ default: MenuCategory }));
jest.unstable_mockModule("../src/models/menu/MenuItem.js", () => ({ default: MenuItem }));
jest.unstable_mockModule("../src/models/menu/Menu.js", () => ({ default: Menu }));
jest.unstable_mockModule("../src/models/application/Application.js", () => ({ default: Application }));
jest.unstable_mockModule("../src/models/application/ApplicationSetting.js", () => ({ default: ApplicationSetting }));
jest.unstable_mockModule("../src/middleware/auth.js", () => ({ userCanAccessApplication }));
jest.unstable_mockModule("../src/utils/publicId.js", () => ({ generatePublicId }));
jest.unstable_mockModule("../src/utils/menuImageUpload.js", () => ({
  saveMenuCategoryImage,
  menuImageUploadMiddleware: jest.fn(),
}));

const {
  getMenuCategories,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  uploadMenuCategoryImage,
} = (await import("../src/controllers/menuCategoryController.js")) as any;

function mockResponse() {
  const res: any = { status: jest.fn(), json: jest.fn(), send: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

function mockUser(applications = ["app-1"], role = "WebSiteAdmin") {
  return { role, applications: applications.map((_id) => ({ _id })) };
}

describe("menuCategoryController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    generatePublicId.mockReturnValue("public-id-1");
    userCanAccessApplication.mockReturnValue(true);
    Menu.exists.mockResolvedValue(true);
    ApplicationSetting.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ languages: ["en", "fa"] }) });
    MenuCategory.exists.mockImplementation((query: any) =>
      Promise.resolve(query.translations ? false : undefined),
    );
  });

  describe("getMenuCategories", () => {
    test("sorts by sortOrder then creation date", async () => {
      const categories = [{ _id: "cat-1" }];
      const sort = jest.fn().mockResolvedValue(categories);
      MenuCategory.find.mockReturnValue({ sort });
      const res = mockResponse();

      await getMenuCategories(
        { query: { application: "app-1", menu: "507f1f77bcf86cd799439011" }, user: mockUser() },
        res,
      );

      expect(MenuCategory.find).toHaveBeenCalledWith({ application: "app-1", menu: "507f1f77bcf86cd799439011" });
      expect(sort).toHaveBeenCalledWith({ sortOrder: 1, createdAt: 1 });
      expect(res.json).toHaveBeenCalledWith(categories);
    });
  });

  describe("createMenuCategory", () => {
    const validBody = {
      application: "app-1",
      menu: "507f1f77bcf86cd799439011",
      translations: [{ langKey: "en", title: "Appetizers" }],
    };

    test("requires a valid menu id", async () => {
      Application.exists.mockResolvedValue({ _id: "app-1" });
      const res = mockResponse();

      await createMenuCategory({ body: { ...validBody, menu: "not-an-id" }, user: mockUser() }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "menu must be a valid id" });
    });

    test("requires the menu to belong to the same application", async () => {
      Application.exists.mockResolvedValue({ _id: "app-1" });
      Menu.exists.mockResolvedValue(false);
      const res = mockResponse();

      await createMenuCategory({ body: validBody, user: mockUser() }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "menu must reference a menu in the same application",
      });
    });

    test("requires the application's base language to be present", async () => {
      Application.exists.mockResolvedValue({ _id: "app-1" });
      const res = mockResponse();

      await createMenuCategory(
        { body: { ...validBody, translations: [{ langKey: "fa", title: "پیش‌غذا" }] }, user: mockUser() },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "translations must include the application's base language (en)",
      });
      expect(MenuCategory.create).not.toHaveBeenCalled();
    });

    test("rejects duplicate languages within translations", async () => {
      Application.exists.mockResolvedValue({ _id: "app-1" });
      const res = mockResponse();

      await createMenuCategory(
        {
          body: {
            ...validBody,
            translations: [
              { langKey: "en", title: "Appetizers" },
              { langKey: "en", title: "Starters" },
            ],
          },
          user: mockUser(),
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "each language may only appear once in translations" });
    });

    test("auto-derives a slug and creates the category", async () => {
      Application.exists.mockResolvedValue({ _id: "app-1" });
      const created = { _id: "cat-1", publicId: "public-id-1" };
      MenuCategory.create.mockResolvedValue(created);
      const res = mockResponse();

      await createMenuCategory({ body: validBody, user: mockUser() }, res);

      expect(MenuCategory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          application: "app-1",
          menu: "507f1f77bcf86cd799439011",
          translations: [{ langKey: "en", title: "Appetizers", description: "", slug: "appetizers" }],
          publicId: "public-id-1",
        }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("updateMenuCategory", () => {
    test("updates sortOrder and image", async () => {
      const category: any = {
        _id: "cat-1",
        application: "app-1",
        menu: "menu-1",
        image: "",
        sortOrder: 0,
        status: "active",
        save: jest.fn().mockResolvedValue(undefined),
      };
      MenuCategory.findById.mockResolvedValue(category);
      const res = mockResponse();

      await updateMenuCategory(
        { params: { id: "cat-1" }, body: { sortOrder: 5, image: "new.png" }, user: mockUser() },
        res,
      );

      expect(category.sortOrder).toBe(5);
      expect(category.image).toBe("new.png");
      expect(category.save).toHaveBeenCalled();
    });
  });

  describe("deleteMenuCategory", () => {
    test("blocks deletion while the category still has items", async () => {
      const category: any = { _id: "cat-1", application: "app-1", save: jest.fn() };
      MenuCategory.findById.mockResolvedValue(category);
      MenuItem.exists.mockResolvedValue({ _id: "item-1" });
      const res = mockResponse();

      await deleteMenuCategory({ params: { id: "cat-1" }, user: mockUser() }, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(category.save).not.toHaveBeenCalled();
    });

    test("soft-deletes a category with no items", async () => {
      const category: any = { _id: "cat-1", application: "app-1", isDeleted: false, save: jest.fn().mockResolvedValue(undefined) };
      MenuCategory.findById.mockResolvedValue(category);
      MenuItem.exists.mockResolvedValue(null);
      const res = mockResponse();

      await deleteMenuCategory({ params: { id: "cat-1" }, user: mockUser() }, res);

      expect(category.isDeleted).toBe(true);
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });

  describe("uploadMenuCategoryImage", () => {
    test("requires an image file", async () => {
      const res = mockResponse();

      await uploadMenuCategoryImage({ body: { application: "app-1" }, user: mockUser(), file: undefined }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "image is required" });
    });

    test("saves the uploaded image and returns its bare filename", async () => {
      saveMenuCategoryImage.mockResolvedValue("uuid.png");
      const res = mockResponse();

      await uploadMenuCategoryImage(
        { body: { application: "app-1" }, user: mockUser(), file: { buffer: Buffer.from("x"), mimetype: "image/png" } },
        res,
      );

      expect(saveMenuCategoryImage).toHaveBeenCalledWith(Buffer.from("x"), "image/png");
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ filename: "uuid.png" });
    });
  });
});
