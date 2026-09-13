import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DEPARTMENTS = [
  'CSE', 'EEE', 'ME', 'CE', 'IPE', 'TE', 'BME', 'BBA', 'AIS', 'English', 'Physics', 'Chemistry', 'Mathematics', 'Other',
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const USER_TYPES = ['Student', 'Teacher', 'Staff'];

/**
 * CompleteProfileScreen — upgrade a Guest OAuth account (Google, GitHub, Facebook)
 * to a Verified campus account using Google data, donation history & never-donated logic.
 */
function CompleteProfileScreen() {
  const navigate = useNavigate();
  const { completeProfile, user, isLoading } = useAuth();

  const [form, setForm] = useState({
    institutionalId: '',
    name: user?.name || '',
    gender: 'Male',
    department: '',
    bloodGroup: '',
    userType: 'Student',
    phone: user?.phone || '',
    batch: '',
    section: '',
    session: '',
    designation: '',
    isDisasterVolunteer: false,
    hasNeverDonated: true,
    lastDonationDate: '',
    totalDonations: 0,
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync Google / OAuth profile data on load
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  };

  // Cooldown calculation helper
  const getCooldownInfo = () => {
    if (form.hasNeverDonated || !form.lastDonationDate) {
      return { isCooldown: false, daysLeft: 0, eligible: true };
    }
    const lastDate = new Date(form.lastDonationDate);
    if (isNaN(lastDate.getTime())) {
      return { isCooldown: false, daysLeft: 0, eligible: true };
    }
    const diffMs = Date.now() - lastDate.getTime();
    const daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (daysSince < 90) {
      const eligibleDate = new Date(lastDate.getTime() + 90 * 24 * 60 * 60 * 1000);
      return {
        isCooldown: true,
        daysLeft: 90 - daysSince,
        eligibleDate: eligibleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        eligible: false,
      };
    }
    return { isCooldown: false, daysLeft: 0, eligible: true };
  };

  const cooldown = getCooldownInfo();

  const validate = () => {
    const e = {};
    const idPattern = /^[A-Za-z0-9]{16}$/;
    if (!idPattern.test(form.institutionalId.trim())) {
      e.institutionalId = 'Must be exactly 16 alphanumeric characters (e.g. CSE0120210001A23)';
    }
    if (!form.department) e.department = 'Department is required';
    if (!form.bloodGroup) e.bloodGroup = 'Blood group is required';
    if (form.userType === 'Student') {
      if (!form.batch.toString().trim()) e.batch = 'Batch is required';
      if (!form.section.trim()) e.section = 'Section is required';
      if (!form.session.trim()) e.session = 'Session is required';
    }
    if (form.userType === 'Teacher' && !form.designation.trim()) {
      e.designation = 'Designation is required';
    }
    if (!form.hasNeverDonated) {
      if (!form.lastDonationDate) {
        e.lastDonationDate = 'Please select your last donation date';
      } else if (new Date(form.lastDonationDate).getTime() > Date.now()) {
        e.lastDonationDate = 'Last donation date cannot be in the future';
      }
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const v = validate();
    if (Object.keys(v).length > 0) {
      setErrors(v);
      return;
    }

    setSubmitting(true);
    const payload = {
      institutionalId: form.institutionalId.trim().toUpperCase(),
      name: form.name.trim() || user?.name || undefined,
      gender: form.gender,
      department: form.department,
      bloodGroup: form.bloodGroup,
      userType: form.userType,
      avatarUrl: user?.avatarUrl || undefined,
      ...(form.phone && { phone: form.phone.trim() }),
      isDisasterVolunteer: form.isDisasterVolunteer,
      hasNeverDonated: form.hasNeverDonated,
      lastDonationDate: form.hasNeverDonated ? null : (form.lastDonationDate ? new Date(form.lastDonationDate).toISOString() : null),
      totalDonations: form.hasNeverDonated ? 0 : (Number(form.totalDonations) || 1),
      ...(form.userType === 'Student' && {
        studentDetails: { batch: String(form.batch), section: form.section, session: form.session },
      }),
      ...(form.userType === 'Teacher' && {
        teacherDetails: { designation: form.designation },
      }),
    };

    const res = await completeProfile(payload);
    setSubmitting(false);

    if (res.success) {
      navigate(res.redirectTo || '/profile', { replace: true });
    } else {
      setServerError(res.error || 'Something went wrong. Please try again.');
      if (res.errors) {
        const fieldErrors = {};
        (res.errors || []).forEach((err) => {
          if (err.path) fieldErrors[err.path] = err.msg;
        });
        setErrors(fieldErrors);
      }
    }
  };

  const inputCls = (field) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
      errors[field]
        ? 'border-red-400 bg-red-50 focus:ring-red-300'
        : 'border-slate-200 bg-white focus:ring-primary/30 focus:border-primary'
    }`;

  const busy = isLoading || submitting;

  // Max date for date picker = today
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-blue-50/40 flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-xl">
        {/* Navigation Back */}
        <div className="mb-4">
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-primary transition-colors py-1.5 px-3 rounded-lg bg-white/80 hover:bg-white border border-slate-200 shadow-2xs"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Return to Profile</span>
          </Link>
        </div>

        {/* User Identity Banner (Google / Social Account Info) */}
        <div className="mb-6 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="relative shrink-0">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || 'User Profile'}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/30 shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg ring-2 ring-primary/20">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-emerald-500 text-white shadow-xs">
              <span className="material-symbols-outlined text-[12px] block">check</span>
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 truncate">
                {user?.name || 'Google Guest'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/10 text-primary uppercase">
                {user?.authProvider ? `${user.authProvider} account` : 'Guest Mode'}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {user?.email || 'Authenticated via Google Identity'}
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Complete Campus Verification</h1>
          <p className="text-slate-500 text-xs mt-1">
            Link your institutional details and donation status to unlock blood requests, crisis dispatch, and donor matches.
          </p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8 space-y-5"
          noValidate
        >
          {/* 1-Click Quick Preset Fill */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-primary">auto_fix_high</span>
              Quick Demo Presets (1-Click Autofill):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setForm({
                    institutionalId: `CSE${Date.now().toString().slice(-4)}20210001`,
                    name: user?.name || 'Nasim Shawrab',
                    gender: 'Male',
                    department: 'CSE',
                    bloodGroup: 'B+',
                    userType: 'Student',
                    phone: '+8801712345678',
                    batch: '19',
                    section: 'A',
                    session: '2020-21',
                    designation: '',
                    isDisasterVolunteer: true,
                    hasNeverDonated: true,
                    lastDonationDate: '',
                    totalDonations: 0,
                  });
                  setErrors({});
                }}
                className="py-1.5 px-2 rounded-xl bg-white border border-slate-200 hover:border-primary/40 hover:bg-primary/5 text-[11px] font-bold text-slate-700 hover:text-primary transition-all text-center shadow-xs cursor-pointer"
              >
                CSE Student (B+, Never Donated)
              </button>
              <button
                type="button"
                onClick={() => {
                  const cooldownDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                  setForm({
                    institutionalId: `EEE${Date.now().toString().slice(-4)}20210002`,
                    name: user?.name || 'Nasim Shawrab',
                    gender: 'Male',
                    department: 'EEE',
                    bloodGroup: 'A+',
                    userType: 'Student',
                    phone: '+8801722334455',
                    batch: '20',
                    section: 'B',
                    session: '2021-22',
                    designation: '',
                    isDisasterVolunteer: false,
                    hasNeverDonated: false,
                    lastDonationDate: cooldownDate,
                    totalDonations: 2,
                  });
                  setErrors({});
                }}
                className="py-1.5 px-2 rounded-xl bg-white border border-slate-200 hover:border-primary/40 hover:bg-primary/5 text-[11px] font-bold text-slate-700 hover:text-primary transition-all text-center shadow-xs cursor-pointer"
              >
                EEE Student (A+, 40d Cooldown)
              </button>
              <button
                type="button"
                onClick={() => {
                  const pastDate = new Date(Date.now() - 110 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                  setForm({
                    institutionalId: `TEA${Date.now().toString().slice(-4)}20210003`,
                    name: user?.name || 'Nasim Shawrab',
                    gender: 'Male',
                    department: 'CSE',
                    bloodGroup: 'O+',
                    userType: 'Teacher',
                    phone: '+8801733445566',
                    batch: '',
                    section: '',
                    session: '',
                    designation: 'Associate Professor',
                    isDisasterVolunteer: true,
                    hasNeverDonated: false,
                    lastDonationDate: pastDate,
                    totalDonations: 5,
                  });
                  setErrors({});
                }}
                className="py-1.5 px-2 rounded-xl bg-white border border-slate-200 hover:border-primary/40 hover:bg-primary/5 text-[11px] font-bold text-slate-700 hover:text-primary transition-all text-center shadow-xs cursor-pointer"
              >
                Teacher (O+, 5 Donations)
              </button>
            </div>
          </div>

          {serverError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-red-500 text-[18px] flex-shrink-0">error</span>
              <p className="text-sm text-red-700">{serverError}</p>
            </div>
          )}

          {/* Institutional ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Institutional ID <span className="text-red-500">*</span>
            </label>
            <input
              id="cp-institutional-id"
              type="text"
              maxLength={16}
              className={inputCls('institutionalId')}
              placeholder="e.g. CSE0120210001A23"
              value={form.institutionalId}
              onChange={(e) => set('institutionalId', e.target.value.toUpperCase())}
              required
            />
            {errors.institutionalId && (
              <p className="text-xs text-red-600 mt-1">{errors.institutionalId}</p>
            )}
          </div>

          {/* User Type & Gender row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                I am a <span className="text-red-500">*</span>
              </label>
              <select
                id="cp-user-type"
                className={inputCls('userType')}
                value={form.userType}
                onChange={(e) => set('userType', e.target.value)}
              >
                {USER_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Gender <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200 shadow-inner">
                <button
                  type="button"
                  id="cp-gender-male"
                  onClick={() => set('gender', 'Male')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold text-xs tracking-wide transition-all cursor-pointer ${
                    form.gender === 'Male'
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/50 transform scale-[1.02]'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 shadow-xs'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px] font-bold">male</span>
                  <span>Male</span>
                </button>
                <button
                  type="button"
                  id="cp-gender-female"
                  onClick={() => set('gender', 'Female')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold text-xs tracking-wide transition-all cursor-pointer ${
                    form.gender === 'Female'
                      ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400/50 transform scale-[1.02]'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 shadow-xs'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px] font-bold">female</span>
                  <span>Female</span>
                </button>
              </div>
            </div>
          </div>

          {/* Department & Blood Group row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                id="cp-department"
                className={inputCls('department')}
                value={form.department}
                onChange={(e) => set('department', e.target.value)}
              >
                <option value="">Select...</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {errors.department && <p className="text-xs text-red-600 mt-1">{errors.department}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Blood Group <span className="text-red-500">*</span>
              </label>
              <select
                id="cp-blood-group"
                className={inputCls('bloodGroup')}
                value={form.bloodGroup}
                onChange={(e) => set('bloodGroup', e.target.value)}
              >
                <option value="">Select...</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
              {errors.bloodGroup && <p className="text-xs text-red-600 mt-1">{errors.bloodGroup}</p>}
            </div>
          </div>

          {/* Student-specific fields */}
          {form.userType === 'Student' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Batch <span className="text-red-500">*</span>
                </label>
                <input
                  id="cp-batch"
                  type="number"
                  min="1"
                  max="99"
                  className={inputCls('batch')}
                  placeholder="e.g. 19"
                  value={form.batch}
                  onChange={(e) => set('batch', e.target.value)}
                />
                {errors.batch && <p className="text-xs text-red-600 mt-1">{errors.batch}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Section <span className="text-red-500">*</span>
                </label>
                <input
                  id="cp-section"
                  type="text"
                  className={inputCls('section')}
                  placeholder="e.g. A"
                  value={form.section}
                  onChange={(e) => set('section', e.target.value)}
                />
                {errors.section && <p className="text-xs text-red-600 mt-1">{errors.section}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Session <span className="text-red-500">*</span>
                </label>
                <input
                  id="cp-session"
                  type="text"
                  className={inputCls('session')}
                  placeholder="e.g. 2023-24"
                  value={form.session}
                  onChange={(e) => set('session', e.target.value)}
                />
                {errors.session && <p className="text-xs text-red-600 mt-1">{errors.session}</p>}
              </div>
            </div>
          )}

          {/* Teacher-specific field */}
          {form.userType === 'Teacher' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Designation <span className="text-red-500">*</span>
              </label>
              <input
                id="cp-designation"
                type="text"
                className={inputCls('designation')}
                placeholder="e.g. Lecturer, Assistant Professor"
                value={form.designation}
                onChange={(e) => set('designation', e.target.value)}
              />
              {errors.designation && <p className="text-xs text-red-600 mt-1">{errors.designation}</p>}
            </div>
          )}

          {/* ── DONATION HISTORY & NEVER DONATED SECTION ── */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-primary">history_toggle_off</span>
                Donation History & Eligibility
              </label>
              {form.hasNeverDonated ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                  ✨ First-Time Donor
                </span>
              ) : cooldown.isCooldown ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  ⏱️ In Cooldown ({cooldown.daysLeft}d left)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                  ✅ Eligible Donor
                </span>
              )}
            </div>

            {/* Never Donated Toggle */}
            <label className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200/80 cursor-pointer select-none hover:border-primary/40 transition-colors">
              <input
                type="checkbox"
                id="cp-never-donated"
                checked={form.hasNeverDonated}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setForm((prev) => ({
                    ...prev,
                    hasNeverDonated: checked,
                    lastDonationDate: checked ? '' : prev.lastDonationDate,
                    totalDonations: checked ? 0 : (prev.totalDonations || 1),
                  }));
                  if (errors.lastDonationDate) {
                    setErrors((prev) => { const cp = { ...prev }; delete cp.lastDonationDate; return cp; });
                  }
                }}
                className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
              />
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-800">I have never donated blood before</p>
                <p className="text-[11px] text-slate-500">First-time donors will be immediately listed as available to donate.</p>
              </div>
            </label>

            {/* Previous Donation Inputs (Shown only if not never donated) */}
            {!form.hasNeverDonated && (
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1" htmlFor="cp-last-donation-date">
                    Last Donation Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="cp-last-donation-date"
                    type="date"
                    max={todayStr}
                    value={form.lastDonationDate}
                    onChange={(e) => set('lastDonationDate', e.target.value)}
                    className={inputCls('lastDonationDate')}
                  />
                  {errors.lastDonationDate && (
                    <p className="text-xs text-red-600 mt-1">{errors.lastDonationDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1" htmlFor="cp-total-donations">
                    Total Previous Donations
                  </label>
                  <input
                    id="cp-total-donations"
                    type="number"
                    min="1"
                    max="99"
                    value={form.totalDonations || 1}
                    onChange={(e) => set('totalDonations', Math.max(1, parseInt(e.target.value) || 1))}
                    className={inputCls('totalDonations')}
                  />
                </div>

                {/* Cooldown feedback banner */}
                {form.lastDonationDate && (
                  <div className={`sm:col-span-2 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                    cooldown.isCooldown ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  }`}>
                    <span className="material-symbols-outlined text-[16px]">
                      {cooldown.isCooldown ? 'schedule' : 'check_circle'}
                    </span>
                    <span>
                      {cooldown.isCooldown
                        ? `90-day cooldown active (${cooldown.daysLeft} days remaining). You will become eligible on ${cooldown.eligibleDate}.`
                        : 'Over 90 days have passed. You are immediately eligible to donate!'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Phone (optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Phone Number <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              id="cp-phone"
              type="tel"
              className={inputCls('phone')}
              placeholder="+880 1XXX-XXXXXX"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
          </div>

          {/* Disaster volunteer checkbox */}
          <label className="flex items-start gap-3 cursor-pointer select-none group p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-primary/40 transition-colors">
            <input
              id="cp-disaster-volunteer"
              type="checkbox"
              checked={form.isDisasterVolunteer}
              onChange={(e) => set('isDisasterVolunteer', e.target.checked)}
              className="mt-0.5 accent-primary w-4 h-4 rounded cursor-pointer"
            />
            <div>
              <p className="text-xs font-bold text-slate-800 group-hover:text-primary transition-colors">
                Disaster Reserve Volunteer
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Join the emergency campus rapid response pool for crisis mobilization.
              </p>
            </div>
          </label>

          {/* Submit CTA */}
          <button
            id="cp-submit"
            type="submit"
            disabled={busy}
            className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold text-sm tracking-wide active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 shadow-lg shadow-primary/20 cursor-pointer"
          >
            {busy ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                <span>Completing Profile…</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span>Complete Campus Profile</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Already have a full account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">Sign in here</Link>
        </p>
      </div>
    </main>
  );
}

export default CompleteProfileScreen;
