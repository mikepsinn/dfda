// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { linkEmail, sendEmail, senderAddress } from '@/lib/email'

const { sendMail } = vi.hoisted(() => ({ sendMail: vi.fn() }))
vi.mock('nodemailer', () => ({ default: { createTransport: () => ({ sendMail }) } }))

afterEach(() => sendMail.mockReset())

const brand = { name: 'Response <by> SuperOme', primaryColor: '#2fd4be', supportEmail: 'help@superome.example' }

describe('linkEmail', () => {
  it("comes from the company with a brand: its name, its color and its support address", () => {
    const email = linkEmail('member@example.com', 'Sign in to Response', 'Use this link to sign in.', 'Sign in', 'https://track.superome.example/x?a=1&b=2', brand)
    expect(email.fromName).toBe('Response <by> SuperOme')
    expect(email.replyTo).toBe('help@superome.example')
    expect(email.text).toBe('Response <by> SuperOme\n\nUse this link to sign in.\n\nhttps://track.superome.example/x?a=1&b=2\n\nIf you did not ask for this email, you can ignore it.')
    expect(email.html).toContain('Response &lt;by&gt; SuperOme')
    expect(email.html).toContain('href="https://track.superome.example/x?a=1&amp;b=2"')
    // A light brand color gets dark text on its button.
    expect(email.html).toContain('background:#2fd4be;color:#171717')
    expect(email.html).not.toMatch(/dFDA|Open Treatment Evidence Network/)
  })

  it('has no reply address when the company gives none, and no sender name without a brand', () => {
    expect(linkEmail('a@example.com', 's', 'i', 'l', 'https://x.example/', { ...brand, supportEmail: null }).replyTo).toBeUndefined()
    const plain = linkEmail('a@example.com', 'Your sign-in link', 'Use this link to sign in.', 'Sign in', 'https://x.example/')
    expect(plain.fromName).toBeUndefined()
    expect(plain.html).toBe('<p>Use this link to sign in.</p><p><a href="https://x.example/">Sign in</a></p><p>If you did not ask for this email, you can ignore it.</p>')
  })
})

describe('sendEmail', () => {
  it("sends with the company's name and the site's own address", async () => {
    await sendEmail({ to: 'a@example.com', subject: 's', text: 't', fromName: 'Response by SuperOme', replyTo: 'help@superome.example' })
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: { name: 'Response by SuperOme', address: senderAddress() }, replyTo: 'help@superome.example' }),
    )
    expect(senderAddress('dFDA <noreply@updates.dfda.earth>')).toBe('noreply@updates.dfda.earth')
    expect(senderAddress('noreply@updates.dfda.earth')).toBe('noreply@updates.dfda.earth')
  })
})
