import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar as CalendarIcon, Users, CheckCircle2, 
  CalendarCheck, Sparkles, Clock, AlertTriangle, Loader2 
} from 'lucide-react';
import { format, differenceInDays, isToday, isTomorrow, isPast } from 'date-fns';

export default function EventCard({
  event,
  isStudent,
  canManage,
  googleCalendarConnected,
  onRegister,
  onSyncCalendar,
  isRegistering = false,
  index = 0,
  onViewRegistrations
}) {
  const [justRegistered, setJustRegistered] = useState(false);

  const eventDate = new Date(event.event_date);
  const eventIsToday = isToday(eventDate);
  const eventIsTomorrow = isTomorrow(eventDate);
  const eventIsPast = isPast(eventDate) && !eventIsToday;
  const daysDiff = differenceInDays(eventDate, new Date());

  const isNew = React.useMemo(() => {
    if (!event?.createdAt) return false;
    const diffHours = (Date.now() - new Date(event.createdAt).getTime()) / (1000 * 60 * 60);
    return diffHours < 24;
  }, [event?.createdAt]);

  const getUrgencyBadge = () => {
    if (eventIsPast) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500">
          Past Event
        </span>
      );
    }
    if (eventIsToday) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center gap-1 animate-pulse border border-red-200 dark:border-red-900/50">
          <Clock size={12} /> Today!
        </span>
      );
    }
    if (eventIsTomorrow) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center gap-1 border border-amber-200 dark:border-amber-900/50">
          <AlertTriangle size={12} /> Tomorrow
        </span>
      );
    }
    if (daysDiff <= 3 && daysDiff > 0) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
          In {daysDiff} days
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
        {format(eventDate, 'EEE, MMM d')}
      </span>
    );
  };

  const handleRegisterClick = async () => {
    if (onRegister) {
      await onRegister(event._id);
      setJustRegistered(true);
      setTimeout(() => setJustRegistered(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.05, 0.3) }}
      className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
    >
      {/* Event Banner */}
      {event.attachment_url ? (
        <div className="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-900 relative">
          <img 
            src={event.attachment_url} 
            alt={event.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            loading="lazy" 
          />
          {isNew && (
            <span className="absolute top-3 left-3 px-2.5 py-0.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs font-extrabold rounded-full flex items-center gap-1 shadow-md uppercase tracking-wider">
              <Sparkles size={10} /> NEW
            </span>
          )}
        </div>
      ) : (
        <div className="aspect-video w-full bg-gradient-to-br from-brand-50 via-indigo-50 to-purple-50 dark:from-brand-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 flex items-center justify-center relative">
          <CalendarIcon size={44} className="text-brand-300 dark:text-brand-700/40" />
          {isNew && (
            <span className="absolute top-3 left-3 px-2.5 py-0.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs font-extrabold rounded-full flex items-center gap-1 shadow-md uppercase tracking-wider">
              <Sparkles size={10} /> NEW
            </span>
          )}
        </div>
      )}

      {/* Body Content */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          {getUrgencyBadge()}
          <span className="text-xs text-gray-400 font-mono">
            {format(eventDate, 'yyyy')}
          </span>
        </div>

        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {event.title}
        </h3>

        <div 
          className="prose prose-sm dark:prose-invert line-clamp-3 text-gray-600 dark:text-gray-400 mb-4 text-xs leading-relaxed" 
          dangerouslySetInnerHTML={{ __html: event.description }} 
        />

        {/* Footer Actions */}
        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
          <div className="text-xs text-gray-500 flex items-center gap-1 truncate">
            <Users size={13} className="shrink-0" />
            <span className="truncate">{event.author?.name || 'CSE Staff'}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Google Calendar Sync */}
            {googleCalendarConnected && (
              <button 
                onClick={() => onSyncCalendar && onSyncCalendar(event._id)}
                className="p-2 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-xl transition-colors text-xs flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                title="Sync to Google Calendar"
              >
                <CalendarCheck size={16} />
              </button>
            )}

            {/* Student Registration Button */}
            {isStudent && (
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={handleRegisterClick}
                disabled={event.is_registered || isRegistering}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  event.is_registered || justRegistered
                    ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300 cursor-default'
                    : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20 active:scale-95'
                }`}
              >
                {isRegistering ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : event.is_registered || justRegistered ? (
                  <>
                    <CheckCircle2 size={14} className="text-green-600 dark:text-green-400" />
                    <span>Registered</span>
                  </>
                ) : (
                  'Register Now'
                )}
              </motion.button>
            )}

            {/* Staff Management */}
            {canManage && (
              <button 
                onClick={() => onViewRegistrations && onViewRegistrations(event)}
                className="text-xs font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Users size={14} />
                <span>{event.registration_count || 0} Registered</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
