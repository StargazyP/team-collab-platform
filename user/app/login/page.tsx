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
        <div className="flex min-h-screen flex-col items-center justify-center bg-white">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-medium text-black mb-2">
                        Sign In
                    </h2>
                    <p className="text-sm text-gray-600">
                        Welcome back
                    </p>
                </div>

                <div className="space-y-4">
                    {sessionReplacedMessage && (
                        <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                            다른 기기에서 로그인되어 로그아웃되었습니다. 다시 로그인해 주세요.
                        </div>
                    )}
                    {error && (
                        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
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
                                className="block w-full rounded-md bg-white border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <a href="#" className="text-xs text-gray-600 hover:text-black transition-colors">
                                    Forgot?
                                </a>
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded-md bg-white border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? "Signing in..." : "Continue"}
                        </button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-white px-2 text-gray-500">
                                Don't have an account?
                            </span>
                        </div>
                    </div>

                    <Link
                        href="/register"
                        className="block w-full text-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-black hover:border-gray-400 hover:bg-gray-50 transition-colors"
                    >
                        Create Account
                    </Link>
                </div>
            </div>
        </div>
    );
}
