import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import api from '../lib/axios';

export default function RegisterPageGuard({ children }) {
  const { data: systemSettings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const res = await api.get('/system-settings');
      return res.data;
    },
    staleTime: 30000 // 30s
  });

  if (isLoading) {
    return null; // Or a spinner
  }

  if (systemSettings && !systemSettings.register_page_enabled) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-white dark:bg-gray-950 rounded-2xl shadow-sm text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Registration Closed</h2>
        <p className="text-gray-500">Registration is currently disabled by the administrator.</p>
      </div>
    );
  }

  return children;
}
