import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Download, Bookmark, Sparkles, 
  FileSpreadsheet, FileCode, FileImage, FileBox, 
  HardDrive, Check 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function FileCard({ 
  file, 
  isBookmarked, 
  onToggleBookmark,
  index = 0 
}) {
  const isRecent = React.useMemo(() => {
    if (!file?.createdAt) return false;
    const diffDays = (Date.now() - new Date(file.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 3;
  }, [file?.createdAt]);

  const timeAgo = React.useMemo(() => {
    try {
      return formatDistanceToNow(new Date(file.createdAt), { addSuffix: true });
    } catch {
      return '';
    }
  }, [file?.createdAt]);

  const getFileTypeDetails = (type = '', fileName = '') => {
    const combined = `${type} ${fileName}`.toLowerCase();
    if (combined.includes('pdf')) {
      return {
        icon: FileText,
        color: 'text-red-500',
        bg: 'bg-red-50 dark:bg-red-950/40',
        label: 'PDF Document'
      };
    }
    if (combined.includes('sheet') || combined.includes('excel') || combined.includes('csv') || combined.includes('xlsx')) {
      return {
        icon: FileSpreadsheet,
        color: 'text-green-600',
        bg: 'bg-green-50 dark:bg-green-950/40',
        label: 'Spreadsheet'
      };
    }
    if (combined.includes('word') || combined.includes('doc')) {
      return {
        icon: FileText,
        color: 'text-blue-600',
        bg: 'bg-blue-50 dark:bg-blue-950/40',
        label: 'Word Doc'
      };
    }
    if (combined.includes('image') || combined.includes('png') || combined.includes('jpg') || combined.includes('jpeg')) {
      return {
        icon: FileImage,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        label: 'Image File'
      };
    }
    if (combined.includes('zip') || combined.includes('rar') || combined.includes('tar')) {
      return {
        icon: FileBox,
        color: 'text-amber-600',
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        label: 'Archive'
      };
    }
    if (combined.includes('code') || combined.includes('js') || combined.includes('py') || combined.includes('java') || combined.includes('cpp')) {
      return {
        icon: FileCode,
        color: 'text-purple-600',
        bg: 'bg-purple-50 dark:bg-purple-950/40',
        label: 'Code / Script'
      };
    }
    return {
      icon: HardDrive,
      color: 'text-gray-600 dark:text-gray-400',
      bg: 'bg-gray-50 dark:bg-gray-900',
      label: 'Resource'
    };
  };

  const fileType = getFileTypeDetails(file.file_type, file.title || file.file_name);
  const IconComponent = fileType.icon;

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
      className="bg-white dark:bg-gray-950 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-brand-300 transition-all flex flex-col justify-between group relative"
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className={`w-12 h-12 rounded-2xl ${fileType.bg} ${fileType.color} flex items-center justify-center shrink-0 shadow-sm`}>
            <IconComponent size={24} />
          </div>

          <div className="flex items-center gap-1">
            {isRecent && (
              <span className="px-2 py-0.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs font-extrabold rounded-full flex items-center gap-1 shadow-sm uppercase tracking-wider">
                <Sparkles size={9} /> NEW
              </span>
            )}

            {/* Bookmark button */}
            <button
              onClick={() => onToggleBookmark && onToggleBookmark(file._id)}
              className={`p-2 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                isBookmarked 
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-500' 
                  : 'text-gray-300 hover:text-gray-500 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900'
              }`}
              title={isBookmarked ? 'Saved to bookmarks' : 'Save for later'}
            >
              <Bookmark size={16} className={isBookmarked ? 'fill-amber-500' : ''} />
            </button>
          </div>
        </div>

        <h4 
          className="font-bold text-sm sm:text-base text-gray-900 dark:text-white line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" 
          title={file.title}
        >
          {file.title}
        </h4>

        {file.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mt-1.5 leading-relaxed">
            {file.description}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="text-xs text-gray-400 space-y-0.5">
          <span className="font-medium text-gray-600 dark:text-gray-400 block font-mono">
            {formatSize(file.file_size)}
          </span>
          {timeAgo && <span className="block">{timeAgo}</span>}
        </div>

        <a
          href={file.file_url}
          target="_blank"
          rel="noreferrer"
          download
          className="p-2.5 rounded-xl bg-gray-50 hover:bg-brand-600 hover:text-white text-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-brand-600 dark:hover:text-white transition-all shadow-sm flex items-center gap-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          title="Download File"
        >
          <Download size={14} />
          <span className="hidden sm:inline">Download</span>
        </a>
      </div>
    </motion.div>
  );
}
