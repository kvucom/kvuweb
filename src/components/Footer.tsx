import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="bg-inverse-surface text-white">
      {/* Main Footer */}
      <div className="max-w-[1440px] mx-auto px-8 md:px-16 py-20 grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Brand */}
        <div className="space-y-6">
          <div>
            <div className="font-grotesk font-black text-xl tracking-tighter text-white">
              KRISHI VIKAS UDYOG
            </div>
            <div className="font-grotesk text-[9px] tracking-[0.2em] uppercase text-white/40 mt-1">
              {t('nav.tagline')}
            </div>
          </div>
          <p className="font-manrope text-sm text-white/60 leading-relaxed max-w-xs">
            {t('footer.tagline')}
          </p>
          <div className="flex items-center gap-2">
            <span className="font-grotesk text-label uppercase tracking-widest text-secondary-gold text-xs">GST:</span>
            <span className="font-manrope text-xs text-white/50">09AADFK7950N1ZP</span>
          </div>
          <div className="flex gap-3">
            {[
              { icon: 'call', href: 'tel:+919415139838' },
              { icon: 'mail', href: 'mailto:info@krishivikasudyog.in' },
              { icon: 'location_on', href: 'https://maps.google.com/?q=KRISHI+VIKAS+UDYOG' },
            ].map(item => (
              <a
                key={item.icon}
                href={item.href}
                className="w-10 h-10 border border-white/20 flex items-center justify-center text-white/50 hover:bg-primary hover:border-primary hover:text-white transition-all duration-300"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{item.icon}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-6">
          <div className="font-grotesk text-label uppercase tracking-widest text-secondary-gold">{t('footer.quickLinks')}</div>
          <ul className="space-y-3">
            {[
              { label: t('nav.home'), to: '/' },
              { label: t('nav.about'), to: '/about' },
              { label: t('home.categories.riceMill.title'), to: '/products?cat=rice-mill' },
              { label: t('home.categories.poultry.title'), to: '/products?cat=poultry-feed' },
              { label: t('nav.dealership'), to: '/dealership' },
              { label: t('nav.contact'), to: '/contact' },
            ].map(link => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="font-grotesk text-xs uppercase tracking-wider text-white/50 hover:text-white transition-colors flex items-center gap-2 group"
                >
                  <span className="w-4 h-px bg-white/20 group-hover:bg-secondary-gold group-hover:w-6 transition-all duration-300" />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info */}
        <div className="space-y-6">
          <div className="font-grotesk text-label uppercase tracking-widest text-secondary-gold">{t('footer.contactUs')}</div>
          <div className="space-y-4">
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-secondary-gold mt-0.5" style={{ fontSize: '18px' }}>location_on</span>
              <div>
                <div className="font-manrope text-sm text-white/80 leading-relaxed">
                  Mubarakpur, Ambedkar Nagar,<br />
                  Tanda – 224190,<br />
                  Uttar Pradesh, India
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-secondary-gold mt-0.5" style={{ fontSize: '18px' }}>call</span>
              <div className="flex flex-col gap-1">
                <a href="tel:+919415139838" className="font-manrope text-sm text-white/80 hover:text-white transition-colors">
                  +91 94151 39838
                </a>
                <a href="tel:+919415139837" className="font-manrope text-sm text-white/80 hover:text-white transition-colors">
                  +91 94151 39837
                </a>
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <span className="material-symbols-outlined text-secondary-gold" style={{ fontSize: '18px' }}>person</span>
              <div className="font-manrope text-sm text-white/80">
                Mr. Ghufran <span className="text-white/40 text-xs">(Marketing Manager)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 py-6 px-8 md:px-16">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-grotesk text-[10px] uppercase tracking-widest text-white/30">
            © {new Date().getFullYear()} KRISHI VIKAS UDYOG. {t('footer.rights')}
          </p>
          <p className="text-white/50 text-sm">
            Designed & Developed by{' '}
            <span
              className="text-secondary-gold hover:text-white transition-colors duration-300"
              style={{ fontFamily: "'Space Grotesk', 'Georgia', serif", fontSize: '1.6rem', fontWeight: '700' }}
            >
              Safwan Raza
            </span>
          </p>
        </div>
      </div>
    </footer>
  )
}
