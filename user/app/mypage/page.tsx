"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
    id: number;
    name: string;
    email: string;
}

export default function MyPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const res = await fetch("/api/auth/me");

            if (!res.ok) {
                // 인증되지 않은 경우 로그인 페이지로 리다이렉트
                router.push("/login");
                return;
            }

            const data = await res.json();
            setUser(data.user);
        } catch (error) {
            console.error("Failed to fetch user data:", error);
            router.push("/login");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
            });
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="text-sm text-gray-600">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="border-b border-gray-200">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <h1 className="text-xl font-medium text-black">SlackClone</h1>
                        <button
                            onClick={handleLogout}
                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-50 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                <div className="max-w-3xl">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-medium text-black mb-2">
                            Welcome back, {user.name}
                        </h2>
                        <p className="text-sm text-gray-600">
                            Manage your account and preferences
                        </p>
                    </div>

                    {/* Profile Card */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 mb-6">
                        <h3 className="text-lg font-medium text-black mb-4">
                            Profile Information
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name
                                </label>
                                <div className="text-sm text-black">{user.name}</div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <div className="text-sm text-black">{user.email}</div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    User ID
                                </label>
                                <div className="text-sm text-gray-600">#{user.id}</div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                        <h3 className="text-lg font-medium text-black mb-4">
                            Quick Actions
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button className="rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-black hover:bg-gray-50 transition-colors text-left">
                                Edit Profile
                            </button>
                            <button className="rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-black hover:bg-gray-50 transition-colors text-left">
                                Change Password
                            </button>
                            <button className="rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-black hover:bg-gray-50 transition-colors text-left">
                                Notification Settings
                            </button>
                            <button className="rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-black hover:bg-gray-50 transition-colors text-left">
                                Privacy Settings
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
