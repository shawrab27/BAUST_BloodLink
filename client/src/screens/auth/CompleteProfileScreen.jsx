import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DEPARTMENTS = [
  'CSE', 'EEE', 'ME', 'CE', 'IPE', 'TE', 'BME', 'BBA', 'AIS', 'English', 'Physics', 'Chemistry', 'Mathematics', 'Other',
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Bombay (hh)'];

const USER_TYPES = ['Student', 'Teacher', 'Staff'];

/**
 * CompleteProfileScreen — upgrade a Guest OAuth account to a Verified campus account.
 * Shows only the campus-specific fields that weren't collected during social sign-in.
 * On success, re-issues a JWT with accountStatus: 'Verified' and redirects.
 */
function CompleteProfileScreen() {
  const navigate = useNavigate();
  const { completeProfile, user, isLoading } = useAuth();

  const [form, setForm] = useState({
    institutionalId: '',
    gender: 'Male',
    department: '',
    bloodGroup: '',
    userType: 'Student',
    phone: '',
    batch: '',
    section: '',
    session: '',
    designation: '',
    isDisasterVolunteer: false,
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  };

  const validate = () => {
    const e = {};
    const idPattern = /^[A-Za-z0-9]{16}$/;
    if (!idPattern.test(form.institutionalId.trim())) {
      e.institutionalId = 'Must be exactly 16 alphanumeric characters (e.g. CSE0120210001A23)';
    }
    if (!form.department) e.department = 'Department is required';
    if (!form.bloodGroup) e.bloodGroup = 'Blood group is required';
    if (form.userType === 'Student') {
      if (!form.batch.trim()) e.batch = 'Batch is required';
      if (!form.section.trim()) e.section = 'Section is required';
      if (!form.session.trim()) e.session = 'Session is required';
    }
    if (form.userType === 'Teacher' && !form.designation.trim()) {
      e.designation = 'Designation is required';
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
      gender: form.gender,
      department: form.department,
      bloodGroup: form.bloodGroup,
      userType: form.userType,
      ...(form.phone && { phone: form.phone.trim() }),
      isDisasterVolunteer: form.isDisasterVolunteer,
      ...(form.userType === 'Student' && {
        studentDetails: { batch: form.batch, section: form.section, session: form.session },
      }),
      ...(form.userType === 'Teacher' && {
        teacherDetails: { designation: form.designation },
      }),
    };

    const res = await completeProfile(payload);
    setSubmitting(false);

    if (res.success) {
      navigate(res.redirectTo || '/feed', { replace: true });
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4 shadow-lg">
            <span className="material-symbols-outlined text-white text-3xl">school</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Complete Your Campus Profile</h1>
          <p className="text-slate-500 text-sm mt-2">
            Hi <span className="font-semibold text-slate-700">{user?.name || 'there'}</span> — you're signed in
            as a Guest. Fill in your campus details to unlock all features.
          </p>
        </div>

        {/* Guest capability callout */}
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex gap-3">
          <span className="material-symbols-outlined text-amber-500 text-[20px] mt-0.5 flex-shrink-0">info</span>
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">What unlocks after you complete this:</p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-700">
              <li>Request blood (emergency & planned)</li>
              <li>Appear as a donor in search results</li>
              <li>Send and receive messages</li>
              <li>Join WhatsApp crisis channel</li>
              <li>Dispatch emergency SOS</li>
            </ul>
          </div>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg border border-slate-100 p-7 space-y-5"
          noValidate
        >
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
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                id="cp-gender"
                className={inputCls('gender')}
                value={form.gender}
                onChange={(e) => set('gender', e.target.value)}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
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
                  type="text"
                  className={inputCls('batch')}
                  placeholder="e.g. 22"
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

          {/* Phone (optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Phone <span className="text-slate-400 font-normal">(optional)</span>
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
          <label className="flex items-start gap-3 cursor-pointer select-none group">
            <input
              id="cp-disaster-volunteer"
              type="checkbox"
              checked={form.isDisasterVolunteer}
              onChange={(e) => set('isDisasterVolunteer', e.target.checked)}
              className="mt-0.5 accent-primary w-4 h-4 rounded"
            />
            <div>
              <p className="text-sm font-semibold text-slate-700 group-hover:text-primary transition-colors">
                Disaster Reserve Volunteer
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Make yourself available for emergency campus crisis mobilization
              </p>
            </div>
          </label>

          {/* Submit */}
          <button
            id="cp-submit"
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm tracking-wide hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 shadow-md"
          >
            {busy ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                Completing Profile…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                Complete Campus Profile
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
