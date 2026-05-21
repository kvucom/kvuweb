import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const navLinks: { key: string; to: string }[] = [
  { key: 'home',       to: '/' },
  { key: 'products',   to: '/products' },
  { key: 'about',      to: '/about' },
  { key: 'dealership', to: '/dealership' },
  { key: 'contact',    to: '/contact' },
]

export default function NavBar() {
  const { t, i18n } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (menuOpen) {
      setMenuOpen(false)
    }
  }, [location])

  return (
    <nav
      style={{ top: 'var(--top-banner-height, 0px)' }}
      className={`fixed left-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl shadow-md border-b border-slate-200/60'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1440px] mx-auto flex justify-between items-center px-6 md:px-16 py-4">
        {/* Logo */}
        <Link to="/" className="flex flex-col leading-none">
          <span
            className={`font-grotesk font-black text-lg tracking-tighter transition-colors duration-300 ${
              scrolled ? 'text-primary' : 'text-white'
            }`}
          >
            KRISHI VIKAS UDYOG
          </span>
          <span
            className={`font-grotesk text-[9px] font-bold tracking-[0.2em] uppercase transition-colors duration-300 ${
              scrolled ? 'text-primary/60' : 'text-white/60'
            }`}
          >
            {t('nav.tagline')}
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(link => {
            const active = location.pathname === link.to
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`font-grotesk text-label uppercase tracking-widest transition-all duration-200 pb-0.5 ${
                  active
                    ? scrolled
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-secondary-gold border-b-2 border-secondary-gold'
                    : scrolled
                    ? 'text-on-surface-variant hover:text-primary'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {t(`nav.${link.key}`)}
              </Link>
            )
          })}
        </div>

        {/* CTA + Hamburger */}
        <div className="flex items-center gap-4">
          <a
            href="tel:+919415139838"
            className={`hidden md:flex items-center gap-2 font-grotesk text-label uppercase tracking-widest transition-colors ${
              scrolled ? 'text-primary hover:text-secondary' : 'text-white/80 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>call</span>
            +91 9415139838
          </a>
          <Link
            to="/contact"
            className="hidden md:block bg-primary text-white px-6 py-2.5 font-grotesk text-label uppercase tracking-widest hover:bg-secondary-gold hover:text-primary transition-all duration-300 active:scale-95"
          >
            {t('nav.getQuote')}
          </Link>
          
          {/* Language Switcher */}
          <button
            onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'hi' : 'en')}
            className={`hidden md:block font-grotesk font-bold text-xs px-3 py-1 border transition-colors ${
              scrolled 
                ? 'border-primary text-primary hover:bg-primary hover:text-white' 
                : 'border-white text-white hover:bg-white hover:text-primary'
            }`}
          >
            {i18n.language === 'en' ? 'हिंदी' : 'EN'}
          </button>

          {/* Hamburger */}
          <button
            className={`md:hidden flex flex-col gap-1.5 p-1 ${scrolled ? 'text-primary' : 'text-white'}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block w-6 h-0.5 bg-current transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-6 h-0.5 bg-current transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-6 h-0.5 bg-current transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 overflow-hidden transition-all duration-300 ${
          menuOpen ? 'max-h-screen py-6' : 'max-h-0'
        }`}
      >
        <div className="flex flex-col gap-4 px-8">
          <div className="flex justify-end mb-2">
            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'hi' : 'en')}
              className="font-grotesk font-bold text-xs px-3 py-1 border border-primary text-primary hover:bg-primary hover:text-white transition-colors"
            >
              {i18n.language === 'en' ? 'Switch to हिंदी' : 'Switch to EN'}
            </button>
          </div>
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`font-grotesk text-label uppercase tracking-widest py-2 border-b border-slate-100 ${
                location.pathname === link.to ? 'text-primary font-bold' : 'text-on-surface-variant'
              }`}
            >
              {t(`nav.${link.key}`)}
            </Link>
          ))}
          <a
            href="tel:+919415139838"
            className="btn-primary text-center mt-2"
          >
            Call: +91 9415139838
          </a>
        </div>
      </div>
    </nav>
  )
}
