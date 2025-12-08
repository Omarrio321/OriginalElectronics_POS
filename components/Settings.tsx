
import React, { useState, useRef } from 'react';
import { User, UserRole } from '../types';
import { Users, Save, Trash2, Plus, Download, Upload, AlertTriangle, Database, Layers, Edit2, X } from 'lucide-react';

interface SettingsProps {
  users: User[];
  onAddUser: (u: User) => void;
  onUpdateUser: (u: User) => void;
  onDeleteUser: (id: string) => void;
  categories: string[];
  onAddCategory: (c: string) => void;
  onDeleteCategory: (c: string) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  users, onAddUser, onUpdateUser, onDeleteUser, 
  categories, onAddCategory, onDeleteCategory,
  onExportData, onImportData 
}) => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'CATEGORIES' | 'DATA'>('USERS');

  // User Form State
  const [newUser, setNewUser] = useState({ name: '', pin: '', role: UserRole.EMPLOYEE });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  // Category Form State
  const [newCategory, setNewCategory] = useState('');

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateOrUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.name && newUser.pin) {
      if (editingUserId) {
        // Update existing user
        onUpdateUser({
          id: editingUserId,
          name: newUser.name,
          pin: newUser.pin,
          role: newUser.role
        });
        setEditingUserId(null); // Exit edit mode
      } else {
        // Create new user
        onAddUser({
          id: Date.now().toString(),
          name: newUser.name,
          pin: newUser.pin,
          role: newUser.role
        });
      }
      setNewUser({ name: '', pin: '', role: UserRole.EMPLOYEE });
    }
  };

  const startEditUser = (u: User) => {
    setEditingUserId(u.id);
    setNewUser({ name: u.name, pin: u.pin, role: u.role });
  };

  const cancelEditUser = () => {
    setEditingUserId(null);
    setNewUser({ name: '', pin: '', role: UserRole.EMPLOYEE });
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory && !categories.includes(newCategory)) {
      onAddCategory(newCategory);
      setNewCategory('');
    }
  };

  const handleDeleteUser = (u: User) => {
    if (window.confirm(`Are you sure you want to delete user "${u.name}"? This will prevent them from logging in.`)) {
      onDeleteUser(u.id);
    }
  };

  const handleDeleteCategory = (cat: string) => {
    if (window.confirm(`Are you sure you want to delete the category "${cat}"?`)) {
      onDeleteCategory(cat);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (window.confirm("Restoring data will overwrite all current system data. Are you sure you want to proceed?")) {
        onImportData(file);
      }
      // Reset input so same file can be selected again if needed
      e.target.value = '';
    }
  };

  return (
    <div className="p-6 h-full flex flex-col space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>

      {/* TABS */}
      <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1 w-full md:w-fit">
        <button 
          onClick={() => setActiveTab('USERS')}
          className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'USERS' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Users size={16} /> User Management
        </button>
        <button 
          onClick={() => setActiveTab('CATEGORIES')}
          className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'CATEGORIES' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Layers size={16} /> Categories
        </button>
        <button 
          onClick={() => setActiveTab('DATA')}
          className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'DATA' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Database size={16} /> Data & Backup
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        
        {/* --- USERS TAB --- */}
        {activeTab === 'USERS' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
               <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                 {editingUserId ? <Edit2 size={18} className="text-orange-500"/> : <Plus size={18} className="text-blue-500"/>}
                 {editingUserId ? 'Edit User' : 'Add New User'}
               </h3>
               <form onSubmit={handleCreateOrUpdateUser} className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                   <input 
                     required type="text" 
                     className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                     value={newUser.name}
                     onChange={e => setNewUser({...newUser, name: e.target.value})}
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Access PIN (4 digits)</label>
                   <input 
                     required type="text" maxLength={4} inputMode="numeric"
                     className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono tracking-widest"
                     value={newUser.pin}
                     onChange={e => setNewUser({...newUser, pin: e.target.value})}
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                   <select 
                      className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newUser.role}
                      onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                   >
                     <option value={UserRole.EMPLOYEE}>Cashier (POS Only)</option>
                     <option value={UserRole.ADMIN}>Admin (Full Access)</option>
                   </select>
                 </div>
                 
                 <div className="flex gap-2 pt-2">
                    {editingUserId && (
                      <button 
                        type="button" 
                        onClick={cancelEditUser}
                        className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg font-bold hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                    )}
                    <button type="submit" className={`flex-1 py-2 rounded-lg font-bold shadow-sm text-white ${editingUserId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                      {editingUserId ? 'Update User' : 'Create User'}
                    </button>
                 </div>
               </form>
            </div>

            {/* User List */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               <table className="w-full text-left">
                 <thead className="bg-gray-50 border-b border-gray-200">
                   <tr>
                     <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                     <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Role</th>
                     <th className="p-4 text-xs font-semibold text-gray-500 uppercase">PIN</th>
                     <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {users.map(u => (
                     <tr key={u.id} className="hover:bg-gray-50">
                       <td className="p-4 font-medium text-gray-800 flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                           {u.name.charAt(0)}
                         </div>
                         {u.name}
                       </td>
                       <td className="p-4">
                         <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                           {u.role}
                         </span>
                       </td>
                       <td className="p-4 font-mono text-gray-500">••••</td>
                       <td className="p-4 text-right">
                         <div className="flex justify-end gap-2">
                            <button 
                              type="button"
                              onClick={() => startEditUser(u)} 
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleDeleteUser(u)} 
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        )}

        {/* --- CATEGORIES TAB --- */}
        {activeTab === 'CATEGORIES' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                   <Plus size={18} className="text-blue-500"/> Add Category
                </h3>
                <form onSubmit={handleCreateCategory} className="flex gap-2">
                   <input 
                      required type="text" placeholder="New Category Name"
                      className="flex-1 border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                   />
                   <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-sm">
                      Add
                   </button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                 <h3 className="font-bold text-gray-800 mb-4">Product Categories</h3>
                 <div className="flex flex-wrap gap-2">
                   {categories.map(cat => (
                     <div key={cat} className="bg-gray-100 px-3 py-1.5 rounded-lg flex items-center gap-2 group hover:bg-gray-200 transition-colors">
                        <span className="text-gray-700 font-medium">{cat}</span>
                        <button 
                           type="button"
                           onClick={() => handleDeleteCategory(cat)}
                           className="text-gray-400 hover:text-red-500"
                        >
                           <X size={14} />
                        </button>
                     </div>
                   ))}
                 </div>
              </div>
           </div>
        )}

        {/* --- DATA TAB --- */}
        {activeTab === 'DATA' && (
           <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Database size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Data Backup & Restore</h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                 Securely export your entire database including sales, products, and user settings to a JSON file. 
                 You can restore it later if you switch devices or clear browser cache.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <button onClick={onExportData} className="flex flex-col items-center justify-center p-6 border-2 border-blue-100 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors gap-3 group">
                    <Download size={32} className="text-blue-600 group-hover:scale-110 transition-transform"/>
                    <div>
                       <span className="block font-bold text-blue-800">Export Backup</span>
                       <span className="text-xs text-blue-600">Download .json file</span>
                    </div>
                 </button>

                 <button onClick={handleImportClick} className="flex flex-col items-center justify-center p-6 border-2 border-orange-100 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors gap-3 group">
                    <Upload size={32} className="text-orange-600 group-hover:scale-110 transition-transform"/>
                    <div>
                       <span className="block font-bold text-orange-800">Restore Data</span>
                       <span className="text-xs text-orange-600">Upload .json file</span>
                    </div>
                 </button>
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".json" 
                    onChange={handleFileChange}
                 />
              </div>

              <div className="mt-8 flex items-center justify-center gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 inline-flex">
                 <AlertTriangle size={14} />
                 Warning: Restoring data will overwrite all current system information.
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
