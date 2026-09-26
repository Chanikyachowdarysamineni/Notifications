import React, { useState, useRef } from 'react';
import { X, UploadCloud, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';
import api from '../lib/axios';

export default function PhotoUploadModal({ isOpen, onClose, onSuccess }: any) {
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFiles = (files: any) => {
    setError('');
    const validFiles = [];
    const validPreviews = [];

    Array.from(files).forEach((file: any) => {
      if (!file.type.startsWith('image/')) {
        setError('Only image files (PNG, JPG, JPEG, WEBP) are allowed.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Images must be under 10MB each.');
        return;
      }
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    });

    setSelectedFiles((prev) => [...prev, ...validFiles].slice(0, 10));
    setPreviews((prev) => [...prev, ...validPreviews].slice(0, 10));
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setError('Please select at least one photo to upload.');
      return;
    }

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('images', file);
    });
    if (description.trim()) {
      formData.append('description', description.trim().slice(0, 200));
    }

    try {
      const res = await api.post('/gallery', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Cleanup preview URLs
      previews.forEach((url) => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setPreviews([]);
      setDescription('');
      
      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.message || 'Failed to upload photos. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    previews.forEach((url) => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviews([]);
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-gray-950 w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="text-brand-500" size={22} />
              Upload Photos to Gallery
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Admin & DEO exclusive gallery management
            </p>
          </div>

          <button
            onClick={handleClose}
            disabled={isUploading}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-xs font-medium text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Drag and Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
              isDragging
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30'
                : 'border-gray-200 dark:border-gray-800 hover:border-brand-400 hover:bg-gray-50/80 dark:hover:bg-gray-900/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />

            <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3">
              <UploadCloud size={24} />
            </div>

            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Click to select or drop photos here
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supports PNG, JPG, JPEG, WEBP (up to 10 photos, max 10MB each)
            </p>
          </div>

          {/* Selected Thumbnails */}
          {previews.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Selected Photos ({previews.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    previews.forEach((url) => URL.revokeObjectURL(url));
                    setSelectedFiles([]);
                    setPreviews([]);
                  }}
                  className="text-xs text-red-500 hover:underline"
                >
                  Clear all
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 max-h-40 overflow-y-auto p-1">
                {previews.map((url, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900">
                    <img src={url} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description / Caption */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Caption / Description (Optional)
              </label>
              <span className={`text-xs ${description.length >= 190 ? 'text-amber-500 font-bold' : 'text-gray-400'}`}>
                {description.length}/200
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              placeholder="e.g. Annual CSE Tech Symposium 2026 keynote session"
              rows={3}
              maxLength={200}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all resize-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={selectedFiles.length === 0 || isUploading}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-md ${
                selectedFiles.length > 0 && !isUploading
                  ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20 active:scale-95'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Uploading to Cloudinary...
                </>
              ) : (
                `Upload Photo${selectedFiles.length > 1 ? 's' : ''} (${selectedFiles.length})`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
