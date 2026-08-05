import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";

// Mimics a real Mongoose Query: every chain method returns itself, and it
// resolves to `value` however many (or few) chain calls preceded the await.
// Same helper used by contentController.aiTranslation.test.ts.
function queryChain(value: unknown) {
  const chain: any = {
    select: jest.fn(() => chain),
    populate: jest.fn(() => chain),
    then: (resolve: any, reject: any) => Promise.resolve(value).then(resolve, reject),
  };
  return chain;
}

const User = {
  findOne: jest.fn(),
  findById: jest.fn(),
};

const RefreshToken = {
  create: jest.fn(),
  findOne: jest.fn(),
  updateOne: jest.fn(),
  updateMany: jest.fn(),
};

jest.unstable_mockModule("../src/models/User.js", () => ({ default: User }));
jest.unstable_mockModule("../src/models/RefreshToken.js", () => ({ default: RefreshToken }));

const { login, refresh, logout, changePassword } = (await import("../src/controllers/authController.js")) as any;

function mockResponse() {
  const res: any = { status: jest.fn(), json: jest.fn(), send: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

function mockUser(overrides: any = {}) {
  return {
    _id: "user-1",
    email: "admin@example.com",
    role: "WebSiteAdmin",
    status: "active",
    applications: [],
    password: "hashed-pw",
    comparePassword: jest.fn().mockResolvedValue(true),
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

const JWT_SECRET = "test-jwt-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const JWT_REFRESH_SECRET = "test-jwt-refresh-secret-bbbbbbbbbbbbbbbbbbbbbbbb";

describe("authController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.JWT_REFRESH_SECRET = JWT_REFRESH_SECRET;
    process.env.JWT_EXPIRES_IN = "15m";
    process.env.JWT_REFRESH_EXPIRES_IN = "7d";
    RefreshToken.create.mockResolvedValue({});
  });

  describe("login", () => {
    test("returns an access token, a refresh token, and the user for valid credentials", async () => {
      const user = mockUser();
      User.findOne.mockReturnValue(queryChain(user));
      const res = mockResponse();

      await login({ body: { email: "admin@example.com", password: "correct-password" } }, res);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: expect.any(String),
          refreshToken: expect.any(String),
          user: expect.objectContaining({ _id: "user-1", email: "admin@example.com" }),
        }),
      );
      // The returned user must never carry the password hash.
      const [payload] = res.json.mock.calls[0];
      expect(payload.user.password).toBeUndefined();
      expect(RefreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({ user: "user-1", tokenHash: expect.any(String), expiresAt: expect.any(Date) }),
      );
    });

    test("rejects invalid credentials", async () => {
      const user = mockUser({ comparePassword: jest.fn().mockResolvedValue(false) });
      User.findOne.mockReturnValue(queryChain(user));
      const res = mockResponse();

      await login({ body: { email: "admin@example.com", password: "wrong" } }, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(RefreshToken.create).not.toHaveBeenCalled();
    });

    test("keeps WebsiteUser blocked from admin login", async () => {
      const user = mockUser({ role: "WebsiteUser" });
      User.findOne.mockReturnValue(queryChain(user));
      const res = mockResponse();

      await login({ body: { email: "user@example.com", password: "correct-password" } }, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(RefreshToken.create).not.toHaveBeenCalled();
    });
  });

  describe("refresh", () => {
    function signRefreshToken(overrides: any = {}) {
      return jwt.sign(
        { sub: "user-1", jti: "jti-1", ...overrides.payload },
        overrides.secret ?? JWT_REFRESH_SECRET,
        { expiresIn: overrides.expiresIn ?? "7d" },
      );
    }

    test("returns a new access token and rotates the refresh token", async () => {
      const rawRefreshToken = signRefreshToken();
      const stored: any = { revokedAt: null, expiresAt: new Date(Date.now() + 60_000), save: jest.fn().mockResolvedValue(undefined) };
      RefreshToken.findOne.mockResolvedValue(stored);
      User.findById.mockReturnValue(queryChain(mockUser()));
      const res = mockResponse();

      await refresh({ body: { refreshToken: rawRefreshToken } }, res);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ token: expect.any(String), refreshToken: expect.any(String) }),
      );
      // Old refresh token is single-use: rotating it revokes the stored record.
      expect(stored.revokedAt).not.toBeNull();
      expect(stored.save).toHaveBeenCalled();
      // A fresh refresh token record is persisted for the rotated token.
      expect(RefreshToken.create).toHaveBeenCalledTimes(1);
    });

    test("rejects a refresh token signed with the wrong secret", async () => {
      const badToken = signRefreshToken({ secret: "not-the-real-secret" });
      const res = mockResponse();

      await refresh({ body: { refreshToken: badToken } }, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired refresh token" });
      expect(RefreshToken.findOne).not.toHaveBeenCalled();
    });

    test("rejects an expired refresh token", async () => {
      const expiredToken = signRefreshToken({ expiresIn: "-1s" });
      const res = mockResponse();

      await refresh({ body: { refreshToken: expiredToken } }, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired refresh token" });
    });

    test("rejects a revoked refresh token", async () => {
      const rawRefreshToken = signRefreshToken();
      RefreshToken.findOne.mockResolvedValue({ revokedAt: new Date(), expiresAt: new Date(Date.now() + 60_000) });
      const res = mockResponse();

      await refresh({ body: { refreshToken: rawRefreshToken } }, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired refresh token" });
      expect(User.findById).not.toHaveBeenCalled();
    });

    test("rejects a refresh token with no matching stored record", async () => {
      const rawRefreshToken = signRefreshToken();
      RefreshToken.findOne.mockResolvedValue(null);
      const res = mockResponse();

      await refresh({ body: { refreshToken: rawRefreshToken } }, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired refresh token" });
    });

    test("rejects refresh for a deleted (no longer existing) user", async () => {
      const rawRefreshToken = signRefreshToken();
      const stored: any = { revokedAt: null, expiresAt: new Date(Date.now() + 60_000), save: jest.fn() };
      RefreshToken.findOne.mockResolvedValue(stored);
      User.findById.mockReturnValue(queryChain(null));
      const res = mockResponse();

      await refresh({ body: { refreshToken: rawRefreshToken } }, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired refresh token" });
      expect(stored.save).not.toHaveBeenCalled();
    });

    test("rejects refresh for an inactive user", async () => {
      const rawRefreshToken = signRefreshToken();
      const stored: any = { revokedAt: null, expiresAt: new Date(Date.now() + 60_000), save: jest.fn() };
      RefreshToken.findOne.mockResolvedValue(stored);
      User.findById.mockReturnValue(queryChain(mockUser({ status: "inactive" })));
      const res = mockResponse();

      await refresh({ body: { refreshToken: rawRefreshToken } }, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired refresh token" });
    });

    test("rejects a missing refresh token", async () => {
      const res = mockResponse();

      await refresh({ body: {} }, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(RefreshToken.findOne).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    test("revokes the given refresh token and responds 204", async () => {
      RefreshToken.updateOne.mockResolvedValue({});
      const res = mockResponse();

      await logout({ body: { refreshToken: "some-refresh-token" } }, res);

      expect(RefreshToken.updateOne).toHaveBeenCalledWith(
        { tokenHash: expect.any(String) },
        { $set: { revokedAt: expect.any(Date) } },
      );
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    test("is a no-op (still 204) when no refresh token is given", async () => {
      const res = mockResponse();

      await logout({ body: {} }, res);

      expect(RefreshToken.updateOne).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });

  describe("changePassword", () => {
    test("rotates the refresh token and returns a new access/refresh pair", async () => {
      const user = mockUser();
      User.findById.mockReturnValue(queryChain(user));
      RefreshToken.updateMany.mockResolvedValue({});
      const res = mockResponse();

      await changePassword(
        { user: { _id: "user-1" }, body: { currentPassword: "old-password", newPassword: "new-password-123" } },
        res,
      );

      expect(user.password).toBe("new-password-123");
      expect(user.save).toHaveBeenCalled();
      // Every other outstanding session for this user is invalidated, not just this one.
      expect(RefreshToken.updateMany).toHaveBeenCalledWith(
        { user: "user-1", revokedAt: null },
        { $set: { revokedAt: expect.any(Date) } },
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Password updated", token: expect.any(String), refreshToken: expect.any(String) }),
      );
    });

    test("rejects an incorrect current password", async () => {
      const user = mockUser({ comparePassword: jest.fn().mockResolvedValue(false) });
      User.findById.mockReturnValue(queryChain(user));
      const res = mockResponse();

      await changePassword(
        { user: { _id: "user-1" }, body: { currentPassword: "wrong", newPassword: "new-password-123" } },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(401);
      expect(RefreshToken.updateMany).not.toHaveBeenCalled();
    });
  });
});
