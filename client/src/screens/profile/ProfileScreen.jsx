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
          labReportUrl: labReportUrl.trim(),
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
  const donationCount = user.totalDonations || user.donationCount || 0;

  // Mock donation timeline for demonstrated user profile
  const donationHistory = [
    {
      id: 'dh-1',
      date: '2026-06-15',
      facility: 'CMH Saidpur Cantonment',
      recipientType: 'Civilian Emergency',
      units: 1,
      verified: true,
    },
    {
      id: 'dh-2',
      date: '2026-01-20',
      facility: 'BAUST Campus Medical Center',
      recipientType: 'Voluntary Campus Drive',
      units: 1,
      verified: true,
    },
  ];

  return (
    <div className="page-wrapper max-w-[1140px] mx-auto pb-16">
      {/* Top Header */}
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="section-heading">
            <span
              className="material-symbols-outlined text-[26px] text-primary"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              account_circle
            </span>
            Donor Profile &amp; Registry
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Verified institutional identity, donation credentials, and campus recognition
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Leaderboard Trigger Button */}
          <button
            onClick={() => setLeaderboardOpen(true)}
            className="btn-outline py-2 px-4 text-xs font-bold flex items-center gap-1.5 shadow-sm text-primary hover:bg-primary/10 border-primary/30"
          >
            <span className="material-symbols-outlined text-[18px] text-amber-500">trophy</span>
            <span>Campus Leaderboard</span>
          </button>

          <span
            className={`status-pill ${
              isEligible ? 'status-pill-success' : 'status-pill-warning'
            }`}
          >
            <span className="status-dot" />
            {isEligible ? 'Eligible to Donate' : 'In 90-Day Cooldown'}
          </span>

          {user.isDisasterVolunteer && (
            <span className="px-3 py-1 rounded-full text-label-sm font-semibold bg-primary text-on-primary shadow-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">emergency</span>
              Disaster Volunteer
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ── LEFT: Identity & Locked Blood Group Card ── */}
        <div className="col-span-1">
          <div className="glass-card p-6 text-center rounded-2xl border border-outline-variant/30 shadow-sm">
            <div className="w-20 h-20 rounded-full bg-primary-container mx-auto mb-4 flex items-center justify-center ring-4 ring-primary/20 shadow-sm">
              <span
                className="material-symbols-outlined text-[40px] text-on-primary-container"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                account_circle
              </span>
            </div>

            <h2 className="text-lg font-bold text-on-surface">{user.name}</h2>
            <p className="text-xs font-mono text-on-surface-variant mt-0.5 tracking-wider">
              {user.institutionalId}
            </p>

            {/* Locked Blood Group Banner */}
            <div className="mt-4 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-on-surface flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-primary">bloodtype</span>
                  Blood Group
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  <span className="material-symbols-outlined text-[12px]">lock</span>
                  Locked
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xl font-black text-primary font-mono">{user.bloodGroup}</span>
                <span className="text-[10px] text-on-surface-variant bg-surface-container-lowest px-2 py-0.5 rounded border border-outline-variant/30">
                  {user.isBloodGroupVerified ? 'Lab Verified' : 'Registered'}
                </span>
              </div>

              {/* Active Pending Request Indicator or Action Button */}
              {activeChangeRequest && activeChangeRequest.status === 'Pending' ? (
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-700 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-amber-600">schedule</span>
                  <span>Pending Admin Review: Requested <strong>{activeChangeRequest.requestedGroup}</strong></span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setChangeModalOpen(true)}
                  className="btn-outline w-full py-1 text-[11px] font-bold text-primary border-primary/30 hover:bg-primary/5 flex items-center justify-center gap-1 mt-1"
                >
                  <span className="material-symbols-outlined text-[13px]">edit</span>
                  <span>Request Group Update</span>
                </button>
              )}

              <p className="text-[10px] text-on-surface-variant/80 leading-snug pt-1 border-t border-outline-variant/20">
                Blood group is locked after initial registration. Changes create an official BloodGroupChangeRequest document for Admin review.
              </p>
            </div>

            <div className="space-y-2.5 text-left mt-5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Department</span>
                <span className="font-semibold text-on-surface">{user.department}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Role</span>
                <span className="font-semibold text-on-surface">{user.userType || 'Student'}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Gender</span>
                <span className="font-semibold text-on-surface">{user.gender}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Email</span>
                <span className="font-medium text-on-surface truncate max-w-[160px]" title={user.email}>
                  {user.email}
                </span>
              </div>

              {user.phone && (
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Phone</span>
                  <span className="font-medium text-on-surface">{user.phone}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Availability</span>
                <span
                  className={`font-semibold ${
                    user.availabilityStatus === 'Available' ? 'text-primary' : 'text-on-surface-variant'
                  }`}
                >
                  {user.availabilityStatus || 'Available'}
                </span>
              </div>

              {/* Student Details */}
              {user.userType === 'Student' && user.studentDetails && (
                <>
                  <div className="border-t border-outline-variant/20 my-2" />
                  {user.studentDetails.batch && (
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Batch</span>
                      <span className="font-medium text-on-surface">{user.studentDetails.batch}</span>
                    </div>
                  )}
                  {user.studentDetails.session && (
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Session</span>
                      <span className="font-medium text-on-surface">{user.studentDetails.session}</span>
                    </div>
                  )}
                </>
              )}

              {/* Teacher Details */}
              {user.userType === 'Teacher' && user.teacherDetails && (
                <>
                  <div className="border-t border-outline-variant/20 my-2" />
                  {user.teacherDetails.designation && (
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Designation</span>
                      <span className="font-medium text-on-surface">{user.teacherDetails.designation}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <button
              onClick={logout}
              className="btn-outline w-full mt-6 text-xs justify-center py-2 text-primary border-primary/30 hover:bg-primary/5"
              id="profile-logout-btn"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* ── RIGHT: Donation Stats & Timeline ── */}
        <div className="col-span-2 space-y-5">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-panel rounded-2xl p-4 text-center border border-outline-variant/30 shadow-sm">
              <span
                className="material-symbols-outlined text-[24px] text-primary"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                favorite
              </span>
              <p className="text-2xl font-black text-on-surface mt-1">{donationCount}</p>
              <p className="text-xs text-on-surface-variant font-medium">Completed Donations</p>
            </div>

            <div className="glass-panel rounded-2xl p-4 text-center border border-outline-variant/30 shadow-sm">
              <span
                className="material-symbols-outlined text-[24px] text-primary"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                volunteer_activism
              </span>
              <p className="text-2xl font-black text-on-surface mt-1">{donationCount * 3 || 0}</p>
              <p className="text-xs text-on-surface-variant font-medium">Lives Impacted</p>
            </div>

            <div className="glass-panel rounded-2xl p-4 text-center border border-outline-variant/30 shadow-sm">
              <span
                className="material-symbols-outlined text-[24px] text-primary"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                timer
              </span>
              <p className="text-sm font-bold text-on-surface mt-2.5">
                {isEligible ? 'Ready to Donate' : 'Cooldown Active'}
              </p>
              <p className="text-xs text-on-surface-variant font-medium mt-1">90-Day Safe Interval</p>
            </div>
          </div>

          {/* Donation History Timeline */}
          <div className="glass-panel rounded-2xl p-5 border border-outline-variant/30 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">history</span>
                Verified Donation History
              </h3>
              <span className="text-xs text-on-surface-variant">
                {donationHistory.length} {donationHistory.length === 1 ? 'record' : 'records'}
              </span>
            </div>

            <div className="space-y-3">
              {donationHistory.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/25 flex items-center justify-between text-xs transition hover:border-primary/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-on-surface">{item.facility}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary/10 text-primary flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[12px]">verified</span>
                          Verified
                        </span>
                      </div>
                      <span className="text-[11px] text-on-surface-variant block mt-0.5">
                        {item.recipientType} · {new Date(item.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <span className="blood-group-chip text-xs px-2 py-0.5 font-bold">
                    {item.units} Bag
                  </span>
                </div>
              ))}
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
