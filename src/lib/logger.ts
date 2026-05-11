type LogLevel = 'info' | 'warn' | 'error'

function formatMessage(level: LogLevel, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString()
  const dataStr = data ? ` ${JSON.stringify(data)}` : ''
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`
}

export const logger = {
  info(message: string, data?: unknown) {
    if (process.env.NODE_ENV === 'production') return
    console.log(formatMessage('info', message, data))
  },

  warn(message: string, data?: unknown) {
    console.warn(formatMessage('warn', message, data))
  },

  error(message: string, data?: unknown) {
    console.error(formatMessage('error', message, data))
  },
}
