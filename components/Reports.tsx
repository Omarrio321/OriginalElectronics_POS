
import React, { useState, useMemo } from 'react';
import { Sale, Product, Expense } from '../types';
import { Download, Calendar, Printer, TrendingUp, TrendingDown, Receipt, Wallet, ArrowRightLeft } from 'lucide-react';

interface ReportsProps {
  sales: Sale[];
  products: Product[];
  expenses: Expense[];
}

type ReportType = 'DAILY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';

const Reports: React.FC<ReportsProps> = ({ sales, products, expenses }) => {
  const [reportType, setReportType] = useState<ReportType>('MONTHLY');
  
  // Helper to get local YYYY-MM-DD string to avoid timezone issues with toISOString()
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Initialize dates to current month by default
  const getInitialDates = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      start: formatDate(firstDay),
      end: formatDate(lastDay)
    };
  };

  const [startDate, setStartDate] = useState(getInitialDates().start);
  const [endDate, setEndDate] = useState(getInitialDates().end);

  // Handle Date Range Presets
  const handleTypeChange = (type: ReportType) => {
    setReportType(type);
    const today = new Date();
    
    if (type === 'DAILY') {
      const dateStr = formatDate(today);
      setStartDate(dateStr);
      setEndDate(dateStr);
    } else if (type === 'MONTHLY') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(lastDay));
    } else if (type === 'YEARLY') {
      const firstDay = new Date(today.getFullYear(), 0, 1);
      const lastDay = new Date(today.getFullYear(), 11, 31);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(lastDay));
    }
  };

  // --- CALCULATIONS ---
  const reportData = useMemo(() => {
    // 1. Filter Sales & Expenses by Date Range
    const filteredSales = sales.filter(s => {
      // s.date is stored as ISO string (UTC). We slice it to get the date part.
      // NOTE: Ideally, we should convert sale date to local before comparing, 
      // but for simplicity in this MVP, we assume the date part matches the user's intent.
      const sDate = s.date.split('T')[0];
      return sDate >= startDate && sDate <= endDate;
    });

    const filteredExpenses = expenses.filter(e => {
      return e.date >= startDate && e.date <= endDate;
    });

    // 2. Financial Summary
    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalDiscounts = filteredSales.reduce((sum, s) => sum + (s.subtotal - s.totalAmount), 0);
    
    // Calculate COGS (Cost of Goods Sold)
    let cogs = 0;
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        // Use current buying price, or fallback if product deleted (assuming 0 cost if unknown)
        const cost = product ? product.buyingPrice : 0;
        cogs += cost * item.quantity;
      });
    });

    const grossProfit = totalRevenue - cogs;
    const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalExpenseAmount;

    // 3. Product Performance Analysis
    // We use a Map to aggregate sales by Product ID. 
    // We initialize it with active products to ensure they show up even if 0 sales.
    const productStats = new Map<string, { name: string, qtySold: number, revenue: number }>();
    
    // Initialize with active inventory (so we see what hasn't sold)
    products.forEach(p => {
      productStats.set(p.id, { name: p.name, qtySold: 0, revenue: 0 });
    });

    // Process Sales (this also catches deleted products that have sales history)
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productStats.has(item.productId)) {
           // Product was deleted, but we have record in sale item
           productStats.set(item.productId, { name: item.name, qtySold: 0, revenue: 0 });
        }
        const stats = productStats.get(item.productId)!;
        stats.qtySold += item.quantity;
        stats.revenue += item.subtotal;
      });
    });

    const allProductPerformances = Array.from(productStats.values());
    
    // Fast Moving: Highest Qty Sold
    const fastMoving = [...allProductPerformances]
      .filter(p => p.qtySold > 0)
      .sort((a, b) => b.qtySold - a.qtySold)
      .slice(0, 5);

    // Slow Moving: Lowest Qty Sold (including 0)
    // Only consider items that exist in current inventory for slow moving (can't restock deleted items)
    const activeProductIds = new Set(products.map(p => p.id));
    const slowMoving = [...allProductPerformances]
      .filter(p => activeProductIds.has(products.find(prod => prod.name === p.name)?.id || '')) // Basic matching
      .sort((a, b) => a.qtySold - b.qtySold)
      .slice(0, 5);

    // Out of Stock Risks
    const lowStockItems = products.filter(p => p.quantity <= p.minStockLevel);

    return {
      filteredSales,
      filteredExpenses,
      financials: {
        revenue: totalRevenue,
        cogs,
        grossProfit,
        expenses: totalExpenseAmount,
        netProfit,
        discounts: totalDiscounts,
        transactionCount: filteredSales.length
      },
      analysis: {
        fastMoving,
        slowMoving,
        lowStockItems
      }
    };
  }, [sales, expenses, products, startDate, endDate]);

  // --- COMBINED HISTORY ---
  const combinedHistory = useMemo(() => {
    const s = reportData.filteredSales.map(sale => ({
      id: sale.id,
      date: sale.date,
      displayDate: sale.date.split('T')[0],
      time: new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      type: 'SALE' as const,
      description: `Sale #${sale.id.slice(-6)} - ${sale.items.length} items`,
      subText: `Cashier: ${sale.cashierName}`,
      amount: sale.totalAmount,
      method: sale.paymentMethod,
      timestamp: new Date(sale.date).getTime()
    }));

    const e = reportData.filteredExpenses.map(exp => ({
      id: exp.id,
      date: exp.date,
      displayDate: exp.date,
      time: '-',
      type: 'EXPENSE' as const,
      description: exp.description,
      subText: `Category: ${exp.category}`,
      amount: exp.amount, 
      method: '-',
      timestamp: new Date(exp.date).getTime()
    }));

    // Sort by timestamp descending
    return [...s, ...e].sort((a, b) => b.timestamp - a.timestamp);
  }, [reportData.filteredSales, reportData.filteredExpenses]);

  // --- EXPORT FUNCTIONS ---

  const handlePrintPDF = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const csvRows = [];
    
    // Summary Headers
    csvRows.push(['Original Electronics Financial Report']);
    csvRows.push([`Period: ${startDate} to ${endDate}`]);
    csvRows.push([]); // Empty line
    
    // Financial Summary
    csvRows.push(['FINANCIAL SUMMARY']);
    csvRows.push(['Total Revenue', reportData.financials.revenue.toFixed(2)]);
    csvRows.push(['Cost of Goods Sold', reportData.financials.cogs.toFixed(2)]);
    csvRows.push(['Gross Profit', reportData.financials.grossProfit.toFixed(2)]);
    csvRows.push(['Total Expenses', reportData.financials.expenses.toFixed(2)]);
    csvRows.push(['Net Profit', reportData.financials.netProfit.toFixed(2)]);
    csvRows.push([]);

    // Sales Data
    csvRows.push(['SALES TRANSACTIONS']);
    csvRows.push(['Date', 'Receipt ID', 'Cashier', 'Payment Method', 'Items', 'Total']);
    reportData.filteredSales.forEach(s => {
      const itemsStr = s.items.map(i => `${i.quantity}x ${i.name}`).join('; ');
      csvRows.push([
        s.date.split('T')[0],
        s.id,
        s.cashierName,
        s.paymentMethod,
        `"${itemsStr}"`,
        s.totalAmount.toFixed(2)
      ]);
    });
    csvRows.push([]);

    // Expenses Data
    csvRows.push(['EXPENSE BREAKDOWN']);
    csvRows.push(['Date', 'Category', 'Description', 'Amount']);
    reportData.filteredExpenses.forEach(e => {
      csvRows.push([e.date, e.category, e.description, e.amount.toFixed(2)]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Report_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      
      {/* --- SCREEN VIEW CONTROLS --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Advanced Reports</h1>
          <p className="text-sm text-gray-500">Generate financial statements and inventory analysis</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           <button onClick={handleExportCSV} className="flex-1 md:flex-none justify-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm">
             <Download size={18} /> Excel/CSV
           </button>
           <button onClick={handlePrintPDF} className="flex-1 md:flex-none justify-center bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm">
             <Printer size={18} /> Print PDF
           </button>
        </div>
      </div>

      {/* --- FILTERS --- */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 print:hidden overflow-x-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
             {(['DAILY', 'MONTHLY', 'YEARLY', 'CUSTOM'] as ReportType[]).map(type => (
               <button
                 key={type}
                 onClick={() => handleTypeChange(type)}
                 className={`px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all ${reportType === type ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 {type.charAt(0) + type.slice(1).toLowerCase()}
               </button>
             ))}
          </div>

          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 w-full md:w-auto">
             <Calendar size={16} className="text-gray-400 shrink-0"/>
             <input 
               type="date" 
               value={startDate} 
               onChange={(e) => { setStartDate(e.target.value); setReportType('CUSTOM'); }}
               className="bg-transparent text-sm outline-none text-gray-700 w-full md:w-auto"
             />
             <span className="text-gray-400">-</span>
             <input 
               type="date" 
               value={endDate} 
               onChange={(e) => { setEndDate(e.target.value); setReportType('CUSTOM'); }}
               className="bg-transparent text-sm outline-none text-gray-700 w-full md:w-auto"
             />
          </div>
        </div>
      </div>

      {/* --- SCREEN REPORT PREVIEW --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
        {/* Summary Cards */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
           <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
           <p className="text-2xl font-bold text-gray-800">${reportData.financials.revenue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
           <p className="text-xs text-gray-500 mb-1">Gross Profit</p>
           <p className="text-2xl font-bold text-blue-600">${reportData.financials.grossProfit.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
           <p className="text-xs text-gray-500 mb-1">Total Expenses</p>
           <p className="text-2xl font-bold text-red-500">-${reportData.financials.expenses.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
           <p className="text-xs text-gray-500 mb-1">Net Profit</p>
           <p className={`text-2xl font-bold ${reportData.financials.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
             ${reportData.financials.netProfit.toFixed(2)}
           </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
         {/* Top Selling */}
         <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-full">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-green-500"/> Fast Moving Products
            </h3>
            <div className="space-y-3">
              {reportData.analysis.fastMoving.map((p, i) => (
                <div key={i} className="flex justify-between items-center text-sm border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                   <span className="font-medium text-gray-700">{p.name}</span>
                   <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-bold">{p.qtySold} sold</span>
                </div>
              ))}
              {reportData.analysis.fastMoving.length === 0 && <p className="text-sm text-gray-400 italic text-center py-4">No sales found for this period.</p>}
            </div>
         </div>

         {/* Slow Moving */}
         <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-full">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingDown size={18} className="text-orange-500"/> Slow Moving / Dormant
            </h3>
            <div className="space-y-3">
              {reportData.analysis.slowMoving.slice(0, 5).map((p, i) => (
                <div key={i} className="flex justify-between items-center text-sm border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                   <span className="font-medium text-gray-700">{p.name}</span>
                   <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{p.qtySold} sold</span>
                </div>
              ))}
               {products.length === 0 && <p className="text-sm text-gray-400 italic text-center py-4">Inventory is empty.</p>}
            </div>
         </div>
      </div>

      {/* --- DETAILED TRANSACTION HISTORY --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col print:hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <ArrowRightLeft size={18} className="text-purple-500"/>
            Detailed Transaction History
          </h3>
          <span className="text-xs font-normal text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
             {combinedHistory.length} Transactions
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-500">Date</th>
                <th className="p-4 font-semibold text-gray-500">Type</th>
                <th className="p-4 font-semibold text-gray-500">Description</th>
                <th className="p-4 font-semibold text-gray-500">Payment Method</th>
                <th className="p-4 font-semibold text-gray-500 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {combinedHistory.length === 0 ? (
                 <tr><td colSpan={5} className="p-8 text-center text-gray-400">No transactions found in this period</td></tr>
              ) : (
                 combinedHistory.map((item) => (
                   <tr key={item.id + item.type} className="hover:bg-gray-50">
                     <td className="p-4 text-gray-600 whitespace-nowrap">
                       <div className="font-medium">{item.displayDate}</div>
                       <div className="text-xs text-gray-400">{item.time}</div>
                     </td>
                     <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          item.type === 'SALE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                           {item.type}
                        </span>
                     </td>
                     <td className="p-4">
                       <div className="font-medium text-gray-800">{item.description}</div>
                       <div className="text-xs text-gray-500">{item.subText}</div>
                     </td>
                     <td className="p-4 text-gray-600">
                       {item.method === '-' ? (
                         <span className="text-gray-300">-</span>
                       ) : (
                         <span className={`text-[10px] px-2 py-1 rounded font-bold ${
                           item.method === 'CASH' ? 'bg-gray-100 text-gray-700' :
                           item.method === 'ZAAD' ? 'bg-green-50 text-green-700' : 
                           'bg-yellow-50 text-yellow-700'
                         }`}>
                           {item.method}
                         </span>
                       )}
                     </td>
                     <td className={`p-4 text-right font-bold ${
                       item.type === 'SALE' ? 'text-green-600' : 'text-red-600'
                     }`}>
                       {item.type === 'SALE' ? '+' : '-'}${item.amount.toFixed(2)}
                     </td>
                   </tr>
                 ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- PRINT LAYOUT (Hidden on screen, visible on print) --- */}
      <div className="hidden print:block print:absolute print:inset-0 print:w-full print:h-auto print:bg-white print:z-50 p-10">
         {/* Print Header */}
         <div className="text-center mb-8 border-b-2 border-gray-800 pb-6">
            <h1 className="text-3xl font-bold uppercase tracking-wide mb-2">Original Electronics</h1>
            <p className="text-gray-600 font-medium">Performance & Financial Report</p>
            <p className="text-sm text-gray-500 mt-2">Report Period: {startDate} to {endDate}</p>
         </div>

         {/* Financial Summary Table */}
         <div className="mb-8">
            <h2 className="text-lg font-bold border-b border-gray-300 mb-4 pb-1 uppercase text-gray-700">Financial Summary</h2>
            <table className="w-full text-sm">
               <tbody>
                  <tr className="border-b border-gray-100"><td className="py-2">Total Revenue</td><td className="text-right font-bold">${reportData.financials.revenue.toFixed(2)}</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2">Cost of Goods Sold (COGS)</td><td className="text-right text-red-600">-${reportData.financials.cogs.toFixed(2)}</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2 font-bold">Gross Profit</td><td className="text-right font-bold">${reportData.financials.grossProfit.toFixed(2)}</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2">Operational Expenses</td><td className="text-right text-red-600">-${reportData.financials.expenses.toFixed(2)}</td></tr>
                  <tr className="bg-gray-100"><td className="py-2 font-bold px-2">NET PROFIT</td><td className="text-right font-bold text-lg px-2">${reportData.financials.netProfit.toFixed(2)}</td></tr>
               </tbody>
            </table>
         </div>

         {/* Inventory Analysis */}
         <div className="grid grid-cols-2 gap-8 mb-8 break-inside-avoid">
             <div>
                <h2 className="text-sm font-bold border-b border-gray-300 mb-2 pb-1 uppercase text-gray-700">Top Selling Products</h2>
                <table className="w-full text-xs">
                   <thead>
                      <tr className="text-gray-500 text-left"><th className="pb-1">Item</th><th className="text-right pb-1">Qty</th><th className="text-right pb-1">Rev</th></tr>
                   </thead>
                   <tbody>
                      {reportData.analysis.fastMoving.slice(0, 10).map((p, i) => (
                        <tr key={i} className="border-b border-gray-100"><td className="py-1">{p.name}</td><td className="text-right">{p.qtySold}</td><td className="text-right">${p.revenue.toFixed(0)}</td></tr>
                      ))}
                      {reportData.analysis.fastMoving.length === 0 && <tr><td colSpan={3} className="py-2 text-center text-gray-400">No data</td></tr>}
                   </tbody>
                </table>
             </div>
             <div>
                <h2 className="text-sm font-bold border-b border-gray-300 mb-2 pb-1 uppercase text-gray-700">Out of Stock Risk</h2>
                <table className="w-full text-xs">
                   <thead>
                      <tr className="text-gray-500 text-left"><th className="pb-1">Item</th><th className="text-right pb-1">Current Stock</th></tr>
                   </thead>
                   <tbody>
                      {reportData.analysis.lowStockItems.slice(0, 10).map((p, i) => (
                        <tr key={i} className="border-b border-gray-100"><td className="py-1">{p.name}</td><td className="text-right text-red-600 font-bold">{p.quantity}</td></tr>
                      ))}
                      {reportData.analysis.lowStockItems.length === 0 && <tr><td colSpan={2} className="py-2 text-center text-gray-400">No low stock items</td></tr>}
                   </tbody>
                </table>
             </div>
         </div>

         {/* Transaction Summary Table */}
         <div className="mb-8">
            <h2 className="text-lg font-bold border-b border-gray-300 mb-4 pb-1 uppercase text-gray-700">Detailed Transaction History</h2>
            <div className="text-xs text-gray-500 mb-2">Total Transactions: {combinedHistory.length}</div>
            <table className="w-full text-xs border-collapse">
               <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Amount</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {combinedHistory.map((item) => (
                    <tr key={item.id + item.type} className="break-inside-avoid">
                      <td className="py-2 align-top">{item.displayDate} <span className="text-gray-400">{item.time}</span></td>
                      <td className="py-2 align-top uppercase font-bold text-gray-600">{item.type}</td>
                      <td className="py-2 align-top">
                        <div>{item.description}</div>
                        <div className="text-gray-400">{item.subText}</div>
                      </td>
                      <td className="py-2 align-top text-right">
                        {item.type === 'EXPENSE' ? '-' : ''}${item.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {combinedHistory.length === 0 && (
                    <tr><td colSpan={4} className="py-4 text-center text-gray-400">No transactions in this period.</td></tr>
                  )}
               </tbody>
            </table>
         </div>

         {/* Footer */}
         <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between text-xs text-gray-500 break-inside-avoid">
            <div>
               <p>Generated by Original Electronics System</p>
               <p>{new Date().toLocaleString()}</p>
            </div>
            <div className="text-right">
               <p>Approved By: ___________________________</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Reports;
