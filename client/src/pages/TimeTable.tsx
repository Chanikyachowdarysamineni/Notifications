import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { 
  Calendar as CalendarIcon, Filter, Upload, Download, 
  CheckCircle2, AlertCircle 
} from 'lucide-react';
import { cn } from '../lib/utils';
import useAuthStore from '../store/authStore';
import TimeTableUploadModal from '../components/TimeTableUploadModal';
import TimeTableGrid from '../components/TimeTableGrid';

export default function TimeTable() {
  const user = useAuthStore(state => state.user);
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const current = days[new Date().getDay()];
    return current === 'Sun' ? 'Mon' : current;
  });
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isAdminOrDeo = ['admin', 'deo'].includes(user?.role);

  // Fetch full profile for student year/section
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.userId],
    queryFn: async () => (await api.get(`/users/${user?.userId}`)).data,
    enabled: !!user?.userId,
  });

  // Fetch all years and sections
  const { data: years = [] } = useQuery({
    queryKey: ['years'],
    queryFn: async () => {
      const res = await api.get('/years');
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const { data: sections = [] } = useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      const res = await api.get('/sections');
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  // Default year/section from user profile or first available
  useEffect(() => {
    if (profile?.year && !selectedYear) {
      setSelectedYear(profile.year._id || profile.year);
    } else if (years.length > 0 && !selectedYear) {
      setSelectedYear(years[0]._id);
    }

    if (profile?.section && !selectedSection) {
      setSelectedSection(profile.section._id || profile.section);
    } else if (sections.length > 0 && !selectedSection) {
      setSelectedSection(sections[0]._id);
    }
  }, [profile, years, sections, selectedYear, selectedSection]);

  // Main timetable periods query
  const { data: timetables = [], isLoading } = useQuery({
    queryKey: ['timetable', selectedDay, selectedYear, selectedSection],
    queryFn: async () => {
      if (!selectedYear || !selectedSection) return [];
      const res = await api.get(`/timetable?day=${selectedDay}&year=${selectedYear}&section=${selectedSection}`);
      return res.data;
    },
    enabled: !!selectedYear && !!selectedSection,
  });

  // Department Coverage overview (Admin/DEO only)
  const { data: sectionsSummary } = useQuery({
    queryKey: ['sections-summary', selectedYear],
    queryFn: async () => {
      if (!selectedYear) return null;
      const res = await api.get(`/timetable/sections-summary?year=${selectedYear}`);
      return res.data;
    },
    enabled: isAdminOrDeo && !!selectedYear,
  });

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/timetable/template', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'timetable_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download template error:', err);
    }
  };

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['timetable'] });
    queryClient.invalidateQueries({ queryKey: ['sections-summary'] });
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header & Admin Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Class Time Table</h1>
          <p className="text-gray-500 text-sm">Visual weekly class periods, timings, and faculty details</p>
        </div>

        {/* Action buttons (Admin / DEO only) */}
        {isAdminOrDeo && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Download Template</span>
              <span className="sm:hidden">Template</span>
            </button>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-500/20 active:scale-95 transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <Upload size={15} />
              <span>Upload Time Table</span>
            </button>
          </div>
        )}
      </div>

      {/* Year & Section Selector Card */}
      <div className="bg-white dark:bg-gray-950 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-base sm:text-sm font-semibold text-gray-800 dark:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <option value="" disabled>Select Year</option>
                {years.map(y => (
                  <option key={y._id} value={y._id}>Year {y.name}</option>
                ))}
              </select>
            </div>

            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-base sm:text-sm font-semibold text-gray-800 dark:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <option value="" disabled>Select Section</option>
              {sections.map(s => (
                <option key={s._id} value={s._id}>Section {s.name}</option>
              ))}
            </select>
          </div>

          {/* Department Coverage Grid for Admin/DEO */}
          {isAdminOrDeo && sectionsSummary && sectionsSummary.sections?.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs overflow-x-auto">
              <span className="text-gray-400 font-medium">Coverage:</span>
              {sectionsSummary.sections.map(sec => (
                <button
                  key={sec._id}
                  onClick={() => setSelectedSection(sec._id)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all",
                    sec._id === selectedSection
                      ? "ring-2 ring-brand-500"
                      : "",
                    sec.hasTimeTable
                      ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300 border border-green-200 dark:border-green-900/30"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-900 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-800",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  )}
                  title={sec.hasTimeTable ? `${sec.totalPeriods} periods configured across ${sec.daysConfigured.join(', ')}` : 'No timetable uploaded yet'}
                >
                  {sec.hasTimeTable ? (
                    <CheckCircle2 size={13} className="text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle size={13} className="text-gray-400" />
                  )}
                  <span>Sec {sec.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Day Selector Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide shrink-0">
        {days.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={cn(
              "px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
              selectedDay === day 
                ? "bg-brand-600 text-white shadow-lg shadow-brand-500/25 scale-[1.02]" 
                : "bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
            )}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Main Timetable Content Body */}
      <div className="flex-1 bg-white dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 sm:p-7 shadow-sm">
        {!selectedYear || !selectedSection ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16">
            <CalendarIcon size={44} className="mb-3 opacity-50 text-brand-500" />
            <p className="font-bold text-base text-gray-700 dark:text-gray-300">Select Year & Section</p>
            <p className="text-xs text-gray-500 mt-1">Choose your year and section above to view the class timetable.</p>
          </div>
        ) : (
          <TimeTableGrid
            periods={timetables[0]?.periods || []}
            selectedDay={selectedDay}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Upload Modal (Admin / DEO only) */}
      {isAdminOrDeo && (
        <TimeTableUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
