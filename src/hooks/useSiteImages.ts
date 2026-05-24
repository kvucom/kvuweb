import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export type SiteImages = Record<string, string>

export interface HeroMedia {
  id: number
  url: string
  type: 'image' | 'video' | 'gif'
  display_order: number
}

// Fallback defaults
const DEFAULTS: SiteImages = {
  'home-hero':        '/backgrounds/factory-hero.webp',
  'home-story':       '/backgrounds/industrial-story.webp',
  'home-cta':         'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fm=webp&w=1920&q=80',
  'home-cat-rice':    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fm=webp&w=800&q=80',
  'home-cat-poultry': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fm=webp&w=800&q=80',
  'home-cat-chakki':  '/products/mobile-chakki-oil.webp',
  'about-hero':       '/backgrounds/rice-field-hero.webp',
  'about-story':      '/backgrounds/industrial-story.webp',
  'about-partner-1':  '/managing_partner_1.webp',
  'about-partner-2':  '/managing_partner_2.webp',
}

export function useSiteImages() {
  const [images, setImages] = useState<SiteImages>(DEFAULTS)
  const [homeStoryPhotos, setHomeStoryPhotos] = useState<string[]>([DEFAULTS['home-story']])
  const [aboutStoryPhotos, setAboutStoryPhotos] = useState<string[]>([DEFAULTS['about-story']])
  const [heroGallery, setHeroGallery] = useState<HeroMedia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      try {
        const [
          { data: siteData },
          { data: homePhotos },
          { data: aboutPhotos },
          { data: heroData },
        ] = await Promise.all([
          supabase.from('site_images').select('key, url'),
          supabase.from('story_photos').select('url').eq('page', 'home').order('display_order', { ascending: true }),
          supabase.from('story_photos').select('url').eq('page', 'about').order('display_order', { ascending: true }),
          supabase.from('hero_gallery').select('*').order('display_order', { ascending: true }),
        ])

        if (siteData && siteData.length > 0) {
          const map: SiteImages = { ...DEFAULTS }
          siteData.forEach((row: { key: string; url: string }) => { map[row.key] = row.url })
          setImages(map)
        }
        if (homePhotos && homePhotos.length > 0) {
          setHomeStoryPhotos(homePhotos.map((r: { url: string }) => r.url))
        }
        if (aboutPhotos && aboutPhotos.length > 0) {
          setAboutStoryPhotos(aboutPhotos.map((r: { url: string }) => r.url))
        }
        if (heroData && heroData.length > 0) {
          setHeroGallery(heroData)
        }
      } catch {
        // Supabase not configured yet — use defaults
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  return { images, homeStoryPhotos, aboutStoryPhotos, heroGallery, loading }
}
