import sgMail from '@sendgrid/mail'

function getSgMail() {
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
  }
  return sgMail
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com'

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[]
  subject: string
  html: string
  text?: string
}) {
  try {
    const toArray = Array.isArray(to) ? to : [to]
    await getSgMail().sendMultiple({
      to: toArray,
      from: FROM_EMAIL,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    })
    return { success: true }
  } catch (error) {
    console.error('SendGrid error:', error)
    return { success: false, error }
  }
}

export async function sendNewsletter({
  recipients,
  subject,
  html,
  storeName,
}: {
  recipients: string[]
  subject: string
  html: string
  storeName: string
}) {
  if (recipients.length === 0) return { success: true, sent: 0 }

  try {
    const batchSize = 100
    let sent = 0
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize)
      await getSgMail().sendMultiple({
        to: batch,
        from: { email: FROM_EMAIL, name: storeName },
        subject,
        html,
        text: html.replace(/<[^>]*>/g, ''),
      })
      sent += batch.length
    }
    return { success: true, sent }
  } catch (error) {
    console.error('Newsletter send error:', error)
    return { success: false, error }
  }
}

export async function sendOTPEmail(to: string, otp: string) {
  return sendEmail({
    to,
    subject: 'Your Mise en Place Login Code',
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a1a;">Your Login Code</h2>
        <p>Use this code to sign in to Mise en Place:</p>
        <div style="background: #f4f4f4; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${otp}</span>
        </div>
        <p style="color: #666; font-size: 14px;">This code expires in 10 minutes. Do not share it with anyone.</p>
      </div>
    `,
  })
}
