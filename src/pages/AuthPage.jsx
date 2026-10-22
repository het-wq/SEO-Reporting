import React, { useState } from 'react';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';

export default function AuthPage() {
  const { signIn } = useAuth();

  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('seo_remembered_email') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanInput = (email || '').trim();
    if (!cleanInput) {
      setErrorMsg('Please enter your email address or username.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await signIn({ email: cleanInput, password, rememberMe });
      setSuccessMsg('Signed in successfully! Redirecting...');
    } catch (err) {
      setErrorMsg(err.message || 'Invalid credentials. Please verify your email/username and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12 relative font-sans select-none">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-black text-white shadow-sm mb-1">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black">
              Boulder Decision
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
              SEO &amp; Live Search Analytics Reporting Dashboard
            </p>
          </div>
        </div>

        {/* Main Sign In Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-lg space-y-5">
          {/* Section title */}
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-black tracking-wide">Sign In</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter your credentials to access the analytics workspace</p>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 leading-relaxed animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email / Username field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-800">
                Email Address or Username
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email or username"
                  className="pl-10 h-11 text-xs sm:text-sm bg-white border-slate-300 text-black placeholder:text-slate-400 focus:border-black focus:ring-1 focus:ring-black transition-all rounded-xl"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-800">Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10 pr-10 h-11 text-xs sm:text-sm bg-white border-slate-300 text-black placeholder:text-slate-400 focus:border-black focus:ring-1 focus:ring-black transition-all rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 hover:text-black transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 bg-white h-3.5 w-3.5 cursor-pointer accent-black text-black"
                />
                <span>Remember me</span>
              </label>
            </div>

            {/* Sign In Submit button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-sm font-semibold bg-black hover:bg-neutral-800 text-white cursor-pointer transition-colors duration-200 rounded-xl gap-2 mt-2 shadow-sm"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400">
          Boulder Decision &bull; All Rights Reserved &bull; Secure Analytics
        </p>
      </div>
    </div>
  );
}
