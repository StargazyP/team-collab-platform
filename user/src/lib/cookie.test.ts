import { describe, it, expect, afterEach } from "vitest";
import { getAuthCookieOptions } from "./cookie";

describe("getAuthCookieOptions", () => {
  const orig = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = orig;
  });

  it("공통 옵션: httpOnly, path, maxAge", () => {
    const opts = getAuthCookieOptions();
    expect(opts.httpOnly).toBe(true);
    expect(opts.path).toBe("/");
    expect(opts.maxAge).toBe(60 * 60);
  });

  it("development에서는 sameSite lax, secure false", () => {
    process.env.NODE_ENV = "development";
    const opts = getAuthCookieOptions();
    expect(opts.sameSite).toBe("lax");
    expect(opts.secure).toBe(false);
  });

  it("production에서는 sameSite none, secure true", () => {
    process.env.NODE_ENV = "production";
    const opts = getAuthCookieOptions();
    expect(opts.sameSite).toBe("none");
    expect(opts.secure).toBe(true);
  });
});
