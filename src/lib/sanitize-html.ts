import DOMPurify from 'isomorphic-dompurify'

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'strong', 'em', 'u', 's', 'blockquote',
  'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'a', 'img', 'br', 'hr',
  'span', 'div',
]

const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'target', 'rel', 'colspan', 'rowspan', 'dir',
]

/** Sanitize rich report content using a strict, formatting-only allowlist. */
export function sanitizeRichHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'svg', 'math'],
    FORBID_ATTR: ['style', 'srcdoc'],
  })
}
