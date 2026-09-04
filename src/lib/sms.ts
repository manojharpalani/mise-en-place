import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const FROM = process.env.TWILIO_SMS_FROM || ''

export async function sendSMS(to: string, body: string) {
  try {
    const message = await client.messages.create({
      from: FROM,
      to,
      body,
    })
    return { success: true, sid: message.sid }
  } catch (error) {
    console.error('SMS send error:', error)
    return { success: false, error }
  }
}

export async function sendOTPSMS(to: string, otp: string) {
  return sendSMS(to, `Your Mise en Place login code is: ${otp}. Expires in 10 minutes.`)
}
