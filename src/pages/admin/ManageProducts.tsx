import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Trash2, Edit, Plus, Loader2, Copy } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Product {
  id: number;
  title: string;
  description: string;
  image_url: string;
  category: string;
  product_code?: string;
}

export default function ManageProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchProducts();
    });
  }, []);


  const handleDelete = async (id: number, imageUrl: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      // Delete from DB
      const { error: dbError } = await supabase.from('products').delete().eq('id', id);
      if (dbError) throw dbError;

      // If there's an image, try to delete it from Storage
      if (imageUrl) {
        const filePath = imageUrl.split('/').pop();
        if (filePath) {
          await supabase.storage.from('images').remove([`products/${filePath}`]);
        }
      }

      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return;

      const { id: _id, created_at: _created_at, ...rest } = data;
      const { error: insertError } = await supabase
        .from('products')
        .insert([{ ...rest, title: `${data.title} (Copy)` }]);

      if (insertError) throw insertError;
      fetchProducts();
    } catch (error) {
      console.error('Error duplicating product:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Products</h1>
          <p className="mt-1 text-gray-500">View, edit, or delete your current products.</p>
        </div>
        <Link 
          to="/admin/products/add" 
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>Add Product</span>
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="animate-spin text-green-600" size={32} />
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p>No products found.</p>
            <Link to="/admin/products/add" className="text-green-600 hover:underline mt-2 inline-block">Add your first product</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {products.map((product, index) => (
                  <tr
                    key={product.id}
                    className={`animate-fade-in-up stagger-${Math.min(index + 1, 6)} hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 flex-shrink-0">
                          {product.image_url ? (
                            <img className="h-12 w-12 rounded-lg object-cover shadow-sm" src={product.image_url} alt="" />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No img</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900 dark:text-white">{product.title}</span>
                            {product.product_code && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-250/60 dark:border-gray-700">
                                {product.product_code}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link 
                          to={`/admin/products/edit/${product.id}`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 inline-block"
                        >
                          <Edit size={18} />
                        </Link>
                        <button 
                          onClick={() => handleDuplicate(product.id)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1"
                          title="Duplicate"
                        >
                          <Copy size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id, product.image_url)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
