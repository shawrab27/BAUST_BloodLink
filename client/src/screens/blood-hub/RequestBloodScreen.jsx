import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const BLOOD_GROUPS = [
  { id: 'A+', label: 'A+', sub: 'Pos' },
  { id: 'A-', label: 'A-', sub: 'Neg' },
  { id: 'B+', label: 'B+', sub: 'Pos' },
  { id: 'B-', label: 'B-', sub: 'Neg' },
  { id: 'AB+', label: 'AB+', sub: 'Pos' },
  { id: 'AB-', label: 'AB-', sub: 'Neg' },
  { id: 'O+', label: 'O+', sub: 'Universal' },
  { id: 'O-', label: 'O-', sub: 'Neg' },
  { id: 'BOMBAY', label: 'Bombay', sub: 'hh Rare' },
];

const COMPONENT_TYPES = [
  { id: 'whole_blood', label: 'Whole Blood (Standard 450ml)' },
  { id: 'packed_rbc', label: 'Packed Red Blood Cells (PRBC)' },
  { id: 'platelets', label: 'Platelet Concentrate (Random Donor)' },
  { id: 'single_platelet', label: 'Single Donor Platelets (Apheresis)' },
  { id: 'ffp', label: 'Fresh Frozen Plasma (FFP)' },
];

const HOSPITALS = [
  { id: 'CMH Saidpur Cantonment', name: 'CMH Saidpur Cantonment (Authorized Partner)', dist: '2.4 km from BAUST' },
  { id: 'BAUST Campus Medical Center', name: 'BAUST Campus Medical Center', dist: 'On Campus' },
  { id: 'Rangpur Medical College Hospital (RMCH)', name: 'Rangpur Medical College Hospital (RMCH)', dist: '38 km' },
  { id: 'Prime Medical College Hospital, Pirgachha', name: 'Prime Medical College Hospital', dist: '42 km' },
  { id: 'Saidpur Upazila Health Complex', name: 'Saidpur Upazila Health Complex', dist: '3.1 km' },
  { id: 'Other Regional Clinic', name: 'Other Regional Clinic / Facility', dist: 'Regional' },
];

/**
 * RequestBloodScreen — Phase 3 Blood Requisition Wizard
 * Matches Stitch Screen: "BAUST BloodLink - High-Contrast Blood Request Form"
 */
function RequestBloodScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Form State
  const [urgency, setUrgency] = useState('Critical');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [bloodGroup, setBloodGroup] = useState(searchParams.get('bloodGroup') || 'O+');
  const [units, setUnits] = useState(2);
  const [componentType, setComponentType] = useState('whole_blood');
  const [hospital, setHospital] = useState('CMH Saidpur Cantonment');
  const [hospitalBed, setHospitalBed] = useState('');
  const [reqDate, setReqDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [reqTime, setReqTime] = useState('14:30');
  const [contactName, setContactName] = useState(user?.name || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [clinicalNotes, setClinicalNotes] = useState('');

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Auto-fill phone & name when user loads
  useEffect(() => {
    if (user) {
      if (!contactName) setContactName(user.name || '');
      if (!contactPhone) setContactPhone(user.phone || '');
    }
  }, [user, contactName, contactPhone]);

  const adjustUnits = (delta) => {
    setUnits((prev) => Math.max(1, Math.min(20, prev + delta)));
  };

  const setUrgencyPreset = (preset) => {
    const now = new Date();
    if (preset === 'stat') {
      setUrgency('Critical');
      setReqDate(now.toISOString().split('T')[0]);
      setReqTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    } else if (preset === '4h') {
      setUrgency('Urgent');
      const later = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      setReqDate(later.toISOString().split('T')[0]);
      setReqTime(`${String(later.getHours()).padStart(2, '0')}:${String(later.getMinutes()).padStart(2, '0')}`);
    } else {
      setUrgency('Scheduled');
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      setReqDate(tomorrow.toISOString().split('T')[0]);
      setReqTime('10:00');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessData(null);

    if (!patientName.trim()) {
      setErrorMsg('Please enter the patient name or case identifier.');
      return;
    }
    if (!contactName.trim() || !contactPhone.trim()) {
      setErrorMsg('Contact name and telephone number are required for coordination.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMsg('You must be logged in to submit an official blood requisition.');
      return;
    }

    setIsSubmitting(true);

    try {
      const requiredDateTime = new Date(`${reqDate}T${reqTime}:00`);

      const res = await fetch('/api/blood-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientName: patientName.trim(),
          patientAge: patientAge ? Number(patientAge) : null,
          bloodGroup,
          units: Number(units),
          componentType,
          urgency,
          hospital,
          hospitalBed: hospitalBed.trim(),
          contactName: contactName.trim(),
          contactPhone: contactPhone.trim(),
          requiredDate: requiredDateTime.toISOString(),
          diagnosis: diagnosis.trim(),
          clinicalNotes: clinicalNotes.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.code === 'IDEMPOTENCY_REJECTION') {
          throw new Error(
            'Duplicate submission detected! An identical requisition was submitted within the last 10 seconds.'
          );
        }
        if (data.errors && Array.isArray(data.errors)) {
          throw new Error(data.errors.map((err) => err.message).join('. '));
        }
        throw new Error(data.message || 'Failed to submit requisition.');
      }

      setSuccessData(data.bloodRequest);
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred while submitting your requisition.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper max-w-[960px] mx-auto pb-16">
      {/* 1. Header Banner */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Link
            to="/blood-hub"
            className="inline-flex items-center text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Return to Blood Hub</span>
          </Link>
          <span className="text-on-surface-variant text-xs">•</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            10s Idempotency Shield Active
          </span>
        </div>

        <h1 className="text-[30px] font-black text-on-surface tracking-tight leading-tight flex items-center gap-2.5">
          <span
            className="material-symbols-outlined text-[30px] text-primary"
            style={{ fontVariationSettings: '"FILL" 1' }}
          >
            add_box
          </span>
          Blood Requisition Form
        </h1>
        <p className="text-on-surface-variant text-[14px] mt-1">
          Dispatch an authorized clinical transfusion request. Compatible campus donors receive immediate automated mobilization notices.
        </p>
      </div>

      {/* Success View */}
      {successData ? (
        <div className="bg-surface-container-lowest rounded-2xl p-8 border border-primary/30 shadow-xl text-center animate-fade-in space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
            <span
              className="material-symbols-outlined text-[36px]"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              check_circle
            </span>
          </div>

          <h2 className="text-[24px] font-extrabold text-on-surface">Requisition Dispatched Successfully!</h2>
          <p className="text-on-surface-variant text-sm max-w-[540px] mx-auto leading-relaxed">
            Requisition <strong className="text-on-surface">#{successData._id?.slice(-6).toUpperCase()}</strong> for{' '}
            <strong className="text-primary font-bold">
              {successData.units} Unit(s) of {successData.bloodGroup}
            </strong>{' '}
            at <strong className="text-on-surface">{successData.hospital}</strong> is now live across the campus network.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/blood-hub')}
              className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:brightness-105 active:scale-95 transition-all"
            >
              View in Active Requests
            </button>
            <button
              onClick={() => {
                setSuccessData(null);
                setPatientName('');
                setDiagnosis('');
              }}
              className="px-6 py-2.5 rounded-xl border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container transition-all"
            >
              Submit Another Requisition
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-sm font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SECTION 1: Urgency & Patient Overview */}
          <div className="bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-7 h-7 rounded-full bg-primary text-white font-black text-xs flex items-center justify-center shadow-sm">
                1
              </span>
              <h2 className="font-bold text-on-surface text-[17px]">Urgency Classification &amp; Patient Overview</h2>
            </div>

            {/* Urgency Radio Grid */}
            <div>
              <label className="input-label">Select Urgency Level *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'Critical',
                    label: 'Immediate / STAT',
                    desc: 'Emergency trauma or ICU',
                    icon: 'e911_emergency',
                    color: 'text-primary',
                  },
                  {
                    id: 'Urgent',
                    label: 'Urgent Clinical',
                    desc: 'Needed within 4 to 8 hours',
                    icon: 'warning',
                    color: 'text-rose-500',
                  },
                  {
                    id: 'Scheduled',
                    label: 'Scheduled Procedure',
                    desc: 'Planned elective surgery',
                    icon: 'event_available',
                    color: 'text-outline',
                  },
                ].map((u) => {
                  const isSelected = urgency === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setUrgency(u.id)}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20'
                          : 'border-outline-variant/30 bg-surface-container-low/40 hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`material-symbols-outlined text-[20px] ${u.color}`}>{u.icon}</span>
                        <span
                          className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-primary' : 'border-outline-variant'
                          }`}
                        >
                          {isSelected && <span className="w-2 h-2 rounded-full bg-primary" />}
                        </span>
                      </div>
                      <span className="font-bold text-on-surface text-sm">{u.label}</span>
                      <span className="text-[11px] text-on-surface-variant mt-0.5">{u.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Patient Name & Age Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="sm:col-span-2">
                <label className="input-label" htmlFor="patient-name-input">
                  Patient Name or Clinical Case Title *
                </label>
                <input
                  type="text"
                  id="patient-name-input"
                  required
                  placeholder="e.g., Patient #B702 / Md. Ashraful Islam"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label" htmlFor="patient-age-input">
                  Patient Age (Optional)
                </label>
                <input
                  type="number"
                  id="patient-age-input"
                  placeholder="e.g., 28"
                  min="0"
                  max="120"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="input-label" htmlFor="diagnosis-input">
                Clinical Diagnosis / Medical Reason
              </label>
              <input
                type="text"
                id="diagnosis-input"
                placeholder="e.g., Emergency C-section, Road traffic trauma, Dengue NS1 / Thrombocytopenia"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* SECTION 2: Blood Group, Units & Component */}
          <div className="bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-7 h-7 rounded-full bg-primary text-white font-black text-xs flex items-center justify-center shadow-sm">
                2
              </span>
              <h2 className="font-bold text-on-surface text-[17px]">Blood Type &amp; Volume Requisition</h2>
            </div>

            {/* Blood Group Grid */}
            <div>
              <label className="input-label">Required Blood Group *</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                {BLOOD_GROUPS.map((bg) => {
                  const isSelected = bloodGroup === bg.id;
                  return (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => setBloodGroup(bg.id)}
                      className={`py-3 px-1 rounded-xl flex flex-col items-center justify-center transition-all border-2 ${
                        isSelected
                          ? 'bg-primary text-white border-primary shadow-md scale-105 font-black ring-2 ring-primary/30'
                          : 'bg-surface-container-low border-outline-variant/30 text-on-surface font-bold hover:border-primary/40'
                      }`}
                    >
                      <span className="text-[16px] leading-tight">{bg.label}</span>
                      <span
                        className={`text-[10px] font-semibold mt-0.5 ${
                          isSelected ? 'text-white/80' : 'text-on-surface-variant'
                        }`}
                      >
                        {bg.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Volume Stepper & Component Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Stepper */}
              <div className="p-4 rounded-xl bg-surface-container-low/70 border border-outline-variant/30 flex items-center justify-between">
                <div>
                  <span className="block font-bold text-on-surface text-sm">Units (Bags) Needed</span>
                  <span className="text-xs text-on-surface-variant font-medium">
                    Approx. {units * 450}ml Total Volume
                  </span>
                </div>

                <div className="flex items-center gap-3 bg-surface-container-lowest px-2 py-1 rounded-xl border border-outline-variant/30">
                  <button
                    type="button"
                    onClick={() => adjustUnits(-1)}
                    className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-bold flex items-center justify-center transition-colors active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">remove</span>
                  </button>

                  <div className="text-center min-w-[50px]">
                    <span className="text-lg font-black text-primary leading-none block">{units}</span>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">
                      {units === 1 ? 'Bag' : 'Bags'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => adjustUnits(1)}
                    className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-bold flex items-center justify-center transition-colors active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>
              </div>

              {/* Component Dropdown */}
              <div className="p-4 rounded-xl bg-surface-container-low/70 border border-outline-variant/30 flex flex-col justify-center">
                <label className="font-bold text-on-surface text-sm mb-1.5" htmlFor="comp-type-select">
                  Component Preparation
                </label>
                <div className="relative">
                  <select
                    id="comp-type-select"
                    value={componentType}
                    onChange={(e) => setComponentType(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface font-medium rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary appearance-none cursor-pointer"
                  >
                    {COMPONENT_TYPES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant">
                    unfold_more
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Hospital Destination & Timeline */}
          <div className="bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-7 h-7 rounded-full bg-primary text-white font-black text-xs flex items-center justify-center shadow-sm">
                3
              </span>
              <h2 className="font-bold text-on-surface text-[17px]">Hospital Destination &amp; Timing</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label" htmlFor="hospital-select">
                  Hospital / Clinical Facility *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-primary">
                    local_hospital
                  </span>
                  <select
                    id="hospital-select"
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                    className="input-field pl-10 appearance-none cursor-pointer"
                  >
                    {HOSPITALS.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.dist})
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                    expand_more
                  </span>
                </div>
              </div>

              <div>
                <label className="input-label" htmlFor="ward-bed-input">
                  Ward / Bed / Unit Identifier
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                    bed
                  </span>
                  <input
                    type="text"
                    id="ward-bed-input"
                    placeholder="e.g., ICU Bed 04 / Surgical Ward 3B"
                    value={hospitalBed}
                    onChange={(e) => setHospitalBed(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Date & Time Picker with Quick Presets */}
            <div className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="font-bold text-on-surface text-sm flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-primary">access_time</span>
                  <span>Required Delivery Timeline *</span>
                </label>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setUrgencyPreset('stat')}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary text-white shadow-sm hover:brightness-105"
                  >
                    Immediate STAT
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgencyPreset('4h')}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-surface-container text-on-surface hover:bg-surface-container-high"
                  >
                    Within 4h
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgencyPreset('scheduled')}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-surface-container text-on-surface hover:bg-surface-container-high"
                  >
                    Tomorrow
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="date"
                  required
                  value={reqDate}
                  onChange={(e) => setReqDate(e.target.value)}
                  className="input-field"
                />
                <input
                  type="time"
                  required
                  value={reqTime}
                  onChange={(e) => setReqTime(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: Live Coordinates & Telemetry */}
          <div className="bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-5 border border-outline-variant/30 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary text-white font-black text-xs flex items-center justify-center shadow-sm">
                  4
                </span>
                <h3 className="font-bold text-on-surface text-[15px]">Cantonment Node Telemetry</h3>
              </div>
              <span className="text-[11px] font-bold text-primary flex items-center gap-1 bg-primary/10 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                Saidpur Sector Node Active
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-low text-xs space-y-1.5 border border-outline-variant/20">
              <div className="flex items-center justify-between text-on-surface font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">pin_drop</span>
                  <span>{hospital}</span>
                </span>
                <span className="text-primary font-bold">Node Distance: ~2.4 km</span>
              </div>
              <div className="text-on-surface-variant flex items-center justify-between">
                <span>GPS Coordinates: Lat 25.7781° N, Long 88.8974° E (Accuracy ±5m)</span>
                <span>Assigned Gate: Emergency Trauma Gate 2</span>
              </div>
            </div>
          </div>

          {/* SECTION 5: Attendant Contacts & Clinical Remarks */}
          <div className="bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-7 h-7 rounded-full bg-primary text-white font-black text-xs flex items-center justify-center shadow-sm">
                5
              </span>
              <h2 className="font-bold text-on-surface text-[17px]">Attendant Contacts &amp; Clinical Notes</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label" htmlFor="contact-name-input">
                  Primary Attendant / Coordinator Name *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                    person
                  </span>
                  <input
                    type="text"
                    id="contact-name-input"
                    required
                    placeholder="e.g., Major Tanvir Ahmed / Md. Rafiqul"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="input-label" htmlFor="contact-phone-input">
                  Hotline Telephone Number *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-primary">
                    call
                  </span>
                  <input
                    type="tel"
                    id="contact-phone-input"
                    required
                    placeholder="+880 1712-345678"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="input-field pl-10 font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="input-label" htmlFor="clinical-notes-input">
                Additional Surgical / Cross-Matching Instructions (Optional)
              </label>
              <textarea
                id="clinical-notes-input"
                rows={3}
                placeholder="e.g., Cross-matching sample is ready in CMH Pathology Lab; immediate donor mobilization requested."
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                className="input-field resize-none"
              />
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <Link
              to="/blood-hub"
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Cancel &amp; Return</span>
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              id="submit-requisition-btn"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-white font-extrabold text-base shadow-xl flex items-center justify-center gap-2.5 transition-all active:scale-95 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, rgb(225, 29, 72) 0%, rgb(184, 0, 53) 100%)',
                boxShadow: '0 8px 24px rgba(184, 0, 53, 0.35)',
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Submitting Requisition...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">send</span>
                  <span>Dispatch Requisition</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default RequestBloodScreen;
