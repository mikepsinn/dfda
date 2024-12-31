interface ContactFormEmailProps {
  firstName: string
  lastName: string
  email: string
  subject: string
  message: string
}

export function generateContactFormEmail({
  firstName,
  lastName,
  email,
  subject,
  message,
}: ContactFormEmailProps): string {
  return `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb; margin-bottom: 24px;">New Contact Form Submission</h1>
      
      <div style="background: #f3f4f6; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
        <h2 style="margin-top: 0; color: #1f2937;">Contact Details</h2>
        <p style="margin: 0;"><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 8px 0;"><strong>Subject:</strong> ${subject}</p>
      </div>

      <div style="background: #f3f4f6; padding: 24px; border-radius: 8px;">
        <h2 style="margin-top: 0; color: #1f2937;">Message</h2>
        <p style="margin: 0; white-space: pre-wrap;">${message}</p>
      </div>
    </div>
  `
}

export function generateAutoReplyEmail({
  firstName,
}: Pick<ContactFormEmailProps, 'firstName'>): string {
  return `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb; margin-bottom: 24px;">Thank You for Contacting Us</h1>
      
      <p>Dear ${firstName},</p>
      
      <p>Thank you for reaching out to Decentralized FDA. We have received your message and will get back to you as soon as possible.</p>
      
      <p>In the meantime, you can:</p>
      <ul>
        <li>Visit our website for more information</li>
        <li>Follow us on social media for updates</li>
        <li>Check out our FAQ section</li>
      </ul>
      
      <p>Best regards,<br>The DFDA Team</p>
    </div>
  `
} 