import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { X, ExternalLink, AlertTriangle, Megaphone, Tag, PartyPopper, Clock } from 'lucide-react'
import type { PopupCampaign } from '../hooks/usePopupCampaigns'

const typeConfig = {
  notice: {
    bg: 'bg-blue-600',
    bgLight: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    icon: <Megaphone size={20} />,
  },
  offer: {
    bg: 'bg-green-600',
    bgLight: 'bg-green-50 dark:bg-green-900/30',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
    icon: <Tag size={20} />,
  },
  campaign: {
    bg: 'bg-amber-600',
    bgLight: 'bg-amber-50 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    icon: <PartyPopper size={20} />,
  },
  alert: {
    bg: 'bg-red-600',
    bgLight: 'bg-red-50 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    icon: <AlertTriangle size={20} />,
  },
}

interface CampaignBannerProps {
  campaign: PopupCampaign
  onDismiss: (id: string) => void
}

function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const end = new Date(endDate).getTime()
      const diff = end - now

      if (diff <= 0) {
        setTimeLeft('')
        clearInterval(interval)
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
    }, 1000)

    return () => clearInterval(interval)
  }, [endDate])

  if (!timeLeft) return null

  return (
    <div className="flex items-center gap-1 text-xs font-mono font-bold">
      <Clock size={12} />
      {timeLeft}
    </div>
  )
}

function PopupModal({ campaign, onDismiss }: CampaignBannerProps) {
  const [visible, setVisible] = useState(false)
  const config = typeConfig[campaign.type]

  useEffect(() => {
    if (campaign.show_once) {
      const dismissed = sessionStorage.getItem(`popup_dismissed_${campaign.id}`)
      if (dismissed) return
    }

    const timer = setTimeout(() => setVisible(true), campaign.delay_seconds * 1000)
    return () => clearTimeout(timer)
  }, [campaign])

  const handleDismiss = () => {
    setVisible(false)
    if (campaign.show_once) {
      sessionStorage.setItem(`popup_dismissed_${campaign.id}`, 'true')
    }
    onDismiss(campaign.id)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={campaign.dismissible ? handleDismiss : undefined} />
      <div className="relative w-full max-w-lg animate-scale-in bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        {campaign.image_url && (
          <div className="relative h-48 overflow-hidden">
            <img src={campaign.image_url} alt={campaign.title} loading="lazy" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}

        <div className={`p-6 ${campaign.image_url ? '-mt-12 relative z-10' : ''}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${config.bgLight} ${config.text}`}>
                {config.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{campaign.title}</h3>
            </div>
            {campaign.dismissible && (
              <button onClick={handleDismiss} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <X size={20} />
              </button>
            )}
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">{campaign.message}</p>

          {campaign.end_date && (
            <div className="mb-4">
              <CountdownTimer endDate={campaign.end_date} />
            </div>
          )}

          {campaign.cta_text && campaign.cta_link && (
            <div className="flex gap-3">
              {campaign.cta_link.startsWith('/') ? (
                <Link to={campaign.cta_link} onClick={handleDismiss} className={`flex-1 ${config.bg} text-white py-3 rounded-xl font-semibold text-center hover:opacity-90 transition-opacity`}>
                  {campaign.cta_text}
                </Link>
              ) : (
                <a href={campaign.cta_link} target="_blank" rel="noopener noreferrer" onClick={handleDismiss} className={`flex-1 ${config.bg} text-white py-3 rounded-xl font-semibold text-center hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}>
                  {campaign.cta_text} <ExternalLink size={16} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BannerBar({ campaign, onDismiss }: CampaignBannerProps) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const bannerRef = useRef<HTMLDivElement>(null)
  const config = typeConfig[campaign.type]
  const isTop = campaign.display_mode === 'banner-top'

  useEffect(() => {
    if (campaign.show_once) {
      const dismissed = sessionStorage.getItem(`banner_dismissed_${campaign.id}`)
      if (dismissed) return
    }

    const timer = setTimeout(() => setVisible(true), campaign.delay_seconds * 1000)
    return () => clearTimeout(timer)
  }, [campaign])

  useEffect(() => {
    if (visible && !dismissed && isTop && bannerRef.current) {
      const height = bannerRef.current.offsetHeight
      document.documentElement.style.setProperty('--top-banner-height', `${height}px`)
    }
    return () => {
      if (isTop) {
        document.documentElement.style.setProperty('--top-banner-height', '0px')
      }
    }
  }, [visible, dismissed, isTop])

  const handleDismiss = () => {
    setDismissed(true)
    setVisible(false)
    if (campaign.show_once) {
      sessionStorage.setItem(`banner_dismissed_${campaign.id}`, 'true')
    }
    onDismiss(campaign.id)
  }

  if (!visible || dismissed) return null

  return (
    <div
      ref={bannerRef}
      className={`fixed left-0 right-0 z-[9998] ${config.bg} transition-all duration-500 ${
        isTop ? 'top-0' : 'bottom-0'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="text-white/80 flex-shrink-0">
            {config.icon}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{campaign.title}</p>
            <p className="text-white/80 text-xs truncate hidden sm:block">{campaign.message}</p>
          </div>
          {campaign.end_date && campaign.type === 'offer' && (
            <div className="text-white/90 flex-shrink-0">
              <CountdownTimer endDate={campaign.end_date} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {campaign.cta_text && campaign.cta_link && (
            campaign.cta_link.startsWith('/') ? (
              <Link to={campaign.cta_link} onClick={handleDismiss} className="bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap">
                {campaign.cta_text}
              </Link>
            ) : (
              <a href={campaign.cta_link} target="_blank" rel="noopener noreferrer" onClick={handleDismiss} className="bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap">
                {campaign.cta_text} <ExternalLink size={14} />
              </a>
            )
          )}
          {campaign.dismissible && (
            <button onClick={handleDismiss} className="text-white/70 hover:text-white p-1 transition-colors">
              <X size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CampaignBanner({ campaign, onDismiss }: CampaignBannerProps) {
  if (campaign.display_mode === 'popup') {
    return <PopupModal campaign={campaign} onDismiss={onDismiss} />
  }
  return <BannerBar campaign={campaign} onDismiss={onDismiss} />
}
