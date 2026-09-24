import Anthropic from '@anthropic-ai/sdk'
import type { Message, MessageCreateParamsNonStreaming } from '@anthropic-ai/sdk/resources/messages'

let _client: Anthropic | null = null

export function getAnthropic(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  }
  return _client
}

/** Preferred model; override per deployment with ANTHROPIC_MODEL. */
export const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5'

// If the preferred model is retired or unavailable to this key, we look up the
// newest Sonnet the key can use and remember it for the life of the instance.
let resolvedModel: string | null = null

async function findFallbackModel(client: Anthropic, exclude: string): Promise<string | null> {
  try {
    for await (const m of client.models.list({ limit: 50 })) {
      if (m.id !== exclude && m.id.includes('sonnet')) return m.id
    }
  } catch (err) {
    console.error('Anthropic model lookup failed:', err)
  }
  return null
}

function isModelUnavailable(err: unknown): boolean {
  if (err instanceof Anthropic.NotFoundError) return true
  return err instanceof Anthropic.BadRequestError && /model/i.test(err.message)
}

type ClaudeParams = Omit<MessageCreateParamsNonStreaming, 'model'> & { model?: string }

/** messages.create with a model fallback, so a retired model ID doesn't break AI features. */
export async function createClaudeMessage(params: ClaudeParams): Promise<Message> {
  const client = getAnthropic()
  const model = params.model || resolvedModel || DEFAULT_MODEL
  try {
    return await client.messages.create({ ...params, model })
  } catch (err) {
    if (!isModelUnavailable(err)) throw err
    const fallback = await findFallbackModel(client, model)
    if (!fallback) throw err
    console.warn(`Anthropic model "${model}" unavailable; falling back to "${fallback}"`)
    resolvedModel = fallback
    return client.messages.create({ ...params, model: fallback })
  }
}

/** A short, user-facing explanation of why an AI request failed. */
export function describeAIError(err: unknown): string {
  if (!process.env.ANTHROPIC_API_KEY) return 'AI isn’t set up on this site yet (missing ANTHROPIC_API_KEY).'
  if (err instanceof Anthropic.AuthenticationError) return 'The AI key was rejected. Check ANTHROPIC_API_KEY in your Vercel settings.'
  if (err instanceof Anthropic.PermissionDeniedError) return 'This AI key doesn’t have access to the model. Check your Anthropic account.'
  if (err instanceof Anthropic.RateLimitError) return 'The AI is busy right now. Please try again in a minute.'
  if (err instanceof Anthropic.APIError) {
    if (/credit|billing|balance/i.test(err.message)) return 'The AI account is out of credits. Top up your Anthropic balance.'
    if ((err.status ?? 0) >= 500) return 'The AI service had a hiccup. Please try again.'
    return `AI request failed: ${err.message}`
  }
  if (err instanceof Error && /parse|json|format/i.test(err.message)) return 'The AI reply couldn’t be read. Please try again.'
  return 'Something went wrong while generating. Please try again.'
}
