import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * LoginScreen — Professional Live Login Portal
 * Matches Stitch screen "BAUST BloodLink - Professional Live Login Portal"
 * Wired to POST /api/auth/login with JWT, bcrypt, 8h expiry.
 */
function LoginScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [form, setForm] = useState({ institutionalId: '', password: '' });
  const [clientError, setClientError] = useState('');
  const [serverError, setServerError] = useState('');

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

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#f7f9fd] relative overflow-hidden selection:bg-primary-fixed selection:text-primary">
      <div className="flex flex-col w-full min-h-screen relative items-center justify-center py-8 px-4 sm:px-6 overflow-hidden">
        
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
        <div className="relative z-10 w-full max-w-[530px] rounded-3xl p-8 sm:p-10 bg-white/80 backdrop-blur-2xl shadow-[0_24px_60px_-15px_rgba(184,0,53,0.14),0_10px_25px_-5px_rgba(13,28,47,0.06)] border border-[#e11d48]/20 transition-all duration-300 hover:shadow-[0_30px_70px_-12px_rgba(184,0,53,0.22),0_12px_30px_-5px_rgba(13,28,47,0.08)] ring-1 ring-white/60">
          
          {/* Card Top Brand & Header Module */}
          <header className="flex flex-col items-center text-center">
            <div className="relative flex items-center justify-center p-2 mb-2 group">
              <div className="absolute inset-0 rounded-full bg-primary-container/10 blur-xl scale-95 group-hover:scale-110 transition-transform duration-500" />
              <img
                alt="BAUST BloodLink Official Insignia"
                className="relative h-24 w-auto object-contain drop-shadow-[0_6px_14px_rgba(184,0,53,0.18)]"
                src="/emblem.png"
              />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
              BAUST BloodLink
            </h1>
            
            {/* Tagline Pill */}
            <div className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary-fixed/50 text-primary text-xs font-bold tracking-widest uppercase border border-primary/15">
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
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
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
              className="group mt-2 w-full py-3.5 px-6 rounded-xl text-white text-sm font-bold tracking-wide shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, rgb(225, 29, 72) 0%, rgb(190, 18, 60) 100%)',
                boxShadow: 'rgba(225, 29, 72, 0.4) 0px 4px 18px',
              }}
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

            {/* Quick Demo Dataset Accounts */}
            <div className="mt-2 pt-2 border-t border-outline-variant/20 flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-primary">group</span>
                Quick Demo Dataset Accounts:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setForm({ institutionalId: 'CSE0120210001A12', password: 'Password123!' });
                    setClientError('');
                    setServerError('');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-primary border border-rose-200/60 text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>Tanvir (Student • B+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm({ institutionalId: 'TEA0120210003C34', password: 'Password123!' });
                    setClientError('');
                    setServerError('');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>Dr. Mahfuzur (Teacher • O+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm({ institutionalId: 'ADM0120210001Z99', password: 'Password123!' });
                    setClientError('');
                    setServerError('');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>Admin User</span>
                </button>
              </div>
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
