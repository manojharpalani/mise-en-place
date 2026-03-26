import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'

export async function sendWhatsAppMessage(to: string, body: string) {
  try {
    const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
    const message = await client.messages.create({
      from: FROM,
      to: toNumber,
      body,
    })
    return { success: true, sid: message.sid }
  } catch (error) {
    console.error('WhatsApp send error:', error)
    return { success: false, error }
  }
}

export async function sendDailyMenu(
  to: string,
  storeName: string,
  dayLabel: string,
  items: Array<{ name: string; price: number; salePrice?: number | null; description?: string | null }>,
  storefrontUrl: string
) {
  const itemLines = items
    .map((item) => {
      const priceStr =
        item.salePrice
          ? `$${item.salePrice.toFixed(2)} ~~was $${item.price.toFixed(2)}~~`
          : `$${item.price.toFixed(2)}`
      const descStr = item.description ? `\n  ${item.description.slice(0, 80)}` : ''
      return `• ${item.name} - ${priceStr}${descStr}`
    })
    .join('\n')

  const body = `🍽️ *${storeName} - Today's Menu*\n📅 ${dayLabel}\n\n${itemLines}\n\nOrder here: ${storefrontUrl}`
  return sendWhatsAppMessage(to, body)
}

export async function sendOrderConfirmation(
  to: string,
  orderDetails: {
    orderNumber: string
    storeName: string
    total: number
    fulfillmentType: string
    scheduledDate: string
    pickupWindow?: string | null
  }
) {
  const fulfillmentLine =
    orderDetails.fulfillmentType === 'PICKUP'
      ? `Pickup: ${orderDetails.pickupWindow || 'TBD'}`
      : 'Delivery to your address'

  const body =
    `✅ *Order Confirmed!*\n\n` +
    `Order #${orderDetails.orderNumber}\n` +
    `Store: ${orderDetails.storeName}\n` +
    `Total: $${orderDetails.total.toFixed(2)}\n` +
    `${fulfillmentLine}\n` +
    `Scheduled: ${orderDetails.scheduledDate}\n\n` +
    `Thank you for your order! 🙏`

  return sendWhatsAppMessage(to, body)
}
