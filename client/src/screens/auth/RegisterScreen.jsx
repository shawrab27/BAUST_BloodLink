import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * RegisterScreen — Registration Form (Phase 2)
 * Matches Stitch screen "BAUST BloodLink - Registration Form"
 * Wired to POST /api/auth/register with all server-side validation.
 *
 * Server-enforced constraints:
 * - Institutional ID: exactly 16 alphanumeric chars ^[a-zA-Z0-9]{16}$
 * - Gender: enum ['Male','Female']
 * - Department: enum ['CSE','EEE','ME','ICT','ENG','BBA','AIS','IPE','CE']
 * - Blood Group: enum ['A+','A-','B+','B-','AB+','AB-','O+','O-','BOMBAY']
 * - User Types: enum ['Student','Teacher','Staff'] with role sub-documents
 * - bcrypt salt rounds 10+, JWT 8h expiry
 */
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'BOMBAY'];
const DEPARTMENTS = ['CSE', 'EEE', 'ME', 'ICT', 'ENG', 'BBA', 'AIS', 'IPE', 'CE'];
const USER_TYPES = ['Student', 'Teacher', 'Staff'];

function RegisterScreen() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

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
    // Subdocument fields
    studentBatch: '',
    studentSection: '',
    studentSession: '',
    teacherDesignation: '',
    teacherRoomNumber: '',
    staffDesignation: '',
    staffOffice: '',
    // Toggles
    isAvailable: true,
    isDisasterVolunteer: false,
  });

  const update = (key, value) => {
    setErrors((prev) => ({ ...prev, [key]: '' }));
    setServerError('');
    setForm((f) => ({ ...f, [key]: value }));
  };

  // Step 1 Validation
  const validateStep1 = () => {
    const errs = {};
    const id = form.institutionalId.trim().toUpperCase();

    if (!id) {
      errs.institutionalId = 'Institutional ID is required.';
    } else if (!/^[A-Z0-9]{16}$/.test(id)) {
      errs.institutionalId = 'Institutional ID must be exactly 16 alphanumeric characters.';
    }

    if (!form.name.trim() || form.name.trim().length < 2) {
      errs.name = 'Full name is required (at least 2 characters).';
    }

    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      errs.email = 'A valid email address is required.';
    }

    if (!form.password || form.password.length < 8) {
      errs.password = 'Password must be at least 8 characters long.';
    }

    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    const errs = {};

    if (!form.gender) {
      errs.gender = 'Please select a gender.';
    }

    if (!form.department) {
      errs.department = 'Please select your department.';
    }

    if (!form.userType) {
      errs.userType = 'Please select your role.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 3 Validation & Submit
  const validateStep3 = () => {
    const errs = {};

    if (!form.bloodGroup) {
      errs.bloodGroup = 'Please select your blood group.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setServerError('');

    // Prepare payload matching Mongoose schema
    const payload = {
      institutionalId: form.institutionalId.trim().toUpperCase(),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      gender: form.gender,
      department: form.department,
      bloodGroup: form.bloodGroup,
      userType: form.userType,
      phone: form.phone.trim(),
      availabilityStatus: form.isAvailable ? 'Available' : 'Unavailable',
      isDisasterVolunteer: form.isDisasterVolunteer,
    };

    if (form.userType === 'Student') {
      payload.studentDetails = {
        batch: form.studentBatch.trim(),
        section: form.studentSection.trim(),
        session: form.studentSession.trim(),
      };
    } else if (form.userType === 'Teacher') {
      payload.teacherDetails = {
        designation: form.teacherDesignation.trim(),
        roomNumber: form.teacherRoomNumber.trim(),
      };
    } else if (form.userType === 'Staff') {
      payload.staffDetails = {
        designation: form.staffDesignation.trim(),
        office: form.staffOffice.trim(),
      };
    }

    const res = await register(payload);
    if (res.success) {
      navigate('/', { replace: true });
    } else {
      setServerError(res.error || 'Registration failed.');
      if (res.errors) {
        const fieldErrors = {};
        res.errors.forEach((err) => {
          if (err.field) fieldErrors[err.field] = err.message;
        });
        setErrors(fieldErrors);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden py-12">
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

      <div className="relative z-10 w-full max-w-[620px] px-6">
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
          {[
            { num: 1, label: 'Account' },
            { num: 2, label: 'Personal & Role' },
            { num: 3, label: 'Blood Profile' },
          ].map(({ num, label }) => (
            <div key={num} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-label-md font-bold transition-all ${
                  num === step
                    ? 'bg-primary text-on-primary shadow-crimson-sm'
                    : num < step
                    ? 'bg-primary/20 text-primary'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {num < step ? (
                  <span className="material-symbols-outlined text-[14px]">check</span>
                ) : (
                  num
                )}
              </div>
              <span
                className={`text-label-sm hidden sm:inline ${
                  num === step ? 'font-semibold text-primary' : 'text-on-surface-variant'
                }`}
              >
                {label}
              </span>
              {num < 3 && (
                <div
                  className={`w-10 h-0.5 ${num < step ? 'bg-primary' : 'bg-outline-variant'}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="glass-modal p-space-xl">
          {serverError && (
            <div
              className="mb-space-md p-space-sm rounded-xl bg-error-container/80 border border-primary/30 text-on-surface flex items-start gap-2 animate-fade-in"
              role="alert"
            >
              <span className="material-symbols-outlined text-[20px] text-primary shrink-0 mt-0.5">
                error
              </span>
              <p className="text-body-sm font-medium">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <Step1
                form={form}
                update={update}
                errors={errors}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
              />
            )}
            {step === 2 && (
              <Step2 form={form} update={update} errors={errors} />
            )}
            {step === 3 && (
              <Step3 form={form} update={update} errors={errors} />
            )}

            {/* Navigation */}
            <div className="flex items-center gap-space-sm mt-space-lg">
              {step > 1 && (
                <button
                  className="btn-secondary flex-1 justify-center"
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  id="register-back-btn"
                  disabled={isLoading}
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  Back
                </button>
              )}
              {step < 3 ? (
                <button
                  className="btn-primary flex-1 justify-center"
                  type="button"
                  onClick={handleNext}
                  id="register-next-btn"
                >
                  Next
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              ) : (
                <button
                  className="btn-primary flex-1 justify-center"
                  type="submit"
                  id="register-submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">
                        progress_activity
                      </span>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">person_add</span>
                      Complete Registration
                    </>
                  )}
                </button>
              )}
            </div>
          </form>

          <div className="divider my-space-md" />
          <p className="text-center text-body-md text-on-surface-variant">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary font-semibold hover:underline"
              id="register-goto-login"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Step1({ form, update, errors, showPassword, setShowPassword }) {
  return (
    <div className="space-y-space-md animate-fade-in">
      <h2 className="text-headline-sm font-bold text-on-surface">Account Credentials</h2>

      <div>
        <label className="input-label" htmlFor="reg-institutional-id">
          Institutional ID *
        </label>
        <input
          className={`input-field font-mono uppercase tracking-wider ${
            errors.institutionalId ? 'border-primary' : ''
          }`}
          type="text"
          id="reg-institutional-id"
          placeholder="16-char ID (e.g. 1234567890123456)"
          maxLength={16}
          value={form.institutionalId}
          onChange={(e) => update('institutionalId', e.target.value.toUpperCase())}
        />
        <div className="flex justify-between items-center mt-1">
          <p className="text-label-sm text-on-surface-variant">
            Exactly 16 alphanumeric characters · Regex: ^[a-zA-Z0-9]{'{'}16{'}'}$
          </p>
          <span className="text-label-sm text-on-surface-variant font-mono">
            {form.institutionalId.length}/16
          </span>
        </div>
        {errors.institutionalId && (
          <p className="text-label-sm text-primary mt-1">{errors.institutionalId}</p>
        )}
      </div>

      <div>
        <label className="input-label" htmlFor="reg-name">
          Full Name *
        </label>
        <input
          className={`input-field ${errors.name ? 'border-primary' : ''}`}
          type="text"
          id="reg-name"
          placeholder="e.g. Shahriar Shawrab"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
        />
        {errors.name && <p className="text-label-sm text-primary mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="input-label" htmlFor="reg-email">
          Email *
        </label>
        <input
          className={`input-field ${errors.email ? 'border-primary' : ''}`}
          type="email"
          id="reg-email"
          placeholder="your.email@baust.edu.bd"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
        />
        {errors.email && <p className="text-label-sm text-primary mt-1">{errors.email}</p>}
      </div>

      <div className="grid grid-cols-2 gap-space-md">
        <div>
          <label className="input-label" htmlFor="reg-password">
            Password *
          </label>
          <div className="relative">
            <input
              className={`input-field pr-12 ${errors.password ? 'border-primary' : ''}`}
              type={showPassword ? 'text' : 'password'}
              id="reg-password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              onClick={() => setShowPassword((s) => !s)}
              id="reg-show-password"
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
          {errors.password && (
            <p className="text-label-sm text-primary mt-1">{errors.password}</p>
          )}
        </div>

        <div>
          <label className="input-label" htmlFor="reg-confirm-password">
            Confirm Password *
          </label>
          <input
            className={`input-field ${errors.confirmPassword ? 'border-primary' : ''}`}
            type={showPassword ? 'text' : 'password'}
            id="reg-confirm-password"
            placeholder="Repeat password"
            value={form.confirmPassword}
            onChange={(e) => update('confirmPassword', e.target.value)}
          />
          {errors.confirmPassword && (
            <p className="text-label-sm text-primary mt-1">{errors.confirmPassword}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Step2({ form, update, errors }) {
  return (
    <div className="space-y-space-md animate-fade-in">
      <h2 className="text-headline-sm font-bold text-on-surface">Personal & Academic Role</h2>

      <div className="grid grid-cols-2 gap-space-md">
        <div>
          <label className="input-label" htmlFor="reg-gender">
            Gender *
          </label>
          <select
            className={`input-field ${errors.gender ? 'border-primary' : ''}`}
            id="reg-gender"
            value={form.gender}
            onChange={(e) => update('gender', e.target.value)}
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          {errors.gender && <p className="text-label-sm text-primary mt-1">{errors.gender}</p>}
        </div>

        <div>
          <label className="input-label" htmlFor="reg-user-type">
            Role Type *
          </label>
          <select
            className={`input-field ${errors.userType ? 'border-primary' : ''}`}
            id="reg-user-type"
            value={form.userType}
            onChange={(e) => update('userType', e.target.value)}
          >
            {USER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="input-label" htmlFor="reg-department">
          Department *
        </label>
        <select
          className={`input-field ${errors.department ? 'border-primary' : ''}`}
          id="reg-department"
          value={form.department}
          onChange={(e) => update('department', e.target.value)}
        >
          <option value="">Select BAUST department</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        {errors.department && (
          <p className="text-label-sm text-primary mt-1">{errors.department}</p>
        )}
      </div>

      {/* Role-specific sub-document fields */}
      {form.userType === 'Student' && (
        <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-surface-container/60 border border-outline-variant/50">
          <div>
            <label className="input-label" htmlFor="reg-student-batch">
              Batch
            </label>
            <input
              className="input-field text-body-sm"
              id="reg-student-batch"
              placeholder="e.g. 11th"
              value={form.studentBatch}
              onChange={(e) => update('studentBatch', e.target.value)}
            />
          </div>
          <div>
            <label className="input-label" htmlFor="reg-student-section">
              Section
            </label>
            <input
              className="input-field text-body-sm"
              id="reg-student-section"
              placeholder="e.g. A"
              value={form.studentSection}
              onChange={(e) => update('studentSection', e.target.value)}
            />
          </div>
          <div>
            <label className="input-label" htmlFor="reg-student-session">
              Session
            </label>
            <input
              className="input-field text-body-sm"
              id="reg-student-session"
              placeholder="e.g. 2021-22"
              value={form.studentSession}
              onChange={(e) => update('studentSession', e.target.value)}
            />
          </div>
        </div>
      )}

      {form.userType === 'Teacher' && (
        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface-container/60 border border-outline-variant/50">
          <div>
            <label className="input-label" htmlFor="reg-teacher-desig">
              Designation
            </label>
            <input
              className="input-field text-body-sm"
              id="reg-teacher-desig"
              placeholder="e.g. Assistant Professor"
              value={form.teacherDesignation}
              onChange={(e) => update('teacherDesignation', e.target.value)}
            />
          </div>
          <div>
            <label className="input-label" htmlFor="reg-teacher-room">
              Room Number
            </label>
            <input
              className="input-field text-body-sm"
              id="reg-teacher-room"
              placeholder="e.g. Academic-302"
              value={form.teacherRoomNumber}
              onChange={(e) => update('teacherRoomNumber', e.target.value)}
            />
          </div>
        </div>
      )}

      {form.userType === 'Staff' && (
        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface-container/60 border border-outline-variant/50">
          <div>
            <label className="input-label" htmlFor="reg-staff-desig">
              Designation
            </label>
            <input
              className="input-field text-body-sm"
              id="reg-staff-desig"
              placeholder="e.g. Officer"
              value={form.staffDesignation}
              onChange={(e) => update('staffDesignation', e.target.value)}
            />
          </div>
          <div>
            <label className="input-label" htmlFor="reg-staff-office">
              Office / Section
            </label>
            <input
              className="input-field text-body-sm"
              id="reg-staff-office"
              placeholder="e.g. Registrar Office"
              value={form.staffOffice}
              onChange={(e) => update('staffOffice', e.target.value)}
            />
          </div>
        </div>
      )}

      <div>
        <label className="input-label" htmlFor="reg-phone">
          Phone Number
        </label>
        <input
          className="input-field"
          type="tel"
          id="reg-phone"
          placeholder="+880 1XXXXXXXXX"
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
        />
      </div>
    </div>
  );
}

function Step3({ form, update, errors }) {
  return (
    <div className="space-y-space-md animate-fade-in">
      <h2 className="text-headline-sm font-bold text-on-surface">Blood Group & Donor Profile</h2>

      <div>
        <label className="input-label" htmlFor="reg-blood-group">
          Blood Group *
        </label>
        <select
          className={`input-field ${errors.bloodGroup ? 'border-primary' : ''}`}
          id="reg-blood-group"
          value={form.bloodGroup}
          onChange={(e) => update('bloodGroup', e.target.value)}
        >
          <option value="">Select blood group</option>
          {BLOOD_GROUPS.map((bg) => (
            <option key={bg} value={bg}>
              {bg}
            </option>
          ))}
        </select>
        {errors.bloodGroup && (
          <p className="text-label-sm text-primary mt-1">{errors.bloodGroup}</p>
        )}
        <p className="text-label-sm text-on-surface-variant mt-1">
          Supports A+, A-, B+, B-, AB+, AB-, O+, O-, and rare BOMBAY blood types. Locked after admin
          verification.
        </p>
      </div>

      <div className="glass-panel rounded-xl p-space-md space-y-4">
        <h3 className="text-label-lg font-semibold text-on-surface">Donor Preferences</h3>

        <label className="flex items-start gap-space-sm cursor-pointer" htmlFor="reg-available">
          <input
            type="checkbox"
            id="reg-available"
            checked={form.isAvailable}
            onChange={(e) => update('isAvailable', e.target.checked)}
            className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
          />
          <div>
            <p className="text-body-md font-medium text-on-surface">Available for blood donation</p>
            <p className="text-body-sm text-on-surface-variant">
              You will be discoverable in donor searches when you are not in the 90-day cooldown
              period.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-space-sm cursor-pointer" htmlFor="reg-volunteer">
          <input
            type="checkbox"
            id="reg-volunteer"
            checked={form.isDisasterVolunteer}
            onChange={(e) => update('isDisasterVolunteer', e.target.checked)}
            className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
          />
          <div>
            <p className="text-body-md font-medium text-on-surface">Disaster Volunteer Pool</p>
            <p className="text-body-sm text-on-surface-variant">
              Opt-in to be alerted during critical zero-match SOS emergencies when immediate blood
              mobilization is needed.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}

export default RegisterScreen;
