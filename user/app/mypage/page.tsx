'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function MypagePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setUser(data.user);
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { credentials: 'include' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-900">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">마이페이지</h1>
        <div className="border border-gray-200 rounded-lg p-6 mb-6">
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">이름</dt>
              <dd className="text-gray-900">{user.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">이메일</dt>
              <dd className="text-gray-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">역할</dt>
              <dd className="text-gray-900">{user.role}</dd>
            </div>
          </dl>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/workspaces"
            className="px-4 py-2 bg-[#4A154B] text-white rounded-md hover:bg-[#611f69] font-medium"
          >
            워크스페이스
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-md hover:bg-gray-50"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
