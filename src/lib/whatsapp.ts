// Meta WhatsApp Business Cloud API
// Per-seller credentials (waPhoneNumberId + waAccessToken) are preferred.
// Falls back to platform-level env vars (WA_PHONE_NUMBER_ID + WA_ACCESS_TOKEN).

const GRAPH_API = 'https://graph.facebook.com/v19.0'

interface WASendOptions {
  phoneNumberId?: string | null
  accessToken?: string | null
}

async function sendWAMessage(
  to: string,
  body: string,
  opts: WASendOptions = {}
): Promise<{ success: boolean; messageId?: string; error?: unknown }> {
  const phoneNumberId = opts.phoneNumberId || process.env.WA_PHONE_NUMBER_ID
  const accessToken = opts.accessToken || process.env.WA_ACCESS_TOKEN

  if (!phoneNumberId || !accessToken) {
    console.warn('WhatsApp Business not configured — missing phoneNumberId or accessToken')
    return { success: false, error: 'WhatsApp Business not configured' }
  }

  // Normalise number: remove non-digits then prefix with +
  const normalised = to.replace(/\D/g, '')
  const recipient = normalised.startsWith('+') ? normalised : `+${normalised}`

  try {
    const res = await fetch(`${GRAPH_API}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipient,
        type: 'text',
        text: { body, preview_url: false },
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      console.error('WhatsApp send error:', err)
      return { success: false, error: err }
    }

    const data = await res.json()
    return { success: true, messageId: data.messages?.[0]?.id }
  } catch (error) {
    console.error('WhatsApp send error:', error)
    return { success: false, error }
  }
}

export async function sendWhatsAppMessage(
  to: string,
  body: string,
  opts: WASendOptions = {}
) {
  return sendWAMessage(to, body, opts)
}

// Send a pre-approved WhatsApp Business template message.
// `params` are the positional body parameter values — {{1}}, {{2}}, etc.
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  params: string[],
  opts: WASendOptions & { language?: string } = {}
): Promise<{ success: boolean; messageId?: string; error?: unknown }> {
  const phoneNumberId = opts.phoneNumberId || process.env.WA_PHONE_NUMBER_ID
  const accessToken = opts.accessToken || process.env.WA_ACCESS_TOKEN
  const language = opts.language || 'en_US'

  if (!phoneNumberId || !accessToken) {
    console.warn('WhatsApp Business not configured')
    return { success: false, error: 'WhatsApp Business not configured' }
  }

  const normalised = to.replace(/\D/g, '')
  const recipient = normalised.startsWith('+') ? normalised : `+${normalised}`

  try {
    const res = await fetch(`${GRAPH_API}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipient,
        type: 'template',
        template: {
          name: templateName,
          language: { code: language },
          components: params.length > 0
            ? [{
                type: 'body',
                parameters: params.map(text => ({ type: 'text', text })),
              }]
            : undefined,
        },
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      console.error('WhatsApp template send error:', err)
      return { success: false, error: err }
    }

    const data = await res.json()
    return { success: true, messageId: data.messages?.[0]?.id }
  } catch (error) {
    console.error('WhatsApp template send error:', error)
    return { success: false, error }
  }
}

export async function sendDailyMenu(
  to: string,
  storeName: string,
  dayLabel: string,
  items: Array<{ name: string; price: number; salePrice?: number | null; description?: string | null }>,
  storefrontUrl: string,
  opts: WASendOptions = {}
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
  return sendWAMessage(to, body, opts)
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
  },
  opts: WASendOptions = {}
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

  return sendWAMessage(to, body, opts)
}
