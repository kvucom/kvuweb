import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import emailjs from '@emailjs/browser'
import ScrollReveal from '../components/ScrollReveal'
import { supabase } from '../lib/supabase'
import { 
  Handshake, 
  TrendingUp, 
  Wrench, 
  Megaphone, 
  Award, 
  MapPin, 
  Briefcase, 
  Send, 
  CheckCircle,
  AlertCircle
} from 'lucide-react'

// EmailJS config from env
const EJ_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  || ''
const EJ_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  || ''
const EJ_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || ''

export default function DealershipPage() {
  const { t } = useTranslation()
  const formRef = useRef<HTMLFormElement>(null)
  
  const [form, setForm] = useState({
    name: '',
    firm: '',
    phone: '',
    email: '',
    location: '',
    experience: '',
    message: ''
  })
  
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const benefits = [
    {
      icon: TrendingUp,
      title: t('dealership.benefits.marginTitle'),
      desc: t('dealership.benefits.marginDesc')
    },
    {
      icon: Wrench,
      title: t('dealership.benefits.supportTitle'),
      desc: t('dealership.benefits.supportDesc')
    },
    {
      icon: Megaphone,
      title: t('dealership.benefits.marketingTitle'),
      desc: t('dealership.benefits.marketingDesc')
    },
    {
      icon: Award,
      title: t('dealership.benefits.trustTitle'),
      desc: t('dealership.benefits.trustDesc')
    }
  ]

  const steps = [
    { num: '01', title: t('dealership.steps.step1'), desc: t('dealership.steps.step1Desc') },
    { num: '02', title: t('dealership.steps.step2'), desc: t('dealership.steps.step2Desc') },
    { num: '03', title: t('dealership.steps.step3'), desc: t('dealership.steps.step3Desc') },
    { num: '04', title: t('dealership.steps.step4'), desc: t('dealership.steps.step4Desc') }
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const appNo = `KUV-DEALER-${Date.now().toString().slice(-6)}`

    // Add hidden values to form reference for EmailJS
    if (formRef.current) {
      const hiddenAppNo = formRef.current.querySelector('input[name="inquiry_no"]') as HTMLInputElement
      if (hiddenAppNo) hiddenAppNo.value = appNo
    }

    try {
      // 1. Try to save application to Supabase database (falls back silently if table missing/unconfigured)
      try {
        await supabase.from('dealership_applications').insert([{
          name: form.name,
          email: form.email || null,
          phone: form.phone,
          business_name: form.firm,
          location: form.location,
          experience: form.experience,
          message: form.message
        }])
      } catch (dbErr) {
        console.error('Failed to log in database, continuing with Email delivery.', dbErr)
      }

      // 2. Submit details via EmailJS
      await emailjs.sendForm(
        EJ_SERVICE_ID,
        EJ_TEMPLATE_ID,
        formRef.current!,
        { publicKey: EJ_PUBLIC_KEY }
      )

      setSubmitted(true)
      setForm({
        name: '',
        firm: '',
        phone: '',
        email: '',
        location: '',
        experience: '',
        message: ''
      })
    } catch (err: unknown) {
      const errorText = (err as { text?: string })?.text
      setError(errorText || 'Failed to submit application. Please contact sales team directly.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-950 via-green-900 to-emerald-950 z-0" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        
        <div className="max-w-7xl mx-auto relative z-10 text-center text-white">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-secondary-gold/20 text-secondary-gold backdrop-blur-md border border-secondary-gold/30 text-xs font-grotesk uppercase tracking-widest font-bold mb-6"
          >
            <Handshake className="w-4 h-4" />
            {t('dealership.badge')}
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-grotesk font-extrabold text-4xl md:text-6xl mb-6 leading-tight drop-shadow-md"
          >
            {t('dealership.title')}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-manrope text-lg md:text-xl text-green-100 max-w-3xl mx-auto leading-relaxed opacity-90"
          >
            {t('dealership.subtitle')}
          </motion.p>
        </div>
      </section>

      {/* Benefits - Bento Grid style */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <ScrollReveal className="text-center mb-16">
          <h2 className="font-grotesk font-bold text-3xl md:text-5xl text-primary mb-4">
            {t('dealership.benefits.title')}
          </h2>
          <p className="font-manrope text-on-surface-variant max-w-xl mx-auto">
            {t('dealership.benefits.subtitle')}
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((b, i) => {
            const Icon = b.icon
            return (
              <ScrollReveal key={b.title} delay={i * 100}>
                <div className="group h-full bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 dark:bg-secondary-gold/5 rounded-bl-full transition-transform duration-300 group-hover:scale-110" />
                  <div className="w-12 h-12 rounded-2xl bg-primary/5 dark:bg-secondary-gold/10 flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-primary dark:text-secondary-gold" />
                  </div>
                  <h3 className="font-grotesk font-bold text-xl text-primary dark:text-white mb-3 group-hover:text-secondary-gold transition-colors duration-300">
                    {b.title}
                  </h3>
                  <p className="font-manrope text-sm text-on-surface-variant dark:text-gray-400 leading-relaxed mt-auto">
                    {b.desc}
                  </p>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </section>

      {/* Program Flow / Steps */}
      <section className="py-24 bg-primary text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-green-950 to-primary opacity-60" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <ScrollReveal className="text-center mb-20">
            <h2 className="font-grotesk font-bold text-3xl md:text-5xl mb-4 text-white">
              {t('dealership.steps.title')}
            </h2>
            <div className="w-24 h-1.5 bg-secondary-gold mx-auto rounded-full" />
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {steps.map((s, i) => (
              <ScrollReveal key={s.title} delay={i * 150} className="relative">
                {i < 3 && (
                  <div className="hidden lg:block absolute top-8 left-[65%] right-[-35%] h-[2px] bg-gradient-to-r from-secondary-gold to-white/20 z-0" />
                )}
                <div className="relative z-10 bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 hover:border-secondary-gold transition-all duration-300">
                  <div className="font-grotesk font-bold text-4xl text-secondary-gold opacity-60 mb-4">
                    {s.num}
                  </div>
                  <h3 className="font-grotesk font-bold text-xl text-white mb-2">
                    {s.title}
                  </h3>
                  <p className="font-manrope text-sm text-white/70 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Application Form */}
      <section className="py-24 max-w-4xl mx-auto px-6">
        <ScrollReveal>
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800/80 p-8 md:p-12 relative overflow-hidden">
            {/* Background design */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />
            
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-16 flex flex-col items-center"
                >
                  <div className="w-20 h-20 rounded-full bg-green-50 dark:bg-green-950/30 flex items-center justify-center mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-grotesk font-bold text-3xl text-primary dark:text-white mb-4">
                    {t('dealership.form.success')}
                  </h3>
                  <p className="font-manrope text-on-surface-variant dark:text-gray-400 max-w-md mx-auto leading-relaxed mb-8">
                    {t('dealership.form.successDesc')}
                  </p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="inline-flex items-center gap-2 bg-primary dark:bg-white text-white dark:text-primary px-8 py-3.5 rounded-full font-grotesk font-bold text-xs uppercase tracking-widest hover:bg-secondary-gold hover:text-primary transition-all duration-300 shadow-md"
                  >
                    Apply Again
                  </button>
                </motion.div>
              ) : (
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
                  <div>
                    <h2 className="font-grotesk font-bold text-3xl text-primary dark:text-white mb-2">
                      {t('dealership.form.title')}
                    </h2>
                    <p className="font-manrope text-sm text-on-surface-variant dark:text-gray-400">
                      Please provide accurate business details below. Our partnership team will contact you.
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-2xl flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      {error}
                    </div>
                  )}

                  {/* Hidden fields for EmailJS template */}
                  <input type="hidden" name="inquiry_no" defaultValue="" />
                  <input type="hidden" name="reply_to" value={form.email} readOnly />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="relative">
                      <label className="font-grotesk text-xs uppercase tracking-widest text-on-surface-variant dark:text-gray-400 block mb-2 font-bold">
                        {t('dealership.form.name')} *
                      </label>
                      <div className="relative">
                        <input 
                          required 
                          type="text"
                          name="name" 
                          value={form.name} 
                          onChange={handleChange}
                          className="w-full border-b border-gray-200 dark:border-gray-800 bg-transparent py-3 font-manrope text-sm focus:outline-none focus:border-primary dark:focus:border-secondary-gold text-primary dark:text-white transition-colors" 
                        />
                      </div>
                    </div>

                    {/* Firm Name */}
                    <div className="relative">
                      <label className="font-grotesk text-xs uppercase tracking-widest text-on-surface-variant dark:text-gray-400 block mb-2 font-bold">
                        {t('dealership.form.firm')} *
                      </label>
                      <div className="relative">
                        <input 
                          required 
                          type="text"
                          name="firm" 
                          value={form.firm} 
                          onChange={handleChange}
                          className="w-full border-b border-gray-200 dark:border-gray-800 bg-transparent py-3 font-manrope text-sm focus:outline-none focus:border-primary dark:focus:border-secondary-gold text-primary dark:text-white transition-colors" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Phone */}
                    <div className="relative">
                      <label className="font-grotesk text-xs uppercase tracking-widest text-on-surface-variant dark:text-gray-400 block mb-2 font-bold">
                        {t('dealership.form.phone')} *
                      </label>
                      <div className="relative">
                        <input 
                          required 
                          type="tel"
                          name="phone" 
                          value={form.phone} 
                          onChange={handleChange}
                          placeholder="+91 XXXXX XXXXX"
                          className="w-full border-b border-gray-200 dark:border-gray-800 bg-transparent py-3 font-manrope text-sm focus:outline-none focus:border-primary dark:focus:border-secondary-gold text-primary dark:text-white transition-colors placeholder:text-gray-300 dark:placeholder:text-gray-700" 
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="relative">
                      <label className="font-grotesk text-xs uppercase tracking-widest text-on-surface-variant dark:text-gray-400 block mb-2 font-bold">
                        {t('dealership.form.email')}
                      </label>
                      <div className="relative">
                        <input 
                          type="email"
                          name="email" 
                          value={form.email} 
                          onChange={handleChange}
                          placeholder="example@email.com"
                          className="w-full border-b border-gray-200 dark:border-gray-800 bg-transparent py-3 font-manrope text-sm focus:outline-none focus:border-primary dark:focus:border-secondary-gold text-primary dark:text-white transition-colors placeholder:text-gray-300 dark:placeholder:text-gray-700" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Proposed Territory */}
                    <div className="relative">
                      <label className="font-grotesk text-xs uppercase tracking-widest text-on-surface-variant dark:text-gray-400 block mb-2 font-bold">
                        {t('dealership.form.location')} *
                      </label>
                      <div className="relative flex items-center">
                        <MapPin className="absolute left-0 w-4 h-4 text-on-surface-variant pointer-events-none" />
                        <input 
                          required 
                          type="text"
                          name="location" 
                          value={form.location} 
                          onChange={handleChange}
                          placeholder="City, State"
                          className="w-full border-b border-gray-200 dark:border-gray-800 bg-transparent py-3 pl-6 font-manrope text-sm focus:outline-none focus:border-primary dark:focus:border-secondary-gold text-primary dark:text-white transition-colors placeholder:text-gray-300 dark:placeholder:text-gray-700" 
                        />
                      </div>
                    </div>

                    {/* Experience */}
                    <div className="relative">
                      <label className="font-grotesk text-xs uppercase tracking-widest text-on-surface-variant dark:text-gray-400 block mb-2 font-bold">
                        {t('dealership.form.experience')} *
                      </label>
                      <div className="relative flex items-center">
                        <Briefcase className="absolute left-0 w-4 h-4 text-on-surface-variant pointer-events-none" />
                        <select 
                          required 
                          name="experience" 
                          value={form.experience} 
                          onChange={handleChange}
                          className="w-full border-b border-gray-200 dark:border-gray-800 bg-transparent py-3 pl-6 font-manrope text-sm focus:outline-none focus:border-primary dark:focus:border-secondary-gold text-primary dark:text-white transition-colors"
                        >
                          <option value="" className="text-gray-500 dark:bg-gray-900">Select option...</option>
                          <option value="none" className="text-primary dark:bg-gray-900">{t('dealership.form.expNone')}</option>
                          <option value="less" className="text-primary dark:bg-gray-900">{t('dealership.form.expLess')}</option>
                          <option value="mid" className="text-primary dark:bg-gray-900">{t('dealership.form.expMid')}</option>
                          <option value="more" className="text-primary dark:bg-gray-900">{t('dealership.form.expMore')}</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="relative">
                    <label className="font-grotesk text-xs uppercase tracking-widest text-on-surface-variant dark:text-gray-400 block mb-2 font-bold">
                      {t('dealership.form.message')}
                    </label>
                    <textarea 
                      name="message" 
                      value={form.message} 
                      onChange={handleChange}
                      rows={4}
                      placeholder="Describe your current store setup, network of farmers, or dealership distribution experience..."
                      className="w-full border-b border-gray-200 dark:border-gray-800 bg-transparent py-3 font-manrope text-sm focus:outline-none focus:border-primary dark:focus:border-secondary-gold text-primary dark:text-white transition-colors resize-none placeholder:text-gray-300 dark:placeholder:text-gray-700" 
                    />
                  </div>

                  {/* Submit Button */}
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-primary hover:bg-secondary-gold dark:bg-white dark:text-primary text-white dark:hover:bg-secondary-gold hover:text-primary font-grotesk font-bold uppercase tracking-widest text-xs py-4 px-8 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-75"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {t('dealership.form.submit')}
                      </>
                    )}
                  </button>
                </form>
              )}
            </AnimatePresence>
          </div>
        </ScrollReveal>
      </section>
    </main>
  )
}
