import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../lib/axios';
import { Loader2, UserPlus, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const userSchema = z.object({
  role: z.enum(['admin', 'deo', 'faculty', 'student']),
  name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email format'),
  dob: z.string().min(1, 'Date of Birth is required').refine(val => new Date(val) <= new Date(), 'Date of Birth cannot be in the future').refine(val => new Date(val) >= new Date('1900-01-01'), 'Date of Birth is unrealistically far in the past'),
  mobile: z.preprocess((val) => typeof val === 'string' ? val.replace(/[\s-]/g, '') : val, z.string().length(10, 'Must be exactly 10 digits').regex(/^\d+$/, 'Must be numeric')),

  // Conditional fields (validated based on role)
  reg_no: z.string().optional(),
  year: z.string().optional(),
  section: z.string().optional(),
  employee_id: z.string().optional(),
  designation: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.role === 'student') {
    if (!data.reg_no) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Registration No is required', path: ['reg_no'] });
    if (!data.year) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Year is required', path: ['year'] });
    if (!data.section) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Section is required', path: ['section'] });
  } else {
    if (!data.employee_id) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Employee ID is required', path: ['employee_id'] });
    if (!data.designation) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Designation is required', path: ['designation'] });
  }
});

export default function RegisterUser() {
  const [successMsg, setSuccessMsg] = useState('');

  const { register, handleSubmit, watch, reset, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'student' },
    mode: 'onChange'
  });

  const selectedRole = watch('role');
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
    mutationFn: (newUser) => api.post('/users', newUser),
    onSuccess: () => {
      setSuccessMsg('User successfully registered!');
      reset();
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center">
          <UserPlus size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Register New User</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Add students, faculty, or admins to CSE HUB</p>
        </div>
      </div>

      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-xl flex items-center gap-2"
          >
            <CheckCircle2 size={20} />
            {successMsg}
          </motion.div>
        )}

        {mutation.isError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-xl"
          >
            {(mutation.error as any).response?.data?.message || 'Failed to register user'}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-6">

        {/* Role Selector */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Account Type</label>
          <div className="flex flex-wrap gap-3">
            {['student', 'faculty', 'deo', 'admin'].map(r => (
              <label key={r} className={cn(
                "flex-1 min-w-[120px] py-3 px-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-center font-medium capitalize",
                selectedRole === r
                  ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                  : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400"
              )}>
                <input type="radio" value={r} {...register('role')} className="sr-only" />
                {r}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-gray-800">

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
            <input {...register('name')} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 dark:text-white text-base outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" placeholder="John Doe" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
            <input type="email" {...register('email')} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 dark:text-white text-base outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" placeholder="john@example.com" />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</label>
            <input type="date" {...register('dob')} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 dark:text-white text-base outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
            {errors.dob && <p className="text-xs text-red-500">{errors.dob.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Number</label>
            <input {...register('mobile')} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 dark:text-white text-base outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" placeholder="10-digit number" />
            {errors.mobile && <p className="text-xs text-red-500">{errors.mobile.message}</p>}
          </div>

          {selectedRole === 'student' ? (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Registration Number</label>
                <input {...register('reg_no')} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 dark:text-white text-base outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" placeholder="20BCD0001" />
                {errors.reg_no && <p className="text-xs text-red-500">{errors.reg_no.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Year</label>
                <select {...register('year')} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 dark:text-white text-base outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
                  <option value="">Select Year</option>
                  {years.map((y: any) => <option key={y._id} value={y._id}>{y.name}</option>)}
                </select>
                {errors.year && <p className="text-xs text-red-500">{errors.year.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Section</label>
                <select {...register('section')} disabled={!selectedYear || sections.length === 0} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 dark:text-white text-base outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 disabled:opacity-50">
                  <option value="">{selectedYear && sections.length === 0 ? 'No sections available for this year' : 'Select Section'}</option>
                  {sections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                {errors.section && <p className="text-xs text-red-500">{errors.section.message}</p>}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Employee ID</label>
                <input {...register('employee_id')} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 dark:text-white text-base outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" placeholder="EMP100" />
                {errors.employee_id && <p className="text-xs text-red-500">{errors.employee_id.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Designation</label>
                <input {...register('designation')} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 dark:text-white text-base outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" placeholder="Assistant Professor" />
                {errors.designation && <p className="text-xs text-red-500">{errors.designation.message}</p>}
              </div>
            </>
          )}

        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={mutation.isPending || !isValid}
            className="w-full bg-brand-600 text-white font-medium py-3 px-4 rounded-xl hover:bg-brand-700 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
          >
            {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus size={20} /> Register User</>}
          </button>
        </div>

      </form>
    </div>
  );
}
