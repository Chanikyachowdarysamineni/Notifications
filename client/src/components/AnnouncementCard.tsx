import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Paperclip, ExternalLink, Sparkles, Check, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AnnouncementCard({ 
  announcement, 
  isSeen, 
  onToggleSeen,
  index = 0
}) {
  const isNew = React.useMemo(() => {
    if (!announcement?.createdAt) return false;
    const diffHours = (Date.now() - new Date(announcement.createdAt).getTime()) / (1000 * 60 * 60);
    return diffHours < 24;
  }, [announcement?.createdAt]);

  const timeAgo = React.useMemo(() => {
    try {
      return formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true });
    } catch {
      return '';
    }
  }, [announcement?.createdAt]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
      className={`relative bg-white dark:bg-gray-950 p-5 sm:p-6 rounded-3xl border transition-all duration-200 shadow-sm hover:shadow-md ${
        isSeen 
          ? 'border-gray-100 dark:border-gray-800 opacity-80' 
          : 'border-brand-100 dark:border-brand-900/30'
      }`}
    >
      <div className="flex gap-4">
        {/* Left Icon Pill */}
        <div className="hidden sm:flex w-11 h-11 bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 rounded-2xl items-center justify-center shrink-0 mt-0.5">
          <Bell size={20} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white truncate">
                {announcement.title}
              </h3>
              {isNew && !isSeen && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs font-extrabold rounded-full flex items-center gap-1 shadow-sm uppercase tracking-wider animate-pulse">
                  <Sparkles size={10} /> NEW
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{timeAgo}</span>
              {onToggleSeen && (
                <button
                  onClick={() => onToggleSeen(announcement._id)}
                  className={`p-1 rounded-lg transition-colors text-xs flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                    isSeen 
                      ? 'text-gray-400 hover:text-brand-600' 
                      : 'text-brand-600 hover:bg-brand-50 dark:text-brand-400 font-semibold'
                  }`}
                  title={isSeen ? 'Mark as unread' : 'Mark as seen'}
                >
                  <Check size={13} className={isSeen ? 'text-green-500' : ''} />
                  <span className="hidden sm:inline">{isSeen ? 'Seen' : 'Mark seen'}</span>
                </button>
              )}
            </div>
          </div>

          {/* HTML Content Body */}
          <div 
            className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 mb-3 line-clamp-4 leading-relaxed" 
            dangerouslySetInnerHTML={{ __html: announcement.content }} 
          />

          {/* External Link & Attachment Pills */}
          {(announcement.link || announcement.attachment_url) && (
            <div className="flex flex-wrap gap-2.5 my-3 pt-2 border-t border-gray-100 dark:border-gray-800/80">
              {announcement.link && (
                <a 
                  href={announcement.link} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300 dark:hover:bg-brand-900/40 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <ExternalLink size={13} /> Open Link
                </a>
              )}
              {announcement.attachment_url && (
                <a 
                  href={announcement.attachment_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
                >
                  <Paperclip size={13} /> View Attachment
                </a>
              )}
            </div>
          )}

          {/* Footer Metadata */}
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <span className="flex items-center gap-1">
              <User size={12} /> By {announcement.author?.name || 'Department Admin'}
            </span>
            {announcement.target_year?.length > 0 && (
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md font-medium text-xs">
                Targeted
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
