import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, BookOpen, Sparkles, User } from 'lucide-react';
import { getSubjectColor } from '../hooks/useSubjectColor';

export default function TimeTableGrid({ 
  periods = [], 
  selectedDay, 
  isLoading 
}) {
  const currentDayOfWeek = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[new Date().getDay()];
  }, []);

  const isToday = selectedDay === currentDayOfWeek;

  // Determine active period right now
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedDay}
        initial={{ opacity: 0, x: 15 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -15 }}
        transition={{ duration: 0.2 }}
        className="h-full flex flex-col"
      >
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-50 dark:bg-gray-900 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : periods.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center mb-3 text-gray-400">
              <BookOpen size={28} />
            </div>
            <p className="font-bold text-base text-gray-700 dark:text-gray-300">
              No classes scheduled for {selectedDay}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Take a break or review study materials for other days.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {periods.map((period, i) => {
              const palette = getSubjectColor(period.subject);
              
              // Check if period is active now
              const [startH, startM] = (period.start_time || '00:00').split(':').map(Number);
              const [endH, endM] = (period.end_time || '00:00').split(':').map(Number);
              const startTotal = startH * 60 + startM;
              const endTotal = endH * 60 + endM;
              
              const isOngoing = isToday && currentMinutes >= startTotal && currentMinutes < endTotal;
              const isUpcomingNext = isToday && currentMinutes < startTotal && (i === 0 || (periods[i-1] && (periods[i-1].end_time.split(':').map(Number)[0]*60 + periods[i-1].end_time.split(':').map(Number)[1]) <= currentMinutes));

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  className={`p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
                    isOngoing 
                      ? `${palette.bg} ${palette.border} ring-2 ring-brand-500 shadow-lg ${palette.glow}` 
                      : `bg-white dark:bg-gray-950 ${palette.border} hover:shadow-md hover:border-brand-300`
                  }`}
                >
                  {/* Active Now Pill */}
                  {isOngoing && (
                    <div className="absolute top-0 right-0 bg-brand-600 text-white text-xs font-extrabold px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-sm uppercase tracking-wider animate-pulse">
                      <Sparkles size={11} /> HAPPENING NOW
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className={`w-3.5 h-3.5 rounded-full mt-1.5 ${palette.accent} ${isOngoing ? 'animate-ping' : ''} shrink-0`}></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-400 font-mono">
                            Period {period.period_no || (i + 1)}
                          </span>
                          {isUpcomingNext && (
                            <span className="px-2 py-0.5 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 rounded-md text-xs font-bold">
                              Next Up
                            </span>
                          )}
                        </div>
                        <h3 className={`text-base sm:text-lg font-bold mt-0.5 ${palette.text}`}>
                          {period.subject}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <User size={13} />
                          <span>Prof. {period.faculty_id?.name || 'Unassigned'}</span>
                          {period.faculty_id?.email && (
                            <span className="text-gray-400 hidden sm:inline">({period.faculty_id.email})</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${palette.badgeBg} ${palette.text}`}>
                        <Clock size={14} />
                        <span>{period.start_time} - {period.end_time}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
