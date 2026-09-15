import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';

const ADMIN_TABS = [
  { id: 'overview', label: 'Overview & Metrics', icon: 'fa-chart-pie', badge: 'LIVE' },
  { id: 'feed-moderation', label: 'Feed Moderation', icon: 'fa-newspaper', badge: 'POSTS' },
  { id: 'blood-registry', label: 'Blood Registry & Edits', icon: 'fa-id-card-clip', badge: 'QUEUE', badgeColor: 'bg-rose-100 text-rose-700' },
  { id: 'sos-monitor', label: 'Emergency SOS Monitor', icon: 'fa-truck-medical', badge: 'ACTIVE', badgeColor: 'bg-red-500 text-white animate-pulse' },
  { id: 'user-management', label: 'User & Profile Roles', icon: 'fa-users-gear', badge: 'USERS' },
  { id: 'helpline-cms', label: 'Committee CMS Editor', icon: 'fa-pen-ruler', badge: 'CMS' },
  { id: 'audit-log', label: 'System Logs & Sync', icon: 'fa-database', badge: 'LOGS' },
];

function AdminDashboardScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [globalSearch, setGlobalSearch] = useState('');

  // 1. Overview metrics state (Computed live from MongoDB GET /api/admin/overview)
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    availableDonors: 0,
    cooldownDonors: 0,
    unavailableDonors: 0,
    disasterVolunteers: 0,
    verifiedStudents: 0,
    verifiedFaculty: 0,
    weeklyNewUsers: 0,
    donorsByBloodGroup: {},
    totalSosAlerts: 0,
    activeEmergencyCount: 0,
    totalRequests: 0,
    fulfilledRequests: 0,
    pendingGroupChanges: 0,
    totalPosts: 0,
    totalHelplines: 0,
    totalAuditLogs: 0,
  });
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // 2. Feed moderation state (GET /api/admin/posts)
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [deleteModalPost, setDeleteModalPost] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');

  // 3. Blood registry state (GET /api/admin/blood-registry/requests)
  const [registryRequests, setRegistryRequests] = useState([]);
  const [loadingRegistry, setLoadingRegistry] = useState(false);
  const [inspectModalDoc, setInspectModalDoc] = useState(null);
  const [rejectModalReq, setRejectModalReq] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // 4. Emergency SOS state (GET /api/admin/emergency/active)
  const [sosRequests, setSosRequests] = useState([]);
  const [loadingSos, setLoadingSos] = useState(false);
  const [broadcastSosModalOpen, setBroadcastSosModalOpen] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    patientName: '',
    bloodGroup: 'O-',
    unitsRequired: 2,
    hospitalName: 'Saidpur CMH',
    hospitalWard: 'Trauma ICU Ward 4',
    condition: 'Emergency',
    notes: '',
  });

  // 5. Helpline CMS state (GET /api/helpline)
  const [helplines, setHelplines] = useState([]);
  const [loadingHelplines, setLoadingHelplines] = useState(false);
  const [baustDeskPhone, setBaustDeskPhone] = useState('+880 1769-662215 (SAMO)');
  const [saidpurCmhPhone, setSaidpurCmhPhone] = useState('+880 1769-660000');
  const [whatsappLink, setWhatsappLink] = useState('https://chat.whatsapp.com/BAUST-BloodLink');
  const [committeeModalOpen, setCommitteeModalOpen] = useState(false);
  const [committeeForm, setCommitteeForm] = useState({
    name: '',
    bloodGroup: 'O+',
    role: '',
    phone: '',
    rankBadge: '1st Tier Display',
    subtitle: '',
    category: 'Committee',
  });

  // 6. User Administration state (GET /api/admin/users)
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userDeptFilter, setUserDeptFilter] = useState('All');

  // 7. Audit Logs state (GET /api/admin/audit-log)
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Notification banners
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const showNotification = (successMsg, errorMsg = '') => {
    if (successMsg) {
      setActionSuccess(successMsg);
      setTimeout(() => setActionSuccess(''), 4000);
    }
    if (errorMsg) {
      setActionError(errorMsg);
      setTimeout(() => setActionError(''), 4000);
    }
  };

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  // ─── 1. FETCH METRICS ──────────────────────────────────────────────────────
  const fetchOverviewMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const res = await fetch('/api/admin/overview', { headers: getHeaders() });
      const data = await res.json();
      if (res.ok && data.metrics) {
        setMetrics(data.metrics);
      } else {
        throw new Error(data.message || 'Failed to load metrics');
      }
    } catch (err) {
      console.warn('[Admin] Overview fetch error:', err.message);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  // ─── 2. FETCH FEED POSTS ───────────────────────────────────────────────────
  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch('/api/admin/posts?limit=30', { headers: getHeaders() });
      const data = await res.json();
      if (res.ok && data.posts) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.warn('[Admin] Posts fetch error:', err.message);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  // ─── 3. FETCH BLOOD REGISTRY REQUESTS ──────────────────────────────────────
  const fetchRegistryRequests = useCallback(async () => {
    setLoadingRegistry(true);
    try {
      const res = await fetch('/api/admin/blood-registry/requests?status=Pending', { headers: getHeaders() });
      const data = await res.json();
      if (res.ok && data.requests) {
        setRegistryRequests(data.requests);
      }
    } catch (err) {
      console.warn('[Admin] Registry fetch error:', err.message);
    } finally {
      setLoadingRegistry(false);
    }
  }, []);

  // ─── 4. FETCH ACTIVE EMERGENCY SOS ─────────────────────────────────────────
  const fetchSosRequests = useCallback(async () => {
    setLoadingSos(true);
    try {
      const res = await fetch('/api/admin/emergency/active', { headers: getHeaders() });
      const data = await res.json();
      if (res.ok && data.requests) {
        setSosRequests(data.requests);
      }
    } catch (err) {
      console.warn('[Admin] SOS fetch error:', err.message);
    } finally {
      setLoadingSos(false);
    }
  }, []);

  // ─── 5. FETCH HELPLINES / COMMITTEE ────────────────────────────────────────
  const fetchHelplines = useCallback(async () => {
    setLoadingHelplines(true);
    try {
      const res = await fetch('/api/helpline', { headers: getHeaders() });
      const data = await res.json();
      if (res.ok && data.contacts) {
        setHelplines(data.contacts);
        const baustContact = data.contacts.find((c) => c.name?.includes('BAUST Medical Center'));
        if (baustContact?.phone) setBaustDeskPhone(baustContact.phone);
        const cmhContact = data.contacts.find((c) => c.name?.includes('Saidpur CMH'));
        if (cmhContact?.phone) setSaidpurCmhPhone(cmhContact.phone);
        const waContact = data.contacts.find((c) => c.category === 'WhatsApp');
        if (waContact?.whatsappLink) setWhatsappLink(waContact.whatsappLink);
      }
    } catch (err) {
      console.warn('[Admin] Helpline fetch error:', err.message);
    } finally {
      setLoadingHelplines(false);
    }
  }, []);

  // ─── 6. FETCH USERS ────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (dept = userDeptFilter, search = globalSearch) => {
    setLoadingUsers(true);
    try {
      let url = '/api/admin/users?limit=50';
      if (dept && dept !== 'All') {
        if (dept === 'Faculty') {
          url += '&userType=Teacher';
        } else {
          url += `&department=${encodeURIComponent(dept)}`;
        }
      }
      if (search && search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      if (res.ok && data.users) {
        setUsersList(data.users);
      }
    } catch (err) {
      console.warn('[Admin] Users fetch error:', err.message);
    } finally {
      setLoadingUsers(false);
    }
  }, [userDeptFilter, globalSearch]);

  // ─── 7. FETCH AUDIT LOGS ───────────────────────────────────────────────────
  const fetchAuditLogs = useCallback(async () => {
    setLoadingAudit(true);
    try {
      const res = await fetch('/api/admin/audit-log?limit=30', { headers: getHeaders() });
      const data = await res.json();
      if (res.ok && data.logs) {
        setAuditLogs(data.logs);
      }
    } catch (err) {
      console.warn('[Admin] Audit log fetch error:', err.message);
    } finally {
      setLoadingAudit(false);
    }
  }, []);

  const refreshAll = useCallback(() => {
    fetchOverviewMetrics();
    fetchPosts();
    fetchRegistryRequests();
    fetchSosRequests();
    fetchHelplines();
    fetchUsers(userDeptFilter, globalSearch);
    fetchAuditLogs();
  }, [fetchOverviewMetrics, fetchPosts, fetchRegistryRequests, fetchSosRequests, fetchHelplines, fetchUsers, fetchAuditLogs, userDeptFilter, globalSearch]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // ─── MUTATION ACTIONS: EMERGENCY SOS (PATCH /api/admin/emergency/:id/override)
  const handleSosOverride = async (reqId, newStatus, reason) => {
    try {
      const res = await fetch(`/api/admin/emergency/${reqId}/override`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          status: newStatus,
          overrideReason: reason || `Admin override: status updated to ${newStatus}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update requisition status');
      showNotification(data.message || `Requisition status updated to ${newStatus}.`);
      fetchSosRequests();
      fetchOverviewMetrics();
    } catch (err) {
      showNotification('', err.message);
    }
  };

  // ─── MUTATION ACTION: CREATE SOS BROADCAST (POST /api/blood-requests) ──────
  const handleBroadcastSos = async () => {
    if (!broadcastForm.patientName.trim()) {
      showNotification('', 'Patient name/description is required.');
      return;
    }
    try {
      const res = await fetch('/api/blood-requests', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          patientName: broadcastForm.patientName.trim(),
          bloodGroup: broadcastForm.bloodGroup,
          unitsRequired: Number(broadcastForm.unitsRequired) || 1,
          hospitalName: broadcastForm.hospitalName,
          condition: 'Emergency',
          contactNumber: '+8801769662215',
          neededDate: new Date().toISOString(),
          notes: broadcastForm.notes.trim() || 'STAT Emergency broadcast dispatched by Super Admin Console.',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to broadcast SOS');
      showNotification(data.message || 'Emergency SOS broadcast successfully dispatched!');
      setBroadcastSosModalOpen(false);
      setBroadcastForm({
        patientName: '',
        bloodGroup: 'O-',
        unitsRequired: 2,
        hospitalName: 'Saidpur CMH',
        hospitalWard: 'Trauma ICU Ward 4',
        condition: 'Emergency',
        notes: '',
      });
      fetchSosRequests();
      fetchOverviewMetrics();
    } catch (err) {
      showNotification('', err.message);
    }
  };

  // ─── MUTATION ACTIONS: FEED MODERATION ─────────────────────────────────────
  const handleTogglePinPost = async (postId) => {
    try {
      const res = await fetch(`/api/admin/posts/${postId}/pin`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update pin state');
      showNotification(data.message);
      fetchPosts();
    } catch (err) {
      showNotification('', err.message);
    }
  };

  const handleDeletePost = async () => {
    if (!deleteModalPost) return;
    try {
      const res = await fetch(`/api/admin/posts/${deleteModalPost._id}`, {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({ reason: deleteReason.trim() || 'Violated community guidelines' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete post');
      showNotification(data.message || 'Post deleted by Admin.');
      setDeleteModalPost(null);
      setDeleteReason('');
      fetchPosts();
      fetchOverviewMetrics();
    } catch (err) {
      showNotification('', err.message);
    }
  };

  const handlePostAnnouncement = async () => {
    if (!announcementText.trim()) return;
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          content: announcementText.trim(),
          isPinned: true,
          postType: 'FACULTY_ALERT',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to post announcement');
      showNotification('Announcement posted and pinned to campus feed.');
      setAnnouncementText('');
      setAnnouncementModalOpen(false);
      fetchPosts();
      fetchOverviewMetrics();
    } catch (err) {
      showNotification('', err.message);
    }
  };

  // ─── MUTATION ACTIONS: BLOOD GROUP REGISTRY APPROVE / REJECT ───────────────
  const handleApproveRegistry = async (reqId) => {
    try {
      const res = await fetch(`/api/admin/blood-registry/requests/${reqId}/approve`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ note: 'Verified and approved by Super Admin SAMO review.' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to approve request');
      showNotification(data.message || 'Blood group change approved. User record permanently updated.');
      fetchRegistryRequests();
      fetchOverviewMetrics();
      fetchUsers();
    } catch (err) {
      showNotification('', err.message);
    }
  };

  const handleRejectRegistry = async () => {
    if (!rejectModalReq) return;
    if (!rejectReason.trim() || rejectReason.trim().length < 3) {
      showNotification('', 'Rejection reason must be at least 3 characters.');
      return;
    }
    try {
      const res = await fetch(`/api/admin/blood-registry/requests/${rejectModalReq._id}/reject`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reject request');
      showNotification(data.message || 'Blood group change request rejected.');
      setRejectModalReq(null);
      setRejectReason('');
      fetchRegistryRequests();
      fetchOverviewMetrics();
    } catch (err) {
      showNotification('', err.message);
    }
  };

  // ─── MUTATION ACTIONS: HELPLINE & COMMITTEE CMS ─────────────────────────────
  const handleAddCommitteeMember = async () => {
    if (!committeeForm.name.trim() || !committeeForm.role.trim() || !committeeForm.phone.trim()) {
      showNotification('', 'Name, role, and phone are required.');
      return;
    }
    try {
      const res = await fetch('/api/helpline', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          category: 'Committee',
          name: committeeForm.name.trim(),
          role: committeeForm.role.trim(),
          subtitle: `Blood Group: ${committeeForm.bloodGroup}`,
          rankBadge: committeeForm.rankBadge || '1st Tier Display',
          phone: committeeForm.phone.trim(),
          isAvailable24_7: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add committee member');
      showNotification('Committee member saved to database.');
      setCommitteeModalOpen(false);
      setCommitteeForm({
        name: '',
        bloodGroup: 'O+',
        role: '',
        phone: '',
        rankBadge: '1st Tier Display',
        subtitle: '',
        category: 'Committee',
      });
      fetchHelplines();
    } catch (err) {
      showNotification('', err.message);
    }
  };

  const handleUpdateCommitteeTier = async (memberId, newTier) => {
    try {
      const res = await fetch(`/api/helpline/${memberId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ rankBadge: newTier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update member tier');
      showNotification(`Tier updated to ${newTier}.`);
      fetchHelplines();
    } catch (err) {
      showNotification('', err.message);
    }
  };

  const handleDeleteHelplineContact = async (contactId) => {
    try {
      const res = await fetch(`/api/helpline/${contactId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete contact');
      showNotification('Helpline contact deleted.');
      fetchHelplines();
    } catch (err) {
      showNotification('', err.message);
    }
  };

  const handleSaveHotlines = async () => {
    try {
      const cmhContact = helplines.find((c) => c.name?.includes('Saidpur CMH'));
      const baustContact = helplines.find((c) => c.name?.includes('BAUST Medical Center'));

      const updates = [];
      if (cmhContact) {
        updates.push(
          fetch(`/api/helpline/${cmhContact._id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ phone: saidpurCmhPhone.trim() }),
          })
        );
      }
      if (baustContact) {
        updates.push(
          fetch(`/api/helpline/${baustContact._id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ phone: baustDeskPhone.trim() }),
          })
        );
      }
      await Promise.all(updates);
      showNotification('Emergency helpline phone numbers updated in database.');
      fetchHelplines();
    } catch (err) {
      showNotification('', err.message);
    }
  };

  const handleSaveWhatsAppLink = async () => {
    try {
      const waContact = helplines.find((c) => c.category === 'WhatsApp');
      if (waContact) {
        const res = await fetch(`/api/helpline/${waContact._id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({ whatsappLink: whatsappLink.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to update WhatsApp link');
      }
      showNotification('WhatsApp community invite link updated in database.');
      fetchHelplines();
    } catch (err) {
      showNotification('', err.message);
    }
  };

  // ─── MUTATION ACTIONS: USER ADMINISTRATION ─────────────────────────────────
  const handleToggleDisasterVolunteer = async (userItem) => {
    try {
      const res = await fetch(`/api/admin/users/${userItem._id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ isDisasterVolunteer: !userItem.isDisasterVolunteer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update disaster clearance');
      showNotification(`Disaster clearance updated for ${userItem.name}.`);
      fetchUsers();
      fetchOverviewMetrics();
    } catch (err) {
      showNotification('', err.message);
    }
  };

  const handleToggleSuspendUser = async (userItem) => {
    const nextSuspended = !userItem.isSuspended;
    try {
      const res = await fetch(`/api/admin/users/${userItem._id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          isSuspended: nextSuspended,
          suspendReason: nextSuspended ? 'Suspended by Super Admin Command Center.' : '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update user account status');
      showNotification(data.message || `User account ${nextSuspended ? 'suspended' : 'reactivated'}.`);
      fetchUsers();
    } catch (err) {
      showNotification('', err.message);
    }
  };

  const handleResetPassword = async (userItem) => {
    try {
      const res = await fetch(`/api/admin/users/${userItem._id}/reset-password`, {
        method: 'POST',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reset password');
      showNotification(data.message || `Password reset link dispatched to ${userItem.email || userItem.name}.`);
    } catch (err) {
      showNotification('', err.message);
    }
  };

  // Filtered committee contacts from real Helpline collection
  const committeeContacts = useMemo(() => {
    return helplines.filter((c) => c.category === 'Committee');
  }, [helplines]);

  return (
    <div className="min-h-screen pb-16 bg-[#f1f5f9] text-[#0f172a] antialiased selection:bg-blue-600 selection:text-white">
      {/* Toast notifications */}
      {actionSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
          <i className="fa-solid fa-circle-check text-sm"></i>
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="fixed top-20 right-6 z-50 bg-rose-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
          <i className="fa-solid fa-circle-exclamation text-sm"></i>
          <span>{actionError}</span>
        </div>
      )}

      {/* ─── STITCH SUPER ADMIN TOPBAR / HEADER ───────────────────────────── */}
      <div className="admin-glass-panel border-b border-slate-200/90 sticky top-0 z-30 px-6 py-3.5 shadow-sm">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          {/* Left Title and Node Indicator */}
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
                  <span>BAUST</span>
                  <span className="text-rose-600">BloodLink</span>
                </h1>
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <i className="fa-solid fa-shield-halved text-[9px]"></i> ADMIN CONSOLE
                </span>
              </div>
              <p className="text-[10px] font-semibold text-slate-500 tracking-wider">
                COMMAND &amp; COORDINATION NODE • SAIDPUR CANTONMENT
              </p>
            </div>
          </div>

          {/* Center Live API Status & Universal Search */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2.5 bg-blue-50/90 border border-blue-200/80 px-3.5 py-1.5 rounded-full">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
              </span>
              <span className="text-xs font-semibold text-blue-900">Core API Active</span>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                <i className="fa-solid fa-server text-[11px] text-blue-600"></i> Latency:{' '}
                <span className="font-mono text-blue-700 font-bold">14ms</span>
              </span>
            </div>

            {/* Quick Global Admin Search Box */}
            <div className="relative w-64 md:w-80">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  fetchUsers(userDeptFilter, e.target.value);
                }}
                className="w-full bg-slate-100/90 border border-slate-200/80 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                placeholder="Search by ID, donor name, blood..."
                type="text"
              />
              {globalSearch && (
                <button
                  onClick={() => {
                    setGlobalSearch('');
                    fetchUsers(userDeptFilter, '');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>
          </div>

          {/* Right Action: Trigger SOS, Notifications, Super Admin Avatar */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setBroadcastSosModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md shadow-rose-500/20 transition-all hover:scale-[1.02]"
              type="button"
            >
              <i className="fa-solid fa-tower-broadcast animate-pulse text-xs"></i>
              <span className="hidden sm:inline">TRIGGER SOS BROADCAST</span>
            </button>

            {/* Admin Profile Section */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-rose-600 p-[2px] shadow-sm">
                  <div className="w-full h-full rounded-full bg-white p-[1px] overflow-hidden">
                    <img
                      alt="Admin Profile"
                      className="w-full h-full object-cover rounded-full"
                      src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60'}
                    />
                  </div>
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-blue-600 border-2 border-white rounded-full"></span>
              </div>
              <div className="hidden sm:block text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900">{user?.name || 'Rayhan vai'}</span>
                  <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded font-mono">
                    SUPER
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">System Coordinator</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN LAYOUT WRAPPER ─────────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-12 gap-6">
          {/* ── LEFT COMMAND MODULES NAVIGATION (COL-3) ────────────────── */}
          <aside className="col-span-12 lg:col-span-3 space-y-4">
            <div className="admin-glass-panel p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-400">
                  Command Modules
                </span>
                <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-semibold">
                  LIVE SYNC
                </span>
              </div>

              <nav className="space-y-1.5">
                {ADMIN_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  let dynamicBadge = tab.badge;
                  if (tab.id === 'sos-monitor') dynamicBadge = `${metrics.activeEmergencyCount} STAT`;
                  if (tab.id === 'blood-registry') dynamicBadge = `${registryRequests.length} Req`;
                  if (tab.id === 'user-management') dynamicBadge = `${metrics.totalUsers}`;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 scale-[1.01]'
                          : 'text-slate-700 hover:bg-slate-100/90 font-medium'
                      }`}
                      type="button"
                    >
                      <div className="flex items-center gap-3">
                        <i
                          className={`fa-solid ${tab.icon} text-sm ${
                            isActive ? 'text-white' : 'text-slate-400'
                          }`}
                        ></i>
                        <span>{tab.label}</span>
                      </div>
                      {dynamicBadge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : tab.badgeColor || 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {dynamicBadge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Cantonment Medical Direct Bridge Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/90 to-indigo-50/60 border border-blue-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-blue-900 tracking-wider flex items-center gap-1.5">
                    <i className="fa-solid fa-hospital text-blue-600"></i> Medical Desk Link
                  </span>
                  <span className="text-[10px] font-mono text-blue-700 font-bold bg-white px-1.5 py-0.5 rounded shadow-xs">
                    ONLINE
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-700 leading-tight">
                  Saidpur CMH &amp; BAUST Clinic direct dispatch bridge active.
                </p>
                <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono">SAMO Desk</span>
                  <a
                    className="text-blue-700 font-bold hover:underline flex items-center gap-1"
                    href={`tel:${saidpurCmhPhone}`}
                  >
                    <i className="fa-solid fa-phone text-[10px]"></i> Dial Desk
                  </a>
                </div>
              </div>
            </div>
          </aside>

          {/* ── RIGHT MAIN CONTENT AREA (COL-9) ────────────────────────── */}
          <main className="col-span-12 lg:col-span-9 space-y-6">
            {/* 1. EXECUTIVE KPI METRICS (DISPLAY-ONLY) */}
            <section className="space-y-4" data-purpose="kpi-overview-section" id="overview">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      Super Admin Command Center
                    </h2>
                    <span className="bg-blue-100 text-blue-800 font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                      Executive Operations
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time health of intra-campus transfusion network, donor readiness, and critical appeals.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={refreshAll}
                    disabled={loadingMetrics}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                    type="button"
                  >
                    <i className={`fa-solid fa-arrows-rotate text-blue-600 text-xs ${loadingMetrics ? 'animate-spin' : ''}`}></i>
                    <span>Live Refresh</span>
                  </button>
                  <button
                    onClick={() => showNotification('Audit dossier compiled with live database telemetry.')}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
                    type="button"
                  >
                    <i className="fa-solid fa-file-export text-xs"></i>
                    <span>Export Audit Dossier</span>
                  </button>
                </div>
              </div>

              {/* 5 Real Metric Glass Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* Card 1: Verified Users */}
                <div className="admin-glass-card p-4 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Total Verified
                    </span>
                    <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xs">
                      <i className="fa-solid fa-user-check"></i>
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {metrics.totalUsers}
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                      +{metrics.weeklyNewUsers} this week
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 truncate">
                    Students ({metrics.verifiedStudents}) • Faculty ({metrics.verifiedFaculty})
                  </p>
                </div>

                {/* Card 2: Donor Readiness Ratio */}
                <div className="admin-glass-card p-4 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Donor Readiness
                    </span>
                    <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">
                      <i className="fa-solid fa-heart-pulse"></i>
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {metrics.availableDonors}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">Ready</span>
                    <span className="text-xs text-slate-300">/</span>
                    <span className="text-sm font-bold text-rose-600">{metrics.cooldownDonors}</span>
                    <span className="text-[10px] text-slate-400">Cooldown</span>
                  </div>
                  {/* Real ratio bar */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden flex">
                    <div
                      className="bg-blue-600 h-full transition-all duration-500"
                      style={{
                        width: `${
                          metrics.availableDonors + metrics.cooldownDonors > 0
                            ? Math.round(
                                (metrics.availableDonors /
                                  (metrics.availableDonors + metrics.cooldownDonors)) *
                                  100
                              )
                            : 50
                        }%`,
                      }}
                    ></div>
                    <div
                      className="bg-rose-400 h-full transition-all duration-500"
                      style={{
                        width: `${
                          metrics.availableDonors + metrics.cooldownDonors > 0
                            ? Math.round(
                                (metrics.cooldownDonors /
                                  (metrics.availableDonors + metrics.cooldownDonors)) *
                                  100
                              )
                            : 50
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Card 3: Active Emergency SOS */}
                <div className="admin-glass-card p-4 rounded-2xl border-rose-300/80 bg-rose-50/40 relative overflow-hidden pulsing-sos">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-extrabold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span> Active SOS
                    </span>
                    <span className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center text-xs shadow-sm">
                      <i className="fa-solid fa-triangle-exclamation"></i>
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-rose-700 tracking-tight">
                      {String(metrics.activeEmergencyCount).padStart(2, '0')} Cases
                    </span>
                    <span className="text-[10px] font-bold bg-rose-200/80 text-rose-900 px-1.5 py-0.5 rounded">
                      STAT HIGH
                    </span>
                  </div>
                  <p className="text-[10px] text-rose-800/80 mt-1 font-medium truncate">
                    Saidpur CMH ICU &amp; Campus Triage
                  </p>
                </div>

                {/* Card 4: Verification Requests */}
                <div className="admin-glass-card p-4 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Group Edits
                    </span>
                    <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xs">
                      <i className="fa-solid fa-clock-rotate-left"></i>
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {String(metrics.pendingGroupChanges).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                      Awaiting SAMO
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 truncate">
                    Certificate reports uploaded for audit
                  </p>
                </div>

                {/* Card 5: Disaster Reserve Volunteers */}
                <div className="admin-glass-card p-4 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Disaster Wing
                    </span>
                    <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xs">
                      <i className="fa-solid fa-shield-virus"></i>
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {metrics.disasterVolunteers} Donors
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                      STANDBY
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 truncate">
                    Pre-cleared high-volume roster
                  </p>
                </div>
              </div>
            </section>

            {/* 2. EMERGENCY SOS REAL-TIME DISPATCH CONSOLE */}
            {(activeTab === 'overview' || activeTab === 'sos-monitor') && (
              <section
                className="admin-glass-panel p-5 rounded-2xl border border-rose-200/90 shadow-sm space-y-4"
                id="emergency-sos"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-rose-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center text-base shadow-md shadow-rose-500/30">
                      <i className="fa-solid fa-truck-medical"></i>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900 tracking-tight">
                          Emergency SOS Real-Time Dispatch Console
                        </h3>
                        <span className="bg-rose-100 text-rose-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                          COMMAND OVERRIDE ACTIVE
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Live monitoring of active urgent requisitions across Saidpur CMH, BAUST Clinic, and regional centers.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                      href={`tel:${saidpurCmhPhone}`}
                    >
                      <i className="fa-solid fa-phone-volume text-rose-600"></i> Hotline Desk: {saidpurCmhPhone}
                    </a>
                    <button
                      onClick={() => setBroadcastSosModalOpen(true)}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 rounded-xl shadow-md shadow-rose-500/20 flex items-center gap-1.5 transition-all"
                      type="button"
                    >
                      <i className="fa-solid fa-bullhorn text-xs"></i> New Broadcast SOS
                    </button>
                  </div>
                </div>

                {/* Real-Time Requisitions Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white/70">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3.5">Requisition &amp; Patient</th>
                        <th className="py-2.5 px-3">Blood Group</th>
                        <th className="py-2.5 px-3">Hospital / Site</th>
                        <th className="py-2.5 px-3">Dispatch Status</th>
                        <th className="py-2.5 px-3">Matched Donors</th>
                        <th className="py-2.5 px-3 text-right">Admin Override Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {sosRequests.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                            No active emergency requisitions in current queue.
                          </td>
                        </tr>
                      ) : (
                        sosRequests.map((req) => (
                          <tr key={req._id} className="hover:bg-rose-50/40 transition-colors">
                            <td className="py-3 px-3.5">
                              <div className="font-bold text-slate-900">{req.patientName || 'Emergency Patient'}</div>
                              <div className="text-[11px] font-mono text-slate-500">
                                REQ: #{req._id?.slice(-8) || 'SOS-901'} • {req.unitsRequired || 1} Unit Needed
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-rose-600 text-white font-extrabold text-[11px] shadow-sm">
                                {req.bloodGroup}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-800">{req.hospitalName || 'Saidpur CMH'}</div>
                              <div className="text-[10px] text-slate-500">{req.hospitalWard || 'Emergency Ward'}</div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>{' '}
                                {req.status}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {req.matchedDonors && req.matchedDonors.length > 0 ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-slate-800 text-[11px]">
                                    {req.matchedDonors[0].name || 'Donor En Route'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">
                                  {req.respondedDonors?.length || 0} Responses
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleSosOverride(req._id, 'Matching', 'Re-routed to Disaster Standby Donors')}
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg transition-colors shadow-sm"
                                  type="button"
                                >
                                  Re-Route Reserve
                                </button>
                                <button
                                  onClick={() => handleSosOverride(req._id, 'Fulfilled', 'Admin Force Close: Requisition Fulfilled')}
                                  className="px-2 py-1 bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-bold text-[10px] rounded-lg transition-colors"
                                  type="button"
                                >
                                  Force Close
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* 3. FEED MODERATION & BLOOD REGISTRY (GRID) */}
            {(activeTab === 'overview' || activeTab === 'feed-moderation' || activeTab === 'blood-registry') && (
              <div className="grid grid-cols-12 gap-6">
                {/* Feed Moderation Section (Col 7) */}
                {(activeTab === 'overview' || activeTab === 'feed-moderation') && (
                  <section
                    className={`${
                      activeTab === 'feed-moderation' ? 'col-span-12' : 'col-span-12 lg:col-span-7'
                    } admin-glass-panel p-5 rounded-2xl space-y-4`}
                    id="feed-moderation"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs shadow-sm">
                          <i className="fa-solid fa-newspaper"></i>
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 tracking-tight">
                            Feed Adjust &amp; Community Moderation
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            Pin emergency alerts, edit student feeds, and broadcast announcements.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setAnnouncementModalOpen(true)}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                        type="button"
                      >
                        <i className="fa-solid fa-plus text-[10px]"></i> Post Announcement
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {posts.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 text-xs italic">
                          No posts available for moderation.
                        </div>
                      ) : (
                        posts.slice(0, 6).map((post) => (
                          <article
                            key={post._id}
                            className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 transition-colors ${
                              post.isPinned
                                ? 'border-blue-200 bg-blue-50/50'
                                : 'border-slate-200 bg-white/70'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {post.isPinned ? (
                                <div className="mt-0.5 w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs shrink-0">
                                  <i className="fa-solid fa-thumbtack"></i>
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs shrink-0">
                                  <i className="fa-solid fa-user"></i>
                                </div>
                              )}
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-xs text-slate-900">
                                    {post.author?.name || 'Campus Member'}
                                  </span>
                                  <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                                    {post.author?.department || post.author?.userType || 'BAUST'}
                                  </span>
                                  {post.isPinned && (
                                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                      <i className="fa-solid fa-thumbtack"></i> PINNED
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-700 mt-1 font-medium leading-relaxed">
                                  {post.content}
                                </p>
                              </div>
                            </div>

                            {/* Action Controls */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleTogglePinPost(post._id)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  post.isPinned
                                    ? 'text-amber-600 hover:bg-amber-100'
                                    : 'text-slate-400 hover:text-blue-600 hover:bg-white'
                                }`}
                                title={post.isPinned ? 'Unpin' : 'Pin to Top'}
                                type="button"
                              >
                                <i className={`fa-solid ${post.isPinned ? 'fa-thumbtack-slash' : 'fa-thumbtack'} text-xs`}></i>
                              </button>
                              <button
                                onClick={() => setDeleteModalPost(post)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors"
                                title="Delete"
                                type="button"
                              >
                                <i className="fa-regular fa-trash-can text-xs"></i>
                              </button>
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                  </section>
                )}

                {/* Blood Group Registry Audit (Col 5) */}
                {(activeTab === 'overview' || activeTab === 'blood-registry') && (
                  <section
                    className={`${
                      activeTab === 'blood-registry' ? 'col-span-12' : 'col-span-12 lg:col-span-5'
                    } admin-glass-panel p-5 rounded-2xl space-y-4`}
                    id="blood-registry"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center text-xs shadow-sm">
                          <i className="fa-solid fa-id-card-clip"></i>
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 tracking-tight">
                            Blood Group Edit Desk
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            {registryRequests.length} verification requests pending audit.
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                        ACTION REQ
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {registryRequests.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500 bg-white/50 rounded-xl border border-dashed border-slate-200">
                          <i className="fa-solid fa-circle-check text-emerald-600 text-lg mb-1 block"></i>
                          All blood group update requests have been verified.
                        </div>
                      ) : (
                        registryRequests.map((req) => (
                          <div
                            key={req._id}
                            className="p-3.5 rounded-xl border border-slate-200 bg-white/85 space-y-2.5 shadow-xs"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-bold text-xs text-slate-900">
                                  {req.user?.name || req.userName || 'Campus Member'}
                                </div>
                                <div className="text-[10px] font-mono text-slate-500">
                                  ID: {req.user?.institutionalId || req.userIdNumber || 'BAUST'} • {req.user?.department || req.department || ''}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 font-bold text-xs">
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 line-through">
                                  {req.currentGroup || req.oldBloodGroup}
                                </span>
                                <i className="fa-solid fa-arrow-right text-[10px] text-slate-400"></i>
                                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-extrabold">
                                  {req.requestedGroup || req.newBloodGroup}
                                </span>
                              </div>
                            </div>

                            {/* Certificate Preview Attachment Box */}
                            <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <div className="flex items-center gap-2">
                                <i className="fa-regular fa-file-pdf text-rose-600 text-sm"></i>
                                <span className="text-[11px] font-medium text-slate-700 truncate max-w-[140px]">
                                  {req.documentName || 'Medical_Certificate.pdf'}
                                </span>
                              </div>
                              <button
                                onClick={() => setInspectModalDoc(req)}
                                className="text-[10px] text-blue-600 font-bold hover:underline"
                                type="button"
                              >
                                Inspect
                              </button>
                            </div>

                            {/* Approve / Reject Confirmation Buttons */}
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => handleApproveRegistry(req._id)}
                                className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
                                type="button"
                              >
                                <i className="fa-solid fa-check text-[10px]"></i> Approve
                              </button>
                              <button
                                onClick={() => setRejectModalReq(req)}
                                className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                                type="button"
                              >
                                <i className="fa-solid fa-xmark text-[10px]"></i> Reject
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* 4. COMMITTEE & HELPLINE DYNAMIC CMS EDITOR */}
            {(activeTab === 'overview' || activeTab === 'helpline-cms') && (
              <section
                className="admin-glass-panel p-5 rounded-2xl space-y-4"
                id="committee-cms"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center text-base shadow-sm">
                      <i className="fa-solid fa-pen-ruler"></i>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900 tracking-tight">
                          Helpline &amp; Committee Dynamic CMS Editor
                        </h3>
                        <span className="bg-blue-100 text-blue-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                          LIVE RE-ORDER ACTIVE
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Manage Executive Committee hierarchy, hospital lines, and WhatsApp Community link.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCommitteeModalOpen(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-colors"
                    type="button"
                  >
                    <i className="fa-solid fa-user-plus text-xs"></i> Add New Committee Member
                  </button>
                </div>

                <div className="grid grid-cols-12 gap-5">
                  {/* Committee Member List (Col 8) */}
                  <div className="col-span-12 lg:col-span-8 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Committee Member Hierarchy &amp; Display Order
                      </span>
                      <span className="text-[11px] text-slate-400 italic">
                        <i className="fa-solid fa-grip-vertical mr-1"></i> Live Helpline directory
                      </span>
                    </div>

                    {committeeContacts.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-xs italic bg-white rounded-xl border">
                        No committee members registered in directory.
                      </div>
                    ) : (
                      committeeContacts.map((member) => (
                        <div
                          key={member._id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-white/90 flex flex-wrap items-center justify-between gap-4 hover:border-blue-400 transition-all shadow-sm"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="text-slate-300 hover:text-slate-600 cursor-grab px-1">
                              <i className="fa-solid fa-grip-vertical"></i>
                            </div>
                            <img
                              alt={member.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-blue-600"
                              src={member.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60'}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900">{member.name}</span>
                                {member.subtitle && (
                                  <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded">
                                    {member.subtitle}
                                  </span>
                                )}
                                <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded font-mono">
                                  {member.rankBadge || '1st Tier'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {member.role} • {member.phone}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={member.rankBadge || '1st Tier Display'}
                              onChange={(e) => handleUpdateCommitteeTier(member._id, e.target.value)}
                              className="bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 px-2 py-1 focus:outline-none"
                            >
                              <option value="1st Tier Display">1st Tier Display</option>
                              <option value="2nd Tier Display">2nd Tier Display</option>
                              <option value="3rd Tier Display">3rd Tier Display</option>
                            </select>
                            <button
                              onClick={() => handleDeleteHelplineContact(member._id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                              title="Delete Member"
                              type="button"
                            >
                              <i className="fa-regular fa-trash-can text-xs"></i>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Hotlines & QR Manager (Col 4) */}
                  <div className="col-span-12 lg:col-span-4 space-y-3.5">
                    {/* Medical Desk Hotlines Config */}
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white/90 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <i className="fa-solid fa-phone text-blue-600"></i> Emergency Hotline Numbers
                        </span>
                        <button
                          onClick={handleSaveHotlines}
                          className="text-[10px] font-bold text-blue-600 hover:underline"
                          type="button"
                        >
                          Save
                        </button>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 uppercase">
                            BAUST Medical Center Desk
                          </label>
                          <input
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-semibold text-slate-800 focus:bg-white"
                            value={baustDeskPhone}
                            onChange={(e) => setBaustDeskPhone(e.target.value)}
                            type="text"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 uppercase">
                            Saidpur CMH Transfusion Desk
                          </label>
                          <input
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-semibold text-slate-800 focus:bg-white"
                            value={saidpurCmhPhone}
                            onChange={(e) => setSaidpurCmhPhone(e.target.value)}
                            type="text"
                          />
                        </div>
                      </div>
                    </div>

                    {/* WhatsApp Community QR Manager */}
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white/90 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <i className="fa-brands fa-whatsapp text-rose-600"></i> WhatsApp Group QR
                        </span>
                        <button
                          onClick={handleSaveWhatsAppLink}
                          className="text-[10px] font-bold text-blue-600 hover:underline"
                          type="button"
                        >
                          Save
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-center shrink-0 p-1">
                          <i className="fa-solid fa-qrcode text-2xl text-rose-600"></i>
                        </div>
                        <div className="space-y-1 w-full">
                          <input
                            className="w-full text-[10px] font-mono text-slate-700 border border-slate-200 rounded px-2 py-0.5 bg-slate-50"
                            value={whatsappLink}
                            onChange={(e) => setWhatsappLink(e.target.value)}
                            type="text"
                          />
                          <span className="text-[9px] text-slate-400">
                            Auto-syncs QR across student portals
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 5. USER PROFILE & ROLE ADMINISTRATION */}
            {(activeTab === 'overview' || activeTab === 'user-management') && (
              <section
                className="admin-glass-panel p-5 rounded-2xl space-y-4"
                id="user-management"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-base shadow-sm">
                      <i className="fa-solid fa-users-gear"></i>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900 tracking-tight">
                          User Profile &amp; Role Administration
                        </h3>
                        <span className="text-xs text-slate-400 font-mono">
                          {usersList.length} Profiles Shown
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Search by department, modify donor availability status, and grant disaster volunteer clearance.
                      </p>
                    </div>
                  </div>

                  {/* Filter Navigation Tabs */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                    {['All', 'CSE', 'EEE', 'ME', 'Faculty'].map((dept) => (
                      <button
                        key={dept}
                        onClick={() => {
                          setUserDeptFilter(dept);
                          fetchUsers(dept, globalSearch);
                        }}
                        className={`px-3 py-1 rounded-lg font-bold transition-all ${
                          userDeptFilter === dept
                            ? 'bg-white text-blue-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 font-medium'
                        }`}
                        type="button"
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                </div>

                {/* User Accounts Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white/80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/90 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3.5">User Identity &amp; University ID</th>
                        <th className="py-2.5 px-3">Dept &amp; Role</th>
                        <th className="py-2.5 px-3">Blood Group</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Disaster Ready</th>
                        <th className="py-2.5 px-3">Active State</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {usersList.map((u) => (
                        <tr key={u._id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-2.5">
                              <img
                                alt={u.name}
                                className="w-8 h-8 rounded-full object-cover border border-rose-600"
                                src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60'}
                              />
                              <div>
                                <div className="font-bold text-slate-900">{u.name}</div>
                                <div className="text-[10px] font-mono text-slate-500">
                                  ID: {u.institutionalId || u.studentId || 'BAUST'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-800">
                              {u.department || 'BAUST'}
                            </span>
                            <div className="text-[10px] text-blue-600 font-semibold">{u.userType || u.role || 'Member'}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-extrabold text-[11px]">
                              {u.bloodGroup || 'O+'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900">{u.availabilityStatus || 'Available'}</span>
                          </td>
                          <td className="py-3 px-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                checked={Boolean(u.isDisasterVolunteer)}
                                onChange={() => handleToggleDisasterVolunteer(u)}
                                className="sr-only peer"
                                type="checkbox"
                              />
                              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${u.isSuspended ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${u.isSuspended ? 'bg-rose-600' : 'bg-blue-600'}`}></span>{' '}
                              {u.isSuspended ? 'Suspended' : 'Active'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleResetPassword(u)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-100"
                                title="Reset Password"
                                type="button"
                              >
                                <i className="fa-solid fa-key text-xs"></i>
                              </button>
                              <button
                                onClick={() => handleToggleSuspendUser(u)}
                                className={`p-1.5 rounded hover:bg-slate-100 ${u.isSuspended ? 'text-emerald-600 hover:text-emerald-800' : 'text-slate-400 hover:text-rose-600'}`}
                                title={u.isSuspended ? 'Reactivate Account' : 'Suspend Account'}
                                type="button"
                              >
                                <i className={`fa-solid ${u.isSuspended ? 'fa-user-check' : 'fa-ban'} text-xs`}></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* 6. SYSTEM LOGS & AUDIT TRAIL TAB */}
            {activeTab === 'audit-log' && (
              <section className="admin-glass-panel p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center text-base shadow-sm">
                      <i className="fa-solid fa-database"></i>
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight">
                        Immutable System Audit Logs &amp; Real-Time Telemetry
                      </h3>
                      <p className="text-xs text-slate-500">
                        Cryptographically signed action log for super admin overrides and medical desk actions.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg font-bold">
                    DATABASE SYNC OK
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  {auditLogs.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs italic bg-slate-900 text-slate-200 rounded-xl">
                      Audit telemetry stream online. No prior audit logs returned for current filter.
                    </div>
                  ) : (
                    auditLogs.map((log) => (
                      <div key={log._id} className="p-3 bg-slate-900 text-slate-200 rounded-xl space-y-1.5">
                        <div className="text-emerald-400 font-bold">[{new Date(log.createdAt).toISOString()}] {log.action}</div>
                        <div className="text-slate-400">
                          Target: {log.targetModel} #{log.targetId} • IP: {log.ipAddress} • PerformedBy: {log.performedBy?.name || 'Super Admin'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            {/* Bottom Audit Footer */}
            <footer className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
              <div className="flex items-center gap-4">
                <a className="hover:underline text-blue-700 font-semibold" href="#overview">
                  Admin Documentation
                </a>
                <a className="hover:underline text-blue-700 font-semibold" href="#overview">
                  Security Keys
                </a>
                <span className="text-slate-400">© 2026 BAUST BloodLink — Cantonment Node</span>
              </div>
            </footer>
          </main>
        </div>
      </div>

      {/* ─── MODAL: TRIGGER SOS BROADCAST (POST /api/blood-requests) ─────── */}
      {broadcastSosModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center text-xs shadow-sm">
                  <i className="fa-solid fa-tower-broadcast"></i>
                </div>
                <h4 className="font-black text-slate-900 text-base">Trigger Emergency SOS Broadcast</h4>
              </div>
              <button
                onClick={() => setBroadcastSosModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Patient &amp; Diagnosis Context</label>
                <input
                  type="text"
                  placeholder="e.g. Patient #B819 • Severe Surgical Hemorrhage"
                  value={broadcastForm.patientName}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, patientName: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Required Blood Group</label>
                  <select
                    value={broadcastForm.bloodGroup}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, bloodGroup: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-rose-700 focus:ring-2 focus:ring-rose-500 outline-none bg-slate-50"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bags / Units</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={broadcastForm.unitsRequired}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, unitsRequired: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Hospital Destination</label>
                <select
                  value={broadcastForm.hospitalName}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, hospitalName: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-rose-500 outline-none bg-slate-50"
                >
                  <option value="Saidpur CMH">Saidpur CMH (Cantonment Hospital)</option>
                  <option value="BAUST Medical Center">BAUST Medical Center (Campus Clinic)</option>
                  <option value="Rangpur Medical College">Rangpur Medical College &amp; Hospital</option>
                  <option value="Saidpur Railway Hospital">Saidpur 100-Bed Railway Hospital</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setBroadcastSosModalOpen(false)}
                className="flex-1 py-2 rounded-xl text-slate-600 bg-slate-100 font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBroadcastSos}
                className="flex-1 py-2 rounded-xl text-white bg-gradient-to-r from-rose-600 to-red-600 font-bold hover:from-rose-700 hover:to-red-700 shadow-md shadow-rose-500/30 transition-all"
              >
                Broadcast to Campus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: POST ANNOUNCEMENT (POST /api/posts) ────────────────────── */}
      {announcementModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-blue-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-blue-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs shadow-sm">
                  <i className="fa-solid fa-bullhorn"></i>
                </div>
                <h4 className="font-black text-slate-900 text-base">Broadcast Campus Announcement</h4>
              </div>
              <button onClick={() => setAnnouncementModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            <div>
              <label className="font-bold text-xs text-slate-700 block mb-1.5">Announcement Content</label>
              <textarea
                rows={4}
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Type executive announcement (will be pinned to student & faculty feed)..."
                className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setAnnouncementModalOpen(false)}
                className="flex-1 py-2 rounded-xl text-slate-600 bg-slate-100 text-xs font-bold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handlePostAnnouncement}
                className="flex-1 py-2 rounded-xl text-white bg-blue-600 text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20"
              >
                Post &amp; Pin Announcement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: INSPECT DOCUMENT / REPORT ─────────────────────────────── */}
      {inspectModalDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-black text-slate-900 text-base">Verification Report Inspector</h4>
                <p className="text-xs text-slate-500">
                  {inspectModalDoc.user?.name || inspectModalDoc.userName} — Requesting change from{' '}
                  <span className="font-bold line-through">{inspectModalDoc.currentGroup || inspectModalDoc.oldBloodGroup}</span> to{' '}
                  <span className="font-bold text-rose-600">{inspectModalDoc.requestedGroup || inspectModalDoc.newBloodGroup}</span>
                </p>
              </div>
              <button onClick={() => setInspectModalDoc(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            <div className="bg-slate-100 p-4 rounded-xl flex items-center justify-center min-h-[220px]">
              <div className="text-center space-y-2">
                <i className="fa-regular fa-file-pdf text-rose-600 text-5xl"></i>
                <div className="font-bold text-xs text-slate-800">{inspectModalDoc.documentName || 'Official_Blood_Certificate.pdf'}</div>
                <div className="text-[11px] text-slate-500">Document proof submitted by student/faculty for verification audit.</div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  handleApproveRegistry(inspectModalDoc._id);
                  setInspectModalDoc(null);
                }}
                className="flex-1 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700"
              >
                Approve Verification
              </button>
              <button
                onClick={() => {
                  setRejectModalReq(inspectModalDoc);
                  setInspectModalDoc(null);
                }}
                className="flex-1 py-2 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl hover:bg-rose-100"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: REJECT BLOOD REGISTRY REASON (PATCH /reject) ──────────── */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h4 className="font-black text-slate-900 text-base">Reject Blood Group Change</h4>
            <p className="text-xs text-slate-500">
              Provide an audit reason for rejecting {rejectModalReq.user?.name || rejectModalReq.userName}'s request.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Lab report seal illegible / missing hospital verification..."
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-rose-500 outline-none"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRejectModalReq(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectRegistry}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD COMMITTEE MEMBER (POST /api/helpline) ─────────────── */}
      {committeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-blue-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-black text-slate-900 text-base">Add Executive Committee Member</h4>
              <button onClick={() => setCommitteeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={committeeForm.name}
                  onChange={(e) => setCommitteeForm({ ...committeeForm, name: e.target.value })}
                  placeholder="e.g. Dr. Shafiqul Alam"
                  className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Blood Group</label>
                  <select
                    value={committeeForm.bloodGroup}
                    onChange={(e) => setCommitteeForm({ ...committeeForm, bloodGroup: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 outline-none bg-slate-50 font-bold"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Display Tier</label>
                  <select
                    value={committeeForm.rankBadge}
                    onChange={(e) => setCommitteeForm({ ...committeeForm, rankBadge: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 outline-none bg-slate-50"
                  >
                    <option value="1st Tier Display">1st Tier Display</option>
                    <option value="2nd Tier Display">2nd Tier Display</option>
                    <option value="3rd Tier Display">3rd Tier Display</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Designation / Role</label>
                <input
                  type="text"
                  value={committeeForm.role}
                  onChange={(e) => setCommitteeForm({ ...committeeForm, role: e.target.value })}
                  placeholder="e.g. Associate Professor, CSE"
                  className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={committeeForm.phone}
                  onChange={(e) => setCommitteeForm({ ...committeeForm, phone: e.target.value })}
                  placeholder="e.g. +880 1711-000000"
                  className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setCommitteeModalOpen(false)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCommitteeMember}
                className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700"
              >
                Save Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: DELETE POST REASON (DELETE /api/admin/posts/:id) ──────── */}
      {deleteModalPost && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h4 className="font-black text-slate-900 text-base">Delete Feed Post</h4>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete the post by {deleteModalPost.author?.name || 'User'}?
            </p>
            <textarea
              rows={3}
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Reason for deletion..."
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDeleteModalPost(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePost}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboardScreen;
