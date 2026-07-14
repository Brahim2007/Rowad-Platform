import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { sanitizeRichHtml } from './sanitize-html'

describe('sanitizeRichHtml', () => {
  it('keeps supported report formatting', () => {
    const result = sanitizeRichHtml('<h2>عنوان</h2><p><strong>نص</strong></p><table><tbody><tr><td>1</td></tr></tbody></table>')
    assert.match(result, /<h2>عنوان<\/h2>/)
    assert.match(result, /<strong>نص<\/strong>/)
    assert.match(result, /<table>/)
  })

  it('removes scripts, event handlers, javascript URLs, and embedded documents', () => {
    const result = sanitizeRichHtml([
      '<script>alert(1)</script>',
      '<img src="x" onerror="alert(1)">',
      '<a href="javascript:alert(1)">رابط</a>',
      '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
      '<svg><script>alert(1)</script></svg>',
    ].join(''))

    assert.doesNotMatch(result, /script|onerror|javascript:|iframe|srcdoc|svg/i)
    assert.match(result, /<img src="x">/)
    assert.match(result, />رابط<\/a>/)
  })

  it('removes inline styles and data attributes', () => {
    const result = sanitizeRichHtml('<p style="background:url(https://example.com/x)" data-secret="x">نص</p>')
    assert.equal(result, '<p>نص</p>')
  })
})
