import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, ArrowRight, Lock, Mail, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserAvatar, isFemaleUser } from '../utils/avatar';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validation
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName || cleanName.length < 2) {
      setError('Please enter your full name (at least 2 characters)');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your confirmation password.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const isFemale = isFemaleUser(cleanName);
      const gender = isFemale ? 'FEMALE' : 'MALE';
      const avatarSvg = getUserAvatar({ name: cleanName, gender });
      
      await register(cleanName, cleanEmail, password, gender, avatarSvg);
      navigate('/');
    } catch (err: any) {
      const serverMessage = err.response?.data?.message;
      if (serverMessage) {
        setError(serverMessage);
      } else if (err.message && !err.message.includes('500')) {
        setError(err.message);
      } else {
        setError('Unable to create account. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-[#f0ebfe] via-[#f5f1fe] to-[#ebe5fd] relative overflow-x-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-300/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[490px] relative z-10">
        {/* Header / Brand */}
        <div className="text-center mb-8 flex flex-col items-center">
          {/* Rounded-square purple app icon with stacked layer logo */}
          <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-[#4f46e5] text-white shadow-xl shadow-indigo-500/30 mb-5 transform transition-transform hover:scale-105 duration-200">
            <Layers className="w-8 h-8" strokeWidth={2.2} />
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0f172a]">
            Create an account
          </h1>

          {/* Subtitle */}
          <p className="mt-2.5 text-sm sm:text-base text-[#64748b] font-normal max-w-sm text-center">
            Get started with TaskFlow project workspace in seconds
          </p>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-[28px] p-7 sm:p-10 shadow-[0_20px_50px_-15px_rgba(79,70,229,0.1),0_10px_25px_-5px_rgba(0,0,0,0.04)] border border-white">
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Full Name */}
            <div>
              <label 
                htmlFor="fullName" 
                className="block text-sm font-semibold text-[#1e293b] mb-2"
              >
                Full Name
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 pointer-events-none text-slate-400">
                  <User className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Arun or Sarah"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#4f46e5] focus:ring-4 focus:ring-indigo-500/10 transition duration-150"
                />
              </div>
            </div>

            {/* 2. Email address */}
            <div>
              <label 
                htmlFor="emailAddress" 
                className="block text-sm font-semibold text-[#1e293b] mb-2"
              >
                Email address
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <input
                  id="emailAddress"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#4f46e5] focus:ring-4 focus:ring-indigo-500/10 transition duration-150"
                />
              </div>
            </div>

            {/* 3. Password */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-semibold text-[#1e293b] mb-2"
              >
                Password
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#4f46e5] focus:ring-4 focus:ring-indigo-500/10 transition duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 p-1 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" strokeWidth={1.75} />
                  ) : (
                    <Eye className="w-5 h-5" strokeWidth={1.75} />
                  )}
                </button>
              </div>
            </div>

            {/* 4. Confirm Password */}
            <div>
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-semibold text-[#1e293b] mb-2"
              >
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#4f46e5] focus:ring-4 focus:ring-indigo-500/10 transition duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                  className="absolute right-4 p-1 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" strokeWidth={1.75} />
                  ) : (
                    <Eye className="w-5 h-5" strokeWidth={1.75} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#4f46e5] hover:bg-[#4338ca] active:scale-[0.99] text-white text-base font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all duration-150 disabled:opacity-60 cursor-pointer"
              >
                <span>{isLoading ? 'Creating account...' : 'Create Account'}</span>
                {!isLoading && <span className="text-lg leading-none">→</span>}
              </button>
            </div>
          </form>

          {/* Bottom text */}
          <div className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="font-bold text-[#4f46e5] hover:text-[#4338ca] transition-colors"
            >
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

