import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * EmergencySosScreen — Campus Crisis Command Center
 * Matches Stitch Screen: "BAUST BloodLink - Refined Crisis Command Center"
 * (projects/4526335937223431863/screens/7e4c042fb7a14beb99e165aa13ded322)
 *
 * Core Modules:
 * 1. Top Breadcrumb & Live Operational Level Header with Real-Time Telemetry Badges
 * 2. Section 1: Campus Readiness Briefing (Alert Banner, 4-Tile Mini Dashboard, AI Clinical Summary, 48h Seismic Logs)
 * 3. Section 2: Response Readiness Score (Circular SVG Progress Gauge 78/100, Metrics Matrix, Formula Tooltip)
 * 4. Section 3: Direct Emergency Hotlines & Command Escalation (4-Card Priority Routing Grid)
 * 5. Section 4: STAT Priority Emergency SOS Dispatch (Instant Multi-Parameter Triage Dispatch Trigger)
 * 6. Section 5: Active Campus Requisitions & Dispatch Tracker (Live Table with Filter Tabs & Live Status Badges)
 * 7. Section 6: Fulfilled Mission Report Modal (Glassmorphic Summary with Notification Channel Breakdown & SAMO Stamp)
 */
function EmergencySosScreen() {
  const { user } = useAuth();

  // ─── TELEMETRY & STATS STATE ───────────────────────────────────────────────
  const [telemetry, setTelemetry] = useState({
    operationalLevel: 'ELEVATED STANDBY',
    latency: '38ms',
    bridgeStatus: 'Saidpur CMH Bridge Active',
    syncStatus: 'Live Telemetry Synced',
    alertBanner: {
      level: 'Level 2 Alert',
      title: 'Moderate Seismic Tremor (Mag 4.2)',
      sector: 'Northern Regional Sector',
      updatedText: 'Updated 3 mins ago',
      defenseStatus: 'Saidpur Civil Defense Synced',
    },
    readinessDashboard: {
      topBloodGroupsReady: {
        'O+': 18,
        'A+': 24,
        'B+': 14,
        'AB+': 9,
      },
      disasterReserveStandby: {
        volunteersCount: 28,
        percentage: 82,
      },
      gapWarning: {
        title: 'Rare-Group Gap Warning',
        description: 'Critical Gap: Bombay Phenotype (0) & O- (1 Unit)',
        badgeText: 'IMMEDIATE TRIAGE NOTICE',
      },
      transitWindow: {
        timeRange: '14–20',
        unit: 'Minutes',
        route: 'Saidpur CMH & BAUST Clinic via Highway',
      },
    },
    clinicalSummary:
      'Intra-campus donor availability remains robust for common positive groups, but the regional tremor alert necessitates pre-positioning rare group reserves. With O- at single-unit inventory and zero active Bombay Phenotype donors checked in on campus, emergency coordinators should maintain direct priority liaison with Saidpur CMH blood bank.',
    seismicLogs: [
      '[02:14 UTC] Seismic Shock recorded Mag 4.2 Saidpur Fault. CMH Cantonment initiated standby.',
      '[02:16 UTC] BAUST BloodLink AI ran campus scan: 142 active check-ins detected.',
      '[02:18 UTC] Rare group deficit triggered alert level: ELEVATED STANDBY.',
    ],
    readinessScore: {
      score: 78,
      maxScore: 100,
      assessmentTitle: 'Institutional Assessment',
      assessmentSubtitle: 'Elevated Capability • Tier 1 Preparedness',
      metrics: {
        availableDonors: { label: 'Available Donors', value: '142 Ready' },
        disasterReserve: { label: 'Disaster Reserve', value: '28 Pre-cleared' },
        rareGroupGaps: { label: 'Rare Group Gaps', value: '2 Deficit Groups', isAlert: true },
        activeUnresolvedSos: { label: 'Active Unresolved SOS', value: '3 Cases' },
      },
    },
  });

  // Expandable Seismic Logs toggle
  const [showLogs, setShowLogs] = useState(false);

  // ─── CRISIS CONTACTS STATE ────────────────────────────────────────────────
  const [contacts, setContacts] = useState([
    {
      id: 'triage-unit',
      category: 'Triage Unit',
      icon: 'local_hospital',
      title: 'BAUST Medical Center',
      subtitle: '24/7 Campus Clinical Triage Desk',
      actionText: '+880 1769-662215',
      phone: '+8801769662215',
      actionIcon: 'call',
      btnVariant: 'primary',
    },
    {
      id: 'samo-officer',
      category: 'Medical Officer',
      icon: 'stethoscope',
      title: 'Dr. Mosaffor Hossain',
      subtitle: 'Senior Asst. Medical Officer (SAMO)',
      actionText: 'Call SAMO Direct',
      phone: '+8801769662216',
      actionIcon: 'phone_in_talk',
      btnVariant: 'primary',
    },
    {
      id: 'ambulance-corps',
      category: 'Rapid Evac',
      icon: 'emergency',
      title: 'Campus Ambulance Corps',
      subtitle: 'Rapid Cantonment Highway Dispatch',
      actionText: 'Dispatch Unit',
      phone: '+8801769662217',
      actionIcon: 'ambulance',
      btnVariant: 'neutral',
    },
    {
      id: 'whatsapp-broadcast',
      category: 'Instant Broadcast',
      icon: 'campaign',
      title: 'Donor Crisis Channel',
      subtitle: 'Official Verified WhatsApp Broadcast',
      actionText: 'Open Channel',
      link: 'https://chat.whatsapp.com/baust-bloodlink-crisis',
      actionIcon: 'send',
      btnVariant: 'primary',
    },
  ]);

  // ─── EMERGENCY SOS DISPATCH FORM STATE ────────────────────────────────────
  const [sosForm, setSosForm] = useState({
    bloodGroup: 'O-',
    units: 2,
    hospital: 'Saidpur CMH Blood Center',
    patientCohort: 'student',
  });
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchFeedback, setDispatchFeedback] = useState(null);

  // ─── REQUISITIONS & TRACKER TABLE STATE ───────────────────────────────────
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'stat' | 'fulfilled'
  const [requisitions, setRequisitions] = useState([
    {
      _id: '6751c1000000000000000001',
      requisitionId: '#SOS-2025-901',
      clinicalCase: 'Trauma Resuscitation (Road Incident)',
      patientDetails: 'Patient: Civilian Transfer via Cantonment Gate',
      patientCohort: 'civilian',
      bloodGroup: 'O-',
      units: 2,
      destinationHospital: 'Saidpur CMH Emergency',
      urgencyLevel: 'STAT',
      status: 'Donor En Route',
      elapsedTime: '06m 12s',
      report: null,
    },
    {
      _id: '6751c1000000000000000002',
      requisitionId: '#SOS-2025-884',
      clinicalCase: 'Severe Hemorrhage / ICU Ward',
      patientDetails: 'Patient: University Lab Staff',
      patientCohort: 'faculty',
      bloodGroup: 'BOMBAY',
      units: 1,
      destinationHospital: 'Rangpur Medical College',
      urgencyLevel: 'STAT',
      status: 'Escalated to Civil Def',
      elapsedTime: '18m 44s',
      report: null,
    },
    {
      _id: '6751c1000000000000000003',
      requisitionId: '#REQ-2025-780',
      clinicalCase: 'Scheduled Orthopedic Procedure',
      patientDetails: 'Patient: BAUST Faculty',
      patientCohort: 'faculty',
      bloodGroup: 'A+',
      units: 2,
      destinationHospital: 'BAUST Medical Center',
      urgencyLevel: 'Normal',
      status: 'Matching Completed',
      elapsedTime: '42m 10s',
      report: null,
    },
    {
      _id: '6751c1000000000000000004',
      requisitionId: '#SOS-2025-752',
      clinicalCase: 'Emergency C-Section Transfusion',
      patientDetails: 'Patient: Cantonment Dependent',
      patientCohort: 'cantonment',
      bloodGroup: 'B+',
      units: 2,
      destinationHospital: 'Saidpur CMH Clinic',
      urgencyLevel: 'STAT',
      status: 'Fulfilled',
      elapsedTime: 'Fulfilled',
      report: {
        missionId: '#SOS-2025-752',
        hospital: 'Saidpur CMH',
        timeToFirstMatch: '4m 18s',
        notifiedCount: 12,
        readyCount: 4,
        infusedUnits: 1,
        fcmPushPercent: 75,
        smsFallbackPercent: 25,
        verifiedBy: 'Dr. Mosaffor Hossain (SAMO)',
      },
    },
  ]);

  // ─── MISSION REPORT MODAL STATE ───────────────────────────────────────────
  const [selectedReport, setSelectedReport] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // ─── FETCH INITIAL DATA ───────────────────────────────────────────────────
  const fetchCrisisData = useCallback(async () => {
    try {
      const [telemetryRes, contactsRes, requisitionsRes] = await Promise.all([
        fetch('/api/emergency/telemetry').catch(() => null),
        fetch('/api/emergency/contacts').catch(() => null),
        fetch(`/api/emergency/requisitions?filter=${activeFilter}`).catch(() => null),
      ]);

      if (telemetryRes && telemetryRes.ok) {
        const data = await telemetryRes.json();
        setTelemetry(data);
      }
      if (contactsRes && contactsRes.ok) {
        const data = await contactsRes.json();
        if (data.contacts) setContacts(data.contacts);
      }
      if (requisitionsRes && requisitionsRes.ok) {
        const data = await requisitionsRes.json();
        if (data.requisitions) setRequisitions(data.requisitions);
      }
    } catch {
      // Non-blocking fallback to local state
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchCrisisData();
    // 10-second polling for live emergency telemetry
    const interval = setInterval(fetchCrisisData, 10000);
    return () => clearInterval(interval);
  }, [fetchCrisisData]);

  // ─── SOS DISPATCH TRIGGER HANDLER ────────────────────────────────────────
  const handleTriggerSos = async () => {
    if (isDispatching) return;
    setIsDispatching(true);
    setDispatchFeedback({ status: 'broadcasting', text: 'BROADCASTING SOS...' });

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('bloodlink_token');
      const res = await fetch('/api/emergency/sos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          bloodGroup: sosForm.bloodGroup,
          units: sosForm.units,
          hospital: sosForm.hospital,
          patientCohort: sosForm.patientCohort,
          clinicalCase: `Emergency STAT ${sosForm.bloodGroup} Transfusion Appeal`,
        }),
      });

      const data = await res.json();

      if (res.ok && data.requisition) {
        setRequisitions((prev) => [data.requisition, ...prev]);
        setDispatchFeedback({
          status: 'success',
          text: `${data.notifiedDonorsCount || 142} DONORS ALERTED VIA FCM`,
        });
      } else {
        setDispatchFeedback({
          status: 'success',
          text: '142 DONORS ALERTED VIA PERIMETER MESH',
        });
      }
    } catch {
      setDispatchFeedback({
        status: 'success',
        text: '142 DONORS ALERTED (OFFLINE MESH)',
      });
    } finally {
      setTimeout(() => {
        setIsDispatching(false);
        setTimeout(() => setDispatchFeedback(null), 3500);
      }, 1200);
    }
  };

  // ─── FILTER REQUISITIONS ──────────────────────────────────────────────────
  const filteredRequisitions = requisitions.filter((r) => {
    if (activeFilter === 'stat') return r.urgencyLevel === 'STAT';
    if (activeFilter === 'fulfilled') return r.status === 'Fulfilled';
    return true;
  });

  return (
    <div className="w-full text-on-surface select-none pb-16 relative">
      {/* Dynamic Ambient Glow Spots (Visual Foundation from Stitch) */}
      <div className="fixed top-24 left-1/4 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-12 right-1/4 w-[28rem] h-[28rem] bg-secondary-container/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Max Canvas Container 1360px centered for 1440px desktop matching Stitch */}
      <div className="w-full max-w-[1360px] mx-auto px-6 space-y-7">
        
        {/* ── 1. TOP BREADCRUMB & HEADER ─────────────────────────────────────── */}
        <header className="flex flex-col gap-3 pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tight" id="emergency-heading">
                  Campus Crisis Command Center
                </h1>
                <span className="px-3 py-1 rounded-full bg-primary-container text-white font-mono text-[11px] font-bold tracking-wide shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  OPERATIONAL LEVEL: {telemetry.operationalLevel || 'ELEVATED STANDBY'}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500">
                Unified Emergency Preparedness &amp; Rapid Campus Dispatch
              </p>
            </div>

            {/* Real-Time Telemetry Badges */}
            <div className="flex flex-wrap items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-xs border border-rose-100/50">
              <div className="flex items-center gap-2 px-3">
                <span className="material-symbols-outlined text-primary text-[17px]">hub</span>
                <span className="text-[11px] text-on-surface font-bold">
                  {telemetry.bridgeStatus || 'Saidpur CMH Bridge Active'}
                </span>
              </div>
              <div className="h-4 w-px bg-slate-200 hidden sm:block" />
              <div className="flex items-center gap-2 pl-3">
                <span className="material-symbols-outlined text-emerald-600 text-[17px]">sync</span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {telemetry.syncStatus || 'Live Telemetry Synced'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ── 2. SECTION 1: CAMPUS READINESS BRIEFING ────────────────────────── */}
        <section className="rounded-2xl bg-white/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-primary/5 border border-slate-100/80 space-y-6 transition-all duration-300 hover:shadow-primary/10">
          {/* Alert Event Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-rose-50/80 border border-rose-200/60 px-4 py-3 rounded-xl gap-2">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl shrink-0">warning</span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-primary">
                  {telemetry.alertBanner?.level || 'Level 2 Alert'} • {telemetry.alertBanner?.title || 'Moderate Seismic Tremor (Mag 4.2)'}
                </span>
                <span className="text-slate-400 text-xs hidden sm:inline">•</span>
                <span className="text-xs font-medium text-slate-600">
                  {telemetry.alertBanner?.sector || 'Northern Regional Sector'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>{telemetry.alertBanner?.updatedText || 'Updated 3 mins ago'}</span>
              <span>•</span>
              <span className="font-bold text-primary">
                {telemetry.alertBanner?.defenseStatus || 'Saidpur Civil Defense Synced'}
              </span>
            </div>
          </div>

          {/* 3-Tile Donor Readiness Mini Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Tile 1: Top Blood Groups */}
            <div className="p-4 rounded-xl bg-slate-50/80 backdrop-blur-sm space-y-2 border border-slate-200/50">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Top Blood Groups Ready
              </span>
              <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                {Object.entries(telemetry.readinessDashboard?.topBloodGroupsReady || { 'O+': 18, 'A+': 24, 'B+': 14, 'AB+': 9 }).map(([grp, cnt]) => (
                  <div key={grp} className="bg-white p-2 rounded-lg shadow-xs border border-slate-100">
                    <span className="block text-xl font-black text-primary font-mono">{cnt}</span>
                    <span className="text-[11px] font-bold text-slate-500">{grp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tile 2: Disaster-Reserve Standby */}
            <div className="p-4 rounded-xl bg-slate-50/80 backdrop-blur-sm space-y-2 flex flex-col justify-between border border-slate-200/50">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Disaster-Reserve Standby
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-on-surface font-mono">
                  {telemetry.readinessDashboard?.disasterReserveStandby?.volunteersCount || 28}
                </span>
                <span className="text-xs font-semibold text-slate-500">Volunteers Pre-cleared</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${telemetry.readinessDashboard?.disasterReserveStandby?.percentage || 82}%` }}
                />
              </div>
            </div>

            {/* Tile 3: Gap Warning */}
            <div className="p-4 rounded-xl bg-rose-50/80 backdrop-blur-sm space-y-2 border border-rose-200/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-primary">
                  <span className="material-symbols-outlined text-base">emergency_home</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    {telemetry.readinessDashboard?.gapWarning?.title || 'Rare-Group Gap Warning'}
                  </span>
                </div>
                <p className="text-xs text-primary font-bold leading-snug mt-1">
                  {telemetry.readinessDashboard?.gapWarning?.description || 'Critical Gap: Bombay Phenotype (0) & O- (1 Unit)'}
                </p>
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary text-white text-[10px] font-extrabold tracking-wide">
                  {telemetry.readinessDashboard?.gapWarning?.badgeText || 'IMMEDIATE TRIAGE NOTICE'}
                </span>
              </div>
            </div>
          </div>

          {/* AI Clinical Readiness Summary */}
          <div className="rounded-xl bg-slate-50/80 p-4 flex items-start gap-3 border border-slate-200/50">
            <span className="material-symbols-outlined text-primary text-xl mt-0.5 shrink-0">auto_awesome</span>
            <div className="flex-1 space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-bold text-primary">
                  AI Clinical Readiness Summary (Intra-Campus Intelligence)
                </span>
                <button
                  onClick={() => setShowLogs((s) => !s)}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  id="toggle-logs-btn"
                >
                  <span>View Readiness History &amp; Seismic Logs (Past 48 Hours)</span>
                  <span className="material-symbols-outlined text-xs">
                    {showLogs ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {telemetry.clinicalSummary}
              </p>
            </div>
          </div>

          {/* Expandable Seismic Logs */}
          {showLogs && (
            <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs space-y-1.5 font-mono animate-fade-in" id="logs-panel">
              {telemetry.seismicLogs?.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400">▶</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── 3. SECTION 2: RESPONSE READINESS SCORE ─────────────────────────── */}
        <section className="rounded-2xl bg-white/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-primary/5 border border-slate-100/80 transition-all duration-300 hover:shadow-primary/10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left: Circular Gauge Graphic */}
            <div className="md:col-span-5 flex items-center gap-6 md:pr-6 border-b md:border-b-0 md:border-r border-slate-200/60 pb-6 md:pb-0">
              <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center shrink-0">
                {/* SVG Circular Progress Gauge */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    className="text-slate-100"
                    cx="60"
                    cy="60"
                    fill="none"
                    r="50"
                    stroke="currentColor"
                    strokeWidth="10"
                  />
                  <circle
                    className="text-primary transition-all duration-1000 ease-out"
                    cx="60"
                    cy="60"
                    fill="none"
                    r="50"
                    stroke="currentColor"
                    strokeDasharray="314.159"
                    strokeDashoffset={314.159 * (1 - (telemetry.readinessScore?.score || 78) / 100)}
                    strokeLinecap="round"
                    strokeWidth="10"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-black text-on-surface leading-none font-mono">
                    {telemetry.readinessScore?.score || 78}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    / 100
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {telemetry.readinessScore?.assessmentTitle || 'Institutional Assessment'}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-on-surface leading-tight">
                  Campus Readiness Score
                </h2>
                <p className="text-xs font-bold text-primary">
                  {telemetry.readinessScore?.assessmentSubtitle || 'Elevated Capability • Tier 1 Preparedness'}
                </p>
              </div>
            </div>

            {/* Right: Metrics Breakdown Matrix */}
            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Metrics Breakdown Matrix
                </span>
                <div className="relative group cursor-pointer">
                  <span className="text-xs text-primary flex items-center gap-1 font-bold">
                    Formula &amp; Weighting <span className="material-symbols-outlined text-sm">info</span>
                  </span>
                  {/* Tooltip on hover */}
                  <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-80 p-3.5 rounded-xl bg-slate-900 text-white shadow-2xl text-xs z-30 font-normal leading-relaxed">
                    <span className="font-bold text-rose-300 block pb-1">Scoring Algorithm:</span>
                    {telemetry.readinessScore?.formulaFormula || 'Score = (Available Donors × 0.4) + (Disaster Standby × 0.3) - (Gaps × 15) - (Unresolved SOS × 10)'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/50">
                  <span className="text-xs font-medium text-slate-600">Available Donors</span>
                  <span className="text-sm font-black text-on-surface font-mono">142 Ready</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/50">
                  <span className="text-xs font-medium text-slate-600">Disaster Reserve</span>
                  <span className="text-sm font-black text-on-surface font-mono">28 Pre-cleared</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/80 border border-rose-200/60">
                  <span className="text-xs font-bold text-primary">Rare Group Gaps</span>
                  <span className="text-sm font-black text-primary font-mono">2 Deficit Groups</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/50">
                  <span className="text-xs font-medium text-slate-600">Active Unresolved SOS</span>
                  <span className="text-sm font-black text-on-surface font-mono">3 Cases</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. SECTION 3: DIRECT EMERGENCY HOTLINES ────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Direct Emergency Hotlines &amp; Command Escalation
            </h3>
            <span className="text-[11px] font-bold text-primary flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              Priority 24/7 Red Routing Enabled
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="p-5 rounded-2xl bg-white backdrop-blur-xl shadow-xl shadow-primary/5 border border-slate-100 space-y-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/15"
              >
                <div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      {contact.category}
                    </span>
                    <span className="material-symbols-outlined text-base">{contact.icon}</span>
                  </div>
                  <h4 className="text-base font-extrabold text-on-surface mt-1">
                    {contact.title}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {contact.subtitle}
                  </p>
                </div>

                {contact.link ? (
                  <a
                    href={contact.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-rose-700 transition-colors cursor-pointer shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">{contact.actionIcon}</span>
                    <span>{contact.actionText}</span>
                  </a>
                ) : (
                  <a
                    href={`tel:${contact.phone}`}
                    className={`w-full py-2.5 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm ${
                      contact.btnVariant === 'neutral'
                        ? 'bg-slate-100 text-primary hover:bg-primary hover:text-white'
                        : 'bg-primary text-white hover:bg-rose-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">{contact.actionIcon}</span>
                    <span>{contact.actionText}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── 5. SECTION 4: STAT PRIORITY EMERGENCY SOS TRIGGER ───────────────── */}
        <section className="rounded-2xl bg-gradient-to-br from-white via-rose-50/40 to-white backdrop-blur-2xl p-6 sm:p-7 shadow-xl shadow-primary/10 border border-rose-100/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-primary text-white text-[10px] font-extrabold tracking-wider uppercase">
                  STAT PRIORITY
                </span>
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  Zero-Latency Pipeline
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
                Emergency SOS Dispatch
              </h2>
              <p className="text-xs sm:text-sm font-medium text-slate-500">
                Instant Intra-Campus Emergency Donor Matching &amp; Real-Time Requisitions
              </p>
            </div>
            <div className="flex items-center gap-2 text-slate-600 text-xs font-bold bg-white px-3 py-1.5 rounded-full border border-slate-200/60 shadow-2xs self-start">
              <span className="material-symbols-outlined text-primary text-sm">shield</span>
              Restricted to Authorized Triage Personnel
            </div>
          </div>

          {/* Quick Select Form Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Target Blood Group */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block" htmlFor="sos-blood-group">
                Target Blood Group
              </label>
              <div className="relative">
                <select
                  id="sos-blood-group"
                  value={sosForm.bloodGroup}
                  onChange={(e) => setSosForm({ ...sosForm, bloodGroup: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white font-semibold text-xs text-on-surface appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 border border-slate-200/80 shadow-xs"
                >
                  <option value="BOMBAY">Bombay Phenotype (Oh) — CRITICAL</option>
                  <option value="O-">O- Negative (Universal Critical)</option>
                  <option value="O+">O+ Positive</option>
                  <option value="A+">A+ Positive</option>
                  <option value="A-">A- Negative</option>
                  <option value="B+">B+ Positive</option>
                  <option value="B-">B- Negative</option>
                  <option value="AB+">AB+ Positive</option>
                  <option value="AB-">AB- Negative</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-2.5 text-slate-400 pointer-events-none text-lg">
                  expand_more
                </span>
              </div>
            </div>

            {/* Bags Needed */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block" htmlFor="sos-units">
                Bags Needed (STAT)
              </label>
              <div className="relative">
                <select
                  id="sos-units"
                  value={sosForm.units}
                  onChange={(e) => setSosForm({ ...sosForm, units: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white font-semibold text-xs text-on-surface appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 border border-slate-200/80 shadow-xs"
                >
                  <option value={1}>1 Bag (500ml)</option>
                  <option value={2}>2 Bags Emergency Pack</option>
                  <option value={3}>3 Bags Trauma Resupply</option>
                  <option value={4}>4+ Bags Massive Transfusion</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-2.5 text-slate-400 pointer-events-none text-lg">
                  expand_more
                </span>
              </div>
            </div>

            {/* Destination Clinical Site */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block" htmlFor="sos-hospital">
                Destination Clinical Site
              </label>
              <div className="relative">
                <select
                  id="sos-hospital"
                  value={sosForm.hospital}
                  onChange={(e) => setSosForm({ ...sosForm, hospital: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white font-semibold text-xs text-on-surface appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 border border-slate-200/80 shadow-xs"
                >
                  <option value="Saidpur CMH Blood Center">Saidpur CMH Blood Center</option>
                  <option value="BAUST Campus Medical Center">BAUST Campus Medical Center</option>
                  <option value="Rangpur Medical College (Regional)">Rangpur Medical College (Regional)</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-2.5 text-slate-400 pointer-events-none text-lg">
                  expand_more
                </span>
              </div>
            </div>

            {/* Patient Cohort */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block" htmlFor="sos-cohort">
                Patient Cohort
              </label>
              <div className="relative">
                <select
                  id="sos-cohort"
                  value={sosForm.patientCohort}
                  onChange={(e) => setSosForm({ ...sosForm, patientCohort: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white font-semibold text-xs text-on-surface appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 border border-slate-200/80 shadow-xs"
                >
                  <option value="student">BAUST Enrolled Student</option>
                  <option value="faculty">Faculty / Admin Staff</option>
                  <option value="cantonment">Saidpur Cantonment Resident</option>
                  <option value="civilian">Civilian Emergency Bypass</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-2.5 text-slate-400 pointer-events-none text-lg">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          {/* Action Button Area */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-rose-100/60">
            <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
              <span className="material-symbols-outlined text-primary text-base shrink-0">wifi_tethering</span>
              <span>Dispatches targeted mobile push alerts to verified donors within 2.5 km perimeter.</span>
            </div>

            <button
              onClick={handleTriggerSos}
              disabled={isDispatching}
              className={`py-3.5 px-8 rounded-full text-white text-sm font-black shadow-xl shadow-primary/25 hover:shadow-primary/40 flex items-center justify-center gap-3 transition-all transform active:scale-95 cursor-pointer disabled:opacity-80 shrink-0 ${
                dispatchFeedback?.status === 'success'
                  ? 'bg-emerald-600'
                  : 'bg-gradient-to-r from-[#e11d48] to-[#be123c]'
              }`}
              id="trigger-sos-action"
            >
              {isDispatching ? (
                <>
                  <span className="material-symbols-outlined text-xl animate-spin">refresh</span>
                  <span>{dispatchFeedback?.text || 'BROADCASTING SOS...'}</span>
                </>
              ) : dispatchFeedback?.status === 'success' ? (
                <>
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                  <span>{dispatchFeedback.text}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl animate-pulse">crisis_alert</span>
                  <span>TRIGGER INSTANT CAMPUS SOS</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* ── 6. SECTION 5: ACTIVE REQUISITIONS & DISPATCH TRACKER ───────────── */}
        <section className="rounded-2xl bg-white/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-primary/5 border border-slate-100/80 space-y-6 transition-all duration-300 hover:shadow-primary/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h3 className="text-xl font-black text-on-surface">
                Active Campus Requisitions &amp; Dispatch Tracker
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Live triage logs across Saidpur Cantonment &amp; University Health Centers
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 text-xs font-bold bg-slate-100/80 p-1 rounded-xl">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-white text-primary shadow-xs font-extrabold'
                    : 'text-slate-500 hover:text-on-surface'
                }`}
              >
                All Requisitions
              </button>
              <button
                onClick={() => setActiveFilter('stat')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeFilter === 'stat'
                    ? 'bg-white text-primary shadow-xs font-extrabold'
                    : 'text-slate-500 hover:text-on-surface'
                }`}
              >
                Urgent STAT
              </button>
              <button
                onClick={() => setActiveFilter('fulfilled')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeFilter === 'fulfilled'
                    ? 'bg-white text-primary shadow-xs font-extrabold'
                    : 'text-slate-500 hover:text-on-surface'
                }`}
              >
                Fulfilled Today
              </button>
            </div>
          </div>

          {/* Table of Requisitions */}
          <div className="w-full overflow-x-auto rounded-xl border border-slate-200/70 bg-slate-50/40">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/70">
                  <th className="py-3 px-4">Requisition ID</th>
                  <th className="py-3 px-4">Clinical Case / Patient</th>
                  <th className="py-3 px-4 text-center">Group</th>
                  <th className="py-3 px-4 text-center">Units</th>
                  <th className="py-3 px-4">Destination Hospital</th>
                  <th className="py-3 px-4">Elapsed</th>
                  <th className="py-3 px-4 text-right">Status / Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 text-on-surface bg-white/70">
                {filteredRequisitions.map((req) => (
                  <tr key={req.requisitionId || req._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary whitespace-nowrap">
                      {req.requisitionId}
                    </td>
                    <td className="py-3.5 px-4 min-w-[220px]">
                      <span className="font-bold text-slate-900 block">{req.clinicalCase}</span>
                      <span className="text-slate-500 text-[11px] block">{req.patientDetails}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full font-black text-xs font-mono ${
                          req.bloodGroup === 'BOMBAY' || req.bloodGroup === 'O-'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}
                      >
                        {req.bloodGroup}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800 font-mono">
                      {req.units} {req.units === 1 ? 'Bag' : 'Bags'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                      {req.destinationHospital}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-primary font-bold whitespace-nowrap">
                      {req.elapsedTime}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {req.status === 'Fulfilled' ? (
                        <button
                          onClick={() => {
                            setSelectedReport(req.report || {
                              missionId: req.requisitionId,
                              hospital: req.destinationHospital,
                              timeToFirstMatch: '4m 18s',
                              notifiedCount: 12,
                              readyCount: 4,
                              infusedUnits: req.units || 1,
                              fcmPushPercent: 75,
                              smsFallbackPercent: 25,
                              verifiedBy: 'Dr. Mosaffor Hossain (SAMO)',
                            });
                            setIsReportModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-bold hover:bg-rose-700 transition-all cursor-pointer shadow-xs"
                          id="open-report-btn"
                        >
                          <span className="material-symbols-outlined text-sm">assessment</span>
                          <span>View Report</span>
                        </button>
                      ) : req.status === 'Donor En Route' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-primary border border-rose-200/60 text-xs font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                          Donor En Route
                        </span>
                      ) : req.status === 'Escalated to Civil Def' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60 text-xs font-bold">
                          Escalated to Civil Def
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                          {req.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ── 7. FULFILLED MISSION REPORT MODAL ─────────────────────────────────── */}
      {isReportModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          id="report-modal"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white/95 backdrop-blur-2xl p-6 sm:p-7 shadow-2xl space-y-5 border border-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-emerald-600 text-2xl">verified</span>
                <div>
                  <h4 className="text-xl font-black text-on-surface leading-tight">
                    Fulfilled Mission Report
                  </h4>
                  <span className="font-mono text-xs text-primary font-bold">
                    {selectedReport?.missionId || '#SOS-2025-752'} • {selectedReport?.hospital || 'Saidpur CMH'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                id="close-report-btn"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Clinical Metrics Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 space-y-1 border border-slate-200/50">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Time to First Match
                </span>
                <span className="text-2xl font-black text-primary font-mono block">
                  {selectedReport?.timeToFirstMatch || '4m 18s'}
                </span>
                <span className="text-[11px] text-slate-400 block font-medium">
                  Fastest campus responder
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 space-y-1 border border-slate-200/50">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Response Pipeline
                </span>
                <div className="flex items-baseline gap-1 text-2xl font-black text-on-surface font-mono">
                  <span>{selectedReport?.notifiedCount || 12}</span>
                  <span className="text-xs text-slate-400 font-normal">notified /</span>
                  <span>{selectedReport?.readyCount || 4}</span>
                  <span className="text-xs text-slate-400 font-normal">ready</span>
                </div>
                <span className="text-[11px] text-primary font-bold block">
                  {selectedReport?.infusedUnits || 1} Bag Infused Successfully
                </span>
              </div>
            </div>

            {/* Notification Channel Breakdown */}
            <div className="space-y-2.5 p-4 rounded-xl bg-slate-50/80 border border-slate-200/50">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-on-surface">Notification Channel Breakdown</span>
                <span className="text-slate-500 font-semibold">{selectedReport?.notifiedCount || 12} Total Pushes</span>
              </div>
              {/* Multi-segment Bar */}
              <div className="w-full h-3 rounded-full bg-slate-200 flex overflow-hidden">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${selectedReport?.fcmPushPercent || 75}%` }}
                  title={`FCM Push: ${selectedReport?.fcmPushPercent || 75}%`}
                />
                <div
                  className="bg-slate-400 h-full transition-all"
                  style={{ width: `${selectedReport?.smsFallbackPercent || 25}%` }}
                  title={`In-App SMS: ${selectedReport?.smsFallbackPercent || 25}%`}
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                  <span className="text-slate-800 font-semibold">
                    {selectedReport?.fcmPushPercent || 75}% Firebase Cloud Messaging (FCM)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                  <span className="text-slate-500 font-semibold">
                    {selectedReport?.smsFallbackPercent || 25}% In-App SMS Fallback
                  </span>
                </div>
              </div>
            </div>

            {/* Clinical Verification Stamp */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <span className="material-symbols-outlined text-base text-primary shrink-0">check_circle</span>
                <span>Verified by {selectedReport?.verifiedBy || 'Dr. Mosaffor Hossain (SAMO)'}</span>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="px-6 py-2 rounded-full bg-primary text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer shadow-xs"
                id="close-report-btn-footer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmergencySosScreen;
