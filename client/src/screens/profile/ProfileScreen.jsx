import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AvatarPickerModal from '../../components/profile/AvatarPickerModal';

const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

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

const FEELING_OPTIONS = [
  { type: 'Grateful', emoji: '😊', label: 'Feeling Grateful' },
  { type: 'Proud', emoji: '🩸', label: 'Feeling Proud' },
  { type: 'Energized', emoji: '⚡', label: 'Feeling Energized' },
  { type: 'Hopeful', emoji: '🌟', label: 'Feeling Hopeful' },
  { type: 'Ready to Donate', emoji: '💪', label: 'Ready to Donate' },
];

function ProfileScreen() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  // Tab switcher state ('history' | 'timeline' | 'settings')
  const [activeTab, setActiveTab] = useState('history');

  // Timeline posts state
  const [userPosts, setUserPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState('');
  const [selectedFeeling, setSelectedFeeling] = useState(null);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // Settings & Emergency notification state
  const [emergencyNotify, setEmergencyNotify] = useState(true);
  const [isVolunteer, setIsVolunteer] = useState(user?.isDisasterVolunteer || false);
  const [availability, setAvailability] = useState(user?.availabilityStatus || 'Available');
  const [lastDonation, setLastDonation] = useState(
    user?.lastDonationDate ? new Date(user.lastDonationDate).toISOString().split('T')[0] : ''
  );
  const [phoneInput, setPhoneInput] = useState(user?.phone || '');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');

  // Blood group verification request state
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [requestedGroup, setRequestedGroup] = useState('O+');
  const [changeReason, setChangeReason] = useState('');
  const [labReportUrl, setLabReportUrl] = useState('');
  const [activeChangeRequest, setActiveChangeRequest] = useState(null);
  const [isSubmittingChange, setIsSubmittingChange] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');

  // Sync state when user object loads/changes
  useEffect(() => {
    if (user) {
      setIsVolunteer(user.isDisasterVolunteer || false);
      setAvailability(user.availabilityStatus || 'Available');
      setPhoneInput(user.phone || '');
      if (user.lastDonationDate) {
        setLastDonation(new Date(user.lastDonationDate).toISOString().split('T')[0]);
      }
    }
  }, [user]);

  // Fetch user's timeline posts
  const fetchUserTimelinePosts = async () => {
    if (!user) return;
    setPostsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = user._id || user.id || user.userId;
      const res = await fetch(`/api/posts?author=${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setUserPosts(data.posts || []);
      }
    } catch (err) {
      console.error('Error fetching user timeline posts:', err);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserTimelinePosts();
    }
  }, [isAuthenticated, user?._id, user?.id]);

  // Fetch pending change requests
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

  // Handle avatar save
  const handleSaveAvatar = async (avatarUrl) => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/auth/avatar', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ avatarUrl }),
    });
    if (!res.ok) {
      throw new Error('Failed to update avatar');
    }
    const data = await res.json();
    if (data.user) {
      updateUser(data.user);
    }
  };

  // Handle post creation with media and feeling
  const handleCreateTimelinePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setIsSubmittingPost(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newPostContent.trim(),
          mediaUrl: newPostMedia.trim() || null,
          feeling: selectedFeeling,
        }),
      });

      if (!res.ok) throw new Error('Failed to create timeline post');
      const data = await res.json();
      if (data.post) {
        setUserPosts([data.post, ...userPosts]);
        setNewPostContent('');
        setNewPostMedia('');
        setSelectedFeeling(null);
      }
    } catch (err) {
      alert(err.message || 'Error publishing post');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Handle post deletion
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this timeline post?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUserPosts(userPosts.filter((p) => p._id !== postId && p.id !== postId));
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  // Handle profile settings update
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSuccess('');
    setSettingsError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: phoneInput.trim(),
          isDisasterVolunteer: isVolunteer,
          availabilityStatus: availability,
          lastDonationDate: lastDonation ? new Date(lastDonation).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save settings');

      if (data.user) {
        updateUser(data.user);
      }
      setSettingsSuccess('Emergency notifications and donation profile updated successfully!');
      setTimeout(() => setSettingsSuccess(''), 3000);
    } catch (err) {
      setSettingsError(err.message || 'Error saving settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handle blood group verification request
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
            <span className="material-symbols-outlined text-[40px] text-primary">account_circle</span>
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

  const isGuest = user && (user.accountStatus === 'Guest' || user.isGuest === true);
  const isEligible = user.isDonorEligible !== false;
  const donationCount = user.totalDonations || user.donationCount || 0;

  // Calculate days remaining in cooldown if applicable
  let cooldownDaysLeft = 0;
  if (user.lastDonationDate) {
    const lastDate = new Date(user.lastDonationDate);
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;
    const diff = ninetyDays - (Date.now() - lastDate.getTime());
    if (diff > 0) {
      cooldownDaysLeft = Math.ceil(diff / (24 * 60 * 60 * 1000));
    }
  }

  // If user is a Guest, render the dedicated Guest profile without blood group/donation records
  if (isGuest) {
    return (
      <div className="page-wrapper max-w-[1140px] mx-auto px-3 sm:px-6 lg:px-8 pb-16 space-y-6">
        {/* ── GUEST HERO PROFILE HEADER ── */}
        <div className="glass-card p-4 sm:p-6 rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/5 via-surface-container to-surface-container-low relative overflow-hidden shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4 sm:gap-5 min-w-0">
              <button
                type="button"
                onClick={() => setAvatarModalOpen(true)}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm flex-shrink-0 group relative overflow-hidden cursor-pointer"
                title="Click to choose avatar"
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Guest Avatar" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <span className="material-symbols-outlined text-[36px] sm:text-[44px]">person</span>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                </div>
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-on-surface truncate">{user.name || 'Guest Explorer'}</h1>
                  <span className="px-2.5 sm:px-3 py-0.5 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/30 shrink-0">
                    Guest Mode
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 text-xs text-on-surface-variant mt-1.5 flex-wrap">
                  <span>Public Access Session</span>
                  {user.email && (
                    <>
                      <span>•</span>
                      <span className="text-on-surface truncate">{user.email}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto">
              <button
                onClick={logout}
                className="btn-outline py-2 px-5 text-xs font-bold flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                id="guest-signout-btn"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── GUEST NOTICE & UPGRADE CARDS ── */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-primary/20 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <span className="material-symbols-outlined text-[20px]">info</span>
            <span>Guest Profile Overview</span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            You are browsing BloodLink in Guest Mode. Guests can explore the community feed, public donor registry, and emergency helpline. Institutional donor data (blood group, donation records, eligibility pass) are reserved for verified BAUST students, faculty, and staff.
          </p>
        </div>

        {/* ── UPGRADE ACTIONS GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          <div className="glass-card p-5 sm:p-6 rounded-2xl border border-primary/30 flex flex-col justify-between space-y-4 hover:border-primary transition-all shadow-sm">
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[24px]">person_add</span>
              </div>
              <h3 className="font-bold text-sm text-on-surface">Create BAUST Account</h3>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                Register with your institutional student/faculty ID to declare your blood group, become a campus donor, and request blood.
              </p>
            </div>
            <button
              type="button"
              id="guest-create-account-btn"
              onClick={async () => {
                await logout();
                navigate('/register');
              }}
              className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md min-h-[42px]"
            >
              <span>Create Account</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          <div className="glass-card p-5 sm:p-6 rounded-2xl border border-outline-variant/40 flex flex-col justify-between space-y-4 hover:border-primary transition-all shadow-sm">
            <div>
              <div className="w-12 h-12 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[24px]">login</span>
              </div>
              <h3 className="font-bold text-sm text-on-surface">Sign In with BAUST ID</h3>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                Already registered with your institutional credentials? Log in directly to view your blood records and manage donations.
              </p>
            </div>
            <button
              type="button"
              id="guest-login-btn"
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className="btn-outline w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:border-primary hover:text-primary min-h-[42px]"
            >
              <span>Log In</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          <div className="glass-card p-5 sm:p-6 rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/5 via-white to-secondary/5 flex flex-col justify-between space-y-4 hover:border-primary transition-all shadow-md">
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center mb-3 shadow-md">
                <span className="material-symbols-outlined text-[24px]">badge</span>
              </div>
              <h3 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                <span>Complete Campus Profile</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-primary/10 text-primary uppercase">Recommended</span>
              </h3>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                Link your department, batch, and blood group to this session to complete your institutional verification.
              </p>
            </div>
            <button
              type="button"
              id="guest-complete-profile-btn"
              onClick={() => navigate('/complete-profile')}
              className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg min-h-[42px]"
            >
              <span>Complete Profile</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Avatar Picker Modal */}
        <AvatarPickerModal
          isOpen={avatarModalOpen}
          currentAvatarUrl={user.avatarUrl}
          onClose={() => setAvatarModalOpen(false)}
          onSave={handleSaveAvatar}
        />
      </div>
    );
  }

  // Verified donation timeline for demonstrated user profile
  const donationHistory = [
    {
      id: 'dh-1',
      date: user.lastDonationDate || '2026-06-15',
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

  return (
    <div className="page-wrapper max-w-[1140px] mx-auto px-3 sm:px-6 lg:px-8 pb-16 space-y-6">
      {/* ── HERO PROFILE HEADER ── */}
      <div className="glass-card p-4 sm:p-6 rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/10 via-surface-container to-surface-container-low relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6 relative z-10">
          {/* Avatar & User Info */}
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            <div className="relative group cursor-pointer flex-shrink-0" onClick={() => setAvatarModalOpen(true)}>
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-primary-container flex items-center justify-center ring-4 ring-primary/40 shadow-md overflow-hidden relative">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span
                    className="material-symbols-outlined text-[44px] sm:text-[52px] text-on-primary-container"
                    style={{ fontVariationSettings: '"FILL" 1' }}
                  >
                    account_circle
                  </span>
                )}
                {/* Hover Camera Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white gap-0.5">
                  <span className="material-symbols-outlined text-[22px] sm:text-[24px]">photo_camera</span>
                  <span className="text-[10px] font-bold">Edit Avatar</span>
                </div>
              </div>

              <span className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary text-white flex items-center justify-center ring-2 ring-surface shadow-sm" title="Verified Campus Donor">
                <span className="material-symbols-outlined text-[14px] sm:text-[16px]">verified</span>
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-on-surface truncate">{user.name}</h1>
                <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-white shadow-sm shrink-0">
                  {user.bloodGroup} Positive
                </span>
                <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 shrink-0">
                  <span className="material-symbols-outlined text-[14px]">trophy</span>
                  #3 Campus Donor
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 text-xs text-on-surface-variant mt-1.5 flex-wrap">
                <span className="font-mono bg-surface-container-high px-2 py-0.5 rounded border border-outline-variant/30">
                  ID: {user.institutionalId}
                </span>
                <span>•</span>
                <span className="font-medium text-on-surface">{user.department} Dept</span>
                <span>•</span>
                <span className="font-medium">{user.userType || 'Student'}</span>
                {user.email && (
                  <>
                    <span>•</span>
                    <span className="text-on-surface-variant truncate">{user.email}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 text-center min-w-[90px] sm:min-w-[100px] shadow-sm flex-1 md:flex-initial">
              <span className="text-[11px] sm:text-xs font-bold text-on-surface-variant block">Donations</span>
              <span className="text-lg sm:text-xl font-black text-primary">{donationCount} Bags</span>
            </div>
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 text-center min-w-[90px] sm:min-w-[100px] shadow-sm flex-1 md:flex-initial">
              <span className="text-[11px] sm:text-xs font-bold text-on-surface-variant block">Impact</span>
              <span className="text-lg sm:text-xl font-black text-primary">{donationCount * 3} Lives</span>
            </div>
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 text-center min-w-[90px] sm:min-w-[100px] shadow-sm flex-1 md:flex-initial">
              <span className="text-[11px] sm:text-xs font-bold text-on-surface-variant block">Status</span>
              <span className={`text-[11px] sm:text-xs font-bold mt-1 block ${isEligible ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {isEligible ? 'Eligible' : `Cooldown (${cooldownDaysLeft}d)`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT 2 COLS: 3-TAB CONTENT (History + Timeline Posts + Notification & Donor Settings) ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Tab Switcher */}
          <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
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
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'timeline'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">dynamic_feed</span>
              <span>Timeline Posts ({userPosts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">notifications_active</span>
              <span>Emergency Alerts &amp; Dates</span>
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

          {/* TAB 2: Timeline & Posts with Images/Text/Feelings */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {/* Timeline Composer */}
              <div className="glass-card p-5 rounded-2xl border border-primary/20 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">post_add</span>
                    Share an Update on Your Profile Timeline
                  </span>
                  {selectedFeeling && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary flex items-center gap-1">
                      <span>{selectedFeeling.emoji}</span>
                      <span>{selectedFeeling.label}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedFeeling(null)}
                        className="ml-1 text-xs hover:opacity-75"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>

                <form onSubmit={handleCreateTimelinePost} className="space-y-3">
                  <textarea
                    rows={2}
                    placeholder={`What's on your mind, ${user.name.split(' ')[0]}? Share a blood donation experience, emergency call-out, or campus note...`}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />

                  {/* Media URL / Image Link Input */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-[16px] text-on-surface-variant">
                        image
                      </span>
                      <input
                        type="url"
                        placeholder="Attach image URL (optional, e.g. https://...)"
                        value={newPostMedia}
                        onChange={(e) => setNewPostMedia(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Media Preview if provided */}
                  {newPostMedia && (
                    <div className="relative w-full max-h-48 rounded-xl overflow-hidden bg-black/5 border border-outline-variant/30">
                      <img
                        src={newPostMedia}
                        alt="Media Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => (e.target.style.display = 'none')}
                      />
                      <button
                        type="button"
                        onClick={() => setNewPostMedia('')}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  )}

                  {/* Feelings Bar & Submit */}
                  <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-outline-variant/20">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                      <span className="text-on-surface-variant font-medium mr-1">Feeling:</span>
                      {FEELING_OPTIONS.map((f) => (
                        <button
                          key={f.type}
                          type="button"
                          onClick={() => setSelectedFeeling(selectedFeeling?.type === f.type ? null : f)}
                          className={`px-2 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                            selectedFeeling?.type === f.type
                              ? 'border-primary bg-primary/10 text-primary font-bold'
                              : 'border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          <span>{f.emoji}</span>
                          <span>{f.type}</span>
                        </button>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={!newPostContent.trim() || isSubmittingPost}
                      className="btn-primary py-1.5 px-5 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSubmittingPost ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Posting...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[15px]">send</span>
                          <span>Publish Post</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* User Posts Feed */}
              {postsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-32 rounded-2xl bg-surface-container animate-pulse" />
                  ))}
                </div>
              ) : userPosts.length === 0 ? (
                <div className="p-8 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 text-center space-y-2">
                  <span className="material-symbols-outlined text-[40px] text-on-surface-variant/60">
                    rate_review
                  </span>
                  <h4 className="font-bold text-xs text-on-surface">No timeline posts yet</h4>
                  <p className="text-[11px] text-on-surface-variant">
                    Share your first blood donation experience or emergency campus call-out above.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userPosts.map((p) => (
                    <div
                      key={p._id || p.id}
                      className="glass-card p-5 rounded-2xl border border-outline-variant/30 space-y-3 shadow-sm hover:border-primary/30 transition-all"
                    >
                      {/* Post Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-[24px] text-primary">person</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-on-surface">{user.name}</span>
                              <span className="blood-group-chip text-[9px] px-1">{user.bloodGroup}</span>
                              {p.feeling && (
                                <span className="text-[11px] text-on-surface-variant flex items-center gap-0.5">
                                  <span>is</span>
                                  <span>{p.feeling.emoji}</span>
                                  <span className="font-medium">{p.feeling.type || p.feeling.label}</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-on-surface-variant">
                              {new Date(p.createdAt || Date.now()).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeletePost(p._id || p.id)}
                          className="p-1 rounded-lg text-on-surface-variant/60 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          title="Delete Post"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>

                      {/* Post Text Content */}
                      <p className="text-xs text-on-surface leading-relaxed whitespace-pre-wrap">{p.content}</p>

                      {/* Post Attached Media */}
                      {p.mediaUrl && (
                        <div className="w-full max-h-72 rounded-xl overflow-hidden bg-black/5 border border-outline-variant/20">
                          <img
                            src={p.mediaUrl}
                            alt="Post Media"
                            className="w-full h-full object-cover"
                            onError={(e) => (e.target.style.display = 'none')}
                          />
                        </div>
                      )}

                      {/* Post Engagement Bar */}
                      <div className="flex items-center gap-4 pt-2 border-t border-outline-variant/20 text-xs text-on-surface-variant">
                        <span className="flex items-center gap-1 text-primary font-bold">
                          <span className="material-symbols-outlined text-[16px]">favorite</span>
                          <span>{p.loveCount || p.likes || 0} Loves</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                          <span>{p.commentCount || p.comments || 0} Comments</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Emergency Notification Updates & Last Donation Date Settings */}
          {activeTab === 'settings' && (
            <div className="glass-panel p-6 rounded-2xl border border-primary/20 shadow-sm space-y-5">
              <div>
                <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
                  Emergency Notification &amp; Donor Readiness Settings
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Update your contact readiness, donation cooldown date, and emergency response channels.
                </p>
              </div>

              {settingsSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>{settingsSuccess}</span>
                </div>
              )}

              {settingsError && (
                <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{settingsError}</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                {/* 1. Last Donation Date Picker */}
                <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="font-bold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-[16px]">calendar_month</span>
                      Last Donation Date
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLastDonation(new Date().toISOString().split('T')[0])}
                        className="text-[10px] font-bold text-primary hover:underline"
                      >
                        Set to Today
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setLastDonation('')}
                        className="text-[10px] font-bold text-on-surface-variant hover:underline"
                      >
                        Clear / Never Donated
                      </button>
                    </div>
                  </div>

                  <input
                    type="date"
                    value={lastDonation}
                    onChange={(e) => setLastDonation(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/50 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-[10px] text-on-surface-variant block">
                    {lastDonation
                      ? `Calculated Safe Cooldown: 90 days required between voluntary blood donations.`
                      : 'No donation on record. Status is currently Eligible for all blood matching.'}
                  </span>
                </div>

                {/* 2. Emergency Phone Contact */}
                <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
                  <label className="font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[16px]">phone_in_talk</span>
                    Emergency Phone Contact
                  </label>
                  <input
                    type="tel"
                    placeholder="+880 1711-XXXXXX"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/50 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-[10px] text-on-surface-variant block">
                    Used strictly by Medical Duty Officers when urgent matching calls are initiated.
                  </span>
                </div>

                {/* 3. Emergency SOS Broadcast Notification Toggle */}
                <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-on-surface block">Emergency Requisition Push Notifications</span>
                    <span className="text-[11px] text-on-surface-variant block mt-0.5">
                      Receive instant broadcast alerts when your blood group is needed at CMH Saidpur.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={emergencyNotify}
                    onChange={(e) => setEmergencyNotify(e.target.checked)}
                    className="w-5 h-5 accent-primary cursor-pointer rounded"
                  />
                </div>

                {/* 4. Disaster Volunteer Responder Toggle */}
                <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-on-surface block">Disaster &amp; Crisis Volunteer Responder</span>
                    <span className="text-[11px] text-on-surface-variant block mt-0.5">
                      Enlist as an on-call emergency mobilizer during campus health emergencies.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isVolunteer}
                    onChange={(e) => setIsVolunteer(e.target.checked)}
                    className="w-5 h-5 accent-primary cursor-pointer rounded"
                  />
                </div>

                {/* 5. General Availability Status */}
                <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
                  <label className="font-bold text-on-surface block">Donor Availability Status</label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/50 text-xs font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Available">Available (Ready to respond)</option>
                    <option value="Unavailable">Unavailable (Temporarily busy/traveling)</option>
                    <option value="Cooldown">Cooldown (Clinical recovery period)</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="btn-primary py-2 px-6 text-xs font-bold flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSavingSettings ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving Settings...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">save</span>
                        <span>Save Emergency Settings</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ── RIGHT 1 COL: Profile Settings, Leaderboard Widget, & Clearance Pass ── */}
        <div className="space-y-5">
          {/* Avatar Quick Edit Card */}
          <div className="glass-card p-5 rounded-2xl border border-primary/20 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">face</span>
                Profile Avatar &amp; Sticker
              </span>
              <button
                type="button"
                onClick={() => setAvatarModalOpen(true)}
                className="text-[11px] font-bold text-primary hover:underline"
              >
                Change
              </button>
            </div>

            <div
              onClick={() => setAvatarModalOpen(true)}
              className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-3 cursor-pointer hover:border-primary/40 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 overflow-hidden flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-[28px] text-primary">person</span>
                )}
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-on-surface block">BAUST Custom Avatar</span>
                <span className="text-[10px] text-on-surface-variant block">
                  Purple uniform, hijab, teacher, or custom photo.
                </span>
              </div>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant group-hover:text-primary">
                chevron_right
              </span>
            </div>
          </div>

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
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isEligible ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'}`}>
                {isEligible ? 'ACTIVE' : 'COOLDOWN'}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {isEligible
                ? 'Safe donation interval is verified. Last clinical check-up passed at BAUST Medical Center.'
                : `Donor cooldown active. Next eligible donation in ${cooldownDaysLeft} days.`}
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

      {/* ── AVATAR & PROFILE PICTURE PICKER MODAL ── */}
      <AvatarPickerModal
        isOpen={avatarModalOpen}
        currentAvatarUrl={user.avatarUrl}
        onClose={() => setAvatarModalOpen(false)}
        onSave={handleSaveAvatar}
      />

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
              {CAMPUS_LEADERBOARD.map((donor) => (
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
              ))}
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
