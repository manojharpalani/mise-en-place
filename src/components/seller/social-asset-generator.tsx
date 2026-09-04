'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Download, Image as ImageIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface SocialAssetGeneratorProps {
  storeSlug: string
  menuItems: Array<{ id: number; name: string }>
}

export function SocialAssetGenerator({ storeSlug, menuItems }: SocialAssetGeneratorProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const generateImage = async () => {
    if (!selectedItemId) {
      toast.error('Select a menu item first')
      return
    }
    setLoading(true)
    try {
      const url = `/api/og/${storeSlug}?itemId=${selectedItemId}`
      setImageUrl(url)
      toast.success('Image generated!')
    } catch {
      toast.error('Failed to generate image')
    } finally {
      setLoading(false)
    }
  }

  const downloadImage = async () => {
    if (!imageUrl) return
    try {
      const res = await fetch(imageUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${storeSlug}-menu-item.png`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download')
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Select Menu Item</Label>
        <Select onValueChange={(v) => setSelectedItemId(v ?? '')} value={selectedItemId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose an item..." />
          </SelectTrigger>
          <SelectContent>
            {menuItems.map((item) => (
              <SelectItem key={item.id} value={String(item.id)}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={generateImage}
        disabled={loading || !selectedItemId}
        className="w-full bg-[#c1622d] hover:bg-[#a64f20]"
      >
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
        Generate Social Image
      </Button>

      {imageUrl && (
        <div className="space-y-3">
          <div className="rounded-xl overflow-hidden border">
            <Image src={imageUrl} alt="Social media asset" width={600} height={315} className="w-full" />
          </div>
          <Button variant="outline" size="sm" onClick={downloadImage} className="w-full">
            <Download className="w-4 h-4 mr-2" /> Download PNG
          </Button>
        </div>
      )}
    </div>
  )
}
