import { NextRequest, NextResponse } from "next/server";
import { verifyToken, type JWTPayload } from "@/lib/auth";

/**
 * ✅ 인증이 필요 없는 공개 API
 * - health: docker / k8s / LB
 * - auth: 로그인 / 회원가입
 */
const PUBLIC_PATHS = [
  "/api/health",
  "/api/auth/login",
  "/api/auth/register",
];

/**
 * 🔐 관리자 전용 API
 */
const ADMIN_ONLY_PATHS = [
  "/api/users",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /**
   * ✅ 공개 경로는 무조건 통과
   */
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  /**
   * 🔑 토큰 확인
   */
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  /**
   * 🔍 토큰 검증
   */
  let payload: JWTPayload;
  try {
    payload = verifyToken(token);
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return NextResponse.json(
        { error: "Token expired" },
        { status: 401 }
      );
    }

    if (err.message === "JWT_SECRET is not configured") {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Invalid token" },
      { status: 401 }
    );
  }

  /**
   * 🧠 사용자 정보 전달 (API Route에서 사용)
   */
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", payload.sub.toString());
  requestHeaders.set("x-user-role", payload.role);

  /**
   * 🚫 관리자 권한 체크
   */
  if (ADMIN_ONLY_PATHS.some((path) => pathname.startsWith(path))) {
    if (payload.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

/**
 * ⭐️ API 전체에 미들웨어 적용
 * (공개 경로는 위에서 예외 처리)
 */
export const config = {
  matcher: ["/api/:path*"],
};
