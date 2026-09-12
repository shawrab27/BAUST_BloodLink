import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'BOMBAY'];

// Campus Top Donors Leaderboard Data
const CAMPUS_LEADERBOARD = [
  { rank: 1, name: 'Dr. Mahfuzur Rahman', department: 'CSE', userType: 'Teacher', bloodGroup: 'O+', donations: 7, tier: 'Gold' },
  { rank: 2, name: 'Farzana Yeasmin', department: 'CE', userType: 'Student', bloodGroup: 'A-', donations: 5, tier: 'Silver' },
  { rank: 3, name: 'Tanvir Ahmed', department: 'CSE', userType: 'Student', bloodGroup: 'B+', donations: 4, tier: 'Bronze' },
  { rank: 4, name: 'Rakibul Hasan', department: 'AIS', userType: 'Student', bloodGroup: 'AB-', donations: 4, tier: 'Bronze' },
  { rank: 5, name: 'Shamima Akter', department: 'ME', userType: 'Student', bloodGroup: 'AB+', donations: 3, tier: 'Honor Roll' },
  { rank: 6, name: 'Tahmina Sultana', department: 'BBA', userType: 'Teacher', bloodGroup: 'B-', donations: 3, tier: 'Honor Roll' },
  { rank: 7, name: 'Nusrat Jahan Mim', department: 'EEE', userType: 'Student', bloodGroup: 'A+', donations: 2, tier: 'Volunteer' },
];

function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuth();
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  // Blood group verification request state
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [requestedGroup, setRequestedGroup] = useState('O+');
  const [changeReason, setChangeReason] = useState('');
  const [labReportUrl, setLabReportUrl] = useState('');
  const [activeChangeRequest, setActiveChangeRequest] = useState(null);
  const [isSubmittingChange, setIsSubmittingChange] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchChangeRequest = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/auth/blood-group-change-request', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setActiveChangeRequest(data.request);
        }
      } catch (err) {
        console.error('Error fetching change request:', err);
      }
    };
    fetchChangeRequest();
  }, [isAuthenticated]);

  const handleSubmitChangeRequest = async (e) => {
    e.preventDefault();
    setChangeError('');
    setChangeSuccess('');
    setIsSubmittingChange(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/blood-group-change-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestedGroup,
          reason: changeReason.trim(),
          note: changeReason.trim(),
          labReportUrl: labReportUrl.trim(),
          documentUrl: labReportUrl.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit blood group verification request');
      }

      setActiveChangeRequest(data.request);
      setChangeSuccess('Verification request submitted for Admin review.');
      setTimeout(() => {
        setChangeModalOpen(false);
        setChangeSuccess('');
      }, 1500);
    } catch (err) {
      setChangeError(err.message);
    } finally {
      setIsSubmittingChange(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="page-wrapper max-w-[800px] mx-auto text-center py-16">
        <div className="glass-card p-space-xl">
          <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto mb-space-md flex items-center justify-center">
            <span className="material-symbols-outlined text-[40px] text-primary">
              account_circle
            </span>
          </div>
          <h2 className="text-headline-md font-bold text-on-surface">Sign In Required</h2>
          <p className="text-body-md text-on-surface-variant mt-2 max-w-md mx-auto">
            Please sign in with your institutional credentials to access your donor profile, donation
            records, and settings.
          </p>
          <div className="flex justify-center gap-space-md mt-6">
            <Link to="/login" className="btn-primary" id="profile-signin-btn">
              <span className="material-symbols-outlined text-[18px]">login</span>
              Sign In
            </Link>
            <Link to="/register" className="btn-secondary" id="profile-register-btn">
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isEligible = user.isDonorEligible !== false;
  const donationCount = user.totalDonations || user.donationCount || 9;
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'timeline'
  const [newPostContent, setNewPostContent] = useState('');
  const [userPosts, setUserPosts] = useState([
    {
      id: 'p-1',
      author: user.name,
      time: '2 days ago',
      content: 'Successfully responded to the emergency B+ requisition at CMH Saidpur. Proud to support our campus community!',
      likes: 18,
      comments: 4,
    },
    {
      id: 'p-2',
      author: user.name,
      time: '3 weeks ago',
      content: 'Reminder for CSE Department: Blood donation camp scheduled for next Monday at SAC Room 204. Please register if eligible!',
      likes: 24,
      comments: 7,
    },
  ]);

  // Verified donation timeline for demonstrated user profile
  const donationHistory = [
    {
      id: 'dh-1',
      date: '2026-06-15',
      reqId: 'REQ-2026-0841',
      facility: 'CMH Saidpur Cantonment',
      recipientType: 'Emergency Surgery Requisition',
      units: 1,
      verified: true,
    },
    {
      id: 'dh-2',
      date: '2026-01-20',
      reqId: 'REQ-2026-0112',
      facility: 'BAUST Campus Medical Center',
      recipientType: 'Voluntary Campus Blood Drive',
      units: 1,
      verified: true,
    },
    {
      id: 'dh-3',
      date: '2025-08-14',
      reqId: 'REQ-2025-0729',
      facility: 'Rangpur Medical College Hospital',
      recipientType: 'Thalassemia Patient Support',
      units: 1,
      verified: true,
    },
  ];

  const handleCreateTimelinePost = (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    const newP = {
      id: 'p-' + Date.now(),
      author: user.name,
      time: 'Just now',
      content: newPostContent.trim(),
      likes: 0,
      comments: 0,
    };
    setUserPosts([newP, ...userPosts]);
    setNewPostContent('');
  };

  return (
    <div className="page-wrapper max-w-[1140px] mx-auto pb-16 space-y-6">
      {/* ── HERO PROFILE HEADER ── */}
      <div className="glass-card p-6 rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/10 via-surface-container to-surface-container-low relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          {/* Avatar & User Info */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-primary-container flex items-center justify-center ring-4 ring-primary/30 shadow-md">
                <span
                  className="material-symbols-outlined text-[52px] text-on-primary-container"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  account_circle
                </span>
              </div>
              <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center ring-2 ring-surface shadow-sm">
                <span className="material-symbols-outlined text-[16px]">verified</span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black text-on-surface">{user.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-white shadow-sm">
                  {user.bloodGroup} Positive
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">trophy</span>
                  #3 Campus Donor
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-1.5 flex-wrap">
                <span className="font-mono bg-surface-container-high px-2 py-0.5 rounded border border-outline-variant/30">
                  ID: {user.institutionalId}
                </span>
                <span>•</span>
                <span className="font-medium text-on-surface">{user.department} Department</span>
                <span>•</span>
                <span className="font-medium">{user.userType || 'Student'}</span>
                {user.email && (
                  <>
                    <span>•</span>
                    <span className="text-on-surface-variant">{user.email}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <div className="px-4 py-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 text-center min-w-[100px] shadow-sm">
              <span className="text-xs font-bold text-on-surface-variant block">Donations</span>
              <span className="text-xl font-black text-primary">{donationCount} Bags</span>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 text-center min-w-[100px] shadow-sm">
              <span className="text-xs font-bold text-on-surface-variant block">Impact</span>
              <span className="text-xl font-black text-primary">{donationCount * 3} Lives</span>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 text-center min-w-[100px] shadow-sm">
              <span className="text-xs font-bold text-on-surface-variant block">Status</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                {isEligible ? 'Eligible Now' : 'In Cooldown'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT 2 COLS: 2-TAB CONTENT (Donations History + Timeline Posts) ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Tab Switcher */}
          <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-2">
            <button
              onClick={() => setActiveTab('history')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">history</span>
              <span>Donation History ({donationHistory.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'timeline'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">dynamic_feed</span>
              <span>Timeline &amp; Posts ({userPosts.length})</span>
            </button>
          </div>

          {/* TAB 1: Donation History */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="glass-panel p-5 rounded-2xl border border-outline-variant/30 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
                    Verified Clinical Donations
                  </h3>
                  <span className="text-xs text-on-surface-variant">
                    All records certified by BAUST Medical Officer
                  </span>
                </div>

                <div className="space-y-3">
                  {donationHistory.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between flex-wrap gap-3 hover:border-primary/40 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm flex-shrink-0">
                          0{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-on-surface">{item.facility}</span>
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-primary/10 text-primary flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[12px]">verified</span>
                              Verified
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-0.5 flex-wrap">
                            <span className="font-mono text-primary font-semibold">{item.reqId}</span>
                            <span>•</span>
                            <span>{item.recipientType}</span>
                            <span>•</span>
                            <span>{new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-xl bg-primary/10 text-primary font-bold text-xs">
                          {item.units} Unit
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Timeline & Posts */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {/* Quick Post Composer */}
              <div className="glass-card p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
                <form onSubmit={handleCreateTimelinePost} className="space-y-3">
                  <textarea
                    rows={2}
                    placeholder="Share a blood donation experience or community update..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                  <div className="flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={!newPostContent.trim()}
                      className="btn-primary py-1.5 px-4 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[15px]">send</span>
                      <span>Post Update</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* User Posts List */}
              <div className="space-y-3">
                {userPosts.map((p) => (
                  <div
                    key={p.id}
                    className="glass-card p-4 rounded-2xl border border-outline-variant/30 space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-on-surface">{p.author}</span>
                        <span className="text-[11px] text-on-surface-variant">• {p.time}</span>
                      </div>
                    </div>
                    <p className="text-xs text-on-surface leading-relaxed">{p.content}</p>
                    <div className="flex items-center gap-4 pt-2 border-t border-outline-variant/20 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1 hover:text-primary cursor-pointer">
                        <span className="material-symbols-outlined text-[16px] text-primary">favorite</span>
                        <span>{p.likes} Loves</span>
                      </span>
                      <span className="flex items-center gap-1 hover:text-primary cursor-pointer">
                        <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                        <span>{p.comments} Comments</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT 1 COL: Profile Settings, Leaderboard Widget, & Clearance Pass ── */}
        <div className="space-y-5">
          {/* Locked Blood Group & Change Request */}
          <div className="glass-card p-5 rounded-2xl border border-outline-variant/30 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">bloodtype</span>
                Institutional Blood Record
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-[12px]">lock</span>
                Locked
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-on-surface-variant block">Registered Group</span>
                <span className="text-2xl font-black text-primary font-mono">{user.bloodGroup}</span>
              </div>
              <span className="text-[10px] font-semibold text-on-surface-variant bg-surface-container px-2 py-1 rounded">
                {user.isBloodGroupVerified ? 'Lab Verified' : 'Registered Record'}
              </span>
            </div>

            {activeChangeRequest && activeChangeRequest.status === 'Pending' ? (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-amber-600">schedule</span>
                <span>Change Request Pending Review: <strong>{activeChangeRequest.requestedGroup}</strong></span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setChangeModalOpen(true)}
                className="btn-outline w-full py-2 text-xs font-bold text-primary border-primary/30 hover:bg-primary/5 flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px]">edit_document</span>
                <span>Request Blood Group Update</span>
              </button>
            )}

            <p className="text-[10px] text-on-surface-variant/80 leading-relaxed">
              Updates require an official BloodGroupChangeRequest document and verification from the Medical Desk.
            </p>
          </div>

          {/* Campus Top Donors Widget */}
          <div className="glass-card p-5 rounded-2xl border border-outline-variant/30 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-amber-500">trophy</span>
                Campus Champions
              </h3>
              <button
                onClick={() => setLeaderboardOpen(true)}
                className="text-[11px] text-primary font-bold hover:underline"
              >
                View Full
              </button>
            </div>

            <div className="space-y-2">
              {CAMPUS_LEADERBOARD.slice(0, 3).map((donor) => (
                <div
                  key={donor.rank}
                  className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${
                        donor.rank === 1
                          ? 'bg-amber-500 text-white'
                          : donor.rank === 2
                          ? 'bg-slate-400 text-white'
                          : 'bg-amber-700 text-white'
                      }`}
                    >
                      {donor.rank}
                    </span>
                    <div>
                      <span className="font-bold text-on-surface block text-[11px]">{donor.name}</span>
                      <span className="text-[10px] text-on-surface-variant">{donor.department} • {donor.bloodGroup}</span>
                    </div>
                  </div>
                  <span className="font-mono font-extrabold text-primary text-xs">{donor.donations} Bags</span>
                </div>
              ))}
            </div>
          </div>

          {/* Medical Clearance Pass */}
          <div className="glass-card p-5 rounded-2xl border border-outline-variant/30 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-500">health_and_safety</span>
                Medical Clearance Pass
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Safe donation interval is monitored automatically. Last clinical check-up passed at BAUST Medical Center.
            </p>
            <div className="pt-2 border-t border-outline-variant/20">
              <button
                onClick={logout}
                className="btn-outline w-full py-1.5 text-xs font-bold text-on-surface hover:text-primary flex items-center justify-center gap-1"
                id="profile-logout-btn"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── CAMPUS LEADERBOARD MODAL ── */}
      {leaderboardOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="glass-modal max-w-[560px] w-full p-6 rounded-2xl border border-primary/30 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-[24px]">trophy</span>
                <div>
                  <h3 className="font-bold text-base text-on-surface">BAUST Blood Champions Leaderboard</h3>
                  <span className="text-xs text-on-surface-variant">Ranked by verified units donated</span>
                </div>
              </div>
              <button
                onClick={() => setLeaderboardOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
              {CAMPUS_LEADERBOARD.map((donor) => {
                const isTop3 = donor.rank <= 3;
                return (
                  <div
                    key={donor.rank}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      donor.rank === 1
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : donor.rank === 2
                        ? 'bg-slate-300/10 border-slate-300/30'
                        : donor.rank === 3
                        ? 'bg-amber-700/10 border-amber-700/30'
                        : 'bg-surface-container-lowest border-outline-variant/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                          donor.rank === 1
                            ? 'bg-amber-500 text-white shadow-sm'
                            : donor.rank === 2
                            ? 'bg-slate-400 text-white'
                            : donor.rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        {donor.rank}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-on-surface">{donor.name}</span>
                          <span className="blood-group-chip text-[9px] px-1">{donor.bloodGroup}</span>
                        </div>
                        <span className="text-[11px] text-on-surface-variant">
                          {donor.department} · {donor.userType}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-primary text-sm block leading-none">
                        {donor.donations}
                      </span>
                      <span className="text-[10px] font-semibold text-on-surface-variant">Donations</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-outline-variant/20 text-center">
              <button
                onClick={() => setLeaderboardOpen(false)}
                className="btn-primary py-2 px-6 text-xs font-bold"
              >
                Close Leaderboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BLOOD GROUP VERIFICATION REQUEST MODAL ── */}
      {changeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="glass-modal max-w-[480px] w-full p-6 rounded-2xl border border-primary/30 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">verified_user</span>
                <div>
                  <h3 className="font-bold text-base text-on-surface">Request Blood Group Verification</h3>
                  <span className="text-xs text-on-surface-variant">Submit official change for Administrator review</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChangeModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {changeError && (
              <div className="p-3 rounded-lg bg-error-container text-on-error-container text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{changeError}</span>
              </div>
            )}

            {changeSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>{changeSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitChangeRequest} className="space-y-4 text-xs">
              <div>
                <label className="block text-on-surface-variant font-semibold mb-1">
                  Current Blood Group
                </label>
                <input
                  type="text"
                  value={user.bloodGroup}
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 font-mono font-bold text-on-surface"
                />
              </div>

              <div>
                <label className="block text-on-surface-variant font-semibold mb-1">
                  Correct / Requested Blood Group *
                </label>
                <select
                  value={requestedGroup}
                  onChange={(e) => setRequestedGroup(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60 font-mono font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-on-surface-variant font-semibold mb-1">
                  Reason for Correction / Change *
                </label>
                <textarea
                  rows={2}
                  required
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="e.g., Initial registration typo, new verified hospital lab test report"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-on-surface-variant font-semibold mb-1">
                  Lab Report Document / Evidence URL (Optional)
                </label>
                <input
                  type="url"
                  value={labReportUrl}
                  onChange={(e) => setLabReportUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or cloud report link"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-[10px] text-on-surface-variant block mt-1">
                  Admins will review the medical report before updating your institutional record.
                </span>
              </div>

              <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setChangeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-outline-variant/40 text-on-surface font-semibold hover:bg-surface-container-low"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingChange}
                  className="btn-primary py-2 px-5 font-bold flex items-center gap-1.5"
                >
                  {isSubmittingChange ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[15px]">send</span>
                      <span>Submit for Review</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileScreen;
