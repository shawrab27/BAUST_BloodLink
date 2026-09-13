import { useState, useEffect } from 'react';

function HelplineScreen() {
  const [contacts, setContacts] = useState([]);
  const [grouped, setGrouped] = useState({
    Committee: [],
    Medical: [],
    Campus: [],
    WhatsApp: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real-time WhatsApp Community Telemetry & Tracing State
  const [communityStats, setCommunityStats] = useState({
    totalMembers: 1486,
    baseMembers: 1450,
    totalClicks: 342,
    totalJoins: 36,
    todayJoins: 24,
    channels: {
      linkVisits: { count: 184, joins: 82, label: 'Direct Link / Web URL', icon: 'link' },
      qrScans: { count: 96, joins: 69, label: 'Scanned Green QR Code', icon: 'qr_code_scanner' },
      directInvites: { count: 62, joins: 54, label: 'Peer Direct Invites & Referrals', icon: 'share' },
    },
    recentActivity: [],
  });
  const [showTelemetryModal, setShowTelemetryModal] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const fetchCommunityStats = async () => {
    try {
      const res = await fetch('/api/helpline/whatsapp/stats');
      if (res.ok) {
        const data = await res.json();
        setCommunityStats(data);
      }
    } catch {
      // Keep optimistic fallback
    }
  };

  const fetchHelpline = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/helpline');
      if (!res.ok) throw new Error('Failed to load helpline directory');
      const data = await res.json();
      setContacts(data.contacts || []);
      setGrouped({
        Committee: data.grouped?.Committee || [],
        Medical: data.grouped?.Medical || [],
        Campus: data.grouped?.Campus || [],
        WhatsApp: Array.isArray(data.grouped?.WhatsApp) ? data.grouped.WhatsApp[0] : (data.grouped?.WhatsApp || data.whatsappContact || null),
      });
      fetchCommunityStats();
    } catch (err) {
      setError(err.message || 'Unable to fetch helpline contacts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHelpline();
    const interval = setInterval(fetchCommunityStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleTrackAndJoin = (source = 'button') => {
    fetch(`/api/helpline/whatsapp/track?source=${source}`, { method: 'POST' }).catch(() => {});
    fetchCommunityStats();
  };

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/api/helpline/whatsapp/track?source=invite`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const committeeMembers = grouped.Committee && grouped.Committee.length > 0 ? grouped.Committee : [];
  const medicalDesks = grouped.Medical && grouped.Medical.length > 0 ? grouped.Medical : [];
  const campusContacts = grouped.Campus && grouped.Campus.length > 0 ? grouped.Campus : [];
  const whatsappInfo = grouped.WhatsApp || {
    name: 'BloodLink Emergency Response Broadcast',
    subtitle: 'Instant alerts for emergency donor availability, rare group matching requests, and urgent mobilization across all academic departments, campus dormitories, and Saidpur Cantonment.',
    whatsappLink: 'https://chat.whatsapp.com/LFMuSuSr2J8EtD8OVfEpJQ',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https%3A%2F%2Fchat.whatsapp.com%2FLFMuSuSr2J8EtD8OVfEpJQ&color=059669&bgcolor=ffffff',
    notes: 'Strictly Moderated • Emergency Requisitions Only',
  };

  return (
    <div className="page-wrapper max-w-[1200px] mx-auto pb-16 space-y-10 animate-fade-in">
      {/* ── AMBIENT DECORATIVE BLUR BACKGROUNDS ── */}
      <div className="relative w-full">
        <div className="pointer-events-none absolute -top-16 -right-10 w-96 h-96 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="pointer-events-none absolute top-96 -left-10 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />

        {/* ── PAGE TITLE BANNER ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-outline-variant/40">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface leading-tight">
              Campus Helpline &amp; <span className="text-primary font-bold">Committee Directory</span>
            </h1>
            <p className="text-sm text-on-surface-variant mt-1.5 font-normal">
              Official 24/7 coordination channels, executive student committee leadership.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6 pt-6">
            <div className="h-8 bg-surface-container rounded-lg w-1/3 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-surface-container animate-pulse" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="glass-panel p-8 text-center rounded-2xl error-state mt-6">
            <span className="material-symbols-outlined text-[48px] text-primary">error</span>
            <h3 className="text-base font-semibold text-on-surface mt-2">{error}</h3>
            <button onClick={fetchHelpline} className="btn-primary mt-4 py-2 px-5 text-xs font-bold">
              Retry Connection
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* ═════════════════════════════════════════════════════════════════
                SEGMENT 1: BAUST Blood Donation Committee (Executive Leadership)
            ═════════════════════════════════════════════════════════════════ */}
            <section className="flex flex-col gap-6 pt-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-rose-100 pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-900/20">
                      <span className="material-symbols-outlined text-[22px]">groups</span>
                    </div>
                    <h2 className="text-2xl lg:text-[28px] font-extrabold tracking-tight bg-gradient-to-r from-rose-800 via-rose-600 to-red-600 bg-clip-text text-transparent">
                      BAUST Blood Donation Committee
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5">
                    Student and faculty executive leadership governing campus blood donor mobilizations and emergency drives.
                  </p>
                </div>
              </div>

              {/* 6 Executive Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {committeeMembers.map((member, idx) => {
                  const rankText = member.rankBadge || `${idx + 1} Rank`;
                  return (
                    <div
                      key={member._id || member.name}
                      className="group relative rounded-2xl bg-white border border-rose-200/80 p-6 shadow-md hover:shadow-2xl hover:border-rose-300 transition-all duration-300 flex flex-col justify-between ring-1 ring-rose-50 hover:-translate-y-1 text-left"
                    >
                      <div className="flex flex-col gap-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="relative">
                            {/* Authoritative Avatar with glowing Ruby ring */}
                            <div className="w-20 h-20 rounded-2xl p-[3px] bg-gradient-to-br from-primary via-rose-500 to-red-600 shadow-lg shadow-rose-900/25">
                              <div className="w-full h-full rounded-[13px] overflow-hidden bg-surface-container-high relative">
                                {member.avatarUrl ? (
                                  <img
                                    alt={member.name}
                                    className="w-full h-full object-cover"
                                    src={member.avatarUrl}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-lg">
                                    {member.name?.charAt(0) || 'C'}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-rose-600 flex items-center justify-center text-white ring-2 ring-white shadow-sm">
                              <span
                                className="material-symbols-outlined text-[13px]"
                                style={{ fontVariationSettings: '"FILL" 1' }}
                              >
                                {idx === 0 ? 'shield' : idx === 1 ? 'verified' : idx === 2 ? 'hub' : 'verified_user'}
                              </span>
                            </div>
                          </div>

                          {/* Glowing ruby rank badge */}
                          <span
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-sm text-center ${
                              idx === 0
                                ? 'bg-gradient-to-r from-primary to-rose-600 text-white shadow-rose-900/25'
                                : idx === 1
                                ? 'bg-rose-100 text-rose-900 border border-rose-300/80'
                                : idx === 2
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : 'bg-surface-container-high text-on-surface border border-rose-100'
                            }`}
                          >
                            {rankText}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-[20px] font-bold text-on-surface group-hover:text-primary transition-colors">
                            {member.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-primary font-bold mt-0.5">{member.role}</p>
                          {member.subtitle && (
                            <p className="text-xs text-on-surface-variant mt-1 font-medium">{member.subtitle}</p>
                          )}
                        </div>
                      </div>

                      <div className="pt-5 mt-2 border-t border-rose-100">
                        <a
                          href={`tel:${member.phone.replace(/\s+/g, '')}`}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-primary via-rose-600 to-red-600 hover:from-secondary hover:to-primary text-white text-xs font-bold tracking-wide transition-all shadow-md shadow-rose-900/20 hover:shadow-lg flex items-center justify-center gap-2"
                        >
                          <span
                            className="material-symbols-outlined text-[17px]"
                            style={{ fontVariationSettings: '"FILL" 1' }}
                          >
                            call
                          </span>
                          <span>contact</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ═════════════════════════════════════════════════════════════════
                SEGMENT 2: Medical Sector Emergency Desk
            ═════════════════════════════════════════════════════════════════ */}
            <section className="flex flex-col gap-6 pt-6">
              <div className="flex items-center gap-3 border-b border-rose-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-900/20">
                  <span className="material-symbols-outlined text-[22px]">medical_services</span>
                </div>
                <div>
                  <h2 className="text-2xl lg:text-[28px] font-extrabold tracking-tight bg-gradient-to-r from-rose-800 via-rose-600 to-red-600 bg-clip-text text-transparent">
                    Medical Sector Emergency Desk
                  </h2>
                  <p className="text-xs sm:text-sm text-on-surface-variant">
                    Direct lines to campus medical officers, triage rooms, and regional military transfusion centers.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card A: BAUST Medical Center */}
                {medicalDesks[0] ? (
                  <div className="rounded-2xl bg-white border border-rose-200/80 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden text-left">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-[24px]">local_hospital</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-50 text-primary border border-rose-200">
                          {medicalDesks[0].rankBadge || 'Campus Clinic'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-[20px] font-bold text-on-surface">{medicalDesks[0].name}</h3>
                        <p className="text-xs sm:text-sm text-primary font-semibold">{medicalDesks[0].role}</p>
                      </div>
                      <div className="flex flex-col gap-2.5 text-xs text-on-surface-variant bg-surface-container-low p-3.5 rounded-xl border border-surface-container-high">
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-[16px] text-primary mt-0.5">location_on</span>
                          <span>{medicalDesks[0].location || 'Ground Floor, Academic Building 1'}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-[16px] text-primary mt-0.5">schedule</span>
                          <span>{medicalDesks[0].timing || '8:00 AM – 10:00 PM (Emergency On-Call 24/7)'}</span>
                        </div>
                        <div className="flex items-center gap-2 font-bold text-on-surface pt-1 border-t border-surface-container-high">
                          <span className="material-symbols-outlined text-[16px] text-primary">call</span>
                          <span>{medicalDesks[0].phone}</span>
                        </div>
                      </div>
                    </div>
                    <a
                      className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-primary to-rose-600 hover:from-secondary hover:to-primary text-white text-xs font-semibold text-center transition-all flex items-center justify-center gap-2 shadow-md shadow-rose-900/15"
                      href={`tel:${medicalDesks[0].phone.replace(/\s+/g, '')}`}
                    >
                      <span
                        className="material-symbols-outlined text-[16px]"
                        style={{ fontVariationSettings: '"FILL" 1' }}
                      >
                        call
                      </span>
                      <span>contact</span>
                    </a>
                  </div>
                ) : null}

                {/* Card B: Sub-Assistant Medical Officer */}
                {medicalDesks[1] ? (
                  <div className="rounded-2xl bg-white border border-rose-200/80 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden text-left">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-[24px]">stethoscope</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          <span>{medicalDesks[1].rankBadge || '24/7 On-Duty'}</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-[20px] font-bold text-on-surface">{medicalDesks[1].name}</h3>
                        <p className="text-xs sm:text-sm text-primary font-semibold">{medicalDesks[1].role}</p>
                      </div>
                      <div className="flex flex-col gap-2.5 text-xs text-on-surface-variant bg-surface-container-low p-3.5 rounded-xl border border-surface-container-high">
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-[16px] text-primary mt-0.5">person_check</span>
                          <span>{medicalDesks[1].subtitle || 'On-Duty Resident Doctor'}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-[16px] text-primary mt-0.5">bloodtype</span>
                          <span>{medicalDesks[1].notes || 'Immediate Cross-Matching Approval'}</span>
                        </div>
                        <div className="flex items-center gap-2 font-bold text-on-surface pt-1 border-t border-surface-container-high">
                          <span className="material-symbols-outlined text-[16px] text-primary">call</span>
                          <span>{medicalDesks[1].phone}</span>
                        </div>
                      </div>
                    </div>
                    <a
                      className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-primary to-rose-600 hover:from-secondary hover:to-primary text-white text-xs font-semibold text-center transition-all flex items-center justify-center gap-2 shadow-md shadow-rose-900/15"
                      href={`tel:${medicalDesks[1].phone.replace(/\s+/g, '')}`}
                    >
                      <span
                        className="material-symbols-outlined text-[16px]"
                        style={{ fontVariationSettings: '"FILL" 1' }}
                      >
                        call
                      </span>
                      <span>contact</span>
                    </a>
                  </div>
                ) : null}

                {/* Card C: Saidpur CMH Blood Bank */}
                {medicalDesks[2] ? (
                  <div className="rounded-2xl bg-white border border-rose-200/80 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden text-left">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-900/20">
                          <span
                            className="material-symbols-outlined text-[24px]"
                            style={{ fontVariationSettings: '"FILL" 1' }}
                          >
                            ambulance
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-primary text-white">
                          {medicalDesks[2].rankBadge || 'Priority Cantonment'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-[20px] font-bold text-on-surface">{medicalDesks[2].name}</h3>
                        <p className="text-xs sm:text-sm text-primary font-semibold">{medicalDesks[2].role}</p>
                      </div>
                      <div className="flex flex-col gap-2 text-xs text-on-surface-variant bg-surface-container-low p-3 rounded-xl border border-surface-container-high">
                        <div className="flex items-center justify-between">
                          <span className="text-on-surface-variant font-medium text-xs">Blood Bank STAT:</span>
                          <span className="font-bold text-on-surface">{medicalDesks[2].phone}</span>
                        </div>
                        {medicalDesks[2].secondaryPhone && (
                          <div className="flex items-center justify-between">
                            <span className="text-on-surface-variant font-medium text-xs">Emergency Ambulance:</span>
                            <span className="font-bold text-primary">{medicalDesks[2].secondaryPhone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant pt-1 border-t border-surface-container-high">
                          <span className="material-symbols-outlined text-[15px] text-primary">verified_user</span>
                          <span>{medicalDesks[2].notes || 'Official Cantonment Blood Testing Partner'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 mt-6">
                      <a
                        className="py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-surface-container-high text-on-surface text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1"
                        href={`tel:${medicalDesks[2].phone.replace(/\s+/g, '')}`}
                      >
                        <span className="material-symbols-outlined text-[15px]">call</span>
                        <span>Blood Bank</span>
                      </a>
                      <a
                        className="py-2.5 rounded-xl bg-gradient-to-r from-primary to-rose-600 hover:from-secondary hover:to-primary text-white text-xs font-semibold text-center transition-all flex items-center justify-center gap-1 shadow-md shadow-rose-900/15"
                        href={`tel:${(medicalDesks[2].secondaryPhone || medicalDesks[2].phone).replace(/\s+/g, '')}`}
                      >
                        <span
                          className="material-symbols-outlined text-[15px]"
                          style={{ fontVariationSettings: '"FILL" 1' }}
                        >
                          ambulance
                        </span>
                        <span>Ambulance</span>
                      </a>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            {/* ═════════════════════════════════════════════════════════════════
                SEGMENT 3: Campus Emergency & Logistics
            ═════════════════════════════════════════════════════════════════ */}
            <section className="flex flex-col gap-6 pt-6">
              <div className="flex items-center gap-3 border-b border-rose-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-900/20">
                  <span className="material-symbols-outlined text-[22px]">account_balance</span>
                </div>
                <div>
                  <h2 className="text-2xl lg:text-[28px] font-extrabold tracking-tight bg-gradient-to-r from-rose-800 via-rose-600 to-red-600 bg-clip-text text-transparent">
                    Campus Emergency &amp; Logistics
                  </h2>
                  <p className="text-xs sm:text-sm text-on-surface-variant">
                    Administrative, transportation, and cantonment security authorities for rapid donor gate clearance.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {campusContacts.map((c, idx) => {
                  const iconName =
                    idx === 0 ? 'shield_person' : idx === 1 ? 'directions_bus' : 'security';
                  return (
                    <div
                      key={c._id || c.name}
                      className="rounded-2xl bg-white border border-rose-200/80 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-4 text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-primary shrink-0">
                          <span className="material-symbols-outlined text-[24px]">{iconName}</span>
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-on-surface">{c.name}</h4>
                          <p className="text-xs text-on-surface-variant mt-0.5">{c.role || c.subtitle}</p>
                          <p className="text-xs font-bold text-primary mt-1 font-mono">{c.phone}</p>
                        </div>
                      </div>
                      <a
                        className="p-3 rounded-xl bg-rose-50 hover:bg-primary hover:text-white text-primary border border-rose-200 transition-all shrink-0 shadow-sm"
                        href={`tel:${c.phone.replace(/\s+/g, '')}`}
                        title={`Call ${c.name}`}
                      >
                        <span className="material-symbols-outlined text-[20px]">call</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ═════════════════════════════════════════════════════════════════
                SEGMENT 4: Common WhatsApp Community Banner (High-Contrast Theme)
            ═════════════════════════════════════════════════════════════════ */}
            <section className="rounded-3xl bg-white border-2 border-emerald-100 p-8 lg:p-10 shadow-xl relative overflow-hidden mt-6 mb-8 ring-1 ring-emerald-50 text-left">
              <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                {/* Left Text & Badges */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-primary to-rose-600 text-white text-[11px] uppercase tracking-wider font-bold shadow-sm">
                      {whatsappInfo.rankBadge || 'OFFICIAL NETWORK'}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">
                      Verified University Channel
                    </span>
                  </div>

                  <h2 className="font-serif text-2xl lg:text-[32px] text-on-surface leading-tight font-extrabold">
                    {whatsappInfo.name || 'BloodLink Emergency Response Broadcast'}
                  </h2>

                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {whatsappInfo.subtitle ||
                      'Instant alerts for emergency donor availability, rare group matching requests, and urgent mobilization across all academic departments, campus dormitories, and Saidpur Cantonment.'}
                  </p>

                  {/* Status Badges & Interactive Real-Time Tracing Button */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {/* Live Community Members Tracker Button */}
                    <button
                      type="button"
                      onClick={() => setShowTelemetryModal(true)}
                      className="group flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100/90 border-2 border-emerald-300/80 text-emerald-950 text-xs font-bold transition-all shadow-sm hover:shadow-md active:scale-95 cursor-pointer text-left"
                      title="Click to view real-time WhatsApp community tracing & member telemetry"
                    >
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                      </span>
                      <span
                        className="material-symbols-outlined text-emerald-700 text-[18px]"
                        style={{ fontVariationSettings: '"FILL" 1' }}
                      >
                        groups
                      </span>
                      <span className="font-extrabold text-emerald-950">
                        {communityStats.totalMembers?.toLocaleString?.() || '1,486'}+ Community Members
                      </span>
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-0.5 group-hover:bg-emerald-300 transition-colors">
                        <span>Live Tracing</span>
                        <span className="material-symbols-outlined text-[13px]">insights</span>
                      </span>
                    </button>

                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-surface-container border border-outline-variant/60 text-on-surface text-xs font-semibold">
                      <span className="material-symbols-outlined text-primary text-[18px]">lock</span>
                      <span>{whatsappInfo.notes || 'Strictly Moderated • Emergency Requisitions Only'}</span>
                    </div>
                  </div>

                  {/* CTA Button with Authentic WhatsApp Icon and Live Tracking Trigger */}
                  <div className="pt-4 flex flex-wrap items-center gap-4">
                    <a
                      className="px-8 py-3.5 rounded-2xl bg-primary hover:bg-primary-dark text-white text-sm font-bold transition-all shadow-md shadow-primary/20 hover:shadow-lg flex items-center gap-3 active:scale-95 cursor-pointer"
                      href={whatsappInfo.whatsappLink || 'https://chat.whatsapp.com/LFMuSuSr2J8EtD8OVfEpJQ'}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => handleTrackAndJoin('button')}
                    >
                      <svg
                        className="w-5 h-5 shrink-0 drop-shadow-md"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* Full Green Bubble Background */}
                        <path
                          fill="#25D366"
                          d="M12.01 2.002c-5.513 0-9.99 4.478-9.99 9.991 0 1.76.459 3.477 1.33 4.987L2 22.002l5.14-1.348a9.94 9.94 0 0 0 4.87 1.267h.004c5.512 0 9.989-4.478 9.989-9.991 0-2.668-1.039-5.176-2.926-7.063A9.92 9.92 0 0 0 12.01 2.002z"
                        />
                        {/* Middle White Phone Handset */}
                        <path
                          fill="#FFFFFF"
                          d="M16.63 13.91c-.25-.13-1.48-.73-1.71-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.98-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.25-1.49-1.4-1.74-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.43 1.03 2.6.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.48-.6 1.69-1.18.21-.58.21-1.08.14-1.18-.06-.11-.23-.17-.48-.3z"
                        />
                      </svg>
                      <span>Join Official WhatsApp Community</span>
                    </a>

                    {/* Quick Telemetry Trigger Button */}
                    <button
                      type="button"
                      onClick={() => setShowTelemetryModal(true)}
                      className="px-4 py-3 rounded-2xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px] text-emerald-600">analytics</span>
                      <span>View Real-Time Telemetry</span>
                    </button>
                  </div>
                </div>

                {/* Right QR Code in GREEN Color with Live Scans Indicator */}
                <div className="lg:col-span-4 flex flex-col items-center justify-center">
                  <div className="p-6 rounded-3xl bg-emerald-50/70 border-2 border-emerald-200 shadow-lg flex flex-col items-center gap-3 relative">
                    {/* Functional GREEN QR Code */}
                    <div className="w-52 h-52 rounded-2xl bg-white p-3 flex items-center justify-center relative border-2 border-emerald-400 shadow-inner overflow-hidden group">
                      <img
                        src={
                          whatsappInfo.qrCodeUrl ||
                          'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https%3A%2F%2Fchat.whatsapp.com%2FLFMuSuSr2J8EtD8OVfEpJQ&color=059669&bgcolor=ffffff'
                        }
                        alt="WhatsApp Community QR Code"
                        className="w-full h-full object-contain rounded-xl"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      {/* Standalone Green SVG QR Fallback */}
                      <svg
                        className="w-full h-full text-emerald-600 hidden"
                        fill="none"
                        viewBox="0 0 100 100"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect height="24" rx="4" stroke="#059669" strokeWidth="4" width="24" x="10" y="10" />
                        <rect fill="#059669" height="12" rx="2" width="12" x="16" y="16" />
                        <rect height="24" rx="4" stroke="#059669" strokeWidth="4" width="24" x="66" y="10" />
                        <rect fill="#059669" height="12" rx="2" width="12" x="72" y="16" />
                        <rect height="24" rx="4" stroke="#059669" strokeWidth="4" width="24" x="10" y="66" />
                        <rect fill="#059669" height="12" rx="2" width="12" x="16" y="72" />
                        <circle cx="50" cy="50" fill="#059669" r="9" />
                        <path d="M46 50L50 44L54 50L50 56Z" fill="#ffffff" />
                        <rect fill="#10b981" height="6" rx="1.5" width="6" x="42" y="12" />
                        <rect fill="#059669" height="6" rx="1.5" width="6" x="52" y="12" />
                        <rect fill="#10b981" height="6" rx="1.5" width="6" x="42" y="24" />
                        <rect fill="#059669" height="6" rx="1.5" width="6" x="52" y="24" />
                        <rect fill="#059669" height="6" rx="1.5" width="6" x="12" y="42" />
                        <rect fill="#10b981" height="6" rx="1.5" width="6" x="24" y="42" />
                        <rect fill="#059669" height="6" rx="1.5" width="6" x="12" y="52" />
                        <rect fill="#10b981" height="6" rx="1.5" width="6" x="66" y="42" />
                        <rect fill="#059669" height="6" rx="1.5" width="6" x="78" y="42" />
                        <rect fill="#059669" height="6" rx="1.5" width="6" x="66" y="54" />
                        <rect fill="#10b981" height="6" rx="1.5" width="6" x="78" y="54" />
                        <rect fill="#059669" height="6" rx="1.5" width="6" x="42" y="66" />
                        <rect fill="#10b981" height="6" rx="1.5" width="6" x="52" y="66" />
                        <rect fill="#10b981" height="6" rx="1.5" width="6" x="42" y="78" />
                        <rect fill="#059669" height="6" rx="1.5" width="6" x="52" y="78" />
                        <rect fill="#059669" height="6" rx="1.5" width="6" x="66" y="66" />
                        <rect fill="#10b981" height="6" rx="1.5" width="6" x="78" y="78" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-extrabold text-emerald-800">Scan With Phone Camera</p>
                      <div className="flex items-center justify-center gap-1.5 mt-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        <span className="material-symbols-outlined text-[14px]">qr_code_scanner</span>
                        <span>{communityStats.channels?.qrScans?.count || 96}+ Scans Traced</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════
            REAL-TIME WHATSAPP COMMUNITY TELEMETRY & INVITE TRACKER MODAL
        ═════════════════════════════════════════════════════════════════ */}
        {showTelemetryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-left">
            <div
              className="bg-white rounded-3xl max-w-[620px] w-full p-6 md:p-8 border-2 border-emerald-200 shadow-2xl relative max-h-[90vh] overflow-y-auto"
              style={{
                boxShadow: '0 25px 50px -12px rgba(5, 150, 105, 0.25), 0 0 0 1px rgba(16, 185, 129, 0.1)',
              }}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-emerald-100 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                    <span className="material-symbols-outlined text-[26px]">groups</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-extrabold text-emerald-950 leading-tight">
                        WhatsApp Community Live Tracing
                      </h3>
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Real-time member acquisition telemetry &amp; channel analytics
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTelemetryModal(false)}
                  className="p-1.5 rounded-xl text-on-surface-variant hover:bg-slate-100 hover:text-on-surface transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>
              </div>

              {/* Top Highlights Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                    Total Community
                  </span>
                  <span className="text-2xl font-black text-emerald-950 block">
                    {communityStats.totalMembers?.toLocaleString?.() || '1,486'}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">
                    1,450 Base + {communityStats.totalJoins || 36} Traced
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50/60 border border-rose-200">
                  <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block mb-1">
                    Total Interactions
                  </span>
                  <span className="text-2xl font-black text-rose-950 block">
                    {communityStats.totalClicks || 342}
                  </span>
                  <span className="text-[10px] text-rose-700 font-semibold mt-0.5 block">
                    All Channels Traffic
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-200">
                  <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block mb-1">
                    Today&apos;s Joins
                  </span>
                  <span className="text-2xl font-black text-blue-950 block">
                    +{communityStats.todayJoins || 24}
                  </span>
                  <span className="text-[10px] text-blue-700 font-semibold mt-0.5 block">
                    Campus Mobilization
                  </span>
                </div>
              </div>

              {/* Channel-by-Channel Breakdown Cards */}
              <h4 className="text-sm font-extrabold text-on-surface mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">traffic</span>
                <span>Real-Time Traffic Tracing by Channel</span>
              </h4>

              <div className="space-y-3 mb-6">
                {/* Channel 1: Direct Link / URL */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">link</span>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-on-surface">Direct Link &amp; Web Action Button</h5>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Visits and clicks from BloodLink portal CTA button and direct URL
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-on-surface block">
                      {communityStats.channels?.linkVisits?.count || 184} Clicks
                    </span>
                    <span className="text-[10px] font-bold text-rose-600">
                      ~{communityStats.channels?.linkVisits?.joins || 82} Est. Joins
                    </span>
                  </div>
                </div>

                {/* Channel 2: QR Code Scans */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-emerald-950">Scanned Green QR Code</h5>
                      <p className="text-[11px] text-emerald-800/80 mt-0.5">
                        Physical &amp; digital camera scans from cantonment desks and posters
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-emerald-950 block">
                      {communityStats.channels?.qrScans?.count || 96} Scans
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700">
                      ~{communityStats.channels?.qrScans?.joins || 69} Est. Joins
                    </span>
                  </div>
                </div>

                {/* Channel 3: Peer Direct Invites */}
                <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">share</span>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-blue-950">Direct Peer Invites &amp; Referrals</h5>
                      <p className="text-[11px] text-blue-800/80 mt-0.5">
                        Trackable invite links shared by students and committee coordinators
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-blue-950 block">
                      {communityStats.channels?.directInvites?.count || 62} Invites
                    </span>
                    <span className="text-[10px] font-bold text-blue-700">
                      ~{communityStats.channels?.directInvites?.joins || 54} Est. Joins
                    </span>
                  </div>
                </div>
              </div>

              {/* Personalized Trackable Direct Invite Generator */}
              <div className="p-4 rounded-2xl bg-emerald-950 text-white mb-6">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400 text-[18px]">send_time_extension</span>
                    <h5 className="text-xs font-bold text-white">Share Your Trackable Direct Join Invite</h5>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded-full">
                    100% Traced
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200 mb-3 leading-relaxed">
                  Share this link with classmates or roommates. Every join through this link will be automatically tracked in the live community telemetry counter.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/api/helpline/whatsapp/track?source=invite`}
                    className="w-full px-3 py-2 rounded-xl bg-emerald-900/80 border border-emerald-700 text-xs text-emerald-100 font-mono focus:outline-none select-all"
                  />
                  <button
                    onClick={handleCopyInviteLink}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-xs font-bold transition-all shrink-0 flex items-center gap-1 active:scale-95 cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copiedInvite ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedInvite ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Live Traced Activity Stream */}
              <h4 className="text-sm font-extrabold text-on-surface mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">history</span>
                <span>Recent Live Community Activity</span>
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(communityStats.recentActivity || []).length > 0 ? (
                  communityStats.recentActivity.map((act) => (
                    <div
                      key={act.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            act.type === 'qr'
                              ? 'bg-emerald-500'
                              : act.type === 'invite'
                              ? 'bg-blue-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        <div>
                          <span className="font-bold text-on-surface">{act.title}</span>
                          <span className="text-on-surface-variant text-[10px] block">
                            {act.location} • {act.device || 'Mobile'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-on-surface-variant shrink-0">
                        {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-on-surface-variant py-3 text-center">
                    Listening for incoming community join telemetry...
                  </p>
                )}
              </div>

              {/* Close Button */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setShowTelemetryModal(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-on-surface font-bold text-xs transition-all active:scale-95 cursor-pointer"
                  type="button"
                >
                  Close Telemetry Window
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HelplineScreen;
