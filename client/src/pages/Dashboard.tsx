import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../store/authStore';
import api from '../lib/axios';
import { Bell, Calendar, Users, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import StudentDashboard from '../components/StudentDashboard';

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white dark:bg-gray-950 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-start gap-4">
    <div className={cn("p-3 rounded-xl", color)}>
      <Icon size={24} />
    </div>
    <div>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      {trend && <span className="text-xs font-medium text-green-600 mt-1 block">{trend}</span>}
    </div>
  </div>
);

export default function Dashboard() {
  const user = useAuthStore(state => state.user);

  // Fetch full profile for student year/section/cgpa details
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.userId],
    queryFn: async () => (await api.get(`/users/${user?.userId}`)).data,
    enabled: !!user?.userId
  });
  
  const { data: dashboardData, isLoading, isError: isDashboardError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboard');
      return res.data;
    }
  });

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data?.notifications?.slice(0, 5) || (Array.isArray(res.data) ? res.data.slice(0, 5) : []);
    }
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (isDashboardError) {
    return (
      <div className="p-8 text-center bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Failed to load dashboard</h2>
        <p className="text-sm text-gray-500 mt-2">Please refresh the page to try again.</p>
      </div>
    );
  }

  // 1. If student role, display personalized Student Dashboard
  if (user?.role === 'student') {
    return (
      <StudentDashboard
        user={user}
        profile={profile}
        dashboardData={dashboardData}
        notifications={notificationsData || []}
      />
    );
  }

  // 2. Admin, DEO & Faculty Dashboard
  const isAdminOrDeo = ['admin', 'deo'].includes(user?.role);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 capitalize">{user?.role} Dashboard</p>
      </div>

      {isAdminOrDeo ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Students" value={dashboardData?.stats?.students || 0} icon={Users} color="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" />
          <StatCard title="Total Faculty" value={dashboardData?.stats?.faculty || 0} icon={Users} color="bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400" />
          <StatCard title="Active Events" value={dashboardData?.stats?.events || 0} icon={Calendar} color="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400" />
          <StatCard title="New Files" value={dashboardData?.stats?.files || 0} icon={FileText} color="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl p-6 text-white shadow-md">
            <h3 className="font-semibold text-brand-100 flex items-center gap-2">
              <Calendar size={18} /> Today's Assigned Schedule
            </h3>
            <div className="mt-4 space-y-3">
              {dashboardData?.todayClasses?.length > 0 ? (
                dashboardData.todayClasses.map((cls, i) => (
                  <div key={i} className="flex justify-between items-center bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                    <div>
                      <p className="font-semibold">{cls.subject}</p>
                      <p className="text-sm text-brand-100">{cls.faculty_name}</p>
                    </div>
                    <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">{cls.start_time}</span>
                  </div>
                ))
              ) : (
                <p className="text-brand-100 text-sm">No classes assigned for today.</p>
              )}
            </div>
            <Link to="/timetable" className="inline-block mt-4 text-sm font-medium text-brand-100 hover:text-white underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded">View full timetable →</Link>
          </div>

          <div className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell size={18} className="text-gray-400" /> Recent Updates
            </h3>
            <div className="mt-4 space-y-4">
              {notificationsData?.length > 0 ? (
                notificationsData.map((notif, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="mt-0.5"><CheckCircle2 size={16} className="text-brand-500" /></div>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{notif.title || notif.message}</p>
                      <span className="text-xs text-gray-500">{new Date(notif.createdAt || notif.sent_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No new updates.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
