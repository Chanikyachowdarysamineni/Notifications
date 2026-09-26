import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../lib/axios';
import useAuthStore from '../store/authStore';
import { Search, Bookmark, Sparkles, FolderOpen, Plus, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FileCard from '../components/FileCard';
import TargetAudienceSelector from '../components/TargetAudienceSelector';
import { EMPTY_STATES } from '../constants/copyMicrocopy';

export default function Files() {
  const user = useAuthStore(state => state.user);
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'saved' | 'pdf'
  const [audience, setAudience] = useState({ target_all: true, target_year: [], target_section: [] });

  // LocalStorage bookmarks
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('csehub_bookmarked_files') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('csehub_bookmarked_files', JSON.stringify(bookmarkedIds));
  }, [bookmarkedIds]);

  const toggleBookmark = (id) => {
    setBookmarkedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };
  
  const { data: files = [], isLoading } = useQuery({
    queryKey: ['files', searchTerm],
    queryFn: async () => {
      const res = await api.get(`/files${searchTerm ? `?search=${searchTerm}` : ''}`);
      return Array.isArray(res.data) ? res.data : [];
    }
  });

  const { register, handleSubmit, reset, formState: { isValid } } = useForm({ mode: 'onChange' });
  
  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('target_all', String(audience.target_all));
      data.append('target_year', JSON.stringify(audience.target_year));
      data.append('target_section', JSON.stringify(audience.target_section));
      if (formData.file?.[0]) data.append('file', formData.file[0]);
      
      return api.post('/files', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      setIsCreating(false);
      reset();
      setAudience({ target_all: true, target_year: [], target_section: [] });
    }
  });

  const canManage = ['admin', 'deo', 'faculty'].includes(user?.role);

  // Split files into recently added (< 3 days) vs older
  const recentFiles = useMemo(() => {
    return files.filter(f => {
      if (!f.createdAt) return false;
      const diffDays = (Date.now() - new Date(f.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 3;
    });
  }, [files]);

  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      if (activeTab === 'saved') {
        return bookmarkedIds.includes(file._id);
      }
      if (activeTab === 'pdf') {
        const type = (file.file_type || file.title || '').toLowerCase();
        return type.includes('pdf');
      }
      return true;
    });
  }, [files, activeTab, bookmarkedIds]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Files & Study Resources</h1>
          <p className="text-gray-500 text-sm">Lecture notes, syllabus, reference materials, and lab manuals</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search notes, PDFs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-base sm:text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
            activeTab === 'all'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
          }`}
        >
          All Resources ({files.length})
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
            activeTab === 'saved'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
          }`}
        >
          <Bookmark size={12} className={bookmarkedIds.length > 0 ? 'fill-amber-400 text-amber-400' : ''} />
          <span>Saved for Later ({bookmarkedIds.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pdf')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
            activeTab === 'pdf'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
          }`}
        >
          PDFs Only
        </button>
      </div>

      {/* Recently Added Section Pinned (if on 'all' tab without active search) */}
      {activeTab === 'all' && !searchTerm && recentFiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <Sparkles size={14} className="text-brand-500" />
            Recently Added Materials ({recentFiles.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recentFiles.map((file, idx) => (
              <FileCard
                key={`recent-${file._id}`}
                file={file}
                isBookmarked={bookmarkedIds.includes(file._id)}
                onToggleBookmark={toggleBookmark}
                index={idx}
              />
            ))}
          </div>
          <div className="border-b border-gray-100 dark:border-gray-800 pt-2"></div>
        </div>
      )}

      {/* Main Files Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-44 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-gray-950 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
          <div className="w-14 h-14 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center text-gray-400 mb-3">
            <FolderOpen size={28} />
          </div>
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">{EMPTY_STATES.files.title}</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">{EMPTY_STATES.files.subtitle}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
          {filteredFiles.map((file, idx) => (
            <FileCard
              key={file._id}
              file={file}
              isBookmarked={bookmarkedIds.includes(file._id)}
              onToggleBookmark={toggleBookmark}
              index={idx}
            />
          ))}
        </div>
      )}

      {/* FAB for creation (Admin / DEO / Faculty) */}
      {canManage && (
        <button
          onClick={() => setIsCreating(true)}
          className="fixed bottom-20 md:bottom-10 right-6 md:right-10 w-14 h-14 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 z-40 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/50"
          title="Upload Resource"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Create File Modal */}
      <AnimatePresence>
        {isCreating && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreating(false)} className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-gray-950 rounded-3xl p-6 z-50 shadow-2xl border border-gray-100 dark:border-gray-800"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold dark:text-white">Upload Resource</h2>
                <button onClick={() => setIsCreating(false)} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"><X size={20}/></button>
              </div>

              <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
                <input {...register('title', { required: true })} placeholder="Title (e.g. DBMS Unit 1 Notes)" className="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-900 dark:border-gray-800 outline-none focus:ring-2 focus:ring-brand-500/20 text-base" />
                <textarea {...register('description', { required: true })} placeholder="Description" rows={3} className="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-900 dark:border-gray-800 outline-none focus:ring-2 focus:ring-brand-500/20 resize-none text-base" />
                
                <div className="space-y-1">
                  <label className="text-sm font-medium dark:text-gray-300">Target Audience</label>
                  <TargetAudienceSelector 
                    targetAll={audience.target_all}
                    targetYears={audience.target_year}
                    targetSections={audience.target_section}
                    onChange={setAudience}
                  />
                </div>

                <input type="file" {...register('file', { required: true })} className="w-full text-xs" />
                <button type="submit" disabled={createMutation.isPending || !isValid} className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl font-semibold shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-70">
                  {createMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                  {createMutation.isPending ? 'Uploading...' : 'Upload'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
