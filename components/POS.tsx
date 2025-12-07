
import React, { useState, useEffect, useRef } from 'react';
import { Product, CartItem, User, Discount } from '../types';
import { Search, ShoppingCart, Trash2, Plus, Minus, Banknote, Smartphone, Receipt, ScanBarcode, Share2, Printer, CheckCircle, Tag, Percent, DollarSign, X, ChevronUp, ChevronDown } from 'lucide-react';

interface POSProps {
  products: Product[];
  categories: string[];
  currentUser: User;
  onProcessSale: (items: CartItem[], subtotal: number, cartDiscount: Discount | undefined, total: number, paymentMethod: 'CASH' | 'ZAAD' | 'EDAHAB') => void;
}

interface CompletedSale {
  items: CartItem[];
  subtotal: number;
  discount?: Discount;
  total: number;
  paymentMethod: string;
  date: Date;
  id: string;
}

const POS: React.FC<POSProps> = ({ products, categories: appCategories, currentUser, onProcessSale }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDiscount, setCartDiscount] = useState<Discount | undefined>(undefined);
  
  // UI States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);
  const [discountModalTarget, setDiscountModalTarget] = useState<'CART' | string | null>(null);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false); // Mobile Only
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  const categories = ['All', ...appCategories];

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.barcode.includes(searchQuery) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle barcode scan
  useEffect(() => {
    const exactMatch = products.find(p => p.barcode === searchQuery && p.barcode !== '');
    if (exactMatch) {
      addToCart(exactMatch);
      setSearchQuery('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const addToCart = (product: Product) => {
    if (product.quantity === 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.cartQuantity >= product.quantity) return prev;
        return prev.map(item => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item);
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = item.cartQuantity + delta;
        if (newQty > 0 && newQty <= item.quantity) {
          return { ...item, cartQuantity: newQty };
        }
      }
      return item;
    }));
  };

  const applyItemDiscount = (productId: string, discount: Discount | undefined) => {
    setCart(prev => prev.map(item => item.id === productId ? { ...item, discount } : item));
  };

  // --- Calculations ---
  const getItemTotal = (item: CartItem) => {
    let total = item.sellingPrice * item.cartQuantity;
    if (item.discount) {
      if (item.discount.type === 'FIXED') {
        total = Math.max(0, total - item.discount.value);
      } else {
        total = total * (1 - item.discount.value / 100);
      }
    }
    return total;
  };

  const calculateCartTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + getItemTotal(item), 0);
    let total = subtotal;
    let discountAmount = 0;

    if (cartDiscount) {
      if (cartDiscount.type === 'FIXED') {
        discountAmount = cartDiscount.value;
        total = Math.max(0, total - cartDiscount.value);
      } else {
        discountAmount = total * (cartDiscount.value / 100);
        total = total - discountAmount;
      }
    }

    return { subtotal, total, discountAmount };
  };

  const { subtotal, total, discountAmount } = calculateCartTotals();

  const handleCheckout = (method: 'CASH' | 'ZAAD' | 'EDAHAB') => {
    onProcessSale(cart, subtotal, cartDiscount, total, method);
    
    setCompletedSale({
      items: [...cart],
      subtotal,
      discount: cartDiscount,
      total,
      paymentMethod: method,
      date: new Date(),
      id: Date.now().toString().slice(-6)
    });

    setCart([]);
    setCartDiscount(undefined);
    setShowPaymentModal(false);
    setIsMobileCartOpen(false);
  };

  // Printing & Sharing Logic
  const handlePrintReceipt = () => {
    if (!completedSale) return;
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      const f = (n: number) => `$${n.toFixed(2)}`;
      const itemsHtml = completedSale.items.map(item => {
        const originalTotal = item.sellingPrice * item.cartQuantity;
        let finalItemTotal = originalTotal;
        let discountInfo = '';

        if (item.discount) {
           if (item.discount.type === 'FIXED') {
             finalItemTotal = Math.max(0, originalTotal - item.discount.value);
             discountInfo = `<br><span style="font-size:0.8em; color: gray;">(Disc: -$${item.discount.value})</span>`;
           } else {
             finalItemTotal = originalTotal * (1 - item.discount.value / 100);
             discountInfo = `<br><span style="font-size:0.8em; color: gray;">(Disc: -${item.discount.value}%)</span>`;
           }
        }
        return `
          <div class="item">
            <span>${item.cartQuantity}x ${item.name}</span>
            <div style="text-align:right">
               ${item.discount ? `<s style="font-size:0.8em; color:gray">${f(originalTotal)}</s> ` : ''}
               <span>${f(finalItemTotal)}</span>
               ${discountInfo}
            </div>
          </div>
        `;
      }).join('');

      let globalDiscountHtml = '';
      if (completedSale.discount) {
         const label = completedSale.discount.type === 'PERCENTAGE' ? `${completedSale.discount.value}%` : f(completedSale.discount.value);
         globalDiscountHtml = `
           <div class="item" style="color: gray;">
             <span>Subtotal</span>
             <span>${f(completedSale.subtotal)}</span>
           </div>
           <div class="item" style="color: gray;">
             <span>Cart Discount</span>
             <span>-${label}</span>
           </div>
         `;
      }

      const htmlContent = `
        <html>
          <head>
            <title>Receipt #${completedSale.id}</title>
            <style>
              body { font-family: 'Courier New', monospace; padding: 20px; max-width: 350px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 20px; }
              .item { display: flex; justify-content: space-between; margin-bottom: 5px; align-items: flex-start; }
              .divider { border-top: 1px dashed #000; margin: 10px 0; }
              .total { display: flex; justify-content: space-between; font-weight: bold; margin-top: 10px; font-size: 1.2em; }
              @media print {
                 body { width: 100%; margin: 0; padding: 0; }
                 @page { margin: 0; size: auto; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h3>Original Electronics</h3>
              <p>Receipt #${completedSale.id}</p>
              <p>${completedSale.date.toLocaleString()}</p>
            </div>
            <div class="divider"></div>
            ${itemsHtml}
            <div class="divider"></div>
            ${globalDiscountHtml}
            <div class="total">
              <span>TOTAL</span>
              <span>${f(completedSale.total)}</span>
            </div>
            <div style="text-align: center; margin-top: 20px;">
              <p>Payment: ${completedSale.paymentMethod}</p>
              <p>Cashier: ${currentUser.name}</p>
              <p>Thank you for shopping!</p>
            </div>
          </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const handleWhatsAppShare = () => {
    if (!completedSale) return;
    
    const nl = '%0A'; // URL Encoded New Line
    const line = '━━━━━━━━━━━━━━━━━━━━';
    
    // --- Header ---
    let msg = `*ORIGINAL ELECTRONICS* 📱${nl}`;
    msg += `_Official Digital Receipt_${nl}${nl}`;
    
    // --- Metadata ---
    msg += `📅 Date: ${completedSale.date.toLocaleDateString()} ${completedSale.date.toLocaleTimeString()}${nl}`;
    msg += `📄 Receipt: #${completedSale.id}${nl}`;
    msg += `👤 Cashier: ${currentUser.name}${nl}`;
    msg += `${line}${nl}`;
    
    // --- Items ---
    completedSale.items.forEach(item => {
        let itemTotal = item.sellingPrice * item.cartQuantity;
        if (item.discount) {
            if (item.discount.type === 'FIXED') {
                itemTotal = Math.max(0, itemTotal - item.discount.value);
            } else {
                itemTotal = itemTotal * (1 - item.discount.value / 100);
            }
        }
        msg += `*${item.cartQuantity}x* ${item.name}${nl}`;
        msg += `   └ $${itemTotal.toFixed(2)}${nl}`;
    });
    
    msg += `${line}${nl}`;
    
    // --- Financials ---
    if (completedSale.discount || completedSale.subtotal > completedSale.total) {
        msg += `*Subtotal:* $${completedSale.subtotal.toFixed(2)}${nl}`;
        const savings = completedSale.subtotal - completedSale.total;
        msg += `*Savings:* -$${savings.toFixed(2)}${nl}`;
    }
    
    msg += `*TOTAL AMOUNT:* $${completedSale.total.toFixed(2)}${nl}`;
    msg += `${line}${nl}`;
    
    // --- Payment Info ---
    msg += `💳 *Payment:* ${completedSale.paymentMethod}${nl}`;
    msg += `✅ *Status:* Paid${nl}${nl}`;
    
    // --- Footer ---
    msg += `🙏 Thank you for shopping with us!${nl}`;
    msg += `🌐 Visit us again soon!`;

    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  // --- RENDER HELPERS ---
  
  const CartContent = () => (
    <div className="flex flex-col h-full bg-white">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ShoppingCart size={20} /> Current Sale
          </h2>
          <div className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
             {currentUser.name}
          </div>
          {/* Mobile Close Button */}
          <button onClick={() => setIsMobileCartOpen(false)} className="md:hidden p-2 text-gray-500">
             <X size={24} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart size={48} className="mb-4 opacity-20" />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map(item => {
              const itemTotal = getItemTotal(item);
              const originalTotal = item.sellingPrice * item.cartQuantity;
              const hasDiscount = itemTotal < originalTotal;

              return (
                <div key={item.id} className="flex gap-3 items-center relative group pb-3 border-b border-gray-50 last:border-0">
                  <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    {item.imageUrl && <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-gray-800 line-clamp-1">{item.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                       <span>${item.sellingPrice} x {item.cartQuantity}</span>
                       {hasDiscount && (
                         <span className="text-green-600 bg-green-50 px-1 rounded text-[10px] font-bold">
                           {item.discount?.type === 'PERCENTAGE' ? `-${item.discount.value}%` : `-$${item.discount?.value}`}
                         </span>
                       )}
                    </div>
                  </div>
                  
                  {/* Qty Controls */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-2 bg-gray-100 rounded text-gray-600 active:bg-gray-200"><Minus size={14}/></button>
                    <span className="font-medium text-sm w-4 text-center">{item.cartQuantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-2 bg-gray-100 rounded text-gray-600 active:bg-gray-200"><Plus size={14}/></button>
                  </div>

                  {/* Price & Actions */}
                  <div className="text-right min-w-[60px]">
                    {hasDiscount && <div className="text-xs text-gray-400 line-through">${originalTotal.toFixed(2)}</div>}
                    <div className="font-bold text-sm">${itemTotal.toFixed(2)}</div>
                    
                    <div className="flex justify-end gap-2 mt-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                       <button onClick={() => setDiscountModalTarget(item.id)} className="text-blue-500 bg-blue-50 p-1 rounded"><Tag size={12}/></button>
                       <button onClick={() => removeFromCart(item.id)} className="text-red-500 bg-red-50 p-1 rounded"><Trash2 size={12}/></button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="space-y-2 mb-4">
             {cartDiscount && (
                <div className="flex justify-between text-sm text-green-600">
                  <span className="flex items-center gap-1"><Tag size={12}/> Cart Discount ({cartDiscount.type === 'PERCENTAGE' ? `${cartDiscount.value}%` : `$${cartDiscount.value}`})</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
             )}
             <div className="flex justify-between items-center text-gray-500">
               <span>Subtotal</span>
               <span>${subtotal.toFixed(2)}</span>
             </div>
             <div className="flex justify-between items-center text-xl font-bold text-gray-900">
               <span>Total</span>
               <span>${total.toFixed(2)}</span>
             </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button 
              onClick={() => setDiscountModalTarget('CART')}
              disabled={cart.length === 0}
              className="col-span-1 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center disabled:opacity-50"
              title="Apply Cart Discount"
            >
              <Tag size={18} />
            </button>
            <button 
              disabled={cart.length === 0}
              onClick={() => setShowPaymentModal(true)}
              className="col-span-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              Checkout <Receipt size={18} />
            </button>
          </div>
        </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col md:flex-row bg-gray-100 overflow-hidden relative">
      {/* Left Side: Product Catalog */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header/Search */}
        <div className="bg-white p-4 shadow-sm z-10 shrink-0">
          <div className="flex flex-col gap-3">
             <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder="Scan or search..." 
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  // Don't auto focus on mobile to prevent keyboard popping up immediately
                  autoFocus={window.innerWidth > 768} 
                />
                <ScanBarcode className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 opacity-50" size={20} />
             </div>
             <div className="flex gap-2 overflow-x-auto w-full pb-1 hide-scroll">
               {categories.map(cat => (
                 <button 
                   key={cat}
                   onClick={() => setSelectedCategory(cat)}
                   className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                 >
                   {cat}
                 </button>
               ))}
             </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 md:pb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {filteredProducts.map(product => (
              <button 
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.quantity === 0}
                className={`bg-white p-2 md:p-3 rounded-xl border hover:shadow-md transition-shadow text-left flex flex-col h-full relative group ${product.quantity === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer border-gray-100'}`}
              >
                <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden relative">
                   {product.imageUrl ? (
                     <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                   )}
                   {product.quantity === 0 && (
                     <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                       <span className="bg-red-500 text-white text-[10px] md:text-xs px-2 py-1 rounded font-bold">OUT OF STOCK</span>
                     </div>
                   )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-xs md:text-sm leading-tight mb-1 line-clamp-2">{product.name}</h3>
                </div>
                <div className="flex justify-between items-end mt-2">
                  <span className="font-bold text-blue-600 text-sm md:text-base">${product.sellingPrice}</span>
                  <span className="text-[10px] md:text-xs text-gray-400">{product.quantity} left</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Cart: Fixed Side Panel */}
      <div className="hidden md:flex w-96 bg-white border-l border-gray-200 flex-col h-full shadow-xl z-20">
         <CartContent />
      </div>

      {/* Mobile Cart: Sticky Bottom Bar + Modal */}
      <div className="md:hidden">
         {cart.length > 0 && !isMobileCartOpen && (
           <div className="fixed bottom-20 left-4 right-4 bg-blue-600 text-white rounded-xl shadow-2xl p-4 flex justify-between items-center z-30 animate-in slide-in-from-bottom-5 cursor-pointer" onClick={() => setIsMobileCartOpen(true)}>
              <div className="flex items-center gap-3">
                 <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center font-bold">
                    {cart.reduce((acc, i) => acc + i.cartQuantity, 0)}
                 </div>
                 <div>
                    <p className="text-xs opacity-90">Total</p>
                    <p className="font-bold text-lg">${total.toFixed(2)}</p>
                 </div>
              </div>
              <div className="flex items-center gap-1 font-bold text-sm bg-white/10 px-3 py-1.5 rounded-lg">
                 View Cart <ChevronUp size={16} />
              </div>
           </div>
         )}

         {/* Full Screen Cart Modal for Mobile */}
         {isMobileCartOpen && (
           <div className="fixed inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-bottom duration-300">
              <CartContent />
           </div>
         )}
      </div>

      {/* --- MODALS (Shared) --- */}

      {/* Discount Modal */}
      {discountModalTarget && (
        <DiscountModal 
          initialValue={discountModalTarget === 'CART' ? cartDiscount : cart.find(c => c.id === discountModalTarget)?.discount}
          onApply={(discount) => {
             if (discountModalTarget === 'CART') {
               setCartDiscount(discount);
             } else {
               applyItemDiscount(discountModalTarget, discount);
             }
             setDiscountModalTarget(null);
          }}
          onClose={() => setDiscountModalTarget(null)}
          title={discountModalTarget === 'CART' ? "Apply Cart Discount" : "Apply Item Discount"}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
             <div className="bg-blue-600 p-6 text-white text-center">
                <p className="opacity-80 mb-1">Total Amount Payable</p>
                <h2 className="text-4xl font-bold">${total.toFixed(2)}</h2>
                {discountAmount > 0 && <p className="text-sm bg-blue-700/50 inline-block px-3 py-1 rounded-full mt-2">You save ${discountAmount.toFixed(2)}</p>}
             </div>
             <div className="p-6">
                <p className="text-gray-600 mb-4 font-medium">Select Payment Method</p>
                <div className="space-y-3">
                     <button onClick={() => handleCheckout('CASH')} className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-green-50 hover:border-green-200 transition-colors group">
                        <div className="bg-gray-100 text-gray-600 p-3 rounded-lg group-hover:bg-green-200 group-hover:text-green-700">
                           <Banknote size={24}/>
                        </div>
                        <div className="text-left">
                          <span className="block font-bold text-gray-800">CASH</span>
                          <span className="text-xs text-gray-500">Physical currency</span>
                        </div>
                     </button>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handleCheckout('ZAAD')} className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-xl hover:bg-green-50 hover:border-green-400 transition-colors group">
                            <div className="bg-green-100 text-green-700 p-3 rounded-full group-hover:scale-110 transition-transform">
                              <Smartphone size={24}/>
                            </div>
                            <span className="font-bold text-gray-800 group-hover:text-green-700">ZAAD</span>
                        </button>

                        <button onClick={() => handleCheckout('EDAHAB')} className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-xl hover:bg-yellow-50 hover:border-yellow-400 transition-colors group">
                            <div className="bg-yellow-100 text-yellow-700 p-3 rounded-full group-hover:scale-110 transition-transform">
                              <Smartphone size={24}/>
                            </div>
                            <span className="font-bold text-gray-800 group-hover:text-yellow-700">E-DAHAB</span>
                        </button>
                    </div>
                </div>
                <button onClick={() => setShowPaymentModal(false)} className="mt-6 w-full py-3 text-gray-500 hover:text-gray-800 font-medium">Cancel</button>
             </div>
          </div>
        </div>
      )}

      {/* Receipt Success Modal */}
      {completedSale && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="bg-green-500 p-6 text-white text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-white text-green-500 rounded-full flex items-center justify-center mb-3">
                   <CheckCircle size={32} />
                </div>
                <h2 className="text-2xl font-bold">Sale Completed!</h2>
                <p className="opacity-90">Transaction #{completedSale.id}</p>
             </div>
             
             <div className="p-6 space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                   <div className="flex justify-between mb-2">
                     <span className="text-gray-500">Amount Paid</span>
                     <span className="font-bold text-gray-800">${completedSale.total.toFixed(2)}</span>
                   </div>
                   {completedSale.subtotal > completedSale.total && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Savings</span>
                        <span>-${(completedSale.subtotal - completedSale.total).toFixed(2)}</span>
                      </div>
                   )}
                   <div className="flex justify-between">
                     <span className="text-gray-500">Method</span>
                     <span className="font-medium text-gray-800">{completedSale.paymentMethod}</span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <button onClick={handlePrintReceipt} className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700">
                      <Printer size={24} className="mb-2 text-blue-600"/>
                      <span className="font-medium text-sm">Print</span>
                   </button>
                   <button onClick={handleWhatsAppShare} className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700">
                      <Share2 size={24} className="mb-2 text-green-600"/>
                      <span className="font-medium text-sm">WhatsApp</span>
                   </button>
                </div>

                <button onClick={() => setCompletedSale(null)} className="w-full py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-black transition-colors">New Sale</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Discount Modal (Unchanged logic, just ensure z-index is high)
const DiscountModal: React.FC<{
  initialValue?: Discount;
  onApply: (d: Discount | undefined) => void;
  onClose: () => void;
  title: string;
}> = ({ initialValue, onApply, onClose, title }) => {
  const [type, setType] = useState<'PERCENTAGE' | 'FIXED'>(initialValue?.type || 'PERCENTAGE');
  const [value, setValue] = useState<string>(initialValue?.value.toString() || '');

  return (
    <div className="fixed inset-0 bg-black/40 z-[80] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xs p-5 animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
          <button 
            onClick={() => setType('PERCENTAGE')} 
            className={`flex-1 flex items-center justify-center py-2 rounded-md text-sm font-medium transition-all ${type === 'PERCENTAGE' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
          >
            <Percent size={14} className="mr-1"/> Percentage
          </button>
          <button 
            onClick={() => setType('FIXED')} 
            className={`flex-1 flex items-center justify-center py-2 rounded-md text-sm font-medium transition-all ${type === 'FIXED' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
          >
            <DollarSign size={14} className="mr-1"/> Fixed Amount
          </button>
        </div>

        <div className="mb-4">
           <label className="block text-xs font-bold text-gray-500 mb-1">Value ({type === 'PERCENTAGE' ? '%' : '$'})</label>
           <input 
             type="number" 
             value={value} 
             onChange={e => setValue(e.target.value)}
             className="w-full text-center text-2xl font-bold p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
             placeholder="0"
             autoFocus
           />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => onApply(undefined)} className="py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium">Remove</button>
          <button onClick={() => {
             if (value && parseFloat(value) > 0) onApply({ type, value: parseFloat(value) });
             else onApply(undefined);
          }} className="py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow hover:bg-blue-700">Apply</button>
        </div>
      </div>
    </div>
  );
};

export default POS;
