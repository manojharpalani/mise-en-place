import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAnthropic } from '@/lib/anthropic'

export interface VideoResult {
  videoId: string
  title: string
  channelTitle: string
  channelId: string
  thumbnail: string
  duration: string       // ISO 8601 e.g. "PT45S"
  durationSecs: number
  isShort: boolean       // < 60s
  viewCount: string
  url: string
  creditText: string     // "@ChannelTitle on YouTube"
}

export interface RecipeCard {
  headline: string       // one punchy line
  story: string          // 2-3 sentences about the dish
  tips: string[]         // 3-4 chef tips
  servingSuggestions: string
}

export interface InspirationResponse {
  recipe: RecipeCard
  videos: VideoResult[]
}

// Parse ISO 8601 duration to seconds
function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  return (parseInt(m[1] ?? '0') * 3600) + (parseInt(m[2] ?? '0') * 60) + parseInt(m[3] ?? '0')
}

function formatDuration(secs: number): string {
  if (secs < 60) return `${secs}s`
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

async function searchYouTube(query: string): Promise<VideoResult[]> {
  const key = process.env.YOUTUBE_API_KEY
  if (!key || key === 'your_youtube_api_key') return []

  // Search for short cooking videos
  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
  searchUrl.searchParams.set('part', 'snippet')
  searchUrl.searchParams.set('q', `${query} recipe viral`)
  searchUrl.searchParams.set('type', 'video')
  searchUrl.searchParams.set('videoDuration', 'short') // < 4 minutes
  searchUrl.searchParams.set('maxResults', '8')
  searchUrl.searchParams.set('order', 'relevance')
  searchUrl.searchParams.set('videoEmbeddable', 'true')
  searchUrl.searchParams.set('key', key)

  const searchRes = await fetch(searchUrl.toString())
  if (!searchRes.ok) {
    const err = await searchRes.json().catch(() => ({}))
    console.error('[YouTube] search failed', searchRes.status, JSON.stringify(err))
    return []
  }
  const searchData = await searchRes.json()
  const items: { id: { videoId: string }; snippet: { title: string; channelTitle: string; channelId: string; thumbnails: { high?: { url: string }; medium?: { url: string } } } }[] = searchData.items ?? []
  if (!items.length) return []

  const videoIds = items.map(i => i.id.videoId).join(',')

  // Get duration & stats
  const detailUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
  detailUrl.searchParams.set('part', 'contentDetails,statistics')
  detailUrl.searchParams.set('id', videoIds)
  detailUrl.searchParams.set('key', key)

  const detailRes = await fetch(detailUrl.toString())
  if (!detailRes.ok) return []
  const detailData = await detailRes.json()
  const details: Record<string, { contentDetails: { duration: string }; statistics: { viewCount?: string } }> = {}
  for (const v of detailData.items ?? []) {
    details[v.id] = v
  }

  const results: VideoResult[] = items
    .map(item => {
      const vid = item.id.videoId
      const detail = details[vid]
      if (!detail) return null
      const durationSecs = parseDuration(detail.contentDetails.duration)
      const isShort = durationSecs < 60
      return {
        videoId: vid,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        thumbnail: item.snippet.thumbnails.high?.url ?? item.snippet.thumbnails.medium?.url ?? '',
        duration: formatDuration(durationSecs),
        durationSecs,
        isShort,
        viewCount: parseInt(detail.statistics.viewCount ?? '0').toLocaleString(),
        url: `https://www.youtube.com/watch?v=${vid}`,
        creditText: `@${item.snippet.channelTitle} on YouTube`,
      } satisfies VideoResult
    })
    .filter((v): v is VideoResult => v !== null)
    // Sort: Shorts first, then by duration ascending
    .sort((a, b) => {
      if (a.isShort && !b.isShort) return -1
      if (!a.isShort && b.isShort) return 1
      return a.durationSecs - b.durationSecs
    })
    .slice(0, 5)

  return results
}

async function generateRecipeCard(name: string, description?: string | null): Promise<RecipeCard> {
  const anthropic = getAnthropic()
  const prompt = `You are an enthusiastic culinary writer. For the dish "${name}"${description ? ` (${description})` : ''}, write a brief recipe inspiration card.

Return ONLY valid JSON matching this structure exactly:
{
  "headline": "one catchy, punchy line that makes this dish irresistible (under 12 words)",
  "story": "2-3 warm sentences about the dish's origin, why it's special, what makes it sing",
  "tips": ["chef tip 1", "chef tip 2", "chef tip 3"],
  "servingSuggestions": "one sentence on how to serve and plate it beautifully"
}`

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in response')
  return JSON.parse(jsonMatch[0]) as RecipeCard
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const itemId = parseInt(id)
  if (isNaN(itemId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const seller = await prisma.sellerProfile.findUnique({ where: { userId: session.user.id } })
  if (!seller) return NextResponse.json({ error: 'Not a seller' }, { status: 403 })

  const item = await prisma.menuItem.findUnique({
    where: { id: itemId, sellerId: seller.id },
    select: { id: true, name: true, description: true, cuisineTags: true },
  })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [recipe, videos] = await Promise.all([
    generateRecipeCard(item.name, item.description),
    searchYouTube(item.name),
  ])

  return NextResponse.json({ recipe, videos } satisfies InspirationResponse)
}
