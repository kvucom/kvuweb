import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Upload, X, Loader2, Plus, Trash2, LayoutGrid, Layers, Columns, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

type CategoryKey = 'rice-mill' | 'poultry-feed' | 'atta-chakki';
type LayoutMode = 'standard' | 'combo' | 'variants';

interface SpecField {
  key: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'select';
  options?: string[];
  required?: boolean;
}

const categorySpecFields: Record<CategoryKey, SpecField[]> = {
  'rice-mill': [
    { key: 'size', label: 'Size', placeholder: 'e.g. 6"' },
    { key: 'capacity', label: 'Capacity', placeholder: 'e.g. 1.5 - 2 Tons/Hr' },
    { key: 'material', label: 'Material', placeholder: 'e.g. Mild Steel' },
    { key: 'power', label: 'Power', placeholder: 'e.g. 15 HP' },
    { key: 'tank_capacity', label: 'Tank Capacity', placeholder: 'e.g. 100 kg' },
    { key: 'feature', label: 'Feature', placeholder: 'e.g. Single Screen' },
  ],
  'poultry-feed': [
    { key: 'capacity', label: 'Capacity', placeholder: 'e.g. 1.5 TON/Hr TO 2 TON/Hr' },
    { key: 'power', label: 'Required HP', placeholder: 'e.g. 25 HP' },
  ],
  'atta-chakki': [
    { key: 'capacity', label: 'Capacity', placeholder: 'e.g. 150 KG/H - 240 KG/H' },
    { key: 'power', label: 'Required HP', placeholder: 'e.g. 40 HP - 50 HP' },
  ],
};

const categories: { value: CategoryKey; label: string }[] = [
  { value: 'rice-mill',    label: 'Rice Mill' },
  { value: 'poultry-feed', label: 'Poultry Feed Plant' },
  { value: 'atta-chakki',  label: 'Atta Chakki & Oil Expeller' },
];

const EQUIPMENT_OPTIONS = [
  'FEED GRINDER',
  'FEED MIXER',
  'SCREW CONVEOR',
  'BUCKET ELEVETOR',
  'BATCH BIN',
  'CUSTOM'
];

const parseEquipmentString = (str: string) => {
  const prefixes = [
    'FEED GRINDER',
    'FEED MIXER',
    'SCREW CONVEOR',
    'SCREW CONVEYOR',
    'BUCKET ELEVETOR',
    'BUCKET ELEVATOR',
    'BATCH BIN'
  ];
  
  const upperStr = str.toUpperCase().trim();
  for (const prefix of prefixes) {
    if (upperStr.startsWith(prefix)) {
      let rest = str.substring(prefix.length).trim();
      if (rest.startsWith('-') || rest.startsWith(':')) {
        rest = rest.substring(1).trim();
      }
      let normalizedPrefix = prefix;
      if (prefix === 'SCREW CONVEYOR') normalizedPrefix = 'SCREW CONVEOR';
      if (prefix === 'BUCKET ELEVATOR') normalizedPrefix = 'BUCKET ELEVETOR';
      return { type: normalizedPrefix, details: rest };
    }
  }
  return { type: 'CUSTOM', details: str };
};

const buildEquipmentString = (type: string, details: string) => {
  if (type === 'CUSTOM') return details.trim();
  if (!details.trim()) return type;
  return `${type} - ${details.trim()}`;
};

interface ComboSection {
  title: string;
  specs: { label: string; value: string }[];
}

interface ProductVariant {
  variant_name: string;
  required_hp: string;
  equipment: { type: string; details: string }[];
}

const compressAndConvertToWebp = (file: File, maxWidth = 1200, quality = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt === 'gif' || file.type.startsWith('video/')) {
      return resolve(file);
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file);
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
              const compressedFile = new File([blob], newFileName, {
                type: 'image/webp',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

interface ImageItem {
  key: string;
  url: string;
  file?: File;
}

export default function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryKey | ''>('');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  const [productCode, setProductCode] = useState('');
  const [mediaItems, setMediaItems] = useState<ImageItem[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Layout mode
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('standard');

  // Specs state for standard mode
  const [standardSpecs, setStandardSpecs] = useState<Record<string, string>>({});

  // Specs state for combo (multi-section) mode
  const [comboSections, setComboSections] = useState<ComboSection[]>([]);

  // Variants state for tabbed variants mode
  const [variantsList, setVariantsList] = useState<ProductVariant[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) {
          setTitle(data.title || '');
          setCategory(data.category as CategoryKey || '');
          setDescription(data.description || '');
          setBadge(data.badge || '');
          setProductCode(data.product_code || 'KVU');
          let loadedImages: string[] = [];
          if (data.images && Array.isArray(data.images) && data.images.length > 0) {
            loadedImages = data.images;
          } else if (data.image_url) {
            loadedImages = [data.image_url];
          }
          setMediaItems(loadedImages.map((url: string) => ({ key: url, url })));

          interface DbVariant {
            variant_name?: string;
            required_hp?: string;
            equipment?: string[];
          }

          interface DbSpec {
            label: string;
            value: string;
            section_title?: string;
            specs?: { label: string; value: string }[];
          }

          // Detect layout mode and pre-fill spec states
          const variantsDb = (data.variants || []) as DbVariant[];
          const specsDb = (data.specs || []) as DbSpec[];

          if (variantsDb && Array.isArray(variantsDb) && variantsDb.length > 0) {
            setLayoutMode('variants');
            setVariantsList(variantsDb.map((v) => ({
              variant_name: v.variant_name || '',
              required_hp: v.required_hp || '',
              equipment: Array.isArray(v.equipment) 
                ? v.equipment.map((eStr: string) => parseEquipmentString(eStr)) 
                : []
            })));
          } else if (specsDb && Array.isArray(specsDb) && specsDb.length > 0 && 'section_title' in specsDb[0]) {
            setLayoutMode('combo');
            setComboSections(specsDb.map((s) => ({
              title: s.section_title || '',
              specs: Array.isArray(s.specs) ? s.specs : []
            })));
          } else {
            setLayoutMode('standard');
            // Reconstruct standard specs key-value map
            const fields = categorySpecFields[data.category as CategoryKey] || [];
            const tempSpecs: Record<string, string> = {};
            specsDb.forEach((s) => {
              const matchedField = fields.find(f => f.label === s.label);
              if (matchedField) {
                tempSpecs[matchedField.key] = s.value;
              } else {
                tempSpecs[s.label] = s.value;
              }
            });
            setStandardSpecs(tempSpecs);
          }
        }
      } catch (err: unknown) {
        console.error('Error loading product:', err);
        const errMsg = err instanceof Error ? err.message : String(err);
        setMessage({ type: 'error', text: `Failed to load product details: ${errMsg}` });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleCategoryChange = (val: CategoryKey | '') => {
    setCategory(val);
    setStandardSpecs({});
    
    if (val === 'rice-mill') {
      setLayoutMode('standard');
      setStandardSpecs({ size: '6"' });
    } else if (val === 'poultry-feed') {
      setLayoutMode('variants');
      setVariantsList([
        {
          variant_name: '',
          required_hp: '',
          equipment: [{ type: 'FEED GRINDER', details: '' }]
        }
      ]);
    } else if (val === 'atta-chakki') {
      setLayoutMode('combo');
      setComboSections([
        { title: 'ATTA CHAKKI', specs: [{ label: 'Size', value: '' }, { label: 'Capacity', value: '' }, { label: 'Required HP', value: '' }] },
        { title: 'OIL EXPELLER', specs: [{ label: 'No of Patti', value: '' }, { label: 'Capacity', value: '' }, { label: 'Required HP', value: '' }] }
      ]);
    }
  };

  const handleStandardSpecChange = (key: string, value: string) => {
    setStandardSpecs(prev => ({ ...prev, [key]: value }));
  };

  // Combo helper functions
  const addComboSection = () => {
    setComboSections([...comboSections, { title: 'NEW SECTION', specs: [{ label: '', value: '' }] }]);
  };

  const removeComboSection = (sIdx: number) => {
    setComboSections(comboSections.filter((_, idx) => idx !== sIdx));
  };

  const updateSectionTitle = (sIdx: number, title: string) => {
    const updated = [...comboSections];
    updated[sIdx].title = title;
    setComboSections(updated);
  };

  const addComboSpecRow = (sIdx: number) => {
    const updated = [...comboSections];
    updated[sIdx].specs.push({ label: '', value: '' });
    setComboSections(updated);
  };

  const removeComboSpecRow = (sIdx: number, rIdx: number) => {
    const updated = [...comboSections];
    updated[sIdx].specs = updated[sIdx].specs.filter((_, idx) => idx !== rIdx);
    setComboSections(updated);
  };

  const updateComboSpecValue = (sIdx: number, rIdx: number, key: 'label' | 'value', val: string) => {
    const updated = [...comboSections];
    updated[sIdx].specs[rIdx][key] = val;
    setComboSections(updated);
  };

  // Variants helper functions
  const addVariant = () => {
    setVariantsList([...variantsList, { variant_name: '', required_hp: '', equipment: [{ type: 'FEED GRINDER', details: '' }] }]);
  };

  const removeVariant = (vIdx: number) => {
    setVariantsList(variantsList.filter((_, idx) => idx !== vIdx));
  };

  const updateVariantField = (vIdx: number, field: 'variant_name' | 'required_hp', val: string) => {
    const updated = [...variantsList];
    updated[vIdx][field] = val;
    setVariantsList(updated);
  };

  const addEquipmentItem = (vIdx: number) => {
    const updated = [...variantsList];
    updated[vIdx].equipment.push({ type: 'FEED GRINDER', details: '' });
    setVariantsList(updated);
  };

  const removeEquipmentItem = (vIdx: number, eIdx: number) => {
    const updated = [...variantsList];
    updated[vIdx].equipment = updated[vIdx].equipment.filter((_, idx) => idx !== eIdx);
    setVariantsList(updated);
  };

  const updateEquipmentItem = (vIdx: number, eIdx: number, field: 'type' | 'details', val: string) => {
    const updated = [...variantsList];
    updated[vIdx].equipment[eIdx][field] = val;
    setVariantsList(updated);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
      const oversized = selectedFiles.filter(f => f.size > MAX_SIZE);
      if (oversized.length > 0) {
        setMessage({
          type: 'error',
          text: `File "${oversized[0].name}" is too large. Maximum allowed size is 5MB. Please upload a smaller image.`
        });
        return;
      }
      const newItems: ImageItem[] = selectedFiles.map(file => {
        const localUrl = URL.createObjectURL(file);
        return { key: localUrl, url: localUrl, file };
      });
      setMediaItems(prev => [...prev, ...newItems]);
    }
  };

  const removeFile = (idx: number) => {
    setMediaItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx) return;
    const reordered = [...mediaItems];
    const itemToMove = reordered[draggedIdx];
    reordered.splice(draggedIdx, 1);
    reordered.splice(idx, 0, itemToMove);
    setMediaItems(reordered);
    setDraggedIdx(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const uploadedUrls: string[] = [];

      if (mediaItems.length > 0) {
        for (const item of mediaItems) {
          if (item.file) {
            const compressedFile = await compressAndConvertToWebp(item.file);
            const fileExt = compressedFile.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `products/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('images')
              .upload(filePath, compressedFile);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
              .from('images')
              .getPublicUrl(filePath);

            uploadedUrls.push(publicUrlData.publicUrl);
          } else {
            uploadedUrls.push(item.url);
          }
        }
      }

      const imageUrl = uploadedUrls[0] || '';

      // Prepare specs/variants data based on layoutMode
      let specsDb: unknown[] = [];
      let variantsDb: unknown[] = [];

      if (layoutMode === 'standard') {
        specsDb = category
          ? categorySpecFields[category]
              .filter(f => standardSpecs[f.key]?.trim())
              .map(f => ({ label: f.label, value: standardSpecs[f.key].trim() }))
          : [];
      } else if (layoutMode === 'combo') {
        specsDb = comboSections
          .filter(s => s.title.trim())
          .map(s => ({
            section_title: s.title.trim(),
            specs: s.specs.filter(sp => sp.label.trim() && sp.value.trim())
          }));
      } else if (layoutMode === 'variants') {
        variantsDb = variantsList
          .filter(v => v.variant_name.trim())
          .map(v => ({
            variant_name: v.variant_name.trim(),
            required_hp: v.required_hp.trim(),
            equipment: v.equipment
              .map(e => buildEquipmentString(e.type, e.details))
              .filter(Boolean)
          }));
      }

      const { error: dbError } = await supabase
        .from('products')
        .update({
          title,
          category,
          description,
          image_url: imageUrl,
          images: uploadedUrls,
          badge: badge || null,
          product_code: productCode || null,
          specs: specsDb,
          variants: variantsDb
        })
        .eq('id', id);

      if (dbError) throw dbError;

      setMessage({ type: 'success', text: 'Product updated successfully! Redirecting...' });
      setTimeout(() => {
        navigate('/admin/products');
      }, 1500);
    } catch (error: unknown) {
      let errMsg = 'An unknown error occurred';
      if (error && typeof error === 'object' && error !== null) {
        errMsg = (error as { message?: string; details?: string }).message || (error as { message?: string; details?: string }).details || JSON.stringify(error);
      } else if (error instanceof Error) {
        errMsg = error.message;
      } else if (error) {
        errMsg = String(error);
      }

      if (errMsg.includes('exceeded the maximum allowed size') || errMsg.includes('Payload Too Large')) {
        errMsg = 'The selected image is too large. Please resize the image or select a file under 5MB.';
      }

      setMessage({ type: 'error', text: errMsg });
    } finally {
      setSaving(false);
    }
  };

  const getPhotoSizeRecommendation = (cat: string) => {
    switch (cat) {
      case 'poultry-feed':
        return 'Recommended: 16:9 Aspect Ratio (e.g., 1920x1080px or 1280x720px) for wide landscape gallery display.';
      case 'atta-chakki':
        return 'Recommended: 1:1 Aspect Ratio (Square, e.g., 1000x1000px or 800x800px) for square blueprints showcase.';
      case 'rice-mill':
        return 'Recommended: 4:3 or 16:9 Aspect Ratio (e.g., 800x600px or 1280x720px) for card display.';
      default:
        return 'PNG, JPG, WEBP up to 5MB each. Clear, high-resolution background-free images are recommended.';
    }
  };

  const currentFields = category ? categorySpecFields[category] : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center p-24 min-h-[50vh]">
        <Loader2 className="animate-spin text-green-600" size={40} />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto pb-12">
      <div className="flex items-center space-x-3 mb-6">
        <button onClick={() => navigate('/admin/products')}
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Product</h1>
          <p className="text-sm text-gray-500">Modify properties, layouts, and specifications of this product.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 md:p-8">
        {message.text && (
          <div className={`p-4 rounded-xl mb-6 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* 1. Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-semibold">Product Title <span className="text-red-500">*</span></label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-white"
              placeholder="e.g. Trolly Model Atta Chakki & Oil Expeller" />
          </div>

          {/* 2. Category, Badge & Product Code */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-semibold">Category <span className="text-red-500">*</span></label>
              <select required value={category} onChange={(e) => handleCategoryChange(e.target.value as CategoryKey | '')}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-white">
                <option value="" disabled>Select category</option>
                {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-semibold">Badge <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="text" value={badge} onChange={(e) => setBadge(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-white"
                placeholder="e.g. Hot Seller, Heavy Duty" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-semibold">Product Code <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="text" value={productCode} onChange={(e) => setProductCode(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-white"
                placeholder="e.g. KVUTKC-6" />
            </div>
          </div>

          {/* 3. Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-semibold">Description</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-white"
              placeholder="Describe the product features and application..." />
          </div>

          {/* Layout Mode Selection */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Specification Layout Mode</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'standard', label: 'Standard Specs', desc: 'Single list of features', icon: LayoutGrid },
                { id: 'combo', label: 'Combo / Multi-Section', desc: 'Side-by-side machine specs', icon: Columns },
                { id: 'variants', label: 'Multi-Variant (Tabs)', desc: 'Different capacities & items', icon: Layers }
              ].map(mode => {
                const Icon = mode.icon;
                const active = layoutMode === mode.id;
                return (
                  <button key={mode.id} type="button" onClick={() => setLayoutMode(mode.id as LayoutMode)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                      active
                        ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-400 ring-2 ring-green-500/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400'
                    }`}>
                    <Icon size={22} className="mb-2" />
                    <span className="text-xs font-bold block">{mode.label}</span>
                    <span className="text-[10px] opacity-70 block mt-1 leading-tight">{mode.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Specifications Editor */}
          <div className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
            {layoutMode === 'standard' && (
              <div>
                <h3 className="text-sm font-semibold mb-4 text-gray-800 dark:text-gray-200">Standard Specifications</h3>
                {category ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentFields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-xs font-medium text-gray-500 mb-1">{field.label} {field.required && '*'}</label>
                        {field.type === 'select' ? (
                          <select value={standardSpecs[field.key] || ''} onChange={(e) => handleStandardSpecChange(field.key, e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 outline-none dark:text-white">
                            <option value="">Select {field.label}</option>
                            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : (
                          <input type="text" value={standardSpecs[field.key] || ''} onChange={(e) => handleStandardSpecChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 outline-none dark:text-white" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Please select a category first to load templates.</p>
                )}
              </div>
            )}

            {layoutMode === 'combo' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Specification Sections</h3>
                  <button type="button" onClick={addComboSection}
                    className="flex items-center space-x-1.5 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium">
                    <Plus size={14} />
                    <span>Add Section</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {comboSections.map((section, sIdx) => (
                    <div key={sIdx} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 relative">
                      <button type="button" onClick={() => removeComboSection(sIdx)}
                        className="absolute top-4 right-4 text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1">
                        <Trash2 size={16} />
                      </button>

                      <div className="max-w-xs mb-4">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Section Title</label>
                        <input type="text" value={section.title} onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 outline-none font-bold rounded-lg dark:text-white"
                          placeholder="e.g. ATTA CHAKKI" />
                      </div>

                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-400 px-1">
                          <span>Spec Label</span>
                          <span>Spec Value</span>
                        </div>
                        {section.specs.map((spec, rIdx) => (
                          <div key={rIdx} className="flex items-center space-x-2">
                            <input type="text" value={spec.label} onChange={(e) => updateComboSpecValue(sIdx, rIdx, 'label', e.target.value)}
                              className="flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white"
                              placeholder="e.g. Capacity" />
                            <input type="text" value={spec.value} onChange={(e) => updateComboSpecValue(sIdx, rIdx, 'value', e.target.value)}
                              className="flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white"
                              placeholder="e.g. 150 KG/H" />
                            <button type="button" onClick={() => removeComboSpecRow(sIdx, rIdx)}
                              className="text-red-400 hover:text-red-600 p-1">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        <button type="button" onClick={() => addComboSpecRow(sIdx)}
                          className="mt-2 text-xs text-green-600 dark:text-green-500 font-semibold hover:underline flex items-center space-x-1">
                          <Plus size={12} />
                          <span>Add Spec Row</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {layoutMode === 'variants' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Product Variants</h3>
                  <button type="button" onClick={addVariant}
                    className="flex items-center space-x-1.5 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium">
                    <Plus size={14} />
                    <span>Add Variant</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {variantsList.map((variant, vIdx) => (
                    <div key={vIdx} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 relative">
                      <button type="button" onClick={() => removeVariant(vIdx)}
                        className="absolute top-4 right-4 text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1">
                        <Trash2 size={16} />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Variant Name (e.g. Capacity/Model) <span className="text-red-500">*</span></label>
                          <input type="text" value={variant.variant_name} onChange={(e) => updateVariantField(vIdx, 'variant_name', e.target.value)}
                            required
                            className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-bold dark:text-white"
                            placeholder="e.g. 0.75 TO 1 TON/Hr" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Required HP <span className="text-red-500">*</span></label>
                          <input type="text" value={variant.required_hp} onChange={(e) => updateVariantField(vIdx, 'required_hp', e.target.value)}
                            required
                            className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white"
                            placeholder="e.g. 14 HP" />
                        </div>
                      </div>

                      {/* Equipment/Component List */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-2">Equipment / Components List</label>
                        <div className="space-y-2">
                          {variant.equipment.map((equip, eIdx) => (
                            <div key={eIdx} className="flex items-center space-x-2">
                              <span className="text-xs text-gray-400 w-4 font-bold">{eIdx + 1}.</span>
                              
                              {/* Prefix Dropdown Selector */}
                              <select 
                                value={equip.type} 
                                onChange={(e) => updateEquipmentItem(vIdx, eIdx, 'type', e.target.value)}
                                className="w-1/3 px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white outline-none focus:ring-1 focus:ring-green-500 font-bold"
                              >
                                {EQUIPMENT_OPTIONS.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>

                              {/* Details / Specs Input */}
                              <input 
                                type="text" 
                                value={equip.details} 
                                onChange={(e) => updateEquipmentItem(vIdx, eIdx, 'details', e.target.value)}
                                className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white outline-none focus:ring-1 focus:ring-green-500"
                                placeholder={equip.type === 'CUSTOM' ? "e.g. FEED GRINDER - DOUBLE SCREEN" : "details e.g. - 4x4(500KGS) or 8x10"} 
                              />
                              
                              <button type="button" onClick={() => removeEquipmentItem(vIdx, eIdx)}
                                className="text-red-400 hover:text-red-600 p-1">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                          <button type="button" onClick={() => addEquipmentItem(vIdx)}
                            className="mt-2 text-xs text-green-600 dark:text-green-500 font-semibold hover:underline flex items-center space-x-1">
                            <Plus size={12} />
                            <span>Add Equipment Line</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Product Photos (Multiple)</label>
            {category && (
              <div className="mb-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-700 dark:text-blue-300 border border-blue-150/40 dark:border-blue-800/40 flex items-center gap-2">
                <span>💡</span>
                <span>{getPhotoSizeRecommendation(category)}</span>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              {mediaItems.map((item, idx) => (
                <div 
                  key={item.key} 
                  draggable 
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(idx)}
                  className={`relative aspect-video rounded-xl overflow-hidden border-2 shadow-sm bg-white dark:bg-gray-900 group cursor-move transition-all ${
                    draggedIdx === idx ? 'opacity-40 border-green-500 scale-95' : 'border-gray-200 dark:border-gray-800 hover:border-green-500/50'
                  }`}
                  title="Drag to reorder images"
                >
                  <img src={item.url} alt="Preview" className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <div className="absolute bottom-2 left-2 bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                      Cover
                    </div>
                  )}
                  <button type="button" onClick={() => removeFile(idx)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-md opacity-0 group-hover:opacity-100 duration-200">
                    <X size={14} />
                  </button>
                  <div className="absolute top-2 left-2 bg-black/50 text-white text-[8px] font-semibold px-1 rounded backdrop-blur-sm pointer-events-none opacity-60">
                    {idx + 1}
                  </div>
                </div>
              ))}
              <label className="flex flex-col items-center justify-center aspect-video rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-all">
                <Upload className="h-6 w-6 text-gray-400 mb-1" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Add Photo</span>
                <input type="file" className="sr-only" accept="image/*" multiple onChange={handleImageChange} />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">Manage product images. Upload multiple files. PNG, JPG, WEBP up to 5MB each.</p>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <button type="submit" disabled={saving}
              className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-70 transition-colors shadow-sm">
              {saving ? <><Loader2 className="animate-spin mr-2" size={20} /> Saving Changes...</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
