import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'
import { Plus, Trash2, ToggleLeft, ToggleRight, Loader2, Upload, X, Eye, Copy, Calendar, Clock } from 'lucide-react'
import { compressImage } from '../../lib/imageUtils'

interface Campaign {
  id: string
  title: string
  message: string
  image_url?: string
  cta_text?: string
  cta_link?: string
  is_active: boolean
  start_date?: string
  end_date?: string
  type: 'notice' | 'offer' | 'campaign' | 'alert'
  display_mode: 'popup' | 'banner-top' | 'banner-bottom'
  priority: number
  dismissible: boolean
  delay_seconds: number
  show_once: boolean
  created_at: string
}

const typeOptions = [
  { value: 'notice', label: 'Notice', color: 'blue' },
  { value: 'offer', label: 'Offer', color: 'green' },
  { value: 'campaign', label: 'Campaign', color: 'amber' },
  { value: 'alert', label: 'Alert', color: 'red' },
]

const typeButtonClasses: Record<string, string> = {
  notice: 'bg-blue-600 text-white border-blue-600',
  offer: 'bg-green-600 text-white border-green-600',
  campaign: 'bg-amber-600 text-white border-amber-600',
  alert: 'bg-red-600 text-white border-red-600',
}

const typeBadgeClasses: Record<string, string> = {
  notice: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  offer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  campaign: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  alert: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const modeOptions = [
  { value: 'popup', label: 'Popup Modal', icon: '🪟' },
  { value: 'banner-top', label: 'Top Banner', icon: '⬆️' },
  { value: 'banner-bottom', label: 'Bottom Banner', icon: '⬇️' },
]

const emptyCampaign: Omit<Campaign, 'id' | 'created_at'> = {
  title: '',
  message: '',
  image_url: '',
  cta_text: '',
  cta_link: '',
  is_active: false,
  start_date: '',
  end_date: '',
  type: 'notice',
  display_mode: 'popup',
  priority: 0,
  dismissible: true,
  delay_seconds: 0,
  show_once: false,
}

export default function ManagePopups() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Campaign | null>(null)
  const [form, setForm] = useState<Omit<Campaign, 'id' | 'created_at'>>(emptyCampaign)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const fetchCampaigns = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('popup_campaigns').select('*').order('priority', { ascending: false })
    setCampaigns(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  const handleImageUpload = async () => {
    if (!file) return form.image_url || ''
    setUploading(true)
    try {
      const compressedFile = await compressImage(file)
      const path = `campaigns/${Date.now()}.webp`
      const { error } = await supabase.storage.from('images').upload(path, compressedFile)
      if (error) throw error
      const { data } = supabase.storage.from('images').getPublicUrl(path)
      return data.publicUrl
    } catch (err) {
      alert('Upload failed: ' + (err instanceof Error ? err.message : String(err)))
      return ''
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!form.title || !form.message) {
      alert('Title and message are required')
      return
    }
    setSaving(true)
    try {
      const imageUrl = await handleImageUpload()
      const payload: Record<string, unknown> = {
        title: form.title,
        message: form.message,
        image_url: imageUrl || form.image_url || null,
        cta_text: form.cta_text || null,
        cta_link: form.cta_link || null,
        is_active: form.is_active,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        type: form.type,
        display_mode: form.display_mode,
        priority: form.priority,
        dismissible: form.dismissible,
        delay_seconds: form.delay_seconds,
        show_once: form.show_once,
      }

      if (editing) {
        const { error } = await supabase.from('popup_campaigns').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('popup_campaigns').insert([payload])
        if (error) throw error
      }

      resetForm()
      fetchCampaigns()
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : JSON.stringify(err)
      alert('Save failed: ' + msg)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (campaign: Campaign) => {
    const { error } = await supabase.from('popup_campaigns').update({ is_active: !campaign.is_active }).eq('id', campaign.id)
    if (!error) fetchCampaigns()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign?')) return
    const { error } = await supabase.from('popup_campaigns').delete().eq('id', id)
    if (!error) fetchCampaigns()
  }

  const handleDuplicate = async (campaign: Campaign) => {
    const { id: _id, created_at: _created_at, ...rest } = campaign
    const { error } = await supabase.from('popup_campaigns').insert([{ ...rest, title: `${campaign.title} (Copy)`, is_active: false }])
    if (!error) fetchCampaigns()
  }

  const handleEdit = (campaign: Campaign) => {
    setEditing(campaign)
    setForm({
      title: campaign.title,
      message: campaign.message,
      image_url: campaign.image_url || '',
      cta_text: campaign.cta_text || '',
      cta_link: campaign.cta_link || '',
      is_active: campaign.is_active,
      start_date: campaign.start_date || '',
      end_date: campaign.end_date || '',
      type: campaign.type,
      display_mode: campaign.display_mode,
      priority: campaign.priority,
      dismissible: campaign.dismissible,
      delay_seconds: campaign.delay_seconds,
      show_once: campaign.show_once,
    })
    setPreview(campaign.image_url || null)
    setShowForm(true)
  }

  const resetForm = () => {
    setEditing(null)
    setForm(emptyCampaign)
    setFile(null)
    setPreview(null)
    setShowForm(false)
  }

  const getStatusBadge = (c: Campaign) => {
    const now = new Date()
    if (!c.is_active) return { label: 'Off', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' }
    if (c.start_date && new Date(c.start_date) > now) return { label: 'Scheduled', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
    if (c.end_date && new Date(c.end_date) < now) return { label: 'Expired', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
    return { label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Popups & Banners</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">Manage promotional popups and notification banners.</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors">
          <Plus size={18} /> New Campaign
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editing ? 'Edit Campaign' : 'New Campaign'}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* Display Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Mode</label>
                <div className="grid grid-cols-3 gap-3">
                  {modeOptions.map(m => (
                    <button key={m.value} type="button" onClick={() => setForm(f => ({ ...f, display_mode: m.value as Campaign['display_mode'] }))}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${form.display_mode === m.value ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                      <span className="text-xl">{m.icon}</span>
                      <p className="text-xs font-medium mt-1 text-gray-700 dark:text-gray-300">{m.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {typeOptions.map(t => (
                    <button key={t.value} type="button" onClick={() => setForm(f => ({ ...f, type: t.value as Campaign['type'] }))}
                      className={`py-2 rounded-lg text-sm font-medium border transition-all ${form.type === t.value ? typeButtonClasses[t.value] : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 outline-none dark:text-white"
                  placeholder="e.g. Diwali Sale - 20% Off!" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message *</label>
                <textarea rows={3} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 outline-none dark:text-white"
                  placeholder="Describe your offer or notice..." />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Banner Image (optional)</label>
                {preview ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setFile(null); setPreview(null); setForm(f => ({ ...f, image_url: '' })) }}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"><X size={14} /></button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer hover:border-green-500 transition-colors">
                    <span className="text-sm text-gray-500 flex items-center gap-2"><Upload size={16} /> Upload Image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setPreview(URL.createObjectURL(f)) } }} />
                  </label>
                )}
              </div>

              {/* CTA */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Button Text</label>
                  <input type="text" value={form.cta_text} onChange={e => setForm(f => ({ ...f, cta_text: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 outline-none dark:text-white"
                    placeholder="e.g. Shop Now" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Button Link</label>
                  <input type="text" value={form.cta_link} onChange={e => setForm(f => ({ ...f, cta_link: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 outline-none dark:text-white"
                    placeholder="/products or https://..." />
                </div>
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                  <input type="datetime-local" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                  <input type="datetime-local" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 outline-none dark:text-white" />
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delay (seconds)</label>
                  <input type="number" min={0} value={form.delay_seconds} onChange={e => setForm(f => ({ ...f, delay_seconds: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <input type="number" min={0} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 outline-none dark:text-white" />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.dismissible} onChange={e => setForm(f => ({ ...f, dismissible: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">User can close</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.show_once} onChange={e => setForm(f => ({ ...f, show_once: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Show once per session</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-6 flex gap-3">
              <button onClick={resetForm} className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || uploading} className="flex-1 py-3 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-green-600" size={32} /></div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400">No campaigns yet. Create your first popup or banner!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => {
            const status = getStatusBadge(c)
            const typeConf = typeOptions.find(t => t.value === c.type)
            return (
              <div key={c.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                {/* Toggle */}
                <button onClick={() => handleToggle(c)} className="flex-shrink-0 text-2xl">
                  {c.is_active ? <ToggleRight className="text-green-500" /> : <ToggleLeft className="text-gray-300 dark:text-gray-600" />}
                </button>

                {/* Preview */}
                {c.image_url && <img src={c.image_url} alt="" className="w-16 h-12 rounded-lg object-cover flex-shrink-0" />}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${typeConf ? typeBadgeClasses[typeConf.value] : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'}`}>
                      {c.type}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      {c.display_mode === 'popup' ? '🪟 Popup' : c.display_mode === 'banner-top' ? '⬆️ Top Banner' : '⬇️ Bottom Banner'}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{c.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{c.message}</p>
                </div>

                {/* Meta */}
                <div className="hidden lg:flex flex-col items-end gap-1 text-xs text-gray-400 flex-shrink-0">
                  {c.start_date && <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(c.start_date).toLocaleDateString()}</span>}
                  {c.end_date && <span className="flex items-center gap-1"><Clock size={12} /> {new Date(c.end_date).toLocaleDateString()}</span>}
                  <span>Priority: {c.priority}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleEdit(c)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title="Edit"><Eye size={16} /></button>
                  <button onClick={() => handleDuplicate(c)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title="Duplicate"><Copy size={16} /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-gray-400 hover:text-red-500" title="Delete"><Trash2 size={16} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
