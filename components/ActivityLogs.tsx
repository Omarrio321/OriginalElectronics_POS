
import React, { useState } from 'react';
import { ActivityLog } from '../types';
import { Search, Clock, User, Activity } from 'lucide-react';

interface ActivityLogsProps {
  logs: ActivityLog[];
}

const ActivityLogs: React.FC<ActivityLogsProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(log => 
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionColor = (action: string) => {
    switch (action) {
      case 'SALE': return 'bg-green-100 text-green-700';
      case 'LOGIN': return 'bg-blue-100 text-blue-700';
      case 'LOGOUT': return 'bg-gray-100 text-gray-700';
      case 'INVENTORY_DELETE': 
      case 'EXPENSE_DELETE': 
      case 'USER_DELETE': 
        return 'bg-red-100 text-red-700';
      case 'INVENTORY_UPDATE': 
      case 'USER_UPDATE':
        return 'bg-orange-100 text-orange-700';
      default: return 'bg-purple-100 text-purple-700';
    }
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Activity className="text-blue-600" />
          User Activity Logs
        </h1>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
        <Search className="text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search logs by user, action, or details..." 
          className="flex-1 outline-none text-gray-700"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase w-48">Time</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase w-40">User</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase w-40">Action</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No activity logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm text-gray-500 flex items-center gap-2">
                      <Clock size={14} />
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                           <User size={12} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{log.userName}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;
