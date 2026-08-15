import { jest } from "@jest/globals";

const Menu = { find: jest.fn(), findOne: jest.fn() };
const MenuCategory = { find: jest.fn(), findOne: jest.fn() };
const MenuItem = { find: jest.fn() };

jest.unstable_mockModule("../src/models/menu/Menu.js", () => ({ default: Menu }));
jest.unstable_mockModule("../src/models/menu/MenuCategory.js", () => ({ default: MenuCategory }));
jest.unstable_mockModule("../src/models/menu/MenuItem.js", () => ({ default: MenuItem }));

const {
  getFrontendMenu,
  getFrontendMenuCategories,
  getFrontendMenuCategory,
  getFrontendMenuItems,
} = (await import("../src/controllers/frontendController.js")) as any;

function mockResponse() {
  const res: any = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

// Mimics a real Mongoose Query: every chain method returns itself, and it
// resolves to `value` however many (or few) chain calls preceded the await.
function queryChain(value: unknown) {
  const chain: any = {
    sort: jest.fn(() => chain),
    then: (resolve: any, reject: any) => Promise.resolve(value).then(resolve, reject),
  };
  return chain;
}

const app = { _id: "app-1" };

const category1 = {
  _id: "cat-1",
  publicId: "mcat-1",
  image: "cat.png",
  translations: [{ langKey: "en", title: "Appetizers", description: "Starters", slug: "appetizers" }],
};

function menuItemFixture(overrides: Record<string, unknown> = {}) {
  return {
    _id: "item-1",
    category: "cat-1",
    publicId: "mitem-1",
    image: "item.png",
    price: 6.5,
    calories: 320,
    availability: "available",
    ingredients: [],
    allergens: [],
    isVegetarian: false,
    isVegan: false,
    isSpicy: false,
    spicyLevel: 0,
    translations: [{ langKey: "en", title: "Spring Rolls", description: "Crispy" }],
    ...overrides,
  };
}

describe("frontendController — menu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("resolving which menu to serve", () => {
    test("404s when the application has no active menu", async () => {
      Menu.find.mockResolvedValue([]);
      const req = { frontendApp: app, langKey: "en", query: {} };
      const res = mockResponse();

      await getFrontendMenu(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Menu not found" });
    });

    test("400s ambiguously when more than one active menu exists and none is specified", async () => {
      Menu.find.mockResolvedValue([{ _id: "menu-1" }, { _id: "menu-2" }]);
      const req = { frontendApp: app, langKey: "en", query: {} };
      const res = mockResponse();

      await getFrontendMenu(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "menu is required when an application has more than one active menu",
      });
    });

    test("auto-resolves the sole active menu when ?menu= is omitted", async () => {
      const menu = { _id: "menu-1", publicId: "pub-1", slug: "main-menu", currency: "USD", settings: { showCalories: true, showImages: true, showUnavailableItems: true } };
      Menu.find.mockResolvedValue([menu]);
      MenuCategory.find.mockReturnValue(queryChain([]));
      MenuItem.find.mockReturnValue(queryChain([]));
      const req = { frontendApp: app, langKey: "en", query: {} };
      const res = mockResponse();

      await getFrontendMenu(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ menu: expect.objectContaining({ slug: "main-menu" }) }),
      );
    });

    test("404s when the requested ?menu= doesn't resolve to an active menu", async () => {
      Menu.findOne.mockResolvedValue(null);
      const req = { frontendApp: app, langKey: "en", query: { menu: "missing" } };
      const res = mockResponse();

      await getFrontendMenu(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Menu not found" });
    });
  });

  describe("getFrontendMenu — grouped shape", () => {
    const menu = {
      _id: "menu-1",
      publicId: "pub-1",
      slug: "main-menu",
      currency: "USD",
      settings: { showCalories: true, showImages: true, showUnavailableItems: false },
    };

    test("returns only active categories with their active, non-hidden items nested", async () => {
      Menu.findOne.mockResolvedValue(menu);
      MenuCategory.find.mockReturnValue(queryChain([category1]));
      MenuItem.find.mockReturnValue(queryChain([menuItemFixture()]));
      const req = { frontendApp: app, langKey: "en", query: { menu: "main-menu" } };
      const res = mockResponse();

      await getFrontendMenu(req, res);

      // showUnavailableItems is false, so the item query must filter to
      // availability: "available" only.
      expect(MenuItem.find).toHaveBeenCalledWith(
        expect.objectContaining({ availability: "available" }),
      );
      const payload = res.json.mock.calls[0][0];
      expect(payload.categories).toHaveLength(1);
      expect(payload.categories[0].items).toEqual([
        expect.objectContaining({ title: "Spring Rolls", price: 6.5 }),
      ]);
    });

    test("does not filter by availability when showUnavailableItems is true", async () => {
      Menu.findOne.mockResolvedValue({ ...menu, settings: { ...menu.settings, showUnavailableItems: true } });
      MenuCategory.find.mockReturnValue(queryChain([category1]));
      MenuItem.find.mockReturnValue(queryChain([menuItemFixture({ availability: "sold_out" })]));
      const req = { frontendApp: app, langKey: "en", query: { menu: "main-menu" } };
      const res = mockResponse();

      await getFrontendMenu(req, res);

      expect(MenuItem.find).toHaveBeenCalledWith(expect.not.objectContaining({ availability: expect.anything() }));
      const payload = res.json.mock.calls[0][0];
      expect(payload.categories[0].items[0].availability).toBe("sold_out");
    });

    test("omits image/calories fields when the menu's settings turn them off", async () => {
      Menu.findOne.mockResolvedValue({ ...menu, settings: { showCalories: false, showImages: false, showUnavailableItems: false } });
      MenuCategory.find.mockReturnValue(queryChain([category1]));
      MenuItem.find.mockReturnValue(queryChain([menuItemFixture()]));
      const req = { frontendApp: app, langKey: "en", query: { menu: "main-menu" } };
      const res = mockResponse();

      await getFrontendMenu(req, res);

      const payload = res.json.mock.calls[0][0];
      expect(payload.categories[0]).not.toHaveProperty("image");
      expect(payload.categories[0].items[0]).not.toHaveProperty("image");
      expect(payload.categories[0].items[0]).not.toHaveProperty("calories");
    });

    test("falls back to the base language when the requested language has no translation", async () => {
      Menu.findOne.mockResolvedValue(menu);
      MenuCategory.find.mockReturnValue(queryChain([category1]));
      MenuItem.find.mockReturnValue(queryChain([menuItemFixture()]));
      // Requesting French, which neither the category nor the item has —
      // pickTranslation should fall back to English (LANGUAGE_VALUES order).
      const req = { frontendApp: app, langKey: "fr", query: { menu: "main-menu" } };
      const res = mockResponse();

      await getFrontendMenu(req, res);

      const payload = res.json.mock.calls[0][0];
      expect(payload.categories[0].title).toBe("Appetizers");
      expect(payload.categories[0].items[0].title).toBe("Spring Rolls");
    });
  });

  describe("getFrontendMenuCategories", () => {
    test("shapes active categories for the resolved menu", async () => {
      Menu.findOne.mockResolvedValue({ _id: "menu-1", settings: { showImages: true } });
      MenuCategory.find.mockReturnValue(queryChain([category1]));
      const req = { frontendApp: app, langKey: "en", query: { menu: "main-menu" } };
      const res = mockResponse();

      await getFrontendMenuCategories(req, res);

      expect(res.json).toHaveBeenCalledWith([
        expect.objectContaining({ publicId: "mcat-1", title: "Appetizers", slug: "appetizers" }),
      ]);
    });
  });

  describe("getFrontendMenuCategory", () => {
    test("404s when the category doesn't resolve", async () => {
      Menu.findOne.mockResolvedValue({ _id: "menu-1", settings: {} });
      MenuCategory.findOne.mockResolvedValue(null);
      const req = { frontendApp: app, langKey: "en", params: { slugOrPublicId: "missing" }, query: { menu: "main-menu" } };
      const res = mockResponse();

      await getFrontendMenuCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Menu category not found" });
    });

    test("returns the category with its active items nested", async () => {
      Menu.findOne.mockResolvedValue({ _id: "menu-1", settings: { showCalories: true, showImages: true, showUnavailableItems: true } });
      MenuCategory.findOne.mockResolvedValue(category1);
      MenuItem.find.mockReturnValue(queryChain([menuItemFixture()]));
      const req = { frontendApp: app, langKey: "en", params: { slugOrPublicId: "appetizers" }, query: { menu: "main-menu" } };
      const res = mockResponse();

      await getFrontendMenuCategory(req, res);

      const payload = res.json.mock.calls[0][0];
      expect(payload.title).toBe("Appetizers");
      expect(payload.items).toHaveLength(1);
    });
  });

  describe("getFrontendMenuItems", () => {
    test("returns an empty page when the category filter doesn't resolve", async () => {
      Menu.findOne.mockResolvedValue({ _id: "menu-1", settings: {} });
      MenuCategory.findOne.mockResolvedValue(null);
      const req = { frontendApp: app, langKey: "en", query: { menu: "main-menu", category: "missing" } };
      const res = mockResponse();

      await getFrontendMenuItems(req, res);

      expect(res.json).toHaveBeenCalledWith({ items: [], total: 0, page: 1, limit: 20, totalPages: 1 });
      expect(MenuItem.find).not.toHaveBeenCalled();
    });

    test("lists active items in sortOrder, paginated", async () => {
      Menu.findOne.mockResolvedValue({ _id: "menu-1", settings: { showCalories: true, showImages: true, showUnavailableItems: true } });
      MenuItem.find.mockReturnValue(queryChain([menuItemFixture(), menuItemFixture({ _id: "item-2", publicId: "mitem-2" })]));
      const req = { frontendApp: app, langKey: "en", query: { menu: "main-menu", page: "1", limit: "1" } };
      const res = mockResponse();

      await getFrontendMenuItems(req, res);

      const payload = res.json.mock.calls[0][0];
      expect(payload.total).toBe(2);
      expect(payload.items).toHaveLength(1);
    });
  });
});
