import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../lib/axios';
import useAuthStore from '../store/authStore';
import { Plus, X, Search, Calendar as CalendarIcon, CheckCircle2, Download, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EventCard from '../components/EventCard';
import TargetAudienceSelector from '../components/TargetAudienceSelector';
import { EMPTY_STATES } from '../constants/copyMicrocopy';

export default function Events() {
  const user = useAuthStore(state => state.user);
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'registered'
  const [audience, setAudience] = useState({ target_all: true, target_year: [], target_section: [] });
  const [viewingRegistrations, setViewingRegistrations] = useState<any>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await api.get('/events');
      return Array.isArray(res.data) ? res.data : [];
    }
  });

  const { register, handleSubmit, reset, formState: { isValid } } = useForm({ mode: 'onChange' });
  
  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'file') {
          if (formData.file?.[0]) data.append('file', formData.file[0]);
        } else if (formData[key]) {
          data.append(key, formData[key]);
        }
      });
      data.append('target_all', String(audience.target_all));
      data.append('target_year', JSON.stringify(audience.target_year));
      data.append('target_section', JSON.stringify(audience.target_section));
      return api.post('/events', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsCreating(false);
      reset();
      setAudience({ target_all: true, target_year: [], target_section: [] });
    }
  });

  const registerMutation = useMutation({
    mutationFn: (eventId) => api.post(`/events/${eventId}/register`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] })
  });

  const { data: registrations = [], isLoading: isLoadingRegs } = useQuery({
    queryKey: ['registrations', viewingRegistrations?._id],
    queryFn: async () => {
      const res = await api.get(`/events/${viewingRegistrations._id}/registrations`);
      return res.data;
    },
    enabled: !!viewingRegistrations
  });

  const downloadCSV = () => {
    if (!registrations || registrations.length === 0) return;
    
    const headers = ['Name', 'Registration No', 'Year', 'Section'];
    const rows = registrations.map((r: any) => [
      r.student_id?.name || 'N/A',
      r.student_id?.reg_no || 'N/A',
      r.student_id?.year?.name || 'N/A',
      r.student_id?.section?.name || 'N/A'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map((row: string[]) => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${viewingRegistrations.title.replace(/\s+/g, '_')}_registrations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isStudent = user?.role === 'student';
  const canManage = ['admin', 'deo', 'faculty'].includes(user?.role);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      if (filterTab === 'registered') {
        return event.is_registered;
      }
      return true;
    });
  }, [events, searchTerm, filterTab]);

  const registeredCount = events.filter(e => e.is_registered).length;

  return (
    <div className="space-y-6 relative h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Upcoming Events</h1>
          <p className="text-gray-500 text-sm">Discover, attend, and register for workshops, hackathons, and department fests</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-base sm:text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
      </div>

      {/* Filter Tabs for Students */}
      {isStudent && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
              filterTab === 'all'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
            }`}
          >
            All Events ({events.length})
          </button>

          <button
            onClick={() => setFilterTab('registered')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
              filterTab === 'registered'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
            }`}
          >
            <CheckCircle2 size={12} />
            <span>My Registered ({registeredCount})</span>
          </button>
        </div>
      )}

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-72 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-950 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-8">
          <div className="w-14 h-14 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
            <CalendarIcon size={24} />
          </div>
          <p className="font-bold text-base text-gray-700 dark:text-gray-300">{EMPTY_STATES.events.title}</p>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">{EMPTY_STATES.events.subtitle}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
          {filteredEvents.map((event, idx) => (
            <EventCard
              key={event._id}
              event={event}
              isStudent={isStudent}
              canManage={canManage}
              googleCalendarConnected={user?.google_calendar_connected}
              onRegister={(id) => registerMutation.mutateAsync(id)}
              onSyncCalendar={(id) => api.post(`/calendar/sync-event/${id}`).then(() => alert('Synced to Google Calendar!'))}
              isRegistering={registerMutation.isPending}
              onViewRegistrations={(event) => setViewingRegistrations(event)}
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
          title="Create Event"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Create Event Modal */}
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
                <h2 className="text-xl font-bold dark:text-white">Create Event</h2>
                <button onClick={() => setIsCreating(false)} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"><X size={20}/></button>
              </div>

              <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
                <input {...register('title', { required: true })} placeholder="Event Title" className="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-900 dark:border-gray-800 outline-none focus:ring-2 focus:ring-brand-500/20 text-base" />
                <textarea {...register('description')} placeholder="Description" rows={3} className="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-900 dark:border-gray-800 outline-none focus:ring-2 focus:ring-brand-500/20 resize-none text-base" />
                <input type="date" {...register('event_date', { required: true })} className="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-900 dark:border-gray-800 outline-none focus:ring-2 focus:ring-brand-500/20 text-base" />
                
                <div className="space-y-1">
                  <label className="text-sm font-medium dark:text-gray-300">Target Audience</label>
                  <TargetAudienceSelector 
                    targetAll={audience.target_all}
                    targetYears={audience.target_year}
                    targetSections={audience.target_section}
                    onChange={setAudience}
                  />
                </div>

                <input type="file" accept="image/*" {...register('file')} className="w-full text-xs" />
                <button type="submit" disabled={createMutation.isPending || !isValid} className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl font-semibold shadow-md shadow-brand-500/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-70">
                  {createMutation.isPending ? 'Publishing Event...' : 'Publish Event'}
                </button>
              </form>
            </motion.div>
          </>
        )}

        {/* View Registrations Modal */}
        {viewingRegistrations && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewingRegistrations(null)} className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] flex flex-col bg-white dark:bg-gray-950 rounded-3xl z-50 shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start gap-4">
                <div>
                  <h2 className="text-xl font-bold dark:text-white line-clamp-1">{viewingRegistrations.title}</h2>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                    <Users size={14} /> {registrations.length} Registrations
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={downloadCSV}
                    disabled={registrations.length === 0}
                    className="px-3 py-1.5 text-sm font-medium bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-300 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    <Download size={16} /> Export CSV
                  </button>
                  <button onClick={() => setViewingRegistrations(null)} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"><X size={20}/></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900/50">
                {isLoadingRegs ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : registrations.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">No one has registered for this event yet.</div>
                ) : (
                  <div className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 font-medium">
                        <tr>
                          <th className="px-4 py-3">Student Name</th>
                          <th className="px-4 py-3">Reg No</th>
                          <th className="px-4 py-3 hidden sm:table-cell">Year / Section</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {registrations.map((r: any) => (
                          <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{r.student_id?.name || 'Unknown'}</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.student_id?.reg_no || 'Unknown'}</td>
                            <td className="px-4 py-3 hidden sm:table-cell text-gray-600 dark:text-gray-400">
                              {r.student_id?.year?.name || '-'} / {r.student_id?.section?.name || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
