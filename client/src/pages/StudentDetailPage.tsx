import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import useAuthStore from '../store/authStore';
import { User, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StudentProfileForm from '../components/StudentProfileForm';

export default function StudentDetailPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore(state => state.user);
  
  const [isEditing, setIsEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Access rules
  const canEdit = (currentUser?.role as string) === 'admin' || (currentUser?.role as string) === 'deo';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-detail', studentId],
    queryFn: async () => {
      const res = await api.get(`/students/${studentId}`);
      return res.data;
    },
    retry: false
  });

  const formattedProfile = useMemo(() => {
    if (!data?.student) return {};
    return {
      ...data.student,
      dob: data.student.dob ? new Date(data.student.dob).toISOString().split('T')[0] : '',
      year: data.student.year?._id || data.student.year,
      section: data.student.section?._id || data.student.section
    };
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (updateData) => api.patch(`/students/${studentId}`, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-detail', studentId] });
      setIsEditing(false);
      setSuccessMsg('Student profile updated successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
      setErrorMsg('');
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to update student profile');
    }
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
        <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
      </div>
    );
  }

  if (isError || !data?.student) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <User size={64} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Student Not Found</h2>
        <p className="text-gray-500 mb-6">The student you are looking for does not exist or you don't have permission.</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-white rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500">
          Go Back
        </button>
      </div>
    );
  }

  const { student, recentEvents } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 rounded-md">
        <ArrowLeft size={16} /> Back to Search
      </button>

      <AnimatePresence>
        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-2">
            <CheckCircle2 size={20} /> {successMsg}
          </motion.div>
        )}
        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2">
            <AlertTriangle size={20} /> {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Card */}
      <div className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-10"></div>
        
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-900 shadow-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative z-10 shrink-0">
          {student.profile_image_url ? (
            <img src={student.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User size={48} className="text-gray-400" />
          )}
        </div>

        <div className="flex-1 text-center md:text-left z-10 pt-2 w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                Student
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{student.name}</h1>
              <p className="text-gray-500 font-medium flex items-center gap-2 justify-center md:justify-start">
                {student.reg_no}
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700"></span>
                {student.year?.name || 'No Year'} - {student.section?.name || 'No Section'}
              </p>
            </div>

            <div className="flex flex-col items-center md:items-end gap-3">
              <div className="text-center bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">CGPA</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{student.cgpa || 'N/A'}</p>
              </div>

              {canEdit && !isEditing && (
                <div className="flex flex-col gap-2 w-full md:w-auto">
                  <button onClick={() => setIsEditing(true)} className="w-full md:w-auto px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500">
                    Edit Details
                  </button>
                  {currentUser?.role === 'admin' && (
                    <button 
                      onClick={async () => {
                        if (confirm('Are you sure you want to revoke all active sessions for this user? They will be logged out immediately.')) {
                          try {
                            await api.post(`/users/${studentId}/revoke-sessions`);
                            alert('Sessions revoked successfully.');
                          } catch (e) {
                            alert('Failed to revoke sessions.');
                          }
                        }
                      }}
                      className="w-full md:w-auto px-6 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 font-medium rounded-xl transition-colors"
                    >
                      Revoke Sessions
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {canEdit && isEditing && (
            <div className="mt-4 p-3 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 rounded-lg text-sm flex items-center gap-2 border border-brand-100 dark:border-brand-900/50">
              <AlertTriangle size={16} />
              Viewing as Admin — editing another user's profile
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Details Form reusing the new component */}
          <StudentProfileForm 
            profile={formattedProfile}
            isEditing={isEditing}
            isAdminEdit={canEdit}
            onSubmit={(d: any) => updateMutation.mutate(d)}
            onCancel={() => setIsEditing(false)}
            isLoading={updateMutation.isPending}
          />
        </div>

        <div className="space-y-6">
          {/* Account Status Card */}
          <div className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Account Status</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">First Login Pending</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {student.is_first_login ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Events Card */}
          <div className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Recent Events</h3>
            {recentEvents && recentEvents.length > 0 ? (
              <div className="space-y-4">
                {recentEvents.map((evt: any, i: number) => (
                  <div key={i} className="flex gap-3 pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                    <div className="mt-1">
                      <CalendarIcon size={16} className="text-brand-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{evt.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(evt.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 text-sm">
                <FileText size={24} className="mx-auto mb-2 opacity-20" />
                No recent event registrations
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
