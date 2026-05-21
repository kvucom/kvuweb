import ScrollReveal from '../components/ScrollReveal'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSiteImages } from '../hooks/useSiteImages'

const timeline = [
  { year: '1983', title: 'Founded', desc: 'Krishi Vikas Udyog established in Tanda, Uttar Pradesh with a vision to empower Indian farmers with quality machinery.' },
  { year: '1990s', title: 'Expansion', desc: 'Extended product range to include paddy shellers, polishers, and elevators. Client base grew across eastern UP.' },
  { year: '2000s', title: 'Modernization', desc: 'Introduced semi-automatic and computerized machinery lines to meet evolving industrial demands.' },
  { year: '2010s', title: 'ISO Certified', desc: 'Achieved ISO 9001:2015 certification, affirming our commitment to international quality management standards.' },
  { year: '2020', title: 'Innovation', desc: 'Launched advanced nano models and poultry feed plant range. Now serving 500+ clients across India.' },
  { year: '2023', title: 'Precision Manufacturing', desc: 'Integrated advanced laser cutting machinery into our workflow to elevate manufacturing precision, quality, and efficiency.' },
]

const profile = [
  { icon: 'factory', label: 'Nature of Business', value: 'Manufacturer & Supplier' },
  { icon: 'calendar_today', label: 'Year of Establishment', value: '1983' },
  { icon: 'receipt_long', label: 'GST Number', value: '09AADFK7950N1ZP' },
  { icon: 'groups', label: 'No. of Employees', value: '20+' },
  { icon: 'precision_manufacturing', label: 'Production Type', value: 'Semi-Automatic & Automatic' },
  { icon: 'domain', label: 'Production Units', value: '01' },
  { icon: 'warehouse', label: 'Warehousing Facility', value: 'Yes' },
  { icon: 'verified', label: 'Certifications', value: 'ISO 9001:2015, MSME, Export' },
]

const strengths = [
  { icon: 'verified', label: 'Domain Expertise' },
  { icon: 'groups', label: 'Experienced Workforce' },
  { icon: 'policy', label: 'Transparent Policies' },
  { icon: 'star', label: 'Best Featured Products' },
  { icon: 'workspace_premium', label: 'Unmatched Quality' },
  { icon: 'currency_rupee', label: 'Competitive Pricing' },
  { icon: 'local_shipping', label: 'Prompt Delivery' },
  { icon: 'thumb_up', label: 'Client Satisfaction' },
]

export default function AboutPage() {
  const { t } = useTranslation()
  const { images } = useSiteImages()
  return (
    <main>
      {/* Hero */}
      <section className="bg-primary py-32 px-8 md:px-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `url('${images['about-hero']}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="relative max-w-[1440px] mx-auto">
          <span className="section-label text-secondary-gold mb-4 block">{t('about.badge')}</span>
          <h1 className="font-grotesk font-bold text-4xl md:text-6xl text-white mb-6">{t('about.title')}</h1>
          <p className="font-manrope text-body-lg text-white/60 max-w-2xl">
            {t('about.subtitle')}
          </p>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-section bg-white">
        <div className="max-w-[1440px] mx-auto px-8 md:px-16 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

          <ScrollReveal delay={150}>
            <div className="w-full max-w-lg mx-auto">
              <div className="relative">
                {/* Background accent */}
                <div className="absolute -top-4 -left-4 w-32 h-32 bg-surface-low border-4 border-white shadow-sm -z-10" />

                <div className="relative flex flex-row items-end gap-3 sm:gap-6 justify-center">
                  {/* Photo 1 */}
                  <div className="w-[48%] aspect-[4/5] overflow-hidden border-4 border-white shadow-xl bg-surface-low">
                    <img src={images['about-partner-1']} alt="Managing Partner 1" className="w-full h-full object-cover" />
                  </div>
                  
                  {/* Photo 2 */}
                  <div className="w-[48%] aspect-[4/5] overflow-hidden border-4 border-white shadow-xl bg-surface-low">
                    <img src={images['about-partner-2']} alt="Managing Partner 2" className="w-full h-full object-cover" />
                  </div>

                  {/* The 40+ Years Box - Now absolutely positioned relative to ONLY the images */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-secondary-gold p-4 sm:p-6 shadow-xl flex flex-col justify-center items-center rounded-lg border-2 border-white z-10 w-32 h-32 sm:w-40 sm:h-40">
                    <div className="font-grotesk font-black text-4xl sm:text-5xl text-primary">40+</div>
                    <div className="font-grotesk text-[10px] sm:text-xs uppercase tracking-[0.1em] font-bold text-primary/80 mt-1 text-center">
                      Years of<br />Excellence
                    </div>
                  </div>
                </div>

                {/* Partner Names - Placed outside image wrapper so it doesn't affect vertical centering */}
                <div className="flex flex-row gap-3 sm:gap-6 justify-center mt-5">
                  <div className="w-[48%] flex flex-col items-center text-center">
                    <h3 className="font-runiga font-semibold tracking-wide text-primary text-lg sm:text-2xl">{images['about-partner-1-name'] || t('about.story.partner1')}</h3>
                    <div className="w-8 h-[3px] bg-secondary-gold mt-2 opacity-60"></div>
                  </div>
                  <div className="w-[48%] flex flex-col items-center text-center">
                    <h3 className="font-runiga font-semibold tracking-wide text-primary text-lg sm:text-2xl">{images['about-partner-2-name'] || t('about.story.partner2')}</h3>
                    <div className="w-8 h-[3px] bg-secondary-gold mt-2 opacity-60"></div>
                  </div>
                </div>
              </div>

              {/* Managing Partners Text */}
              <div className="mt-8 text-center">
                <span className="font-grotesk text-label uppercase tracking-widest text-primary/60">Managing Partners</span>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-1 h-10 bg-secondary-gold" />
              <h2 className="font-grotesk font-semibold text-h1 text-primary">{t('about.story.title')}</h2>
            </div>
            <p className="font-manrope text-body-lg text-on-surface-variant leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: t('about.story.p1') }} />
            <p className="font-manrope text-body text-on-surface-variant/80 mb-6" dangerouslySetInnerHTML={{ __html: t('about.story.p2') }} />
            <p className="font-manrope text-body text-on-surface-variant/80" dangerouslySetInnerHTML={{ __html: t('about.story.p3') }} />
          </ScrollReveal>

        </div>
      </section>

      {/* Expert UI: Dark Mode Split-Screen Profile */}
      <section className="py-24 bg-primary text-white relative overflow-hidden">
        {/* Decorative background blurs for a premium glass/glow effect */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-secondary-gold/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-white/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-[1440px] mx-auto px-8 md:px-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
            
            {/* Left Column: Sticky Heading */}
            <div className="lg:col-span-4 lg:sticky lg:top-32">
              <ScrollReveal>
                <div className="w-12 h-1 bg-secondary-gold mb-6" />
                <span className="font-grotesk text-xs uppercase tracking-[0.2em] text-secondary-gold block mb-4">
                  {t('about.profile.badge')}
                </span>
                <h2 className="font-grotesk font-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-6 leading-tight">
                  {t('about.profile.title')}
                </h2>
                <p className="font-manrope text-white/50 text-base sm:text-lg leading-relaxed">
                  A quick look at the core numbers, facts, and milestones that define our legacy and scale of operations.
                </p>
              </ScrollReveal>
            </div>

            {/* Right Column: Minimalist Typography Grid */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10 sm:gap-y-16">
                {profile.map((item, i) => (
                  <ScrollReveal key={item.label} delay={i * 100}>
                    <div className="group border-b border-white/10 pb-6 hover:border-secondary-gold transition-colors duration-500 cursor-default">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="material-symbols-outlined text-secondary-gold/40 group-hover:text-secondary-gold group-hover:scale-110 transition-all duration-300">
                          {item.icon}
                        </span>
                        <div className="font-grotesk text-[10px] sm:text-xs uppercase tracking-[0.15em] text-white/40 group-hover:text-white/80 transition-colors duration-300">
                          {item.label}
                        </div>
                      </div>
                      <div className="font-manrope text-xl sm:text-2xl font-light text-white group-hover:text-secondary-gold transition-colors duration-300 tracking-wide text-balance leading-tight">
                        {item.value}
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-section bg-white">
        <div className="max-w-[1440px] mx-auto px-8 md:px-16">
          <ScrollReveal className="text-center mb-16">
            <span className="section-label text-primary mb-3 block">{t('about.timeline.badge')}</span>
            <h2 className="font-grotesk font-semibold text-h1 text-primary">{t('about.timeline.title')}</h2>
          </ScrollReveal>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-outline-variant hidden md:block" />
            <div className="space-y-12">
              {timeline.map((item, i) => (
                <ScrollReveal key={item.year} delay={i * 100}>
                  <div className={`flex flex-col md:flex-row items-center gap-8 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                    <div className={`md:w-5/12 ${i % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                      <div className="font-grotesk font-bold text-4xl text-secondary-gold mb-2">{item.year}</div>
                      <h3 className="font-grotesk font-semibold text-xl text-primary mb-2">{item.title}</h3>
                      <p className="font-manrope text-sm text-on-surface-variant leading-relaxed">{item.desc}</p>
                    </div>
                    {/* Dot */}
                    <div className="hidden md:flex w-2/12 justify-center">
                      <div className="w-5 h-5 rounded-full bg-primary border-4 border-secondary-gold z-10" />
                    </div>
                    <div className="md:w-5/12" />
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Strengths */}
      <section className="py-section bg-primary">
        <div className="max-w-[1440px] mx-auto px-8 md:px-16">
          <ScrollReveal className="text-center mb-16">
            <span className="section-label text-secondary-gold mb-3 block">{t('about.strengths.badge')}</span>
            <h2 className="font-grotesk font-semibold text-h1 text-white">{t('about.strengths.title')}</h2>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {strengths.map((s, i) => (
              <ScrollReveal key={s.label} delay={i * 60}>
                <div className="group text-center p-6 border border-white/10 hover:border-secondary-gold hover:bg-white/5 transition-all duration-300">
                  <span className="material-symbols-outlined text-secondary-gold text-4xl mb-4 block">{s.icon}</span>
                  <div className="font-grotesk text-label uppercase tracking-widest text-white/80">{s.label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-secondary-gold px-8 md:px-16">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-grotesk font-bold text-2xl text-primary mb-1">{t('about.cta.title')}</h3>
            <p className="font-manrope text-sm text-primary/70">{t('about.cta.desc')}</p>
          </div>
          <div className="flex gap-4">
            <Link to="/dealership" className="bg-primary text-white px-8 py-3 font-grotesk text-label uppercase tracking-widest hover:bg-primary-light transition-all">
              {t('nav.dealership')}
            </Link>
            <Link to="/contact" className="border-2 border-primary text-primary px-8 py-3 font-grotesk text-label uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
              {t('nav.contact')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
