import { Link } from 'react-router-dom';
import { useState } from 'react';

/**
 * LoginScreen — Professional Live Login Portal (Phase 1)
 * Matches Stitch screen "BAUST BloodLink - Professional Live Login Portal"
 * Phase 2: Wire to POST /api/auth/login with JWT, bcrypt, 8h expiry.
 */
function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ institutionalId: '', password: '' });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #e11d48 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #be123c 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-[480px] px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/">
            <img
            src="/official-logo.png"
            alt="BAUST BloodLink — Donate, Connect, Save Lives"
            className="h-20 w-auto mx-auto mb-2 object-contain"
            style={{ background: 'transparent', filter: 'none' }}
          />
          </Link>
          <h1 className="text-headline-lg font-bold text-on-surface">Welcome Back</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            Sign in to BAUST BloodLink
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-modal p-space-xl">
          <div className="space-y-space-md">
            <div>
              <label className="input-label" htmlFor="login-institutional-id">
                Institutional ID
              </label>
              <input
                className="input-field"
                type="text"
                id="login-institutional-id"
                placeholder="16-character alphanumeric ID"
                maxLength={16}
                value={form.institutionalId}
                onChange={(e) => setForm((f) => ({ ...f, institutionalId: e.target.value.toUpperCase() }))}
                autoComplete="username"
              />
              <p className="text-label-sm text-on-surface-variant mt-1">
                Format: exactly 16 alphanumeric characters
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="input-label" htmlFor="login-password">Password</label>
                <button className="text-label-md text-primary hover:underline" type="button"
                  id="login-forgot-password">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  className="input-field pr-12"
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  placeholder="Your password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  onClick={() => setShowPassword((s) => !s)}
                  id="login-show-password"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              className="btn-primary w-full py-3 text-body-md"
              id="login-submit-btn"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">login</span>
              Sign In
            </button>
          </div>

          <div className="divider my-space-md" />

          <p className="text-center text-body-md text-on-surface-variant">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline" id="login-goto-register">
              Register here
            </Link>
          </p>
        </div>

        <p className="text-center text-label-sm text-on-surface-variant mt-6">
          BAUST BloodLink — Institutional Blood Donation Platform
        </p>
      </div>
    </div>
  );
}

export default LoginScreen;
