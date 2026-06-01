import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import emailjs from '@emailjs/browser'
import ScrollReveal from '../components/ScrollReveal'

// EmailJS config from env (keys never hardcoded in source)
const EJ_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  || ''
const EJ_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  || ''
const EJ_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_CONTACT_TEMPLATE_ID || ''

export default function ContactPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const formRef = useRef<HTMLFormElement>(null)

  const productName = searchParams.get('product_name') || ''
  const variantName = searchParams.get('variant') || ''
  const hp = searchParams.get('hp') || ''
  const initialProduct = searchParams.get('product') || ''

  const defaultMessage = productName 
    ? `Hello, I am interested in ${productName}${variantName ? ` (Variant: ${variantName}${hp ? `, Required HP: ${hp}` : ''})` : ''}. Please provide a quote and details.`
    : ''

  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    message: defaultMessage, 
    product: initialProduct === 'rice-mill' || initialProduct === 'poultry-feed' || initialProduct === 'atta-chakki' ? initialProduct : '' 
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const contactDetails = [
    { icon: 'location_on', label: t('contact.address'), value: 'Mubarakpur, Ambedkar Nagar,\nTanda – 224190,\nUttar Pradesh, India' },
    { icon: 'call', label: t('contact.phone'), value: '+91 94151 39838\n+91 94151 39837' },
    { icon: 'person', label: t('contact.person'), value: 'Mr. Ghufran\n(Marketing Manager)' },
    { icon: 'schedule', label: t('contact.hours'), value: t('contact.hoursVal') },
    { icon: 'verified', label: 'GST Number', value: '09AADFK7950N1ZP' },
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'phoneInput') {
      const nums = value.replace(/\D/g, '')
      if (nums.length <= 10) setForm(f => ({ ...f, phone: nums }))
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Frontend Rate Limiting: Check localStorage for submission within last 24 hours
    const lastSubmitStr = localStorage.getItem('contact_last_submit')
    if (lastSubmitStr) {
      try {
        const lastSubmit = JSON.parse(lastSubmitStr)
        const diffMs = Date.now() - lastSubmit.timestamp
        const hoursLeft = 24 - (diffMs / (1000 * 60 * 60))
        
        const fullPhone = `+91 ${form.phone}`
        if (diffMs < 24 * 60 * 60 * 1000 && (lastSubmit.email === form.email || lastSubmit.phone === fullPhone)) {
          setError(`You have already submitted an inquiry in the last 24 hours. Please wait another ${Math.ceil(hoursLeft)} hours or call us directly.`)
          setLoading(false)
          return
        }
      } catch (err) {
        console.error('Failed to parse last submit metadata:', err)
      }
    }

    // Generate unique inquiry number
    const inquiryNo = `KVU-${Date.now().toString().slice(-6)}`

    // Add inquiry_no as a hidden field value for EmailJS
    if (formRef.current) {
      const hidden = formRef.current.querySelector('input[name="inquiry_no"]') as HTMLInputElement
      if (hidden) hidden.value = inquiryNo
    }

    try {
      await emailjs.sendForm(
        EJ_SERVICE_ID,
        EJ_TEMPLATE_ID,
        formRef.current!,
        { publicKey: EJ_PUBLIC_KEY }
      )

      // Save submission details to localStorage
      try {
        localStorage.setItem('contact_last_submit', JSON.stringify({
          timestamp: Date.now(),
          email: form.email,
          phone: `+91 ${form.phone}`
        }))
      } catch (err) {
        console.error('Failed to save submit timestamp:', err)
      }

      setSubmitted(true)
      setForm({ name: '', email: '', phone: '', message: '', product: '' })
    } catch (err: unknown) {
      const errorText = (err as { text?: string })?.text
      setError(errorText || 'Failed to send message. Please try calling us directly.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      {/* Hero */}
      <section className="bg-primary py-32 px-8 md:px-16">
        <div className="max-w-[1440px] mx-auto">
          <span className="section-label text-secondary-gold mb-4 block">{t('contact.badge')}</span>
          <h1 className="font-grotesk font-bold text-4xl md:text-6xl text-white mb-4">{t('contact.title')}</h1>
          <p className="font-manrope text-body-lg text-white/60 max-w-xl">
            {t('contact.subtitle')}
          </p>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="py-section bg-white">
        <div className="max-w-[1440px] mx-auto px-8 md:px-16 grid grid-cols-1 lg:grid-cols-5 gap-16">

          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-10">
            <ScrollReveal>
              <h2 className="font-grotesk font-semibold text-h2 text-primary mb-8">{t('contact.details')}</h2>
              <div className="space-y-7">
                {contactDetails.map(item => (
                  <div key={item.label} className="flex gap-4">
                    <div className="w-10 h-10 bg-surface-low flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>{item.icon}</span>
                    </div>
                    <div>
                      <div className="font-grotesk text-label uppercase tracking-widest text-outline mb-1">{item.label}</div>
                      <div className="font-manrope text-body text-on-surface whitespace-pre-line">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            {/* Quick call CTA */}
            <ScrollReveal delay={100}>
              <div className="border-l-4 border-secondary-gold pl-6 py-4">
                <p className="font-manrope text-sm text-on-surface-variant mb-3">{t('contact.immediateHelp')}</p>
                <a href="tel:+919415139838"
                  className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 font-grotesk text-label uppercase tracking-widest hover:bg-secondary-gold hover:text-primary transition-all duration-300">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>call</span>
                  +91 94151 39838
                </a>
              </div>
            </ScrollReveal>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <ScrollReveal delay={100}>
              {submitted ? (
                <div className="flex flex-col items-center justify-center text-center py-24 bg-surface-low">
                  <span className="material-symbols-outlined text-7xl text-primary mb-6">check_circle</span>
                  <h3 className="font-grotesk font-semibold text-h2 text-primary mb-3">{t('contact.success.title')}</h3>
                  <p className="font-manrope text-body text-on-surface-variant mb-8 max-w-sm">
                    {t('contact.success.desc')}
                  </p>
                  <button onClick={() => setSubmitted(false)}
                    className="btn-outline">
                    {t('contact.success.again')}
                  </button>
                </div>
              ) : (
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                  <h2 className="font-grotesk font-semibold text-h2 text-primary mb-8">{t('contact.form.title')}</h2>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-start gap-2">
                      <span className="material-symbols-outlined text-base mt-0.5">error</span>
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="font-grotesk text-label uppercase tracking-widest text-outline block mb-2">{t('contact.form.name')} *</label>
                      <input required name="name" value={form.name} onChange={handleChange} placeholder={t('contact.form.namePH')}
                        className="w-full border-b-2 border-outline-variant bg-transparent py-3 font-manrope text-body focus:outline-none focus:border-primary transition-colors placeholder:text-outline" />
                    </div>
                    <div>
                      <label className="font-grotesk text-label uppercase tracking-widest text-outline block mb-2">{t('contact.form.phone')} *</label>
                      <div className="flex items-end gap-0">
                        <span className="border-b-2 border-outline-variant py-3 pr-2 font-manrope text-body text-on-surface select-none">+91</span>
                        <input required name="phoneInput" value={form.phone} onChange={handleChange} placeholder="10 digit number" type="tel"
                          className="flex-1 border-b-2 border-outline-variant bg-transparent py-3 font-manrope text-body focus:outline-none focus:border-primary transition-colors placeholder:text-outline" />
                      </div>
                      <input type="hidden" name="phone" value={`+91 ${form.phone}`} />
                    </div>
                  </div>

                  <div>
                    <label className="font-grotesk text-label uppercase tracking-widest text-outline block mb-2">{t('contact.form.email')}</label>
                    <input name="email" value={form.email} onChange={handleChange} placeholder={t('contact.form.emailPH')} type="email"
                      className="w-full border-b-2 border-outline-variant bg-transparent py-3 font-manrope text-body focus:outline-none focus:border-primary transition-colors placeholder:text-outline" />
                    {/* Hidden fields for EmailJS template variables */}
                    <input type="hidden" name="reply_to" value={form.email} readOnly />
                    <input type="hidden" name="inquiry_no" defaultValue="" />
                  </div>

                  <div>
                    <label className="font-grotesk text-label uppercase tracking-widest text-outline block mb-2">{t('contact.form.product')}</label>
                    <select name="product" value={form.product} onChange={handleChange}
                      className="w-full border-b-2 border-outline-variant bg-transparent py-3 font-manrope text-body focus:outline-none focus:border-primary transition-colors text-on-surface">
                      <option value="">{t('contact.form.productPH')}</option>
                      <option value="rice-mill">{t('home.categories.riceMill.title')}</option>
                      <option value="poultry-feed">{t('home.categories.poultry.title')}</option>
                      <option value="atta-chakki">Atta Chakki & Oil Expeller</option>
                      <option value="other">Other / Custom Requirement</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-grotesk text-label uppercase tracking-widest text-outline block mb-2">{t('contact.form.message')}</label>
                    <textarea required name="message" value={form.message} onChange={handleChange} rows={5}
                      placeholder={t('contact.form.messagePH')}
                      className="w-full border-b-2 border-outline-variant bg-transparent py-3 font-manrope text-body focus:outline-none focus:border-primary transition-colors placeholder:text-outline resize-none" />
                  </div>

                  <button type="submit" disabled={loading}
                    className="btn-primary w-full text-center flex items-center justify-center gap-2 disabled:opacity-70">
                    {loading && <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>}
                    {loading ? 'Sending...' : t('contact.form.submit')}
                  </button>
                  <p className="font-manrope text-xs text-outline text-center">
                    {t('contact.form.immediate')} <a href="tel:+919415139838" className="text-primary hover:underline">+91 9415139838</a> / <a href="tel:+919415139837" className="text-primary hover:underline">+91 9415139837</a>
                  </p>
                </form>
              )}
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Google Maps */}
      <section className="bg-surface-low">
        <div className="max-w-[1440px] mx-auto px-8 md:px-16 pb-section">
          <ScrollReveal>
            <div className="mb-8">
              <span className="section-label text-primary mb-2 block">{t('contact.map.badge')}</span>
              <h2 className="font-grotesk font-semibold text-h2 text-primary">{t('contact.map.title')}</h2>
            </div>
            <div className="w-full h-[450px] border border-outline-variant overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3562.2905641774324!2d82.68261787611894!3d26.541315876867623!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3990e91fe6b711f5%3A0x898176e831515a65!2sKRISHI%20VIKAS%20UDYOG!5e0!3m2!1sen!2sin!4v1715831200000!5m2!1sen!2sin"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                title="Krishi Vikas Udyog Location"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  )
}
