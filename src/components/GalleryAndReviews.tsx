import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ScrollReveal from './ScrollReveal'
import { Play, X, Star } from 'lucide-react'

interface MediaItem {
  id: string
  type: 'image' | 'video' | 'embed'
  url: string
  embed_url?: string
  platform?: 'youtube' | 'x' | 'instagram'
  caption?: string
  display_order: number
}

interface Review {
  id: string
  name: string
  role: string
  content: string
  rating: number
  display_order: number
}

const staticMedia: MediaItem[] = [
  { id: 's1', type: 'video', url: 'https://images.unsplash.com/photo-1565439390118-bbf3252fa975?auto=format&fm=webp&w=600&0', display_order: 1 },
  { id: 's2', type: 'image', url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fm=webp&w=600&0', display_order: 2 },
  { id: 's3', type: 'image', url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fm=webp&w=600&0', display_order: 3 },
  { id: 's4', type: 'video', url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fm=webp&w=600&0', display_order: 4 },
]

const staticReviews: Review[] = [
  { id: 'r1', name: 'Rajesh Kumar', role: 'Rice Mill Owner, UP', content: 'The fully automatic rice mill plant we installed from Krishi Vikas Udyog has increased our production by 40%. The quality of machinery and after-sales service is unmatched.', rating: 5, display_order: 1 },
  { id: 'r2', name: 'Suresh Patel', role: 'Poultry Farm Director, Gujarat', content: 'Their poultry feed plant is highly efficient and robust. We have been using it for 3 years without any major breakdown. Highly recommend their products.', rating: 5, display_order: 2 },
  { id: 'r3', name: 'Amit Singh', role: 'Agro Industries, Punjab', content: 'Bought a commercial Atta Chakki last year. It is a heavy-duty machine with excellent output quality. The team guided us perfectly during installation.', rating: 4, display_order: 3 },
]

export default function GalleryAndReviews() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(staticMedia)
  const [testimonials, setTestimonials] = useState<Review[]>(staticReviews)
  const [activeEmbed, setActiveEmbed] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: media }, { data: reviews }] = await Promise.all([
        supabase.from('media_items').select('*').order('display_order'),
        supabase.from('reviews').select('*').order('display_order'),
      ])
      if (media && media.length > 0) setMediaItems(media)
      if (reviews && reviews.length > 0) setTestimonials(reviews)
    }
    fetchData()
  }, [])

  const handleEmbedClick = (item: MediaItem) => {
    if (item.type === 'embed' && item.embed_url) {
      setActiveEmbed(item.id)
    }
  }

  const closeEmbed = () => setActiveEmbed(null)

  const activeItem = mediaItems.find(m => m.id === activeEmbed)

  return (
    <>
      <section className="py-section bg-surface-low overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-8 md:px-16">
          <ScrollReveal className="text-center mb-16">
            <span className="section-label text-primary mb-3 block">Gallery &amp; Feedback</span>
            <h2 className="font-grotesk font-semibold text-h1 text-primary">Media &amp; Client Reviews</h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <ScrollReveal delay={100}>
              <h3 className="font-grotesk font-bold text-2xl text-primary mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary-gold">photo_library</span>
                Our Machinery in Action
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {mediaItems.map((item) => (
                  <div key={item.id} className="relative group aspect-square rounded-2xl overflow-hidden shadow-sm bg-gray-200">
                    {item.type === 'embed' ? (
                      <div
                        className="w-full h-full flex flex-col items-center justify-center bg-gray-900 cursor-pointer"
                        onClick={() => handleEmbedClick(item)}
                      >
                        {item.platform === 'youtube' && item.url ? (
                          <img src={item.url} alt={item.caption || 'Embedded video'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        ) : (
                          <div className="text-5xl">{item.platform === 'x' ? '🐦' : '📸'}</div>
                        )}
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                          <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                            <Play className="text-primary fill-primary w-6 h-6 ml-0.5" />
                          </div>
                        </div>
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                          {item.platform}
                        </div>
                      </div>
                    ) : (
                      <>
                        <img
                          src={item.url}
                          alt={item.caption || 'Gallery item'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        {item.type === 'video' && (
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center pl-1 group-hover:scale-110 transition-transform shadow-lg cursor-pointer">
                              <Play className="text-primary fill-primary w-5 h-5" />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm text-on-surface-variant mt-4 text-center">
                More photos and videos coming soon.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <h3 className="font-grotesk font-bold text-2xl text-primary mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary-gold">format_quote</span>
                What Our Clients Say
              </h3>
              <div className="flex flex-col gap-6">
                {testimonials.map((t) => (
                  <div key={t.id} className="bg-white p-8 rounded-2xl shadow-sm border border-outline-variant/30 hover:border-primary/20 hover:shadow-md transition-all">
                    <div className="flex text-secondary-gold gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-5 h-5 ${
                            i < t.rating 
                              ? 'text-secondary-gold fill-secondary-gold' 
                              : 'text-secondary-gold/20 fill-transparent'
                          }`} 
                        />
                      ))}
                    </div>
                    <p className="font-manrope text-on-surface-variant italic mb-5">"{t.content}"</p>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-white font-bold font-grotesk">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-grotesk font-bold text-primary">{t.name}</h4>
                        <p className="text-xs text-on-surface-variant uppercase tracking-wider">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Embed Modal */}
      {activeEmbed && activeItem?.embed_url && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={closeEmbed}>
          <div className="relative w-full max-w-3xl bg-black rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={closeEmbed} className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors">
              <X size={20} />
            </button>
            {activeItem.platform === 'youtube' && (
              <div className="aspect-video">
                <iframe src={activeItem.embed_url} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            )}
            {activeItem.platform === 'x' && (
              <div className="min-h-[300px] p-8 flex items-center justify-center bg-white">
                <blockquote className="twitter-tweet" data-dnt="true">
                  <a href={`https://x.com/i/web/status/${activeItem.id}`}>Loading tweet...</a>
                </blockquote>
                <script async src="https://platform.x.com/widgets.js" charSet="utf-8" />
              </div>
            )}
            {activeItem.platform === 'instagram' && (
              <div className="min-h-[400px] p-4 flex items-center justify-center bg-white">
                <iframe src={activeItem.embed_url} className="w-full max-w-md h-[500px] border-0" allowFullScreen />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
