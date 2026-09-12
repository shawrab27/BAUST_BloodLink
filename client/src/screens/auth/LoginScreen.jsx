import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * LoginScreen — Professional Live Login Portal (Phase 2)
 * Matches Stitch screen "BAUST BloodLink - Professional Live Login Portal"
 * Wired to POST /api/auth/login with JWT, bcrypt, 8h expiry.
 */
function LoginScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ institutionalId: '', password: '' });
  const [clientError, setClientError] = useState('');
  const [serverError, setServerError] = useState('');

  const from = location.state?.from?.pathname || '/';

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
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #e11d48 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #be123c 0%, transparent 70%)' }}
        />
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
          {(clientError || serverError) && (
            <div
              className="mb-space-md p-space-sm rounded-xl bg-error-container/80 border border-primary/30 text-on-surface flex items-start gap-2 animate-fade-in"
              role="alert"
            >
              <span className="material-symbols-outlined text-[20px] text-primary shrink-0 mt-0.5">
                error
              </span>
              <p className="text-body-sm font-medium">{clientError || serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-space-md">
            <div>
              <label className="input-label" htmlFor="login-institutional-id">
                Institutional ID
              </label>
              <input
                className={`input-field font-mono uppercase tracking-wider ${
                  clientError && !form.institutionalId ? 'border-primary' : ''
                }`}
                type="text"
                id="login-institutional-id"
                placeholder="16-character alphanumeric ID"
                maxLength={16}
                value={form.institutionalId}
                onChange={(e) => {
                  setClientError('');
                  setServerError('');
                  setForm((f) => ({ ...f, institutionalId: e.target.value.toUpperCase() }));
                }}
                autoComplete="username"
                disabled={isLoading}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-label-sm text-on-surface-variant">
                  Format: exactly 16 alphanumeric characters
                </p>
                <span className="text-label-sm text-on-surface-variant font-mono">
                  {form.institutionalId.length}/16
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="input-label" htmlFor="login-password">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  className="input-field pr-12"
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  placeholder="Your password"
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
              className="btn-primary w-full py-3 text-body-md justify-center"
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">
                    progress_activity
                  </span>
                  Signing In...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">login</span>
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="divider my-space-md" />

          <p className="text-center text-body-md text-on-surface-variant">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-primary font-semibold hover:underline"
              id="login-goto-register"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
