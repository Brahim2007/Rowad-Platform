import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { normalizeEvidenceUrl } from './evidence-url'

describe('activity evidence URLs', () => {
  it('accepts Google Drive and regular web evidence links', () => {
    assert.equal(
      normalizeEvidenceUrl('https://drive.google.com/file/d/example/view?usp=sharing'),
      'https://drive.google.com/file/d/example/view?usp=sharing',
    )
    assert.equal(
      normalizeEvidenceUrl('https://example.com/article?id=7'),
      'https://example.com/article?id=7',
    )
  })

  it('keeps evidence optional', () => {
    assert.equal(normalizeEvidenceUrl(''), null)
    assert.equal(normalizeEvidenceUrl(null), null)
  })

  it('rejects unsafe, malformed, and oversized evidence links', () => {
    assert.equal(normalizeEvidenceUrl('javascript:alert(1)'), undefined)
    assert.equal(normalizeEvidenceUrl('drive.google.com/file/example'), undefined)
    assert.equal(normalizeEvidenceUrl(`https://example.com/${'a'.repeat(2_100)}`), undefined)
  })
})
