import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { TableRowSkeleton } from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';

/**
 * BloodHubScreen — Phase 3 Blood Hub Dashboard
 * Matches Stitch Screen: "BAUST BloodLink - Blood Hub 3D Cards"
 */
function BloodHubScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeDonors: 142,
    fulfilledCases: 618,
    liveRequisitions: 4,
    avgMatchTimeMinutes: 18,
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterCondition, setFilterCondition] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;
  const [respondingTo, setRespondingTo] = useState(null);
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [responseSuccessMessage, setResponseSuccessMessage] = useState('');

  const totalPages = Math.max(1, Math.ceil(requests.length / ITEMS_PER_PAGE));
  const paginatedRequests = requests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, reqsRes] = await Promise.all([
        fetch('/api/blood-requests/stats'),
        fetch(`/api/blood-requests?limit=50${filterCondition !== 'All' ? `&condition=${filterCondition}` : ''}`),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (reqsRes.ok) {
        const reqsData = await reqsRes.json();
        setRequests(reqsData.requests || []);
      } else {
        throw new Error('Failed to load blood requisitions');
      }
    } catch (err) {
      setError(err.message || 'Unable to sync Blood Hub live data');
    } finally {
      setLoading(false);
    }
  }, [filterCondition]);

  useEffect(() => {
    fetchDashboardData();
    setCurrentPage(1);
  }, [fetchDashboardData]);

  const handleRespond = async (request) => {
    setRespondingTo(request);
    setResponseSuccessMessage('');
  };

  const confirmResponse = async () => {
    if (!respondingTo) return;
    setIsSubmittingResponse(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/blood-requests/${respondingTo._id}/respond`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: 'Accepted' }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to record donation commitment');
      }

      setResponseSuccessMessage('Thank you! Your donation response has been dispatched to the hospital coordinator.');
      setTimeout(() => {
        setRespondingTo(null);
        setResponseSuccessMessage('');
        fetchDashboardData();
      }, 1800);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  return (
    <div className="page-wrapper max-w-[1280px] mx-auto px-3 sm:px-6 lg:px-8">
      {/* 1. Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-[26px] sm:text-[32px] font-extrabold text-on-surface tracking-tight leading-tight flex items-center gap-2">
            <span
              className="material-symbols-outlined text-[28px] sm:text-[32px] text-primary"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              water_drop
            </span>
            <span>Blood Hub <span className="text-primary font-bold">Portal</span></span>
          </h1>
          <p className="text-on-surface-variant text-[13px] sm:text-[15px] font-normal mt-0.5">
            Campus Blood Donor Coordination &amp; Requisition Network
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] sm:text-[12px] font-bold">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
            Live Node: Saidpur &amp; Rangpur Cantonment
          </span>
        </div>
      </div>

      {/* 2. Two Main Action Hero Cards (Side-by-Side Split View) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Option 1 Card: Search for Blood (3D Pop-Up) */}
        <div
          className="group relative bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border border-outline-variant/30 hover:border-primary/40 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-primary/25 hover:-translate-y-1"
          style={{
            boxShadow:
              '0 20px 40px -15px rgba(225, 29, 72, 0.12), 0 8px 16px -6px rgba(13, 28, 47, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
          }}
        >
          <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-primary/5 group-hover:bg-primary/15 blur-2xl transition-all duration-300 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              {/* 3D Levitating Pod with Radar Effect */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping opacity-40 duration-1000" />
                <div className="absolute -inset-1.5 rounded-2xl border border-primary/25 animate-pulse opacity-60" />
                <div
                  className="relative w-12 h-12 rounded-2xl bg-surface-container border border-outline-variant/30 flex items-center justify-center text-primary shadow-md group-hover:scale-110 transition-transform duration-300 z-10"
                >
                  <span className="material-symbols-outlined text-[26px] drop-shadow-sm group-hover:rotate-12 transition-transform duration-300">
                    person_search
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/30 text-on-surface-variant text-[11px] font-bold tracking-wider uppercase shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Campus Directory
              </span>
            </div>

            <h2 className="text-[18px] sm:text-[20px] font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors flex items-center gap-2">
              <span>Search for Blood</span>
              <span className="material-symbols-outlined text-[18px] opacity-0 group-hover:opacity-100 text-primary transition-opacity duration-300">
                arrow_outward
              </span>
            </h2>
            <p className="text-on-surface-variant text-[13px] sm:text-[14px] leading-relaxed mt-2">
              Search and verify registered donors across campus departments, batches, and real-time medical eligibility cycles.
            </p>
          </div>

          <div className="mt-5 sm:mt-6 pt-2">
            <Link
              to="/blood-hub/search"
              id="blood-hub-search-btn"
              className="w-full py-3 px-4 sm:px-5 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-[13px] sm:text-[14px] shadow-sm hover:shadow flex items-center justify-center gap-2 transition-all border border-outline-variant/40 group-hover:border-primary/30 active:scale-95 min-h-[44px]"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">search</span>
              <span>Open Donor Directory</span>
              <span className="material-symbols-outlined text-[16px] ml-auto group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>

        {/* Option 2 Card: Request for Blood */}
        <div
          className="group relative bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border border-primary/30 hover:border-primary/50 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-primary/20 hover:-translate-y-1"
        >
          <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-primary/10 group-hover:bg-primary/20 blur-2xl transition-all duration-300 pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              {/* Crimson Glass Icon */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-primary/30 animate-ping opacity-60 duration-700" />
                <div className="absolute -inset-1.5 rounded-2xl border border-primary/40 animate-pulse" />
                <div
                  className="relative w-12 h-12 rounded-2xl text-white flex items-center justify-center bg-primary shadow-md shadow-primary/30 group-hover:scale-110 transition-transform duration-300 z-10"
                >
                  <span className="material-symbols-outlined text-[26px] drop-shadow group-hover:scale-105 transition-transform">
                    add_box
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold tracking-wider uppercase shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Dispatch Requisition
              </span>
            </div>

            <h2 className="text-[18px] sm:text-[20px] font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors flex items-center gap-2">
              <span>Request for Blood</span>
              <span className="material-symbols-outlined text-[18px] opacity-0 group-hover:opacity-100 text-primary transition-opacity duration-300">
                arrow_outward
              </span>
            </h2>
            <p className="text-on-surface-variant text-[13px] sm:text-[14px] leading-relaxed mt-2">
              Post an authorized requisition for scheduled clinical procedures or urgent critical needs across cantonment medical nodes.
            </p>
          </div>

          <div className="mt-5 sm:mt-6 pt-2">
            <Link
              to="/blood-hub/request"
              id="blood-hub-request-btn"
              className="w-full py-3 px-4 sm:px-5 rounded-full text-white font-semibold text-[13px] sm:text-[14px] bg-primary hover:bg-primary-dark shadow-md shadow-primary/25 hover:shadow-primary/40 flex items-center justify-center gap-2 transition-all active:scale-95 min-h-[44px]"
            >
              <span className="material-symbols-outlined text-[18px]">post_add</span>
              <span>Launch Requisition Form</span>
              <span className="material-symbols-outlined text-[16px] ml-auto group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Quick Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {/* Stat 1: Active Donors */}
        <div className="bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-4 border border-outline-variant/30 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-container text-primary flex items-center justify-center border border-outline-variant/20">
              <span className="material-symbols-outlined text-[22px]">volunteer_activism</span>
            </div>
            <div>
              <span className="block text-[11px] font-bold text-outline uppercase tracking-wider">
                Active Donors
              </span>
              <span className="text-[22px] font-extrabold text-on-surface leading-tight">
                {stats.activeDonors} Donors
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high border border-outline-variant/30 text-on-surface-variant text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Ready
          </span>
        </div>

        {/* Stat 2: Requisitions Fulfilled */}
        <div className="bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-4 border border-outline-variant/30 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-container text-primary flex items-center justify-center border border-outline-variant/20">
              <span className="material-symbols-outlined text-[22px]">check_circle</span>
            </div>
            <div>
              <span className="block text-[11px] font-bold text-outline uppercase tracking-wider">
                Fulfilled Cases
              </span>
              <span className="text-[22px] font-extrabold text-on-surface leading-tight">
                {stats.fulfilledCases} Reqs
              </span>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface text-[11px] font-bold border border-outline-variant/30">
            98.4% Rate
          </span>
        </div>

        {/* Stat 3: Live Pending Requests */}
        <div className="bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-4 border border-primary/20 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <span className="material-symbols-outlined text-[22px]">pending_actions</span>
            </div>
            <div>
              <span className="block text-[11px] font-bold text-outline uppercase tracking-wider">
                Live Requisitions
              </span>
              <span className="text-[22px] font-extrabold text-primary leading-tight">
                {stats.liveRequisitions} Pending
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
            Live
          </span>
        </div>

        {/* Stat 4: Average Response Time */}
        <div className="bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-4 border border-outline-variant/30 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-container text-primary flex items-center justify-center border border-outline-variant/20">
              <span className="material-symbols-outlined text-[22px]">timer</span>
            </div>
            <div>
              <span className="block text-[11px] font-bold text-outline uppercase tracking-wider">
                Avg Match Time
              </span>
              <span className="text-[22px] font-extrabold text-on-surface leading-tight">
                {stats.avgMatchTimeMinutes} Mins
              </span>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface text-[11px] font-bold border border-outline-variant/30">
            Fast Track
          </span>
        </div>
      </div>

      {/* 4. Active Campus Requests Panel */}
      <section className="bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl border border-outline-variant/40 shadow-lg shadow-primary/5 overflow-hidden">
        {/* Panel Header with Search & Filter Tabs */}
        <div className="p-4 sm:p-5 border-b border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="material-symbols-outlined text-primary text-[22px]">emergency_heat</span>
              <h3 className="text-[17px] sm:text-[18px] font-bold text-on-surface">Active Campus Requests</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                {requests.length} Open Requisitions
              </span>
            </div>
            <p className="text-on-surface-variant text-[12px] sm:text-[13px] mt-0.5">
              Real-time blood transfusion needs submitted by verified campus coordinators and doctors.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <select
                className="w-full sm:w-auto appearance-none px-3 py-1.5 pr-7 rounded-xl bg-surface-container text-on-surface text-[12px] font-semibold hover:bg-surface-container-high transition-colors focus:outline-none cursor-pointer min-h-[38px]"
                value={filterCondition}
                onChange={(e) => setFilterCondition(e.target.value)}
                id="filter-condition-select"
              >
                <option value="All">Filter: All</option>
                <option value="Emergency">Emergency Only</option>
                <option value="Normal">Normal</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[14px] text-on-surface-variant">
                expand_more
              </span>
            </div>

            <button
              onClick={fetchDashboardData}
              id="refresh-requests-btn"
              className="px-3.5 py-1.5 rounded-full text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-dark shadow-sm hover:shadow-md transition-all cursor-pointer min-h-[38px]"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>Live Sync</span>
            </button>
          </div>
        </div>

        {/* 3-State Data Rendering: 3D Cards Grid */}
        {loading ? (
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-5 space-y-4 animate-pulse"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-surface-container-high" />
                      <div className="space-y-1.5">
                        <div className="w-24 h-3.5 bg-surface-container-high rounded" />
                        <div className="w-16 h-2.5 bg-surface-container-high rounded" />
                      </div>
                    </div>
                    <div className="w-12 h-8 bg-surface-container-high rounded-xl" />
                  </div>
                  <div className="p-3 bg-surface-container rounded-xl space-y-2">
                    <div className="w-full h-3 bg-surface-container-high rounded" />
                    <div className="w-3/4 h-3 bg-surface-container-high rounded" />
                  </div>
                  <div className="w-full h-10 bg-surface-container-high rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[24px]">cloud_off</span>
            </div>
            <h4 className="text-[16px] font-bold text-on-surface mb-1">Failed to load requisitions</h4>
            <p className="text-[13px] text-on-surface-variant mb-4">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 rounded-full bg-primary hover:bg-primary-dark text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Retry Sync
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon="check_circle"
              title="No active blood requests"
              description="There are currently no urgent or scheduled blood requisitions in the Saidpur & Rangpur Cantonment network."
            />
          </div>
        ) : (
          <div className="p-4 sm:p-6">
            {/* 3D Cards Responsive Grid: 1-col mobile, 2-col tablet, 3-col desktop (9 per page) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {paginatedRequests.map((req) => (
                <div
                  key={req._id}
                  className="group relative bg-surface-container-lowest/95 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-outline-variant/35 hover:border-primary/50 transition-all duration-300 flex flex-col justify-between shadow-md hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 sm:hover:-translate-y-2 overflow-hidden"
                  style={{
                    boxShadow:
                      '0 12px 28px -8px rgba(225, 29, 72, 0.09), 0 4px 12px rgba(13, 28, 47, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
                  }}
                >
                  {/* Top Ambient Highlight */}
                  <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-70 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-primary/5 group-hover:bg-primary/10 blur-xl transition-all pointer-events-none" />

                  <div>
                    {/* Card Header: Identity & 3D Blood Group Badge */}
                    <div className="flex items-start justify-between gap-2.5 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-surface-container to-surface-container-high border border-outline-variant/30 flex items-center justify-center text-primary shadow-sm group-hover:scale-105 transition-transform shrink-0">
                          <span className="material-symbols-outlined text-[22px]">
                            {req.patientType === 'Student'
                              ? 'school'
                              : req.patientType === 'Teacher'
                              ? 'psychology'
                              : req.patientType === 'Staff'
                              ? 'badge'
                              : 'person'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-on-surface text-[14px] sm:text-[15px] leading-tight truncate">
                              {req.patientName}
                            </h4>
                            {req.patientType && (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  req.patientType === 'Student'
                                    ? 'bg-blue-50 text-blue-900 border-blue-200'
                                    : req.patientType === 'Teacher'
                                    ? 'bg-purple-50 text-purple-900 border-purple-200'
                                    : req.patientType === 'Staff'
                                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                                    : 'bg-rose-50 text-rose-900 border-rose-200'
                                }`}
                              >
                                {req.patientType}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-on-surface-variant font-medium block mt-0.5">
                            Requisition #{req._id ? req._id.slice(-4).toUpperCase() : 'CASE'}
                          </span>
                        </div>
                      </div>

                      {/* 3D Blood Group Badge & Units */}
                      <div className="flex flex-col items-end shrink-0">
                        <span className="inline-flex items-center justify-center px-2.5 sm:px-3 py-1 rounded-xl text-white font-black text-[12px] sm:text-[13px] tracking-wider bg-gradient-to-br from-primary to-[#8A0014] shadow-md shadow-primary/20 border border-white/20 group-hover:scale-105 transition-transform">
                          {req.bloodGroup}
                        </span>
                        <span className="text-[10px] font-bold text-primary flex items-center gap-0.5 mt-1">
                          <span className="material-symbols-outlined text-[13px]">water_drop</span>
                          {req.units} {req.units === 1 ? 'Unit' : 'Units'}
                        </span>
                      </div>
                    </div>

                    {/* Card Body: Diagnosis & Hospital Location */}
                    <div className="p-3 rounded-xl bg-surface-container-low/70 border border-outline-variant/25 space-y-2 mb-3 group-hover:bg-surface-container-low transition-colors">
                      {req.diagnosis && (
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-primary text-[17px] shrink-0 mt-0.5">
                            medical_services
                          </span>
                          <p className="text-[12px] font-semibold text-on-surface leading-snug line-clamp-2">
                            {req.diagnosis}
                          </p>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-primary text-[17px] shrink-0 mt-0.5">
                          local_hospital
                        </span>
                        <div className="text-[12px] leading-snug min-w-0 flex-1">
                          <span className="font-bold text-on-surface block truncate max-w-full">
                            {req.hospital}
                          </span>
                          {req.hospitalBed && (
                            <span className="text-[11px] text-on-surface-variant font-medium block mt-0.5 truncate">
                              {req.hospitalBed}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status & Urgency Row */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div>
                        {req.condition === 'Emergency' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold border border-primary/25 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                            Emergency Case
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface text-[11px] font-bold border border-outline-variant/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-outline" />
                            Scheduled
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-on-surface-variant font-medium">
                        {req.status || 'Active Requisition'}
                      </span>
                    </div>
                  </div>

                  {/* Card Action: 3D Respond Button */}
                  <button
                    onClick={() => handleRespond(req)}
                    className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs bg-primary hover:bg-primary-dark shadow-md shadow-primary/20 hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 group-hover:shadow-primary/30 cursor-pointer min-h-[40px]"
                    type="button"
                  >
                    <span>Respond to Request</span>
                    <span className="material-symbols-outlined text-[16px]">
                      volunteer_activism
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Multi-Page Numbered Pagination (9 items per page) */}
        {!loading && !error && requests.length > 0 && (
          <div className="p-4 bg-surface-container-low/60 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-on-surface-variant">
            <div className="font-medium text-center sm:text-left">
              Showing <span className="font-bold text-on-surface">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> -{' '}
              <span className="font-bold text-on-surface">{Math.min(currentPage * ITEMS_PER_PAGE, requests.length)}</span> of{' '}
              <span className="font-bold text-on-surface">{requests.length}</span> Active Requisitions (9 per page)
            </div>

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-outline-variant/40 bg-surface-container text-on-surface font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-high transition-all flex items-center gap-1 active:scale-95 cursor-pointer min-h-[36px]"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[15px]">chevron_left</span>
                  <span>Prev</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl font-bold text-xs transition-all flex items-center justify-center cursor-pointer min-h-[36px] min-w-[36px] ${
                      currentPage === pageNum
                        ? 'bg-primary text-white shadow-md shadow-primary/25 scale-105'
                        : 'bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/30'
                    }`}
                    type="button"
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-xl border border-outline-variant/40 bg-surface-container text-on-surface font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-high transition-all flex items-center gap-1 active:scale-95 cursor-pointer min-h-[36px]"
                  type="button"
                >
                  <span>Next</span>
                  <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Response Confirmation Modal */}
      {respondingTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-[480px] w-full p-6 border border-primary/30 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">volunteer_activism</span>
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-on-surface">Respond as Blood Donor</h3>
                  <p className="text-xs text-on-surface-variant">Confirm transfusion commitment</p>
                </div>
              </div>
              <button
                onClick={() => setRespondingTo(null)}
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {responseSuccessMessage ? (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-center my-4">
                <span className="material-symbols-outlined text-[32px] text-primary mb-1">
                  task_alt
                </span>
                <p className="text-sm font-bold text-on-surface">{responseSuccessMessage}</p>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-xl bg-surface-container space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Patient Case:</span>
                    <span className="font-bold text-on-surface">{respondingTo.patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Required Blood:</span>
                    <span className="font-extrabold text-primary">
                      {respondingTo.bloodGroup} ({respondingTo.units} Unit(s))
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Hospital:</span>
                    <span className="font-bold text-on-surface">{respondingTo.hospital}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Contact Hotline:</span>
                    <span className="font-bold text-primary">{respondingTo.contactPhone}</span>
                  </div>
                </div>

                <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
                  By clicking confirm, your availability will be marked and the hospital coordinator will receive your contact number for immediate cross-matching.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setRespondingTo(null)}
                    disabled={isSubmittingResponse}
                    className="flex-1 py-2.5 rounded-full border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmResponse}
                    disabled={isSubmittingResponse}
                    className="flex-1 py-2.5 rounded-full text-white font-bold text-sm bg-primary hover:bg-primary-dark shadow-md shadow-primary/25 hover:shadow-primary/40 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmittingResponse ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        <span>Confirming...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">check</span>
                        <span>Confirm Availability</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BloodHubScreen;
