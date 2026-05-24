import { useEffect, useState } from 'react';
import { Package, Star, Megaphone, Image, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Stat {
  title: string;
  value: number | null;
  icon: React.ReactNode;
  loading: boolean;
  error: boolean;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stat[]>([
    { title: 'Total Products', value: null, icon: <Package className="w-8 h-8 text-blue-500" />, loading: true, error: false },
    { title: 'Reviews', value: null, icon: <Star className="w-8 h-8 text-yellow-500" />, loading: true, error: false },
    { title: 'Active Campaigns', value: null, icon: <Megaphone className="w-8 h-8 text-purple-500" />, loading: true, error: false },
    { title: 'Media Items', value: null, icon: <Image className="w-8 h-8 text-green-500" />, loading: true, error: false },
  ]);

  const fetchCounts = async () => {
    const results = await Promise.allSettled([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('reviews').select('*', { count: 'exact', head: true }),
      supabase.from('popup_campaigns').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('media_items').select('*', { count: 'exact', head: true }),
    ]);

    setStats(prev => prev.map((stat, i) => {
      const res = results[i];
      if (res.status === 'fulfilled') {
        return { ...stat, value: res.value.count, loading: false, error: false };
      }
      return { ...stat, loading: false, error: true };
    }));
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Welcome to your Krishi Vikas control panel.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`animate-fade-in-up stagger-${index + 1} bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
                {stat.loading ? (
                  <Loader2 className="animate-spin text-gray-400 mt-2" size={24} />
                ) : stat.error ? (
                  <p className="text-3xl font-bold text-red-400 mt-2">—</p>
                ) : (
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value ?? '—'}</p>
                )}
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 mt-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Manage your catalog easily using the sidebar options.</p>
      </div>
    </div>
  );
}
