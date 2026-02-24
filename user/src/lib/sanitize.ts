const ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'u', 's', 'strike', 'ul', 'ol', 'li', 'blockquote', 'p', 'br', 'span'];

export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();
      if (tag === 'br') return '<br>';
      if (!ALLOWED_TAGS.includes(tag)) {
        return Array.from(node.childNodes).map(walk).join('');
      }
      const inner = Array.from(node.childNodes).map(walk).join('');
      if (tag === 'span' && el.getAttribute('data-mention')) {
        const userId = el.getAttribute('data-mention') || '';
        if (/^\d+$/.test(userId)) {
          return `<span data-mention="${userId}" class="mention">${inner}</span>`;
        }
      }
      return `<${tag}>${inner}</${tag}>`;
    }
    return '';
  };
  return Array.from(doc.body.childNodes).map(walk).join('').trim() || '';
}

export function extractMentionedUserIds(html: string): number[] {
  if (!html || typeof html !== 'string') return [];
  const ids = new Set<number>();
  const regex = /data-mention="(\d+)"/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) {
    ids.add(Number(m[1]));
  }
  return Array.from(ids);
}
