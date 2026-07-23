import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { emailDeliveryConfigured } from './email'

const keys = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'] as const
const original = Object.fromEntries(keys.map(key => [key, process.env[key]]))

describe('email delivery configuration', () => {
  before(() => {
    for (const key of keys) delete process.env[key]
  })

  after(() => {
    for (const key of keys) {
      const value = original[key]
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })

  it('stays disabled until all required SMTP settings exist', () => {
    assert.equal(emailDeliveryConfigured(), false)
    process.env.SMTP_HOST = 'smtp.example.com'
    process.env.SMTP_USER = 'mailer@example.com'
    process.env.SMTP_PASS = 'secret'
    assert.equal(emailDeliveryConfigured(), true)
  })

  it('allows EMAIL_FROM to fall back to SMTP_USER', () => {
    delete process.env.EMAIL_FROM
    assert.equal(emailDeliveryConfigured(), true)
  })
})
