import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Star, CheckCircle2, ChevronRight, MapPin, User, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry'
];

export default function SubmitReview() {
  const [form, setForm] = useState({ name: '', state: '', content: '', rating: 5 });
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.state || !form.content.trim()) {
      setError('Please fill in all the fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Find the current max display_order to append to the end
      const { data: existing } = await supabase
        .from('reviews')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1);
      const nextOrder = (existing?.[0]?.display_order || 0) + 1;

      const { error: insertErr } = await supabase.from('reviews').insert([
        {
          name: form.name.trim(),
          role: form.state, // We store state in the role field
          content: form.content.trim(),
          rating: form.rating,
          approved: false, // Must be false due to RLS constraint for public users
          origin: 'qr',
          display_order: nextOrder,
        },
      ]);

      if (insertErr) throw insertErr;
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : JSON.stringify(err);
      setError('Failed to submit feedback: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Krishi Vikas Udyog
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Share your experience with us
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-900 py-8 px-6 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-800 sm:px-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-500 to-emerald-600" />
          
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {error && (
                  <div className="p-3 text-sm bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/30">
                    {error}
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none dark:text-white transition-all"
                    />
                  </div>
                </div>

                {/* State */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    State / Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select
                      required
                      value={form.state}
                      onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none dark:text-white transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Select your state</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Rating
                  </label>
                  <div className="flex gap-2 justify-center py-2 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800/50">
                    {[1, 2, 3, 4, 5].map((s) => {
                      const isActive = s <= (hoveredRating !== null ? hoveredRating : form.rating);
                      return (
                        <button
                          key={s}
                          type="button"
                          onMouseEnter={() => setHoveredRating(s)}
                          onMouseLeave={() => setHoveredRating(null)}
                          onClick={() => setForm((prev) => ({ ...prev, rating: s }))}
                          className="p-1 transition-transform active:scale-95 duration-75"
                        >
                          <Star
                            size={32}
                            className={`transition-all ${
                              isActive
                                ? 'text-yellow-400 fill-yellow-400 scale-110 drop-shadow-sm'
                                : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Your Feedback
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3.5 top-4 text-gray-400" size={18} />
                    <textarea
                      required
                      rows={4}
                      value={form.content}
                      onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                      placeholder="Write your review here..."
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none dark:text-white transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-all shadow-md shadow-green-600/10 active:scale-98"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Submit Feedback <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-6 space-y-4"
              >
                <div className="flex justify-center">
                  <CheckCircle2 className="text-green-500 stroke-[1.5]" size={72} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Thank You!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed px-2">
                  Your feedback has been successfully submitted for review. It will be published on our website shortly once approved by the team.
                </p>
                <button
                  onClick={() => {
                    setForm({ name: '', state: '', content: '', rating: 5 });
                    setSubmitted(false);
                  }}
                  className="mt-4 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Submit Another Feedback
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
