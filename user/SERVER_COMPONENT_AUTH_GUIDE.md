# Server Component에서 인증 사용 가이드

## 📋 개요

Next.js Server Component에서 JWT 토큰을 사용하여 인증된 사용자 정보를 가져오는 방법입니다.

## 🔧 1단계: auth.ts에 Server Component용 함수 추가

`user/src/lib/auth.ts` 파일에 다음 함수를 추가하세요:

```typescript
import { cookies } from "next/headers";

/**
 * Server Component에서 현재 인증된 사용자 정보를 가져옵니다.
 * 쿠키에서 JWT 토큰을 읽어 검증합니다.
 * @returns 사용자 정보 또는 null (인증되지 않은 경우)
 */
export async function getServerUser(): Promise<{
    id: number;
    role: "user" | "admin";
} | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        
        if (!token) {
            return null;
        }
        
        const payload = verifyToken(token);
        
        return {
            id: payload.sub,
            role: payload.role,
        };
    } catch (error) {
        // 토큰이 만료되었거나 유효하지 않은 경우
        return null;
    }
}
```

## 📝 2단계: Server Component에서 사용하기

### 예제 1: 기본 사용법

`user/src/app/page.tsx` 파일을 다음과 같이 수정하세요:

```typescript
import { getServerUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
    const user = await getServerUser();
    
    // 인증되지 않은 경우 로그인 페이지로 리다이렉트
    if (!user) {
        redirect("/login");
    }
    
    return (
        <div className="flex min-h-screen items-center justify-center">
            <main className="flex flex-col gap-4">
                <h1 className="text-2xl font-bold">
                    안녕하세요, {user.id}번 사용자님!
                </h1>
                <p>역할: {user.role}</p>
            </main>
        </div>
    );
}
```

### 예제 2: 조건부 렌더링

인증 여부에 따라 다른 UI를 보여주는 예제:

```typescript
import { getServerUser } from "@/lib/auth";
import Link from "next/link";

export default async function Home() {
    const user = await getServerUser();
    
    return (
        <div className="flex min-h-screen items-center justify-center">
            {user ? (
                <div>
                    <h1>로그인됨: {user.id}</h1>
                    <p>역할: {user.role}</p>
                </div>
            ) : (
                <div>
                    <h1>로그인이 필요합니다</h1>
                    <Link href="/login">로그인하기</Link>
                </div>
            )}
        </div>
    );
}
```

### 예제 3: 관리자 전용 페이지

`user/src/app/admin/page.tsx` 파일을 생성하세요:

```typescript
import { getServerUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
    const user = await getServerUser();
    
    // 인증되지 않은 경우
    if (!user) {
        redirect("/login");
    }
    
    // 관리자가 아닌 경우
    if (user.role !== "admin") {
        redirect("/");
    }
    
    return (
        <div>
            <h1>관리자 페이지</h1>
            <p>관리자만 접근 가능합니다.</p>
        </div>
    );
}
```

### 예제 4: 데이터베이스와 함께 사용

사용자 정보를 DB에서 가져와서 사용하는 예제:

```typescript
import { getServerUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
    const user = await getServerUser();
    
    if (!user) {
        redirect("/login");
    }
    
    // DB에서 사용자 상세 정보 가져오기
    const [rows] = await db.query(
        `SELECT id, name, email, role FROM users WHERE id = ?`,
        [user.id]
    ) as any[];
    
    const userInfo = rows[0];
    
    return (
        <div>
            <h1>프로필</h1>
            <p>이름: {userInfo.name}</p>
            <p>이메일: {userInfo.email}</p>
            <p>역할: {userInfo.role}</p>
        </div>
    );
}
```

## 🎯 3단계: Layout에서 사용하기

`user/src/app/layout.tsx`에서 사용자 정보를 전역적으로 사용할 수 있습니다:

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getServerUser } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My App",
  description: "My App Description",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getServerUser();
  
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {user && (
          <header>
            <p>로그인됨: {user.id} ({user.role})</p>
          </header>
        )}
        {children}
      </body>
    </html>
  );
}
```

## ⚠️ 주의사항

1. **Server Component만 사용 가능**: `getServerUser()`는 Server Component에서만 사용할 수 있습니다. Client Component에서는 사용할 수 없습니다.

2. **비동기 함수**: `cookies()`는 Next.js 15+에서 비동기 함수이므로 `await`를 사용해야 합니다.

3. **에러 처리**: 토큰이 만료되었거나 유효하지 않은 경우 `null`을 반환하므로, 항상 null 체크를 해야 합니다.

4. **리다이렉트**: 인증이 필요한 페이지에서는 `redirect()`를 사용하여 로그인 페이지로 보내는 것이 좋습니다.

## 🔍 완성된 auth.ts 예제

전체 `auth.ts` 파일 예제:

```typescript
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";

export type JWTPayload = {
    sub: number; // user id
    role: "user" | "admin";
    iat?: number;
    exp?: number;
};

export function verifyToken(token: string): JWTPayload {
    const SECRET = process.env.JWT_SECRET;
    if (!SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }
    const decoded = jwt.verify(token, SECRET);
    
    if (typeof decoded === "string") {
        throw new Error("Invalid token format");
    }
    
    return decoded as unknown as JWTPayload;
}

/**
 * API 라우트에서 현재 인증된 사용자 정보를 가져옵니다.
 * middleware에서 설정한 헤더를 읽어옵니다.
 */
export function getCurrentUser(req: NextRequest): {
    id: number;
    role: "user" | "admin";
} | null {
    const userId = req.headers.get("x-user-id");
    const userRole = req.headers.get("x-user-role");

    if (!userId || !userRole) {
        return null;
    }

    return {
        id: parseInt(userId, 10),
        role: userRole as "user" | "admin",
    };
}

/**
 * Server Component에서 현재 인증된 사용자 정보를 가져옵니다.
 * 쿠키에서 JWT 토큰을 읽어 검증합니다.
 */
export async function getServerUser(): Promise<{
    id: number;
    role: "user" | "admin";
} | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        
        if (!token) {
            return null;
        }
        
        const payload = verifyToken(token);
        
        return {
            id: payload.sub,
            role: payload.role,
        };
    } catch (error) {
        // 토큰이 만료되었거나 유효하지 않은 경우
        return null;
    }
}
```

## ✅ 체크리스트

- [ ] `auth.ts`에 `getServerUser()` 함수 추가
- [ ] `cookies` import 추가 (`next/headers`에서)
- [ ] Server Component에서 `getServerUser()` 사용
- [ ] null 체크 및 리다이렉트 처리
- [ ] 테스트: 로그인 후 페이지 접근 확인
- [ ] 테스트: 로그아웃 후 페이지 접근 확인
