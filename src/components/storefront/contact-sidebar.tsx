import { SubscribeForm } from './subscribe-form'
import { MessageCircle, Mail, Phone, ExternalLink } from 'lucide-react'

interface ContactSidebarProps {
  seller: {
    id: string
    storeName: string
    whatsappGroupLink?: string | null
    socialLinks?: Record<string, string> | null
    user: { email?: string | null }
  }
}

export function ContactSidebar({ seller }: ContactSidebarProps) {
  const socialLinks = seller.socialLinks as Record<string, string> | null

  return (
    <div className="space-y-4">
      <SubscribeForm sellerId={seller.id} />

      {/* Contact Links */}
      <div className="bg-white rounded-xl border p-4 space-y-3">
        <h3 className="font-semibold text-gray-900">Contact</h3>

        {seller.whatsappGroupLink && (
          <a
            href={seller.whatsappGroupLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-[#f7e9de] rounded-lg hover:bg-[#f5e0dc] transition-colors"
          >
            <MessageCircle className="w-5 h-5 text-[#c1622d] fill-[#f7e9de]" />
            <span className="text-sm font-medium text-[#a64f20]">Join WhatsApp Group</span>
            <ExternalLink className="w-4 h-4 text-[#c1622d] ml-auto" />
          </a>
        )}

        {seller.user.email && (
          <a
            href={`mailto:${seller.user.email}`}
            className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Mail className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-700">{seller.user.email}</span>
          </a>
        )}
      </div>

      {/* Social Links */}
      {socialLinks && Object.keys(socialLinks).length > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Social</h3>
          <div className="space-y-2">
            {Object.entries(socialLinks).map(([platform, url]) => (
              url && (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-lg">
                    {platform === 'instagram' ? '📸' : platform === 'facebook' ? '📘' : platform === 'twitter' ? '🐦' : '🔗'}
                  </span>
                  <span className="text-sm capitalize text-gray-700">{platform}</span>
                  <ExternalLink className="w-3 h-3 text-gray-400 ml-auto" />
                </a>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
