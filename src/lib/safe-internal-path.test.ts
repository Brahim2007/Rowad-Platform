import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { safeInternalPath } from './safe-internal-path'

describe('safe internal redirects', () => {
  const fallback = '/ar/admin/dashboard'

  it('keeps local paths including their query and hash', () => {
    assert.equal(
      safeInternalPath('/ar/admin/reports?status=draft#latest', fallback),
      '/ar/admin/reports?status=draft#latest',
    )
  })

  it('rejects absolute, protocol-relative, relative, and backslash URLs', () => {
    assert.equal(safeInternalPath('https://example.com', fallback), fallback)
    assert.equal(safeInternalPath('//example.com/path', fallback), fallback)
    assert.equal(safeInternalPath('javascript:alert(1)', fallback), fallback)
    assert.equal(safeInternalPath('admin/dashboard', fallback), fallback)
    assert.equal(safeInternalPath('/\\example.com', fallback), fallback)
  })

  it('uses the fallback for empty values', () => {
    assert.equal(safeInternalPath(null, fallback), fallback)
    assert.equal(safeInternalPath('   ', fallback), fallback)
  })
})
