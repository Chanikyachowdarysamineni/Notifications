import { useForm, useWatch } from 'react-hook-form';
import { User, Mail, Phone, Calendar, Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import { useEffect } from 'react';

interface StudentProfileFormProps {
  profile: any;
  isEditing: boolean;
  isAdminEdit: boolean;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function StudentProfileForm({ 
  profile, 
  isEditing, 
  isAdminEdit, 
  onSubmit, 
  onCancel, 
  isLoading 
}: StudentProfileFormProps) {
  const { register, handleSubmit, reset, control, formState: { errors, isValid } } = useForm({
    mode: 'onChange',
    defaultValues: profile
  });

  const selectedYear = useWatch({ control, name: 'year' });

  useEffect(() => {
    reset(profile);
  }, [profile, reset]);

  // Fetch years and sections for admin edit dropdowns
  const { data: years } = useQuery({
    queryKey: ['years'],
    queryFn: async () => (await api.get('/years')).data,
    enabled: isAdminEdit && isEditing
  });
  
  const { data: sections } = useQuery({
    queryKey: ['sections'],
    queryFn: async () => (await api.get('/sections')).data,
    enabled: isAdminEdit && isEditing
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2 dark:text-white">
          <User size={20} className="text-brand-500" /> Personal Information
        </h3>
        {isAdminEdit && isEditing && (
          <span className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded-full font-medium">
            Admin Edit Mode
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
          <input 
            {...register('name', { required: 'Name is required' })} 
            disabled={!isEditing} 
            className={`w-full px-4 py-3 rounded-xl border ${errors.name ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'} bg-gray-50 dark:bg-gray-900 disabled:bg-gray-100 dark:disabled:bg-gray-900 dark:text-white text-base outline-none focus:ring-2 focus:ring-brand-500/20`} 
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message as string}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              {...register('email', { required: 'Email is required' })} 
              disabled={!isEditing} 
              className={`w-full pl-10 pr-4 py-3 rounded-xl border ${errors.email ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'} bg-gray-50 dark:bg-gray-900 disabled:bg-gray-100 dark:disabled:bg-gray-900 dark:text-white text-base outline-none focus:ring-2 focus:ring-brand-500/20`} 
            />
          </div>
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message as string}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              {...register('mobile', { required: 'Mobile is required' })} 
              disabled={!isEditing} 
              className={`w-full pl-10 pr-4 py-3 rounded-xl border ${errors.mobile ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'} bg-gray-50 dark:bg-gray-900 disabled:bg-gray-100 dark:disabled:bg-gray-900 dark:text-white text-base outline-none focus:ring-2 focus:ring-brand-500/20`} 
            />
          </div>
          {errors.mobile && <p className="text-xs text-red-500 mt-1">{errors.mobile.message as string}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="date" 
              {...register('dob', { required: 'Date of Birth is required' })} 
              disabled={!isEditing} 
              className={`w-full pl-10 pr-4 py-3 rounded-xl border ${errors.dob ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'} bg-gray-50 dark:bg-gray-900 disabled:bg-gray-100 dark:disabled:bg-gray-900 dark:text-white text-base outline-none focus:ring-2 focus:ring-brand-500/20`} 
            />
          </div>
          {errors.dob && <p className="text-xs text-red-500 mt-1">{errors.dob.message as string}</p>}
        </div>

        {/* System Fields (Editable by Admin, Read-only for self) */}
        <div className="space-y-1 relative group">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Registration Number</label>
          <div className="relative">
            {!isAdminEdit && <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />}
            <input 
              {...register('reg_no', { required: 'Reg No is required' })} 
              disabled={!isEditing || !isAdminEdit} 
              className={`w-full ${!isAdminEdit ? 'pl-10' : 'px-4'} pr-4 py-3 rounded-xl border ${errors.reg_no ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'} bg-gray-50 dark:bg-gray-900 disabled:bg-gray-100 dark:disabled:bg-gray-900/50 disabled:text-gray-500 dark:text-white text-base outline-none focus:ring-2 focus:ring-brand-500/20`} 
            />
          </div>
          {errors.reg_no && <p className="text-xs text-red-500 mt-1">{errors.reg_no.message as string}</p>}
        </div>

        <div className="space-y-1 relative group">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">CGPA</label>
          <div className="relative">
            {!isAdminEdit && <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />}
            <input 
              type="number"
              step="0.01"
              min="0"
              max="10"
              {...register('cgpa')} 
              disabled={!isEditing || !isAdminEdit} 
              placeholder="Not yet available"
              className={`w-full ${!isAdminEdit ? 'pl-10' : 'px-4'} pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 disabled:bg-gray-100 dark:disabled:bg-gray-900/50 disabled:text-gray-500 dark:text-white text-base outline-none focus:ring-2 focus:ring-brand-500/20`} 
            />
          </div>
        </div>

        {isAdminEdit && isEditing ? (
          <>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Year</label>
              <select 
                {...register('year', { required: 'Year is required' })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-base outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">Select Year</option>
                {years?.map((y: any) => (
                  <option key={y._id} value={y._id}>{y.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Section</label>
              <select 
                {...register('section', { required: 'Section is required' })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-base outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">Select Section</option>
                {sections?.filter((s: any) => (s.year?._id || s.year) === selectedYear).map((s: any) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <div className="space-y-1 relative group md:col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Class Details</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                value={`${profile?.year?.name || profile?.year || ''} - ${profile?.section?.name || profile?.section || ''}`} 
                disabled 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900/50 text-gray-500 text-base cursor-not-allowed" 
              />
            </div>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="mt-8 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onCancel}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isLoading || !isValid}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-70"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </form>
  );
}
