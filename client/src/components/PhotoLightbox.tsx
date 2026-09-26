import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Trash2, Edit2, Check, Loader2, Calendar, User, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

export default function PhotoLightbox({
  photo,
  onClose,
  userRole,
  onToggleLike,
  onEditDescription,
  onDeletePhoto,
  isLiking,
  isDeleting,
  isEditing
}) {
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editedDesc, setEditedDesc] = useState(photo?.description || '');
  const [showHeartPop, setShowHeartPop] = useState(false);
  const lastTapRef = useRef(0);

  if (!photo) return null;

  const isAdminOrDeo = ['admin', 'deo'].includes(userRole);
  const isStudent = userRole === 'student';

  const handleSaveDescription = async () => {
    if (onEditDescription) {
      await onEditDescription(photo._id, editedDesc);
      setIsEditingMode(false);
    }
  };

  // Double tap to like for students
  const handlePhotoClick = (e) => {
    e.stopPropagation();
    if (!isStudent) return;

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (!photo.is_liked && onToggleLike) {
        onToggleLike(photo._id);
      }
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 800);
    }
    lastTapRef.current = now;
  };

  const formattedDate = photo.createdAt 
    ? format(new Date(photo.createdAt), 'MMM d, yyyy')
    : '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 sm:p-6 backdrop-blur-md select-none"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-20"
        title="Close (Esc)"
      >
        <X size={22} />
      </button>

      {/* Main Container */}
      <div 
        className="max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Photo Display with double-tap listener */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative max-h-[70vh] sm:max-h-[75vh] flex items-center justify-center overflow-hidden rounded-2xl shadow-2xl cursor-pointer"
          onClick={handlePhotoClick}
        >
          <img
            src={photo.image_url}
            alt={photo.description || 'CSE HUB Gallery Photo'}
            className="max-w-full max-h-[70vh] sm:max-h-[75vh] object-contain rounded-2xl"
          />

          {/* Double Tap Heart Burst Animation */}
          <AnimatePresence>
            {showHeartPop && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.4, opacity: 1 }}
                exit={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="absolute flex items-center justify-center pointer-events-none drop-shadow-2xl"
              >
                <Heart size={90} className="fill-red-500 text-white stroke-[1.5]" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer Info & Actions Overlay */}
        <div className="w-full max-w-2xl mt-4 bg-gray-950/80 border border-gray-800/80 p-4 rounded-2xl backdrop-blur-md text-white space-y-3">
          <div className="flex items-center justify-between gap-3">
            {/* Author info */}
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <User size={14} className="text-brand-400" />
              <span className="font-semibold text-white">{photo.uploaded_by?.name || 'CSE HUB Member'}</span>
              {photo.uploaded_by?.role && (
                <span className="px-2 py-0.5 bg-brand-500/20 text-brand-300 rounded-full text-xs uppercase font-bold">
                  {photo.uploaded_by.role}
                </span>
              )}
              {formattedDate && (
                <span className="flex items-center gap-1 text-gray-400 ml-2">
                  <Calendar size={12} /> {formattedDate}
                </span>
              )}
            </div>

            {/* Role-based action buttons */}
            <div className="flex items-center gap-2">
              {/* Student: Like Button */}
              {isStudent && (
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => onToggleLike && onToggleLike(photo._id)}
                  disabled={isLiking}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    photo.is_liked
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  title="Like Photo (or double tap)"
                >
                  <Heart size={16} className={photo.is_liked ? 'fill-red-500 text-red-500' : ''} />
                  <span>{photo.like_count || 0}</span>
                </motion.button>
              )}

              {/* Admin/DEO: Edit Description Button */}
              {isAdminOrDeo && !isEditingMode && (
                <button
                  onClick={() => {
                    setEditedDesc(photo.description || '');
                    setIsEditingMode(true);
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white rounded-xl transition-colors text-xs flex items-center gap-1"
                  title="Edit Caption"
                >
                  <Edit2 size={15} />
                </button>
              )}

              {/* Admin/DEO: Delete Photo Button */}
              {isAdminOrDeo && (
                <button
                  onClick={() => onDeletePhoto && onDeletePhoto(photo)}
                  disabled={isDeleting}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors text-xs flex items-center gap-1"
                  title="Delete Photo"
                >
                  {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                </button>
              )}
            </div>
          </div>

          {/* Description Display or Inline Edit Mode */}
          {isEditingMode ? (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={editedDesc}
                onChange={(e) => setEditedDesc(e.target.value.slice(0, 200))}
                maxLength={200}
                placeholder="Enter caption..."
                className="flex-1 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                autoFocus
              />
              <button
                onClick={handleSaveDescription}
                disabled={isEditing}
                className="p-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1"
              >
                {isEditing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              </button>
              <button
                onClick={() => setIsEditingMode(false)}
                className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            photo.description && (
              <p className="text-sm text-gray-200 leading-relaxed">
                {photo.description}
              </p>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}
