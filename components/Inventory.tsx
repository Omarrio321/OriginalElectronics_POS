
import React, { useState } from 'react';
import { Product } from '../types';
import { Edit2, Trash2, Plus, Search, Upload, X, Image as ImageIcon, RefreshCw, Barcode } from 'lucide-react';

interface InventoryProps {
  products: Product[];
  categories: string[];
  onAddProduct: (p: Product) => void;
  onUpdateProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
}

const Inventory: React.FC<InventoryProps> = ({ products, categories, onAddProduct, onUpdateProduct, onDeleteProduct }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const emptyProduct: Product = {
    id: '',
    name: '',
    category: categories[0] || 'Other',
    barcode: '',
    sku: '',
    buyingPrice: 0,
    sellingPrice: 0,
    quantity: 0,
    minStockLevel: 5,
    imageUrl: ''
  };

  const [formData, setFormData] = useState<Product>(emptyProduct);

  const generateSKU = () => {
    return `OE-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      onUpdateProduct(formData);
    } else {
      onAddProduct({ ...formData, id: Date.now().toString() });
    }
    closeModal();
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ 
      ...emptyProduct, 
      category: categories[0] || 'Other',
      sku: generateSKU()
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size is too large. Please upload an image smaller than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
        <button onClick={openAddModal} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors font-medium">
          <Plus size={20} /> Add Product
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
        <Search className="text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search by name or SKU..." 
          className="flex-1 outline-none text-gray-700 text-sm md:text-base py-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Desktop Table View (Hidden on Mobile) */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1 overflow-y-auto">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">SKU / Barcode</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Stock</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Cost</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Price</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={16} className="text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 line-clamp-1">{product.name}</div>
                      <div className="text-xs text-gray-500">{product.brand}</div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">{product.category}</span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    <div className="font-mono font-medium">{product.sku}</div>
                    <div className="text-xs text-gray-400">{product.barcode || 'No Barcode'}</div>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${product.quantity <= product.minStockLevel ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {product.quantity}
                    </span>
                  </td>
                  <td className="p-4 text-right text-sm text-gray-600">${product.buyingPrice}</td>
                  <td className="p-4 text-right text-sm font-bold text-gray-900">${product.sellingPrice}</td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button type="button" onClick={() => openEditModal(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
                      <button 
                        type="button"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this product?')) {
                            onDeleteProduct(product.id);
                          }
                        }} 
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View (Visible only on Mobile) */}
      <div className="md:hidden space-y-3 pb-24">
         {filteredProducts.map(product => (
           <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-3">
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                 {product.imageUrl ? (
                   <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={24}/></div>
                 )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                 <div>
                    <div className="flex justify-between items-start">
                       <h3 className="font-bold text-gray-800 text-sm line-clamp-2 leading-tight">{product.name}</h3>
                       <div className="flex gap-1 pl-2">
                          <button type="button" onClick={() => openEditModal(product)} className="p-1.5 text-blue-600 bg-blue-50 rounded"><Edit2 size={14}/></button>
                          <button 
                            type="button"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this product?')) {
                                onDeleteProduct(product.id);
                              }
                            }} 
                            className="p-1.5 text-red-600 bg-red-50 rounded"
                          >
                            <Trash2 size={14}/>
                          </button>
                       </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{product.sku}</p>
                 </div>
                 <div className="flex justify-between items-end mt-2">
                    <div className="flex flex-col">
                       <span className="text-[10px] text-gray-400 uppercase">Price</span>
                       <span className="font-bold text-blue-600">${product.sellingPrice}</span>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-[10px] text-gray-400 uppercase">Stock</span>
                       <span className={`px-2 py-0.5 rounded text-xs font-bold ${product.quantity <= product.minStockLevel ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                         {product.quantity}
                       </span>
                    </div>
                 </div>
              </div>
           </div>
         ))}
      </div>

      {/* Add/Edit Modal (Responsive) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm">
          <div className="bg-white w-full md:max-w-2xl h-[90vh] md:h-auto md:max-h-[90vh] rounded-t-2xl md:rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
            
            <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl md:rounded-t-xl shrink-0">
              <h2 className="text-lg md:text-xl font-bold text-gray-800">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button type="button" onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
               <form id="productForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Image Upload */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors relative bg-gray-50/50 min-h-[120px]">
                      {formData.imageUrl ? (
                        <div className="relative h-32 md:h-48 w-full flex justify-center">
                          <img src={formData.imageUrl} alt="Preview" className="h-full object-contain rounded-md" />
                          <button 
                            type="button"
                            onClick={() => setFormData({...formData, imageUrl: ''})}
                            className="absolute top-0 right-0 bg-red-500 text-white p-1.5 rounded-full shadow-sm"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center py-4">
                          <Upload size={24} className="text-blue-500 mb-2"/>
                          <span className="text-sm font-medium text-gray-700">Tap to upload</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    <input required type="text" className="w-full border rounded-lg p-3 text-base" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select className="w-full border rounded-lg p-3 bg-white text-base" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <input type="text" className="w-full border rounded-lg p-3 text-base" value={formData.brand || ''} onChange={e => setFormData({...formData, brand: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
                        <input required type="number" inputMode="decimal" step="0.01" className="w-full border rounded-lg p-3 text-base" value={formData.buyingPrice} onChange={e => setFormData({...formData, buyingPrice: parseFloat(e.target.value)})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                        <input required type="number" inputMode="decimal" step="0.01" className="w-full border rounded-lg p-3 text-base font-bold text-blue-600" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: parseFloat(e.target.value)})} />
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock Qty</label>
                        <input required type="number" inputMode="numeric" className="w-full border rounded-lg p-3 text-base" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Low Alert</label>
                        <input required type="number" inputMode="numeric" className="w-full border rounded-lg p-3 text-base" value={formData.minStockLevel} onChange={e => setFormData({...formData, minStockLevel: parseInt(e.target.value)})} />
                      </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                    <div className="relative">
                       <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20}/>
                       <input type="text" inputMode="numeric" className="w-full border rounded-lg pl-10 p-3 text-base" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} placeholder="Scan..." />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                    <div className="relative">
                      <input type="text" readOnly className="w-full border rounded-lg p-3 bg-gray-100 text-gray-500 font-mono text-sm" value={formData.sku} />
                      {!editingProduct && (
                        <button type="button" onClick={() => setFormData({...formData, sku: generateSKU()})} className="absolute right-2 top-2 p-1 text-gray-400">
                          <RefreshCw size={16} />
                        </button>
                      )}
                    </div>
                  </div>
               </form>
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-3 bg-white shrink-0 safe-area-bottom">
               <button type="button" onClick={closeModal} className="flex-1 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Cancel</button>
               <button type="submit" form="productForm" className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md">Save Product</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
