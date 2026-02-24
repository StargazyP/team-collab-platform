import { NextRequest, NextResponse } from "next/server";

// ========== 페이지 경로: 인증 필요 시 /login 리다이렉트 ==========
const PROTECTED_PATHS = ["/workspaces", "/admin", "/mypage"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}

// ========== API: 인증 필요 없는 공개 경로 ==========
const PUBLIC_API_PATHS = [
  "/api/health",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/me",
  "/api/auth/logout",
  "/api/auth/ws-token",
];

/**
 * Proxy: 페이지 보호(리다이렉트) + API 토큰 체크(401)
 * - Next.js 16: middleware 대신 proxy 단일 파일만 사용
 */
export function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // 1) 보호된 페이지 경로: 토큰 없으면 /login 리다이렉트
  if (isProtectedPath(pathname)) {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 2) API가 아니면 통과
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 3) 공개 API는 통과
  if (PUBLIC_API_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 4) 그 외 API: 토큰 없으면 401
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/workspaces",
    "/workspaces/:path*",
    "/admin",
    "/admin/:path*",
    "/mypage",
    "/mypage/:path*",
    "/api/:path*",
  ],
};
