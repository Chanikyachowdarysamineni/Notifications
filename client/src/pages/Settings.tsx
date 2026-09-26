import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import useAuthStore from '../store/authStore';
import { Bell, Gift, Calendar as CalendarIcon, Moon, Loader2 } from 'lucide-react';
import NotificationToggle from '../components/NotificationToggle';
import CalendarConnectionCard from '../components/CalendarConnectionCard';
import SystemSettingsSection from '../components/SystemSettingsSection';
import { cn } from '../lib/utils';

function DarkModeToggle({ settings }) {
  const queryClient = useQueryClient();
  const [localValue, setLocalValue] = useState(
    settings?.theme_preference === 'dark' || 
    (settings?.theme_preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  const mutation = useMutation({
    mutationFn: async (newValue: boolean) => {
      return (await api.patch('/settings/me', { theme_preference: newValue ? 'dark' : 'light' })).data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['settings', 'me'], data.settings);
    },
    onError: () => {
      setLocalValue(!localValue);
      alert('Couldn\'t save that — try again');
    }
  });

  useEffect(() => {
    if (!mutation.isPending && settings) {
      setLocalValue(
        settings.theme_preference === 'dark' || 
        (settings.theme_preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    }
  }, [settings?.theme_preference, mutation.isPending]);

  const handleToggle = () => {
    const newValue = !localValue;
    setLocalValue(newValue);
    mutation.mutate(newValue);
  };

  return (
    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 flex items-center justify-center">
          <Moon size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Dark Mode</h3>
          <p className="text-sm text-gray-500">Toggle dark theme</p>
        </div>
      </div>
      <button
        type="button"
        disabled={mutation.isPending}
        onClick={handleToggle}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50",
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

export default function Settings() {
  const user = useAuthStore(state => state.user);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings', 'me'],
    queryFn: async () => (await api.get('/settings/me')).data
  });

  useEffect(() => {
    if (settings?.theme_preference) {
      if (settings.theme_preference === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else if (settings.theme_preference === 'light') {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      } else {
        // System
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        localStorage.removeItem('theme');
      }
    }
  }, [settings?.theme_preference]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 h-full pb-10">
      <div>
        <h1 className="text-2xl font-bold dark:text-white">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your preferences</p>
      </div>

      <div className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-brand-500" /></div>
        ) : (
          <>
            <DarkModeToggle settings={settings} />
            
            <NotificationToggle
              settings={settings}
              settingKey="notification_enabled"
              icon={Bell}
              title="Push Notifications"
              description="Receive alerts for announcements"
              colorClass="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
            />

            <NotificationToggle
              settings={settings}
              settingKey="birthday_wish_enabled"
              icon={Gift}
              title="Birthday Wishes"
              description="Let the department celebrate you"
              colorClass="bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
            />

            <NotificationToggle
              settings={settings}
              settingKey="reminder_enabled"
              icon={CalendarIcon}
              title="Event Reminders"
              description="Get notified before events start"
              colorClass="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
            />

            <CalendarConnectionCard settings={settings} />
          </>
        )}
      </div>

      <div className="bg-white dark:bg-gray-950 rounded-3xl border border-red-100 dark:border-red-900 overflow-hidden shadow-sm p-6">
        <h3 className="font-semibold text-red-600 dark:text-red-400 mb-2">Account Security</h3>
        <p className="text-sm text-gray-500 mb-4">
          Sessions now persist indefinitely. If you lost a device or left your account logged in elsewhere, you can revoke all sessions immediately.
        </p>
        <button
          onClick={async () => {
            if (confirm('Are you sure you want to log out from ALL devices? You will be logged out here as well.')) {
              try {
                await api.post('/auth/logout-all-devices');
                useAuthStore.getState().logout();
                window.location.href = '/login';
              } catch (e) {
                alert('Failed to log out from all devices.');
              }
            }
          }}
          className="bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          Logout from all devices
        </button>
      </div>

      {user?.role === 'admin' && <SystemSettingsSection />}
    </div>
  );
}
