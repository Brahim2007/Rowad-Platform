import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { describe, it } from 'node:test'

describe('backup export completeness guards', () => {
  it('does not silently cap exported collections and disables caching', async () => {
    const source = await readFile('src/app/api/admin/backup/route.ts', 'utf8')
    assert.doesNotMatch(source, /take:\s*\d+/)
    assert.match(source, /complete:\s*true/)
    assert.match(source, /scope:\s*'core-platform-data'/)
    assert.match(source, /'Cache-Control':\s*'no-store, private'/)
  })
})
