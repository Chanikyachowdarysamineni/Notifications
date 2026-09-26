import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { Search, User, Loader2, X, Clock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [recentSearches, setRecentSearches] = useState(() => JSON.parse(localStorage.getItem('recentSearches') || '[]'));
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: results, isLoading } = useQuery({
    queryKey: ['search', debouncedTerm],
    queryFn: async () => {
      if (debouncedTerm.length < 2) return [];
      const res = await api.get(`/search?q=${debouncedTerm}`);
      return res.data;
    },
    enabled: debouncedTerm.length >= 2,
    staleTime: 1000 * 60 // 1 min cache
  });

  const saveRecentSearch = (term) => {
    if (!term || term.length < 2) return;
    const newRecent = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));
  };

  const handleResultClick = (res) => {
    saveRecentSearch(debouncedTerm);
    setIsOpen(false);
    setSearchTerm('');
    if (res.type === 'student') {
      navigate(`/students/${res.id}`);
    } else {
      navigate('/profile'); // Fallback or handle staff differently if needed
    }
  };

  return (
    <>
      <div className="relative">
        <button 
          onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 100); }} 
          className="md:hidden p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <Search size={22} />
        </button>

        <div className="hidden md:flex relative max-w-md w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          <input 
            type="text" 
            placeholder="Search by Name or Reg No..." 
            onClick={() => setIsOpen(true)}
            readOnly
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white focus:border-brand-500 rounded-full text-sm dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm md:p-6 lg:p-12">
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.98 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              className="bg-white dark:bg-gray-950 w-full h-full md:h-auto md:max-w-2xl mx-auto md:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                <Search size={20} className="text-gray-400 shrink-0" />
                <input 
                  ref={inputRef}
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search students, faculty, DEOs..." 
                  className="flex-1 bg-transparent border-none outline-none text-lg dark:text-white placeholder-gray-400"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={18}/></button>
                )}
                <button onClick={() => setIsOpen(false)} className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg dark:bg-gray-800 dark:text-gray-300 md:hidden">Cancel</button>
                <button onClick={() => setIsOpen(false)} className="hidden md:block p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X size={20}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900/50">
                {isLoading && (
                  <div className="p-10 flex justify-center text-brand-500"><Loader2 className="animate-spin" size={24} /></div>
                )}
                
                {!isLoading && debouncedTerm.length >= 2 && results?.length === 0 && (
                  <div className="p-10 text-center text-gray-500">No results found for "{debouncedTerm}"</div>
                )}

                {!isLoading && debouncedTerm.length >= 2 && results?.length > 0 && (
                  <div className="space-y-1 p-2">
                    <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Results</p>
                    {results.map(res => (
                      <button 
                        key={res.id} 
                        onClick={() => handleResultClick(res)}
                        className="w-full flex items-center gap-4 p-3 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-colors text-left group"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                          {res.avatar_url ? <img src={res.avatar_url} alt="" className="w-full h-full object-cover" /> : <User size={20} className="text-gray-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate">{res.name}</h4>
                          <p className="text-xs text-gray-500 truncate">
                            {res.identifier} • {res.type === 'student' ? `${res.year?.name || ''} - ${res.section?.name || ''}` : res.designation}
                          </p>
                        </div>
                        <ArrowRight size={16} className="text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}

                {debouncedTerm.length < 2 && recentSearches.length > 0 && (
                  <div className="p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Searches</p>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map(term => (
                        <button 
                          key={term} 
                          onClick={() => setSearchTerm(term)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:border-brand-300 transition-colors"
                        >
                          <Clock size={14} className="text-gray-400" />
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
