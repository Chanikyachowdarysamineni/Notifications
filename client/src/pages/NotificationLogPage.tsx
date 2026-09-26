import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import { Activity, Mail, Smartphone, AlertCircle, CheckCircle2, Filter, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_ICONS = {
  sent: <CheckCircle2 size={16} className="text-green-500" />,
  failed: <AlertCircle size={16} className="text-red-500" />,
  suppressed: <Filter size={16} className="text-orange-500" />
};

export default function NotificationLogPage() {
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['notification-logs', page, filterType, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (filterType) params.append('type', filterType);
      if (filterStatus) params.append('status', filterStatus);
      const res = await api.get(`/admin/notification-log?${params.toString()}`);
      return res.data;
    },
    placeholderData: (prev: any) => prev
  });

  const logs = data?.data || [];
  const pagination = data?.pagination || { total: 0, pages: 1 };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Notification Logs</h1>
          <p className="text-gray-500 text-sm">Audit trail for automated system messages</p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <select 
            value={filterType} 
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="flex-1 sm:flex-none px-4 py-2 border dark:border-gray-800 dark:bg-gray-900 rounded-xl text-base sm:text-sm outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
          >
            <option value="">All Types</option>
            <option value="birthday">Birthdays</option>
            <option value="timetable_alert">Timetable</option>
            <option value="event_reminder">Events</option>
          </select>
          <select 
            value={filterStatus} 
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="flex-1 sm:flex-none px-4 py-2 border dark:border-gray-800 dark:bg-gray-900 rounded-xl text-base sm:text-sm outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
          >
            <option value="">All Statuses</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="suppressed">Suppressed</option>
          </select>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <Loader2 className="animate-spin text-brand-500" size={32} />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-x-auto">
              {logs.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">No logs found matching criteria.</div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <table className="hidden md:table w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Timestamp</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Recipient</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Channel</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {logs.map((log: any) => (
                        <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {new Date(log.sent_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900 dark:text-white">{log.recipient?.name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{log.recipient?.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium capitalize">
                              {log.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 capitalize">
                              {log.channel === 'email' ? <Mail size={14}/> : log.channel === 'push' ? <Smartphone size={14}/> : <Activity size={14}/>}
                              {log.channel}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-sm font-medium capitalize">
                              {(STATUS_ICONS as any)[log.status]}
                              <span className={
                                log.status === 'sent' ? 'text-green-600' :
                                log.status === 'failed' ? 'text-red-600' : 'text-orange-600'
                              }>
                                {log.status}
                              </span>
                            </div>
                            {log.error_message && (
                              <div className="text-xs text-red-500 mt-1 max-w-[200px] truncate" title={log.error_message}>
                                {log.error_message}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Mobile Cards */}
                  <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                    {logs.map((log: any) => (
                      <div key={log._id} className="p-4 space-y-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{log.recipient?.name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{log.recipient?.email}</div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center justify-end gap-1.5 text-sm font-medium capitalize">
                              {(STATUS_ICONS as any)[log.status]}
                              <span className={
                                log.status === 'sent' ? 'text-green-600' :
                                log.status === 'failed' ? 'text-red-600' : 'text-orange-600'
                              }>
                                {log.status}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">{new Date(log.sent_at).toLocaleTimeString()}</div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                          <span className="px-2 py-0.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs font-medium capitalize shadow-sm border border-gray-100 dark:border-gray-700">
                            {log.type.replace('_', ' ')}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 capitalize">
                            {log.channel === 'email' ? <Mail size={12}/> : log.channel === 'push' ? <Smartphone size={12}/> : <Activity size={12}/>}
                            {log.channel}
                          </div>
                        </div>
                        {log.error_message && (
                          <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-900/30">
                            {log.error_message}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Pagination footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
              <span className="text-sm text-gray-500">
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1}
                  className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} 
                  disabled={page === pagination.pages || pagination.pages === 0}
                  className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
