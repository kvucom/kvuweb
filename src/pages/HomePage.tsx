import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ScrollReveal from '../components/ScrollReveal'
import { useSiteImages } from '../hooks/useSiteImages'
import StorySlideshow from '../components/StorySlideshow'
import GalleryAndReviews from '../components/GalleryAndReviews'
import AnimatedCounter from '../components/AnimatedCounter'
import { Calendar, Users, Award, ShieldCheck, ArrowRight, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface AppProduct {
  id: string | number;
  name: string;
  description: string;
  category: string;
  images: string[];
  specs?: { label: string; value: string }[];
  badge?: string;
}

const FALLBACK_PRODUCTS: AppProduct[] = [
  {
    id: 'fallback-1',
    name: 'Automatic Combined Rice Mill Plant',
    description: 'High-efficiency modern combined rice mill with de-husking, polishing, and grading units. Optimized for minimal grain breakage.',
    category: 'rice-mill',
    badge: 'Best Seller',
    images: ['https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fm=webp&w=600&q=80'],
    specs: [
      { label: 'Capacity', value: '1.5 - 2 Tons/Hr' },
      { label: 'Power', value: '15 HP' },
      { label: 'Efficiency', value: '99%' }
    ]
  },
  {
    id: 'fallback-2',
    name: 'Industrial Poultry Feed Grinder & Mixer',
    description: 'Integrated vertical grinder and mixer plant designed for custom poultry feed formulation. Heavy-duty construction.',
    category: 'poultry-feed',
    badge: 'Industrial Grade',
    images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fm=webp&w=600&q=80'],
    specs: [
      { label: 'Capacity', value: '500 - 1000 kg/Hr' },
      { label: 'Type', value: 'Vertical Combined' },
      { label: 'Power Req.', value: '7.5 HP' }
    ]
  },
  {
    id: 'fallback-3',
    name: 'Mobile Atta Chakki with Oil Expeller',
    description: 'Dual-processing agricultural tractor-pulled unit containing a stone flour mill and a high-yield oil expeller.',
    category: 'atta-chakki',
    badge: 'Multi-Utility',
    images: ['/products/mobile-chakki-oil.webp'],
    specs: [
      { label: 'Mill Size', value: '16 Inch' },
      { label: 'Expeller', value: '6 Bolt' },
      { label: 'Mobility', value: 'Tractor PTO Driven' }
    ]
  }
];

export default function HomePage() {
  const { t } = useTranslation()
  const { images, homeStoryPhotos, heroGallery } = useSiteImages()
  const [activeSlide, setActiveSlide] = useState(0)
  const [scrollY, setScrollY] = useState(0)
  const [featured, setFeatured] = useState<AppProduct[]>(FALLBACK_PRODUCTS)

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const { data, error } = await supabase.from('products').select('*').limit(3)
        if (data && !error && data.length > 0) {
          const mapped = data.map((p: any) => ({
            id: p.id,
            name: p.title,
            description: p.description,
            category: p.category,
            images: [p.image_url],
            specs: p.specs || [],
            badge: p.badge || undefined,
          }))
          setFeatured(mapped)
        }
      } catch (err) {
        // Handled, keeps fallback
      }
    }
    fetchFeatured()
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (heroGallery.length <= 1) return
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % heroGallery.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [heroGallery.length])

  const stats = [
    { value: '40+', label: t('home.stats.years'), icon: Calendar },
    { value: '20+', label: t('home.stats.employees'), icon: Users },
    { value: '385k+', label: t('home.stats.clients'), icon: Star },
    { value: '99%', label: t('home.stats.quality'), icon: ShieldCheck },
  ]

  const whyUs = [
    { icon: 'verified', title: t('home.whyUs.items.expertise.title'), desc: t('home.whyUs.items.expertise.desc') },
    { icon: 'engineering', title: t('home.whyUs.items.workforce.title'), desc: t('home.whyUs.items.workforce.desc') },
    { icon: 'handshake', title: t('home.whyUs.items.policies.title'), desc: t('home.whyUs.items.policies.desc') },
    { icon: 'local_shipping', title: t('home.whyUs.items.delivery.title'), desc: t('home.whyUs.items.delivery.desc') },
    { icon: 'workspace_premium', title: t('home.whyUs.items.quality.title'), desc: t('home.whyUs.items.quality.desc') },
    { icon: 'currency_rupee', title: t('home.whyUs.items.pricing.title'), desc: t('home.whyUs.items.pricing.desc') },
  ]

  return (
    <main className="bg-surface selection:bg-secondary-gold selection:text-primary">
      {/* ── Premium Hero Section ──────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-between overflow-hidden bg-primary">
        {/* Parallax Hero Background */}
        <div 
          className="absolute inset-0 z-0 scale-110" 
          style={{ transform: `translateY(${scrollY * 0.4}px)` }}
        >
          {heroGallery.length > 0 ? (
            heroGallery.map((media, index) => (
              <div
                key={media.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                {media.type === 'video' ? (
                  <video src={media.url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                ) : (
                  <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('${media.url}')` }} />
                )}
              </div>
            ))
          ) : (
            <div className="w-full h-full opacity-40" style={{ backgroundImage: `url('${images['home-hero']}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          )}
          {/* Refined gradient overlay for depth */}
          <div className="absolute inset-0 z-20 bg-gradient-to-b from-primary/80 via-primary/40 to-primary/95 mix-blend-multiply" />
          <div className="absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-primary/20 to-primary/80" />
        </div>

        {/* Floating Slide Indicators */}
        {heroGallery.length > 1 && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3 hidden md:flex">
            {heroGallery.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSlide(index)}
                className={`w-1.5 transition-all duration-500 rounded-full ${
                  index === activeSlide ? 'h-10 bg-secondary-gold shadow-[0_0_15px_rgba(254,214,91,0.6)]' : 'h-3 bg-white/30 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Hero Content - Glassmorphism & Micro-animations */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-32 md:pt-40 pb-16 flex flex-col items-center text-center my-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 animate-fade-in-down shadow-[0_0_30px_rgba(254,214,91,0.1)]">
            <span className="w-2 h-2 rounded-full bg-secondary-gold animate-pulse" />
            <span className="font-grotesk text-[11px] text-white/90 tracking-[0.2em] uppercase font-semibold">
              {t('home.hero.badge')}
            </span>
          </div>
          
          <h1 className="font-grotesk font-bold text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.1] mb-8 tracking-tight drop-shadow-2xl">
            <span className="block text-white animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              {t('home.hero.title')}
            </span>
            <span className="block mt-2 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-secondary-gold via-yellow-200 to-secondary-gold animate-gradient-shift">
                {t('home.hero.titleHighlight')}
              </span>
              <span className="text-white"> {t('home.hero.titleEnd')}</span>
            </span>
          </h1>
          
          <p className="font-manrope text-lg md:text-xl text-white/80 mb-12 max-w-3xl mx-auto font-light leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            {t('home.hero.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
            <Link to="/products" className="group relative px-8 py-4 bg-secondary-gold text-primary font-grotesk font-bold uppercase tracking-widest text-sm rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(254,214,91,0.4)] w-full sm:w-auto">
              <span className="relative z-10 flex items-center justify-center gap-2">
                {t('home.hero.cta1')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </Link>
            <Link to="/contact" className="group px-8 py-4 border border-white/30 text-white font-grotesk font-bold uppercase tracking-widest text-sm rounded-full backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/50 w-full sm:w-auto">
              {t('home.hero.cta2')}
            </Link>
          </div>
        </div>

        {/* Floating Glass Stats Bar */}
        <div className="relative z-20 w-full px-6 pb-12 mt-auto animate-fade-in-up" style={{ animationDelay: '1.2s' }}>
          <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/10">
              {stats.map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="flex flex-col items-center justify-center text-center group">
                    <div className="mb-3 p-3 rounded-2xl bg-white/5 group-hover:bg-secondary-gold/20 transition-colors duration-300">
                      <Icon className="w-6 h-6 text-secondary-gold" />
                    </div>
                    <div className="font-grotesk font-bold text-3xl md:text-4xl text-white drop-shadow-md">
                      <AnimatedCounter value={s.value} duration={2000} delay={1500 + i * 200} />
                    </div>
                    <div className="font-grotesk text-[11px] md:text-xs uppercase tracking-[0.2em] text-white/60 mt-2 font-medium">
                      {s.label}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── About / Our Story - Dynamic Layout ────────────────── */}
      <section className="py-32 bg-surface relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-surface-low to-transparent" />
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <ScrollReveal className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 text-primary mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="font-grotesk text-xs uppercase tracking-widest font-bold">{t('home.story.badge')}</span>
              </div>
              <h2 className="font-grotesk font-bold text-4xl md:text-5xl text-primary mb-8 leading-tight">
                {t('home.story.title')}
              </h2>
              <div className="space-y-6">
                <p className="font-manrope text-lg text-on-surface-variant leading-relaxed" dangerouslySetInnerHTML={{ __html: t('home.story.p1') }} />
                <p className="font-manrope text-base text-outline leading-relaxed" dangerouslySetInnerHTML={{ __html: t('home.story.p2') }} />
              </div>
              <div className="mt-10">
                <Link to="/about" className="group inline-flex items-center gap-3 text-primary font-grotesk font-bold uppercase tracking-widest hover:text-secondary-gold transition-colors">
                  <span className="relative">
                    {t('home.story.cta')}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary-gold transition-all duration-300 group-hover:w-full" />
                  </span>
                  <div className="w-10 h-10 rounded-full border border-primary/20 flex items-center justify-center group-hover:border-secondary-gold group-hover:bg-secondary-gold/10 transition-all">
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200} className="order-1 lg:order-2 relative">
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/20 border-8 border-white">
                <div className="aspect-[4/5] bg-surface-low relative group">
                  <StorySlideshow images={homeStoryPhotos} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Krishi Vikas Udyog story" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-60" />
                </div>
                
                {/* Premium Floating Badge */}
                <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/50 flex items-center gap-6 transform translate-y-4 hover:translate-y-0 transition-transform duration-500">
                  <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-inner">
                    <Award className="w-8 h-8 text-secondary-gold" />
                  </div>
                  <div>
                    <div className="text-primary font-grotesk font-bold text-3xl md:text-4xl mb-1">40+</div>
                    <div className="text-on-surface-variant font-manrope text-xs font-bold uppercase tracking-widest">Years of Excellence</div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Featured Products - Premium Cards ─────────────────── */}
      <section className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 text-primary mb-4">
                <Star className="w-3 h-3 text-secondary-gold fill-secondary-gold" />
                <span className="font-grotesk text-xs uppercase tracking-widest font-bold">{t('home.products.badge')}</span>
              </div>
              <h2 className="font-grotesk font-bold text-4xl md:text-5xl text-primary">{t('home.products.title')}</h2>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <Link to="/products" className="group hidden md:flex items-center gap-3 text-primary font-grotesk font-bold uppercase tracking-widest hover:text-secondary-gold-dim transition-colors">
                {t('home.products.viewAll')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 xl:gap-12">
            {featured.map((p, i) => (
              <ScrollReveal key={p.id} delay={i * 150} className={i === 1 ? 'md:mt-12' : ''}>
                <div className="group bg-surface rounded-[2rem] p-4 hover:bg-white hover:shadow-[0_20px_40px_-15px_rgba(0,46,28,0.1)] transition-all duration-500 border border-transparent hover:border-primary/5">
                  <div className="relative h-72 rounded-3xl overflow-hidden bg-surface-low mb-6 flex items-center justify-center p-8 group-hover:shadow-inner transition-all">
                    <img
                      src={p.images?.[0] || `https://images.unsplash.com/photo-${i === 0 ? '1625246333195-78d9c38ad449' : i === 1 ? '1558618666-fcd25c85cd64' : '1574943320219-553eb213f72d'}?auto=format&fm=webp&w=600&q=80`}
                      alt={p.name}
                      className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-grotesk font-bold text-primary uppercase tracking-widest border border-white shadow-sm">
                      {p.badge}
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <h3 className="font-grotesk font-bold text-2xl text-primary mb-3 line-clamp-1 group-hover:text-secondary-gold-dim transition-colors">{p.name}</h3>
                    <p className="font-manrope text-on-surface-variant/80 mb-6 line-clamp-2 text-sm">{p.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-primary/5">
                      <Link to={`/products`} className="text-primary font-grotesk text-xs uppercase tracking-widest font-bold group/link flex items-center gap-2 hover:text-secondary-gold-dim transition-colors">
                        {t('products.viewDetails')}
                        <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
          
          <div className="mt-12 text-center md:hidden">
             <Link to="/products" className="inline-flex items-center gap-3 text-primary font-grotesk font-bold uppercase tracking-widest border-b-2 border-primary pb-1">
                {t('home.products.viewAll')}
                <ArrowRight className="w-5 h-5" />
              </Link>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us - Bento Box Style ───────────────────── */}
      <section className="py-32 bg-surface-low relative">
        <div className="max-w-7xl mx-auto px-6">
          <ScrollReveal className="text-center mb-20">
            <h2 className="font-grotesk font-bold text-4xl md:text-5xl text-primary mb-6">
              {t('home.whyUs.title')}
            </h2>
            <div className="w-24 h-1.5 bg-secondary-gold mx-auto rounded-full" />
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyUs.map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 100}>
                <div className="group h-full bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 border border-transparent hover:border-primary/10 relative overflow-hidden">
                  {/* Decorative gradient blob */}
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-secondary-gold/10 rounded-full blur-2xl group-hover:bg-secondary-gold/20 transition-colors duration-500" />
                  
                  <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all duration-500">
                    <span className="material-symbols-outlined text-primary group-hover:text-secondary-gold text-3xl transition-colors duration-500">
                      {item.icon}
                    </span>
                  </div>
                  <h3 className="font-grotesk font-bold text-xl text-primary mb-3 relative z-10">{item.title}</h3>
                  <p className="font-manrope text-sm text-on-surface-variant leading-relaxed relative z-10">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product Categories - Immersive Grid ───────────────── */}
      <section className="py-32 bg-primary text-white relative overflow-hidden">
         {/* Abstract background */}
         <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-secondary-gold via-transparent to-transparent" />
         
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <ScrollReveal className="mb-16 md:mb-24">
            <h2 className="font-grotesk font-bold text-4xl md:text-5xl lg:text-6xl max-w-2xl leading-tight">
              {t('home.categories.title')}
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {[
              {
                title: t('home.categories.riceMill.title'),
                desc: t('home.categories.riceMill.desc'),
                count: t('home.categories.riceMill.count'),
                to: '/products?cat=rice-mill',
                img: images['home-cat-rice'],
                colSpan: 'md:col-span-8',
                aspect: 'aspect-[16/10] md:aspect-auto'
              },
              {
                title: t('home.categories.poultry.title'),
                desc: t('home.categories.poultry.desc'),
                count: t('home.categories.poultry.count'),
                to: '/products?cat=poultry-feed',
                img: images['home-cat-poultry'],
                colSpan: 'md:col-span-4',
                aspect: 'aspect-square md:aspect-auto'
              },
              {
                title: t('home.categories.attaChakki.title'),
                desc: t('home.categories.attaChakki.desc'),
                count: t('home.categories.attaChakki.count'),
                to: '/products?cat=atta-chakki',
                img: images['home-cat-chakki'],
                colSpan: 'md:col-span-12',
                aspect: 'aspect-[16/7]'
              },
            ].map((cat, i) => (
              <ScrollReveal key={cat.title} delay={i * 150} className={`${cat.colSpan}`}>
                <Link to={cat.to} className={`group block relative rounded-3xl overflow-hidden ${cat.aspect} h-full min-h-[300px]`}>
                  <img
                    src={cat.img}
                    alt={cat.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                  
                  <div className="absolute inset-0 p-8 md:p-10 flex flex-col justify-end">
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-secondary-gold font-grotesk text-[10px] uppercase tracking-widest mb-4">
                          {cat.count}
                        </div>
                        <h3 className="font-grotesk font-bold text-3xl md:text-4xl text-white mb-2">{cat.title}</h3>
                        <p className="font-manrope text-white/70 max-w-md hidden md:block">{cat.desc}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-secondary-gold text-primary flex items-center justify-center transform group-hover:rotate-45 transition-transform duration-500 shrink-0">
                        <ArrowRight className="w-6 h-6 -rotate-45 group-hover:rotate-0 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Media Gallery & Reviews ───────────────────────────── */}
      <GalleryAndReviews />

      {/* ── Premium CTA Section ───────────────────────────────── */}
      <section className="relative py-32 overflow-hidden bg-primary">
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full transform scale-105"
            style={{
              backgroundImage: `url('${images['home-cta']}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-primary/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <ScrollReveal>
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-12 md:p-20 shadow-2xl">
              <span className="inline-block px-4 py-1.5 rounded-full bg-secondary-gold/10 border border-secondary-gold/20 text-secondary-gold font-grotesk text-xs uppercase tracking-[0.2em] font-bold mb-8">
                {t('home.cta.badge')}
              </span>
              <h2 className="font-grotesk font-bold text-4xl md:text-5xl lg:text-6xl text-white mb-6 leading-tight">
                {t('home.cta.title')}
              </h2>
              <p className="font-manrope text-lg text-white/70 mb-10 max-w-2xl mx-auto">
                {t('home.cta.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/contact" className="px-8 py-4 bg-secondary-gold text-primary font-grotesk font-bold uppercase tracking-widest text-sm rounded-full hover:bg-white transition-colors duration-300">
                  {t('home.cta.btn1')}
                </Link>
                <a href="tel:+919415139838" className="px-8 py-4 bg-white/10 text-white border border-white/20 font-grotesk font-bold uppercase tracking-widest text-sm rounded-full hover:bg-white/20 transition-colors duration-300 backdrop-blur-md">
                  {t('home.cta.btn2')}
                </a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  )
}
