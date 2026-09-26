import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../lib/axios';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const publicUserSchema = z.object({
  role: z.literal('student'),
  name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email format'),
  dob: z.string().min(1, 'Date of Birth is required').refine(val => new Date(val) <= new Date(), 'Date of Birth cannot be in the future').refine(val => new Date(val) >= new Date('1900-01-01'), 'Date of Birth is unrealistically far in the past'),
  mobile: z.preprocess((val) => typeof val === 'string' ? val.replace(/[\s-]/g, '') : val, z.string().length(10, 'Must be exactly 10 digits').regex(/^\d+$/, 'Must be numeric')),
  
  // Student fields
  reg_no: z.string().min(1, 'Registration No is required'),
  year: z.string().min(1, 'Year is required'),
  section: z.string().min(1, 'Section is required'),
});

export default function PublicRegister() {
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(publicUserSchema),
    defaultValues: { role: 'student' }
  });

  const selectedYear = watch('year');

  const { data: years = [] } = useQuery({
    queryKey: ['years'],
    queryFn: async () => {
      const res = await api.get('/years');
      return res.data;
    }
  });

  const { data: sections = [] } = useQuery({
    queryKey: ['sections', selectedYear],
    queryFn: async () => {
      if (!selectedYear) return [];
      const res = await api.get(`/sections?year=${selectedYear}`);
      return res.data;
    },
    enabled: !!selectedYear
  });

  const mutation = useMutation({
    mutationFn: (newUser) => api.post('/auth/register', newUser),
    onSuccess: (data) => {
      setSuccessMsg(data.data?.message || 'Registration successful!');
      reset();
      setError('');
      setTimeout(() => navigate('/login'), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to register');
    }
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Branding Panel */}
      <div className="hidden md:flex md:w-1/2 bg-brand-600 text-white flex-col justify-center items-center p-12 relative overflow-hidden fixed h-screen">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="relative z-10 max-w-md text-center space-y-6">
          <div className="w-24 h-24 bg-white/20 rounded-2xl mx-auto flex items-center justify-center backdrop-blur-sm border border-white/30">
            <span className="text-4xl font-extrabold tracking-tighter">CSE</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">Join CSE HUB</h1>
          <p className="text-brand-100 text-lg leading-relaxed">
            Create your account to connect with the department, manage your resources, and stay updated.
          </p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 relative md:ml-auto">
        <div className="w-full max-w-lg space-y-8 bg-white dark:bg-gray-950 p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
          
          <div className="md:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
            <span className="text-xl font-bold dark:text-white">CSE HUB</span>
          </div>

          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create an Account</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Fill in the details below to register</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/50"
              >
                {error}
              </motion.div>
            )}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-xl flex flex-col items-center gap-2 text-center"
              >
                <CheckCircle2 size={32} className="mb-2" />
                <span className="font-medium">{successMsg}</span>
                <span className="text-sm opacity-80">Redirecting to login...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {!successMsg && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                  <input
                    {...register('name')}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors outline-none",
                      errors.name ? "border-red-500" : "border-gray-200 dark:border-gray-800"
                    )}
                    placeholder="John Doe"
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message as string}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                  <input
                    type="email"
                    {...register('email')}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors outline-none",
                      errors.email ? "border-red-500" : "border-gray-200 dark:border-gray-800"
                    )}
                    placeholder="john@vignan.ac.in"
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message as string}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</label>
                  <input
                    type="date"
                    {...register('dob')}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors outline-none",
                      errors.dob ? "border-red-500" : "border-gray-200 dark:border-gray-800"
                    )}
                  />
                  {errors.dob && <p className="text-xs text-red-500 mt-1">{errors.dob.message as string}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Number</label>
                  <input
                    {...register('mobile')}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors outline-none",
                      errors.mobile ? "border-red-500" : "border-gray-200 dark:border-gray-800"
                    )}
                    placeholder="9876543210"
                  />
                  {errors.mobile && <p className="text-xs text-red-500 mt-1">{errors.mobile.message as string}</p>}
                </div>
              </div>

                <div className="p-4 bg-brand-50 dark:bg-brand-900/10 rounded-xl space-y-4 border border-brand-100 dark:border-brand-900/20">
                  <h3 className="text-sm font-semibold text-brand-800 dark:text-brand-300">Student Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Registration No</label>
                      <input
                        {...register('reg_no')}
                        className={cn(
                          "w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none",
                          errors.reg_no ? "border-red-500" : "border-gray-200 dark:border-gray-800"
                        )}
                        placeholder="e.g., 20BCD0001"
                      />
                      {errors.reg_no && <p className="text-xs text-red-500 mt-1">{errors.reg_no.message as string}</p>}
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Year</label>
                      <select
                        {...register('year')}
                        className={cn(
                          "w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none",
                          errors.year ? "border-red-500" : "border-gray-200 dark:border-gray-800"
                        )}
                      >
                        <option value="">Select Year</option>
                        {years.map((y: any) => (
                          <option key={y._id} value={y._id}>{y.name}</option>
                        ))}
                      </select>
                      {errors.year && <p className="text-xs text-red-500 mt-1">{errors.year.message as string}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Section</label>
                      <select
                        {...register('section')}
                        disabled={!selectedYear}
                        className={cn(
                          "w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none",
                          errors.section ? "border-red-500" : "border-gray-200 dark:border-gray-800"
                        )}
                      >
                        <option value="">Select Section</option>
                        {sections.map((s: any) => (
                          <option key={s._id} value={s._id}>{s.name}</option>
                        ))}
                      </select>
                      {errors.section && <p className="text-xs text-red-500 mt-1">{errors.section.message as string}</p>}
                    </div>
                  </div>
                </div>

              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full bg-brand-600 text-white font-medium py-3 rounded-xl hover:bg-brand-700 focus:ring-4 focus:ring-brand-500/20 transition-all disabled:opacity-70 flex justify-center items-center min-h-[48px] mt-4"
              >
                {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register Account'}
              </button>

              <div className="pt-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400 inline-flex items-center gap-1">
                    Sign in <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
