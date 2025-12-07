
import React, { useState, useEffect } from 'react';
import { User, UserRole, Product, Sale, CartItem, ActivityLog, Discount, Expense, DEFAULT_PRODUCT_CATEGORIES } from './types';
import { INITIAL_USERS, INITIAL_PRODUCTS, DEFAULT_CATEGORIES } from './constants';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import Reports from './components/Reports';
import ActivityLogs from './components/ActivityLogs';
import Settings from './components/Settings';
import Expenses from './components/Expenses';
import { LayoutDashboard, ShoppingCart, Package, FileText, LogOut, Lock, History, Settings as SettingsIcon, Wallet, Menu } from 'lucide-react';

const App: React.FC = () => {
  // Application State
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'DASHBOARD' | 'POS' | 'INVENTORY' | 'REPORTS' | 'ACTIVITY' | 'SETTINGS' | 'EXPENSES'>('POS');
  
  // Data State
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [sales, setSales] = useState<Sale[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);

  // Login State
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState('');

  // Load persistence
  useEffect(() => {
    const savedProducts = localStorage.getItem('products');
    const savedSales = localStorage.getItem('sales');
    const savedLogs = localStorage.getItem('activityLogs');
    const savedExpenses = localStorage.getItem('expenses');
    const savedUsers = localStorage.getItem('users');
    const savedCategories = localStorage.getItem('categories');
    
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedSales) setSales(JSON.parse(savedSales));
    if (savedLogs) setActivityLogs(JSON.parse(savedLogs));
    if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
    if (savedUsers) setUsers(JSON.parse(savedUsers));
    if (savedCategories) setCategories(JSON.parse(savedCategories));
  }, []);

  // Persistence Effects
  useEffect(() => { localStorage.setItem('products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('sales', JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem('activityLogs', JSON.stringify(activityLogs)); }, [activityLogs]);
  useEffect(() => { localStorage.setItem('expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('categories', JSON.stringify(categories)); }, [categories]);

  // Helper to add log
  const logAction = (
    action: ActivityLog['action'], 
    details: string, 
    specificUser?: User
  ) => {
    const actor = specificUser || user;
    if (!actor) return;

    const newLog: ActivityLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      userId: actor.id,
      userName: actor.name,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = users.find(u => u.pin === pin);
    if (foundUser) {
      setUser(foundUser);
      logAction('LOGIN', `User logged into the system`, foundUser);
      setView(foundUser.role === UserRole.ADMIN ? 'DASHBOARD' : 'POS');
      setPin('');
      setLoginError('');
    } else {
      setLoginError('Invalid PIN');
    }
  };

  const handleLogout = () => {
    if (user) {
      logAction('LOGOUT', `User logged out`);
    }
    setUser(null);
    setPin('');
  };

  // --- SALES HANDLER ---
  const processSale = (
    items: CartItem[], 
    subtotal: number, 
    cartDiscount: Discount | undefined, 
    total: number, 
    paymentMethod: 'CASH' | 'ZAAD' | 'EDAHAB'
  ) => {
    const newSale: Sale = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      items: items.map(i => {
        let itemSub = i.sellingPrice * i.cartQuantity;
        if(i.discount) {
           if(i.discount.type === 'FIXED') itemSub = Math.max(0, itemSub - i.discount.value);
           else itemSub = itemSub * (1 - i.discount.value/100);
        }
        return {
          productId: i.id,
          name: i.name,
          quantity: i.cartQuantity,
          unitPrice: i.sellingPrice,
          discount: i.discount,
          subtotal: itemSub
        };
      }),
      subtotal,
      discount: cartDiscount,
      totalAmount: total,
      paymentMethod,
      cashierId: user?.id || 'unknown',
      cashierName: user?.name || 'Unknown'
    };

    setProducts(prev => prev.map(p => {
      const soldItem = items.find(i => i.id === p.id);
      if (soldItem) {
        return { ...p, quantity: p.quantity - soldItem.cartQuantity };
      }
      return p;
    }));

    setSales(prev => [newSale, ...prev]);
    
    const discountMsg = (subtotal - total) > 0 ? ` (Discount: $${(subtotal - total).toFixed(2)})` : '';
    logAction('SALE', `Processed Sale #${newSale.id.slice(-6)} - Total: $${total.toFixed(2)}${discountMsg} - Items: ${items.length} - Via ${paymentMethod}`);
  };

  // --- INVENTORY HANDLERS ---
  const handleAddProduct = (p: Product) => {
    setProducts([...products, p]);
    logAction('INVENTORY_ADD', `Added new product: ${p.name} (${p.sku})`);
  };

  const handleUpdateProduct = (p: Product) => {
    setProducts(products.map(curr => curr.id === p.id ? p : curr));
    logAction('INVENTORY_UPDATE', `Updated product: ${p.name}`);
  };

  const handleDeleteProduct = (id: string) => {
    const product = products.find(p => p.id === id);
    setProducts(products.filter(p => p.id !== id));
    logAction('INVENTORY_DELETE', `Deleted product: ${product?.name || 'Unknown'}`);
  };

  // --- EXPENSE HANDLERS ---
  const handleAddExpense = (e: Expense) => {
    setExpenses(prev => [e, ...prev]);
    logAction('EXPENSE_ADD', `Added expense: $${e.amount} for ${e.description}`);
  };

  const handleDeleteExpense = (id: string) => {
    const expense = expenses.find(e => e.id === id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    logAction('EXPENSE_DELETE', `Deleted expense: ${expense?.description || 'Unknown'} - $${expense?.amount || 0}`);
  };

  // --- SETTINGS / DATA HANDLERS ---
  const handleAddUser = (u: User) => {
    setUsers(prev => [...prev, u]);
    logAction('USER_UPDATE', `Created new user: ${u.name}`);
  };

  const handleUpdateUser = (u: User) => {
    setUsers(prev => prev.map(user => user.id === u.id ? u : user));
    logAction('USER_UPDATE', `Updated user details for: ${u.name}`);
  };

  const handleDeleteUser = (id: string) => {
    const u = users.find(u => u.id === id);
    setUsers(prev => prev.filter(u => u.id !== id));
    logAction('USER_DELETE', `Deleted user: ${u?.name || id}`);
  };

  const handleAddCategory = (c: string) => {
    setCategories(prev => [...prev, c]);
  };

  const handleDeleteCategory = (c: string) => {
    setCategories(prev => prev.filter(cat => cat !== c));
  };

  const handleExportData = () => {
    const data = {
      products, sales, expenses, users, categories, activityLogs,
      exportedAt: new Date().toISOString()
    };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `OriginalElectronics_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.products) setProducts(json.products);
        if (json.sales) setSales(json.sales);
        if (json.expenses) setExpenses(json.expenses);
        if (json.users) setUsers(json.users);
        if (json.categories) setCategories(json.categories);
        if (json.activityLogs) setActivityLogs(json.activityLogs);
        
        logAction('DATA_RESTORE', 'System data restored from backup file');
        alert('Data restored successfully!');
      } catch (err) {
        alert('Failed to parse backup file. Please ensure it is a valid JSON.');
      }
    };
    reader.readAsText(file);
  };

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
          <div className="flex justify-center mb-6 text-blue-600">
             <Lock size={48} />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Original Electronics</h2>
          <p className="text-center text-gray-500 mb-6">Enter PIN to access System</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              maxLength={4}
              inputMode="numeric"
              className="w-full text-center text-2xl tracking-[0.5em] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoFocus
            />
            {loginError && <p className="text-red-500 text-center text-sm">{loginError}</p>}
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
              Access System
            </button>
          </form>
          <div className="mt-8 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">
            <p>Admin PIN: 1234</p>
            <p>Cashier PIN: 0000</p>
          </div>
        </div>
      </div>
    );
  }

  // MAIN LAYOUT
  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-gray-100 print:h-auto print:overflow-visible overflow-hidden">
      
      {/* DESKTOP SIDEBAR - Hidden on Mobile */}
      <div className="hidden md:flex w-20 md:w-64 bg-slate-900 text-white flex-col transition-all duration-300 print:hidden">
        <div className="p-4 md:p-6 font-bold text-xl flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">OE</div>
          <span className="hidden md:block truncate">Original Electronics</span>
        </div>
        
        <nav className="flex-1 py-6 space-y-2 overflow-y-auto">
          {user.role === UserRole.ADMIN && (
            <button 
              onClick={() => setView('DASHBOARD')}
              className={`w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-800 transition-colors ${view === 'DASHBOARD' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
            >
              <LayoutDashboard size={22} />
              <span className="hidden md:block">Dashboard</span>
            </button>
          )}

          <button 
            onClick={() => setView('POS')}
            className={`w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-800 transition-colors ${view === 'POS' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
          >
            <ShoppingCart size={22} />
            <span className="hidden md:block">Point of Sale</span>
          </button>

          {user.role === UserRole.ADMIN && (
            <>
              <button 
                onClick={() => setView('INVENTORY')}
                className={`w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-800 transition-colors ${view === 'INVENTORY' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                <Package size={22} />
                <span className="hidden md:block">Inventory</span>
              </button>
              
              <button 
                onClick={() => setView('EXPENSES')}
                className={`w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-800 transition-colors ${view === 'EXPENSES' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                <Wallet size={22} />
                <span className="hidden md:block">Expenses</span>
              </button>

              <button 
                onClick={() => setView('REPORTS')}
                className={`w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-800 transition-colors ${view === 'REPORTS' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                <FileText size={22} />
                <span className="hidden md:block">Reports</span>
              </button>
              <button 
                onClick={() => setView('ACTIVITY')}
                className={`w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-800 transition-colors ${view === 'ACTIVITY' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                <History size={22} />
                <span className="hidden md:block">Activity Logs</span>
              </button>
              <button 
                onClick={() => setView('SETTINGS')}
                className={`w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-800 transition-colors ${view === 'SETTINGS' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                <SettingsIcon size={22} />
                <span className="hidden md:block">Settings</span>
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="hidden md:block overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-slate-400 hover:text-white transition-colors p-2 rounded hover:bg-slate-800">
            <LogOut size={18} />
            <span className="hidden md:block text-sm">Logout</span>
          </button>
        </div>
      </div>

      {/* MOBILE HEADER - Only Visible on Mobile */}
      <div className="md:hidden bg-slate-900 text-white p-3 flex justify-between items-center shadow-md z-30">
        <div className="flex items-center gap-2 font-bold">
          <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center text-xs">OE</div>
          <span>Original</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{user.name}</span>
          <button onClick={handleLogout}><LogOut size={18}/></button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto print:overflow-visible print:h-auto bg-gray-100 relative w-full">
        {view === 'DASHBOARD' && user.role === UserRole.ADMIN && <Dashboard sales={sales} products={products} expenses={expenses} />}
        
        {view === 'POS' && <POS products={products} categories={categories} currentUser={user} onProcessSale={processSale} />}
        
        {view === 'INVENTORY' && user.role === UserRole.ADMIN && (
          <Inventory 
            products={products}
            categories={categories}
            onAddProduct={handleAddProduct} 
            onUpdateProduct={handleUpdateProduct} 
            onDeleteProduct={handleDeleteProduct}
          />
        )}
        
        {view === 'EXPENSES' && user.role === UserRole.ADMIN && (
          <Expenses 
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {view === 'REPORTS' && user.role === UserRole.ADMIN && <Reports sales={sales} products={products} expenses={expenses} />}
        
        {view === 'ACTIVITY' && user.role === UserRole.ADMIN && <ActivityLogs logs={activityLogs} />}
        
        {view === 'SETTINGS' && user.role === UserRole.ADMIN && (
          <Settings 
            users={users} 
            onAddUser={handleAddUser} 
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            categories={categories}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onExportData={handleExportData}
            onImportData={handleImportData}
          />
        )}
        
        {/* Spacer for Bottom Nav */}
        <div className="h-20 md:hidden"></div>
      </main>

      {/* MOBILE BOTTOM NAV - Only Visible on Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 z-40 safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        {user.role === UserRole.ADMIN && (
          <button onClick={() => setView('DASHBOARD')} className={`flex flex-col items-center p-2 rounded-lg ${view === 'DASHBOARD' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}>
            <LayoutDashboard size={20} />
            <span className="text-[10px] mt-1">Home</span>
          </button>
        )}
        
        <button onClick={() => setView('POS')} className={`flex flex-col items-center p-2 rounded-lg ${view === 'POS' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}>
          <ShoppingCart size={20} />
          <span className="text-[10px] mt-1">Sale</span>
        </button>

        {user.role === UserRole.ADMIN && (
          <>
            <button onClick={() => setView('INVENTORY')} className={`flex flex-col items-center p-2 rounded-lg ${view === 'INVENTORY' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}>
              <Package size={20} />
              <span className="text-[10px] mt-1">Stock</span>
            </button>
            
            <button onClick={() => setView('EXPENSES')} className={`flex flex-col items-center p-2 rounded-lg ${view === 'EXPENSES' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}>
              <Wallet size={20} />
              <span className="text-[10px] mt-1">Cost</span>
            </button>

            {/* Menu Dropdown for others */}
            <button onClick={() => setView('SETTINGS')} className={`flex flex-col items-center p-2 rounded-lg ${['SETTINGS', 'REPORTS', 'ACTIVITY'].includes(view) ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}>
              <Menu size={20} />
              <span className="text-[10px] mt-1">More</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
