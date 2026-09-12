import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * EmergencySosScreen — Emergency SOS Cockpit
 * Matches Stitch Screen: "BAUST BloodLink - Emergency Section / SOS Cockpit"
 * (projects/4526335937223431863/screens/ea580edd1e2141f7b62ff131c65e4931)
 *
 * Capabilities:
 * - Instant intra-campus emergency matching on condition: 'Emergency'
 * - State A: Real-time matched donor stream with ETA and direct call action
 * - State B: Zero-match Level 3 Escalation to disaster volunteer reserve & BAUST Medical Center hotline
 * - Lower Panel: Active Campus SOS Live Tracker with 7-second polling
 */
function EmergencySosScreen() {
  const { user } = useAuth();

  // Form inputs
  const [formData, setFormData] = useState({
    bloodGroup: 'O-',
    units: 2,
    hospital: 'Saidpur CMH (Combined Military Hospital)',
    hospitalBed: 'Trauma ICU / Ward 4',
    patientName: '',
    patientType: 'Student',
    contactPhone: user?.phone || '+8801769660000',
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Active SOS dispatch state: null, 'MATCHED', or 'ESCALATED'
  const [activeSosState, setActiveSosState] = useState(null);
  const [sosResult, setSosResult] = useState(null);

  // Active tracker list and stats (7s polling)
  const [activeEmergencies, setActiveEmergencies] = useState([
    {
      _id: 'SOS-2025-901',
      patientName: 'Patient #B702 • Road Trauma',
      diagnosis: 'Emergency Surgery Candidate',
      bloodGroup: 'O-',
      units: 2,
      hospital: 'Saidpur CMH (Trauma ICU)',
      hospitalBed: 'Cantonment Ward 4',
      status: 'Matching',
      elapsedSeconds: 868,
      statusLabel: 'Donor En Route (Tanvir H.)',
      statusType: 'en_route',
    },
    {
      _id: 'SOS-2025-884',
      patientName: 'Student #ST-991 • Acute Anemia',
      diagnosis: 'BAUST Hall Resident',
      bloodGroup: 'BOMBAY',
      units: 1,
      hospital: 'BAUST Medical Center',
      hospitalBed: 'Triage Room 102',
      status: 'Matching',
      elapsedSeconds: 2172,
      statusLabel: 'Escalated to Regional Banks',
      statusType: 'escalated',
    },
    {
      _id: 'SOS-2025-790',
      patientName: 'Patient #N304 • Orthopedic Fixation',
      diagnosis: 'Faculty Family Member',
      bloodGroup: 'AB-',
      units: 2,
      hospital: 'Rangpur Medical College (RpMCH)',
      hospitalBed: 'Hematology Wing',
      status: 'Matching',
      elapsedSeconds: 3900,
      statusLabel: 'Matching Completed (2 Ready)',
      statusType: 'completed',
    },
  ]);

  const [stats, setStats] = useState({
    node: 'Saidpur & Rangpur Cantonment Live SOS Node',
    responseLatency: '42s',
    averageArrivalMinutes: '14–22 Mins',
    activeEmergencies: 3,
    disasterVolunteersCount: 28,
  });

  const [filterText, setFilterText] = useState('');
  const [syncing, setSyncing] = useState(false);

  // 7-second polling fetcher
  const fetchLiveData = useCallback(async () => {
    try {
      setSyncing(true);
      const [activeRes, statsRes] = await Promise.all([
        fetch('/api/emergency/active').catch(() => null),
        fetch('/api/emergency/stats').catch(() => null),
      ]);

      if (activeRes && activeRes.ok) {
        const activeData = await activeRes.json();
        if (activeData.activeRequests && activeData.activeRequests.length > 0) {
          const mapped = activeData.activeRequests.map((req) => {
            const elapsed = Math.floor((Date.now() - new Date(req.createdAt).getTime()) / 1000);
            return {
              _id: req._id,
              patientName: req.patientName,
              diagnosis: req.diagnosis,
              bloodGroup: req.bloodGroup,
              units: req.units,
              hospital: req.hospital,
              hospitalBed: req.hospitalBed,
              status: req.status,
              elapsedSeconds: elapsed > 0 ? elapsed : 10,
              statusLabel: req.status === 'Pending' ? 'Searching Donors' : 'Matching Live',
              statusType: 'en_route',
            };
          });
          setActiveEmergencies((prev) => {
            const existingIds = new Set(mapped.map((m) => m._id));
            const retainedDefaults = prev.filter((p) => !existingIds.has(p._id));
            return [...mapped, ...retainedDefaults];
          });
        }
      }

      if (statsRes && statsRes.ok) {
        const statsData = await statsRes.json();
        setStats((prev) => ({ ...prev, ...statsData }));
      }
    } catch (err) {
      console.warn('[SOS Poller] Polling fallback active:', err.message);
    } finally {
      setSyncing(false);
    }
  }, []);

  // Set up 7-second interval timer
  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 7000);
    return () => clearInterval(interval);
  }, [fetchLiveData]);

  // Live timer tick for elapsed seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveEmergencies((prev) =>
        prev.map((item) => ({
          ...item,
          elapsedSeconds: (item.elapsedSeconds || 0) + 1,
        }))
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsedTime = (seconds) => {
    if (!seconds || seconds <= 0) return '< 1m';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m ${secs}s`;
  };

  const handleTriggerSos = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/emergency/sos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          bloodGroup: formData.bloodGroup,
          units: Number(formData.units),
          hospital: formData.hospital,
          hospitalBed: formData.hospitalBed,
          patientName: formData.patientName || 'Emergency STAT Patient',
          patientType: formData.patientType,
          contactPhone: formData.contactPhone,
          description: formData.description || 'Emergency Transfusion Need',
          condition: 'Emergency',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.errors?.join(', ') || 'Failed to dispatch SOS alert');
      }

      setActiveSosState(data.state); // 'MATCHED' or 'ESCALATED'
      setSosResult(data);

      // Trigger immediate refresh of tracker
      fetchLiveData();
    } catch (err) {
      setSubmitError(err.message || 'Network error triggering emergency alert');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered active emergencies
  const filteredEmergencies = activeEmergencies.filter((item) => {
    if (!filterText.trim()) return true;
    const term = filterText.toLowerCase();
    return (
      item.patientName?.toLowerCase().includes(term) ||
      item.hospital?.toLowerCase().includes(term) ||
      item.bloodGroup?.toLowerCase().includes(term) ||
      item._id?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="page-wrapper max-w-[1380px] mx-auto space-y-7 pb-12">
      {/* Top Breadcrumb & Latency Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="hover:text-slate-900 cursor-pointer">Portal Home</span>
          <span className="material-symbols-outlined text-[14px] text-slate-300">chevron_right</span>
          <span className="hover:text-slate-900 cursor-pointer">Rapid Response</span>
          <span className="material-symbols-outlined text-[14px] text-slate-300">chevron_right</span>
          <span className="text-primary font-bold bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
            SOS Cockpit
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            Response Latency: <span className="font-mono font-bold text-on-surface">{stats.responseLatency}</span>
          </span>
          <span className="text-xs text-on-surface-variant font-medium hidden md:inline">
            7s Live Polling Active
          </span>
        </div>
      </div>

      {/* SECTION 1: EMERGENCY SOS COMMAND HEADER & INSTANT CAMPUS TRIGGER */}
      <div
        className="rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-primary/30"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 241, 242, 0.92) 100%)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Subtle Red Ambient Glow In Corner */}
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center text-lg shadow-md shadow-primary/30">
                  <span className="material-symbols-outlined text-[24px]">tower_broadcast</span>
                </span>
                <h1 className="text-[26px] font-extrabold text-on-surface tracking-tight">
                  Emergency SOS Cockpit
                </h1>
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-primary text-white shadow-sm">
                  STAT Priority
                </span>
              </div>
              <p className="text-[14px] font-medium text-on-surface-variant mt-1.5 pl-0 sm:pl-13">
                Instant Intra-Campus Emergency Matching &amp; Medical Escalation for critical transfusion requisitions.
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs font-bold text-outline uppercase tracking-wider">
                {stats.node}
              </div>
              <div className="text-xs text-primary font-bold mt-1">
                Average Arrival: <span className="font-mono">{stats.averageArrivalMinutes}</span>
              </div>
            </div>
          </div>

          {/* Quick SOS Configuration Form Strip */}
          <form onSubmit={handleTriggerSos} className="mt-6 pt-5 border-t border-primary/15">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
              {/* Blood Group Selector */}
              <div className="lg:col-span-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface mb-1.5 flex items-center justify-between">
                  <span>Required Group</span>
                  <span className="text-[10px] text-primary font-bold">Includes Rare</span>
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-surface-container-lowest border-2 border-primary/25 rounded-xl px-3.5 py-2.5 text-[14px] font-bold text-on-surface focus:outline-none focus:border-primary shadow-sm appearance-none cursor-pointer"
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    id="sos-bloodgroup"
                  >
                    <option value="O-">O- (O Negative) — Universal Critical</option>
                    <option value="BOMBAY">Bombay Phenotype (hh) — Ultra Rare</option>
                    <option value="AB-">AB- (AB Negative) — Rare</option>
                    <option value="A-">A- (A Negative)</option>
                    <option value="B-">B- (B Negative)</option>
                    <option value="B+">B+ (B Positive)</option>
                    <option value="O+">O+ (O Positive)</option>
                    <option value="A+">A+ (A Positive)</option>
                    <option value="AB+">AB+ (AB Positive)</option>
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Units Needed */}
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface mb-1.5">
                  Bags Needed
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-surface-container-lowest border-2 border-primary/25 rounded-xl px-3.5 py-2.5 text-[14px] font-bold text-on-surface focus:outline-none focus:border-primary shadow-sm appearance-none cursor-pointer"
                    value={formData.units}
                    onChange={(e) => setFormData({ ...formData, units: e.target.value })}
                    id="sos-units"
                  >
                    <option value="1">1 Bag (450 ml)</option>
                    <option value="2">2 Bags (Emergency Whole Blood)</option>
                    <option value="3">3 Bags (Trauma Surgery)</option>
                    <option value="4">4+ Bags (Multi-Donor Req)</option>
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Patient Type (Required from Phase 3 fix) */}
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface mb-1.5">
                  Patient Type
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-surface-container-lowest border-2 border-primary/25 rounded-xl px-3.5 py-2.5 text-[14px] font-bold text-on-surface focus:outline-none focus:border-primary shadow-sm appearance-none cursor-pointer"
                    value={formData.patientType}
                    onChange={(e) => setFormData({ ...formData, patientType: e.target.value })}
                    id="sos-patienttype"
                  >
                    <option value="Student">Student</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Staff">Staff</option>
                    <option value="Civilian">Civilian</option>
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Hospital Location */}
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface mb-1.5">
                  Hospital
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-surface-container-lowest border-2 border-primary/25 rounded-xl px-3.5 py-2.5 text-[14px] font-bold text-on-surface focus:outline-none focus:border-primary shadow-sm appearance-none cursor-pointer"
                    value={formData.hospital}
                    onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                    id="sos-hospital"
                  >
                    <option value="Saidpur CMH (Combined Military Hospital)">Saidpur CMH</option>
                    <option value="BAUST Medical Center">BAUST Medical Center</option>
                    <option value="Rangpur Medical College Hospital">Rangpur Medical College</option>
                    <option value="Prime Medical College Hospital">Prime Medical College</option>
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Big Pulsing Trigger Button */}
              <div className="lg:col-span-3">
                <button
                  type="submit"
                  disabled={submitting}
                  id="sos-trigger-btn"
                  className="w-full py-2.5 px-4 rounded-xl text-white font-extrabold text-[13px] tracking-wide shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, rgb(225, 29, 72) 0%, rgb(184, 0, 53) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>DISPATCHING SOS...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px] animate-pulse">
                        campaign
                      </span>
                      <span>TRIGGER CAMPUS SOS</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Optional details collapsible row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div>
                <input
                  type="text"
                  placeholder="Patient Case Name (e.g. Patient #B702 • Road Trauma)"
                  className="w-full bg-surface-container-lowest/80 border border-primary/20 rounded-xl px-3.5 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-primary"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  id="sos-patientname"
                />
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="Emergency Hotline Phone (+88017...)"
                  className="w-full bg-surface-container-lowest/80 border border-primary/20 rounded-xl px-3.5 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-primary"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  id="sos-contactphone"
                />
              </div>
            </div>

            {submitError && (
              <div className="mt-3 p-3 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{submitError}</span>
              </div>
            )}

            <div className="flex items-center gap-2 mt-3 text-[11px] text-on-surface-variant pl-1">
              <span className="material-symbols-outlined text-[14px] text-primary">info</span>
              <span>
                SOS triggers simultaneous automated push dispatch to active eligible donors in Saidpur Cantonment and alerts duty medical desk.
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* SECTION 2: DUAL-STATE LIVE DISPATCH VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* STATE A: ACTIVE CAMPUS DONORS FOUND (Real-time Matched Stream) */}
        <div
          className={`rounded-2xl p-6 shadow-md transition-all duration-300 flex flex-col justify-between border-t-4 border-t-primary ${
            activeSosState === 'MATCHED'
              ? 'bg-surface-container-lowest ring-2 ring-primary/40'
              : 'bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30'
          }`}
        >
          <div>
            {/* State A Header */}
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-primary animate-ping" />
                <h2 className="text-base font-bold text-on-surface">State A: Active Donors Matched</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                {sosResult?.state === 'MATCHED'
                  ? `${sosResult.matchedDonorsCount} Donors En Route / Ready`
                  : '3 Donors En Route / Ready (Live Node)'}
              </span>
            </div>

            {/* Query search indicator bar */}
            <div className="mt-4 p-3 rounded-xl bg-primary/[0.04] border border-primary/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center text-xs shadow-sm">
                  <span className="material-symbols-outlined text-[18px] animate-spin">radar</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-on-surface">
                    {activeSosState === 'MATCHED' ? 'Emergency Dispatch Dispatched' : 'Searching online eligible donors on campus...'}
                  </div>
                  <div className="text-[11px] text-on-surface-variant">
                    Target: <span className="font-bold text-primary">{formData.bloodGroup}</span> • Saidpur Cantonment Radius
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-primary">142 Scanned</span>
            </div>

            {/* Matched Donor Cards */}
            <div className="mt-4 space-y-3">
              {/* Donor Card 1 */}
              <div className="p-3.5 rounded-xl bg-surface-container-lowest border-2 border-primary/30 shadow-sm hover:shadow-md transition flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary font-black flex items-center justify-center text-sm border border-primary/20 shadow-sm">
                      TH
                    </div>
                    <span className="absolute -top-1 -left-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-primary text-white">
                      {formData.bloodGroup}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-on-surface">Tanvir Hossain</h3>
                      <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded">
                        CE Dept • Batch 21
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-1">
                      <span>
                        <span className="material-symbols-outlined text-primary text-[12px] align-middle">
                          location_on
                        </span>{' '}
                        Main Boys Hostel (350m)
                      </span>
                      <span>•</span>
                      <span className="font-mono text-on-surface font-semibold">8 Bags Donated</span>
                    </div>
                    <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Accepted — Moving to CMH Ward
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <a
                    href="tel:+8801713456789"
                    className="px-3.5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:brightness-105 active:scale-95 transition"
                    style={{ background: 'linear-gradient(135deg, rgb(225, 29, 72) 0%, rgb(184, 0, 53) 100%)' }}
                  >
                    <span className="material-symbols-outlined text-[14px]">call</span>
                    <span>Call Donor</span>
                  </a>
                  <div className="text-[10px] font-mono text-outline mt-1.5">ETA: ~6 Mins</div>
                </div>
              </div>

              {/* Donor Card 2 */}
              <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-sm hover:border-primary/30 transition flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-surface-container text-on-surface font-extrabold flex items-center justify-center text-sm border border-outline-variant/30 shadow-sm">
                      MS
                    </div>
                    <span className="absolute -top-1 -left-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-primary text-white">
                      {formData.bloodGroup}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-on-surface">Mahmudul S.</h3>
                      <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded">
                        EEE Dept • Batch 22
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-1">
                      <span>
                        <span className="material-symbols-outlined text-primary text-[12px] align-middle">
                          location_on
                        </span>{' '}
                        Academic Bldg 2 (180m)
                      </span>
                      <span>•</span>
                      <span className="font-mono text-on-surface font-semibold">4 Bags Donated</span>
                    </div>
                    <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-surface-container-high text-on-surface-variant border border-outline-variant/30">
                      <span className="material-symbols-outlined text-primary text-[12px]">check</span>
                      Verified Eligible • Standby Ready
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <a
                    href="tel:+8801712998877"
                    className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary border border-primary/30 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[14px]">call</span>
                    <span>Call Donor</span>
                  </a>
                  <div className="text-[10px] font-mono text-outline mt-1.5">ETA: ~12 Mins</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
            <span>2 additional campus donors notified via push notifications.</span>
            <span className="font-bold text-primary">Protocol #MATCH-104</span>
          </div>
        </div>

        {/* STATE B: RARE GROUP / ZERO DONORS MATCHING (Escalation Fallback Protocol) */}
        <div
          className={`rounded-2xl p-6 shadow-md transition-all duration-300 flex flex-col justify-between border-t-4 border-t-brand-900 ${
            activeSosState === 'ESCALATED'
              ? 'bg-surface-container-lowest ring-2 ring-primary/60'
              : 'bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30'
          }`}
          style={{
            background:
              activeSosState === 'ESCALATED'
                ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 241, 242, 0.95) 100%)'
                : undefined,
          }}
        >
          <div>
            {/* State B Header */}
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-primary" />
                <h2 className="text-base font-bold text-on-surface">State B: Escalation Protocol Fallback</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-white shadow-sm">
                Zero Active Donors
              </span>
            </div>

            {/* Escalation Alert Banner */}
            <div className="mt-4 p-4 rounded-2xl bg-[#4c0519] text-white shadow-md border border-primary/40">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-rose-300 text-[24px] mt-0.5">
                  warning
                </span>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-rose-200">
                    Emergency Protocol Level 3
                  </div>
                  <h3 className="text-[14px] font-extrabold text-white mt-0.5">
                    Zero Active Donors Found on Campus — Escalation Protocol Triggered
                  </h3>
                  <p className="text-xs text-rose-100/90 mt-1 leading-relaxed">
                    Automatic campus-wide broadcast dispatched. Disaster reserve pinged across Saidpur Cantonment &amp; Rangpur Regional Transfusion Banks.
                  </p>
                </div>
              </div>
            </div>

            {/* Escalation Detail Widgets */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Broadcast Feed Card */}
              <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-primary/20 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
                  <span className="material-symbols-outlined text-primary text-[18px]">rss_feed</span>
                  <span>Campus-Wide Feed Broadcast</span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Pinned high-priority alert sent to all 1,450+ registered student feeds.
                </p>
                <div className="mt-2.5 text-[11px] font-bold text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">done_all</span>
                  <span>Broadcasting Live</span>
                </div>
              </div>

              {/* Disaster Reserve Volunteer Counter */}
              <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-primary/20 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
                  <span className="material-symbols-outlined text-primary text-[18px]">group</span>
                  <span>Disaster Reserve Volunteers</span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-primary">
                    {stats.disasterVolunteersCount || 28}
                  </span>
                  <span className="text-[11px] text-on-surface-variant font-medium">notified in Saidpur</span>
                </div>
                <div className="mt-1 text-[11px] text-on-surface-variant">Standby response triggered</div>
              </div>
            </div>

            {/* Direct BAUST Medical Center Emergency Desk Button */}
            <div className="mt-4">
              <a
                href="tel:+8801769662215"
                className="w-full py-3 px-4 rounded-xl text-white font-extrabold text-xs tracking-wide flex items-center justify-center gap-2.5 shadow-lg shadow-primary/25 hover:brightness-105 active:scale-[0.98] transition border border-white/20"
                style={{
                  background: 'linear-gradient(135deg, rgb(184, 0, 53) 0%, rgb(136, 19, 55) 100%)',
                }}
              >
                <span className="material-symbols-outlined text-[18px]">phone_in_talk</span>
                <span>Call BAUST Medical Center Emergency Desk (Dr. Mosaffor Hossain)</span>
              </a>
              <div className="flex items-center justify-between text-[11px] text-on-surface-variant mt-2 px-1">
                <span>
                  Direct Line: <strong className="font-mono text-on-surface">+880 1769-662215</strong>
                </span>
                <span className="font-bold text-primary">SAMO On-Duty Hotline</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Saidpur CMH Blood Bank cross-match requisition sent.</span>
            <span className="font-mono text-primary font-bold">Protocol #ESC-802</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: ACTIVE CAMPUS SOS LIVE TRACKER (Lower Panel) */}
      <section className="rounded-2xl p-6 shadow-md bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30">
        {/* Tracker Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
              <h2 className="text-[17px] font-extrabold text-on-surface tracking-tight">
                Active Campus SOS Live Tracker
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                {filteredEmergencies.length} Ongoing Requisitions
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Real-time status tracking for emergency transfusions within Saidpur &amp; Rangpur medical network (Auto-syncs every 7s).
            </p>
          </div>

          {/* Quick Search & Refresh */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Filter patient or hospital..."
                className="w-56 sm:w-64 bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-1.5 pr-8 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary shadow-sm"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
              <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[16px] text-outline">
                search
              </span>
            </div>
            <button
              onClick={fetchLiveData}
              disabled={syncing}
              className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold flex items-center gap-1.5 shadow-sm border border-outline-variant/30 transition active:scale-95"
              type="button"
            >
              <span className={`material-symbols-outlined text-primary text-[16px] ${syncing ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>Live Sync</span>
            </button>
          </div>
        </div>

        {/* Tracker Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-wider text-outline border-b border-outline-variant/30 bg-surface-container-low/40">
                <th className="py-3 px-3">Requisition ID</th>
                <th className="py-3 px-3">Patient / Clinical Case</th>
                <th className="py-3 px-3 text-center">Group</th>
                <th className="py-3 px-3">Required</th>
                <th className="py-3 px-3">Hospital Location</th>
                <th className="py-3 px-3">Elapsed Time</th>
                <th className="py-3 px-3">Response Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-xs">
              {filteredEmergencies.map((row) => (
                <tr key={row._id} className="hover:bg-primary/[0.02] transition">
                  <td className="py-3.5 px-3 font-mono font-bold text-primary">
                    #{row._id.slice(-7)}
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-on-surface">{row.patientName}</div>
                    <div className="text-[11px] text-on-surface-variant">{row.diagnosis}</div>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-black text-white shadow-sm"
                      style={{
                        background: row.bloodGroup === 'BOMBAY' ? '#ac2926' : '#b80035',
                      }}
                    >
                      {row.bloodGroup === 'BOMBAY' ? 'Bombay (hh)' : row.bloodGroup}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-on-surface">
                    {row.units} {row.units === 1 ? 'Unit' : 'Units'} Whole Blood
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="font-medium text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-[16px]">
                        local_hospital
                      </span>
                      <span>{row.hospital}</span>
                    </div>
                    {row.hospitalBed && (
                      <div className="text-[11px] text-on-surface-variant pl-5">
                        {row.hospitalBed}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-3 font-mono font-bold text-primary">
                    <span className="material-symbols-outlined text-[13px] align-middle mr-1">
                      schedule
                    </span>
                    {formatElapsedTime(row.elapsedSeconds)}
                  </td>
                  <td className="py-3.5 px-3">
                    {row.statusType === 'escalated' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        <span className="material-symbols-outlined text-[13px]">warning</span>
                        {row.statusLabel}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                        {row.statusLabel}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <a
                      href="tel:+8801769662215"
                      className="px-3 py-1.5 rounded-lg bg-primary hover:brightness-105 text-white text-[11px] font-bold shadow-sm transition inline-flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[13px]">phone</span>
                      <span>Desk</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default EmergencySosScreen;
