
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (window.confirm("WARNING: Importing data will overwrite all current system data. This cannot be undone. Are you sure?")) {
        onImportData(file);
      }
    }
  };

  return (
    <div className="p-6 h-full flex flex-col space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('USERS')}
          className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'USERS' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <div className="flex items-center gap-2"><Users size={16}/> User Management</div>
        </button>
        <button 
          onClick={() => setActiveTab('CATEGORIES')}
          className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'CATEGORIES' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <div className="flex items-center gap-2"><Layers size={16}/> Categories</div>
        </button>
        <button 
          onClick={() => setActiveTab('DATA')}
          className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'DATA' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <div className="flex items-center gap-2"><Database size={16}/> Data & Backup</div>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        
        {/* --- USER MANAGEMENT --- */}
        {activeTab === 'USERS' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add/Edit User Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                {editingUserId ? (
                  <>
                    <Edit2 size={18} className="text-orange-600"/> Edit User
                  </>
                ) : (
                  <>
                    <Plus size={18} className="text-blue-600"/> Add New User
                  </>
                )}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code (Login)</label>
                  <input 
                    required type="text" maxLength={4} pattern="\d{4}"
                    placeholder="4 digits"
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
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
                    <option value={UserRole.EMPLOYEE}>Cashier (Employee)</option>
                    <option value={UserRole.ADMIN}>Super Admin</option>
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <button type="submit" className={`flex-1 py-2 rounded-lg font-bold text-white ${editingUserId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {editingUserId ? 'Update User' : 'Create User'}
                  </button>
                  {editingUserId && (
                    <button 
                      type="button" 
                      onClick={cancelEditUser}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
                      title="Cancel Edit"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* User List */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-bold text-gray-800">Current Users</h3>
              </div>
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-4 text-xs font-semibold text-gray-500">Name</th>
                    <th className="p-4 text-xs font-semibold text-gray-500">Role</th>
                    <th className="p-4 text-xs font-semibold text-gray-500">PIN</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(u => (
                    <tr key={u.id} className={editingUserId === u.id ? 'bg-orange-50' : ''}>
                      <td className="p-4 font-medium text-gray-800">{u.name}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 font-mono">****</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => startEditUser(u)} className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded transition-colors">
                            <Edit2 size={16} />
                          </button>
                          {users.length > 1 && (
                            <button 
                              type="button"
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this user?')) {
                                  onDeleteUser(u.id);
                                }
                              }}
                              className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={16}/>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- CATEGORIES --- */}
        {activeTab === 'CATEGORIES' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
              <h3 className="font-bold text-gray-800 mb-4">Add Custom Category</h3>
              <form onSubmit={handleCreateCategory} className="flex gap-2">
                <input 
                  required type="text"
                  placeholder="e.g. Phone Cases"
                  className="flex-1 border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                />
                <button type="submit" className="bg-green-600 text-white px-4 rounded-lg font-bold hover:bg-green-700">
                  Add
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">Active Categories</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <div key={cat} className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-2 group border border-gray-200">
                    <span className="text-sm font-medium text-gray-700">{cat}</span>
                    <button 
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete the category "${cat}"?`)) {
                          onDeleteCategory(cat);
                        }
                      }}
                      className="w-5 h-5 rounded-full bg-gray-200 text-gray-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"
                      title="Remove Category"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- DATA & BACKUP --- */}
        {activeTab === 'DATA' && (
          <div className="space-y-6 max-w-2xl">
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl">
              <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-2">
                <Download size={20}/> Export Database
              </h3>
              <p className="text-blue-800 text-sm mb-4">
                Download a complete backup of your products, sales history, expenses, users, and logs. 
                Keep this file safe!
              </p>
              <button 
                type="button"
                onClick={onExportData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm"
              >
                Download JSON Backup
              </button>
            </div>

            <div className="bg-orange-50 border border-orange-100 p-6 rounded-xl">
              <h3 className="font-bold text-orange-900 flex items-center gap-2 mb-2">
                <Upload size={20}/> Restore Database
              </h3>
              <p className="text-orange-800 text-sm mb-4">
                Restore your system from a backup file. 
                <span className="font-bold block mt-1"><AlertTriangle size={14} className="inline"/> Warning: This will completely replace all current data!</span>
              </p>
              <input 
                type="file" 
                accept=".json"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm"
              >
                Select Backup File to Restore
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Settings;
