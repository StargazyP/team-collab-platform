'use client';

import { useState, useEffect } from 'react';

/**
 * 서버와 클라이언트(특히 Android/iOS)에서 toLocaleString/toLocaleDateString 결과가
 * 달라 하이드레이션 불일치가 나는 것을 막기 위해, 마운트 후에만 포맷된 날짜를 표시합니다.
 * SSR/초기 클라이언트에서는 동일한 플레이스홀더를 렌더합니다.
 */
interface FormattedDateProps {
  value: Date | string;
  /** 'datetime' | 'date' (기본: datetime) */
  variant?: 'datetime' | 'date';
  className?: string;
}

const PLACEHOLDER = '—'; // 서버/클라이언트 동일 출력으로 하이드레이션 일치

export function FormattedDate({ value, variant = 'datetime', className }: FormattedDateProps) {
  const [mounted, setMounted] = useState(false);
  const date = typeof value === 'string' ? new Date(value) : value;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className={className}>{PLACEHOLDER}</span>;
  }

  const formatted =
    variant === 'date'
      ? date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
      : date.toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });

  return <span className={className}>{formatted}</span>;
}
