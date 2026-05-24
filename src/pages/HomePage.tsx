import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ScrollReveal from '../components/ScrollReveal'
import { useSiteImages } from '../hooks/useSiteImages'
import StorySlideshow from '../components/StorySlideshow'
import GalleryAndReviews from '../components/GalleryAndReviews'
import AnimatedCounter from '../components/AnimatedCounter'
import { Calendar, Users, Award, ShieldCheck, ArrowRight, Star, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface StandardSpec {
  label: string;
  value: string;
  section_title?: never;
  specs?: never;
}

interface ComboSpec {
  section_title: string;
  specs: { label: string; value: string }[];
  label?: never;
  value?: never;
}

type AppProductSpec = StandardSpec | ComboSpec;

interface AppProductVariant {
  variant_name: string;
  required_hp: string;
  equipment: string[];
}

interface AppProduct {
  id: string | number;
  name: string;
  description: string;
  category: string;
  images: string[];
  specs?: AppProductSpec[];
  variants?: AppProductVariant[];
  badge?: string;
  product_code?: string;
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

function FeaturedProductCard({ p, idx }: { p: AppProduct; idx: number }) {
  const hasVariants = p.variants && Array.isArray(p.variants) && p.variants.length > 0;
  const isCombo = p.specs && Array.isArray(p.specs) && p.specs.length > 0 && 'section_title' in p.specs[0];
  
  const [activeVariantIdx, setActiveVariantIdx] = useState(0);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const activeVariant = hasVariants ? p.variants![activeVariantIdx] : null;

  const imagesList = p.images && p.images.length > 0 ? p.images : [
    p.category === 'rice-mill' ? '/products/trolly-rice-plant.webp' : p.category === 'poultry-feed' ? '/products/poultry-feed-plant.webp' : '/products/mobile-chakki-oil.webp'
  ];

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImgIdx((prev) => (prev + 1) % imagesList.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImgIdx((prev) => (prev - 1 + imagesList.length) % imagesList.length);
  };

  return (
    <ScrollReveal delay={idx * 150} className={idx === 1 ? 'md:mt-12' : ''}>
      <div className="group relative bg-white dark:bg-gray-900 rounded-[2.5rem] p-5 hover:shadow-2xl hover:shadow-green-950/10 hover:-translate-y-2 transition-all duration-500 border border-gray-150 dark:border-gray-800 flex flex-col h-full overflow-hidden">
        {/* Image Container */}
        <div className="relative h-72 rounded-[2rem] overflow-hidden bg-gray-50 dark:bg-gray-850 mb-6 flex items-center justify-center p-8 group/homeimg group-hover:scale-[1.02] transition-transform duration-500">
          <div className="absolute inset-0 bg-gradient-to-tr from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Navigation Arrows */}
          {imagesList.length > 1 && (
            <>
              <button 
                type="button"
                onClick={handlePrevImage}
                className="absolute left-3 z-30 bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 text-gray-800 dark:text-gray-200 p-2 rounded-full shadow-md backdrop-blur-sm opacity-0 group-hover/homeimg:opacity-100 transition-opacity duration-300 flex items-center justify-center"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                type="button"
                onClick={handleNextImage}
                className="absolute right-3 z-30 bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 text-gray-800 dark:text-gray-200 p-2 rounded-full shadow-md backdrop-blur-sm opacity-0 group-hover/homeimg:opacity-100 transition-opacity duration-300 flex items-center justify-center"
              >
                <ChevronRight size={16} />
              </button>
              {/* Dots indicator */}
              <div className="absolute bottom-3 z-30 flex gap-1 justify-center w-full">
                {imagesList.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${activeImgIdx === i ? 'w-4 bg-green-500' : 'w-1.5 bg-gray-300 dark:bg-gray-650'}`}
                  />
                ))}
              </div>
            </>
          )}

          <img
            src={imagesList[activeImgIdx]}
            alt={p.name}
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = p.category === 'rice-mill' ? '/products/trolly-rice-plant.webp' : p.category === 'poultry-feed' ? '/products/poultry-feed-plant.webp' : '/products/mobile-chakki-oil.webp';
            }}
            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-md"
          />
          {p.badge && (
            <div className="absolute top-4 left-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-grotesk font-black text-gray-950 dark:text-white uppercase tracking-widest border border-white/20 shadow-sm">
              {p.badge}
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="flex-grow flex flex-col px-2">
          <h3 className="font-grotesk font-black text-2xl text-gray-900 dark:text-white mb-3 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors line-clamp-1">
            {p.name}
          </h3>
          {p.product_code && (
            <div className="mb-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 dark:bg-gray-805 text-gray-600 dark:text-gray-400 border border-gray-250/60 dark:border-gray-700">
                Code: {p.product_code}
              </span>
            </div>
          )}
          <p className="font-manrope text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6 line-clamp-2">
            {p.description}
          </p>

          {/* Specifications Summary */}
          <div className="mt-auto mb-6">
            {hasVariants && activeVariant ? (
              <div className="bg-green-50/50 dark:bg-green-950/20 border border-green-500/10 rounded-2xl p-4 space-y-3">
                {/* Mini Tabs Selector */}
                <div className="flex flex-wrap gap-1 bg-white/60 dark:bg-gray-950/40 p-1 rounded-xl border border-gray-150 dark:border-gray-800">
                  {p.variants!.map((v, vIdx: number) => (
                    <button
                      key={vIdx}
                      type="button"
                      onClick={() => setActiveVariantIdx(vIdx)}
                      className={`text-[9px] font-bold px-2 py-1 rounded-lg transition-all ${
                        activeVariantIdx === vIdx
                          ? 'bg-green-600 text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-150 dark:hover:bg-gray-850'
                      }`}
                    >
                      {v.variant_name}
                    </button>
                  ))}
                </div>

                {/* Selected Variant Data */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-green-700 dark:text-green-400">Required HP</span>
                  <span className="font-black text-gray-800 dark:text-white bg-white dark:bg-gray-900 px-2 py-0.5 rounded border border-gray-150 dark:border-gray-800 shadow-sm">{activeVariant.required_hp}</span>
                </div>

                {/* Equipment List */}
                {activeVariant.equipment && activeVariant.equipment.length > 0 && (
                  <div className="space-y-1">
                    {activeVariant.equipment.slice(0, 3).map((eq: string, eqIdx: number) => {
                      const parts = eq.split(' - ');
                      const name = parts[0];
                      const details = parts.slice(1).join(' - ');
                      return (
                        <div key={eqIdx} className="flex justify-between items-center text-[10px] bg-white/40 dark:bg-gray-900/40 px-2 py-0.5 rounded border border-gray-150 dark:border-gray-800">
                          <span className="font-bold text-gray-700 dark:text-gray-300 truncate">{name}</span>
                          {details && (
                            <span className="text-[9px] text-green-600 dark:text-green-400 font-extrabold ml-2 shrink-0">{details}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : isCombo ? (
              <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/10 rounded-2xl p-4 flex flex-wrap gap-2">
                {(p.specs as ComboSpec[]).slice(0, 2).map((sec, secIdx: number) => (
                  <span key={secIdx} className="text-[10px] font-extrabold bg-amber-500/10 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full uppercase tracking-wider">
                    {sec.section_title}
                  </span>
                ))}
              </div>
            ) : p.specs && p.specs.length > 0 ? (
              <div className="bg-gray-55 dark:bg-gray-850 border border-gray-200/50 dark:border-gray-800 rounded-2xl p-3.5 grid grid-cols-2 gap-2">
                {(p.specs as StandardSpec[]).slice(0, 2).map((sp, spIdx: number) => (
                  <div key={spIdx} className="truncate">
                    <span className="text-gray-450 block text-[9px] uppercase tracking-wider font-semibold">{sp.label}</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200 text-xs">{sp.value}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-150 dark:border-gray-800">
            <Link
              to={`/products?open=${p.id}`}
              className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-1.5 hover:bg-green-600 dark:hover:bg-green-500 hover:text-white transition-all duration-300 shadow-sm"
            >
              <Eye size={14} /> Quick View
            </Link>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}

export default function HomePage() {
  const { t } = useTranslation()
  const { images, homeStoryPhotos, heroGallery } = useSiteImages()
  const [activeSlide, setActiveSlide] = useState(0)
  const [scrollY, setScrollY] = useState(0)
  const [featured, setFeatured] = useState<AppProduct[]>(FALLBACK_PRODUCTS)

  useEffect(() => {
    interface DbProductRow {
      id: string | number;
      title: string;
      description: string;
      category: string;
      images: string[] | null;
      image_url: string | null;
      specs: AppProductSpec[] | null;
      variants: AppProductVariant[] | null;
      badge: string | null;
      product_code: string | null;
    }

    async function fetchFeatured() {
      try {
        const { data, error } = await supabase.from('products').select('*').limit(3)
        if (data && !error && data.length > 0) {
          const mapped = data.map((p: DbProductRow) => ({
            id: p.id,
            name: p.title,
            description: p.description,
            category: p.category,
            images: p.images && Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image_url ? [p.image_url] : []),
            specs: p.specs || [],
            variants: p.variants || [],
            badge: p.badge || undefined,
            product_code: p.product_code || undefined,
          }))
          setFeatured(mapped)
        }
      } catch {
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
      <section className="py-32 bg-white dark:bg-gray-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 mb-4 border border-green-500/10">
                <Star className="w-3 h-3 text-secondary-gold fill-secondary-gold" />
                <span className="font-grotesk text-xs uppercase tracking-widest font-black">{t('home.products.badge')}</span>
              </div>
              <h2 className="font-grotesk font-black text-4xl md:text-5xl text-gray-900 dark:text-white leading-tight">{t('home.products.title')}</h2>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <Link to="/products" className="group hidden md:flex items-center gap-3 text-green-700 dark:text-green-400 font-grotesk font-black uppercase tracking-widest hover:text-green-600 transition-colors">
                {t('home.products.viewAll')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 xl:gap-12">
            {featured.map((p, i) => (
              <FeaturedProductCard key={p.id} p={p} idx={i} />
            ))}
          </div>
          
          <div className="mt-12 text-center md:hidden">
             <Link to="/products" className="inline-flex items-center gap-3 text-green-700 dark:text-green-400 font-grotesk font-black uppercase tracking-widest border-b-2 border-green-500 pb-1">
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
