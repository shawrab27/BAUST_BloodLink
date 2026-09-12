import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LocationPicker from '../../components/common/LocationPicker';

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

const PATIENT_TYPES = ['Student', 'Teacher', 'Staff', 'Civilian'];

const HOSPITALS = [
  { id: 'CMH Saidpur Cantonment', name: 'CMH Saidpur Cantonment' },
  { id: 'BAUST Campus Medical Center', name: 'BAUST Campus Medical Center' },
  { id: 'Rangpur Medical College Hospital (RMCH)', name: 'Rangpur Medical College Hospital (RMCH)' },
  { id: 'Prime Medical College Hospital, Pirgachha', name: 'Prime Medical College Hospital' },
  { id: 'Saidpur Upazila Health Complex', name: 'Saidpur Upazila Health Complex' },
  { id: 'Other Regional Clinic', name: 'Other Regional Clinic / Facility' },
];

/**
 * RequestBloodScreen — Blood Requisition Wizard
 * Spec aligned:
 * - Locked binary condition: Normal | Emergency (checked by Phase 4 Emergency SOS)
 * - Required patientType: Student | Teacher | Staff | Civilian
 * - 10-second idempotency protection
 */
function RequestBloodScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Form State
  const [condition, setCondition] = useState(searchParams.get('condition') === 'Emergency' ? 'Emergency' : 'Normal');
  const [patientType, setPatientType] = useState('Student');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [bloodGroup, setBloodGroup] = useState(searchParams.get('bloodGroup') || 'O+');
  const [units, setUnits] = useState(1);
  const [hospital, setHospital] = useState('CMH Saidpur Cantonment');
  const [hospitalCoordinates, setHospitalCoordinates] = useState({
    lat: 25.7766,
    lng: 88.8912,
    address: 'CMH Saidpur Cantonment',
  });
  const [hospitalBed, setHospitalBed] = useState('');
  const [reqDate, setReqDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [reqTime, setReqTime] = useState('14:30');
  const [contactName, setContactName] = useState(user?.name || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [clinicalNotes, setClinicalNotes] = useState('');

  // Target donor pre-fill notice
  const targetDonorName = searchParams.get('donorName');

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (user) {
      if (!contactName) setContactName(user.name || '');
      if (!contactPhone) setContactPhone(user.phone || '');
    }
  }, [user, contactName, contactPhone]);

  const adjustUnits = (delta) => {
    setUnits((prev) => Math.max(1, Math.min(20, prev + delta)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessData(null);

    if (!patientName.trim()) {
      setErrorMsg('Please enter the patient name or case identifier.');
      return;
    }
    if (!patientType) {
      setErrorMsg('Please select a patient type.');
      return;
    }
    if (!contactName.trim() || !contactPhone.trim()) {
      setErrorMsg('Contact name and telephone number are required.');
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
          patientType,
          patientAge: patientAge ? Number(patientAge) : null,
          bloodGroup,
          units: Number(units),
          condition,
          hospital,
          hospitalAddress: hospitalCoordinates.address || hospital,
          hospitalCoordinates: {
            lat: hospitalCoordinates.lat,
            lng: hospitalCoordinates.lng,
          },
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
    <div className="page-wrapper max-w-[840px] mx-auto pb-16">
      {/* Header Banner */}
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

        <h1 className="text-[28px] font-black text-on-surface tracking-tight leading-tight flex items-center gap-2.5">
          <span
            className="material-symbols-outlined text-[28px] text-primary"
            style={{ fontVariationSettings: '"FILL" 1' }}
          >
            add_box
          </span>
          Blood Requisition Form
        </h1>
        <p className="text-on-surface-variant text-[14px] mt-1">
          Submit an authorized institutional blood request. Compatible donors will receive notifications.
        </p>

        {targetDonorName && (
          <div className="mt-3 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-2 text-xs text-on-surface">
            <span className="material-symbols-outlined text-primary text-[18px]">person_check</span>
            <span>
              Directing request toward verified donor <strong className="text-primary">{targetDonorName}</strong> ({bloodGroup})
            </span>
          </div>
        )}
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

          <h2 className="text-[24px] font-extrabold text-on-surface">Requisition Dispatched!</h2>
          <p className="text-on-surface-variant text-sm max-w-[500px] mx-auto leading-relaxed">
            Requisition for <strong className="text-primary font-bold">{successData.units} Bag(s) of {successData.bloodGroup}</strong> ({successData.condition}) for patient <strong className="text-on-surface">{successData.patientName}</strong> is now live.
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

          {/* SECTION 1: Condition & Patient Overview */}
          <div className="bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 mb-1">
              <span className="w-7 h-7 rounded-full bg-primary text-white font-black text-xs flex items-center justify-center shadow-sm">
                1
              </span>
              <h2 className="font-bold text-on-surface text-[17px]">Condition &amp; Patient Information</h2>
            </div>

            {/* Binary Condition Selector: Normal vs Emergency */}
            <div>
              <label className="input-label">Condition *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCondition('Normal')}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                    condition === 'Normal'
                      ? 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20'
                      : 'border-outline-variant/30 bg-surface-container-low/40 hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[22px] text-on-surface-variant">
                      check_circle
                    </span>
                    <div>
                      <span className="font-bold text-on-surface text-sm block">Normal</span>
                      <span className="text-[11px] text-on-surface-variant">Scheduled or routine requirement</span>
                    </div>
                  </div>
                  <span
                    className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      condition === 'Normal' ? 'border-primary' : 'border-outline-variant'
                    }`}
                  >
                    {condition === 'Normal' && <span className="w-2 h-2 rounded-full bg-primary" />}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCondition('Emergency')}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                    condition === 'Emergency'
                      ? 'border-primary bg-primary/10 shadow-sm ring-2 ring-primary/30'
                      : 'border-outline-variant/30 bg-surface-container-low/40 hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="material-symbols-outlined text-[22px] text-primary"
                      style={{ fontVariationSettings: '"FILL" 1' }}
                    >
                      e911_emergency
                    </span>
                    <div>
                      <span className="font-extrabold text-primary text-sm block">Emergency</span>
                      <span className="text-[11px] text-on-surface-variant">Critical/STAT transfusion need</span>
                    </div>
                  </div>
                  <span
                    className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      condition === 'Emergency' ? 'border-primary' : 'border-outline-variant'
                    }`}
                  >
                    {condition === 'Emergency' && <span className="w-2 h-2 rounded-full bg-primary" />}
                  </span>
                </button>
              </div>
            </div>

            {/* Patient Type, Name & Age Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="input-label" htmlFor="patient-type-select">
                  Patient Type *
                </label>
                <div className="relative">
                  <select
                    id="patient-type-select"
                    required
                    value={patientType}
                    onChange={(e) => setPatientType(e.target.value)}
                    className="input-field appearance-none cursor-pointer"
                  >
                    {PATIENT_TYPES.map((pt) => (
                      <option key={pt} value={pt}>
                        {pt}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                    expand_more
                  </span>
                </div>
              </div>

              <div>
                <label className="input-label" htmlFor="patient-name-input">
                  Patient Name *
                </label>
                <input
                  type="text"
                  id="patient-name-input"
                  required
                  placeholder="e.g., Md. Karim Uddin"
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
                Diagnosis / Reason for Transfusion
              </label>
              <input
                type="text"
                id="diagnosis-input"
                placeholder="e.g., Post-operative blood loss, Dengue, Anemia"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* SECTION 2: Blood Type & Quantity */}
          <div className="bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 mb-1">
              <span className="w-7 h-7 rounded-full bg-primary text-white font-black text-xs flex items-center justify-center shadow-sm">
                2
              </span>
              <h2 className="font-bold text-on-surface text-[17px]">Blood Group &amp; Units</h2>
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

            {/* Units Stepper */}
            <div className="p-4 rounded-xl bg-surface-container-low/70 border border-outline-variant/30 flex items-center justify-between">
              <div>
                <span className="block font-bold text-on-surface text-sm">Number of Units (Bags) Required *</span>
                <span className="text-xs text-on-surface-variant font-medium">
                  {units} {units === 1 ? 'Bag' : 'Bags'} standard volume
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
          </div>

          {/* SECTION 3: Hospital & Required Date/Time */}
          <div className="bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 mb-1">
              <span className="w-7 h-7 rounded-full bg-primary text-white font-black text-xs flex items-center justify-center shadow-sm">
                3
              </span>
              <h2 className="font-bold text-on-surface text-[17px]">Hospital Location &amp; Timeline</h2>
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
                        {h.name}
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
                  Ward / Bed / Room Identifier
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                    bed
                  </span>
                  <input
                    type="text"
                    id="ward-bed-input"
                    placeholder="e.g., ICU Bed 04 / Ward 3B"
                    value={hospitalBed}
                    onChange={(e) => setHospitalBed(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Live Location Picker via react-leaflet (OpenStreetMap) */}
            <div className="pt-1">
              <label className="input-label mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold text-on-surface">
                  <span className="material-symbols-outlined text-[16px] text-primary">map</span>
                  Pinpoint Facility Location (OpenStreetMap)
                </span>
                <span className="text-[11px] font-medium text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                  react-leaflet · Zero Google API Keys
                </span>
              </label>
              <LocationPicker
                value={hospitalCoordinates}
                onChange={(loc) => {
                  setHospitalCoordinates(loc);
                  if (loc.address && !loc.address.startsWith('GeoPoint')) {
                    setHospital(loc.address);
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="input-label" htmlFor="req-date-input">
                  Required Date *
                </label>
                <input
                  type="date"
                  id="req-date-input"
                  required
                  value={reqDate}
                  onChange={(e) => setReqDate(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label" htmlFor="req-time-input">
                  Required Time *
                </label>
                <input
                  type="time"
                  id="req-time-input"
                  required
                  value={reqTime}
                  onChange={(e) => setReqTime(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: Contact Information & Notes */}
          <div className="bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 mb-1">
              <span className="w-7 h-7 rounded-full bg-primary text-white font-black text-xs flex items-center justify-center shadow-sm">
                4
              </span>
              <h2 className="font-bold text-on-surface text-[17px]">Contact Person &amp; Additional Notes</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label" htmlFor="contact-name-input">
                  Contact Person Name *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                    person
                  </span>
                  <input
                    type="text"
                    id="contact-name-input"
                    required
                    placeholder="e.g., Major Tanvir Ahmed"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="input-label" htmlFor="contact-phone-input">
                  Contact Phone Number *
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
                Additional Notes (Optional)
              </label>
              <textarea
                id="clinical-notes-input"
                rows={3}
                placeholder="Any special instructions, cross-matching requirements, or patient condition notes..."
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
              <span>Cancel</span>
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              id="submit-requisition-btn"
              className="w-full sm:w-auto px-8 py-3 rounded-xl text-white font-extrabold text-base shadow-lg flex items-center justify-center gap-2.5 transition-all active:scale-95 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, rgb(225, 29, 72) 0%, rgb(184, 0, 53) 100%)',
                boxShadow: '0 8px 24px rgba(184, 0, 53, 0.35)',
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">send</span>
                  <span>Submit Requisition</span>
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
