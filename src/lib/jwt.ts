export function getJwtSecret(): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error('AUTH_SECRET is required for JWT signing and verification')
  }
  return secret
}
