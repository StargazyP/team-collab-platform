"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const PROTECTED_PREFIXES = ["/workspaces", "/admin", "/mypage"];
const CHECK_INTERVAL_MS = 45 * 1000; // 45초마다 세션 검사

/**
 * 보호된 경로에서 주기적으로 세션 유효성 검사.
 * 다른 기기에서 로그인하면 tokenVersion이 바뀌어 이 기기의 토큰은 401이 됨 → 로그인 페이지로 리다이렉트.
 */
export function SessionCheck() {
  const pathname = usePathname();
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isProtected =
    pathname != null &&
    PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  useEffect(() => {
    if (!isProtected) return;

    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.status === 401) {
          router.replace("/login?reason=session_replaced");
        }
      } catch {
        router.replace("/login?reason=session_replaced");
      }
    };

    // 주기적 검사
    intervalRef.current = setInterval(checkSession, CHECK_INTERVAL_MS);
    // 탭 포커스 시에도 한 번 검사 (다른 기기 로그인 후 이 탭으로 돌아왔을 때)
    const onFocus = () => void checkSession();
    window.addEventListener("focus", onFocus);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener("focus", onFocus);
    };
  }, [isProtected, router]);

  return null;
}
