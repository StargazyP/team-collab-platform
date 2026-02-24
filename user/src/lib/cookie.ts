export function getAuthCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    path: "/",
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    maxAge: 60 * 60, // 1 hour
  } as const;
}
