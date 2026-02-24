'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { sanitizeHtml } from '@/lib/sanitize';

export interface MentionMember {
  userId: number;
  userName: string;
}

interface MessageInputProps {
  onSubmit: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  members?: MentionMember[];
}

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

function findRangeToReplace(editor: HTMLDivElement, range: Range): Range | null {
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(editor);
  preCaretRange.setEnd(range.endContainer, range.endOffset);
  const beforeCursor = preCaretRange.toString();
  const atMatch = beforeCursor.match(/@([\w가-힣]*)$/);
  if (!atMatch) return null;

  const toDeleteLen = atMatch[0].length;
  const targetStartChar = beforeCursor.length - toDeleteLen;

  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  let current: Node | null = walker.currentNode;
  let pos = 0;

  while (current) {
    const len = (current.textContent || '').length;
    if (pos + len >= targetStartChar) {
      const replaceRange = document.createRange();
      replaceRange.setStart(current, targetStartChar - pos);
      replaceRange.setEnd(range.endContainer, range.endOffset);
      return replaceRange;
    }
    pos += len;
    current = walker.nextNode();
  }
  return null;
}

function insertMentionAtCursor(editor: HTMLDivElement, member: MentionMember, _query: string) {
  const sel = window.getSelection();
  if (!sel || !editor.contains(sel.anchorNode) || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);
  const replaceRange = findRangeToReplace(editor, range);
  const targetRange = replaceRange || range;

  const mentionText = `@${member.userName}`;
  const span = document.createElement('span');
  span.setAttribute('data-mention', String(member.userId));
  span.setAttribute('contenteditable', 'false');
  span.className = 'mention bg-[#4A154B]/10 text-[#4A154B] px-1 rounded';
  span.textContent = mentionText;

  targetRange.deleteContents();
  targetRange.insertNode(span);
  const space = document.createTextNode('\u00A0');
  span.after(space);
  targetRange.setStart(space, 1);
  targetRange.setEnd(space, 1);
  sel.removeAllRanges();
  sel.addRange(targetRange);
}

export default function MessageInput({
  onSubmit,
  disabled = false,
  placeholder = '메시지를 입력하세요...',
  members = [],
}: MessageInputProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const mentionListRef = useRef<HTMLDivElement>(null);

  const filteredMembers = members.filter(
    (m) =>
      !mentionQuery ||
      m.userName.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const updateEmptyState = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const text = el.innerText?.trim() || '';
    setIsEmpty(!text);
  }, []);

  const closeMention = useCallback(() => {
    setMentionOpen(false);
    setMentionQuery('');
    setMentionIndex(0);
  }, []);

  const checkMentionTrigger = useCallback(() => {
    const el = editorRef.current;
    if (!el || !members.length) return;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) return;

    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(el);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    const beforeCursor = preCaretRange.toString();
    const atMatch = beforeCursor.match(/@([\w가-힣]*)$/);
    if (atMatch) {
      setMentionOpen(true);
      setMentionQuery(atMatch[1]);
      setMentionIndex(0);
    } else {
      closeMention();
    }
  }, [members.length, closeMention]);

  const handleInput = useCallback(() => {
    updateEmptyState();
    checkMentionTrigger();
  }, [updateEmptyState, checkMentionTrigger]);

  const execFormat = useCallback((cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value || '');
    updateEmptyState();
  }, [updateEmptyState]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const el = editorRef.current;
    if (!el || disabled) return;
    const html = el.innerHTML?.trim() || '';
    const text = el.innerText?.trim() || '';
    if (!text) return;
    const sanitized = sanitizeHtml(html) || text;
    onSubmit(sanitized);
    el.innerHTML = '';
    setIsEmpty(true);
    closeMention();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentionOpen && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((i) => Math.min(i + 1, filteredMembers.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const member = filteredMembers[mentionIndex];
        if (member && editorRef.current) {
          insertMentionAtCursor(editorRef.current, member, mentionQuery);
          closeMention();
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMention();
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      const sel = window.getSelection();
      const node = sel?.anchorNode;
      const parent = node?.nodeType === Node.ELEMENT_NODE ? (node as Element) : (node?.parentElement as Element);
      if (parent?.closest('li, blockquote')) return;
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  useEffect(() => {
    if (mentionOpen && mentionListRef.current) {
      const item = mentionListRef.current.children[mentionIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [mentionOpen, mentionIndex]);

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
        {TOOLBAR_BUTTONS.map(({ cmd, label, icon: Icon, value }) => (
          <button
            key={cmd}
            type="button"
            onClick={() =>
              cmd === 'formatBlock'
                ? execFormat(cmd, value)
                : execFormat(cmd)
            }
            disabled={disabled}
            className="w-8 h-8 flex items-center justify-center rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={label}
            aria-label={label}
          >
            <Icon />
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="relative">
          {isEmpty && (
            <span className="absolute left-4 top-3 text-gray-400 pointer-events-none">
              {placeholder}
            </span>
          )}
          {mentionOpen && filteredMembers.length > 0 && (
            <div
              ref={mentionListRef}
              className="absolute bottom-full left-4 right-4 mb-1 max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1"
            >
              <div className="px-2 py-1 text-xs text-gray-500 border-b border-gray-100">
                멤버 태그
              </div>
              {filteredMembers.map((m, i) => (
                <button
                  key={m.userId}
                  type="button"
                  className={`w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-gray-100 ${
                    i === mentionIndex ? 'bg-[#4A154B]/10 text-[#4A154B]' : 'text-gray-900'
                  }`}
                  onClick={() => {
                    if (editorRef.current) {
                      insertMentionAtCursor(editorRef.current, m, mentionQuery);
                      closeMention();
                    }
                  }}
                >
                  <span className="w-6 h-6 rounded-full bg-[#4A154B] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    {(m.userName || '?').charAt(0).toUpperCase()}
                  </span>
                  <span>{m.userName}</span>
                </button>
              ))}
            </div>
          )}
          <div
            ref={editorRef}
            contentEditable={!disabled}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            className="min-h-[80px] max-h-[200px] overflow-y-auto px-4 py-3 text-gray-900 outline-none focus:ring-0 [&_ol]:list-decimal [&_ol]:list-outside [&_ol]:ml-5 [&_ol]:pl-1 [&_ul]:list-disc [&_ul]:list-outside [&_ul]:ml-5 [&_ul]:pl-1 [&_li]:my-0.5 [&_.mention]:bg-[#4A154B]/10 [&_.mention]:text-[#4A154B] [&_.mention]:px-1 [&_.mention]:rounded"
            suppressContentEditableWarning
          />
        </div>
        <div className="flex justify-end px-2 py-2 border-t border-gray-100">
          <button
            type="submit"
            disabled={isEmpty || disabled}
            className="px-4 py-2 bg-[#4A154B] text-white rounded-md hover:bg-[#611f69] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            전송
          </button>
        </div>
      </form>
    </div>
  );
}
