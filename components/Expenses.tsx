
import React, { useState } from 'react';
import { Expense } from '../types';
import { Plus, Trash2, DollarSign, Calendar, Tag } from 'lucide-react';

interface ExpensesProps {
  expenses: Expense[];
  onAddExpense: (e: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

const Expenses: React.FC<ExpensesProps> = ({ expenses, onAddExpense, onDeleteExpense }) => {
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    description: '',
    amount: 0,
    category: 'Operational',
    date: new Date().toISOString().split('T')[0]
  });

  const expenseCategories = ['Rent', 'Salaries', 'Utilities', 'Inventory Purchase', 'Maintenance', 'Marketing', 'Operational', 'Other'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExpense.description && newExpense.amount && newExpense.date && newExpense.category) {
      onAddExpense({
        id: Date.now().toString(),
        description: newExpense.description,
        amount: Number(newExpense.amount),
        category: newExpense.category,
        date: newExpense.date
      });
      setNewExpense({
        description: '',
        amount: 0,
        category: 'Operational',
        date: new Date().toISOString().split('T')[0]
      });
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-6 h-full flex flex-col space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Expense Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Expense Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Plus size={18} className="text-red-600"/> Record New Expense
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input 
                required type="text" 
                placeholder="e.g. Shop Rent for March"
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                value={newExpense.description}
                onChange={e => setNewExpense({...newExpense, description: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                <div className="relative">
                   <DollarSign size={16} className="absolute left-2 top-3 text-gray-400"/>
                   <input 
                      required type="number" step="0.01"
                      className="w-full border rounded-lg pl-8 p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={newExpense.amount || ''}
                      onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})}
                    />
                </div>
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                 <input 
                    required type="date"
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={newExpense.date}
                    onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                  />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select 
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={newExpense.category}
                onChange={e => setNewExpense({...newExpense, category: e.target.value})}
              >
                {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <button type="submit" className="w-full bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 shadow-sm transition-colors">
              Add Expense
            </button>
          </form>
        </div>

        {/* Expense List */}
        <div className="lg:col-span-2 flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Expense History</h3>
            <div className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-sm font-bold">
              Total: ${totalExpenses.toFixed(2)}
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1 p-0">
             <table className="w-full text-left">
                <thead className="bg-gray-50/50 sticky top-0">
                  <tr>
                    <th className="p-4 text-xs font-semibold text-gray-500">Date</th>
                    <th className="p-4 text-xs font-semibold text-gray-500">Description</th>
                    <th className="p-4 text-xs font-semibold text-gray-500">Category</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 text-right">Amount</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">No expenses recorded yet.</td></tr>
                  ) : (
                    expenses.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => (
                      <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 text-sm text-gray-600 font-mono">{exp.date}</td>
                        <td className="p-4 font-medium text-gray-800">{exp.description}</td>
                        <td className="p-4">
                           <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                             {exp.category}
                           </span>
                        </td>
                        <td className="p-4 text-right font-bold text-red-600">-${exp.amount.toFixed(2)}</td>
                        <td className="p-4 text-right">
                           <button 
                             type="button"
                             onClick={() => {
                               if (window.confirm('Are you sure you want to delete this expense?')) {
                                 onDeleteExpense(exp.id);
                               }
                             }} 
                             className="text-gray-400 hover:text-red-600 transition-colors"
                             title="Delete Expense"
                           >
                             <Trash2 size={16} />
                           </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
             </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Expenses;
