import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

const ADMIN_TABS = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'feed-moderation', label: 'Feed Moderation', icon: 'newspaper' },
  { id: 'blood-registry', label: 'Blood Registry', icon: 'verified_user' },
  { id: 'sos-monitor', label: 'Emergency SOS Monitor', icon: 'emergency' },
  { id: 'helpline-cms', label: 'Helpline CMS', icon: 'support_agent' },
  { id: 'user-management', label: 'User Administration', icon: 'manage_accounts' },
  { id: 'audit-log', label: 'Audit Log', icon: 'receipt_long' },
];

function AdminDashboardScreen() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Overview metrics state
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [metricsError, setMetricsError] = useState('');

  // Feed moderation state
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsError, setPostsError] = useState('');
  const [deleteModalPost, setDeleteModalPost] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  // Blood registry approval queue state
  const [registryRequests, setRegistryRequests] = useState([]);
  const [loadingRegistry, setLoadingRegistry] = useState(false);
  const [registryError, setRegistryError] = useState('');
  const [rejectModalReq, setRejectModalReq] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Emergency SOS live monitor state
  const [sosRequests, setSosRequests] = useState([]);
  const [loadingSos, setLoadingSos] = useState(false);
  const [sosError, setSosError] = useState('');
  const [overrideModalReq, setOverrideModalReq] = useState(null);
  const [overrideStatus, setOverrideStatus] = useState('Fulfilled');
  const [overrideReason, setOverrideReason] = useState('');

  // Helpline CMS state
  const [helplines, setHelplines] = useState([]);
  const [loadingHelpline, setLoadingHelpline] = useState(false);
  const [helplineError, setHelplineError] = useState('');
  const [helplineModalOpen, setHelplineModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [helplineForm, setHelplineForm] = useState({
    category: 'Committee',
    name: '',
    role: '',
    phone: '',
    email: '',
    whatsappNumber: '',
    location: '',
    isAvailable24_7: false,
  });

  // User Administration state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');

  // Audit Log state
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');

  // Action status banners
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

  // ─── 1. FETCH OVERVIEW METRICS ─────────────────────────────────────────────
  const fetchOverviewMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    setMetricsError('');
    try {
      const res = await fetch('/api/admin/overview', { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch platform metrics');
      setMetrics(data.metrics);
    } catch (err) {
      setMetricsError(err.message);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  // ─── 2. FETCH POSTS FOR MODERATION ─────────────────────────────────────────
  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    setPostsError('');
    try {
      const res = await fetch('/api/admin/posts?limit=30', { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch feed posts');
      setPosts(data.posts || []);
    } catch (err) {
      setPostsError(err.message);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  const handleTogglePin = async (postId) => {
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
      showNotification(data.message);
      setDeleteModalPost(null);
      setDeleteReason('');
      fetchPosts();
    } catch (err) {
      showNotification('', err.message);
    }
  };

  // ─── 3. FETCH BLOOD REGISTRY REQUESTS ───────────────────────────────────────
  const fetchRegistryRequests = useCallback(async () => {
    setLoadingRegistry(true);
    setRegistryError('');
    try {
      const res = await fetch('/api/admin/blood-registry/requests?status=Pending', { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch registry queue');
      setRegistryRequests(data.requests || []);
    } catch (err) {
      setRegistryError(err.message);
    } finally {
      setLoadingRegistry(false);
    }
  }, []);

  const handleApproveRegistry = async (reqId) => {
    try {
      const res = await fetch(`/api/admin/blood-registry/requests/${reqId}/approve`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ adminNotes: 'Verified with official lab report documentation.' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Approval failed');
      showNotification(data.message);
      fetchRegistryRequests();
      fetchOverviewMetrics();
    } catch (err) {
      showNotification('', err.message);
    }
  };

  const handleRejectRegistry = async () => {
    if (!rejectModalReq) return;
    if (!rejectReason.trim()) {
      showNotification('', 'Rejection reason is required.');
      return;
    }
    try {
      const res = await fetch(`/api/admin/blood-registry/requests/${rejectModalReq._id}/reject`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Rejection failed');
      showNotification(data.message);
      setRejectModalReq(null);
      setRejectReason('');
      fetchRegistryRequests();
      fetchOverviewMetrics();
    } catch (err) {
      showNotification('', err.message);
    }
  };

  // ─── 4. FETCH ACTIVE EMERGENCY SOS ──────────────────────────────────────────
  const fetchSosRequests = useCallback(async () => {
    setLoadingSos(true);
    setSosError('');
    try {
      const res = await fetch('/api/admin/emergency/active', { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch emergency requisitions');
      setSosRequests(data.requests || []);
    } catch (err) {
      setSosError(err.message);
    } finally {
      setLoadingSos(false);
    }
  }, []);

  const handleOverrideSos = async () => {
    if (!overrideModalReq) return;
    if (!overrideReason.trim()) {
      showNotification('', 'Override reason is required.');
      return;
    }
    try {
      const res = await fetch(`/api/admin/emergency/${overrideModalReq._id}/override`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: overrideStatus, overrideReason: overrideReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Status override failed');
      showNotification(data.message);
      setOverrideModalReq(null);
      setOverrideReason('');
      fetchSosRequests();
      fetchOverviewMetrics();
    } catch (err) {
      showNotification('', err.message);
    }
  };

  // ─── 5. FETCH HELPLINES ────────────────────────────────────────────────────
  const fetchHelplines = useCallback(async () => {
    setLoadingHelpline(true);
    setHelplineError('');
    try {
      const res = await fetch('/api/admin/helpline', { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch helpline directory');
      setHelplines(data.contacts || []);
    } catch (err) {
      setHelplineError(err.message);
    } finally {
      setLoadingHelpline(false);
    }
  }, []);

  const handleSaveHelpline = async (e) => {
    e.preventDefault();
    try {
      const url = editingContact ? `/api/admin/helpline/${editingContact._id}` : '/api/admin/helpline';
      const method = editingContact ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(helplineForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save contact');
      showNotification(data.message);
      setHelplineModalOpen(false);
      setEditingContact(null);
      fetchHelplines();
    } catch (err) {
      showNotification('', err.message);
    }
  };

  const handleDeleteHelpline = async (id) => {
    if (!confirm('Are you sure you want to delete this helpline contact?')) return;
    try {
      const res = await fetch(`/api/admin/helpline/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete contact');
      showNotification(data.message);
      fetchHelplines();
    } catch (err) {
      showNotification('', err.message);
    }
  };

  const handleMoveHelpline = async (index, direction) => {
    const newItems = [...helplines];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const orderList = newItems.map((item, idx) => ({ id: item._id, order: idx + 1 }));
    setHelplines(newItems);

    try {
      const res = await fetch('/api/admin/helpline/reorder', {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ orderList }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reorder');
      showNotification('Helpline order updated and persisted.');
    } catch (err) {
      showNotification('', err.message);
      fetchHelplines();
    }
  };

  // ─── 6. FETCH USERS ────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setUsersError('');
    try {
      let url = `/api/admin/users?limit=30`;
      if (userSearch) url += `&search=${encodeURIComponent(userSearch)}`;
      if (userTypeFilter) url += `&userType=${encodeURIComponent(userTypeFilter)}`;

      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch users');
      setUsers(data.users || []);
    } catch (err) {
      setUsersError(err.message);
    } finally {
      setLoadingUsers(false);
    }
  }, [userSearch, userTypeFilter]);

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ userType: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update role');
      showNotification(data.message);
      fetchUsers();
    } catch (err) {
      showNotification('', err.message);
    }
  };

  const handleUpdateUserStatus = async (userId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ availabilityStatus: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update availability status');
      showNotification(data.message);
      fetchUsers();
    } catch (err) {
      showNotification('', err.message);
    }
  };

  // ─── 7. FETCH AUDIT LOGS ───────────────────────────────────────────────────
  const fetchAuditLogs = useCallback(async () => {
    setLoadingAudit(true);
    setAuditError('');
    try {
      let url = `/api/admin/audit-logs?limit=40`;
      if (auditActionFilter) url += `&action=${encodeURIComponent(auditActionFilter)}`;

      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch audit trail');
      setAuditLogs(data.logs || []);
    } catch (err) {
      setAuditError(err.message);
    } finally {
      setLoadingAudit(false);
    }
  }, [auditActionFilter]);

  // Initial load according to active tab
  useEffect(() => {
    fetchOverviewMetrics();
  }, [fetchOverviewMetrics]);

  useEffect(() => {
    if (activeTab === 'feed-moderation') fetchPosts();
    else if (activeTab === 'blood-registry') fetchRegistryRequests();
    else if (activeTab === 'sos-monitor') fetchSosRequests();
    else if (activeTab === 'helpline-cms') fetchHelplines();
    else if (activeTab === 'user-management') fetchUsers();
    else if (activeTab === 'audit-log') fetchAuditLogs();
  }, [
    activeTab,
    fetchPosts,
    fetchRegistryRequests,
    fetchSosRequests,
    fetchHelplines,
    fetchUsers,
    fetchAuditLogs,
  ]);

  // RBAC Access Guard in UI
  const isAdmin = user && (user.userType === 'Admin' || user.role === 'Admin');

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="page-wrapper max-w-[700px] mx-auto py-16 text-center">
        <div className="glass-card p-space-xl rounded-2xl border border-error/30">
          <div className="w-16 h-16 rounded-2xl bg-error/10 text-error mx-auto mb-4 flex items-center justify-center">
            <span className="material-symbols-outlined text-[36px]">gpp_bad</span>
          </div>
          <h2 className="text-headline-md font-bold text-on-surface">Restricted Admin Portal</h2>
          <p className="text-body-md text-on-surface-variant mt-2 max-w-md mx-auto">
            This module is guarded by server-side RBAC middleware (`req.user.userType === 'Admin'`). Please authenticate with an Administrator account to access the command center.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper max-w-[1400px] mx-auto text-left space-y-6">
      {/* ─── ADMIN HEADER ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-primary border border-primary/40 flex items-center justify-center shadow-lg">
            <span
              className="material-symbols-outlined text-[28px]"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              admin_panel_settings
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-headline-sm font-black text-on-surface tracking-tight">
                Admin Command Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">
                Phase 6 RBAC Gated
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Super Admin & Coordinator Platform Control · Every operation recorded to Audit Log
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchOverviewMetrics();
              if (activeTab === 'feed-moderation') fetchPosts();
              if (activeTab === 'blood-registry') fetchRegistryRequests();
              if (activeTab === 'sos-monitor') fetchSosRequests();
              if (activeTab === 'helpline-cms') fetchHelplines();
              if (activeTab === 'user-management') fetchUsers();
              if (activeTab === 'audit-log') fetchAuditLogs();
            }}
            className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5 font-semibold"
          >
            <span className="material-symbols-outlined text-[16px]">sync</span>
            <span>Refresh</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono font-bold border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{user?.institutionalId || 'ADMIN'}</span>
          </div>
        </div>
      </div>

      {/* ─── NOTIFICATION BANNERS ────────────────────────────────────────── */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')}>
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')}>
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* ─── MODULE TABS NAVIGATION ────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-outline-variant/20 scrollbar-none">
        {ADMIN_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md border border-slate-700'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: isActive ? '"FILL" 1' : '"FILL" 0' }}
              >
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.id === 'blood-registry' && metrics?.pendingGroupChanges > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-primary text-white">
                  {metrics.pendingGroupChanges}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: OVERVIEW METRICS ──────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {loadingMetrics ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-surface-container animate-pulse" />
              ))}
            </div>
          ) : metricsError ? (
            <div className="glass-card p-6 text-center text-error border border-error/20 rounded-2xl">
              <p className="text-xs font-bold">{metricsError}</p>
              <button onClick={fetchOverviewMetrics} className="btn-outline text-xs mt-3">
                Retry Aggregation
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                <MetricCard
                  title="Registered Users"
                  count={metrics?.totalUsers ?? '—'}
                  icon="group"
                  accent="text-indigo-600"
                />
                <MetricCard
                  title="Available Donors"
                  count={metrics?.availableDonors ?? '—'}
                  icon="person_check"
                  accent="text-emerald-600"
                />
                <MetricCard
                  title="Disaster Reserve"
                  count={metrics?.disasterVolunteers ?? '—'}
                  icon="e911_emergency"
                  accent="text-rose-600"
                />
                <MetricCard
                  title="Active SOS Cases"
                  count={metrics?.emergencyRequests ?? '—'}
                  icon="notifications_active"
                  accent="text-amber-600"
                />
                <MetricCard
                  title="Pending Approvals"
                  count={metrics?.pendingGroupChanges ?? '—'}
                  icon="pending_actions"
                  accent="text-primary"
                />
                <MetricCard
                  title="Audit Records"
                  count={metrics?.totalAuditLogs ?? '—'}
                  icon="receipt_long"
                  accent="text-slate-600"
                />
              </div>

              {/* Quick Jump Panels to the 6 Submodules */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <ActionShortcutCard
                  title="Feed Moderation"
                  description="Review campus posts, pin announcements, and remove offending content."
                  icon="newspaper"
                  badge={`${metrics?.totalPosts ?? 0} Posts (${metrics?.pinnedPosts ?? 0} Pinned)`}
                  onClick={() => setActiveTab('feed-moderation')}
                />
                <ActionShortcutCard
                  title="Blood Registry Queue"
                  description="Verify institutional blood group change requests against lab documentation."
                  icon="verified_user"
                  badge={`${metrics?.pendingGroupChanges ?? 0} Pending`}
                  onClick={() => setActiveTab('blood-registry')}
                />
                <ActionShortcutCard
                  title="Emergency SOS Live Monitor"
                  description="Live command feed of emergency cases with admin override capability."
                  icon="emergency"
                  badge={`${metrics?.emergencyRequests ?? 0} Emergency`}
                  onClick={() => setActiveTab('sos-monitor')}
                />
                <ActionShortcutCard
                  title="Helpline CMS"
                  description="Manage campus medical center, emergency ambulance, and committee contacts."
                  icon="support_agent"
                  badge={`${metrics?.totalHelplines ?? 0} Contacts`}
                  onClick={() => setActiveTab('helpline-cms')}
                />
                <ActionShortcutCard
                  title="User & Role Administration"
                  description="Manage institutional roles (Student/Teacher/Staff/Admin) and donor status."
                  icon="manage_accounts"
                  badge={`${metrics?.totalUsers ?? 0} Accounts`}
                  onClick={() => setActiveTab('user-management')}
                />
                <ActionShortcutCard
                  title="Security Audit Trail"
                  description="Immutable read-only log of every administrative and security event."
                  icon="receipt_long"
                  badge={`${metrics?.totalAuditLogs ?? 0} Events`}
                  onClick={() => setActiveTab('audit-log')}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── TAB 2: FEED MODERATION ───────────────────────────────────────── */}
      {activeTab === 'feed-moderation' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-on-surface">Campus Community Feed Moderation</h2>
            <span className="text-xs text-on-surface-variant">{posts.length} posts loaded</span>
          </div>

          {loadingPosts ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-surface-container animate-pulse" />
              ))}
            </div>
          ) : postsError ? (
            <div className="glass-card p-6 text-center text-error border border-error/20 rounded-2xl">
              <p className="text-xs font-bold">{postsError}</p>
              <button onClick={fetchPosts} className="btn-outline text-xs mt-3">
                Retry
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
              No posts found in campus feed.
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post._id}
                  className="glass-card p-4 rounded-2xl border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-on-surface">
                        {post.author?.name || 'Unknown Author'}
                      </span>
                      <span className="text-[10px] font-mono text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded">
                        {post.author?.institutionalId || 'ID N/A'}
                      </span>
                      <span className="blood-group-chip text-[9px] px-1 py-0">
                        {post.author?.bloodGroup || 'N/A'}
                      </span>
                      {post.isPinned && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 border border-amber-500/30 flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[12px]">push_pin</span>
                          PINNED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface leading-relaxed">{post.content}</p>
                    <div className="flex items-center gap-3 text-[11px] text-on-surface-variant">
                      <span>{new Date(post.createdAt).toLocaleString()}</span>
                      <span>·</span>
                      <span>❤️ {post.loveCount || 0}</span>
                      <span>💬 {post.commentCount || 0}</span>
                      <span>🔁 {post.repostCount || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => handleTogglePin(post._id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1 ${
                        post.isPinned
                          ? 'border-amber-500/40 text-amber-700 bg-amber-500/10 hover:bg-amber-500/20'
                          : 'border-outline-variant/40 text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {post.isPinned ? 'keep_off' : 'push_pin'}
                      </span>
                      <span>{post.isPinned ? 'Unpin' : 'Pin'}</span>
                    </button>

                    <button
                      onClick={() => setDeleteModalPost(post)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold border border-error/30 text-error bg-error/5 hover:bg-error/10 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: BLOOD REGISTRY APPROVAL QUEUE ──────────────────────────── */}
      {activeTab === 'blood-registry' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-on-surface">
                Blood Registry Verification Queue
              </h2>
              <p className="text-xs text-on-surface-variant">
                Users requesting blood group corrections must provide medical lab evidence before updating institutional records.
              </p>
            </div>
            <span className="text-xs font-bold text-primary">
              {registryRequests.length} Pending
            </span>
          </div>

          {loadingRegistry ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-32 rounded-2xl bg-surface-container animate-pulse" />
              ))}
            </div>
          ) : registryError ? (
            <div className="glass-card p-6 text-center text-error border border-error/20 rounded-2xl">
              <p className="text-xs font-bold">{registryError}</p>
              <button onClick={fetchRegistryRequests} className="btn-outline text-xs mt-3">
                Retry
              </button>
            </div>
          ) : registryRequests.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
              <span className="material-symbols-outlined text-[36px] text-emerald-500 block mb-2">
                verified
              </span>
              <p className="font-bold text-xs text-on-surface">Queue Clear</p>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                No pending blood group verification requests requiring admin action.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {registryRequests.map((reqItem) => (
                <div
                  key={reqItem._id}
                  className="glass-card p-4 rounded-2xl border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface">{reqItem.user?.name || 'User'}</span>
                      <span className="font-mono text-[10px] text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded">
                        {reqItem.user?.institutionalId || 'ID N/A'}
                      </span>
                      <span className="text-on-surface-variant">· {reqItem.user?.department}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-on-surface-variant">Current:</span>
                      <span className="font-mono font-bold text-on-surface px-1.5 py-0.5 rounded bg-surface-container-low">
                        {reqItem.currentGroup}
                      </span>
                      <span className="material-symbols-outlined text-[16px] text-primary">
                        arrow_forward
                      </span>
                      <span className="text-on-surface-variant">Requested:</span>
                      <span className="font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                        {reqItem.requestedGroup}
                      </span>
                    </div>

                    {reqItem.reason && (
                      <p className="text-on-surface text-[11px]">
                        <span className="font-semibold text-on-surface-variant">Reason: </span>
                        {reqItem.reason}
                      </p>
                    )}

                    {reqItem.labReportUrl && (
                      <div className="pt-0.5">
                        <a
                          href={reqItem.labReportUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                        >
                          <span className="material-symbols-outlined text-[14px]">link</span>
                          <span>View Submitted Lab Report / Document</span>
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveRegistry(reqItem._id)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">check</span>
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => setRejectModalReq(reqItem)}
                      className="px-4 py-2 rounded-xl text-xs font-bold border border-error/30 text-error hover:bg-error/5 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: EMERGENCY SOS LIVE MONITOR ────────────────────────────── */}
      {activeTab === 'sos-monitor' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-on-surface">Emergency SOS Live Monitor</h2>
              <p className="text-xs text-on-surface-variant">
                Live stream of emergency blood requisitions requiring urgent coordinator oversight.
              </p>
            </div>
            <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              Live Stream
            </span>
          </div>

          {loadingSos ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-32 rounded-2xl bg-surface-container animate-pulse" />
              ))}
            </div>
          ) : sosError ? (
            <div className="glass-card p-6 text-center text-error border border-error/20 rounded-2xl">
              <p className="text-xs font-bold">{sosError}</p>
              <button onClick={fetchSosRequests} className="btn-outline text-xs mt-3">
                Retry
              </button>
            </div>
          ) : sosRequests.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
              No active emergency SOS requisitions at this moment.
            </div>
          ) : (
            <div className="space-y-3">
              {sosRequests.map((reqItem) => (
                <div
                  key={reqItem._id}
                  className="glass-card p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-on-surface">{reqItem.patientName}</span>
                      <span className="blood-group-chip text-[10px] px-2 py-0.5 font-mono">
                        {reqItem.bloodGroup} · {reqItem.units} {reqItem.units === 1 ? 'Unit' : 'Units'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                        EMERGENCY
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container text-on-surface border border-outline-variant/40">
                        {reqItem.status}
                      </span>
                    </div>

                    <p className="text-on-surface-variant text-[11px]">
                      Patient Type: <strong>{reqItem.patientType}</strong> · Hospital: <strong>{reqItem.hospital}</strong>
                      {reqItem.hospitalBed && ` (${reqItem.hospitalBed})`}
                    </p>

                    <p className="text-on-surface-variant text-[11px]">
                      Requester: {reqItem.contactName || reqItem.requester?.name} ({reqItem.contactPhone || reqItem.requester?.phone})
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setOverrideModalReq(reqItem);
                      setOverrideStatus(reqItem.status || 'Fulfilled');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold btn-outline border-primary/40 text-primary hover:bg-primary/5 flex items-center gap-1 self-end md:self-center"
                  >
                    <span className="material-symbols-outlined text-[16px]">tune</span>
                    <span>Override Status</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 5: HELPLINE CMS ──────────────────────────────────────────── */}
      {activeTab === 'helpline-cms' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-on-surface">Helpline & Committee Directory CMS</h2>
              <p className="text-xs text-on-surface-variant">
                Full CRUD and drag-reorder. Updates reflect on the public Helpline screen immediately.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingContact(null);
                setHelplineForm({
                  category: 'Committee',
                  name: '',
                  role: '',
                  phone: '',
                  email: '',
                  whatsappNumber: '',
                  location: '',
                  isAvailable24_7: false,
                });
                setHelplineModalOpen(true);
              }}
              className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Add New Contact</span>
            </button>
          </div>

          {loadingHelpline ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-surface-container animate-pulse" />
              ))}
            </div>
          ) : helplineError ? (
            <div className="glass-card p-6 text-center text-error border border-error/20 rounded-2xl">
              <p className="text-xs font-bold">{helplineError}</p>
              <button onClick={fetchHelplines} className="btn-outline text-xs mt-3">
                Retry
              </button>
            </div>
          ) : helplines.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
              No helpline contacts registered. Click "Add New Contact" to create one.
            </div>
          ) : (
            <div className="space-y-2">
              {helplines.map((item, idx) => (
                <div
                  key={item._id || idx}
                  className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between text-xs transition hover:border-primary/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <button
                        disabled={idx === 0}
                        onClick={() => handleMoveHelpline(idx, -1)}
                        className="text-on-surface-variant hover:text-primary disabled:opacity-20"
                      >
                        <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                      </button>
                      <button
                        disabled={idx === helplines.length - 1}
                        onClick={() => handleMoveHelpline(idx, 1)}
                        className="text-on-surface-variant hover:text-primary disabled:opacity-20"
                      >
                        <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-on-surface text-sm">{item.name}</span>
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                          {item.category}
                        </span>
                        {item.isAvailable24_7 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-700">
                            24/7
                          </span>
                        )}
                      </div>
                      <p className="text-on-surface-variant text-[11px]">
                        {item.role} · <strong>{item.phone}</strong> {item.location && `· ${item.location}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingContact(item);
                        setHelplineForm({
                          category: item.category,
                          name: item.name,
                          role: item.role,
                          phone: item.phone,
                          email: item.email || '',
                          whatsappNumber: item.whatsappNumber || '',
                          location: item.location || '',
                          isAvailable24_7: Boolean(item.isAvailable24_7),
                        });
                        setHelplineModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg border border-outline-variant/40 hover:bg-surface-container"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteHelpline(item._id)}
                      className="p-1.5 rounded-lg border border-error/30 text-error hover:bg-error/10"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 6: USER & ROLE ADMINISTRATION ────────────────────────────── */}
      {activeTab === 'user-management' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-on-surface">User & Role Administration</h2>
              <p className="text-xs text-on-surface-variant">
                Manage accounts, assign roles (Student, Teacher, Staff, Admin), and set donor availability status.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search by ID or name..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-outline-variant/60 text-xs bg-surface-container-lowest"
              />
              <select
                value={userTypeFilter}
                onChange={(e) => setUserTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-outline-variant/60 text-xs bg-surface-container-lowest"
              >
                <option value="">All Roles</option>
                <option value="Student">Student</option>
                <option value="Teacher">Teacher</option>
                <option value="Staff">Staff</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>

          {loadingUsers ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-surface-container animate-pulse" />
              ))}
            </div>
          ) : usersError ? (
            <div className="glass-card p-6 text-center text-error border border-error/20 rounded-2xl">
              <p className="text-xs font-bold">{usersError}</p>
              <button onClick={fetchUsers} className="btn-outline text-xs mt-3">
                Retry
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
              No users match the search criteria.
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u._id}
                  className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface">{u.name}</span>
                      <span className="font-mono text-[10px] text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded">
                        {u.institutionalId}
                      </span>
                      <span className="blood-group-chip text-[9px] px-1.5 py-0.2">
                        {u.bloodGroup}
                      </span>
                      {u.isDisasterVolunteer && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-primary/10 text-primary">
                          Disaster Reserve
                        </span>
                      )}
                    </div>
                    <p className="text-on-surface-variant text-[11px]">
                      {u.department} · {u.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-on-surface-variant text-[10px]">Role:</span>
                      <select
                        value={u.userType}
                        onChange={(e) => handleUpdateUserRole(u._id, e.target.value)}
                        className="px-2 py-1 rounded-lg border border-outline-variant/60 bg-surface-container-low font-semibold text-xs"
                      >
                        <option value="Student">Student</option>
                        <option value="Teacher">Teacher</option>
                        <option value="Staff">Staff</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-on-surface-variant text-[10px]">Status:</span>
                      <select
                        value={u.availabilityStatus || 'Available'}
                        onChange={(e) => handleUpdateUserStatus(u._id, e.target.value)}
                        className="px-2 py-1 rounded-lg border border-outline-variant/60 bg-surface-container-low font-semibold text-xs"
                      >
                        <option value="Available">Available</option>
                        <option value="Cooldown">Cooldown</option>
                        <option value="Unavailable">Unavailable</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 7: AUDIT LOG VIEWER ──────────────────────────────────────── */}
      {activeTab === 'audit-log' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-on-surface">Immutable System Audit Log</h2>
              <p className="text-xs text-on-surface-variant">
                Full cryptographic and operation record of all admin actions with actor IDs, IP addresses, and timestamps.
              </p>
            </div>

            <select
              value={auditActionFilter}
              onChange={(e) => setAuditActionFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-outline-variant/60 text-xs bg-surface-container-lowest"
            >
              <option value="">All Actions</option>
              <option value="PIN_POST">PIN_POST</option>
              <option value="UNPIN_POST">UNPIN_POST</option>
              <option value="DELETE_POST">DELETE_POST</option>
              <option value="APPROVE_BLOOD_GROUP_CHANGE">APPROVE_BLOOD_GROUP_CHANGE</option>
              <option value="REJECT_BLOOD_GROUP_CHANGE">REJECT_BLOOD_GROUP_CHANGE</option>
              <option value="EMERGENCY_STATUS_OVERRIDE">EMERGENCY_STATUS_OVERRIDE</option>
              <option value="CREATE_HELPLINE_CONTACT">CREATE_HELPLINE_CONTACT</option>
              <option value="UPDATE_USER_ROLE">UPDATE_USER_ROLE</option>
              <option value="UPDATE_USER_AVAILABILITY_STATUS">UPDATE_USER_AVAILABILITY_STATUS</option>
            </select>
          </div>

          {loadingAudit ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-surface-container animate-pulse" />
              ))}
            </div>
          ) : auditError ? (
            <div className="glass-card p-6 text-center text-error border border-error/20 rounded-2xl">
              <p className="text-xs font-bold">{auditError}</p>
              <button onClick={fetchAuditLogs} className="btn-outline text-xs mt-3">
                Retry
              </button>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
              No audit records matching filter.
            </div>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div
                  key={log._id}
                  className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded font-black text-[10px] bg-slate-800 text-white">
                        {log.action}
                      </span>
                      <span className="text-on-surface-variant text-[11px]">
                        Target: <strong className="text-on-surface">{log.targetType}</strong> ({log.targetId})
                      </span>
                    </div>

                    <div className="text-[11px] text-on-surface-variant">
                      By: <strong>{log.performedBy?.name || 'Admin'}</strong> [{log.performedBy?.institutionalId || 'ADM'}] · IP: {log.ipAddress}
                    </div>

                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="text-[10px] text-on-surface bg-surface-container-low p-1.5 rounded border border-outline-variant/20">
                        {JSON.stringify(log.details)}
                      </div>
                    )}
                  </div>

                  <span className="text-[11px] text-on-surface-variant whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── MODALS ───────────────────────────────────────────────────────── */}

      {/* Delete Post Modal */}
      {deleteModalPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="glass-modal max-w-[460px] w-full p-6 rounded-2xl border border-error/30 shadow-2xl space-y-4 text-left">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-[20px]">delete_forever</span>
              Moderate Offending Post
            </h3>
            <p className="text-xs text-on-surface-variant">
              Deleting this post removes it permanently from the campus feed and records an entry into the audit trail.
            </p>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Moderation Reason / Violation *
              </label>
              <input
                type="text"
                required
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="e.g., Inappropriate language, commercial spam"
                className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-xs"
              />
            </div>
            <div className="pt-2 border-t border-outline-variant/20 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setDeleteModalPost(null)}
                className="px-4 py-2 rounded-xl border border-outline-variant/40"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePost}
                className="px-4 py-2 rounded-xl font-bold bg-error text-white hover:bg-error/90"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Blood Group Request Modal */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="glass-modal max-w-[460px] w-full p-6 rounded-2xl border border-error/30 shadow-2xl space-y-4 text-left">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-[20px]">cancel</span>
              Reject Blood Group Verification
            </h3>
            <p className="text-xs text-on-surface-variant">
              Spec requires a clear reason for rejecting a blood group change request.
            </p>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Rejection Reason *
              </label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Unclear lab report image, lab header missing stamp"
                className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-xs"
              />
            </div>
            <div className="pt-2 border-t border-outline-variant/20 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setRejectModalReq(null)}
                className="px-4 py-2 rounded-xl border border-outline-variant/40"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectRegistry}
                className="px-4 py-2 rounded-xl font-bold bg-error text-white hover:bg-error/90"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Status Override Modal */}
      {overrideModalReq && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="glass-modal max-w-[460px] w-full p-6 rounded-2xl border border-primary/30 shadow-2xl space-y-4 text-left">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
              Emergency Requisition Status Override
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-on-surface mb-1">Select New Status</label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60"
                >
                  <option value="Pending">Pending</option>
                  <option value="Matching">Matching</option>
                  <option value="Fulfilled">Fulfilled</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Override Rationale *</label>
                <textarea
                  rows={2}
                  required
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g., Donors delivered blood bags directly at hospital"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-outline-variant/20 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setOverrideModalReq(null)}
                className="px-4 py-2 rounded-xl border border-outline-variant/40"
              >
                Cancel
              </button>
              <button
                onClick={handleOverrideSos}
                className="btn-primary px-4 py-2 rounded-xl font-bold"
              >
                Apply Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Helpline Contact Modal (Create/Edit) */}
      {helplineModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="glass-modal max-w-[500px] w-full p-6 rounded-2xl border border-primary/30 shadow-2xl space-y-4 text-left">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">support_agent</span>
              {editingContact ? 'Edit Helpline Contact' : 'Create Helpline Contact'}
            </h3>

            <form onSubmit={handleSaveHelpline} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category *</label>
                  <select
                    value={helplineForm.category}
                    onChange={(e) => setHelplineForm({ ...helplineForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60"
                  >
                    <option value="Committee">Committee</option>
                    <option value="Medical">Medical</option>
                    <option value="Campus">Campus</option>
                    <option value="WhatsApp">WhatsApp</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={helplineForm.name}
                    onChange={(e) => setHelplineForm({ ...helplineForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Role / Designation *</label>
                  <input
                    type="text"
                    required
                    value={helplineForm.role}
                    onChange={(e) => setHelplineForm({ ...helplineForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={helplineForm.phone}
                    onChange={(e) => setHelplineForm({ ...helplineForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={helplineForm.email}
                    onChange={(e) => setHelplineForm({ ...helplineForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">WhatsApp Number</label>
                  <input
                    type="text"
                    value={helplineForm.whatsappNumber}
                    onChange={(e) => setHelplineForm({ ...helplineForm, whatsappNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Campus Location</label>
                <input
                  type="text"
                  value={helplineForm.location}
                  onChange={(e) => setHelplineForm({ ...helplineForm, location: e.target.value })}
                  placeholder="e.g. Ground Floor, Academic Building South"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="avail247"
                  checked={helplineForm.isAvailable24_7}
                  onChange={(e) => setHelplineForm({ ...helplineForm, isAvailable24_7: e.target.checked })}
                  className="rounded border-outline-variant/60 text-primary"
                />
                <label htmlFor="avail247" className="font-semibold text-on-surface">
                  24/7 Rapid Emergency Availability
                </label>
              </div>

              <div className="pt-2 border-t border-outline-variant/20 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setHelplineModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-outline-variant/40"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-5 py-2 font-bold">
                  {editingContact ? 'Save Changes' : 'Create Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, count, icon, accent }) {
  return (
    <div className="glass-card p-4 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
      <div>
        <p className="text-[11px] font-semibold text-on-surface-variant">{title}</p>
        <p className="text-2xl font-black text-on-surface mt-0.5 tracking-tight font-mono">{count}</p>
      </div>
      <div className={`w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center ${accent}`}>
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
      </div>
    </div>
  );
}

function ActionShortcutCard({ title, description, icon, badge, onClick }) {
  return (
    <div
      onClick={onClick}
      className="glass-card p-4 rounded-2xl border border-outline-variant/30 hover:border-primary/40 cursor-pointer transition flex flex-col justify-between space-y-3"
    >
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-xl bg-slate-900 text-primary flex items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container text-on-surface-variant border border-outline-variant/30">
          {badge}
        </span>
      </div>
      <div>
        <h3 className="font-bold text-xs text-on-surface">{title}</h3>
        <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">{description}</p>
      </div>
      <div className="text-primary font-bold text-[11px] flex items-center gap-1 pt-1">
        <span>Open Module</span>
        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
      </div>
    </div>
  );
}

export default AdminDashboardScreen;
