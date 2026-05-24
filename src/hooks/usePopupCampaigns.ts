import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface PopupCampaign {
  id: string
  title: string
  message: string
  image_url?: string
  cta_text?: string
  cta_link?: string
  is_active: boolean
  start_date?: string
  end_date?: string
  type: 'notice' | 'offer' | 'campaign' | 'alert'
  display_mode: 'popup' | 'banner-top' | 'banner-bottom'
  priority: number
  dismissible: boolean
  delay_seconds: number
  show_once: boolean
}

export function usePopupCampaigns() {
  const [activeCampaigns, setActiveCampaigns] = useState<PopupCampaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const CACHE_KEY = 'kuv_popup_campaigns'

    const cached = sessionStorage.getItem(CACHE_KEY)
    if (cached) {
      try {
        setActiveCampaigns(JSON.parse(cached))
        setLoading(false)
        return
      } catch { /* ignore */ }
    }

    async function fetchCampaigns() {
      try {
        const now = new Date().toISOString()
        const { data } = await supabase
          .from('popup_campaigns')
          .select('*')
          .eq('is_active', true)
          .or(`start_date.is.null,start_date.lte.${now}`)
          .or(`end_date.is.null,end_date.gte.${now}`)
          .order('priority', { ascending: false })

        const campaigns = data || []
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(campaigns))
        setActiveCampaigns(campaigns)
      } catch {
        setActiveCampaigns([])
      } finally {
        setLoading(false)
      }
    }

    fetchCampaigns()
  }, [])

  return { activeCampaigns, loading }
}
