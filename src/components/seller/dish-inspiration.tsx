'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles, Play, ExternalLink, MessageCircle, RefreshCw, ChefHat, Lightbulb, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import type { InspirationResponse, VideoResult } from '@/app/api/menu-items/[id]/inspiration/route'

type Tab = 'recipe' | 'videos' | 'share'

interface DishInspirationProps {
  item: { id: number; name: string; description?: string | null } | null
  seller: { storeName: string; storeSlug: string }
  open: boolean
  onClose: () => void
}

// Cache per session so reopening the same dish is instant
const cache = new Map<number, InspirationResponse>()

function VideoDurationBadge({ isShort, duration }: { isShort: boolean; duration: string }) {
  return (
    <span
      className="absolute bottom-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded"
      style={{ background: isShort ? '#ff0000' : 'rgba(0,0,0,0.75)', color: 'white' }}
    >
      {isShort ? '🩳 Short' : duration}
    </span>
  )
}

function VideoCard({ video }: { video: VideoResult }) {
  const [hovered, setHovered] = useState(false)
  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-shrink-0 w-44 rounded-xl overflow-hidden border transition-transform active:scale-95"
      style={{ borderColor: '#e7e5e4' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-stone-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
        <div
          className="absolute inset-0 flex items-center justify-center transition-opacity"
          style={{ background: 'rgba(0,0,0,0.25)', opacity: hovered ? 1 : 0.6 }}
        >
          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-4 h-4 ml-0.5" style={{ color: '#ff0000' }} fill="#ff0000" />
          </div>
        </div>
        <VideoDurationBadge isShort={video.isShort} duration={video.duration} />
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="text-xs font-medium leading-tight line-clamp-2" style={{ color: '#292524' }}>
          {video.title}
        </p>
        <p className="text-[10px] mt-1 truncate" style={{ color: '#78716c' }}>
          {video.creditText}
        </p>
        <p className="text-[10px]" style={{ color: '#a8a29e' }}>
          {video.viewCount} views
        </p>
      </div>
    </a>
  )
}

export function DishInspiration({ item, seller, open, onClose }: DishInspirationProps) {
  const [tab, setTab] = useState<Tab>('recipe')
  const [data, setData] = useState<InspirationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [shareMsg, setShareMsg] = useState('')

  const fetchInspiration = useCallback(async (force = false) => {
    if (!item) return
    if (!force && cache.has(item.id)) {
      setData(cache.get(item.id)!)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/menu-items/${item.id}/inspiration`)
      if (!res.ok) throw new Error()
      const json: InspirationResponse = await res.json()
      cache.set(item.id, json)
      setData(json)
    } catch {
      toast.error('Could not load inspiration')
    } finally {
      setLoading(false)
    }
  }, [item])

  // Load when opened
  useEffect(() => {
    if (open && item) {
      setTab('recipe')
      if (cache.has(item.id)) {
        setData(cache.get(item.id)!)
      } else {
        setData(null)
        fetchInspiration()
      }
    }
  }, [open, item, fetchInspiration])

  // Build WhatsApp share message whenever recipe loads
  useEffect(() => {
    if (!data || !item) return
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://withmetta.com'
    const storeUrl = `${appUrl}/${seller.storeSlug}`
    setShareMsg(
      `✨ *${item.name}* is on the menu at *${seller.storeName}* this week!\n\n` +
      `${data.recipe.headline}\n\n` +
      `${data.recipe.story.split('.')[0]}.\n\n` +
      `🛒 Order now → ${storeUrl}\n\n` +
      `Made with loving-kindness 🤍`
    )
  }, [data, item, seller])

  const shareToWhatsApp = () => {
    const encoded = encodeURIComponent(shareMsg)
    window.open(`https://wa.me/?text=${encoded}`, '_blank')
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'recipe', label: 'Recipe Spark', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'videos', label: 'Watch & Cook', icon: <Play className="w-3.5 h-3.5" /> },
    { id: 'share', label: 'Share Teaser', icon: <MessageCircle className="w-3.5 h-3.5" /> },
  ]

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent
        side="bottom"
        className="flex flex-col p-0 rounded-t-2xl"
        style={{ background: '#fffcf5', height: '88dvh' }}
      >
        {/* Header */}
        <SheetHeader className="px-4 pt-4 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <ChefHat className="w-4 h-4 flex-shrink-0" style={{ color: '#d4a5a5' }} />
                <SheetTitle className="font-heading text-lg leading-tight truncate" style={{ color: '#292524' }}>
                  {item?.name}
                </SheetTitle>
              </div>
              {item?.description && (
                <p className="text-xs line-clamp-1" style={{ color: '#78716c' }}>{item.description}</p>
              )}
            </div>
            <button
              onClick={() => fetchInspiration(true)}
              className="ml-3 p-1.5 rounded-lg flex-shrink-0 mt-0.5"
              style={{ background: '#f5f5f4', color: '#78716c' }}
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 bg-stone-100 rounded-xl p-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
                style={tab === t.id
                  ? { background: 'white', color: '#292524', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                  : { color: '#78716c' }
                }
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#fdf0ee' }}>
                  <Sparkles className="w-7 h-7 animate-pulse" style={{ color: '#e28a93' }} />
                </div>
              </div>
              <div className="text-center">
                <p className="font-medium text-sm" style={{ color: '#292524' }}>Finding inspiration…</p>
                <p className="text-xs mt-1" style={{ color: '#a8a29e' }}>Asking Claude & searching YouTube</p>
              </div>
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#d4a5a5' }} />
            </div>
          ) : !data ? null : (

            <>
              {/* ─── Recipe Spark Tab ─── */}
              {tab === 'recipe' && (
                <div className="space-y-5">
                  {/* Headline */}
                  <div
                    className="rounded-2xl px-5 py-4 text-center"
                    style={{ background: 'linear-gradient(135deg, #fdf0ee, #f0e0db)' }}
                  >
                    <p className="font-heading text-xl font-semibold leading-snug" style={{ color: '#292524' }}>
                      {data.recipe.headline}
                    </p>
                  </div>

                  {/* Story */}
                  <div className="rounded-xl p-4 border" style={{ background: 'white', borderColor: '#e7e5e4' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4" style={{ color: '#e28a93' }} />
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#a8a29e' }}>The Story</span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: '#57534e' }}>{data.recipe.story}</p>
                  </div>

                  {/* Tips */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <ChefHat className="w-4 h-4" style={{ color: '#d4a5a5' }} />
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#a8a29e' }}>Chef Tips</span>
                    </div>
                    <div className="space-y-2">
                      {data.recipe.tips.map((tip, i) => (
                        <div key={i} className="flex gap-3 rounded-xl p-3 border" style={{ background: 'white', borderColor: '#e7e5e4' }}>
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                            style={{ background: '#d4a5a5' }}
                          >
                            {i + 1}
                          </span>
                          <p className="text-sm leading-relaxed" style={{ color: '#57534e' }}>{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Serving */}
                  <div className="rounded-xl p-4 border" style={{ background: '#fdf0ee', borderColor: '#e8d5d0' }}>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#a8a29e' }}>🍽️ Serving Suggestion</p>
                    <p className="text-sm" style={{ color: '#57534e' }}>{data.recipe.servingSuggestions}</p>
                  </div>

                  {/* Nudge to videos */}
                  <button
                    onClick={() => setTab('videos')}
                    className="w-full rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    style={{ background: '#292524', color: 'white' }}
                  >
                    <Play className="w-4 h-4" /> Watch it being made →
                  </button>
                </div>
              )}

              {/* ─── Watch & Cook Tab ─── */}
              {tab === 'videos' && (
                <div className="space-y-4">
                  {data.videos.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm" style={{ color: '#78716c' }}>
                        No videos found. Add a YouTube API key in your <code>.env</code> to enable this.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs" style={{ color: '#a8a29e' }}>
                        {data.videos.filter(v => v.isShort).length > 0 && (
                          <span className="inline-flex items-center gap-1 mr-2 px-2 py-0.5 rounded-full" style={{ background: '#fdf0ee', color: '#e28a93' }}>
                            🩳 {data.videos.filter(v => v.isShort).length} Shorts
                          </span>
                        )}
                        Tap a video to watch on YouTube
                      </p>

                      {/* Horizontal scroll of cards */}
                      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                        {data.videos.map(video => (
                          <VideoCard key={video.videoId} video={video} />
                        ))}
                      </div>

                      {/* Credits */}
                      <div className="rounded-xl p-3 border" style={{ background: '#fafaf9', borderColor: '#e7e5e4' }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: '#a8a29e' }}>Video Credits</p>
                        <ul className="space-y-1">
                          {data.videos.map(v => (
                            <li key={v.videoId} className="flex items-center gap-2">
                              <ExternalLink className="w-3 h-3 flex-shrink-0" style={{ color: '#a8a29e' }} />
                              <a
                                href={`https://www.youtube.com/channel/${v.channelId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs hover:underline truncate"
                                style={{ color: '#78716c' }}
                              >
                                {v.creditText}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Nudge to share */}
                      <button
                        onClick={() => setTab('share')}
                        className="w-full rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2"
                        style={{ background: '#25D366', color: 'white' }}
                      >
                        <MessageCircle className="w-4 h-4" /> Share as WhatsApp teaser →
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* ─── Share Teaser Tab ─── */}
              {tab === 'share' && (
                <div className="space-y-4">
                  <div className="rounded-xl p-3 border" style={{ background: 'white', borderColor: '#e7e5e4' }}>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#a8a29e' }}>Preview</p>
                    <textarea
                      value={shareMsg}
                      onChange={e => setShareMsg(e.target.value)}
                      rows={9}
                      className="w-full text-sm leading-relaxed resize-none focus:outline-none"
                      style={{ color: '#292524', background: 'transparent' }}
                    />
                  </div>

                  <p className="text-xs text-center" style={{ color: '#a8a29e' }}>
                    Edit the message above, then share
                  </p>

                  <Button
                    className="w-full h-14 text-base font-semibold rounded-2xl flex items-center justify-center gap-3"
                    style={{ background: '#25D366', color: 'white' }}
                    onClick={shareToWhatsApp}
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Send on WhatsApp
                  </Button>

                  <div className="rounded-xl p-3 border" style={{ background: '#fafaf9', borderColor: '#e7e5e4' }}>
                    <p className="text-[10px]" style={{ color: '#a8a29e' }}>
                      💡 <strong>Tip:</strong> Send this to your WhatsApp subscriber group a day or two before to build excitement. Include a photo of the dish for even more engagement!
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
