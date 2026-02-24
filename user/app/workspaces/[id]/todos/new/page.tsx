'use client';

import { useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import RichTextEditor, { RichTextEditorRef } from '@/components/RichTextEditor';
import { sanitizeHtml } from '@/lib/sanitize';

export default function NewTodoPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = Number(params?.id);
  const editorRef = useRef<RichTextEditorRef>(null);

  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    const html = editorRef.current?.getHtml() ?? '';
    const description = sanitizeHtml(html);

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          workspaceId,
          description: description || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '작성에 실패했습니다.');
      }
      router.push(`/workspaces/${workspaceId}/todos`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!workspaceId || Number.isNaN(workspaceId)) {
    return (
      <div className="p-6">
        <p className="text-red-600">잘못된 워크스페이스입니다.</p>
        <Link href="/" className="text-gray-600 hover:underline mt-2 inline-block">← 홈</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">새 TODO 작성</h1>
        <Link
          href={`/workspaces/${workspaceId}/todos`}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← 목록으로
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="text-sm font-medium text-gray-700">제목</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="할 일 제목을 입력하세요"
          className="px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4A154B]/50 focus:border-[#4A154B]"
          required
          autoFocus
        />

        <label className="text-sm font-medium text-gray-700">상세 내용</label>
        <RichTextEditor
          ref={editorRef}
          placeholder="내용을 입력하세요. 굵게, 목록, 인용 등 서식을 사용할 수 있습니다."
          minHeight="280px"
        />

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="px-5 py-3 bg-[#4A154B] text-white rounded-lg hover:bg-[#611f69] disabled:opacity-50 font-medium"
          >
            {submitting ? '작성 중...' : '작성'}
          </button>
          <Link
            href={`/workspaces/${workspaceId}/todos`}
            className="px-5 py-3 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 font-medium inline-block"
          >
            취소
          </Link>
        </div>
      </form>
    </div>
  );
}
