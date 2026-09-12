import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * RegisterScreen — Exact Replica of Stitch Screen:
 * "BAUST BloodLink - Registration Form" (projects/4526335937223431863)
 *
 * Implements:
 * - Ambient dynamic circulation WebGL canvas background
 * - 72px persistent glass header bar with logo, language pill, notification bell
 * - Segment 1: Basic Profile (Full Name, 16-char ID with live counter, Age stepper,
 *   segmented Male/Female toggle, Email, Password & Confirm with visibility toggle,
 *   Blood Group dropdown with Bombay Phenotype, Confirm Blood Group)
 * - Segment 2: Institutional Role & Academic Info (Segmented tabs for Student,
 *   Teacher, Staff with respective Level/Term/Batch/Dept or Designation/Sector)
 * - Segment 3: Donor History & Availability (Last donation date, Total bags stepper,
 *   emergency protocol consent notice)
 * - Complete Registration CTA with 256-Bit SSL indicator
 * - Wired to backend POST /api/auth/register
 */

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'BOMBAY'];
const DEPARTMENTS = ['CSE', 'EEE', 'ME', 'ICT', 'ENG', 'BBA', 'AIS', 'IPE', 'CE'];

function RegisterScreen() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const canvasRef = useRef(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    institutionalId: '',
    age: 21,
    gender: 'Male',
    email: '',
    password: '',
    confirmPassword: '',
    bloodGroup: '',
    confirmBloodGroup: '',
    userType: 'Student', // 'Student' | 'Teacher' | 'Staff'
    // Student
    studentLevel: 'Level 4',
    studentTerm: 'Term I',
    studentBatch: '12th Batch',
    studentDept: 'CSE',
    // Teacher
    teacherDesignation: 'Lecturer',
    teacherDept: 'CSE',
    // Staff
    staffSector: 'Admission Office',
    // Donor history
    lastDonationDate: '',
    totalBagsDonated: 0,
    isDisasterVolunteer: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [teacherDropdownOpen, setTeacherDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  // ─── Ambient Ruby Smoke & Circulation WebGL Background ───────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId;
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      varying vec2 v_uv;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.2113248654, 0.3660254037, -0.5773502691, 0.0243902439);
        vec2 i = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.7928429 - 0.8537347 * (a0*a0 + h*h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        float aspect = u_resolution.x / u_resolution.y;
        vec2 p = uv * vec2(aspect, 1.0);
        float t = u_time * 0.28;

        float n1 = snoise(p * 1.4 + vec2(t * 0.2, t * 0.15));
        float n2 = snoise(p * 2.6 - vec2(t * 0.3, n1 * 0.5));
        float n3 = snoise(p * 4.0 + vec2(n2 * 0.4, t * 0.1));
        float smoke = n1 * 0.5 + n2 * 0.35 + n3 * 0.15;

        float ribbon1 = sin(p.y * 3.0 + snoise(p * 1.1 + vec2(t * 0.15, 0.0)) * 1.2) - (p.x * 0.5 - 0.3 * aspect);
        float pulse1 = sin(p.y * 6.0 - t * 3.0) * 0.5 + 0.5;
        float rWave = smoothstep(0.12, 0.01, abs(ribbon1)) * (0.6 + 0.4 * pulse1);

        float rbc = smoothstep(0.96, 0.99, sin(p.x * 22.0 + t) * cos(p.y * 22.0 - t * 0.8));

        vec3 bgCanvas = vec3(0.965, 0.973, 0.988);
        vec3 rubyArterial = vec3(0.68, 0.05, 0.16);
        vec3 rubyRadiant = vec3(0.88, 0.11, 0.28);
        vec3 rubyBright = vec3(0.98, 0.32, 0.45);

        vec3 smokeMix = mix(rubyArterial, rubyRadiant, smoke * 0.5 + 0.5);
        smokeMix = mix(smokeMix, rubyBright, rWave * 0.6);

        float alphaVeil = (smoothstep(-0.2, 0.7, smoke) * 0.14 + rWave * 0.18 + rbc * 0.06);

        vec2 center = vec2(0.5 * aspect, 0.5);
        float dist = length(p - center);
        alphaVeil *= smoothstep(1.6, 0.2, dist);

        vec3 finalColor = mix(bgCanvas, smokeMix, clamp(alphaVeil, 0.0, 0.42));
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    function compile(type, code) {
      const s = gl.createShader(type);
      gl.shaderSource(s, code);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');

    function render(now) {
      if (!gl || !canvas) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, now * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(render);
    }
    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const update = (key, value) => {
    setErrors((prev) => ({ ...prev, [key]: '' }));
    setServerError('');
    setForm((f) => ({ ...f, [key]: value }));
  };

  const validate = () => {
    const errs = {};
    const id = form.institutionalId.trim().toUpperCase();

    if (!form.name.trim() || form.name.trim().length < 2) {
      errs.name = 'Full name is required (at least 2 characters).';
    }

    if (!id) {
      errs.institutionalId = 'Institutional ID is required.';
    } else if (!/^[A-Z0-9]{16}$/.test(id)) {
      errs.institutionalId = 'Institutional ID must be exactly 16 alphanumeric characters.';
    }

    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      errs.email = 'A valid institutional email is required.';
    }

    if (!form.password || form.password.length < 8) {
      errs.password = 'Password must be at least 8 characters long.';
    }

    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    if (!form.bloodGroup) {
      errs.bloodGroup = 'Please select a blood group.';
    }

    if (form.bloodGroup && form.confirmBloodGroup && form.bloodGroup !== form.confirmBloodGroup) {
      errs.confirmBloodGroup = 'Blood group confirmation does not match.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setServerError('');

    // Determine active department based on role
    let activeDept = 'CSE';
    if (form.userType === 'Student') activeDept = form.studentDept;
    else if (form.userType === 'Teacher') activeDept = form.teacherDept;

    // Normalizing Bombay blood group representation for server enum
    let normalizedBloodGroup = form.bloodGroup;
    if (normalizedBloodGroup.includes('Bombay')) {
      normalizedBloodGroup = 'BOMBAY';
    }

    const payload = {
      name: form.name.trim(),
      institutionalId: form.institutionalId.trim().toUpperCase(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      gender: form.gender,
      department: activeDept,
      bloodGroup: normalizedBloodGroup,
      userType: form.userType,
      isDisasterVolunteer: form.isDisasterVolunteer,
      lastDonationDate: form.lastDonationDate || null,
      donationCount: Number(form.totalBagsDonated) || 0,
    };

    if (form.userType === 'Student') {
      payload.studentDetails = {
        batch: form.studentBatch,
        section: form.studentTerm,
        session: form.studentLevel,
      };
    } else if (form.userType === 'Teacher') {
      payload.teacherDetails = {
        designation: form.teacherDesignation,
        roomNumber: '',
      };
    } else if (form.userType === 'Staff') {
      payload.staffDetails = {
        designation: form.staffSector,
        office: form.staffSector,
      };
    }

    const res = await register(payload);
    if (res.success) {
      navigate('/feed', { replace: true });
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
    <div className="min-h-screen relative flex flex-col items-center bg-[#f6f8fc] text-[#0f172a] font-sans selection:bg-rose-500 selection:text-white">
      {/* Live Dynamic Blood Circulation WebGL Shader */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Ambient Glow Spheres in background */}
      <div className="fixed -top-24 left-1/4 w-96 h-96 rounded-full bg-rose-200/40 blur-3xl pointer-events-none z-0" />
      <div className="fixed top-1/2 -right-24 w-[32rem] h-[32rem] rounded-full bg-red-100/50 blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-0 left-10 w-80 h-80 rounded-full bg-rose-100/40 blur-3xl pointer-events-none z-0" />

      {/* Persistent Top Navigation Bar (72px fixed height matching Stitch) */}
      <header className="w-full h-[72px] bg-white/88 backdrop-blur-md border-b border-rose-100/60 sticky top-0 z-50 flex items-center justify-between px-8 shadow-xs">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/emblem.png"
              alt="BAUST BloodLink Logo"
              className="h-11 w-auto object-contain drop-shadow-xs"
            />
            <div>
              <div className="flex items-center gap-1.5 text-xl font-black tracking-tight leading-none">
                <span className="brand-baust">
                  BAUST
                </span>
                <span className="brand-bloodlink-shine">
                  BloodLink
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block mt-0.5">
                Campus Blood Transfusion &amp; Emergency Donor Network
              </p>
            </div>
          </Link>
        </div>

        {/* Right Actions in Topbar */}
        <div className="flex items-center gap-5">
          {/* Language Selector Pill */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-lg border border-slate-200/80 text-xs font-semibold">
            <button
              className="px-2.5 py-1 rounded-md bg-white text-rose-600 shadow-xs font-bold transition-all"
              type="button"
            >
              EN
            </button>
            <button
              className="px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 transition-all"
              type="button"
            >
              BN
            </button>
          </div>

          {/* Notification Bell */}
          <button
            className="relative p-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50/80 transition-colors"
            type="button"
            aria-label="Emergency Alerts"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
            </span>
          </button>

          {/* Already have an account link */}
          <div className="hidden sm:flex items-center text-xs text-slate-600 border-l border-slate-200/80 pl-5">
            <span>Already registered?</span>
            <Link
              to="/login"
              className="ml-1.5 font-semibold text-rose-600 hover:text-rose-700 hover:underline"
              id="stitch-topbar-signin"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container (1440px max desktop container matching Stitch) */}
      <main className="w-full max-w-[1440px] px-6 py-8 relative z-10 flex flex-col items-center">
        {/* Header Intro Banner */}
        <div className="w-full max-w-4xl text-center mb-7">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-100/80 border border-rose-200/60 text-rose-700 text-xs font-semibold tracking-wide uppercase mb-3">
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              how_to_reg
            </span>
            Donor &amp; Campus Member Onboarding
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Register with{' '}
            <span className="bg-gradient-to-r from-primary via-ruby to-rose-600 bg-clip-text text-transparent">
              BAUST BloodLink
            </span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-2xl mx-auto">
            Join the verified institutional life-saving network. Fill out your details below to activate
            emergency alerts and donor eligibility.
          </p>
        </div>

        {/* Central Multi-Segment Glassmorphic Form Card */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-4xl bg-white/85 backdrop-blur-xl border border-rose-200/40 rounded-3xl p-7 sm:p-10 shadow-glass-lg flex flex-col gap-9"
        >
          {/* Server Error Alert */}
          {serverError && (
            <div
              className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-sm flex items-start gap-3 animate-fade-in"
              role="alert"
            >
              <span className="material-symbols-outlined text-rose-600 text-[20px] shrink-0 mt-0.5">
                error
              </span>
              <div>
                <strong className="font-semibold">Registration Issue:</strong> {serverError}
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* SECTION 1: BASIC PROFILE */}
          {/* ========================================== */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-600 text-white font-bold text-sm shadow-sm">
                  1
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Basic Profile</h2>
                  <p className="text-xs text-slate-500">Core personal identification and blood group verification</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-100">
                Required Step
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fullName" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Full Name <span className="text-rose-600 font-bold">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[19px] pointer-events-none">
                    person
                  </span>
                  <input
                    type="text"
                    id="fullName"
                    required
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    className={`glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 ${
                      errors.name ? 'border-rose-500 ring-1 ring-rose-500' : ''
                    }`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && <p className="text-[11px] text-rose-600 font-medium mt-0.5">{errors.name}</p>}
              </div>

              {/* Full ID (Strictly 16-character text input with live counter) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="fullId" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    Full ID <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <span
                    id="idCharCounter"
                    className="text-[11px] font-mono font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100"
                  >
                    {form.institutionalId.length} / 16 chars
                  </span>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[19px] pointer-events-none">
                    badge
                  </span>
                  <input
                    type="text"
                    id="fullId"
                    maxLength={16}
                    required
                    value={form.institutionalId}
                    onChange={(e) => update('institutionalId', e.target.value.toUpperCase())}
                    className={`glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm font-mono uppercase tracking-wider text-slate-900 placeholder:text-slate-400 placeholder:normal-case placeholder:tracking-normal font-medium ${
                      errors.institutionalId ? 'border-rose-500 ring-1 ring-rose-500' : ''
                    }`}
                    placeholder="Enter 16-character institutional ID"
                  />
                </div>
                {errors.institutionalId && (
                  <p className="text-[11px] text-rose-600 font-medium mt-0.5">{errors.institutionalId}</p>
                )}
              </div>

              {/* Age (Numerical Stepper) */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ageInput" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Age (Years) <span className="text-rose-600 font-bold">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[19px] pointer-events-none">
                    calendar_today
                  </span>
                  <input
                    type="number"
                    id="ageInput"
                    min="16"
                    max="75"
                    value={form.age}
                    onChange={(e) => update('age', Math.max(16, Math.min(75, Number(e.target.value) || 16)))}
                    required
                    className="glass-input w-full pl-11 pr-24 py-3 rounded-xl text-sm font-semibold text-slate-900"
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => update('age', Math.max(16, form.age - 1))}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all text-xs"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => update('age', Math.min(75, form.age + 1))}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Gender Segmented Toggle: [Male] and [Female] */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Gender <span className="text-rose-600 font-bold">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => update('gender', 'Male')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-xs tracking-wide transition-all ${
                      form.gender === 'Male'
                        ? 'bg-gradient-to-r from-primary to-ruby text-white shadow-sm'
                        : 'bg-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">male</span>
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => update('gender', 'Female')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-xs tracking-wide transition-all ${
                      form.gender === 'Female'
                        ? 'bg-gradient-to-r from-primary to-ruby text-white shadow-sm'
                        : 'bg-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">female</span>
                    Female
                  </button>
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label htmlFor="emailInput" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Institutional or Primary Email <span className="text-rose-600 font-bold">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[19px] pointer-events-none">
                    alternate_email
                  </span>
                  <input
                    type="email"
                    id="emailInput"
                    required
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    className={`glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 ${
                      errors.email ? 'border-rose-500 ring-1 ring-rose-500' : ''
                    }`}
                    placeholder="username@baust.edu.bd"
                  />
                </div>
                {errors.email && <p className="text-[11px] text-rose-600 font-medium mt-0.5">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="regPassword" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Password <span className="text-rose-600 font-bold">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[19px] pointer-events-none">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="regPassword"
                    required
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    className={`glass-input w-full pl-11 pr-11 py-3 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 ${
                      errors.password ? 'border-rose-500 ring-1 ring-rose-500' : ''
                    }`}
                    placeholder="Create strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.password && <p className="text-[11px] text-rose-600 font-medium mt-0.5">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Confirm Password <span className="text-rose-600 font-bold">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[19px] pointer-events-none">
                    lock_reset
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    required
                    value={form.confirmPassword}
                    onChange={(e) => update('confirmPassword', e.target.value)}
                    className={`glass-input w-full pl-11 pr-11 py-3 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 ${
                      errors.confirmPassword ? 'border-rose-500 ring-1 ring-rose-500' : ''
                    }`}
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3.5 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-[11px] text-rose-600 font-medium mt-0.5">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Blood Group Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="bloodGroup" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Blood Group <span className="text-rose-600 font-bold">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-rose-500 text-[19px] pointer-events-none">
                    bloodtype
                  </span>
                  <select
                    id="bloodGroup"
                    required
                    value={form.bloodGroup}
                    onChange={(e) => update('bloodGroup', e.target.value)}
                    className={`glass-input w-full pl-11 pr-10 py-3 rounded-xl text-sm font-semibold text-slate-900 appearance-none bg-white cursor-pointer ${
                      errors.bloodGroup ? 'border-rose-500 ring-1 ring-rose-500' : ''
                    }`}
                  >
                    <option value="" disabled>
                      Select Blood Group
                    </option>
                    <option value="A+">A+ (A Positive)</option>
                    <option value="A-">A- (A Negative)</option>
                    <option value="B+">B+ (B Positive)</option>
                    <option value="B-">B- (B Negative)</option>
                    <option value="AB+">AB+ (AB Positive)</option>
                    <option value="AB-">AB- (AB Negative)</option>
                    <option value="O+">O+ (O Positive)</option>
                    <option value="O-">O- (O Negative)</option>
                    <option value="BOMBAY" className="font-bold text-rose-700">
                      Bombay Phenotype (Rare hh Antigen)
                    </option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3.5 text-slate-400 pointer-events-none text-[20px]">
                    expand_more
                  </span>
                </div>
                {errors.bloodGroup && (
                  <p className="text-[11px] text-rose-600 font-medium mt-0.5">{errors.bloodGroup}</p>
                )}
              </div>

              {/* Confirm Blood Group Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirmBloodGroup" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Confirm Blood Group <span className="text-rose-600 font-bold">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-rose-500 text-[19px] pointer-events-none">
                    verified
                  </span>
                  <select
                    id="confirmBloodGroup"
                    value={form.confirmBloodGroup}
                    onChange={(e) => update('confirmBloodGroup', e.target.value)}
                    className={`glass-input w-full pl-11 pr-10 py-3 rounded-xl text-sm font-semibold text-slate-900 appearance-none bg-white cursor-pointer ${
                      errors.confirmBloodGroup ? 'border-rose-500 ring-1 ring-rose-500' : ''
                    }`}
                  >
                    <option value="">Re-verify Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="BOMBAY">Bombay Phenotype</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3.5 text-slate-400 pointer-events-none text-[20px]">
                    expand_more
                  </span>
                </div>
                {errors.confirmBloodGroup && (
                  <p className="text-[11px] text-rose-600 font-medium mt-0.5">{errors.confirmBloodGroup}</p>
                )}
              </div>
            </div>
          </section>

          {/* ========================================== */}
          {/* SECTION 2: DYNAMIC ROLE TABS */}
          {/* ========================================== */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-600 text-white font-bold text-sm shadow-sm">
                  2
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Institutional Role &amp; Academic Info</h2>
                  <p className="text-xs text-slate-500">Configure role-specific campus credentials</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                Segmented Switcher
              </span>
            </div>

            {/* Segmented Glass Switcher Tabs: Student, Teacher, Staff */}
            <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200/80 shadow-inner">
              <button
                type="button"
                onClick={() => update('userType', 'Student')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm tracking-wide transition-all ${
                  form.userType === 'Student'
                    ? 'bg-white text-rose-600 shadow-sm border border-rose-100 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">school</span>
                Student
              </button>
              <button
                type="button"
                onClick={() => update('userType', 'Teacher')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm tracking-wide transition-all ${
                  form.userType === 'Teacher'
                    ? 'bg-white text-rose-600 shadow-sm border border-rose-100 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">local_library</span>
                Teacher
              </button>
              <button
                type="button"
                onClick={() => update('userType', 'Staff')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm tracking-wide transition-all ${
                  form.userType === 'Staff'
                    ? 'bg-white text-rose-600 shadow-sm border border-rose-100 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">work</span>
                Staff
              </button>
            </div>

            {/* TAB 1: Student Fields */}
            {form.userType === 'Student' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-white/70 border border-rose-100/70 shadow-xs animate-fade-in">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="studentLevel" className="text-xs font-semibold text-slate-700">
                    Level
                  </label>
                  <div className="relative flex items-center">
                    <select
                      id="studentLevel"
                      value={form.studentLevel}
                      onChange={(e) => update('studentLevel', e.target.value)}
                      className="glass-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-900 appearance-none bg-white cursor-pointer"
                    >
                      <option value="Level 1">Level 1</option>
                      <option value="Level 2">Level 2</option>
                      <option value="Level 3">Level 3</option>
                      <option value="Level 4">Level 4</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 text-slate-400 pointer-events-none text-[18px]">
                      expand_more
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="studentTerm" className="text-xs font-semibold text-slate-700">
                    Term
                  </label>
                  <div className="relative flex items-center">
                    <select
                      id="studentTerm"
                      value={form.studentTerm}
                      onChange={(e) => update('studentTerm', e.target.value)}
                      className="glass-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-900 appearance-none bg-white cursor-pointer"
                    >
                      <option value="Term I">Term I</option>
                      <option value="Term II">Term II</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 text-slate-400 pointer-events-none text-[18px]">
                      expand_more
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="studentBatch" className="text-xs font-semibold text-slate-700">
                    Batch
                  </label>
                  <input
                    type="text"
                    id="studentBatch"
                    value={form.studentBatch}
                    onChange={(e) => update('studentBatch', e.target.value)}
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-900"
                    placeholder="e.g. 12th Batch"
                  />
                </div>

                {/* Department strictly limited to the 9 BAUST departments */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="studentDept" className="text-xs font-semibold text-slate-700">
                    Department
                  </label>
                  <div className="relative flex items-center">
                    <select
                      id="studentDept"
                      value={form.studentDept}
                      onChange={(e) => update('studentDept', e.target.value)}
                      className="glass-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 appearance-none bg-white cursor-pointer"
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 text-slate-400 pointer-events-none text-[18px]">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Teacher Fields */}
            {form.userType === 'Teacher' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-white/70 border border-rose-100/70 shadow-xs animate-fade-in">
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Designation</span>
                    <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                      {form.teacherDesignation}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setTeacherDropdownOpen((o) => !o)}
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-900 bg-white flex items-center justify-between cursor-pointer transition-all hover:border-rose-300 shadow-xs"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-rose-500 text-[18px]">badge</span>
                      <span className="font-semibold text-slate-900">{form.teacherDesignation}</span>
                    </span>
                    <span
                      className={`material-symbols-outlined text-slate-400 text-[18px] transition-transform duration-200 ${
                        teacherDropdownOpen ? 'rotate-180' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </button>

                  {teacherDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl bg-white border border-rose-100 shadow-lg p-1.5 flex flex-col gap-1 backdrop-blur-md animate-fade-in">
                      {[
                        { title: 'Lecturer', icon: 'person' },
                        { title: 'Assistant Professor', icon: 'psychology' },
                        { title: 'Associate Professor', icon: 'auto_stories' },
                        { title: 'Professor', icon: 'workspace_premium' },
                      ].map((item) => (
                        <button
                          key={item.title}
                          type="button"
                          onClick={() => {
                            update('teacherDesignation', item.title);
                            setTeacherDropdownOpen(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm transition-all ${
                            form.teacherDesignation === item.title
                              ? 'bg-rose-50 text-rose-700 font-semibold'
                              : 'font-medium text-slate-700 hover:bg-rose-50/60 hover:text-slate-900'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={`material-symbols-outlined text-[17px] ${
                                form.teacherDesignation === item.title ? 'text-rose-600' : 'text-slate-400'
                              }`}
                            >
                              {item.icon}
                            </span>
                            {item.title}
                          </span>
                          {form.teacherDesignation === item.title && (
                            <span className="material-symbols-outlined text-base text-rose-600 font-bold">
                              check
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="teacherDept" className="text-xs font-semibold text-slate-700">
                    Department
                  </label>
                  <div className="relative flex items-center">
                    <select
                      id="teacherDept"
                      value={form.teacherDept}
                      onChange={(e) => update('teacherDept', e.target.value)}
                      className="glass-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 appearance-none bg-white cursor-pointer"
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 text-slate-400 pointer-events-none text-[18px]">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Staff Fields */}
            {form.userType === 'Staff' && (
              <div className="grid grid-cols-1 gap-4 p-5 rounded-2xl bg-white/70 border border-rose-100/70 shadow-xs animate-fade-in">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="staffSector" className="text-xs font-semibold text-slate-700">
                    Working Sector
                  </label>
                  <div className="relative flex items-center">
                    <select
                      id="staffSector"
                      value={form.staffSector}
                      onChange={(e) => update('staffSector', e.target.value)}
                      className="glass-input w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 appearance-none bg-white cursor-pointer"
                    >
                      <option value="Admission Office">Admission Office</option>
                      <option value="Medical Center">Medical Center</option>
                      <option value="Bus / Transport Pool">Bus / Transport Pool</option>
                      <option value="Security Guard">Security Guard</option>
                      <option value="Maintenance / Cleaning">Maintenance / Cleaning</option>
                      <option value="General Admin">General Admin</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 text-slate-400 pointer-events-none text-[18px]">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ========================================== */}
          {/* SECTION 3: DONOR HISTORY & AVAILABILITY */}
          {/* ========================================== */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-600 text-white font-bold text-sm shadow-sm">
                  3
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Donor History &amp; Availability</h2>
                  <p className="text-xs text-slate-500">Track previous donations and clinical safe intervals</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Last Donation Date picker */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="lastDonationDate" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    Last Donation Date
                  </label>
                  <span className="text-[11px] text-slate-400">Leave empty if first-time donor</span>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[19px] pointer-events-none">
                    event
                  </span>
                  <input
                    type="date"
                    id="lastDonationDate"
                    value={form.lastDonationDate}
                    onChange={(e) => update('lastDonationDate', e.target.value)}
                    className="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm font-medium text-slate-900"
                  />
                </div>
              </div>

              {/* Total Bags Donated counter */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="totalBagsDonated" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    Total Bags Donated
                  </label>
                  <span className="text-[11px] text-rose-600 font-semibold">Verified on badge profile</span>
                </div>
                <div className="relative flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => update('totalBagsDonated', Math.max(0, form.totalBagsDonated - 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all text-sm shrink-0"
                  >
                    -
                  </button>
                  <div className="relative flex-1 flex items-center justify-center">
                    <span className="material-symbols-outlined text-rose-500 text-[19px] absolute left-3 pointer-events-none">
                      water_drop
                    </span>
                    <input
                      type="number"
                      id="totalBagsDonated"
                      min="0"
                      max="100"
                      value={form.totalBagsDonated}
                      onChange={(e) => update('totalBagsDonated', Math.max(0, Number(e.target.value) || 0))}
                      className="glass-input w-full py-3 text-center rounded-xl text-sm font-bold text-slate-900"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => update('totalBagsDonated', form.totalBagsDonated + 1)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all text-sm shrink-0"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Volunteer Checkbox */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-white/70 border border-slate-200/80 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDisasterVolunteer}
                onChange={(e) => update('isDisasterVolunteer', e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600 cursor-pointer"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">Disaster Volunteer Emergency Pool</p>
                <p className="text-[11px] text-slate-500">
                  Allow emergency alerts for zero-match crisis escalations at Rangpur &amp; Saidpur hospitals.
                </p>
              </div>
            </label>

            {/* Campus Emergency Consent Notice */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50/60 border border-rose-100 text-slate-700 text-xs leading-relaxed">
              <span
                className="material-symbols-outlined text-rose-600 text-lg shrink-0 mt-0.5"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                emergency
              </span>
              <div>
                <strong className="text-rose-900">Campus Emergency Response Protocol:</strong> By completing
                registration, you authorize BAUST BloodLink verified volunteers to contact you when matching
                patient requests occur within Rangpur / Saidpur regional medical centers.
              </div>
            </div>
          </section>

          {/* ========================================== */}
          {/* ACTIONS & COMPLETE REGISTRATION CTA */}
          {/* ========================================== */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-rose-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="material-symbols-outlined text-emerald-600 text-base">lock</span>
              <span>256-Bit SSL Institutional Encryption</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-10 py-3.5 rounded-xl font-bold text-sm tracking-wide text-white bg-gradient-to-r from-primary via-ruby to-rose-700 hover:from-rose-700 hover:to-primary shadow-lg shadow-rose-600/25 hover:shadow-rose-600/35 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                  <span>Registering Member...</span>
                </>
              ) : (
                <>
                  <span>Complete Registration</span>
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Link Strip */}
        <footer className="mt-8 mb-4 text-center text-xs text-slate-500 flex items-center gap-4">
          <span>© 2025 BAUST BloodLink. All rights reserved.</span>
          <span>•</span>
          <Link to="/helpline" className="hover:text-rose-600 transition-colors">
            Privacy Terms
          </Link>
          <span>•</span>
          <Link to="/helpline" className="hover:text-rose-600 transition-colors">
            24/7 Emergency Line
          </Link>
        </footer>
      </main>
    </div>
  );
}

export default RegisterScreen;
