import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Volume2, Calendar, Megaphone, Cake, Clock, Info } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../lib/axios';
import { playNotificationSound } from '../lib/sound';
import useAuthStore from '../store/authStore';
import { onMessageListener } from '../firebase/notificationService';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const prevCountRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);

  // Fetch notifications
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data;
    },
    enabled: !!user?.userId,
    refetchInterval: 15000, // Poll every 15s
  });

  const unreadCount = data?.unreadCount || 0;
  const notifications = data?.notifications || [];

  // Play sound when new notifications arrive
  useEffect(() => {
    if (prevCountRef.current !== null && unreadCount > prevCountRef.current) {
      playNotificationSound();
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  // Also listen for active Firebase push notifications if active
  useEffect(() => {
    let mounted = true;
    const listen = async () => {
      try {
        const payload = await onMessageListener();
        if (payload && mounted) {
          playNotificationSound();
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          listen();
        }
      } catch (err) {
        // quiet catch
      }
    };
    listen();
    return () => {
      mounted = false;
    };
  }, [queryClient]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Mark single as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      await api.put(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.put('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = (item) => {
    if (!item.is_read) {
      markReadMutation.mutate(item._id);
    }
    setIsOpen(false);

    if (item.link) {
      navigate(item.link);
      return;
    }

    // Default routing based on notification type
    switch (item.type) {
      case 'announcement':
        navigate('/announcements');
        break;
      case 'event':
      case 'event_reminder':
        navigate('/events');
        break;
      case 'timetable':
      case 'timetable_alert':
        navigate('/timetable');
        break;
      case 'birthday':
        navigate('/dashboard');
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'announcement':
        return <Megaphone size={16} className="text-blue-500" />;
      case 'event':
      case 'event_reminder':
        return <Calendar size={16} className="text-purple-500" />;
      case 'birthday':
        return <Cake size={16} className="text-pink-500" />;
      case 'timetable':
      case 'timetable_alert':
        return <Clock size={16} className="text-amber-500" />;
      default:
        return <Info size={16} className="text-brand-500" />;
    }
  };

  const formatTimestamp = (dateStr) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-full transition-colors focus:outline-none"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-bold rounded-full border-2 border-white dark:border-gray-950 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[500px] bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800/80 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white text-base">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => playNotificationSound()}
                title="Test notification sound"
                className="p-1.5 text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-xs flex items-center gap-1"
              >
                <Volume2 size={15} />
                <span className="hidden sm:inline text-xs">Test</span>
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  className="p-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto flex-1 divide-y divide-gray-100 dark:divide-gray-800/60 max-h-[380px]">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3 text-gray-400">
                  <Bell size={24} />
                </div>
                <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">No notifications yet</p>
                <p className="text-xs text-gray-500 mt-1">Updates, alerts and events will appear here</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-900/60 cursor-pointer transition-colors flex items-start gap-3 relative ${
                    !item.is_read ? 'bg-brand-50/30 dark:bg-brand-950/20' : ''
                  }`}
                >
                  <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 shrink-0 mt-0.5">
                    {getNotificationIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className={`text-sm truncate ${!item.is_read ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                        {item.title || item.type?.replace('_', ' ').toUpperCase()}
                      </h4>
                      <span className="text-xs text-gray-400 shrink-0">
                        {formatTimestamp(item.createdAt || item.sent_at)}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {item.message || 'New update available'}
                    </p>
                  </div>

                  {!item.is_read && (
                    <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-2"></span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
