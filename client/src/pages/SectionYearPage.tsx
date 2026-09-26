import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { Layers, Folder, Plus, Trash2, AlertCircle, X, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmDialog = ({ isOpen, title, message, dependencies, onClose, onConfirm, isPending }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-950 rounded-3xl p-6 z-50 shadow-2xl">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
            <AlertCircle size={24} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
          
          {dependencies && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-xl mb-6 text-sm">
              <p className="font-semibold mb-2">Warning: Dependency Conflict</p>
              <ul className="list-disc pl-5 space-y-1">
                {dependencies.students > 0 && <li>{dependencies.students} Students</li>}
                {dependencies.sections > 0 && <li>{dependencies.sections} Sections</li>}
                {dependencies.timetables > 0 && <li>{dependencies.timetables} Timetable Entries</li>}
              </ul>
              <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-900/50 flex items-start gap-2">
                <input type="checkbox" id="forceConfirm" className="mt-1" />
                <label htmlFor="forceConfirm">I understand this will cascade delete or disconnect all the above records.</label>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-xl font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500">Cancel</button>
            <button 
              onClick={() => {
                const isForce = !!dependencies;
                if (isForce && !(document.getElementById('forceConfirm') as HTMLInputElement).checked) {
                  alert("You must check the confirmation box to proceed with a forced delete.");
                  return;
                }
                onConfirm(isForce);
              }} 
              disabled={isPending}
              className="px-5 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-xl font-medium flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-70"
            >
              {isPending && <Loader2 size={16} className="animate-spin" />} Delete
            </button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default function SectionYearPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('years');
  const [selectedYearFilter, setSelectedYearFilter] = useState('');
  
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null); // { type, id, dependencies, title }

  const { data: years = [] } = useQuery({ 
    queryKey: ['years'], 
    queryFn: async () => {
      const res = await api.get('/years');
      return Array.isArray(res.data) ? res.data : [];
    }
  });
  const { data: sections = [] } = useQuery({ 
    queryKey: ['sections', selectedYearFilter], 
    queryFn: async () => {
      const res = await api.get(`/sections?year=${selectedYearFilter}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: activeTab === 'sections' 
  });

  const yearMutation = useMutation({
    mutationFn: (data) => api.post('/years', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['years'] }); setIsYearModalOpen(false); }
  });

  const sectionMutation = useMutation({
    mutationFn: (data) => api.post('/sections', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sections'] }); setIsSectionModalOpen(false); }
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ type, id, force }: any) => await api.delete(`/${type}s/${id}${force ? '?force=true' : ''}`),
    onSuccess: (_, { type }) => {
      queryClient.invalidateQueries({ queryKey: [`${type}s`] });
      setConfirmDialog(null);
    },
    onError: (err: any, { type, id }: any) => {
      if (err.response?.status === 409) {
        setConfirmDialog({
          type, id,
          title: `Cannot Delete ${type === 'year' ? 'Year' : 'Section'}`,
          message: err.response.data.message,
          dependencies: err.response.data.dependencies
        });
      } else {
        alert("Delete failed");
        setConfirmDialog(null);
      }
    }
  });

  const handleDeleteClick = (type, id, name) => {
    setConfirmDialog({
      type, id,
      title: `Delete ${name}?`,
      message: `Are you sure you want to delete ${name}? This action cannot be undone.`,
      dependencies: null
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Academic Structure</h1>
          <p className="text-gray-500 text-sm">Manage Years and Sections</p>
        </div>
      </div>

      <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-xl w-full sm:w-80">
        <button onClick={() => setActiveTab('years')} className={cn("flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500", activeTab === 'years' ? "bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white" : "text-gray-500")}>
          <Layers size={16}/> Years
        </button>
        <button onClick={() => setActiveTab('sections')} className={cn("flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500", activeTab === 'sections' ? "bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white" : "text-gray-500")}>
          <Folder size={16}/> Sections
        </button>
      </div>

      <div className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
        {activeTab === 'years' ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold dark:text-white">Configured Years</h2>
              <button onClick={() => setIsYearModalOpen(true)} className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                <Plus size={16}/> Add Year
              </button>
            </div>
            {years.length === 0 ? <p className="text-gray-500 text-center py-8">No years configured.</p> : (
              <div className="grid gap-3">
                {years.map(y => (
                  <div key={y._id} className="flex justify-between items-center p-4 border dark:border-gray-800 rounded-xl">
                    <div>
                      <h3 className="font-semibold dark:text-white">{y.name}</h3>
                      <p className="text-xs text-gray-500">Year Value: {y.year_number}</p>
                    </div>
                    <button onClick={() => handleDeleteClick('year', y._id, y.name)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"><Trash2 size={18}/></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <h2 className="text-lg font-bold dark:text-white whitespace-nowrap">Sections in:</h2>
                <select value={selectedYearFilter} onChange={e => setSelectedYearFilter(e.target.value)} className="px-4 py-2 border dark:border-gray-800 dark:bg-gray-900 rounded-xl text-base sm:text-sm w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                  <option value="">All Years</option>
                  {years.map(y => <option key={y._id} value={y._id}>{y.name}</option>)}
                </select>
              </div>
              <button onClick={() => setIsSectionModalOpen(true)} className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                <Plus size={16}/> Add Section
              </button>
            </div>
            {sections.length === 0 ? <p className="text-gray-500 text-center py-8">No sections found.</p> : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sections.map(s => (
                  <div key={s._id} className="flex justify-between items-center p-4 border dark:border-gray-800 rounded-xl">
                    <h3 className="font-semibold dark:text-white">{s.name}</h3>
                    <button onClick={() => handleDeleteClick('section', s._id, s.name)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"><Trash2 size={18}/></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Year Modal */}
      <AnimatePresence>
        {isYearModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white dark:bg-gray-950 p-6 rounded-3xl w-full max-w-sm">
              <div className="flex justify-between items-center mb-4"><h3 className="font-bold dark:text-white">Add Year</h3><button onClick={() => setIsYearModalOpen(false)} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 rounded-md p-1"><X size={20}/></button></div>
              <form onSubmit={e => { e.preventDefault(); yearMutation.mutate({ year_number: (e.target as any).num.value, label: (e.target as any).label.value } as any); }} className="space-y-4">
                <input name="num" type="number" required min="1" max="5" placeholder="Numeric Value (e.g. 1)" className="w-full p-3 border dark:border-gray-800 dark:bg-gray-900 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-500/20" />
                <input name="label" required placeholder="Display Label (e.g. First Year)" className="w-full p-3 border dark:border-gray-800 dark:bg-gray-900 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-500/20" />
                <button type="submit" disabled={yearMutation.isPending} className="w-full bg-brand-600 text-white p-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-70">Save</button>
              </form>
            </div>
          </motion.div>
        )}
        
        {isSectionModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white dark:bg-gray-950 p-6 rounded-3xl w-full max-w-sm">
              <div className="flex justify-between items-center mb-4"><h3 className="font-bold dark:text-white">Add Section</h3><button onClick={() => setIsSectionModalOpen(false)} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 rounded-md p-1"><X size={20}/></button></div>
              <form onSubmit={e => { e.preventDefault(); sectionMutation.mutate({ name: (e.target as any).name.value, year_id: (e.target as any).year.value } as any); }} className="space-y-4">
                <select name="year" required className="w-full p-3 border dark:border-gray-800 dark:bg-gray-900 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-500/20">
                  <option value="">Select Year</option>
                  {years.map(y => <option key={y._id} value={y._id}>{y.name}</option>)}
                </select>
                <input name="name" required placeholder="Section Name (e.g. CSE-A)" className="w-full p-3 border dark:border-gray-800 dark:bg-gray-900 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-500/20" />
                <button type="submit" disabled={sectionMutation.isPending} className="w-full bg-brand-600 text-white p-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-70">Save</button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog 
        isOpen={!!confirmDialog}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        dependencies={confirmDialog?.dependencies}
        onClose={() => setConfirmDialog(null)}
        onConfirm={(force) => deleteMutation.mutate({ type: confirmDialog.type, id: confirmDialog.id, force })}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
