import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { Calendar as CalendarIcon, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function CalendarPage() {
  const user = useAuthStore(state => state.user);
  const queryClient = useQueryClient();

  // We refetch the profile just to get accurate google_calendar_connected state
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.userId],
    queryFn: async () => (await api.get(`/users/${user?.userId}`)).data,
    enabled: !!user?.userId,
  });

  const connectMutation = useMutation({
    mutationFn: async () => (await api.get('/calendar/auth-url')).data.url,
    onSuccess: (url) => { window.location.href = url; } // Redirect to Google OAuth
  });

  const disconnectMutation = useMutation({
    mutationFn: () => api.delete('/calendar/disconnect'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', user?.userId] })
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  const isConnected = profile?.google_calendar_connected;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold dark:text-white">Calendar Sync</h1>
        <p className="text-gray-500 text-sm">Sync CSE HUB events with Google Calendar</p>
      </div>

      <div className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm text-center">
        {!isConnected ? (
          <div className="space-y-6 max-w-md mx-auto">
            <div className="w-20 h-20 bg-brand-50 dark:bg-brand-900/20 text-brand-600 rounded-full flex items-center justify-center mx-auto">
              <CalendarIcon size={32} />
            </div>
            <h2 className="text-xl font-bold dark:text-white">Connect Google Calendar</h2>
            <p className="text-gray-500 text-sm">
              Never miss a class or event. Connecting your calendar allows you to instantly sync registered events and your weekly timetable with a single click across the app.
            </p>
            <button 
              onClick={() => connectMutation.mutate()}
              disabled={connectMutation.isPending}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 border border-gray-300 font-medium px-6 py-3 rounded-xl hover:bg-gray-50 transition-all dark:bg-gray-900 dark:border-gray-700 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-70"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              Sign in with Google
            </button>
            <p className="text-xs text-gray-400 mt-4">We only request permission to manage calendar events created by CSE HUB.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Google Calendar Connected</h2>
            <p className="text-gray-500 text-sm">
              Your account is successfully linked. You can now use the sync buttons on the Events and Time Table pages to push schedules directly to your calendar!
            </p>
            
            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
              <button 
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                className="text-red-500 hover:text-red-700 font-medium text-sm flex items-center justify-center gap-2 mx-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-md p-1 disabled:opacity-50"
              >
                <XCircle size={16} /> Disconnect Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
