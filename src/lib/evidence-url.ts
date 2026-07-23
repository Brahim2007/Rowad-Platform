export function normalizeEvidenceUrl(value: unknown): string | null | undefined {
  const text = String(value || '').trim()
  if (!text) return null
  if (text.length > 2_048) return undefined

  try {
    const url = new URL(text)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}
