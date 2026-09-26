import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { Calendar as CalendarIcon, Loader2, CheckCircle2 } from 'lucide-react';

export default function CalendarConnectionCard({ settings }) {
  const queryClient = useQueryClient();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const connected = settings?.calendar_connected;

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await api.get('/calendar/auth-url');
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      alert('Failed to initiate Google Calendar connection.');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await api.delete('/calendar/disconnect');
      queryClient.invalidateQueries(['settings', 'me']);
    } catch (error) {
      alert('Failed to disconnect Google Calendar.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 flex items-center justify-center">
          <CalendarIcon size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            Google Calendar
            {connected && <CheckCircle2 size={16} className="text-green-500" />}
          </h3>
          <p className="text-sm text-gray-500">
            {connected ? 'Your account is connected.' : 'Sync events to your personal calendar.'}
          </p>
        </div>
      </div>
      
      {connected ? (
        <button
          onClick={handleDisconnect}
          disabled={isDisconnecting}
          className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isDisconnecting && <Loader2 size={14} className="animate-spin" />}
          Disconnect
        </button>
      ) : (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isConnecting && <Loader2 size={14} className="animate-spin" />}
          Connect
        </button>
      )}
    </div>
  );
}
