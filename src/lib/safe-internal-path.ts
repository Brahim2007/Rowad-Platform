export function safeInternalPath(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback

  const path = value.trim()
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
    return fallback
  }

  try {
    const parsed = new URL(path, 'https://rowad.local')
    return parsed.origin === 'https://rowad.local'
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : fallback
  } catch {
    return fallback
  }
}
