import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../lib/axios';
import useAuthStore from '../store/authStore';
import { Bell, Plus, Loader2, X, Search, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnnouncementCard from '../components/AnnouncementCard';
import TargetAudienceSelector from '../components/TargetAudienceSelector';
import { EMPTY_STATES } from '../constants/copyMicrocopy';

export default function Announcements() {
  const user = useAuthStore(state => state.user);
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread'
  
  const [audience, setAudience] = useState({ target_all: true, target_year: [], target_section: [] });

  // LocalStorage seen announcements for student UX
  const [seenIds, setSeenIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('csehub_seen_announcements') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('csehub_seen_announcements', JSON.stringify(seenIds));
  }, [seenIds]);

  const toggleSeen = (id) => {
    setSeenIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const res = await api.get('/announcements');
      return Array.isArray(res.data) ? res.data : [];
    }
  });

  const { data: years = [] } = useQuery({ queryKey: ['years'], queryFn: async () => {
    const res = await api.get('/years');
    return Array.isArray(res.data) ? res.data : [];
  }});
  const { data: sections = [] } = useQuery({ queryKey: ['all-sections'], queryFn: async () => {
    try { 
      const res = await api.get('/sections?year=all');
      return Array.isArray(res.data) ? res.data : [];
    } catch { return []; }
  }});

  const { register, handleSubmit, reset, formState: { isValid } } = useForm({ mode: 'onChange' });
  
  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('content', formData.content);
      if (formData.link) data.append('link', formData.link);
      
      data.append('target_all', String(audience.target_all));
      data.append('target_year', JSON.stringify(audience.target_year));
      data.append('target_section', JSON.stringify(audience.target_section));

      if (formData.file?.[0]) data.append('file', formData.file[0]);
      
      return api.post('/announcements', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setIsCreating(false);
      reset();
      setAudience({ target_all: true, target_year: [], target_section: [] });
    }
  });

  const onSubmit = (data) => createMutation.mutate(data);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(ann => {
      const matchesSearch = 
        ann.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ann.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      if (filterTab === 'unread') {
        return !seenIds.includes(ann._id);
      }
      return true;
    });
  }, [announcements, searchTerm, filterTab, seenIds]);

  const unreadCount = announcements.filter(a => !seenIds.includes(a._id)).length;

  return (
    <div className="space-y-6 relative h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Announcements</h1>
          <p className="text-gray-500 text-sm">Stay updated with department news, notices, and updates</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search updates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-base sm:text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
            filterTab === 'all'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
          }`}
        >
          All Updates ({announcements.length})
        </button>

        <button
          onClick={() => setFilterTab('unread')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
            filterTab === 'unread'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
          }`}
        >
          <Sparkles size={12} />
          <span>Unread ({unreadCount})</span>
        </button>
      </div>

      {/* Announcements Feed */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-950 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-950 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-8">
          <div className="w-14 h-14 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
            <Bell size={24} />
          </div>
          <p className="font-bold text-base text-gray-700 dark:text-gray-300">{EMPTY_STATES.announcements.title}</p>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">{EMPTY_STATES.announcements.subtitle}</p>
        </div>
      ) : (
        <div className="space-y-4 pb-10">
          {filteredAnnouncements.map((ann, idx) => (
            <AnnouncementCard
              key={ann._id}
              announcement={ann}
              isSeen={seenIds.includes(ann._id)}
              onToggleSeen={toggleSeen}
              index={idx}
            />
          ))}
        </div>
      )}

      {/* FAB for creation (Admin / DEO / Faculty only) */}
      {['admin', 'deo', 'faculty'].includes(user?.role) && (
        <button
          onClick={() => setIsCreating(true)}
          className="fixed bottom-20 md:bottom-10 right-6 md:right-10 w-14 h-14 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 z-40 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/50"
          title="Post Announcement"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Creation Modal */}
      <AnimatePresence>
        {isCreating && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreating(false)} className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 md:top-1/2 md:-translate-y-1/2 md:bottom-auto left-0 md:left-1/2 md:-translate-x-1/2 w-full md:w-[600px] bg-white dark:bg-gray-950 rounded-t-3xl md:rounded-3xl p-6 z-50 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-800"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold dark:text-white">Post Announcement</h2>
                <button onClick={() => setIsCreating(false)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"><X size={20}/></button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium dark:text-gray-300">Title <span className="text-red-500">*</span></label>
                  <input {...register('title', { required: true })} className="w-full px-4 py-2.5 rounded-xl border dark:bg-gray-900 dark:border-gray-800 dark:text-white text-base outline-none focus:ring-2 focus:ring-brand-500/20" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium dark:text-gray-300">Description <span className="text-red-500">*</span></label>
                  <textarea {...register('content', { required: true })} rows={4} className="w-full px-4 py-2.5 rounded-xl border dark:bg-gray-900 dark:border-gray-800 dark:text-white text-base outline-none focus:ring-2 focus:ring-brand-500/20" />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium dark:text-gray-300">Target Audience</label>
                  <TargetAudienceSelector 
                    targetAll={audience.target_all}
                    targetYears={audience.target_year}
                    targetSections={audience.target_section}
                    onChange={setAudience}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium dark:text-gray-300">Attachment (Optional)</label>
                  <input type="file" {...register('file')} className="w-full px-4 py-2 rounded-xl border border-dashed dark:border-gray-800 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700" />
                </div>

                <div className="pt-4 border-t dark:border-gray-800 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsCreating(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={createMutation.isPending || !isValid} className="px-5 py-2.5 bg-brand-600 text-white font-medium hover:bg-brand-700 rounded-xl flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-70">
                    {createMutation.isPending && <Loader2 size={16} className="animate-spin" />} Post
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
