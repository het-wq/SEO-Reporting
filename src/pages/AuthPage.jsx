import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Database,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';

export default function AuthPage() {
  const {
    signUp,
    signIn,
    resetPassword,
    isConfigured,
    config,
    updateSupabaseKeys,
    loginAsGuest,
  } = useAuth();

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Supabase keys configuration state
  const [showConfigDrawer, setShowConfigDrawer] = useState(!isConfigured);
  const [projectUrl, setProjectUrl] = useState(config.url || 'https://qtmoxaxonpimodwpemiy.supabase.co');
  const [anonKeyInput, setAnonKeyInput] = useState(config.anonKey || '');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validation
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (mode === 'forgot') {
      setLoading(true);
      try {
        await resetPassword(email);
        setSuccessMsg('Password reset link sent! Please check your inbox.');
      } catch (err) {
        setErrorMsg(err.message || 'Failed to send reset instructions.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const res = await signUp({ email, password, fullName });
        if (res?.user && !res?.session) {
          setSuccessMsg('Account created! Please check your email to confirm your account, or sign in.');
          setMode('signin');
        } else {
          setSuccessMsg('Account created and signed in successfully!');
        }
      } else {
        await signIn({ email, password });
        setSuccessMsg('Signed in successfully!');
      }
    } catch (err) {
      console.error('Auth error:', err);
      // Helpful error messages
      if (err.message?.includes('Invalid login credentials')) {
        setErrorMsg('Invalid email or password. If you do not have an account yet, click "Sign Up" above.');
      } else if (err.message?.includes('User already registered')) {
        setErrorMsg('This email is already registered. Please sign in instead.');
        setMode('signin');
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKeys = (e) => {
    e.preventDefault();
    if (!anonKeyInput.trim()) {
      setErrorMsg('Please enter your Supabase anon public key.');
      return;
    }
    updateSupabaseKeys(projectUrl, anonKeyInput);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-black px-4 py-12 relative overflow-hidden font-sans">
      {/* Decorative gradient glow backdrop */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-violet-600/20 via-blue-600/20 to-purple-800/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md z-10 space-y-5">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-linear-to-tr from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/25 mb-1">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Boulder Decision
          </h1>
          <p className="text-xs text-slate-400">
            SEO &amp; Live Search Analytics Reporting Dashboard
          </p>
        </div>

        {/* Supabase Connection Setup Box (if anon key is missing or toggle clicked) */}
        {(!isConfigured || showConfigDrawer) && (
          <div className="rounded-xl border border-violet-500/30 bg-slate-900/80 backdrop-blur-md p-4 text-xs space-y-3 shadow-xl">
            <div className="flex items-center justify-between text-slate-300">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Database className="h-4 w-4 text-emerald-400" />
                Supabase Project Connection
              </span>
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                qtmoxaxonpimodwpemiy
              </Badge>
            </div>

            <p className="text-slate-400 text-[11px] leading-relaxed">
              Connect to your Supabase project (<strong>Bolderdecisions</strong>) to enable live authentication:
            </p>

            <form onSubmit={handleSaveKeys} className="space-y-2">
              <div>
                <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                  Project URL
                </label>
                <Input
                  type="text"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  className="h-8 text-xs bg-slate-950/80 border-slate-700 text-white font-mono"
                  placeholder="https://your-project.supabase.co"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                  Supabase Anon Key (Project API Keys &gt; anon public)
                </label>
                <Input
                  type="password"
                  value={anonKeyInput}
                  onChange={(e) => setAnonKeyInput(e.target.value)}
                  className="h-8 text-xs bg-slate-950/80 border-slate-700 text-white font-mono"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <a
                  href="https://supabase.com/dashboard/project/qtmoxaxonpimodwpemiy/settings/api"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-[11px] inline-flex items-center gap-1 underline"
                >
                  Copy key from Supabase <ExternalLink className="h-3 w-3" />
                </a>

                <Button
                  type="submit"
                  size="sm"
                  className="h-7 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Save &amp; Connect
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Main Auth Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-5">
          {/* Tabs: Sign In / Sign Up */}
          <div className="flex p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 leading-relaxed">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 leading-relaxed">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Full Name</label>
                <div className="relative">
                  <User className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="pl-9 h-10 text-xs bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 focus:border-violet-500"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="pl-9 h-10 text-xs bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 focus:border-violet-500"
                  required
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] text-violet-400 hover:text-violet-300 underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'Min 6 characters' : 'Enter your password'}
                    className="pl-9 pr-9 h-10 text-xs bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 focus:border-violet-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
                <div className="relative">
                  <KeyRound className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="pl-9 h-10 text-xs bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 focus:border-violet-500"
                    required
                  />
                </div>
              </div>
            )}

            {mode === 'forgot' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30 cursor-pointer transition-all gap-1.5"
            >
              {loading ? (
                <span>Processing...</span>
              ) : mode === 'signin' ? (
                <>
                  <span>Sign In with Supabase</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : mode === 'signup' ? (
                <>
                  <span>Create Supabase Account</span>
                  <Sparkles className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span>Send Reset Instructions</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Demo Mode bypass option */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => loginAsGuest()}
              className="text-xs text-slate-400 hover:text-violet-400 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-violet-400" />
              <span>Or explore as Agency Admin (Guest / Demo Mode)</span>
            </button>

            {isConfigured && (
              <button
                type="button"
                onClick={() => setShowConfigDrawer(!showConfigDrawer)}
                className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                {showConfigDrawer ? 'Hide API Connection' : 'Manage Supabase Project API Keys'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
