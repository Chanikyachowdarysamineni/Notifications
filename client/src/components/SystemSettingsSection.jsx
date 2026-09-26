import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { Settings2, UserPlus, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function SystemSettingsSection() {
  const queryClient = useQueryClient();

  const { data: systemSettings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => (await api.get('/system-settings')).data
  });

  const [localValue, setLocalValue] = useState(null);

  // Sync localValue with systemSettings once loaded
  if (systemSettings && localValue === null) {
    setLocalValue(!!systemSettings.register_page_enabled);
  }

  const systemMutation = useMutation({
    mutationFn: async (enabled) => {
      return (await api.put('/system-settings/register-page', { enabled })).data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['system-settings'], data);
    },
    onError: () => {
      // Revert on error
      setLocalValue(!localValue);
      alert('Failed to update system setting');
    }
  });

  const handleToggle = () => {
    const newValue = !localValue;
    setLocalValue(newValue);
    systemMutation.mutate(newValue);
  };

  if (isLoading) {
    return <div className="mt-8 p-12 flex justify-center"><Loader2 className="animate-spin text-brand-500" /></div>;
  }

  const enabled = localValue ?? !!systemSettings?.register_page_enabled;

  return (
    <>
      <div className="mt-8">
        <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
          <Settings2 size={20} className="text-brand-500" /> System Settings
        </h2>
        <p className="text-gray-500 text-sm">Global controls (Admin only)</p>
      </div>
      <div className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm mt-4">
        <div className="p-6 flex items-start justify-between">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 flex items-center justify-center shrink-0">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Allow New User Registration</h3>
              <p className="text-sm text-gray-500 mt-1">
                When off, the Register link is hidden from the login page and no new accounts can be created, including by DEO.
              </p>
            </div>
          </div>
          <div className="shrink-0 mt-1 ml-4">
            <button
              type="button"
              disabled={systemMutation.isPending}
              onClick={handleToggle}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50",
                enabled ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700'
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  enabled ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
