import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * LoginScreen — Professional Live Login Portal
 * Matches Stitch screen "BAUST BloodLink - Professional Live Login Portal"
 * Wired to POST /api/auth/login with JWT, bcrypt, 8h expiry.
 * Social login (Google/Facebook/GitHub) via Firebase Auth → POST /api/auth/oauth.
 */
function LoginScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, socialLogin, isLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [form, setForm] = useState({ institutionalId: '', password: '' });
  const [clientError, setClientError] = useState('');
  const [serverError, setServerError] = useState('');
  const [socialLoading, setSocialLoading] = useState(null); // 'google' | 'facebook' | 'github' | null

  const from = location.state?.from?.pathname || '/feed';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setClientError('');
    setServerError('');

    const id = form.institutionalId.trim().toUpperCase();
    if (!id) {
      setClientError('Institutional ID is required.');
      return;
    }

    if (!/^[A-Z0-9]{16}$/.test(id)) {
      setClientError('Institutional ID must be exactly 16 alphanumeric characters.');
      return;
    }

    if (!form.password) {
      setClientError('Password is required.');
      return;
    }

    const res = await login({ institutionalId: id, password: form.password });
    if (res.success) {
      navigate(from, { replace: true });
    } else {
      setServerError(res.error || 'Invalid credentials.');
    }
  };

  const handleSocialLogin = async (provider) => {
    setServerError('');
    setClientError('');
    setSocialLoading(provider);
    try {
      const res = await socialLogin(provider);
      if (res.success) {
        navigate('/feed', { replace: true });
      } else if (res.error && res.error !== 'Sign-in cancelled.') {
        setServerError(res.error);
      }
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#f7f9fd] relative overflow-hidden selection:bg-primary-fixed selection:text-primary">
      <div className="flex flex-col w-full min-h-screen relative items-center justify-center py-6 sm:py-8 px-3.5 sm:px-6 overflow-hidden">
        
        {/* Vibrant Organic Live Blood Fluid & Smoke Atmosphere */}
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0 select-none">
          {/* Glowing Blood Nebulae & Fluid Gradients */}
          <div className="absolute -top-40 -left-20 w-[620px] h-[620px] rounded-full bg-gradient-to-br from-primary-container/20 via-primary/15 to-transparent blur-[95px] animate-pulse" />
          <div className="absolute top-1/3 -right-32 w-[680px] h-[680px] rounded-full bg-gradient-to-bl from-secondary/20 via-primary-container/15 to-transparent blur-[110px]" />
          <div className="absolute -bottom-36 left-1/4 w-[740px] h-[740px] rounded-full bg-gradient-to-tr from-primary/18 via-secondary-container/12 to-transparent blur-[120px]" />
          
          {/* Dynamic Fluid Smoke Ribbons & Translucent Flow Waves (SVG) */}
          <svg className="absolute inset-0 w-full h-full opacity-35" fill="none" preserveAspectRatio="none" viewBox="0 0 1440 900" xmlns="http://www.w3.org/2000/svg">
            <path d="M-100 250 C 300 120, 600 420, 1000 200 C 1200 90, 1380 320, 1600 240 L 1600 900 L -100 900 Z" fill="url(#crimsonFlow1)" />
            <path d="M-50 480 C 250 360, 520 620, 850 430 C 1150 250, 1320 540, 1550 460 L 1550 900 L -50 900 Z" fill="url(#crimsonFlow2)" />
            <path className="opacity-40" d="M-80 680 C 220 590, 580 780, 920 620 C 1220 480, 1400 700, 1580 630" fill="none" stroke="url(#ecgGradient)" strokeLinecap="round" strokeWidth="2.5" />
            <defs>
              <linearGradient id="crimsonFlow1" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#e11d48" stopOpacity="0.14" />
                <stop offset="60%" stopColor="#b80035" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#f8f9ff" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="crimsonFlow2" x1="100%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#db2e4e" stopOpacity="0.12" />
                <stop offset="50%" stopColor="#b80938" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#f8f9ff" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="ecgGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stopColor="#e11d48" stopOpacity="0.1" />
                <stop offset="40%" stopColor="#b80035" stopOpacity="0.6" />
                <stop offset="70%" stopColor="#db2e4e" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#e11d48" stopOpacity="0.05" />
              </linearGradient>
            </defs>
          </svg>

          {/* Floating Ruby Cell Orbs */}
          <div className="absolute top-[18%] left-[12%] w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-primary-container/10 blur-[6px]" />
          <div className="absolute top-[28%] right-[14%] w-20 h-20 rounded-full bg-gradient-to-tr from-secondary-container/25 to-primary-fixed/20 blur-[8px]" />
          <div className="absolute bottom-[22%] left-[18%] w-16 h-16 rounded-full bg-gradient-to-r from-primary-container/25 to-primary/10 blur-[7px]" />
        </div>

        {/* Central Authentication Glass Card */}
        <div className="relative z-10 w-full max-w-[530px] rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 bg-white/80 backdrop-blur-2xl shadow-[0_24px_60px_-15px_rgba(184,0,53,0.14),0_10px_25px_-5px_rgba(13,28,47,0.06)] border border-[#e11d48]/20 transition-all duration-300 hover:shadow-[0_30px_70px_-12px_rgba(184,0,53,0.22),0_12px_30px_-5px_rgba(13,28,47,0.08)] ring-1 ring-white/60">
          
          {/* Card Top Brand & Header Module */}
          <header className="flex flex-col items-center text-center">
            <div className="relative flex items-center justify-center p-2 mb-2 group">
              <div className="absolute inset-0 rounded-full bg-primary-container/10 blur-xl scale-95 group-hover:scale-110 transition-transform duration-500" />
              <img
                alt="BAUST BloodLink Official Insignia"
                className="relative h-20 sm:h-24 w-auto object-contain drop-shadow-[0_6px_14px_rgba(184,0,53,0.18)]"
                src="/emblem.png"
              />
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight flex items-center justify-center gap-2">
              <span className="brand-baust">
                BAUST
              </span>
              <span className="brand-bloodlink">
                BloodLink
              </span>
            </h1>
            
            {/* Tagline Pill */}
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1 rounded-full bg-primary-fixed/50 text-primary text-[10px] sm:text-xs font-bold tracking-widest uppercase border border-primary/15">
              <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                bloodtype
              </span>
              <span>Donate • Connect • Save Lives</span>
            </div>
          </header>

          {/* Server / Client Error Alert */}
          {(clientError || serverError) && (
            <div
              className="mt-5 p-3.5 rounded-xl bg-rose-50 border border-primary/30 text-slate-900 flex items-start gap-2.5 animate-fade-in text-xs font-medium"
              role="alert"
            >
              <span className="material-symbols-outlined text-[19px] text-primary shrink-0 mt-0.5">
                error
              </span>
              <p>{clientError || serverError}</p>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            {/* Institutional ID Input Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface flex items-center gap-1" htmlFor="instIdInput">
                Institutional ID
                <span className="text-primary font-bold">*</span>
              </label>
              
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-primary/70 pointer-events-none">
                  badge
                </span>
                <input
                  className={`w-full pl-11 pr-16 py-3.5 bg-white/90 text-on-surface font-mono uppercase tracking-wider text-sm rounded-xl shadow-sm border outline-none placeholder:text-on-surface-variant/40 placeholder:normal-case placeholder:tracking-normal focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                    clientError && !form.institutionalId ? 'border-primary' : 'border-outline-variant/40'
                  }`}
                  id="instIdInput"
                  maxLength={16}
                  value={form.institutionalId}
                  onChange={(e) => {
                    setClientError('');
                    setServerError('');
                    setForm((f) => ({ ...f, institutionalId: e.target.value.toUpperCase() }));
                  }}
                  placeholder="e.g. 2021-1-60-001234"
                  type="text"
                  autoComplete="username"
                  disabled={isLoading}
                />
                <span
                  className="absolute right-3.5 text-[11px] font-mono text-on-surface-variant/70 font-semibold pointer-events-none select-none bg-surface-container-high/60 px-1.5 py-0.5 rounded"
                  id="charCounter"
                >
                  {form.institutionalId.length}/16
                </span>
              </div>
            </div>

            {/* Password Input Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface flex items-center gap-1" htmlFor="pwdInput">
                Password
                <span className="text-primary font-bold">*</span>
              </label>

              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-primary/70 pointer-events-none">
                  lock
                </span>
                <input
                  className="w-full pl-11 pr-11 py-3.5 bg-white/90 text-on-surface text-sm rounded-xl shadow-sm border border-outline-variant/40 outline-none placeholder:text-on-surface-variant/40 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  id="pwdInput"
                  placeholder="••••••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => {
                    setClientError('');
                    setServerError('');
                    setForm((f) => ({ ...f, password: e.target.value }));
                  }}
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  aria-label="Toggle password visibility"
                  className="absolute right-3.5 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-1 rounded-md"
                  id="togglePassword"
                  onClick={() => setShowPassword((s) => !s)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[19px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Form Supplementary Controls */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/20 cursor-pointer accent-primary"
                />
                <span className="text-on-surface-variant font-medium">Remember me</span>
              </label>
              <Link
                to="/helpline"
                className="text-secondary hover:text-primary transition-colors hover:underline font-semibold"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Primary Action CTA Button */}
            <button
              className="group mt-2 w-full py-3.5 px-6 rounded-full text-white text-sm font-bold tracking-wide bg-primary hover:bg-primary-dark shadow-md shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="material-symbols-outlined text-[19px] transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </>
              )}
            </button>

            {/* Divider Capsule */}
            <div className="relative my-2 flex items-center justify-center">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-outline-variant/60 to-transparent" />
              <span className="absolute text-[10px] uppercase tracking-wider text-on-surface-variant/80 px-3 py-0.5 rounded-full bg-white/95 border border-outline-variant/40 shadow-xs font-semibold">
                Or continue with
              </span>
            </div>

            {/* Social Login Options */}
            <div className="mt-4 flex flex-col gap-2.5">
              <button
                type="button"
                id="btn-google-login"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading || !!socialLoading}
                className="flex items-center justify-center gap-3 px-4 py-2.5 w-full rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 hover:shadow-sm active:scale-95 transition-all duration-200 text-sm font-semibold text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {socialLoading === 'google' ? (
                  <span className="material-symbols-outlined text-[18px] animate-spin text-[#4285F4]">progress_activity</span>
                ) : (
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {socialLoading === 'google' ? 'Signing in...' : 'Continue with Google'}
              </button>
              
              <button
                type="button"
                id="btn-facebook-login"
                onClick={() => handleSocialLogin('facebook')}
                disabled={isLoading || !!socialLoading}
                className="flex items-center justify-center gap-3 px-4 py-2.5 w-full rounded-xl bg-[#1877F2] text-white border border-[#1877F2] hover:bg-[#166fe5] hover:-translate-y-0.5 hover:shadow-sm active:scale-95 transition-all duration-200 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {socialLoading === 'facebook' ? (
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                ) : (
                  <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                )}
                {socialLoading === 'facebook' ? 'Signing in...' : 'Continue with Facebook'}
              </button>

              <button
                type="button"
                id="btn-github-login"
                onClick={() => handleSocialLogin('github')}
                disabled={isLoading || !!socialLoading}
                className="flex items-center justify-center gap-3 px-4 py-2.5 w-full rounded-xl bg-[#24292e] text-white border border-[#24292e] hover:bg-[#2f363d] hover:-translate-y-0.5 hover:shadow-sm active:scale-95 transition-all duration-200 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {socialLoading === 'github' ? (
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                ) : (
                  <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                  </svg>
                )}
                {socialLoading === 'github' ? 'Signing in...' : 'Continue with GitHub'}
              </button>
            </div>
          </form>

          {/* Card Bottom Footer / Sign-Up Gateway */}
          <footer className="mt-6 pt-5 border-t border-outline-variant/30 flex flex-col items-center gap-1.5 text-center">
            <p className="text-xs text-on-surface-variant font-medium">
              Don't have an institutional account?{' '}
              <Link
                to="/register"
                className="text-primary hover:underline hover:text-secondary transition-colors font-bold ml-1"
                id="login-goto-register"
              >
                Create an Account
              </Link>
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}

export default LoginScreen;

