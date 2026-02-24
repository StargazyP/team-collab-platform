'use client';

import { useRef, useCallback, forwardRef, useImperativeHandle, useEffect, useState } from 'react';

function BoldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
      <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </svg>
  );
}
function ItalicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  );
}
function UnderlineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 3v7a6 6 0 0 0 12 0V3" />
      <line x1="4" y1="21" x2="20" y2="21" />
    </svg>
  );
}
function StrikethroughIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 4H9a3 3 0 0 0-2.83 4" />
      <path d="M14 12a4 4 0 0 1 0 8H6" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
  );
}
function OrderedListIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
      <path d="M4 6h1v4" />
      <path d="M4 10h2" />
      <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
    </svg>
  );
}
function BulletedListIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="9" y1="6" x2="21" y2="6" />
      <line x1="9" y1="12" x2="21" y2="12" />
      <line x1="9" y1="18" x2="21" y2="18" />
      <circle cx="3" cy="6" r="1" fill="currentColor" />
      <circle cx="3" cy="12" r="1" fill="currentColor" />
      <circle cx="3" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}
function QuoteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2z" />
    </svg>
  );
}

const TOOLBAR_BUTTONS = [
  { cmd: 'bold', label: '굵게', icon: BoldIcon },
  { cmd: 'italic', label: '기울임', icon: ItalicIcon },
  { cmd: 'underline', label: '밑줄', icon: UnderlineIcon },
  { cmd: 'strikeThrough', label: '취소선', icon: StrikethroughIcon },
  { cmd: 'insertOrderedList', label: '순서 목록', icon: OrderedListIcon },
  { cmd: 'insertUnorderedList', label: '글머리 목록', icon: BulletedListIcon },
  { cmd: 'formatBlock', label: '인용', icon: QuoteIcon, value: 'blockquote' },
] as const;

export interface RichTextEditorRef {
  getHtml: () => string;
  setHtml: (html: string) => void;
  focus: () => void;
}

interface RichTextEditorProps {
  placeholder?: string;
  minHeight?: string;
  className?: string;
  disabled?: boolean;
  initialHtml?: string;
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  (
    {
      placeholder = '내용을 입력하세요...',
      minHeight = '200px',
      className = '',
      disabled = false,
      initialHtml = '',
    },
    ref
  ) => {
    const editorRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      getHtml: () => editorRef.current?.innerHTML?.trim() || '',
      setHtml: (html: string) => {
        if (editorRef.current) editorRef.current.innerHTML = html;
      },
      focus: () => editorRef.current?.focus(),
    }));

    useEffect(() => {
      if (initialHtml && editorRef.current && !editorRef.current.innerHTML.trim()) {
        editorRef.current.innerHTML = initialHtml;
        setIsEmpty(!initialHtml.trim());
      }
    }, [initialHtml]);

    const execFormat = useCallback((cmd: string, value?: string) => {
      editorRef.current?.focus();
      document.execCommand(cmd, false, value || '');
    }, []);

    const [isEmpty, setIsEmpty] = useState(() => !(initialHtml || '').trim());
    const updateEmpty = useCallback(() => {
      const text = editorRef.current?.innerText?.trim() ?? '';
      setIsEmpty(!text);
    }, []);

    return (
      <div className={`border border-gray-200 rounded-lg bg-white overflow-hidden ${className}`}>
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
          {TOOLBAR_BUTTONS.map(({ cmd, label, icon: Icon, value }) => (
            <button
              key={cmd}
              type="button"
              onClick={() =>
                cmd === 'formatBlock' ? execFormat(cmd, value) : execFormat(cmd)
              }
              disabled={disabled}
              className="w-8 h-8 flex items-center justify-center rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 disabled:opacity-50 transition-colors"
              title={label}
              aria-label={label}
            >
              <Icon />
            </button>
          ))}
        </div>
        <div className="relative">
          {isEmpty && (
            <span className="absolute left-4 top-3 text-gray-400 pointer-events-none">
              {placeholder}
            </span>
          )}
          <div
            ref={editorRef}
            contentEditable={!disabled}
            onInput={updateEmpty}
            className="outline-none focus:ring-0 px-4 py-3 text-gray-900 overflow-y-auto [&_ol]:list-decimal [&_ol]:list-outside [&_ol]:ml-5 [&_ol]:pl-1 [&_ul]:list-disc [&_ul]:list-outside [&_ul]:ml-5 [&_ul]:pl-1 [&_li]:my-0.5 [&_blockquote]:border-l-2 [&_blockquote]:border-gray-300 [&_blockquote]:pl-2 [&_blockquote]:text-gray-600 [&_blockquote]:my-1"
            style={{ minHeight }}
            suppressContentEditableWarning
          />
        </div>
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
