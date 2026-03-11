"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [sessionReplacedMessage, setSessionReplacedMessage] = useState(false);

    useEffect(() => {
        if (searchParams.get("reason") === "session_replaced") {
            setSessionReplacedMessage(true);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
                // 🔐 HttpOnly 쿠키를 응답에서 수신하고 저장하기 위해 필수
                credentials: 'include',
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Login failed");
            }

            router.push("/workspaces");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-medium text-foreground mb-2">
                        Sign In
                    </h2>
                    <p className="text-sm text-default-600">
                        Welcome back
                    </p>
                </div>

                <div className="space-y-4">
                    {sessionReplacedMessage && (
                        <div className="rounded-md bg-warning-50 border border-warning-200 px-4 py-3 text-sm text-warning-800">
                            다른 기기에서 로그인되어 로그아웃되었습니다. 다시 로그인해 주세요.
                        </div>
                    )}
                    {error && (
                        <div className="rounded-md bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-600">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-default-700 mb-1.5">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full rounded-md bg-content1 border border-default-300 px-3 py-2 text-sm text-content1-foreground placeholder:text-default-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="password" className="block text-sm font-medium text-default-700">
                                    Password
                                </label>
                                <Link href="/forgot-password" className="text-xs text-default-600 hover:text-primary transition-colors">
                                    Forgot?
                                </Link>
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded-md bg-content1 border border-default-300 px-3 py-2 text-sm text-content1-foreground placeholder:text-default-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? "Signing in..." : "Continue"}
                        </button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-default-200" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-background px-2 text-default-500">
                                Don't have an account?
                            </span>
                        </div>
                    </div>

                    <Link
                        href="/register"
                        className="block w-full text-center rounded-md border border-default-300 bg-content1 px-4 py-2 text-sm font-medium text-foreground hover:border-primary-300 hover:bg-content2 transition-colors"
                    >
                        Create Account
                    </Link>
                </div>
            </div>
        </div>
    );
}
