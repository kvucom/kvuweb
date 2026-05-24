import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Loader2, Image, MessageSquare, Star, Upload, X, Link as LinkIcon, Play, Check } from 'lucide-react';
import { parseEmbedUrl, type EmbedPlatform } from '../../lib/embedUtils';
import { compressImage } from '../../lib/imageUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'embed';
  url: string;
  embed_url?: string;
  platform?: EmbedPlatform;
  caption?: string;
  display_order: number;
}

interface Review {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  display_order: number;
  approved?: boolean;
  origin?: string;
}


// ─── Helper ───────────────────────────────────────────────────────────────────

const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <button key={s} type="button" onClick={() => onChange(s)}>
        <Star size={22} className={s <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'} />
      </button>
    ))}
  </div>
);

// ─── Media Section ─────────────────────────────────────────────────────────────

function MediaSection() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [type, setType] = useState<'image' | 'video' | 'embed'>('image');
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [embedUrl, setEmbedUrl] = useState('');
  const [embedPreview, setEmbedPreview] = useState<{ platform: EmbedPlatform; thumbnail?: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase.from('media_items').select('*').order('display_order');
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchItems();
    });
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleEmbedUrlChange = (val: string) => {
    setEmbedUrl(val);
    const parsed = parseEmbedUrl(val);
    if (parsed) {
      setEmbedPreview({ platform: parsed.platform, thumbnail: parsed.thumbnailUrl });
    } else {
      setEmbedPreview(null);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (type === 'embed') {
      if (!embedUrl) { setMsg({ type: 'error', text: 'Please enter a URL.' }); return; }
      const parsed = parseEmbedUrl(embedUrl);
      if (!parsed) { setMsg({ type: 'error', text: 'Invalid URL. Supported: YouTube, X (Twitter), Instagram.' }); return; }

      setUploading(true);
      try {
        const nextOrder = items.length > 0 ? Math.max(...items.map(i => i.display_order)) + 1 : 1;
        const { error } = await supabase.from('media_items').insert([{
          type: 'embed',
          url: parsed.thumbnailUrl || embedUrl,
          embed_url: parsed.embedUrl,
          platform: parsed.platform,
          caption,
          display_order: nextOrder,
        }]);
        if (error) throw error;
        setMsg({ type: 'success', text: 'Embed added!' });
        setEmbedUrl(''); setEmbedPreview(null); setCaption('');
        fetchItems();
      } catch (err: unknown) {
        const msg = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : JSON.stringify(err)
        setMsg({ type: 'error', text: msg });
      } finally {
        setUploading(false);
      }
      return;
    }

    if (!file) { setMsg({ type: 'error', text: 'Please select a file.' }); return; }
    setUploading(true);
    setMsg({ type: '', text: '' });

    try {
      const compressedFile = await compressImage(file);
      const path = `gallery/${Date.now()}.webp`;
      const { error: upErr } = await supabase.storage.from('images').upload(path, compressedFile);
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);
      const url = urlData.publicUrl;

      const nextOrder = items.length > 0 ? Math.max(...items.map(i => i.display_order)) + 1 : 1;
      const { error: dbErr } = await supabase.from('media_items').insert([{ type, url, caption, display_order: nextOrder }]);
      if (dbErr) throw dbErr;

      setMsg({ type: 'success', text: 'Media added!' });
      setFile(null); setPreview(null); setCaption(''); setType('image');
      if (fileRef.current) fileRef.current.value = '';
      fetchItems();
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : JSON.stringify(err);
      setMsg({ type: 'error', text: errorMessage });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (!confirm('Delete this media item?')) return;
    try {
      if (item.type !== 'embed' && item.url.includes('/images/')) {
        const path = item.url.split('/images/')[1];
        if (path) {
          await supabase.storage.from('images').remove([path]);
        }
      }
      const { error } = await supabase.from('media_items').delete().eq('id', item.id);
      if (error) throw error;
      fetchItems();
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : JSON.stringify(err));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <Image size={20} className="text-green-500" /> Media Gallery
      </h2>

      <form onSubmit={handleAdd} className="border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-5 mb-6 space-y-4">
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Add New Media</p>

        {msg.text && (
          <div className={`text-sm p-3 rounded-lg ${msg.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
            {msg.text}
          </div>
        )}

        <div className="flex gap-3">
          {(['image', 'video', 'embed'] as const).map(t => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${type === t ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-green-400'}`}>
              {t === 'image' ? '🖼️ Image' : t === 'video' ? '▶️ Video' : '🔗 Embed Link'}
            </button>
          ))}
        </div>

        {type === 'embed' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Paste URL</label>
            <div className="relative">
              <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="url" value={embedUrl} onChange={e => handleEmbedUrlChange(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or https://x.com/.../status/... or https://instagram.com/p/..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 outline-none dark:text-white" />
            </div>
            {embedPreview && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center gap-3">
                <span className="text-lg">{embedPreview.platform === 'youtube' ? '▶️' : embedPreview.platform === 'x' ? '🐦' : '📸'}</span>
                <div>
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400 capitalize">{embedPreview.platform} link detected</p>
                  <p className="text-xs text-green-600/70 dark:text-green-500/70">Will embed and play live on the website</p>
                </div>
              </div>
            )}
            {embedUrl && !embedPreview && (
              <p className="mt-2 text-xs text-red-500">Unsupported URL. Use YouTube, X (Twitter), or Instagram links.</p>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload File</label>
            {preview ? (
              <div className="relative w-32 h-32">
                <img src={preview} alt="preview" className="w-full h-full object-cover rounded-lg" />
                <button type="button" onClick={() => { setFile(null); setPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer hover:border-green-400 transition-colors bg-gray-50 dark:bg-gray-800">
                <Upload size={20} className="text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Click to upload</span>
                <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
              </label>
            )}
          </div>
        )}

        <input type="text" value={caption} onChange={e => setCaption(e.target.value)}
          placeholder="Caption (optional)"
          className="w-full px-4 py-2 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 outline-none dark:text-white" />

        <button type="submit" disabled={uploading}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60 transition-colors">
          {uploading ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : <><Plus size={16} /> Add Media</>}
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-green-500" size={28} /></div>
      ) : items.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">No media items yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="relative group rounded-xl overflow-hidden aspect-square bg-gray-100 dark:bg-gray-800">
              {item.type === 'embed' ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900">
                  {item.platform === 'youtube' && item.url ? (
                    <img src={item.url} alt={item.caption || ''} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-4xl">{item.platform === 'x' ? '🐦' : item.platform === 'instagram' ? '📸' : '▶️'}</div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                      <Play size={16} className="text-gray-900 ml-0.5" />
                    </div>
                  </div>
                </div>
              ) : (
                <img src={item.url} alt={item.caption || ''} className="w-full h-full object-cover" />
              )}
              {item.type === 'video' && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center pl-0.5">▶</div>
                </div>
              )}
              {item.type === 'embed' && (
                <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  {item.platform}
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                {item.caption && <p className="text-white text-xs px-2 text-center">{item.caption}</p>}
                <button onClick={() => handleDelete(item)}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ─── Reviews Section ───────────────────────────────────────────────────────────

function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [form, setForm] = useState({ name: '', role: '', content: '', rating: 5 });
  const [activeTab, setActiveTab] = useState<'published' | 'pending'>('published');

  const fetchReviews = async () => {
    setLoading(true);
    const { data } = await supabase.from('reviews').select('*').order('display_order');
    setReviews(data || []);
    setLoading(false);
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchReviews();
    });
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.content) { setMsg({ type: 'error', text: 'Name and review content are required.' }); return; }
    setSaving(true);
    setMsg({ type: '', text: '' });

    const nextOrder = reviews.length > 0 ? Math.max(...reviews.map(r => r.display_order)) + 1 : 1;
    const { error } = await supabase.from('reviews').insert([{ ...form, display_order: nextOrder, approved: true, origin: 'manual' }]);

    if (error) { setMsg({ type: 'error', text: error.message }); }
    else { setMsg({ type: 'success', text: 'Review added!' }); setForm({ name: '', role: '', content: '', rating: 5 }); fetchReviews(); }
    setSaving(false);
  };

  const handleApprove = async (id: string) => {
    try {
      const nextOrder = reviews.length > 0 ? Math.max(...reviews.map(r => r.display_order)) + 1 : 1;
      const { error } = await supabase
        .from('reviews')
        .update({ approved: true, display_order: nextOrder })
        .eq('id', id);
      if (error) throw error;
      fetchReviews();
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : JSON.stringify(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
      fetchReviews();
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : JSON.stringify(err));
    }
  };

  const publishedReviews = reviews.filter(r => r.approved !== false);
  const pendingReviews = reviews.filter(r => r.approved === false);
  const activeReviews = activeTab === 'published' ? publishedReviews : pendingReviews;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <MessageSquare size={20} className="text-green-500" /> Client Reviews
      </h2>

      {/* Office QR Code Generator Widget */}
      <div className="border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-8 bg-gray-50/50 dark:bg-gray-800/10 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping shrink-0" />
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Office QR Code Generator</p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          Print this QR code and paste it in your office/store. Customers can scan it with their phone to instantly open the feedback form.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
          <div className="bg-white p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm shrink-0">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/review`)}`}
              alt="Office QR Code"
              className="w-36 h-36"
            />
          </div>
          <div className="space-y-3.5 w-full">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Feedback Link URL</p>
              <div className="text-xs font-mono bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 break-all select-all dark:text-gray-300">
                {window.location.origin}/review
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(`${window.location.origin}/review`)}`;
                  const response = await fetch(qrUrl);
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'krishi_vikas_review_qr.png';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                } catch (err) {
                  console.error('Failed to download QR code', err);
                }
              }}
              className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shadow-sm shadow-green-600/10 active:scale-98"
            >
              <Upload size={14} className="rotate-180" /> Download QR Image (PNG)
            </button>
          </div>
        </div>
      </div>


      {/* Manual Add Form */}
      <form onSubmit={handleAdd} className="border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-5 mb-6 space-y-4">
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Add Manually</p>

        {msg.text && (
          <div className={`text-sm p-3 rounded-lg ${msg.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
            {msg.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Client Name *"
            className="w-full px-4 py-2.5 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 outline-none dark:text-white" />
          <input type="text" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
            placeholder="Role / Location (e.g. Rice Mill Owner, UP)"
            className="w-full px-4 py-2.5 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 outline-none dark:text-white" />
        </div>

        <textarea rows={3} required value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          placeholder="Review content *"
          className="w-full px-4 py-2.5 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 outline-none dark:text-white" />

        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Rating</p>
          <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
        </div>

        <button type="submit" disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60 transition-colors">
          {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Plus size={16} /> Add Review</>}
        </button>
      </form>

      {/* Tabs Header */}
      <div className="flex gap-2 border-b border-gray-100 dark:border-gray-800 mb-6 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('published')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'published'
              ? 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400'
              : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Published ({publishedReviews.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
              : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Pending Queue ({pendingReviews.length})
          {pendingReviews.length > 0 && (
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold animate-pulse">
              {pendingReviews.length}
            </span>
          )}
        </button>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-green-500" size={28} /></div>
      ) : activeReviews.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">
          {activeTab === 'published' 
            ? 'No published reviews yet. Import from Google or add manually.' 
            : 'No pending reviews in the queue.'}
        </p>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {activeReviews.map(r => (
              <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-400 font-bold shrink-0">
                  {r.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} className={i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 dark:text-gray-700'} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-1.5 line-clamp-2">"{r.content}"</p>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    {r.name}
                    {r.origin === 'qr' && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-md font-medium uppercase tracking-wider">
                        QR Code
                      </span>
                    )}
                  </p>
                  {r.role && <p className="text-xs text-gray-400">{r.role}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {activeTab === 'pending' && (
                    <button onClick={() => handleApprove(r.id)} title="Approve Review"
                      className="text-green-500 hover:text-green-600 p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors animate-bounce">
                      <Check size={16} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(r.id)} title="Delete Review"
                    className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ManageMediaReviews() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Media & Reviews</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
          Manage the gallery images/videos and client testimonials shown on the homepage.
        </p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <MediaSection />
        <ReviewsSection />
      </div>
    </motion.div>
  );
}
