import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Upload, CheckCircle, Loader2, Trash2, Play, Image, Film } from 'lucide-react'
import { compressImage } from '../../lib/imageUtils'

interface ImageSlot {
  key: string;
  label: string;
  page: string;
  size: string;
  ratio: string;
  tip: string;
  type: string;
  hasNameInput?: boolean;
}

const IMAGE_SLOTS: ImageSlot[] = [
  {
    key: 'home-hero',
    label: 'Home — Hero Background',
    page: 'Home Page',
    size: '1920 × 1080 px',
    ratio: '16:9 Landscape',
    tip: 'Upload multiple images, videos (MP4), or GIFs. They will auto-rotate as a slideshow.',
    type: 'hero-gallery',
  },
  {
    key: 'home-story',
    label: 'Home — Our Story Photos',
    page: 'Home Page',
    size: '800 × 800 px',
    ratio: '1:1 Square',
    tip: 'Appears beside the company story text. Upload multiple photos for a slideshow.',
    type: 'gallery',
  },
  {
    key: 'home-cta',
    label: 'Home — CTA Background',
    page: 'Home Page',
    size: '1920 × 600 px',
    ratio: '16:5 Wide Banner',
    tip: 'Background for the "Contact Us" banner. Dark or industrial photo recommended.',
    type: 'single',
  },
  {
    key: 'home-cat-rice',
    label: 'Home — Rice Mill Category',
    page: 'Home Page',
    size: '800 × 450 px',
    ratio: '16:9 Landscape',
    tip: 'Category card image. Rice field or rice mill machinery photo.',
    type: 'single',
  },
  {
    key: 'home-cat-poultry',
    label: 'Home — Poultry Feed Category',
    page: 'Home Page',
    size: '800 × 450 px',
    ratio: '16:9 Landscape',
    tip: 'Category card image. Poultry farm or feed plant photo.',
    type: 'single',
  },
  {
    key: 'home-cat-chakki',
    label: 'Home — Atta Chakki Category',
    page: 'Home Page',
    size: '800 × 450 px',
    ratio: '16:9 Landscape',
    tip: 'Category card image. Chakki or oil expeller machinery photo.',
    type: 'single',
  },
  {
    key: 'about-hero',
    label: 'About — Hero Background',
    page: 'About Page',
    size: '1920 × 600 px',
    ratio: '16:5 Wide Banner',
    tip: 'Top banner of About page. Rice field or manufacturing plant photo.',
    type: 'single',
  },
  {
    key: 'about-story',
    label: 'About — Company Story Photos',
    page: 'About Page',
    size: '800 × 600 px',
    ratio: '4:3 Landscape',
    tip: 'Appears beside company story text. Upload multiple photos for a slideshow.',
    type: 'gallery',
  },
  {
    key: 'about-partner-1',
    label: 'About — Managing Partner 1',
    page: 'About Page',
    size: '800 × 1000 px',
    ratio: '4:5 Portrait',
    tip: 'Portrait photo for the first managing partner.',
    type: 'single',
    hasNameInput: true,
  },
  {
    key: 'about-partner-2',
    label: 'About — Managing Partner 2',
    page: 'About Page',
    size: '800 × 1000 px',
    ratio: '4:5 Portrait',
    tip: 'Portrait photo for the second managing partner.',
    type: 'single',
    hasNameInput: true,
  },
]

const DEFAULTS: Record<string, string> = {
  'home-hero':        '/backgrounds/factory-hero.webp',
  'home-cta':         'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fm=webp&w=1920&q=80',
  'home-cat-rice':    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fm=webp&w=800&q=80',
  'home-cat-poultry': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fm=webp&w=800&q=80',
  'home-cat-chakki':  '/products/mobile-chakki-oil.webp',
  'about-hero':       '/backgrounds/rice-field-hero.webp',
  'about-partner-1':  '/managing_partner_1.webp',
  'about-partner-2':  '/managing_partner_2.webp',
  'about-partner-1-name': 'Managing Partner 1',
  'about-partner-2-name': 'Managing Partner 2',
}

interface StoryPhoto {
  id: number
  url: string
  display_order: number
}

interface HeroMedia {
  id: number
  url: string
  type: 'image' | 'video' | 'gif'
  display_order: number
}

// Helper to generate unique paths outside of the component to avoid react-hooks/purity errors with Date.now()
function makeUniquePath(folder: string, prefix: string, ext?: string, index?: number): string {
  const cleanExt = ext || 'jpg'
  const timestamp = Date.now()
  const suffix = index !== undefined ? `-${index}` : ''
  return `${folder}/${prefix}-${timestamp}${suffix}.${cleanExt}`
}

function getMediaType(filename: string): 'image' | 'video' | 'gif' {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'gif') return 'gif'
  if (['mp4', 'webm', 'ogg', 'mov'].includes(ext || '')) return 'video'
  return 'image'
}

export default function ManageSiteImages() {
  const [currentImages, setCurrentImages] = useState<Record<string, string>>(DEFAULTS)
  const [galleries, setGalleries] = useState<Record<string, StoryPhoto[]>>({
    'home-story': [],
    'about-story': []
  })
  const [heroGallery, setHeroGallery] = useState<HeroMedia[]>([])
  const [uploading, setUploading] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchImages = async () => {
    // Single images
    supabase.from('site_images').select('key, url').then(({ data }) => {
      if (data) {
        const map: Record<string, string> = { ...DEFAULTS }
        data.forEach((r: { key: string; url: string }) => { map[r.key] = r.url })
        setCurrentImages(map)
      }
    })

    // Gallery images (story photos)
    const { data: homePhotos } = await supabase.from('story_photos').select('*').eq('page', 'home').order('display_order')
    const { data: aboutPhotos } = await supabase.from('story_photos').select('*').eq('page', 'about').order('display_order')
    
    setGalleries({
      'home-story': homePhotos || [],
      'about-story': aboutPhotos || []
    })

    // Hero gallery
    const { data: heroData } = await supabase.from('hero_gallery').select('*').order('display_order')
    setHeroGallery(heroData || [])
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchImages()
    })
  }, [])

  const handleUploadSingle = async (slotKey: string, file: File) => {
    setUploading(slotKey)
    setSuccess(null)
    try {
      const compressedFile = await compressImage(file)
      const path = makeUniquePath('site', slotKey, 'webp')

      const { error: upErr } = await supabase.storage.from('images').upload(path, compressedFile, { upsert: true })
      if (upErr) throw upErr

      const { data: urlData } = supabase.storage.from('images').getPublicUrl(path)
      const publicUrl = urlData.publicUrl

      const { error: dbErr } = await supabase
        .from('site_images')
        .upsert({ key: slotKey, url: publicUrl, label: IMAGE_SLOTS.find(s => s.key === slotKey)?.label }, { onConflict: 'key' })
      if (dbErr) throw dbErr

      setCurrentImages(prev => ({ ...prev, [slotKey]: publicUrl }))
      setSuccess(slotKey)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert('Upload failed: ' + msg)
    } finally {
      setUploading(null)
    }
  }

  const handleUploadGallery = async (slotKey: string, files: FileList) => {
    setUploading(slotKey)
    setSuccess(null)
    const page = slotKey === 'home-story' ? 'home' : 'about'
    
    try {
      const currentCount = galleries[slotKey].length

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const compressedFile = await compressImage(file)
        const path = makeUniquePath('story', `${page}`, 'webp', i)

        const { error: upErr } = await supabase.storage.from('images').upload(path, compressedFile)
        if (upErr) throw upErr

        const { data: urlData } = supabase.storage.from('images').getPublicUrl(path)
        
        await supabase.from('story_photos').insert({
          page,
          url: urlData.publicUrl,
          display_order: currentCount + i
        })
      }
      
      await fetchImages()
      setSuccess(slotKey)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert('Upload failed: ' + msg)
    } finally {
      setUploading(null)
    }
  }

  const handleDeleteGalleryImage = async (id: number) => {
    if (!confirm('Delete this photo?')) return
    
    try {
      const { error } = await supabase.from('story_photos').delete().eq('id', id)
      if (error) throw error
      await fetchImages()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert('Delete failed: ' + msg)
    }
  }

  const handleUploadHeroGallery = async (files: FileList) => {
    setUploading('home-hero')
    setSuccess(null)
    
    try {
      const currentCount = heroGallery.length

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const isImage = file.type.startsWith('image/')
        const compressedFile = isImage ? await compressImage(file) : file
        const ext = isImage ? 'webp' : (file.name.split('.').pop() || 'mp4')
        const mediaType = getMediaType(file.name)
        const path = makeUniquePath('hero', 'background', ext, i)

        const { error: upErr } = await supabase.storage.from('images').upload(path, compressedFile)
        if (upErr) throw upErr

        const { data: urlData } = supabase.storage.from('images').getPublicUrl(path)
        
        await supabase.from('hero_gallery').insert({
          url: urlData.publicUrl,
          type: mediaType,
          display_order: currentCount + i
        })
      }
      
      await fetchImages()
      setSuccess('home-hero')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert('Upload failed: ' + msg)
    } finally {
      setUploading(null)
    }
  }

  const handleDeleteHeroMedia = async (id: number) => {
    if (!confirm('Delete this media?')) return
    
    try {
      const { error } = await supabase.from('hero_gallery').delete().eq('id', id)
      if (error) throw error
      await fetchImages()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert('Delete failed: ' + msg)
    }
  }


  const pages = ['Home Page', 'About Page']

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Site Images</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Upload new images for the Home and About pages. Changes go live immediately.
        </p>
      </div>

      {pages.map(page => (
        <div key={page}>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-green-500 rounded-full inline-block" />
            {page}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {IMAGE_SLOTS.filter(s => s.page === page).map((slot, idx) => (
              <div
                key={slot.key}
                className={`animate-fade-in-up stagger-${Math.min(idx + 1, 6)} bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm flex flex-col`}
              >
                {slot.type === 'single' ? (
                  <>
                    <div className="relative h-40 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <img
                        src={currentImages[slot.key]}
                        alt={slot.label}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x200?text=No+Image' }}
                      />
                      {success === slot.key && (
                        <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center">
                          <CheckCircle className="text-white" size={40} />
                        </div>
                      )}
                    </div>
                  </>
                ) : slot.type === 'hero-gallery' ? (
                  <>
                    <div className="h-40 bg-gray-50 dark:bg-gray-800 overflow-y-auto p-2 hide-scrollbar">
                      {heroGallery.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {heroGallery.map(media => (
                            <div key={media.id} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                              {media.type === 'video' ? (
                                <video src={media.url} className="w-full h-full object-cover" muted />
                              ) : (
                                <img src={media.url} alt="Hero media" className="w-full h-full object-cover" />
                              )}
                              <div className="absolute top-1 left-1">
                                {media.type === 'video' && (
                                  <span className="bg-black/60 text-white p-0.5 rounded-full"><Play size={8} /></span>
                                )}
                                {media.type === 'gif' && (
                                  <span className="bg-black/60 text-white p-0.5 rounded-full"><Film size={8} /></span>
                                )}
                              </div>
                              <button
                                onClick={() => handleDeleteHeroMedia(media.id)}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <span className="text-2xl mb-2"><Image /></span>
                          <span className="text-xs">No media uploaded</span>
                          <span className="text-[10px]">Using default static image</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-40 bg-gray-50 dark:bg-gray-800 overflow-y-auto p-2 hide-scrollbar">
                      {galleries[slot.key]?.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {galleries[slot.key].map(photo => (
                            <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                              <img src={photo.url} alt="Gallery item" className="w-full h-full object-cover" />
                              <button
                                onClick={() => handleDeleteGalleryImage(photo.id)}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <span className="text-2xl mb-2">📸</span>
                          <span className="text-xs">No photos uploaded</span>
                          <span className="text-[10px]">Using default static image</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="p-4 flex flex-col flex-grow">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 leading-tight">{slot.label}</p>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                      📐 {slot.size}
                    </span>
                    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                      {slot.ratio}
                    </span>
                    {(slot.type === 'gallery' || slot.type === 'hero-gallery') && (
                      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                        🖼️ Multi
                      </span>
                    )}
                    {slot.type === 'hero-gallery' && (
                      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                        🎬 Video/GIF
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3 leading-relaxed flex-grow">💡 {slot.tip}</p>

                  <label className="cursor-pointer w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:border-green-500 hover:text-green-600 dark:hover:text-green-400 transition-all mt-auto">
                    {uploading === slot.key
                      ? <><Loader2 size={16} className="animate-spin" /> Uploading...</>
                      : <><Upload size={16} /> {slot.type === 'gallery' || slot.type === 'hero-gallery' ? 'Add Files' : 'Change Image'}</>
                    }
                    <input
                      type="file"
                      accept="image/*,video/*,.gif"
                      multiple={slot.type === 'gallery' || slot.type === 'hero-gallery'}
                      className="sr-only"
                      disabled={!!uploading}
                      onChange={(e) => {
                        const files = e.target.files
                        if (!files || files.length === 0) return
                        
                        if (slot.type === 'hero-gallery') {
                          handleUploadHeroGallery(files)
                        } else if (slot.type === 'gallery') {
                          handleUploadGallery(slot.key, files)
                        } else {
                          handleUploadSingle(slot.key, files[0])
                        }
                        e.target.value = ''
                      }}
                    />
                  </label>

                  {/* Name Input for Partners */}
                  {slot.hasNameInput && (
                    <div className="mt-3">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Partner Name</label>
                      <input
                        type="text"
                        value={currentImages[`${slot.key}-name`] || DEFAULTS[`${slot.key}-name`]}
                        onChange={(e) => setCurrentImages(prev => ({ ...prev, [`${slot.key}-name`]: e.target.value }))}
                        onBlur={async (e) => {
                          const val = e.target.value
                          try {
                            setUploading(`${slot.key}-name`)
                            const { error } = await supabase
                              .from('site_images')
                              .upsert({ key: `${slot.key}-name`, url: val, label: 'Partner Name' }, { onConflict: 'key' })
                            if (error) throw error
                            setSuccess(`${slot.key}-name`)
                            setTimeout(() => setSuccess(null), 3000)
                          } catch (err) {
                            console.error(err)
                          } finally {
                            setUploading(null)
                          }
                        }}
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="E.g., John Doe"
                      />
                      {success === `${slot.key}-name` && (
                        <span className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1"><CheckCircle size={12} /> Saved</span>
                      )}
                    </div>
                  )}

                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
