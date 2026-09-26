import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { 
  Heart, Plus, ImageIcon, Trash2, Edit2, Loader2, 
  AlertCircle, CheckCircle2, User 
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/authStore';
import PhotoUploadModal from '../components/PhotoUploadModal';
import PhotoLightbox from '../components/PhotoLightbox';

export default function Gallery() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [photoToEdit, setPhotoToEdit] = useState(null);
  const [editedDescription, setEditedDescription] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const isAdminOrDeo = ['admin', 'deo'].includes(user?.role);
  const isStudent = user?.role === 'student';

  // Fetch gallery photos
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: async () => {
      const res = await api.get('/gallery');
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  // Toggle Like Mutation (Students only)
  const likeMutation = useMutation({
    mutationFn: (id) => api.post(`/gallery/${id}/like`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['gallery'] });
      const previousPhotos = queryClient.getQueryData(['gallery']);
      queryClient.setQueryData(['gallery'], (old: any[] = []) =>
        old.map((p: any) => {
          if (p._id === id) {
            const isLiking = !p.is_liked;
            return { 
              ...p, 
              is_liked: isLiking, 
              like_count: Math.max(0, p.like_count + (isLiking ? 1 : -1)) 
            };
          }
          return p;
        })
      );
      return { previousPhotos };
    },
    onError: (err, id, context) => {
      if (context?.previousPhotos) {
        queryClient.setQueryData(['gallery'], context.previousPhotos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
    },
  });

  // Edit Description Mutation (Admin / DEO only)
  const editMutation = useMutation({
    mutationFn: async ({ id, description }: { id: any; description: string }) => {
      const res = await api.patch(`/gallery/${id}`, { description });
      return res.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      if (selectedPhoto && selectedPhoto._id === data.photo?._id) {
        setSelectedPhoto(data.photo);
      }
      setPhotoToEdit(null);
      setFeedbackMsg('Caption updated successfully.');
      setTimeout(() => setFeedbackMsg(''), 3000);
    },
  });

  // Delete Photo Mutation (Admin / DEO only)
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/gallery/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      if (selectedPhoto && selectedPhoto._id === photoToDelete?._id) {
        setSelectedPhoto(null);
      }
      setPhotoToDelete(null);
      setFeedbackMsg('Photo removed from gallery.');
      setTimeout(() => setFeedbackMsg(''), 3000);
    },
  });

  const handleEditSave = (e) => {
    e.preventDefault();
    if (!photoToEdit) return;
    editMutation.mutate({
      id: photoToEdit._id,
      description: editedDescription,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Admin/DEO Upload Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Photo Gallery</h1>
          <p className="text-gray-500 text-sm">
            Moments, events, and memories from CSE HUB
          </p>
        </div>

        {/* Upload Photo Button - ADMIN & DEO ONLY */}
        {isAdminOrDeo && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 self-start sm:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <Plus size={16} />
            <span>Upload Photo</span>
          </button>
        )}
      </div>

      {/* Success / Feedback Toast Notification */}
      {feedbackMsg && (
        <div className="p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/40 rounded-xl text-xs font-semibold text-green-700 dark:text-green-300 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 size={16} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse h-48 w-full"
            ></div>
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-950 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-8">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <ImageIcon size={32} />
          </div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
            No photos in the gallery yet
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {isAdminOrDeo
              ? 'Click the "+ Upload Photo" button above to publish moments and event photos.'
              : 'Photos published by the CSE Department administrators will appear here.'}
          </p>
        </div>
      ) : (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4 pb-12">
          {photos.map((photo) => (
            <div
              key={photo._id}
              className="relative group break-inside-avoid overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-900 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-800"
            >
              <img
                src={photo.image_url}
                alt={photo.description || 'CSE HUB Gallery Photo'}
                className="w-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-105"
                onClick={() => setSelectedPhoto(photo)}
                loading="lazy"
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3.5 pointer-events-none">
                {/* Top Corner Action Controls */}
                <div className="flex items-center justify-end gap-1.5 pointer-events-auto">
                  {/* Admin / DEO: Unconditional Edit & Delete */}
                  {isAdminOrDeo && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhotoToEdit(photo);
                          setEditedDescription(photo.description || '');
                        }}
                        className="p-1.5 bg-black/60 hover:bg-black text-white rounded-lg transition-colors text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        title="Edit Caption"
                      >
                        <Edit2 size={13} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhotoToDelete(photo);
                        }}
                        className="p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        title="Delete Photo"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>

                {/* Bottom Caption & Student Like */}
                <div className="pointer-events-auto">
                  {photo.description && (
                    <p className="text-white text-xs font-medium line-clamp-2 mb-1.5">
                      {photo.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-300">
                    <span className="flex items-center gap-1 truncate text-white/80">
                      <User size={11} /> {photo.uploaded_by?.name || 'CSE HUB'}
                    </span>

                    {/* Student Like Button */}
                    {isStudent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          likeMutation.mutate(photo._id);
                        }}
                        className="flex items-center gap-1 bg-black/40 hover:bg-black/70 px-2 py-0.5 rounded-full text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      >
                        <Heart
                          size={13}
                          className={photo.is_liked ? 'fill-red-500 text-red-500' : ''}
                        />
                        <span className="font-semibold text-xs">{photo.like_count || 0}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <PhotoLightbox
            photo={selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
            userRole={user?.role}
            onToggleLike={(id) => likeMutation.mutate(id)}
            onEditDescription={async (id: any, description: string) => {
              await editMutation.mutateAsync({ id, description });
            }}
            onDeletePhoto={(photo) => setPhotoToDelete(photo)}
            isLiking={likeMutation.isPending}
            isDeleting={deleteMutation.isPending}
            isEditing={editMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* Upload Photo Modal (Admin & DEO only) */}
      {isAdminOrDeo && (
        <PhotoUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['gallery'] });
            setFeedbackMsg('Photos uploaded to gallery successfully.');
            setTimeout(() => setFeedbackMsg(''), 3000);
          }}
        />
      )}

      {/* Edit Description Dialog (Admin & DEO only) */}
      {photoToEdit && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setPhotoToEdit(null)}
        >
          <div 
            className="bg-white dark:bg-gray-950 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-md w-full space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Edit Photo Caption
            </h3>
            
            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value.slice(0, 200))}
                  maxLength={200}
                  rows={3}
                  placeholder="Enter caption..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-base sm:text-sm text-gray-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 resize-none"
                  autoFocus
                />
                <span className="text-xs text-gray-400 block text-right mt-1">
                  {editedDescription.length}/200
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPhotoToEdit(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editMutation.isPending}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-70"
                >
                  {editMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog (Admin & DEO only) */}
      {photoToDelete && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setPhotoToDelete(null)}
        >
          <div 
            className="bg-white dark:bg-gray-950 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-sm w-full space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertCircle size={24} />
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Delete this photo?
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                This will permanently delete the photo and its likes from the CSE HUB Gallery.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setPhotoToDelete(null)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(photoToDelete._id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-red-500/20 transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-70"
              >
                {deleteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Delete Photo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
