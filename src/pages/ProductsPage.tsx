import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Search, ChevronRight, MessageCircle, X, CheckCircle, ChevronLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { products as staticProducts } from '../data/products'

type Category = 'all' | 'rice-mill' | 'poultry-feed' | 'atta-chakki'

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

type AppProduct = {
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

// Category theme config
const categoryTheme: Record<string, {
  label: string; icon: string; gradient: string;
  badgeBg: string; specBg: string; specText: string; accent: string;
}> = {
  'rice-mill': {
    label: 'Rice Mill',
    icon: '🌾',
    gradient: 'from-amber-500 to-yellow-400',
    badgeBg: 'bg-amber-500',
    specBg: 'bg-amber-50 dark:bg-amber-900/20',
    specText: 'text-amber-700 dark:text-amber-300',
    accent: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
  },
  'poultry-feed': {
    label: 'Poultry Feed Plant',
    icon: '🐔',
    gradient: 'from-blue-500 to-sky-400',
    badgeBg: 'bg-blue-500',
    specBg: 'bg-blue-50 dark:bg-blue-900/20',
    specText: 'text-blue-700 dark:text-blue-300',
    accent: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
  },
  'atta-chakki': {
    label: 'Atta Chakki & Oil Expeller',
    icon: '⚙️',
    gradient: 'from-orange-500 to-amber-400',
    badgeBg: 'bg-orange-500',
    specBg: 'bg-orange-50 dark:bg-orange-900/20',
    specText: 'text-orange-700 dark:text-orange-300',
    accent: 'group-hover:text-orange-600 dark:group-hover:text-orange-400',
  },
}

const getEquipmentValue = (variant: AppProductVariant | null | undefined, key: string) => {
  if (!variant || !variant.equipment) return '-';
  
  if (key === 'power') {
    return variant.required_hp || '-';
  }
  
  const found = variant.equipment.filter((eq: string) => {
    const lower = eq.toLowerCase();
    if (key === 'grinder') return lower.includes('grinder');
    if (key === 'mixer') return lower.includes('mixer');
    if (key === 'conveyor') return lower.includes('conveor') || lower.includes('conveyor');
    if (key === 'elevator') return lower.includes('elevetor') || lower.includes('elevator');
    if (key === 'bin') return lower.includes('bin');
    return false;
  });
  
  if (found.length === 0) return null;
  
  return found.map((eq: string) => {
    const parts = eq.split(' - ');
    return parts[1] || parts[0];
  }).join(' & ');
};

const categories = ['all', 'rice-mill', 'poultry-feed', 'atta-chakki']

const categoryLabel: Record<string, string> = {
  all: 'All Products',
  'rice-mill': '🌾 Rice Mill',
  'poultry-feed': '🐔 Poultry Feed Plant',
  'atta-chakki': '⚙️ Atta Chakki & Oil Expeller',
}

// Sub-component for Product Card to maintain local variant state
function ProductCard({ product, onOpenModal }: { product: AppProduct; onOpenModal: (p: AppProduct) => void }) {
  const theme = categoryTheme[product.category] || categoryTheme['rice-mill']
  const hasVariants = product.variants && Array.isArray(product.variants) && product.variants.length > 0;
  const isCombo = product.specs && Array.isArray(product.specs) && product.specs.length > 0 && 'section_title' in product.specs[0];

  const [activeVariantIdx, setActiveVariantIdx] = useState(0);
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  const imagesList = product.images && product.images.length > 0 ? product.images : [
    product.category === 'rice-mill' ? '/products/trolly-rice-plant.webp' : product.category === 'poultry-feed' ? '/products/poultry-feed-plant.webp' : '/products/mobile-chakki-oil.webp'
  ];

  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isHovered || imagesList.length <= 1) return;

    const interval = setInterval(() => {
      setActiveImgIdx((prev) => (prev + 1) % imagesList.length);
    }, 1800);

    return () => clearInterval(interval);
  }, [isHovered, imagesList.length]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setActiveImgIdx(0);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIdx((prev) => (prev + 1) % imagesList.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIdx((prev) => (prev - 1 + imagesList.length) % imagesList.length);
  };

  // Get active variant properties if applicable
  const activeVariant = hasVariants ? product.variants![activeVariantIdx] : null;

  // Generate Email Quote link
  const getQuoteLink = () => {
    let url = `/contact?product=${product.category}&product_name=${encodeURIComponent(product.name)}`;
    if (product.product_code) {
      url += `&code=${encodeURIComponent(product.product_code)}`;
    }
    if (activeVariant) {
      url += `&variant=${encodeURIComponent(activeVariant.variant_name)}&hp=${encodeURIComponent(activeVariant.required_hp)}`;
    }
    return url;
  }

  // Generate WhatsApp link
  const getWhatsAppLink = () => {
    let text = `Hello Krishi Vikas Udyog, I am interested in your product: *${product.name}*`;
    if (product.product_code) {
      text += ` (Model: ${product.product_code})`;
    }
    if (activeVariant) {
      text += ` (Variant: ${activeVariant.variant_name}, Required HP: ${activeVariant.required_hp})`;
    } else if (isCombo && product.specs) {
      const sectionDetails = (product.specs as ComboSpec[]).map((s) => `${s.section_title}`).join(' & ');
      text += ` (${sectionDetails} Combo)`;
    }
    return `https://wa.me/919415139838?text=${encodeURIComponent(text)}`;
  }

  return (
    <motion.div layout
      initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4 }}
      className="group bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:border-green-500/40 hover:shadow-2xl hover:shadow-black/10 transition-all duration-500 flex flex-col h-full">

      {/* Image Container */}
      <div 
        onClick={() => onOpenModal(product)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative h-64 overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-gray-800 p-6 cursor-pointer group/img transition-opacity"
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />
        
        {/* Navigation Arrows */}
        {imagesList.length > 1 && (
          <>
            <button 
              type="button"
              onClick={handlePrevImage}
              className="absolute left-3 z-30 bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 text-gray-800 dark:text-gray-200 p-2 rounded-full shadow-md backdrop-blur-sm opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              type="button"
              onClick={handleNextImage}
              className="absolute right-3 z-30 bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 text-gray-800 dark:text-gray-200 p-2 rounded-full shadow-md backdrop-blur-sm opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center"
            >
              <ChevronRight size={16} />
            </button>
            {/* Dots indicator */}
            <div className="absolute bottom-3 z-30 flex gap-1 justify-center w-full">
              {imagesList.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${activeImgIdx === i ? 'w-4 bg-green-500' : 'w-1.5 bg-gray-300 dark:bg-gray-600'}`}
                />
              ))}
            </div>
          </>
        )}

        <img
          src={imagesList[activeImgIdx]}
          alt={product.name}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = product.category === 'rice-mill' ? '/products/trolly-rice-plant.webp' : product.category === 'poultry-feed' ? '/products/poultry-feed-plant.webp' : '/products/mobile-chakki-oil.webp';
          }}
          className="relative z-10 w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-lg"
        />
        {/* Category pill */}
        <div className="absolute top-4 left-4 z-20">
          <span className={`${theme.badgeBg} text-white text-xs font-bold px-3 py-1 rounded-full shadow-md`}>
            {theme.icon} {theme.label}
          </span>
        </div>
        {/* Badge */}
        {product.badge && (
          <div className="absolute top-4 right-4 z-20">
            <span className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md text-gray-800 dark:text-gray-200 text-xs font-semibold px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">
              {product.badge}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-grow">
        <h2 
          onClick={() => onOpenModal(product)}
          className={`font-grotesk font-bold text-xl text-gray-900 dark:text-white mb-2 ${theme.accent} transition-colors line-clamp-2 cursor-pointer`}
        >
          {product.name}
        </h2>
        {product.product_code && (
          <div className="mb-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
              Code: {product.product_code}
            </span>
          </div>
        )}
        {product.description && (
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Dynamic Spec Area based on layout */}

        {/* 1. Multi-Variant Layout Cards */}
        {hasVariants && (
          <div className="mb-4 flex-grow flex flex-col justify-end">
            {/* Mini Tabs */}
            <div className="flex flex-wrap gap-1.5 mb-3 bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              {product.variants!.map((v, vIdx: number) => (
                <button
                  key={vIdx}
                  type="button"
                  onClick={() => setActiveVariantIdx(vIdx)}
                  className={`text-[10px] font-bold px-2 py-1.5 rounded-lg transition-all ${
                    activeVariantIdx === vIdx
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {v.variant_name}
                </button>
              ))}
            </div>

            {/* Active Variant Specs Preview */}
            {activeVariant && (
              <div className={`rounded-xl p-3.5 ${theme.specBg} border border-green-500/10 space-y-2.5`}>
                <div className="flex justify-between items-center border-b border-gray-200/40 dark:border-gray-700/40 pb-2">
                  <span className={`text-[10px] font-extrabold uppercase ${theme.specText} tracking-wider`}>Required Power</span>
                  <span className="text-xs font-black text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2.5 py-0.5 rounded-md border border-green-500/20">{activeVariant.required_hp}</span>
                </div>
                <div>
                  <span className={`block text-[9px] uppercase font-extrabold tracking-widest ${theme.specText} mb-2 opacity-70`}>Equipment List ({activeVariant.equipment?.length || 0}):</span>
                  <div className="space-y-1.5 max-h-[90px] overflow-y-auto pr-1">
                    {activeVariant.equipment?.slice(0, 4).map((eq: string, eqIdx: number) => {
                      const parts = eq.split(' - ');
                      const name = parts[0];
                      const details = parts.slice(1).join(' - ');
                      return (
                        <div key={eqIdx} className="flex justify-between items-center text-[10px] bg-white/40 dark:bg-gray-900/40 px-2.5 py-1 rounded-lg border border-gray-200/30 dark:border-gray-800">
                          <span className="font-bold text-gray-700 dark:text-gray-300 truncate">{name}</span>
                          {details && (
                            <span className="text-[9px] text-green-600 dark:text-green-400 font-extrabold ml-2 shrink-0">{details}</span>
                          )}
                        </div>
                      );
                    })}
                    {activeVariant.equipment?.length > 4 && (
                      <span className="block text-[10px] text-green-600 dark:text-green-400 font-bold mt-1 text-center cursor-pointer hover:underline" onClick={() => onOpenModal(product)}>
                        + {activeVariant.equipment.length - 4} more items...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. Combo/Multi-Section Layout Cards */}
        {!hasVariants && isCombo && product.specs && (
          <div className="mb-4 flex-grow flex flex-col justify-end">
            <div className={`rounded-xl p-3 ${theme.specBg} space-y-2`}>
              {(product.specs as ComboSpec[]).slice(0, 2).map((section, sIdx: number) => (
                <div key={sIdx} className={`${sIdx > 0 ? 'border-t border-gray-200/50 dark:border-gray-700/50 pt-2' : ''}`}>
                  <span className={`block text-[10px] uppercase tracking-wider font-extrabold mb-1 ${theme.specText}`}>{section.section_title}</span>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    {section.specs?.slice(0, 2).map((sp, spIdx: number) => (
                      <div key={spIdx} className="truncate">
                        <span className="text-gray-400 block text-[9px] uppercase">{sp.label}</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{sp.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {product.specs.length > 2 && (
                <span className="block text-[10px] text-green-600 dark:text-green-400 font-bold mt-1 cursor-pointer text-center" onClick={() => onOpenModal(product)}>
                  View full specifications...
                </span>
              )}
            </div>
          </div>
        )}

        {/* 3. Standard Layout Cards */}
        {!hasVariants && !isCombo && product.specs && product.specs.length > 0 && (
          <div className="mb-4 flex-grow flex flex-col justify-end">
            <div className={`rounded-xl p-3 ${theme.specBg}`}>
              <div className="grid grid-cols-2 gap-2">
                {(product.specs as StandardSpec[]).slice(0, 4).map((s) => (
                  <div key={s.label}>
                    <span className={`block text-[10px] uppercase tracking-wider font-semibold mb-0.5 ${theme.specText} opacity-70`}>{s.label}</span>
                    <span className={`block text-xs font-bold ${theme.specText} truncate`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Link to={getQuoteLink()}
            className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-green-600 dark:hover:bg-green-500 hover:text-white transition-all duration-300">
            Get Quote <ChevronRight size={16} />
          </Link>
          <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-600 hover:text-white dark:hover:bg-green-500 dark:hover:text-white transition-all duration-300"
            title="Chat on WhatsApp">
            <MessageCircle size={18} />
          </a>
        </div>
      </div>
    </motion.div>
  )
}

export default function ProductsPage() {
  const { i18n } = useTranslation()
  const isHindi = i18n.language === 'hi'
  const [searchParams, setSearchParams] = useSearchParams()
  const active = (searchParams.get('cat') as Category) || 'all'
  const [search, setSearch] = useState('')
  const [dbProducts, setDbProducts] = useState<AppProduct[]>([])
  
  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<AppProduct | null>(null)
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0)
  const [pageVariantIdx, setPageVariantIdx] = useState(0)
  const [pageActiveImgIdx, setPageActiveImgIdx] = useState(0)
  const [modalActiveImgIdx, setModalActiveImgIdx] = useState(0)

  // Lightbox and Zoom states
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 })
  const [isZoomed, setIsZoomed] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    setZoomPos({ x, y })
  }

  // Custom Atta Chakki states
  const [activeChakkiId, setActiveChakkiId] = useState<string | number | null>(null)
  const [dailyHours, setDailyHours] = useState(8)
  const [millingRate, setMillingRate] = useState(4)

  // Reset active image index when category changes
  useEffect(() => {
    setPageActiveImgIdx(0);
  }, [active]);

  interface SupabaseProduct {
    id: string | number
    title: string
    description: string
    category: string
    image_url: string
    images?: string[]
    specs?: AppProductSpec[]
    variants?: AppProductVariant[]
    badge?: string
    product_code?: string
  }

  const fetchSupabaseProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('products').select('*')
      if (data && !error) {
        const mapped = data.map((p: SupabaseProduct) => ({
          id: p.id,
          name: p.title,
          description: p.description,
          category: p.category,
          images: p.images && Array.isArray(p.images) && p.images.length > 0
            ? p.images
            : (p.image_url ? [p.image_url] : []),
          specs: p.specs || [],
          variants: p.variants || [],
          badge: p.badge || undefined,
          product_code: p.product_code || undefined,
        }))
        setDbProducts(mapped)
      }
    } catch {
      console.log('Supabase not configured yet or error fetching')
    }
  }, [])

  useEffect(() => {
    fetchSupabaseProducts()
  }, [fetchSupabaseProducts])

  const allProducts = useMemo(() => [...staticProducts, ...dbProducts], [dbProducts])

  useEffect(() => {
    const openId = searchParams.get('open');
    if (openId && allProducts.length > 0) {
      const found = allProducts.find(p => String(p.id) === String(openId));
      if (found) {
        setSelectedProduct(found);
        setSelectedVariantIdx(0);
      }
    }
  }, [searchParams, allProducts]);

  const setCategory = (cat: Category) => {
    if (cat === 'all') setSearchParams({})
    else setSearchParams({ cat })
  }

  const filtered = allProducts.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.product_code || '').toLowerCase().includes(search.toLowerCase())
    const matchesCat = active === 'all' || p.category === active
    return matchesSearch && matchesCat
  })

  // Open modal handler
  const openModal = (product: AppProduct) => {
    setSelectedProduct(product)
    setSelectedVariantIdx(0)
    setModalActiveImgIdx(0)
  }

  const themeModal = selectedProduct ? (categoryTheme[selectedProduct.category] || categoryTheme['rice-mill']) : null;
  const hasVariantsModal = selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0;
  const isComboModal = selectedProduct && selectedProduct.specs && selectedProduct.specs.length > 0 && 'section_title' in selectedProduct.specs[0];

  // Helper for Modal Contact Link
  const getModalQuoteLink = () => {
    if (!selectedProduct) return '/contact';
    let url = `/contact?product=${selectedProduct.category}&product_name=${encodeURIComponent(selectedProduct.name)}`;
    if (selectedProduct.product_code) {
      url += `&code=${encodeURIComponent(selectedProduct.product_code)}`;
    }
    if (hasVariantsModal && selectedProduct.variants?.[selectedVariantIdx]) {
      const v = selectedProduct.variants[selectedVariantIdx];
      url += `&variant=${encodeURIComponent(v.variant_name)}&hp=${encodeURIComponent(v.required_hp)}`;
    }
    return url;
  }

  // Helper for Modal WhatsApp Link
  const getModalWhatsAppLink = () => {
    if (!selectedProduct) return 'https://wa.me/919415139838';
    let text = `Hello Krishi Vikas Udyog, I am interested in your product: *${selectedProduct.name}*`;
    if (selectedProduct.product_code) {
      text += ` (Model: ${selectedProduct.product_code})`;
    }
    if (hasVariantsModal && selectedProduct.variants?.[selectedVariantIdx]) {
      const v = selectedProduct.variants[selectedVariantIdx];
      text += ` (Variant: ${v.variant_name}, Required HP: ${v.required_hp})`;
    } else if (isComboModal && selectedProduct.specs) {
      const secText = (selectedProduct.specs as ComboSpec[]).map((s) => s.section_title).join(' & ');
      text += ` (${secText} Combo)`;
    }
    return `https://wa.me/919415139838?text=${encodeURIComponent(text)}`;
  }

  return (
    <main className="bg-gray-50 dark:bg-gray-950 min-h-screen">

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-8 md:px-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 z-0" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="max-w-[1440px] mx-auto relative z-10 text-center">
          <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-block py-1 px-3 rounded-full bg-green-500/20 text-green-300 backdrop-blur-md border border-green-500/30 text-sm font-semibold tracking-wider uppercase mb-6">
            Premium Collection
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="font-grotesk font-extrabold text-5xl md:text-7xl text-white mb-6 drop-shadow-lg">
            Our Products
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="font-manrope text-xl text-green-100 max-w-2xl mx-auto">
            Discover top-tier agricultural machinery and supplies designed for maximum efficiency and yield.
          </motion.p>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-6 md:px-16 py-4 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
            {categories.map((cat, idx) => (
              <motion.button key={cat}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + idx * 0.05 }}
                onClick={() => setCategory(cat as Category)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  active === cat
                    ? 'bg-green-600 text-white shadow-md shadow-green-600/30 scale-105'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}>
                {categoryLabel[cat]}
              </motion.button>
            ))}
          </div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
            className="relative w-full md:w-80 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-green-500 transition-colors">
              <Search size={18} />
            </div>
            <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:bg-white dark:focus:bg-gray-900 focus:border-green-500 outline-none transition-all dark:text-white" />
          </motion.div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1440px] mx-auto px-6 md:px-16">
          <AnimatePresence>
            {filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="text-center py-32 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search size={40} className="text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No products found</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  {search ? `No results for "${search}".` : 'No products in this category yet. Add them via the admin panel.'}
                </p>
                <button onClick={() => { setSearch(''); setCategory('all') }}
                  className="mt-8 px-8 py-3 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors shadow-lg shadow-green-600/30">
                  Clear Filters
                </button>
              </motion.div>
            ) : active === 'poultry-feed' ? (
              (() => {
                const feedPlant = filtered.find(p => p.category === 'poultry-feed');
                if (!feedPlant) return null;
                
                // Get all image urls
                const imagesList = feedPlant.images && feedPlant.images.length > 0
                  ? feedPlant.images
                  : ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fm=webp&w=800&q=80'];

                return (
                  <div className="space-y-6 max-w-4xl mx-auto mb-16">
                    {/* Big Size Photo Gallery */}
                    <div className="rounded-3xl overflow-hidden bg-gray-50 dark:bg-gray-850 border border-gray-150 dark:border-gray-800 shadow-xl aspect-video md:h-[500px] w-full flex items-center justify-center relative group/feedimg">
                      {imagesList.length > 1 && (
                        <>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPageActiveImgIdx((prev) => (prev - 1 + imagesList.length) % imagesList.length);
                            }}
                            className="absolute left-4 z-30 bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 text-gray-800 dark:text-gray-200 p-3 rounded-full shadow-lg backdrop-blur-sm opacity-0 group-hover/feedimg:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPageActiveImgIdx((prev) => (prev + 1) % imagesList.length);
                            }}
                            className="absolute right-4 z-30 bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 text-gray-800 dark:text-gray-200 p-3 rounded-full shadow-lg backdrop-blur-sm opacity-0 group-hover/feedimg:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                          >
                            <ChevronRight size={20} />
                          </button>
                        </>
                      )}
                      <img 
                        src={imagesList[pageActiveImgIdx] || imagesList[0] || '/products/poultry-feed-plant.webp'} 
                        alt={feedPlant.name}
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/products/poultry-feed-plant.webp';
                        }}
                        className="w-full h-full object-contain p-6" 
                      />
                    </div>

                    {/* Product Info Block (Placed below the photo to prevent overlap) */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 p-6 rounded-2xl shadow-md">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          {feedPlant.badge && (
                            <span className="inline-block text-[10px] font-bold text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/20 px-2 py-0.5 rounded-full border border-green-500/20 mb-2">
                              {feedPlant.badge}
                            </span>
                          )}
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{feedPlant.name}</h3>
                        </div>
                        <button 
                          onClick={() => openModal(feedPlant)}
                          className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-full text-xs font-bold transition-all shadow-md shadow-green-600/25"
                        >
                          Quick View
                        </button>
                      </div>
                    </div>

                    {/* Thumbnail list for multiple photos */}
                    {imagesList.length > 1 && (
                      <div className="flex gap-3 justify-center overflow-x-auto py-2">
                        {imagesList.map((imgUrl: string, idx: number) => (
                          <button 
                            key={idx}
                            type="button"
                            onClick={() => setPageActiveImgIdx(idx)}
                            className={`relative w-20 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                              pageActiveImgIdx === idx ? 'border-green-500 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={imgUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()
            ) : active === 'atta-chakki' ? (
              (() => {
                const chakkiList = filtered.filter(p => p.category === 'atta-chakki');
                if (chakkiList.length === 0) {
                  return (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      No products found in this category.
                    </div>
                  );
                }

                const currentChakki = chakkiList.find(p => String(p.id) === String(activeChakkiId)) || chakkiList[0];
                const imagesList = currentChakki.images && currentChakki.images.length > 0
                  ? currentChakki.images
                  : ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fm=webp&w=800&q=80'];

                // Helper to extract combo specs
                const isComboProduct = currentChakki.specs && Array.isArray(currentChakki.specs) && currentChakki.specs.length > 0 && 'section_title' in currentChakki.specs[0];

                const getSectionSpec = (sectionTitle: string, specLabel: string) => {
                  if (!isComboProduct || !currentChakki.specs) return null;
                  const sec = (currentChakki.specs as ComboSpec[]).find((s) => s.section_title?.toUpperCase() === sectionTitle.toUpperCase());
                  if (!sec || !sec.specs) return null;
                  const spec = sec.specs.find((sp) => sp.label?.toUpperCase() === specLabel.toUpperCase());
                  return spec ? spec.value : null;
                };

                const parseAverageCapacity = (capStr: string | null, fallback: number) => {
                  if (!capStr) return fallback;
                  const clean = capStr.replace(/[^0-9.-]/g, '');
                  if (clean.includes('-')) {
                    const parts = clean.split('-');
                    const val1 = parseFloat(parts[0]);
                    const val2 = parseFloat(parts[1]);
                    if (!isNaN(val1) && !isNaN(val2)) return (val1 + val2) / 2;
                  }
                  const val = parseFloat(clean);
                  return !isNaN(val) ? val : fallback;
                };

                const wheatCap = isComboProduct 
                  ? parseAverageCapacity(getSectionSpec('ATTA CHAKKI', 'Capacity'), 195)
                  : parseAverageCapacity(currentChakki.specs ? ((currentChakki.specs as StandardSpec[]).find((s) => s.label?.toLowerCase() === 'capacity')?.value ?? null) : null, 150);
                
                const oilCap = isComboProduct
                  ? parseAverageCapacity(getSectionSpec('OIL EXPELLER', 'Capacity'), 45)
                  : 0;

                const dailyWheatOutput = dailyHours * wheatCap;
                const dailyOilOutput = dailyHours * oilCap;

                const dailyWheatRevenue = dailyWheatOutput * millingRate;
                const dailyOilRevenue = dailyOilOutput * (millingRate * 4); // Oil extraction is higher value
                const totalDailyRevenue = dailyWheatRevenue + dailyOilRevenue;
                const totalMonthlyRevenue = totalDailyRevenue * 26;

                return (
                  <div className="space-y-8 max-w-5xl mx-auto mb-16 animate-fade-in">
                    {/* Top Switcher if multiple products exist */}
                    {chakkiList.length > 1 && (
                      <div className="flex gap-2 justify-center pb-4">
                        {chakkiList.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setActiveChakkiId(p.id);
                              setPageActiveImgIdx(0);
                            }}
                            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                              String(currentChakki.id) === String(p.id)
                                ? 'bg-orange-600 text-white shadow-orange-600/25 scale-105'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-150 dark:border-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            ⚙️ {p.name}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Main Layout Card */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left: Product Images (5 Cols) */}
                      <div className="lg:col-span-5 space-y-4">
                        <div className="rounded-3xl overflow-hidden bg-gray-50 dark:bg-gray-850 border border-gray-150 dark:border-gray-800 shadow-xl aspect-square w-full flex items-center justify-center relative group/chakkiimg">
                          {imagesList.length > 1 && (
                            <>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPageActiveImgIdx((prev) => (prev - 1 + imagesList.length) % imagesList.length);
                                }}
                                className="absolute left-4 z-30 bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 text-gray-800 dark:text-gray-200 p-3 rounded-full shadow-lg backdrop-blur-sm opacity-0 group-hover/chakkiimg:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                              >
                                <ChevronLeft size={20} />
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPageActiveImgIdx((prev) => (prev + 1) % imagesList.length);
                                }}
                                className="absolute right-4 z-30 bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 text-gray-800 dark:text-gray-200 p-3 rounded-full shadow-lg backdrop-blur-sm opacity-0 group-hover/chakkiimg:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                              >
                                <ChevronRight size={20} />
                              </button>
                            </>
                          )}
                          <img 
                            src={imagesList[pageActiveImgIdx] || imagesList[0] || '/products/mobile-chakki-oil.webp'} 
                            alt={currentChakki.name}
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/products/mobile-chakki-oil.webp';
                            }}
                            className="w-full h-full object-contain p-6 group-hover:scale-105 transition-all duration-500" 
                          />
                          {currentChakki.badge && (
                            <span className="absolute top-4 left-4 bg-orange-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                              {currentChakki.badge}
                            </span>
                          )}
                        </div>

                        {/* Thumbnails */}
                        {imagesList.length > 1 && (
                          <div className="flex gap-2 overflow-x-auto py-2 justify-center">
                            {imagesList.map((imgUrl: string, idx: number) => (
                              <button 
                                key={idx}
                                type="button"
                                onClick={() => setPageActiveImgIdx(idx)}
                                className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                                  pageActiveImgIdx === idx ? 'border-orange-500 scale-105 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                                }`}
                              >
                                <img src={imgUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Specs and Action (7 Cols) */}
                      <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                              Premium Milling Solution
                            </span>
                          </div>
                          <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-3">
                            {currentChakki.name}
                          </h2>
                          {currentChakki.product_code && (
                            <div className="mb-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border border-orange-500/20">
                                Model Code: {currentChakki.product_code}
                              </span>
                            </div>
                          )}
                          {currentChakki.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                              {currentChakki.description}
                            </p>
                          )}

                          {/* Technical Specifications Grid */}
                          {isComboProduct && currentChakki.specs ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {(currentChakki.specs as ComboSpec[]).map((section, sIdx: number) => {
                                const isOil = section.section_title?.toUpperCase().includes('OIL');
                                return (
                                  <div key={sIdx} className="bg-orange-50/20 dark:bg-orange-950/5 border border-orange-100/70 dark:border-orange-900/10 p-5 rounded-2xl relative overflow-hidden">
                                    <div className="absolute -top-3 -right-3 text-4xl opacity-10 select-none">
                                      {isOil ? '🛢️' : '🌾'}
                                    </div>
                                    <h4 className="text-xs font-black text-orange-700 dark:text-orange-400 tracking-widest uppercase mb-3 flex items-center gap-1.5">
                                      {isOil ? '🛢️' : '🌾'} {section.section_title}
                                    </h4>
                                    <div className="space-y-3">
                                      {section.specs?.map((sp, spIdx: number) => (
                                        <div key={spIdx} className="flex justify-between items-center text-xs border-b border-gray-100/50 dark:border-gray-800/30 pb-2 last:border-b-0 last:pb-0">
                                          <span className="text-gray-400">{sp.label}</span>
                                          <span className="font-extrabold text-gray-800 dark:text-gray-200">{sp.value}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="bg-orange-50/20 dark:bg-orange-950/5 border border-orange-100/70 dark:border-orange-900/10 p-5 rounded-2xl grid grid-cols-2 gap-4">
                              {(currentChakki.specs as StandardSpec[])?.map((s, idx: number) => (
                                <div key={idx} className="flex flex-col">
                                  <span className="text-[10px] text-gray-400 uppercase font-bold">{s.label}</span>
                                  <span className="text-sm font-extrabold text-gray-800 dark:text-gray-200 mt-0.5">{s.value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* CTA Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100 dark:border-gray-850">
                          <Link 
                            to={`/contact?interest=${encodeURIComponent(currentChakki.name)}${currentChakki.product_code ? `&code=${encodeURIComponent(currentChakki.product_code)}` : ''}`}
                            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black uppercase tracking-wider py-3.5 rounded-xl text-center flex items-center justify-center gap-1.5 transition-all duration-300 shadow-md shadow-orange-600/20"
                          >
                            Get Quote <ChevronRight size={14} />
                          </Link>
                          <a 
                            href={`https://wa.me/919415139838?text=${encodeURIComponent(`Hello Krishi Vikas Udyog, I am interested in your product: *${currentChakki.name}*${currentChakki.product_code ? ` (Model: ${currentChakki.product_code})` : ''}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-600 hover:bg-green-700 text-white text-xs font-black uppercase tracking-wider px-6 py-3.5 rounded-xl text-center flex items-center justify-center gap-1.5 transition-all duration-300 shadow-md shadow-green-600/20"
                          >
                            <MessageCircle size={14} /> WhatsApp
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Business Estimator Calculator */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-xl mt-12 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 dark:bg-orange-500/2 rounded-bl-full pointer-events-none" />
                      <div className="flex items-center gap-2 mb-2">
                        <span className="p-1.5 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-lg text-sm">
                          💼
                        </span>
                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Commercial Business Estimator</h3>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 max-w-2xl">
                        Adjust the sliders below to estimate the daily output capacity and potential earnings when operating this machinery as a local processing business.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                        {/* Sliders (5 Cols) */}
                        <div className="md:col-span-5 space-y-6">
                          {/* Daily Hours Slider */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-600 dark:text-gray-400 font-medium">Daily Operating Hours:</span>
                              <span className="font-extrabold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded">{dailyHours} Hours</span>
                            </div>
                            <input 
                              type="range" 
                              min="1" 
                              max="12" 
                              value={dailyHours}
                              onChange={(e) => setDailyHours(parseInt(e.target.value))}
                              className="w-full h-1.5 bg-gray-150 dark:bg-gray-850 rounded-lg appearance-none cursor-pointer accent-orange-600"
                            />
                          </div>

                          {/* Milling Rate Slider */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-600 dark:text-gray-400 font-medium">Milling Charge (per KG):</span>
                              <span className="font-extrabold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded">₹{millingRate} / kg</span>
                            </div>
                            <input 
                              type="range" 
                              min="2" 
                              max="10" 
                              value={millingRate}
                              onChange={(e) => setMillingRate(parseInt(e.target.value))}
                              className="w-full h-1.5 bg-gray-150 dark:bg-gray-850 rounded-lg appearance-none cursor-pointer accent-orange-600"
                            />
                          </div>
                        </div>

                        {/* Calculated Stats (7 Cols) */}
                        <div className="md:col-span-7 grid grid-cols-2 gap-4">
                          <div className="bg-gray-50/60 dark:bg-gray-850/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <span className="text-[10px] text-gray-400 uppercase block mb-1">Daily Output (Atta)</span>
                            <span className="text-lg font-black text-gray-800 dark:text-gray-200">
                              {dailyWheatOutput.toFixed(0)} <span className="text-xs font-normal">KG</span>
                            </span>
                          </div>
                          {oilCap > 0 && (
                            <div className="bg-gray-50/60 dark:bg-gray-850/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                              <span className="text-[10px] text-gray-400 uppercase block mb-1">Daily Output (Oil)</span>
                              <span className="text-lg font-black text-gray-800 dark:text-gray-200">
                                {dailyOilOutput.toFixed(0)} <span className="text-xs font-normal">KG</span>
                              </span>
                            </div>
                          )}
                          <div className="bg-gray-50/60 dark:bg-gray-850/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 col-span-1">
                            <span className="text-[10px] text-gray-400 uppercase block mb-1">Est. Daily Earnings</span>
                            <span className="text-lg font-black text-orange-600 dark:text-orange-400">
                              ₹{totalDailyRevenue.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="bg-orange-600/5 dark:bg-orange-600/2 p-4 rounded-2xl border border-orange-500/10 col-span-1">
                            <span className="text-[10px] text-orange-600/80 dark:text-orange-400/80 uppercase block mb-1">Est. Monthly Income</span>
                            <span className="text-xl font-black text-green-600 dark:text-green-400">
                              ₹{totalMonthlyRevenue.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 text-[10px] text-red-800 bg-gray-50 dark:bg-gray-850 p-3 rounded-xl border border-gray-100 dark:border-gray-800/80">
                        * Calculations are estimates based on average operational metrics ({wheatCap.toFixed(0)} KG/Hr milling, {oilCap > 0 ? `${oilCap.toFixed(0)} KG/Hr oil extraction, ` : ''}26 working days/month). Actual earnings may vary depending on local market rates, electricity tariffs, and crop quality.
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} onOpenModal={openModal} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Option C: Direct Page-Level Side-by-Side Comparison & Flowchart for Poultry Feed Plant */}
          {active === 'poultry-feed' && filtered.length > 0 && (
            (() => {
              const feedPlant = filtered.find(p => p.category === 'poultry-feed');
              if (!feedPlant || !feedPlant.variants || feedPlant.variants.length === 0) return null;
              
              return (
                <div className="mt-20 space-y-12 border-t border-gray-150 dark:border-gray-800/65 pt-16 animate-fade-in max-w-6xl mx-auto">
                  
                  {/* Section Title */}
                  <div className="text-center space-y-4 mb-8">
                    <h3 className="font-grotesk font-black text-3xl text-gray-900 dark:text-white leading-tight">
                      Poultry Mash Feed Plant - Complete Comparison Matrix
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                      Compare capacity, power requirements, and machinery specifications side-by-side to choose the perfect plant layout for your farm.
                    </p>
                  </div>

                  {/* Flowchart */}
                  <div className="space-y-4 bg-white dark:bg-gray-900 p-6 md:p-8 rounded-3xl border border-gray-150 dark:border-gray-800/60 shadow-sm">
                    <h4 className="font-grotesk font-black text-sm uppercase text-green-700 dark:text-green-400 tracking-wider">
                      {isHindi ? 'प्लांट प्रोसेस और फ्लोचार्ट (फीड निर्माण चक्र)' : 'Plant Process & Flowchart'} — {feedPlant.variants[pageVariantIdx].variant_name}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {/* Stage 1: Grinder */}
                      <div className={`p-4 rounded-3xl border text-center transition-all ${
                        getEquipmentValue(feedPlant.variants[pageVariantIdx], 'grinder')
                          ? 'bg-gray-50/50 dark:bg-gray-850/40 border-green-500/20 shadow-sm'
                          : 'bg-gray-50/30 dark:bg-gray-950/10 border-gray-100 dark:border-gray-900 opacity-50'
                      }`}>
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 flex items-center justify-center mx-auto mb-2 text-xs font-black">1</div>
                        <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-wider block">Intake & Grinding</span>
                        <span className="text-[9px] text-gray-400 font-bold block mt-0.5">Feed Grinder</span>
                        <div className="text-[10px] text-green-700 dark:text-green-300 font-black mt-2 bg-white dark:bg-gray-900 px-2 py-1 rounded-xl border border-gray-100 dark:border-gray-800 truncate">
                          {getEquipmentValue(feedPlant.variants[pageVariantIdx], 'grinder') || 'Not Included'}
                        </div>
                      </div>

                      {/* Stage 2: Conveyor */}
                      <div className={`p-4 rounded-3xl border text-center transition-all ${
                        getEquipmentValue(feedPlant.variants[pageVariantIdx], 'conveyor')
                          ? 'bg-gray-50/50 dark:bg-gray-850/40 border-green-500/20 shadow-sm'
                          : 'bg-gray-50/30 dark:bg-gray-950/10 border-gray-100 dark:border-gray-900 opacity-50'
                      }`}>
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 flex items-center justify-center mx-auto mb-2 text-xs font-black">2</div>
                        <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-wider block">Conveying</span>
                        <span className="text-[9px] text-gray-400 font-bold block mt-0.5">Screw Conveyor</span>
                        <div className="text-[10px] text-green-700 dark:text-green-300 font-black mt-2 bg-white dark:bg-gray-900 px-2 py-1 rounded-xl border border-gray-100 dark:border-gray-800 truncate">
                          {getEquipmentValue(feedPlant.variants[pageVariantIdx], 'conveyor') || 'Not Included'}
                        </div>
                      </div>

                      {/* Stage 3: Mixer */}
                      <div className={`p-4 rounded-3xl border text-center transition-all ${
                        getEquipmentValue(feedPlant.variants[pageVariantIdx], 'mixer')
                          ? 'bg-gray-50/50 dark:bg-gray-850/40 border-green-500/20 shadow-sm'
                          : 'bg-gray-50/30 dark:bg-gray-950/10 border-gray-100 dark:border-gray-900 opacity-50'
                      }`}>
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 flex items-center justify-center mx-auto mb-2 text-xs font-black">3</div>
                        <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-wider block">Mixing & Blending</span>
                        <span className="text-[9px] text-gray-400 font-bold block mt-0.5">Feed Mixer</span>
                        <div className="text-[10px] text-green-700 dark:text-green-300 font-black mt-2 bg-white dark:bg-gray-900 px-2 py-1 rounded-xl border border-gray-100 dark:border-gray-800 truncate">
                          {getEquipmentValue(feedPlant.variants[pageVariantIdx], 'mixer') || 'Not Included'}
                        </div>
                      </div>

                      {/* Stage 4: Elevator */}
                      <div className={`p-4 rounded-3xl border text-center transition-all ${
                        getEquipmentValue(feedPlant.variants[pageVariantIdx], 'elevator')
                          ? 'bg-gray-50/50 dark:bg-gray-850/40 border-green-500/20 shadow-sm'
                          : 'bg-gray-50/30 dark:bg-gray-950/10 border-gray-100 dark:border-gray-900 opacity-40 border-dashed'
                      }`}>
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 flex items-center justify-center mx-auto mb-2 text-xs font-black">4</div>
                        <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-wider block">Elevating</span>
                        <span className="text-[9px] text-gray-400 font-bold block mt-0.5">Bucket Elevator</span>
                        <div className="text-[10px] text-green-700 dark:text-green-300 font-black mt-2 bg-white dark:bg-gray-900 px-2 py-1 rounded-xl border border-gray-100 dark:border-gray-800 truncate">
                          {getEquipmentValue(feedPlant.variants[pageVariantIdx], 'elevator') ? `${getEquipmentValue(feedPlant.variants[pageVariantIdx], 'elevator')} Units` : 'Manual / Skip Lift'}
                        </div>
                      </div>

                      {/* Stage 5: Silo / Bin */}
                      <div className={`p-4 rounded-3xl border text-center transition-all ${
                        getEquipmentValue(feedPlant.variants[pageVariantIdx], 'bin')
                          ? 'bg-gray-50/50 dark:bg-gray-850/40 border-green-500/20 shadow-sm'
                          : 'bg-gray-50/30 dark:bg-gray-950/10 border-gray-100 dark:border-gray-900 opacity-40 border-dashed'
                      }`}>
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 flex items-center justify-center mx-auto mb-2 text-xs font-black">5</div>
                        <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-wider block">Storage / Silo</span>
                        <span className="text-[9px] text-gray-400 font-bold block mt-0.5">Batch Bin</span>
                        <div className="text-[10px] text-green-700 dark:text-green-300 font-black mt-2 bg-white dark:bg-gray-900 px-2 py-1 rounded-xl border border-gray-100 dark:border-gray-800 truncate">
                          {getEquipmentValue(feedPlant.variants[pageVariantIdx], 'bin') || 'Direct Bagging'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comparison Matrix */}
                  <div className="space-y-4">
                    <h4 className="font-grotesk font-black text-sm uppercase text-green-700 dark:text-green-400 tracking-wider">
                      {isHindi ? 'तकनीकी विनिर्देश मैट्रिक्स (तुलना तालिका)' : 'Technical Specification Matrix'}
                    </h4>
                    <div className="overflow-x-auto rounded-3xl border border-gray-200 dark:border-gray-805 bg-white dark:bg-gray-900 shadow-lg">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-850 text-gray-400 font-extrabold uppercase tracking-wider border-b border-gray-250/60 dark:border-gray-800">
                            <th className="p-5 text-sm">Plant Feature</th>
                            {feedPlant.variants.map((v, idx: number) => (
                              <th 
                                key={idx} 
                                className={`p-5 text-center cursor-pointer transition-all ${
                                  pageVariantIdx === idx 
                                    ? 'bg-green-500/15 text-green-800 dark:text-green-400 border-x border-green-500/20' 
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/30'
                                  }`}
                                onClick={() => setPageVariantIdx(idx)}
                              >
                                <div className="font-black text-sm">{v.variant_name}</div>
                                <div className="text-[9px] font-bold text-gray-400 lowercase tracking-normal mt-0.5">click to select & filter process</div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-850 font-medium text-gray-700 dark:text-gray-300">
                          {/* Required Power Row */}
                          <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                            <td className="p-5 font-black text-gray-900 dark:text-white text-[13px]">Required Power (HP)</td>
                            {feedPlant.variants.map((v, idx: number) => (
                              <td 
                                key={idx} 
                                className={`p-5 text-center font-black text-sm ${
                                  pageVariantIdx === idx ? 'bg-green-500/5 dark:bg-green-950/10 text-green-700 dark:text-green-400 border-x border-green-500/20' : ''
                                }`}
                              >
                                <span className="bg-green-100/60 dark:bg-green-950/40 px-3 py-1.5 rounded-lg border border-green-500/20">
                                  {v.required_hp}
                                </span>
                              </td>
                            ))}
                          </tr>

                          {/* Grinder Row */}
                          <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                            <td className="p-5 font-bold text-gray-900 dark:text-white">1. Feed Grinder</td>
                            {feedPlant.variants.map((v, idx: number) => {
                              const val = getEquipmentValue(v, 'grinder');
                              return (
                                <td 
                                  key={idx} 
                                  className={`p-5 text-center text-[12px] ${
                                    pageVariantIdx === idx ? 'bg-green-500/5 dark:bg-green-950/10 border-x border-green-500/20 font-black text-gray-900 dark:text-white' : ''
                                  }`}
                                >
                                  {val || <span className="text-gray-350 dark:text-gray-600 font-normal">Not Included</span>}
                                </td>
                              );
                            })}
                          </tr>

                          {/* Conveyors Row */}
                          <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                            <td className="p-5 font-bold text-gray-900 dark:text-white">2. Screw Conveyor(s)</td>
                            {feedPlant.variants.map((v, idx: number) => {
                              const val = getEquipmentValue(v, 'conveyor');
                              return (
                                <td 
                                  key={idx} 
                                  className={`p-5 text-center text-[12px] ${
                                    pageVariantIdx === idx ? 'bg-green-500/5 dark:bg-green-950/10 border-x border-green-500/20 font-black text-gray-900 dark:text-white' : ''
                                  }`}
                                >
                                  {val || <span className="text-gray-350 dark:text-gray-600 font-normal">Not Included</span>}
                                </td>
                              );
                            })}
                          </tr>

                          {/* Mixer Row */}
                          <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                            <td className="p-5 font-bold text-gray-900 dark:text-white">3. Feed Mixer</td>
                            {feedPlant.variants.map((v, idx: number) => {
                              const val = getEquipmentValue(v, 'mixer');
                              return (
                                <td 
                                  key={idx} 
                                  className={`p-5 text-center text-[12px] ${
                                    pageVariantIdx === idx ? 'bg-green-500/5 dark:bg-green-950/10 border-x border-green-500/20 font-black text-gray-900 dark:text-white' : ''
                                  }`}
                                >
                                  {val || <span className="text-gray-350 dark:text-gray-600 font-normal">Not Included</span>}
                                </td>
                              );
                            })}
                          </tr>

                          {/* Elevator Row */}
                          <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                            <td className="p-5 font-bold text-gray-900 dark:text-white">4. Bucket Elevator</td>
                            {feedPlant.variants.map((v, idx: number) => {
                              const val = getEquipmentValue(v, 'elevator');
                              return (
                                <td 
                                  key={idx} 
                                  className={`p-5 text-center text-[12px] ${
                                    pageVariantIdx === idx ? 'bg-green-500/5 dark:bg-green-950/10 border-x border-green-500/20 font-black text-gray-900 dark:text-white' : ''
                                  }`}
                                >
                                  {val ? `${val} Units` : <span className="text-gray-400 dark:text-gray-650 italic font-normal">Optional (Manual lift)</span>}
                                </td>
                              );
                            })}
                          </tr>

                          {/* Bin Row */}
                          <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                            <td className="p-5 font-bold text-gray-900 dark:text-white">5. Batch Bin</td>
                            {feedPlant.variants.map((v, idx: number) => {
                              const val = getEquipmentValue(v, 'bin');
                              return (
                                <td 
                                  key={idx} 
                                  className={`p-5 text-center text-[12px] ${
                                    pageVariantIdx === idx ? 'bg-green-500/5 dark:bg-green-950/10 border-x border-green-500/20 font-black text-gray-900 dark:text-white' : ''
                                  }`}
                                >
                                  {val || <span className="text-gray-400 dark:text-gray-650 italic font-normal">Direct Bagging</span>}
                                </td>
                              );
                            })}
                          </tr>

                          {/* Action Quote Row */}
                          <tr className="bg-gray-50/50 dark:bg-gray-855/30">
                            <td className="p-5 font-bold text-gray-900 dark:text-white text-sm">Direct Action</td>
                            {feedPlant.variants.map((v, idx: number) => {
                              const subject = encodeURIComponent(`Inquiry for Poultry Mash Feed Plant - ${v.variant_name}`);
                              const body = encodeURIComponent(`Hello Krishi Vikas Udyog,\n\nI am interested in your Poultry Mash Feed Plant (${v.variant_name}) requiring ${v.required_hp}.\n\nPlease share price quotations and site layout instructions.\n\nThank you!`);
                              const quoteLink = `/contact?subject=${subject}&message=${body}&product=${encodeURIComponent(feedPlant.name)}&variant=${encodeURIComponent(v.variant_name)}&power=${encodeURIComponent(v.required_hp)}&category=poultry-feed${feedPlant.product_code ? `&code=${encodeURIComponent(feedPlant.product_code)}` : ''}`;
                              
                              const waText = encodeURIComponent(`Hello Krishi Vikas Udyog, I am interested in your Poultry Mash Feed Plant (${v.variant_name}, Required HP: ${v.required_hp})${feedPlant.product_code ? ` (Model: ${feedPlant.product_code})` : ''}. Please send details.`);
                              const waLink = `https://wa.me/919415139838?text=${waText}`;
                              
                              return (
                                <td 
                                  key={idx} 
                                  className={`p-4 ${
                                    pageVariantIdx === idx ? 'bg-green-500/5 dark:bg-green-950/10 border-x border-green-500/20' : ''
                                  }`}
                                >
                                  <div className="flex flex-col gap-2 max-w-[160px] mx-auto">
                                    <Link 
                                      to={quoteLink}
                                      className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-center hover:bg-green-600 dark:hover:bg-green-500 hover:text-white transition-all shadow-sm"
                                    >
                                      Email Quote
                                    </Link>
                                    <a 
                                      href={waLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-full bg-green-600 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-center flex items-center justify-center gap-1 hover:bg-green-700 transition-all shadow-sm"
                                    >
                                      <MessageCircle size={10} /> WhatsApp
                                    </a>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </section>

      {/* Dynamic Quick View Modal */}
      <AnimatePresence>
        {selectedProduct && themeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden z-10 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-850">
                <span className={`${themeModal.badgeBg} text-white text-xs font-black px-3 py-1 rounded-full shadow-sm flex items-center gap-1`}>
                  {themeModal.icon} {themeModal.label}
                </span>
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 md:p-8 overflow-y-auto flex-grow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Image Gallery */}
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-850 rounded-2xl p-6 border border-gray-100 dark:border-gray-800/80 min-h-[300px] md:h-[350px] overflow-hidden">
                      {(() => {
                        const modalImages = selectedProduct.images && selectedProduct.images.length > 0
                          ? selectedProduct.images
                          : ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fm=webp&w=800&q=80'];

                        return (
                          <div className="w-full h-full flex flex-col justify-between relative group/modalimg">
                            <div 
                              onMouseMove={handleMouseMove}
                              onMouseEnter={() => setIsZoomed(true)}
                              onMouseLeave={() => setIsZoomed(false)}
                              onClick={() => {
                                setLightboxImages(modalImages);
                                setLightboxIndex(modalActiveImgIdx);
                              }}
                              className="w-full h-full flex items-center justify-center overflow-hidden relative cursor-zoom-in"
                            >
                              {modalImages.length > 1 && (
                                <>
                                  <button 
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setModalActiveImgIdx((prev) => (prev - 1 + modalImages.length) % modalImages.length);
                                    }}
                                    className="absolute left-2 z-30 bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 text-gray-800 dark:text-gray-200 p-2 rounded-full shadow-md backdrop-blur-sm opacity-0 group-hover/modalimg:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                                  >
                                    <ChevronLeft size={16} />
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setModalActiveImgIdx((prev) => (prev + 1) % modalImages.length);
                                    }}
                                    className="absolute right-2 z-30 bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 text-gray-800 dark:text-gray-200 p-2 rounded-full shadow-md backdrop-blur-sm opacity-0 group-hover/modalimg:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                                  >
                                    <ChevronRight size={16} />
                                  </button>
                                </>
                              )}
                              <img 
                                src={modalImages[modalActiveImgIdx] || modalImages[0] || (selectedProduct.category === 'rice-mill' ? '/products/trolly-rice-plant.webp' : selectedProduct.category === 'poultry-feed' ? '/products/poultry-feed-plant.webp' : '/products/mobile-chakki-oil.webp')} 
                                alt={selectedProduct.name}
                                loading="lazy"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = selectedProduct.category === 'rice-mill' ? '/products/trolly-rice-plant.webp' : selectedProduct.category === 'poultry-feed' ? '/products/poultry-feed-plant.webp' : '/products/mobile-chakki-oil.webp';
                                }}
                                className="w-full h-full object-contain max-h-[250px] drop-shadow-xl transition-transform duration-200"
                                style={isZoomed ? {
                                  transform: 'scale(1.8)',
                                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`
                                } : undefined}
                              />
                            </div>
                            {/* Thumbnails */}
                            {modalImages.length > 1 && (
                              <div className="flex gap-2 overflow-x-auto py-2 justify-center mt-4 border-t border-gray-100 dark:border-gray-800">
                                {modalImages.map((imgUrl: string, idx: number) => (
                                  <button 
                                    key={idx}
                                    type="button"
                                    onClick={() => setModalActiveImgIdx(idx)}
                                    className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                                      modalActiveImgIdx === idx ? 'border-green-500 scale-105 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                                    }`}
                                  >
                                    <img src={imgUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Right Column: Spec / Variant Details */}
                  <div className="flex flex-col">
                    <h2 className="font-grotesk font-black text-2xl md:text-3xl text-gray-900 dark:text-white mb-2 leading-tight">
                      {selectedProduct.name}
                    </h2>
                    {(selectedProduct.product_code || selectedProduct.badge) && (
                      <div className="flex flex-wrap gap-2 items-center mb-4">
                        {selectedProduct.product_code && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-100 dark:bg-gray-850 text-gray-600 dark:text-gray-400 border border-gray-250/60 dark:border-gray-700">
                            Model: {selectedProduct.product_code}
                          </span>
                        )}
                        {selectedProduct.badge && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-500/20">
                            {selectedProduct.badge}
                          </span>
                        )}
                      </div>
                    )}

                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6 whitespace-pre-line">
                      {selectedProduct.description}
                    </p>

                    {/* LAYOUT RENDERING IN MODAL */}

                    {/* Mode A: Tabbed Variants Modal */}
                    {hasVariantsModal && (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2 border-b border-gray-100 dark:border-gray-850 pb-2">
                          {selectedProduct.variants!.map((v, vIdx: number) => (
                            <button
                              key={vIdx}
                              type="button"
                              onClick={() => setSelectedVariantIdx(vIdx)}
                              className={`text-xs font-bold px-3 py-2 rounded-xl transition-all ${
                                selectedVariantIdx === vIdx
                                  ? 'bg-green-600 text-white shadow-md'
                                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              {v.variant_name}
                            </button>
                          ))}
                        </div>

                        {selectedProduct.variants?.[selectedVariantIdx] && (
                          <div className="bg-gray-50 dark:bg-gray-850 border border-gray-200/50 dark:border-gray-800 rounded-2xl p-5 space-y-4 animate-fade-in">
                            <div className="flex justify-between items-center border-b border-gray-200/60 dark:border-gray-700/60 pb-3">
                              <span className="text-xs uppercase font-extrabold tracking-wider text-gray-400 block">Capacity Range</span>
                              <span className="text-sm font-black text-gray-800 dark:text-white">{selectedProduct.variants[selectedVariantIdx].variant_name}</span>
                            </div>

                            <div className="flex justify-between items-center border-b border-gray-200/60 dark:border-gray-700/60 pb-3">
                              <span className="text-xs uppercase font-extrabold tracking-wider text-gray-400 block">Required Power</span>
                              <span className="text-xs font-black text-green-700 dark:text-green-300 bg-green-100/50 dark:bg-green-950/40 px-3 py-1 rounded-lg border border-green-500/20">{selectedProduct.variants[selectedVariantIdx].required_hp}</span>
                            </div>

                            <div>
                              <span className="text-xs uppercase font-extrabold tracking-wider text-gray-400 block mb-3">Included Equipment / Components</span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                {selectedProduct.variants[selectedVariantIdx].equipment?.map((eq: string, eqIdx: number) => {
                                  const parts = eq.split(' - ');
                                  const name = parts[0];
                                  const details = parts.slice(1).join(' - ');
                                  return (
                                    <div key={eqIdx} className="flex items-center justify-between gap-3 text-xs bg-white dark:bg-gray-900 px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:border-green-500/20 transition-all">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                                        <span className="font-bold text-gray-850 dark:text-gray-100">{name}</span>
                                      </div>
                                      {details && (
                                        <span className="text-[10px] font-black text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/20 px-2.5 py-0.5 rounded border border-green-500/10 shrink-0">
                                          {details}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mode B: Combo/Multi-Section Modal */}
                    {!hasVariantsModal && isComboModal && selectedProduct.specs && (
                      <div className="space-y-6">
                        {(selectedProduct.specs as ComboSpec[]).map((section, sIdx: number) => (
                          <div key={sIdx} className="bg-gray-50 dark:bg-gray-850 border border-gray-200/50 dark:border-gray-800 rounded-2xl p-5">
                            <h4 className="font-grotesk font-black text-sm uppercase text-green-700 dark:text-green-400 tracking-wider mb-3 border-b border-gray-200 dark:border-gray-700/60 pb-2">
                              {section.section_title}
                            </h4>
                            <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                              {section.specs?.map((sp, spIdx: number) => (
                                <div key={spIdx} className="flex justify-between items-center py-2 text-xs">
                                  <span className="text-gray-400 font-medium">{sp.label}</span>
                                  <span className="font-bold text-gray-800 dark:text-gray-100">{sp.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Mode C: Standard Specs Modal */}
                    {!hasVariantsModal && !isComboModal && selectedProduct.specs && (
                      <div className="bg-gray-50 dark:bg-gray-850 border border-gray-200/50 dark:border-gray-800 rounded-2xl p-5">
                        <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                          {(selectedProduct.specs as StandardSpec[]).map((s, sIdx: number) => (
                            <div key={sIdx} className="flex justify-between items-center py-2.5 text-xs">
                              <span className="text-gray-400 font-medium">{s.label}</span>
                              <span className="font-bold text-gray-800 dark:text-gray-100">{s.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Option C: Dynamic Comparison Table & Process Flowchart for Feed Plant Category */}
                {selectedProduct.category === 'poultry-feed' && (
                  <div className="space-y-8 pt-8 border-t border-gray-150 dark:border-gray-800/60">
                    {/* Flowchart */}
                    <div className="space-y-4">
                      <h4 className="font-grotesk font-black text-sm uppercase text-green-700 dark:text-green-400 tracking-wider">
                        {isHindi ? 'प्लांट प्रोसेस और फ्लोचार्ट (फीड निर्माण चक्र)' : 'Plant Process & Flowchart'}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {/* Stage 1: Grinder */}
                        <div className={`p-4 rounded-3xl border text-center transition-all ${
                          getEquipmentValue(selectedProduct.variants?.[selectedVariantIdx], 'grinder')
                            ? 'bg-gray-50/50 dark:bg-gray-850/40 border-green-500/20 shadow-sm'
                            : 'bg-gray-50/30 dark:bg-gray-950/10 border-gray-100 dark:border-gray-900 opacity-50'
                        }`}>
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 flex items-center justify-center mx-auto mb-2 text-xs font-black">1</div>
                          <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-wider block">Intake & Grinding</span>
                          <span className="text-[9px] text-gray-400 font-bold block mt-0.5">Feed Grinder</span>
                          <div className="text-[10px] text-green-700 dark:text-green-300 font-black mt-2 bg-white dark:bg-gray-900 px-2 py-1 rounded-xl border border-gray-100 dark:border-gray-800 truncate">
                            {getEquipmentValue(selectedProduct.variants?.[selectedVariantIdx], 'grinder') || 'Not Included'}
                          </div>
                        </div>

                        {/* Stage 2: Conveyor */}
                        <div className={`p-4 rounded-3xl border text-center transition-all ${
                          getEquipmentValue(selectedProduct.variants?.[selectedVariantIdx], 'conveyor')
                            ? 'bg-gray-50/50 dark:bg-gray-850/40 border-green-500/20 shadow-sm'
                            : 'bg-gray-50/30 dark:bg-gray-950/10 border-gray-100 dark:border-gray-900 opacity-50'
                        }`}>
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 flex items-center justify-center mx-auto mb-2 text-xs font-black">2</div>
                          <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-wider block">Conveying</span>
                          <span className="text-[9px] text-gray-400 font-bold block mt-0.5">Screw Conveyor</span>
                          <div className="text-[10px] text-green-700 dark:text-green-300 font-black mt-2 bg-white dark:bg-gray-900 px-2 py-1 rounded-xl border border-gray-100 dark:border-gray-800 truncate">
                            {getEquipmentValue(selectedProduct.variants?.[selectedVariantIdx], 'conveyor') || 'Not Included'}
                          </div>
                        </div>

                        {/* Stage 3: Mixer */}
                        <div className={`p-4 rounded-3xl border text-center transition-all ${
                          getEquipmentValue(selectedProduct.variants?.[selectedVariantIdx], 'mixer')
                            ? 'bg-gray-50/50 dark:bg-gray-850/40 border-green-500/20 shadow-sm'
                            : 'bg-gray-50/30 dark:bg-gray-950/10 border-gray-100 dark:border-gray-900 opacity-50'
                        }`}>
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 flex items-center justify-center mx-auto mb-2 text-xs font-black">3</div>
                          <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-wider block">Mixing & Blending</span>
                          <span className="text-[9px] text-gray-400 font-bold block mt-0.5">Feed Mixer</span>
                          <div className="text-[10px] text-green-700 dark:text-green-300 font-black mt-2 bg-white dark:bg-gray-900 px-2 py-1 rounded-xl border border-gray-100 dark:border-gray-800 truncate">
                            {getEquipmentValue(selectedProduct.variants?.[selectedVariantIdx], 'mixer') || 'Not Included'}
                          </div>
                        </div>

                        {/* Stage 4: Elevator */}
                        <div className={`p-4 rounded-3xl border text-center transition-all ${
                          getEquipmentValue(selectedProduct.variants?.[selectedVariantIdx], 'elevator')
                            ? 'bg-gray-50/50 dark:bg-gray-850/40 border-green-500/20 shadow-sm'
                            : 'bg-gray-50/30 dark:bg-gray-950/10 border-gray-100 dark:border-gray-900 opacity-40 border-dashed'
                        }`}>
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 flex items-center justify-center mx-auto mb-2 text-xs font-black">4</div>
                          <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-wider block">Elevating</span>
                          <span className="text-[9px] text-gray-400 font-bold block mt-0.5">Bucket Elevator</span>
                          <div className="text-[10px] text-green-700 dark:text-green-300 font-black mt-2 bg-white dark:bg-gray-900 px-2 py-1 rounded-xl border border-gray-100 dark:border-gray-800 truncate">
                            {getEquipmentValue(selectedProduct.variants?.[selectedVariantIdx], 'elevator') ? `${getEquipmentValue(selectedProduct.variants?.[selectedVariantIdx], 'elevator')} Units` : 'Manual / Skip Lift'}
                          </div>
                        </div>

                        {/* Stage 5: Silo / Bin */}
                        <div className={`p-4 rounded-3xl border text-center transition-all ${
                          getEquipmentValue(selectedProduct.variants?.[selectedVariantIdx], 'bin')
                            ? 'bg-gray-50/50 dark:bg-gray-850/40 border-green-500/20 shadow-sm'
                            : 'bg-gray-50/30 dark:bg-gray-950/10 border-gray-100 dark:border-gray-900 opacity-40 border-dashed'
                        }`}>
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 flex items-center justify-center mx-auto mb-2 text-xs font-black">5</div>
                          <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-wider block">Storage / Silo</span>
                          <span className="text-[9px] text-gray-400 font-bold block mt-0.5">Batch Bin</span>
                          <div className="text-[10px] text-green-700 dark:text-green-300 font-black mt-2 bg-white dark:bg-gray-900 px-2 py-1 rounded-xl border border-gray-100 dark:border-gray-800 truncate">
                            {getEquipmentValue(selectedProduct.variants?.[selectedVariantIdx], 'bin') || 'Direct Bagging'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Comparison Matrix */}
                    <div className="space-y-4">
                      <h4 className="font-grotesk font-black text-sm uppercase text-green-700 dark:text-green-400 tracking-wider">
                        {isHindi ? 'तकनीकी तुलना तालिका (विस्तृत तुलना तालिका)' : 'Technical Comparison Matrix'}
                      </h4>
                      <div className="overflow-x-auto rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-gray-50 dark:bg-gray-850 text-gray-400 font-extrabold uppercase tracking-wider border-b border-gray-250/60 dark:border-gray-800">
                              <th className="p-4">Plant Feature</th>
                              {selectedProduct.variants!.map((v, idx: number) => (
                                <th 
                                  key={idx} 
                                  className={`p-4 text-center cursor-pointer transition-all ${
                                    selectedVariantIdx === idx 
                                      ? 'bg-green-500/10 text-green-700 dark:text-green-450 border-x border-green-500/20' 
                                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/30'
                                  }`}
                                  onClick={() => setSelectedVariantIdx(idx)}
                                >
                                  <div className="font-black text-[11.5px]">{v.variant_name}</div>
                                  <div className="text-[9px] font-bold text-gray-400 lowercase">click to select</div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-800 font-medium">
                            {/* Required Power Row */}
                            <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                              <td className="p-4 font-bold text-gray-900 dark:text-white">Required Power (HP)</td>
                              {selectedProduct.variants!.map((v, idx: number) => (
                                <td 
                                  key={idx} 
                                  className={`p-4 text-center font-black ${
                                    selectedVariantIdx === idx ? 'bg-green-500/5 dark:bg-green-950/10 text-green-700 dark:text-green-400 border-x border-green-500/20' : 'text-gray-700 dark:text-gray-300'
                                  }`}
                                >
                                  <span className="bg-green-100/50 dark:bg-green-950/40 px-2.5 py-1 rounded-lg border border-green-500/10">
                                    {v.required_hp}
                                  </span>
                                </td>
                              ))}
                            </tr>

                            {/* Grinder Row */}
                            <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                              <td className="p-4 font-bold text-gray-900 dark:text-white">1. Feed Grinder</td>
                              {selectedProduct.variants!.map((v, idx: number) => {
                                const val = getEquipmentValue(v, 'grinder');
                                return (
                                  <td 
                                    key={idx} 
                                    className={`p-4 text-center ${
                                      selectedVariantIdx === idx ? 'bg-green-500/5 dark:bg-green-950/10 border-x border-green-500/20 font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                                    }`}
                                  >
                                    {val || <span className="text-gray-350 dark:text-gray-600 font-normal">Not Included</span>}
                                  </td>
                                );
                              })}
                            </tr>

                            {/* Conveyors Row */}
                            <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                              <td className="p-4 font-bold text-gray-900 dark:text-white">2. Screw Conveyor(s)</td>
                              {selectedProduct.variants!.map((v, idx: number) => {
                                const val = getEquipmentValue(v, 'conveyor');
                                return (
                                  <td 
                                    key={idx} 
                                    className={`p-4 text-center ${
                                      selectedVariantIdx === idx ? 'bg-green-500/5 dark:bg-green-950/10 border-x border-green-500/20 font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                                    }`}
                                  >
                                    {val || <span className="text-gray-350 dark:text-gray-600 font-normal">Not Included</span>}
                                  </td>
                                );
                              })}
                            </tr>

                            {/* Mixer Row */}
                            <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                              <td className="p-4 font-bold text-gray-900 dark:text-white">3. Feed Mixer</td>
                              {selectedProduct.variants!.map((v, idx: number) => {
                                const val = getEquipmentValue(v, 'mixer');
                                return (
                                  <td 
                                    key={idx} 
                                    className={`p-4 text-center ${
                                      selectedVariantIdx === idx ? 'bg-green-500/5 dark:bg-green-950/10 border-x border-green-500/20 font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                                    }`}
                                  >
                                    {val || <span className="text-gray-350 dark:text-gray-600 font-normal">Not Included</span>}
                                  </td>
                                );
                              })}
                            </tr>

                            {/* Elevator Row */}
                            <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                              <td className="p-4 font-bold text-gray-900 dark:text-white">4. Bucket Elevator</td>
                              {selectedProduct.variants!.map((v, idx: number) => {
                                const val = getEquipmentValue(v, 'elevator');
                                return (
                                  <td 
                                    key={idx} 
                                    className={`p-4 text-center ${
                                      selectedVariantIdx === idx ? 'bg-green-500/5 dark:bg-green-950/10 border-x border-green-500/20 font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                                    }`}
                                  >
                                    {val ? `${val} Units` : <span className="text-gray-400 dark:text-gray-600 italic font-normal">Optional (Manual lift)</span>}
                                  </td>
                                );
                              })}
                            </tr>

                            {/* Bin Row */}
                            <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                              <td className="p-4 font-bold text-gray-900 dark:text-white">5. Batch Bin</td>
                              {selectedProduct.variants!.map((v, idx: number) => {
                                const val = getEquipmentValue(v, 'bin');
                                return (
                                  <td 
                                    key={idx} 
                                    className={`p-4 text-center ${
                                      selectedVariantIdx === idx ? 'bg-green-500/5 dark:bg-green-950/10 border-x border-green-500/20 font-bold text-gray-900 dark:text-white' : 'text-gray-605 dark:text-gray-400'
                                    }`}
                                  >
                                    {val || <span className="text-gray-400 dark:text-gray-650 italic font-normal">Direct Bagging</span>}
                                  </td>
                                );
                              })}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer CTA */}
              <div className="bg-gray-50 dark:bg-gray-850 px-6 py-4 flex flex-col sm:flex-row gap-3 border-t border-gray-100 dark:border-gray-850">
                <Link 
                  to={getModalQuoteLink()}
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-green-600 dark:hover:bg-green-500 hover:text-white transition-all duration-300"
                >
                  Request Quote by Email <ChevronRight size={16} />
                </Link>
                <a 
                  href={getModalWhatsAppLink()} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 bg-green-600 text-white py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-green-700 transition-all duration-300"
                >
                  <MessageCircle size={18} /> Chat on WhatsApp
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setLightboxIndex(null)}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button 
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
              className="absolute top-6 right-6 text-white/70 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
            >
              <X size={24} />
            </button>

            {lightboxImages.length > 1 && (
              <>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) => (prev! - 1 + lightboxImages.length) % lightboxImages.length);
                  }}
                  className="absolute left-6 text-white/70 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
                >
                  <ChevronLeft size={28} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) => (prev! + 1) % lightboxImages.length);
                  }}
                  className="absolute right-6 text-white/70 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}

            <motion.img 
              key={lightboxIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              src={lightboxImages[lightboxIndex]} 
              alt="Enlarged view" 
              loading="lazy"
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl pointer-events-auto cursor-default"
            />

            {/* Counter */}
            <div className="absolute bottom-6 text-white/60 text-sm font-semibold">
              {lightboxIndex + 1} / {lightboxImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
