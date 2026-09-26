import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../lib/axios';
import useAuthStore from '../store/authStore';
import { User, Mail, Phone, Calendar, Lock, Loader2, Camera, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Profile() {
  const user = useAuthStore(state => state.user);
  const updateUserStore = useAuthStore(state => state.updateUser);
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.userId],
    queryFn: async () => (await api.get(`/users/${user?.userId}`)).data,
    enabled: !!user?.userId, // Only fetch when userId is available
  });

  const formattedProfile = useMemo(() => {
    if (!profile) return {};
    return {
      ...profile,
      dob: profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : ''
    };
  }, [profile]);

  const { register, handleSubmit, reset, formState: { errors: formErrors, isValid } } = useForm({
    mode: 'onChange',
    values: formattedProfile
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.patch(`/users/${user?.userId}`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.userId] });
      setIsEditing(false);
      setSuccessMsg(res.data.pending_verification ? 'OTP sent to new email' : 'Profile updated!');
      setTimeout(() => setSuccessMsg(''), 4000);
      
      if (!res.data.pending_verification) {
        updateUserStore(res.data.user);
      }
    }
  });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => {
      const data = new FormData();
      data.append('avatar', file);
      return api.post(`/users/${user?.userId}/avatar`, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', user?.userId] })
  });

  if (isLoading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
      <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
    </div>;
  }

  const isStudent = profile?.role === 'student';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <AnimatePresence>
        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-2">
            <CheckCircle2 size={20} /> {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Card */}
      <div className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-brand-500 to-brand-700 opacity-10"></div>
        
        <div className="relative group shrink-0">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-900 shadow-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative z-10">
            {profile?.profile_image_url ? (
              <img src={profile.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={48} className="text-gray-400" />
            )}
            
            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex flex-col items-center justify-center text-white">
              <Camera size={24} className="mb-1" />
              <span className="text-xs font-medium">Change</span>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                tabIndex={0}
                onChange={(e) => { if(e.target.files[0]) avatarMutation.mutate(e.target.files[0]) }} 
              />
            </label>
          </div>
          {avatarMutation.isPending && (
            <div className="absolute inset-0 z-20 bg-white/50 rounded-full flex items-center justify-center">
              <Loader2 className="animate-spin text-brand-600" />
            </div>
          )}
        </div>

        <div className="flex-1 text-center md:text-left z-10 pt-2">
          <div className="inline-block px-3 py-1 bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            {profile?.role}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{profile?.name}</h1>
          <p className="text-gray-500 font-medium">
            {isStudent ? profile?.reg_no : profile?.employee_id}
          </p>
        </div>
        
        <div className="z-10">
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setIsEditing(false); reset(); }} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500">
                Cancel
              </button>
              <button onClick={handleSubmit((d) => updateMutation.mutate(d))} disabled={updateMutation.isPending || !isValid} className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-70">
                {updateMutation.isPending && <Loader2 size={16} className="animate-spin" />} Save
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Details Form */}
      <div className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 dark:text-white">
          <User size={20} className="text-brand-500" /> Personal Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
            <input {...register('name', { required: 'Name is required' })} disabled={!isEditing} className={`w-full px-4 py-3 rounded-xl border ${formErrors.name ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'} bg-gray-50 dark:bg-gray-900 disabled:bg-gray-100 dark:disabled:bg-gray-900 dark:text-white text-base outline-none focus:ring-2 focus:ring-brand-500/20`} />
            {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name.message as string}</p>}
          </div>

          <div className="space-y-1 relative">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
              Email Address
              {profile?.pending_email && <span className="text-xs text-orange-500 flex items-center gap-1"><Clock size={12}/> Pending verification</span>}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input {...register('email', { required: 'Email is required' })} disabled={!isEditing} className={`w-full pl-10 pr-4 py-3 rounded-xl border ${formErrors.email ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'} bg-gray-50 dark:bg-gray-900 disabled:bg-gray-100 dark:disabled:bg-gray-900 dark:text-white text-base outline-none focus:ring-2 focus:ring-brand-500/20`} />
            </div>
            {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email.message as string}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input {...register('mobile', { required: 'Mobile is required' })} disabled={!isEditing} className={`w-full pl-10 pr-4 py-3 rounded-xl border ${formErrors.mobile ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'} bg-gray-50 dark:bg-gray-900 disabled:bg-gray-100 dark:disabled:bg-gray-900 dark:text-white text-base outline-none focus:ring-2 focus:ring-brand-500/20`} />
            </div>
            {formErrors.mobile && <p className="text-xs text-red-500 mt-1">{formErrors.mobile.message as string}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="date" {...register('dob', { required: 'Date of Birth is required' })} disabled={!isEditing} className={`w-full pl-10 pr-4 py-3 rounded-xl border ${formErrors.dob ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'} bg-gray-50 dark:bg-gray-900 disabled:bg-gray-100 dark:disabled:bg-gray-900 dark:text-white text-base outline-none focus:ring-2 focus:ring-brand-500/20`} />
            </div>
            {formErrors.dob && <p className="text-xs text-red-500 mt-1">{formErrors.dob.message as string}</p>}
          </div>

          {/* Read Only System Fields */}
          {isStudent && (
            <>
              <div className="space-y-1 relative group">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">CGPA</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input value={profile?.cgpa || 'N/A'} disabled className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900/50 text-gray-500 text-base cursor-not-allowed" />
                </div>
              </div>
              <div className="space-y-1 relative group">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Class Details</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input value={`${profile?.year?.name || ''} - ${profile?.section?.name || ''}`} disabled className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900/50 text-gray-500 text-base cursor-not-allowed" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
