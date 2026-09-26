import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, Clock, FileText, Image as ImageIcon, Bell, 
  ArrowRight, Award, CheckCircle2, ChevronRight, 
  Sparkles, CalendarCheck, BookOpen
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getSubjectColor } from '../hooks/useSubjectColor';
import { GREETINGS, EMPTY_STATES } from '../constants/copyMicrocopy';

export default function StudentDashboard({ user, profile, dashboardData, notifications = [] }) {
  // Determine dynamic time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return GREETINGS.morning;
    if (hour >= 12 && hour < 17) return GREETINGS.afternoon;
    if (hour >= 17 && hour < 22) return GREETINGS.evening;
    return GREETINGS.night;
  }, []);

  const studentName = profile?.name || user?.name || 'Student';
  const firstName = studentName.split(' ')[0];
  const yearName = profile?.year?.name || (typeof profile?.year === 'string' ? profile.year : '');
  const sectionName = profile?.section?.name || (typeof profile?.section === 'string' ? profile.section : '');
  const cgpa = typeof profile?.cgpa === 'number' ? profile.cgpa : (typeof user?.cgpa === 'number' ? user.cgpa : null);

  // Calculate next class / current class
  const todayClasses = dashboardData?.todayClasses || [];
  
  const classStatus = useMemo(() => {
    if (todayClasses.length === 0) return { status: 'none', text: 'No classes today' };
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (let cls of todayClasses) {
      const [startH, startM] = (cls.start_time || '00:00').split(':').map(Number);
      const [endH, endM] = (cls.end_time || '00:00').split(':').map(Number);
      const startTotal = startH * 60 + startM;
      const endTotal = endH * 60 + endM;

      if (currentMinutes >= startTotal && currentMinutes < endTotal) {
        return {
          status: 'ongoing',
          cls,
          text: `In progress: ${cls.subject}`,
          subtext: `Until ${cls.end_time} • Prof. ${cls.faculty_name || 'Faculty'}`
        };
      }
      if (currentMinutes < startTotal) {
        const diff = startTotal - currentMinutes;
        return {
          status: 'upcoming',
          cls,
          text: `${cls.subject} starts in ${diff} min`,
          subtext: `${cls.start_time} - ${cls.end_time} • Prof. ${cls.faculty_name || 'Faculty'}`
        };
      }
    }

    return {
      status: 'done',
      text: 'All classes completed today!',
      subtext: 'Great work! Take a break or review study materials.'
    };
  }, [todayClasses]);

  // CGPA Progress Ring calculation (0 to 10 scale)
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = cgpa !== null ? circumference - (cgpa / 10) * circumference : circumference;

  const quickActions = [
    { title: 'Time Table', desc: 'Schedule & Classes', icon: Calendar, path: '/timetable', color: 'from-blue-500 to-indigo-600', iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300' },
    { title: 'Resources', desc: 'Notes & Syllabus', icon: FileText, path: '/files', color: 'from-emerald-500 to-teal-600', iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300' },
    { title: 'Events', desc: 'Workshops & Fests', icon: Sparkles, path: '/events', color: 'from-purple-500 to-pink-600', iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300' },
    { title: 'Gallery', desc: 'Moments & Photos', icon: ImageIcon, path: '/gallery', color: 'from-amber-500 to-orange-600', iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300' }
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Personalized Greeting Header */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-brand-500/10"
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {profile?.profile_image_url ? (
              <img
                src={profile.profile_image_url}
                alt={studentName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white/30 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl sm:text-3xl font-bold border border-white/30 shadow-md">
                {firstName.charAt(0)}
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold text-white/90">
                  {yearName ? `Year ${yearName}` : 'CSE Student'}{sectionName ? ` • Sec ${sectionName}` : ''}
                </span>
                {profile?.reg_no && (
                  <span className="text-xs text-white/70 font-mono">
                    #{profile.reg_no}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {greeting}, {firstName} 👋
              </h1>
              <p className="text-sm text-white/80 mt-1">
                Computer Science & Engineering • CSE HUB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              to="/calendar"
              className="px-4 py-2 bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-md rounded-xl text-xs font-semibold text-white transition-all flex items-center gap-1.5 border border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <CalendarCheck size={15} />
              <span>Calendar</span>
            </Link>
          </div>
        </div>

        {/* Decorative ambient background blurbs */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-16 w-48 h-48 bg-purple-500/20 rounded-full blur-xl pointer-events-none"></div>
      </motion.div>

      {/* 2. Today at a Glance Hero Card + CGPA Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Today at a Glance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="lg:col-span-2 bg-white dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <Clock size={18} className="text-brand-500" />
                Today at a Glance
              </h3>
              <span className="text-xs font-semibold px-2.5 py-1 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 rounded-full">
                {todayClasses.length} Classes Today
              </span>
            </div>

            {/* Next / Active Class Status Banner */}
            <div className={`p-4 rounded-2xl border transition-all mb-4 ${
              classStatus.status === 'ongoing'
                ? 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 animate-pulse'
                : classStatus.status === 'upcoming'
                ? 'bg-brand-50/60 border-brand-200 dark:bg-brand-950/30 dark:border-brand-900/40 text-brand-900 dark:text-brand-200'
                : 'bg-green-50/60 border-green-200 dark:bg-green-950/30 dark:border-green-900/40 text-green-900 dark:text-green-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    classStatus.status === 'ongoing' ? 'bg-amber-500 animate-ping' : classStatus.status === 'upcoming' ? 'bg-brand-500' : 'bg-green-500'
                  }`}></div>
                  <div>
                    <h4 className="font-bold text-sm">{classStatus.text}</h4>
                    {classStatus.subtext && (
                      <p className="text-xs opacity-80 mt-0.5">{classStatus.subtext}</p>
                    )}
                  </div>
                </div>
                <Link to="/timetable" className="text-xs font-semibold underline underline-offset-2 flex items-center gap-0.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded">
                  View <ChevronRight size={14} />
                </Link>
              </div>
            </div>

            {/* Compact timeline preview */}
            <div className="space-y-2.5">
              {todayClasses.slice(0, 3).map((cls, idx) => {
                const palette = getSubjectColor(cls.subject);
                return (
                  <div 
                    key={idx} 
                    className={`flex items-center justify-between p-3 rounded-xl border ${palette.bg} ${palette.border} transition-transform hover:scale-[1.01]`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${palette.accent}`}></div>
                      <div>
                        <p className={`font-semibold text-xs sm:text-sm ${palette.text}`}>
                          {cls.subject}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Prof. {cls.faculty_name || 'Faculty'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${palette.badgeBg} ${palette.text}`}>
                      {cls.start_time} - {cls.end_time}
                    </span>
                  </div>
                );
              })}

              {todayClasses.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-xs flex flex-col items-center">
                  <BookOpen size={28} className="mb-2 opacity-50" />
                  <p className="font-medium text-gray-600 dark:text-gray-300">No classes scheduled for today</p>
                  <p className="text-xs text-gray-400 mt-0.5">Check full timetable for upcoming weekday schedules</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
            <span>Weekly Schedule: Mon – Sat</span>
            <Link to="/timetable" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded">
              Full Schedule <ArrowRight size={13} />
            </Link>
          </div>
        </motion.div>

        {/* CGPA Progress Gauge & Academic Snapshot Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <Award size={18} className="text-amber-500" />
                Academic Standing
              </h3>
              <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded-full">
                Good Standing
              </span>
            </div>

            {/* Circular CGPA Gauge */}
            <div className="flex flex-col items-center justify-center my-4">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    className="text-gray-100 dark:text-gray-800"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    className="text-brand-600 transition-all duration-1000 ease-out"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-gray-900 dark:text-white">
                    {cgpa !== null ? cgpa.toFixed(2) : '--'}
                  </span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    CGPA / 10
                  </span>
                </div>
              </div>

              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-2">
                {cgpa === null 
                  ? 'Awaiting First Semester Results' 
                  : cgpa >= 9.0 
                  ? 'Top 5% Department Honor' 
                  : cgpa >= 8.0 
                  ? 'First Class with Distinction' 
                  : 'First Class'}
              </p>
            </div>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Department</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">CSE</span>
            </div>
            <div className="flex justify-between">
              <span>Current Year</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{yearName ? `Year ${yearName}` : 'Unassigned'}</span>
            </div>
            <div className="flex justify-between">
              <span>Section</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{sectionName ? `Section ${sectionName}` : 'Unassigned'}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 3. Quick Action Chips Row (Large tap targets & smooth mobile scroll) */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
          Quick Access
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {quickActions.map((action, i) => (
            <Link
              key={i}
              to={action.path}
              className="p-4 bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-brand-300 transition-all flex items-center gap-3.5 group active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <div className={`p-3 rounded-2xl ${action.iconBg} transition-transform group-hover:scale-110 shrink-0`}>
                <action.icon size={20} />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                  {action.title}
                </h4>
                <p className="text-xs text-gray-400 truncate">
                  {action.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 4. Recent Department Updates */}
      <div className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <Bell size={18} className="text-gray-400" />
            Recent Department Updates
          </h3>
          <Link to="/announcements" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded">
            See All <ChevronRight size={14} />
          </Link>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {notifications && notifications.length > 0 ? (
            notifications.map((notif, idx) => (
              <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3">
                <div className="mt-0.5 p-1 bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 rounded-lg shrink-0">
                  <CheckCircle2 size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {notif.title || notif.message}
                  </p>
                  {notif.message && notif.title && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{notif.message}</p>
                  )}
                  <span className="text-xs text-gray-400 mt-1 block">
                    {new Date(notif.createdAt || notif.sent_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-gray-400 text-xs">
              <p className="font-medium text-gray-600 dark:text-gray-300">{EMPTY_STATES.dashboard.title}</p>
              <p className="text-gray-400 mt-1">{EMPTY_STATES.dashboard.subtitle}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
