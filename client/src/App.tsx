import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from './store/authStore';
import AppShell from './components/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
import RegisterPageGuard from './components/RegisterPageGuard';

// Pages (to be implemented)
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Announcements from './pages/Announcements';
import Events from './pages/Events';
import TimeTable from './pages/TimeTable';
import Files from './pages/Files';
import Gallery from './pages/Gallery';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import RegisterUser from './pages/RegisterUser';
import PublicRegister from './pages/PublicRegister';
import CalendarPage from './pages/CalendarPage';
import CalendarCallback from './pages/CalendarCallback';
import SectionYearPage from './pages/SectionYearPage';
import NotificationLogPage from './pages/NotificationLogPage';
import StudentDetailPage from './pages/StudentDetailPage';
import BoardDisplayPage from './pages/BoardDisplayPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,              // Don't retry failed requests - prevents error spam
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60,  // Cache for 1 minute to reduce duplicate fetches
    },
  },
});

import { useEffect, useState } from 'react';
import api from './lib/axios';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      if (isAuthenticated) {
        try {
          await api.post('/auth/refresh');
        } catch (error) {
          logout();
        }
      }
      setIsInitializing(false);
    };
    restoreSession();
  }, [isAuthenticated, logout]);

  if (isInitializing) {
    return null; // Or a loading spinner
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : 
              <RegisterPageGuard>
                <PublicRegister />
              </RegisterPageGuard>
            } 
          />
          <Route path="/board" element={<ProtectedRoute><BoardDisplayPage /></ProtectedRoute>} />

          {/* Protected Routes inside AppShell */}
          <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="events" element={<Events />} />
            <Route path="timetable" element={<TimeTable />} />
            <Route path="files" element={<Files />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/:userId" element={
              <RoleGuard allowedRoles={['admin', 'deo']}>
                <Profile />
              </RoleGuard>
            } />
            <Route path="students/:studentId" element={
              <RoleGuard allowedRoles={['admin', 'deo', 'faculty']}>
                <StudentDetailPage />
              </RoleGuard>
            } />
            <Route path="settings" element={<Settings />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="/calendar/callback" element={<CalendarCallback />} />
            <Route path="admin/manage-users" element={
              <RoleGuard allowedRoles={['admin', 'deo']}>
                <RegisterUser />
              </RoleGuard>
            } />
            <Route path="admin/sections-years" element={
              <RoleGuard allowedRoles={['admin', 'deo']}>
                <SectionYearPage />
              </RoleGuard>
            } />
            <Route path="admin/notification-log" element={
              <RoleGuard allowedRoles={['admin', 'deo']}>
                <NotificationLogPage />
              </RoleGuard>
            } />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
