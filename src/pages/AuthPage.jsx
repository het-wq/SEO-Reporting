import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';

// Color themes: completely replaces the old purple Supabase palette
const COLOR_THEMES = {
  ocean: {
    id: 'ocean',
    name: 'Ocean Cyan',
    glowPrimary: 'from-sky-500/20 via-blue-600/15 to-indigo-900/10',
    glowSecondary: 'bg-cyan-500/10',
    cardBorder: 'border-sky-500/20',
    cardShadow: 'shadow-sky-950/40',
    iconGradient: 'from-cyan-400 via-blue-600 to-indigo-600',
    iconShadow: 'shadow-sky-500/25 ring-sky-300/30',
    tagBadge: 'text-sky-300 bg-sky-500/10 border-sky-500/25',
    focusRing: 'focus:border-sky-400 focus:ring-sky-500/20',
    checkbox: 'text-sky-500 focus:ring-sky-400 accent-sky-500',
    quickFill: 'text-sky-400 hover:text-sky-300',
    buttonGradient:
      'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 shadow-sky-500/25',
    activeDot: 'bg-sky-400 shadow-sky-400/50',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Mint',
    glowPrimary: 'from-emerald-500/20 via-teal-600/15 to-slate-900/10',
    glowSecondary: 'bg-emerald-500/10',
    cardBorder: 'border-emerald-500/20',
    cardShadow: 'shadow-emerald-950/40',
    iconGradient: 'from-emerald-400 via-teal-600 to-cyan-600',
    iconShadow: 'shadow-emerald-500/25 ring-emerald-300/30',
    tagBadge: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
    focusRing: 'focus:border-emerald-400 focus:ring-emerald-500/20',
    checkbox: 'text-emerald-500 focus:ring-emerald-400 accent-emerald-500',
    quickFill: 'text-emerald-400 hover:text-emerald-300',
    buttonGradient:
      'bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:via-teal-500 hover:to-cyan-500 shadow-emerald-500/25',
    activeDot: 'bg-emerald-400 shadow-emerald-400/50',
  },
  cobalt: {
    id: 'cobalt',
    name: 'Royal Cobalt',
    glowPrimary: 'from-blue-600/20 via-indigo-700/15 to-slate-950/10',
    glowSecondary: 'bg-blue-500/10',
    cardBorder: 'border-blue-500/25',
    cardShadow: 'shadow-blue-950/40',
    iconGradient: 'from-blue-500 via-indigo-600 to-blue-700',
    iconShadow: 'shadow-blue-500/25 ring-blue-300/30',
    tagBadge: 'text-blue-300 bg-blue-500/10 border-blue-500/25',
    focusRing: 'focus:border-blue-400 focus:ring-blue-500/20',
    checkbox: 'text-blue-500 focus:ring-blue-400 accent-blue-500',
    quickFill: 'text-blue-400 hover:text-blue-300',
    buttonGradient:
      'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 shadow-blue-500/25',
    activeDot: 'bg-blue-400 shadow-blue-400/50',
  },
};

export default function AuthPage() {
  const { signIn, defaultAdminCredentials } = useAuth();

  const [currentThemeKey, setCurrentThemeKey] = useState(() => {
    try {
      return localStorage.getItem('seo_login_theme') || 'ocean';
    } catch {
      return 'ocean';
    }
  });

  const theme = COLOR_THEMES[currentThemeKey] || COLOR_THEMES.ocean;

  const [email, setEmail] = useState(() => {
    try {
      return (
        localStorage.getItem('seo_remembered_email') ||
        defaultAdminCredentials?.email ||
        'admin@boulderdecisions.com'
      );
    } catch {
      return 'admin@boulderdecisions.com';
    }
  });
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const switchTheme = (key) => {
    setCurrentThemeKey(key);
    try {
      localStorage.setItem('seo_login_theme', key);
    } catch (e) {
      // ignore
    }
  };

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

  const handleQuickFill = () => {
    setEmail(defaultAdminCredentials?.email || 'admin@boulderdecisions.com');
    setPassword(defaultAdminCredentials?.password || 'admin123');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-[#030611] px-4 py-12 relative overflow-hidden font-sans select-none">
      {/* Dynamic ambient lighting blooms */}
      <div
        className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[400px] bg-gradient-to-tr ${theme.glowPrimary} rounded-full blur-3xl pointer-events-none transition-all duration-700`}
      />
      <div
        className={`absolute bottom-10 right-10 w-80 h-80 ${theme.glowSecondary} rounded-full blur-3xl pointer-events-none transition-all duration-700`}
      />

      {/* Subtle high-tech grid effect overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-md z-10 space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2.5">
          <div
            className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${theme.iconGradient} text-white shadow-xl ${theme.iconShadow} ring-1 mb-1 transform transition hover:scale-105 duration-300`}
          >
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Boulder Decision
            </h1>
            <p className="text-xs sm:text-sm text-sky-200/70 font-medium mt-1">
              SEO &amp; Live Search Analytics Reporting Dashboard
            </p>
          </div>
        </div>

        {/* Main Sign In Card */}
        <div
          className={`rounded-2xl border ${theme.cardBorder} bg-slate-900/85 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl ${theme.cardShadow} space-y-5 transition-all duration-300`}
        >
          {/* Top subtle glowing gradient line */}
          <div className="h-0.5 -mt-6 -mx-6 sm:-mt-8 sm:-mx-8 bg-gradient-to-r from-transparent via-sky-400/40 to-transparent rounded-t-2xl" />

          {/* Section title & Theme Switcher */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Sign In</h2>
              <p className="text-xs text-slate-400 mt-0.5">Enter your credentials to access the analytics workspace</p>
            </div>

            {/* Color Accent Picker */}
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-950/60 border border-slate-800">
              <button
                type="button"
                onClick={() => switchTheme('ocean')}
                className={`w-4 h-4 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 transition-all cursor-pointer ${
                  currentThemeKey === 'ocean' ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                }`}
                title="Ocean Cyan Theme"
              />
              <button
                type="button"
                onClick={() => switchTheme('emerald')}
                className={`w-4 h-4 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-600 transition-all cursor-pointer ${
                  currentThemeKey === 'emerald' ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                }`}
                title="Emerald Mint Theme"
              />
              <button
                type="button"
                onClick={() => switchTheme('cobalt')}
                className={`w-4 h-4 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-700 transition-all cursor-pointer ${
                  currentThemeKey === 'cobalt' ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                }`}
                title="Royal Cobalt Theme"
              />
            </div>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-300 leading-relaxed animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-red-200">Authentication Failed</p>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 leading-relaxed animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Normal Login Form (Ultron Style - No Supabase, No Create Account) */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email / Username field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Email Address or Username</span>
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@boulderdecisions.com or admin"
                  className={`pl-10 h-11 text-xs sm:text-sm bg-slate-950/80 border-slate-700/80 text-white placeholder:text-slate-500 ${theme.focusRing} focus:ring-2 transition-all rounded-xl`}
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Password</label>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`pl-10 pr-10 h-11 text-xs sm:text-sm bg-slate-950/80 border-slate-700/80 text-white placeholder:text-slate-500 ${theme.focusRing} focus:ring-2 transition-all rounded-xl`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me and Quick Fill hint */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className={`rounded border-slate-700 bg-slate-950 h-3.5 w-3.5 cursor-pointer ${theme.checkbox}`}
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={handleQuickFill}
                className={`text-[11px] ${theme.quickFill} hover:underline cursor-pointer inline-flex items-center gap-1 font-medium transition-colors`}
              >
                <Sparkles className="h-3 w-3" />
                <span>Fill Demo Admin</span>
              </button>
            </div>

            {/* Sign In Submit button */}
            <Button
              type="submit"
              disabled={loading}
              className={`w-full h-11 text-sm font-bold ${theme.buttonGradient} text-white shadow-lg cursor-pointer transition-all duration-200 rounded-xl gap-2 mt-2`}
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

          {/* Quick Credential pill */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-400">
              <KeyRound className="h-3.5 w-3.5 text-sky-400" />
              Default: <strong className="text-slate-300">admin123</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${theme.activeDot} animate-pulse`} />
              <span className="text-slate-400 font-medium">Agency Portal</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500">
          Boulder Decision &bull; All Rights Reserved &bull; Secure Analytics
        </p>
      </div>
    </div>
  );
}
