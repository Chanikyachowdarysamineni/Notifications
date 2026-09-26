import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { cn } from '../lib/utils';
import { Loader2 } from 'lucide-react';

export default function NotificationToggle({ settings, settingKey, icon: Icon, title, description, colorClass }) {
  const queryClient = useQueryClient();
  const [localValue, setLocalValue] = useState(settings?.[settingKey] ?? true);

  const mutation = useMutation({
    mutationFn: async (newValue) => {
      return (await api.patch('/settings/me', { [settingKey]: newValue })).data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['settings', 'me'], data.settings);
    },
    onError: () => {
      // Revert on error
      setLocalValue(!localValue);
      alert('Couldn\'t save that — try again');
    }
  });

  useEffect(() => {
    if (!mutation.isPending && settings) {
      setLocalValue(settings[settingKey] ?? true);
    }
  }, [settings?.[settingKey], mutation.isPending]);

  const handleToggle = () => {
    const newValue = !localValue;
    setLocalValue(newValue);
    mutation.mutate(newValue);
  };

  return (
    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", colorClass)}>
          <Icon size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        disabled={mutation.isPending}
        onClick={handleToggle}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50",
          localValue ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700'
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
            localValue ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}
