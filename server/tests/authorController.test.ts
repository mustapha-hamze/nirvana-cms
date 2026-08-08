import { jest } from "@jest/globals";

const Author = {
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

jest.unstable_mockModule("../src/models/Author.js", () => ({ default: Author }));
jest.unstable_mockModule("../src/models/application/Application.js", () => ({ default: Application }));
jest.unstable_mockModule("../src/models/application/ApplicationSetting.js", () => ({ default: ApplicationSetting }));
jest.unstable_mockModule("../src/middleware/auth.js", () => ({ userCanAccessApplication }));
jest.unstable_mockModule("../src/utils/publicId.js", () => ({ generatePublicId }));

const {
  getAuthors,
  getAuthor,
  createAuthor,
  updateAuthor,
  updateAuthorStatus,
  deleteAuthor,
} = (await import("../src/controllers/authorController.js")) as any;

function mockResponse() {
  const res: any = {
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

describe("authorController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    generatePublicId.mockReturnValue("public-id-1");
    userCanAccessApplication.mockReturnValue(true);
    ApplicationSetting.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({ languages: ["en", "fa"] }),
    });
    // Author.exists is only used for slug-collision checks here (no
    // parent/hierarchy concept, unlike Category) — default to "no collision".
    Author.exists.mockResolvedValue(false);
  });

  describe("getAuthors", () => {
    test("requires an application query parameter", async () => {
      const res = mockResponse();

      await getAuthors({ query: {}, user: mockUser() }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "application is required" });
      expect(Author.find).not.toHaveBeenCalled();
    });

    test("rejects users without access to the requested application", async () => {
      userCanAccessApplication.mockReturnValue(false);
      const res = mockResponse();

      await getAuthors({ query: { application: "app-1" }, user: mockUser() }, res);

      expect(userCanAccessApplication).toHaveBeenCalledWith(expect.any(Object), "app-1");
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Insufficient permissions" });
    });

    test("applies a status filter and paginates by displayName", async () => {
      const authors = [{ _id: "auth-1", displayName: "Jane Doe", createdAt: "2026-01-01" }];
      Author.find.mockResolvedValue(authors);
      const res = mockResponse();

      await getAuthors({ query: { application: "app-1", status: "active" }, user: mockUser() }, res);

      expect(Author.find).toHaveBeenCalledWith({ application: "app-1", status: "active" });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ items: authors, total: 1 }),
      );
    });
  });

  describe("getAuthor", () => {
    test("returns 404 when the author does not exist", async () => {
      Author.findById.mockResolvedValue(null);
      const res = mockResponse();

      await getAuthor({ params: { id: "missing" }, user: mockUser() }, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Author not found" });
    });

    test("returns the author when the user can access its application", async () => {
      const author = { _id: "auth-1", application: "app-1" };
      Author.findById.mockResolvedValue(author);
      const res = mockResponse();

      await getAuthor({ params: { id: "auth-1" }, user: mockUser() }, res);

      expect(userCanAccessApplication).toHaveBeenCalledWith(expect.any(Object), "app-1");
      expect(res.json).toHaveBeenCalledWith(author);
    });
  });

  describe("createAuthor", () => {
    test("requires firstName", async () => {
      Application.exists.mockResolvedValue(true);
      const res = mockResponse();

      await createAuthor({ body: { application: "app-1" }, user: mockUser() }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "firstName is required" });
      expect(Author.create).not.toHaveBeenCalled();
    });

    test("derives displayName and slug from firstName/lastName, and creates the author", async () => {
      Application.exists.mockResolvedValue(true);
      const created = { _id: "auth-1", displayName: "Jane Doe", publicId: "public-id-1" };
      Author.create.mockResolvedValue(created);
      const res = mockResponse();

      await createAuthor(
        { body: { application: "app-1", firstName: "Jane", lastName: "Doe" }, user: mockUser() },
        res,
      );

      expect(Author.create).toHaveBeenCalledWith(
        expect.objectContaining({
          application: "app-1",
          firstName: "Jane",
          lastName: "Doe",
          displayName: "Jane Doe",
          slug: "jane-doe",
          publicId: "public-id-1",
        }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(created);
    });

    test("uses an explicit displayName instead of the derived one when provided", async () => {
      Application.exists.mockResolvedValue(true);
      Author.create.mockResolvedValue({ _id: "auth-1" });
      const res = mockResponse();

      await createAuthor(
        {
          body: { application: "app-1", firstName: "Jane", lastName: "Doe", displayName: "J. Doe" },
          user: mockUser(),
        },
        res,
      );

      expect(Author.create).toHaveBeenCalledWith(
        expect.objectContaining({ displayName: "J. Doe", slug: "j-doe" }),
      );
    });

    test("disambiguates a colliding slug", async () => {
      Application.exists.mockResolvedValue(true);
      Author.exists.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
      Author.create.mockResolvedValue({ _id: "auth-1" });
      const res = mockResponse();

      await createAuthor(
        { body: { application: "app-1", firstName: "Jane", lastName: "Doe" }, user: mockUser() },
        res,
      );

      expect(Author.create).toHaveBeenCalledWith(expect.objectContaining({ slug: "jane-doe-2" }));
    });

    test("rejects translations with a language outside the application's allowed languages", async () => {
      Application.exists.mockResolvedValue(true);
      const res = mockResponse();

      await createAuthor(
        {
          body: {
            application: "app-1",
            firstName: "Jane",
            translations: [{ langKey: "fr", bio: "Bonjour" }],
          },
          user: mockUser(),
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "translations.langKey must be one of: en, fa",
      });
      expect(Author.create).not.toHaveBeenCalled();
    });

    test("rejects invalid status values", async () => {
      Application.exists.mockResolvedValue(true);
      const res = mockResponse();

      await createAuthor(
        { body: { application: "app-1", firstName: "Jane", status: "archived" }, user: mockUser() },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "status must be one of: active, inactive" });
      expect(Author.create).not.toHaveBeenCalled();
    });

    test("retries publicId generation after duplicate key collisions", async () => {
      Application.exists.mockResolvedValue(true);
      generatePublicId.mockReturnValueOnce("duplicate-id").mockReturnValueOnce("public-id-2");
      Author.create
        .mockRejectedValueOnce({ code: 11000, keyPattern: { publicId: 1 } })
        .mockResolvedValueOnce({ _id: "auth-1", publicId: "public-id-2" });
      const res = mockResponse();

      await createAuthor(
        { body: { application: "app-1", firstName: "Jane" }, user: mockUser() },
        res,
      );

      expect(Author.create).toHaveBeenCalledTimes(2);
      expect(Author.create).toHaveBeenNthCalledWith(2, expect.objectContaining({ publicId: "public-id-2" }));
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("updateAuthor", () => {
    test("updates mutable fields and saves the document", async () => {
      const author: any = {
        _id: "auth-1",
        application: "app-1",
        firstName: "Jane",
        lastName: "Doe",
        displayName: "Jane Doe",
        slug: "jane-doe",
        email: "",
        status: "active",
        save: jest.fn().mockResolvedValue(undefined),
      };
      Author.findById.mockResolvedValue(author);
      const res = mockResponse();

      await updateAuthor(
        {
          params: { id: "auth-1" },
          body: { email: "jane@example.com", status: "inactive" },
          user: mockUser(),
        },
        res,
      );

      expect(author.email).toBe("jane@example.com");
      expect(author.status).toBe("inactive");
      expect(author.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(author);
    });

    test("keeps the existing slug when displayName is unchanged", async () => {
      const author: any = {
        _id: "auth-1",
        application: "app-1",
        firstName: "Jane",
        lastName: "Doe",
        displayName: "Jane Doe",
        slug: "jane-doe",
        save: jest.fn().mockResolvedValue(undefined),
      };
      Author.findById.mockResolvedValue(author);
      const res = mockResponse();

      await updateAuthor(
        { params: { id: "auth-1" }, body: { email: "jane@example.com" }, user: mockUser() },
        res,
      );

      expect(author.slug).toBe("jane-doe");
      expect(Author.exists).not.toHaveBeenCalled();
    });

    test("re-derives the slug when displayName changes", async () => {
      const author: any = {
        _id: "auth-1",
        application: "app-1",
        firstName: "Jane",
        lastName: "Doe",
        displayName: "Jane Doe",
        slug: "jane-doe",
        save: jest.fn().mockResolvedValue(undefined),
      };
      Author.findById.mockResolvedValue(author);
      const res = mockResponse();

      await updateAuthor(
        { params: { id: "auth-1" }, body: { displayName: "Jane D. Smith" }, user: mockUser() },
        res,
      );

      expect(author.slug).toBe("jane-d-smith");
    });

    test("rejects clearing firstName to an empty string", async () => {
      const author: any = { _id: "auth-1", application: "app-1", save: jest.fn() };
      Author.findById.mockResolvedValue(author);
      const res = mockResponse();

      await updateAuthor(
        { params: { id: "auth-1" }, body: { firstName: "   " }, user: mockUser() },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(author.save).not.toHaveBeenCalled();
    });
  });

  describe("updateAuthorStatus", () => {
    test("requires a known status", async () => {
      const res = mockResponse();

      await updateAuthorStatus(
        { params: { id: "auth-1" }, body: { status: "deleted" }, user: mockUser() },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "status must be one of: active, inactive" });
    });

    test("sets the author status", async () => {
      const author: any = {
        _id: "auth-1",
        application: "app-1",
        status: "active",
        save: jest.fn().mockResolvedValue(undefined),
      };
      Author.findById.mockResolvedValue(author);
      const res = mockResponse();

      await updateAuthorStatus(
        { params: { id: "auth-1" }, body: { status: "inactive" }, user: mockUser() },
        res,
      );

      expect(author.status).toBe("inactive");
      expect(author.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(author);
    });
  });

  describe("deleteAuthor", () => {
    test("soft deletes the author", async () => {
      const author: any = {
        _id: "auth-1",
        application: "app-1",
        isDeleted: false,
        save: jest.fn().mockResolvedValue(undefined),
      };
      Author.findById.mockResolvedValue(author);
      const res = mockResponse();

      await deleteAuthor({ params: { id: "auth-1" }, user: mockUser() }, res);

      expect(author.isDeleted).toBe(true);
      expect(author.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    test("returns 404 when the author does not exist", async () => {
      Author.findById.mockResolvedValue(null);
      const res = mockResponse();

      await deleteAuthor({ params: { id: "missing" }, user: mockUser() }, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
