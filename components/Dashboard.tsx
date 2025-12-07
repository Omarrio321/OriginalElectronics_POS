
import React, { useMemo } from 'react';
import { Sale, Product, Expense } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, ShoppingBag, TrendingUp, AlertTriangle, Package, Archive, Wallet } from 'lucide-react';

interface DashboardProps {
  sales: Sale[];
  products: Product[];
  expenses: Expense[];
}

const Dashboard: React.FC<DashboardProps> = ({ sales, products, expenses }) => {
  
  const stats = useMemo(() => {
    const totalSales = sales.reduce((acc, curr) => acc + curr.totalAmount, 0);
    
    // Gross Profit from Sales (Revenue - Cost of Goods Sold)
    const grossProfit = sales.reduce((acc, sale) => {
      const saleProfit = sale.items.reduce((iAcc, item) => {
        const product = products.find(p => p.id === item.productId);
        const buyPrice = product ? product.buyingPrice : 0;
        return iAcc + ((item.unitPrice - buyPrice) * item.quantity);
      }, 0);
      return acc + saleProfit;
    }, 0);

    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const netProfit = grossProfit - totalExpenses;

    const lowStockCount = products.filter(p => p.quantity <= p.minStockLevel).length;
    const outOfStockCount = products.filter(p => p.quantity === 0).length;
    
    // Calculate total inventory value (Cost Price * Quantity)
    const inventoryValue = products.reduce((acc, p) => acc + (p.buyingPrice * p.quantity), 0);

    return { totalSales, grossProfit, totalExpenses, netProfit, lowStockCount, outOfStockCount, inventoryValue };
  }, [sales, products, expenses]);

  const salesData = useMemo(() => {
    const last7Days = new Array(7).fill(0).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const daySales = sales.filter(s => s.date.startsWith(date));
      const amount = daySales.reduce((sum, s) => sum + s.totalAmount, 0);
      return { date: date.substring(5), amount };
    });
  }, [sales]);

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg mr-3">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Revenue</p>
            <p className="text-lg font-bold text-gray-800">${stats.totalSales.toFixed(0)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg mr-3">
            <Wallet size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Expenses</p>
            <p className="text-lg font-bold text-gray-800">-${stats.totalExpenses.toFixed(0)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg mr-3">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Net Profit</p>
            <p className={`text-lg font-bold ${stats.netProfit >= 0 ? 'text-gray-800' : 'text-red-500'}`}>
              ${stats.netProfit.toFixed(0)}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg mr-3">
            <Archive size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Stock Value</p>
            <p className="text-lg font-bold text-gray-800">${stats.inventoryValue.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg mr-3">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Low Stock</p>
            <p className="text-lg font-bold text-gray-800">{stats.lowStockCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg mr-3">
            <Package size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Empty</p>
            <p className="text-lg font-bold text-gray-800">{stats.outOfStockCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Sales Overview (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <AlertTriangle size={18} className="mr-2 text-orange-500"/> 
            Restock Alerts
          </h2>
          <div className="space-y-3">
            {products.filter(p => p.quantity <= p.minStockLevel).length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-10">Inventory looks good!</p>
            ) : (
              products.filter(p => p.quantity <= p.minStockLevel).map(product => (
                <div key={product.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-gray-200 rounded-md overflow-hidden">
                        {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />}
                     </div>
                     <div>
                       <p className="font-medium text-gray-800">{product.name}</p>
                       <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                     </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${product.quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                      {product.quantity} left
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
