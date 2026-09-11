import { Link } from 'react-router-dom';
import { useState } from 'react';

/**
 * RegisterScreen — Registration Form Shell (Phase 1)
 * Matches Stitch screen "BAUST BloodLink - Registration Form"
 * Phase 2: Wire to POST /api/auth/register with all server-side validation.
 *
 * Server-enforced constraints (rendered here as UI hints):
 * - Institutional ID: exactly 16 alphanumeric chars ^[a-zA-Z0-9]{16}$
 * - Gender: enum ['Male','Female']
 * - Department: enum ['CSE','EEE','ME','ICT','ENG','BBA','AIS','IPE','CE']
 * - Blood Group: enum ['A+','A-','B+','B-','AB+','AB-','O+','O-','BOMBAY']
 * - bcrypt salt rounds 10+, JWT 8h expiry
 */
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'BOMBAY'];
const DEPARTMENTS = ['CSE', 'EEE', 'ME', 'ICT', 'ENG', 'BBA', 'AIS', 'IPE', 'CE'];
const USER_TYPES = ['Student', 'Teacher', 'Staff'];

function RegisterScreen() {
  const [step, setStep] = useState(1); // multi-step form
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    institutionalId: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    department: '',
    bloodGroup: '',
    userType: 'Student',
    phone: '',
  });

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden py-12">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #e11d48 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #be123c 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-[560px] px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/">
            <img
            src="/official-logo.png"
            alt="BAUST BloodLink — Donate, Connect, Save Lives"
            className="h-16 w-auto mx-auto mb-2 object-contain"
            style={{ background: 'transparent', filter: 'none' }}
          />
          </Link>
          <h1 className="text-headline-lg font-bold text-on-surface">Create Account</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            Join BAUST BloodLink — Donate. Connect. Save Lives.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-label-md font-bold transition-all ${
                s === step
                  ? 'bg-primary text-on-primary shadow-crimson-sm'
                  : s < step
                  ? 'bg-primary/20 text-primary'
                  : 'bg-surface-container text-on-surface-variant'
              }`}>
                {s < step
                  ? <span className="material-symbols-outlined text-[14px]">check</span>
                  : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${s < step ? 'bg-primary' : 'bg-outline-variant'}`} />}
            </div>
          ))}
        </div>

        <div className="glass-modal p-space-xl">
          {step === 1 && (
            <Step1 form={form} update={update} showPassword={showPassword} setShowPassword={setShowPassword} />
          )}
          {step === 2 && (
            <Step2 form={form} update={update} />
          )}
          {step === 3 && (
            <Step3 form={form} update={update} />
          )}

          {/* Navigation */}
          <div className="flex items-center gap-space-sm mt-space-lg">
            {step > 1 && (
              <button className="btn-secondary flex-1" onClick={() => setStep((s) => s - 1)} id="register-back-btn">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back
              </button>
            )}
            {step < 3 ? (
              <button className="btn-primary flex-1" onClick={() => setStep((s) => s + 1)} id="register-next-btn">
                Next
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            ) : (
              <button className="btn-primary flex-1" id="register-submit-btn">
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                Create Account
              </button>
            )}
          </div>

          <div className="divider my-space-md" />
          <p className="text-center text-body-md text-on-surface-variant">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline" id="register-goto-login">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Step1({ form, update, showPassword, setShowPassword }) {
  return (
    <div className="space-y-space-md">
      <h2 className="text-headline-sm font-bold text-on-surface">Account Credentials</h2>
      <div>
        <label className="input-label" htmlFor="reg-institutional-id">Institutional ID *</label>
        <input
          className="input-field font-mono tracking-widest"
          type="text"
          id="reg-institutional-id"
          placeholder="16-char alphanumeric (e.g. CSE0120210001A1)"
          maxLength={16}
          value={form.institutionalId}
          onChange={(e) => update('institutionalId', e.target.value.toUpperCase())}
        />
        <p className="text-label-sm text-on-surface-variant mt-1">
          Exactly 16 alphanumeric characters · Regex: ^[a-zA-Z0-9]{'{'}16{'}'}$
        </p>
      </div>
      <div>
        <label className="input-label" htmlFor="reg-name">Full Name *</label>
        <input className="input-field" type="text" id="reg-name" placeholder="Your full name"
          value={form.name} onChange={(e) => update('name', e.target.value)} />
      </div>
      <div>
        <label className="input-label" htmlFor="reg-email">Email *</label>
        <input className="input-field" type="email" id="reg-email" placeholder="your@baust.edu.bd"
          value={form.email} onChange={(e) => update('email', e.target.value)} />
      </div>
      <div>
        <label className="input-label" htmlFor="reg-password">Password *</label>
        <div className="relative">
          <input className="input-field pr-12" type={showPassword ? 'text' : 'password'} id="reg-password"
            placeholder="Minimum 8 characters" value={form.password} onChange={(e) => update('password', e.target.value)} />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            onClick={() => setShowPassword((s) => !s)} id="reg-show-password">
            <span className="material-symbols-outlined text-[20px]">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Step2({ form, update }) {
  return (
    <div className="space-y-space-md">
      <h2 className="text-headline-sm font-bold text-on-surface">Personal Information</h2>
      <div className="grid grid-cols-2 gap-space-md">
        <div>
          <label className="input-label" htmlFor="reg-gender">Gender *</label>
          <select className="input-field" id="reg-gender" value={form.gender}
            onChange={(e) => update('gender', e.target.value)}>
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <div>
          <label className="input-label" htmlFor="reg-user-type">Role *</label>
          <select className="input-field" id="reg-user-type" value={form.userType}
            onChange={(e) => update('userType', e.target.value)}>
            {['Student', 'Teacher', 'Staff'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="input-label" htmlFor="reg-department">Department *</label>
        <select className="input-field" id="reg-department" value={form.department}
          onChange={(e) => update('department', e.target.value)}>
          <option value="">Select department</option>
          {['CSE','EEE','ME','ICT','ENG','BBA','AIS','IPE','CE'].map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="input-label" htmlFor="reg-phone">Phone Number</label>
        <input className="input-field" type="tel" id="reg-phone" placeholder="+880 1XXXXXXXXX"
          value={form.phone} onChange={(e) => update('phone', e.target.value)} />
      </div>
    </div>
  );
}

function Step3({ form, update }) {
  return (
    <div className="space-y-space-md">
      <h2 className="text-headline-sm font-bold text-on-surface">Blood & Donor Profile</h2>
      <div>
        <label className="input-label" htmlFor="reg-blood-group">Blood Group *</label>
        <select className="input-field" id="reg-blood-group" value={form.bloodGroup}
          onChange={(e) => update('bloodGroup', e.target.value)}>
          <option value="">Select blood group</option>
          {['A+','A-','B+','B-','AB+','AB-','O+','O-','BOMBAY'].map((bg) => (
            <option key={bg} value={bg}>{bg}</option>
          ))}
        </select>
        <p className="text-label-sm text-on-surface-variant mt-1">
          Blood group can be updated by admin after verification. It will be locked once approved.
        </p>
      </div>
      <div className="glass-panel rounded-xl p-space-md space-y-3">
        <h3 className="text-label-lg font-semibold text-on-surface">Donor Settings</h3>
        <label className="flex items-center gap-space-sm cursor-pointer" htmlFor="reg-available">
          <div className="w-5 h-5 rounded border border-outline bg-surface flex items-center justify-center">
            <span className="material-symbols-outlined text-[14px] text-primary hidden">check</span>
          </div>
          <div>
            <p className="text-body-md font-medium text-on-surface">Available for donation</p>
            <p className="text-body-sm text-on-surface-variant">
              You'll be visible in donor search (if not in 90-day cooldown)
            </p>
          </div>
        </label>
        <label className="flex items-center gap-space-sm cursor-pointer" htmlFor="reg-volunteer">
          <div className="w-5 h-5 rounded border border-outline bg-surface flex items-center justify-center">
            <span className="material-symbols-outlined text-[14px] text-primary hidden">check</span>
          </div>
          <div>
            <p className="text-body-md font-medium text-on-surface">Disaster Volunteer</p>
            <p className="text-body-sm text-on-surface-variant">
              Notified in zero-match SOS escalations when no standard donors match
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}

export default RegisterScreen;
