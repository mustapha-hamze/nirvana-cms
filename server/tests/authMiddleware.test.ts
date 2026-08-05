import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";

const User = {
  findById: jest.fn(),
};

jest.unstable_mockModule("../src/models/User.js", () => ({ default: User }));

const { authenticate } = (await import("../src/middleware/auth.js")) as any;

function mockResponse() {
  const res: any = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

const JWT_SECRET = "test-jwt-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

describe("authenticate middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = JWT_SECRET;
  });

  test("rejects a request with no Authorization header", async () => {
    const req: any = { headers: {} };
    const res = mockResponse();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("rejects an expired access token", async () => {
    const expiredToken = jwt.sign({ sub: "user-1", role: "WebSiteAdmin" }, JWT_SECRET, { expiresIn: "-1s" });
    const req: any = { headers: { authorization: `Bearer ${expiredToken}` } };
    const res = mockResponse();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
    expect(next).not.toHaveBeenCalled();
    expect(User.findById).not.toHaveBeenCalled();
  });

  test("rejects a token signed with a different secret", async () => {
    const forgedToken = jwt.sign({ sub: "user-1", role: "SuperAdmin" }, "wrong-secret", { expiresIn: "15m" });
    const req: any = { headers: { authorization: `Bearer ${forgedToken}` } };
    const res = mockResponse();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("rejects a valid token for a user that no longer exists", async () => {
    const token = jwt.sign({ sub: "user-1", role: "WebSiteAdmin" }, JWT_SECRET, { expiresIn: "15m" });
    User.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const res = mockResponse();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("accepts a valid, unexpired access token for an active user", async () => {
    const token = jwt.sign({ sub: "user-1", role: "WebSiteAdmin" }, JWT_SECRET, { expiresIn: "15m" });
    const user = { _id: "user-1", status: "active" };
    User.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(user) });
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const res = mockResponse();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBe(user);
    expect(res.status).not.toHaveBeenCalled();
  });
});
