import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import useAuthStore from '../store/authStore';
import { cn } from '../lib/utils';
import { Loader2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Login() {
  const [activeTab, setActiveTab] = useState('student');
  const [view, setView] = useState(() => sessionStorage.getItem('loginView') || 'login'); // login | otp | forgot | reset
  const [otpSentTo, setOtpSentTo] = useState(() => sessionStorage.getItem('otpEmail') || null);
  const [pendingUserId, setPendingUserId] = useState(() => sessionStorage.getItem('pendingUserId') || null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  const otpRefs = useRef([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginAction = useAuthStore(state => state.login);

  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      setError('Your session has expired. Please log in again.');
    }
  }, [searchParams]);

  useEffect(() => {
    sessionStorage.setItem('loginView', view);
    if (otpSentTo) sessionStorage.setItem('otpEmail', otpSentTo);
    if (pendingUserId) sessionStorage.setItem('pendingUserId', pendingUserId);
  }, [view, otpSentTo, pendingUserId]);

  const { register, handleSubmit, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onChange'
  });

  const { register: registerForgot, handleSubmit: handleForgotSubmit, formState: { errors: forgotErrors, isValid: isForgotValid } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange'
  });

  const { register: registerReset, handleSubmit: handleResetSubmit, formState: { errors: resetErrors, isValid: isResetValid } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange'
  });

  const { data: systemSettings } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const res = await api.get('/system-settings');
      return res.data;
    },
    staleTime: 30000
  });

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const onLogin = async (data) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', {
        identifier: data.identifier,
        password: data.password,
      });

      if (res.data.requires_otp) {
        setOtpSentTo(res.data.email);
        setPendingUserId(res.data.userId);
        setView('otp');
        setResendTimer(30);
      } else {
        sessionStorage.clear();
        loginAction(res.data.user);
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const onForgot = async (data) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/forgot-password', {
        identifier: data.identifier
      });
      setOtpSentTo(res.data.email);
      setPendingUserId(res.data.userId);
      setView('reset_otp');
      setResendTimer(30);
    } catch (err) {
      // Don't leak user existence
      setView('reset_otp');
      setResendTimer(30);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto advance
    if (value !== '' && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  const verifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      if (view === 'otp') {
        const res = await api.post('/auth/verify-otp', {
          userId: pendingUserId,
          otp: otpString
        });
        sessionStorage.clear();
        loginAction(res.data.user);
        navigate('/dashboard', { replace: true });
      } else if (view === 'reset_otp') {
        // Just transition to password set view, we will verify OTP + new pass together
        setView('reset');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const onResetPassword = async (data) => {
    setIsLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', {
        userId: pendingUserId,
        otp: otp.join(''),
        newPassword: data.newPassword
      });
      sessionStorage.clear();
      setView('login');
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    try {
      await api.post('/auth/resend-otp', { userId: pendingUserId });
      setResendTimer(30);
      setError('');
    } catch (err) {
      setError('Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Branding Panel (Hidden on Mobile) */}
      <div className="hidden md:flex md:w-1/2 bg-brand-600 text-white flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="relative z-10 max-w-md text-center space-y-6">
          <div className="w-24 h-24 bg-white/20 rounded-2xl mx-auto flex items-center justify-center backdrop-blur-sm border border-white/30">
            <span className="text-4xl font-extrabold tracking-tighter">CSE</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">Welcome to CSE HUB</h1>
          <p className="text-brand-100 text-lg leading-relaxed">
            The central portal for Computer Science Engineering students, faculty, and administration to connect, manage resources, and stay updated.
          </p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-950 p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
          
          <div className="md:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
            <span className="text-xl font-bold dark:text-white">CSE HUB</span>
          </div>

          <AnimatePresence mode="wait">
            {view === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="space-y-2 text-center md:text-left">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sign In</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Access your dashboard</p>
                </div>

                <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-xl">
                  <button
                    onClick={() => setActiveTab('student')}
                    className={cn(
                      "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                      activeTab === 'student' ? "bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    )}
                  >
                    Student
                  </button>
                  <button
                    onClick={() => setActiveTab('staff')}
                    className={cn(
                      "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                      activeTab === 'staff' ? "bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    )}
                  >
                    Staff
                  </button>
                </div>

                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/50">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit(onLogin)} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {activeTab === 'student' ? 'Registration Number' : 'Email Address'}
                    </label>
                    <input
                      {...register('identifier')}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors outline-none",
                        errors.identifier ? "border-red-500" : "border-gray-200 dark:border-gray-800"
                      )}
                      placeholder={activeTab === 'student' ? "e.g., 20BCD0001" : "name@csehub.edu"}
                    />
                    {errors.identifier && <p className="text-xs text-red-500 mt-1">{errors.identifier.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {activeTab === 'student' ? 'Mobile Number' : 'Password'}
                      </label>
                      <button 
                        type="button"
                        onClick={() => setView('forgot')}
                        className="text-sm font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400"
                      >
                        Forgot {activeTab === 'student' ? 'Mobile Number' : 'Password'}?
                      </button>
                    </div>
                    <input
                      type={activeTab === 'student' ? 'tel' : 'password'}
                      {...register('password')}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors outline-none",
                        errors.password ? "border-red-500" : "border-gray-200 dark:border-gray-800"
                      )}
                      placeholder={activeTab === 'student' ? '9876543210' : '••••••••'}
                    />
                    {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input type="checkbox" id="remember" className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4" />
                    <label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-400">Remember me for 30 days</label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !isValid}
                    className="w-full bg-brand-600 text-white font-medium py-3 rounded-xl hover:bg-brand-700 focus:ring-4 focus:ring-brand-500/20 transition-all disabled:opacity-70 flex justify-center items-center min-h-[48px]"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                  </button>

                  {systemSettings?.register_page_enabled && (
                    <div className="pt-4 text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400">
                          Register Here
                        </Link>
                      </p>
                    </div>
                  )}
                </form>
              </motion.div>
            )}

            {(view === 'otp' || view === 'reset_otp') && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 text-center"
              >
                <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Check your email</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  We've sent a 6-digit verification code to<br />
                  <span className="font-semibold text-gray-900 dark:text-white">{otpSentTo}</span>
                </p>

                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="flex justify-center gap-2 sm:gap-3 py-4">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-gray-900 dark:text-white transition-all"
                    />
                  ))}
                </div>

                <button
                  onClick={verifyOtp}
                  disabled={isLoading || otp.join('').length !== 6}
                  className="w-full bg-brand-600 text-white font-medium py-3 rounded-xl hover:bg-brand-700 transition-all disabled:opacity-70 flex justify-center items-center min-h-[48px]"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code'}
                </button>

                <p className="text-sm text-gray-500 dark:text-gray-400 pt-4">
                  Didn't receive the code?{' '}
                  <button 
                    onClick={resendOtp} 
                    disabled={resendTimer > 0 || isLoading}
                    className="font-medium text-brand-600 dark:text-brand-400 disabled:text-gray-400"
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Click to resend'}
                  </button>
                </p>
                
                <button onClick={() => setView('login')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center w-full gap-2 mt-4">
                  <ArrowLeft size={16} /> Back to login
                </button>
              </motion.div>
            )}

            {view === 'forgot' && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <button onClick={() => setView('login')} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800 transition-colors">
                  <ArrowLeft size={20} />
                </button>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reset Password</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Enter your identifier and we'll send you an OTP to reset your password.</p>
                </div>

                <form onSubmit={handleForgotSubmit(onForgot)} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Identifier</label>
                    <input
                      {...registerForgot('identifier')}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-800 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-colors"
                      placeholder="Reg No or Email"
                    />
                    {forgotErrors.identifier && <p className="text-xs text-red-500 mt-1">{forgotErrors.identifier.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !isForgotValid}
                    className="w-full bg-brand-600 text-white font-medium py-3 rounded-xl hover:bg-brand-700 transition-all disabled:opacity-70 flex justify-center items-center min-h-[48px]"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Instructions'}
                  </button>
                </form>
              </motion.div>
            )}

            {view === 'reset' && (
              <motion.div
                key="reset"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Set New Password</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">OTP verified. Please set a new password.</p>
                </div>

                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
                    {error}
                  </div>
                )}

                <form onSubmit={handleResetSubmit(onResetPassword)} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                    <input
                      type="password"
                      {...registerReset('newPassword')}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-800 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-colors"
                    />
                    {resetErrors.newPassword && <p className="text-xs text-red-500 mt-1">{resetErrors.newPassword.message}</p>}
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                    <input
                      type="password"
                      {...registerReset('confirmPassword')}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-800 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-colors"
                    />
                    {resetErrors.confirmPassword && <p className="text-xs text-red-500 mt-1">{resetErrors.confirmPassword.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !isResetValid}
                    className="w-full bg-brand-600 text-white font-medium py-3 rounded-xl hover:bg-brand-700 transition-all disabled:opacity-70 flex justify-center items-center min-h-[48px]"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
