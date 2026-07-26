import { jest } from "@jest/globals";

const Category = {
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
};

const ApplicationSetting = {
  findOne: jest.fn(),
};

const userCanAccessApplication = jest.fn();
const generatePublicId = jest.fn();

jest.unstable_mockModule("../src/models/Category.js", () => ({ default: Category }));
jest.unstable_mockModule("../src/models/application/Application.js", () => ({ default: Application }));
jest.unstable_mockModule("../src/models/application/ApplicationSetting.js", () => ({ default: ApplicationSetting }));
jest.unstable_mockModule("../src/middleware/auth.js", () => ({ userCanAccessApplication }));
jest.unstable_mockModule("../src/utils/publicId.js", () => ({ generatePublicId }));

const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  updateCategoryStatus,
  deleteCategory,
} = await import("../src/controllers/categoryController.js");

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

describe("categoryController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    generatePublicId.mockReturnValue("public-id-1");
    userCanAccessApplication.mockReturnValue(true);
    ApplicationSetting.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({ languages: ["en", "fa"] }),
    });
    // Category.exists is used for two different checks (parent ownership and
    // slug-collision lookups) — dispatch on the query shape: a slug check
    // always includes a `translations` filter, a parent check never does.
    Category.exists.mockImplementation((query) =>
      query.translations ? Promise.resolve(false) : Promise.resolve({ _id: "507f1f77bcf86cd799439011" }),
    );
  });

  describe("getCategories", () => {
    test("requires an application query parameter", async () => {
      const res = mockResponse();

      await getCategories({ query: {}, user: mockUser() }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "application is required" });
      expect(Category.find).not.toHaveBeenCalled();
    });

    test("rejects users without access to the requested application", async () => {
      userCanAccessApplication.mockReturnValue(false);
      const res = mockResponse();

      await getCategories({ query: { application: "app-1" }, user: mockUser() }, res);

      expect(userCanAccessApplication).toHaveBeenCalledWith(expect.any(Object), "app-1");
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Insufficient permissions" });
    });

    test("applies status and root parent filters, then sorts by creation date", async () => {
      const categories = [{ _id: "cat-1", translations: [{ langKey: "en", title: "News", slug: "news" }] }];
      const sort = jest.fn().mockResolvedValue(categories);
      Category.find.mockReturnValue({ sort });
      const res = mockResponse();

      await getCategories(
        { query: { application: "app-1", status: "active", parentId: "null" }, user: mockUser() },
        res,
      );

      expect(Category.find).toHaveBeenCalledWith({
        application: "app-1",
        status: "active",
        parentId: null,
      });
      expect(sort).toHaveBeenCalledWith({ createdAt: 1 });
      expect(res.json).toHaveBeenCalledWith(categories);
    });
  });

  describe("getCategory", () => {
    test("returns 404 when the category does not exist", async () => {
      Category.findById.mockResolvedValue(null);
      const res = mockResponse();

      await getCategory({ params: { id: "missing" }, user: mockUser() }, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Category not found" });
    });

    test("returns the category when the user can access its application", async () => {
      const category = { _id: "cat-1", application: "app-1" };
      Category.findById.mockResolvedValue(category);
      const res = mockResponse();

      await getCategory({ params: { id: "cat-1" }, user: mockUser() }, res);

      expect(userCanAccessApplication).toHaveBeenCalledWith(expect.any(Object), "app-1");
      expect(res.json).toHaveBeenCalledWith(category);
    });
  });

  describe("createCategory", () => {
    test("validates application existence, parent ownership, and creates a category", async () => {
      Application.exists.mockResolvedValue({ _id: "app-1" });
      const created = { _id: "cat-1", translations: [{ langKey: "en", title: "News", slug: "news" }], publicId: "public-id-1" };
      Category.create.mockResolvedValue(created);
      const res = mockResponse();

      await createCategory(
        {
          body: {
            application: "app-1",
            translations: [{ langKey: "en", title: "News" }],
            parentId: "507f1f77bcf86cd799439011",
            status: "active",
          },
          user: mockUser(),
        },
        res,
      );

      expect(Application.exists).toHaveBeenCalledWith({ _id: "app-1" });
      expect(Category.exists).toHaveBeenCalledWith({ _id: "507f1f77bcf86cd799439011", application: "app-1" });
      expect(Category.create).toHaveBeenCalledWith({
        application: "app-1",
        translations: [{ langKey: "en", title: "News", slug: "news" }],
        parentId: "507f1f77bcf86cd799439011",
        status: "active",
        publicId: "public-id-1",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(created);
    });

    test("rejects translations with a language outside the application's allowed languages", async () => {
      Application.exists.mockResolvedValue({ _id: "app-1" });
      const res = mockResponse();

      await createCategory(
        {
          body: { application: "app-1", translations: [{ langKey: "fr", title: "Actualités" }] },
          user: mockUser(),
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "translations.langKey must be one of: en, fa",
      });
      expect(Category.create).not.toHaveBeenCalled();
    });

    test("rejects invalid status values", async () => {
      Application.exists.mockResolvedValue({ _id: "app-1" });
      const res = mockResponse();

      await createCategory(
        {
          body: {
            application: "app-1",
            translations: [{ langKey: "en", title: "News" }],
            status: "archived",
          },
          user: mockUser(),
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "status must be one of: active, inactive" });
      expect(Category.create).not.toHaveBeenCalled();
    });

    test("retries publicId generation after duplicate key collisions", async () => {
      Application.exists.mockResolvedValue({ _id: "app-1" });
      generatePublicId.mockReturnValueOnce("duplicate-id").mockReturnValueOnce("public-id-2");
      Category.create
        .mockRejectedValueOnce({ code: 11000, keyPattern: { publicId: 1 } })
        .mockResolvedValueOnce({ _id: "cat-1", publicId: "public-id-2" });
      const res = mockResponse();

      await createCategory(
        {
          body: { application: "app-1", translations: [{ langKey: "en", title: "News" }] },
          user: mockUser(),
        },
        res,
      );

      expect(Category.create).toHaveBeenCalledTimes(2);
      expect(Category.create).toHaveBeenNthCalledWith(2, expect.objectContaining({ publicId: "public-id-2" }));
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("updateCategory", () => {
    test("updates mutable fields and saves the document", async () => {
      const category = {
        _id: "cat-1",
        application: "app-1",
        translations: [{ langKey: "en", title: "Old", slug: "old" }],
        parentId: null,
        status: "active",
        save: jest.fn().mockResolvedValue(undefined),
      };
      Category.findById.mockImplementation((id) => {
        if (id === "cat-1") return Promise.resolve(category);
        if (id === "507f1f77bcf86cd799439011") {
          return { select: jest.fn().mockResolvedValue({ parentId: null }) };
        }
        return Promise.resolve(null);
      });
      const res = mockResponse();

      await updateCategory(
        {
          params: { id: "cat-1" },
          body: {
            translations: [{ langKey: "en", title: "Updated" }],
            parentId: "507f1f77bcf86cd799439011",
            status: "inactive",
          },
          user: mockUser(),
        },
        res,
      );

      expect(category.translations).toEqual([{ langKey: "en", title: "Updated", slug: "updated" }]);
      expect(category.parentId).toBe("507f1f77bcf86cd799439011");
      expect(category.status).toBe("inactive");
      expect(category.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(category);
    });

    test("keeps the existing slug when a language's title is unchanged", async () => {
      const category = {
        _id: "cat-1",
        application: "app-1",
        translations: [{ langKey: "en", title: "News", slug: "news" }],
        parentId: null,
        status: "active",
        save: jest.fn().mockResolvedValue(undefined),
      };
      Category.findById.mockResolvedValue(category);
      const res = mockResponse();

      await updateCategory(
        {
          params: { id: "cat-1" },
          body: { translations: [{ langKey: "en", title: "News" }] },
          user: mockUser(),
        },
        res,
      );

      expect(category.translations).toEqual([{ langKey: "en", title: "News", slug: "news" }]);
      // Unchanged title shouldn't need a slug-collision lookup at all.
      expect(Category.exists).not.toHaveBeenCalled();
    });

    test("rejects parent changes that would create a cycle", async () => {
      const category = {
        _id: "cat-1",
        application: "app-1",
        save: jest.fn(),
      };
      Category.exists.mockResolvedValue({ _id: "507f1f77bcf86cd799439011" });
      Category.findById.mockImplementation((id) => {
        if (id === "cat-1") return Promise.resolve(category);
        if (id === "507f1f77bcf86cd799439011") {
          return { select: jest.fn().mockResolvedValue({ parentId: "cat-1" }) };
        }
        return Promise.resolve(null);
      });
      const res = mockResponse();

      await updateCategory(
        { params: { id: "cat-1" }, body: { parentId: "507f1f77bcf86cd799439011" }, user: mockUser() },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "parentId would create a circular category tree" });
      expect(category.save).not.toHaveBeenCalled();
    });
  });

  describe("updateCategoryStatus", () => {
    test("requires a known status", async () => {
      const res = mockResponse();

      await updateCategoryStatus(
        { params: { id: "cat-1" }, body: { status: "deleted" }, user: mockUser() },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "status must be one of: active, inactive" });
    });

    test("sets the category status", async () => {
      const category = {
        _id: "cat-1",
        application: "app-1",
        status: "active",
        save: jest.fn().mockResolvedValue(undefined),
      };
      Category.findById.mockResolvedValue(category);
      const res = mockResponse();

      await updateCategoryStatus(
        { params: { id: "cat-1" }, body: { status: "inactive" }, user: mockUser() },
        res,
      );

      expect(category.status).toBe("inactive");
      expect(category.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(category);
    });
  });

  describe("deleteCategory", () => {
    test("does not delete categories that still have children", async () => {
      const category = {
        _id: "cat-1",
        application: "app-1",
        save: jest.fn(),
      };
      Category.findById.mockResolvedValue(category);
      Category.exists.mockResolvedValue({ _id: "child-1" });
      const res = mockResponse();

      await deleteCategory({ params: { id: "cat-1" }, user: mockUser() }, res);

      expect(Category.exists).toHaveBeenCalledWith({ parentId: "cat-1" });
      expect(res.status).toHaveBeenCalledWith(409);
      expect(category.save).not.toHaveBeenCalled();
    });

    test("soft deletes leaf categories", async () => {
      const category = {
        _id: "cat-1",
        application: "app-1",
        isDeleted: false,
        save: jest.fn().mockResolvedValue(undefined),
      };
      Category.findById.mockResolvedValue(category);
      Category.exists.mockResolvedValue(null);
      const res = mockResponse();

      await deleteCategory({ params: { id: "cat-1" }, user: mockUser() }, res);

      expect(category.isDeleted).toBe(true);
      expect(category.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
