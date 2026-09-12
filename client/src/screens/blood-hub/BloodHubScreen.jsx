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
  const [respondingTo, setRespondingTo] = useState(null);
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [responseSuccessMessage, setResponseSuccessMessage] = useState('');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, reqsRes] = await Promise.all([
        fetch('/api/blood-requests/stats'),
        fetch(`/api/blood-requests?limit=15${filterCondition !== 'All' ? `&condition=${filterCondition}` : ''}`),
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
    <div className="page-wrapper max-w-[1280px] mx-auto">
      {/* 1. Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[32px] font-extrabold text-on-surface tracking-tight leading-tight flex items-center gap-2">
            <span
              className="material-symbols-outlined text-[32px] text-primary"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              water_drop
            </span>
            Blood Hub
          </h1>
          <p className="text-on-surface-variant text-[15px] font-normal mt-0.5">
            Campus Blood Donor Coordination &amp; Requisition Portal
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[12px] font-bold">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
            Live Node: Saidpur &amp; Rangpur Cantonment
          </span>
        </div>
      </div>

      {/* 2. Two Main Action Hero Cards (Side-by-Side Split View) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Option 1 Card: Search for Blood (3D Pop-Up) */}
        <div
          className="group relative bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-6 border border-outline-variant/30 hover:border-primary/40 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-primary/25 hover:-translate-y-1"
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
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #dde9ff 100%)',
                    boxShadow: '0 8px 20px rgba(184, 0, 53, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.95)',
                  }}
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

            <h2 className="text-[20px] font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors flex items-center gap-2">
              <span>Search for Blood</span>
              <span className="material-symbols-outlined text-[18px] opacity-0 group-hover:opacity-100 text-primary transition-opacity duration-300">
                arrow_outward
              </span>
            </h2>
            <p className="text-on-surface-variant text-[14px] leading-relaxed mt-2">
              Search and verify registered donors across campus departments, batches, and real-time medical eligibility cycles.
            </p>
          </div>

          <div className="mt-6 pt-2">
            <Link
              to="/blood-hub/search"
              id="blood-hub-search-btn"
              className="w-full py-3 px-5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-[14px] shadow-sm hover:shadow flex items-center justify-center gap-2 transition-all border border-outline-variant/40 group-hover:border-primary/30 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">search</span>
              <span>Open Donor Directory</span>
              <span className="material-symbols-outlined text-[16px] ml-auto group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>

        {/* Option 2 Card: Request for Blood (Radiant 3D Gem Pop-Up) */}
        <div
          className="group relative bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-6 border border-primary/30 hover:border-primary/50 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-primary/30 hover:-translate-y-1"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(254, 242, 244, 0.75) 100%)',
            boxShadow:
              '0 20px 48px -12px rgba(225, 29, 72, 0.22), 0 8px 20px -4px rgba(184, 0, 53, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
          }}
        >
          <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-primary/15 group-hover:bg-primary/25 blur-2xl transition-all duration-300 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              {/* Radiant 3D Crimson Glass Gem Icon */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-primary/30 animate-ping opacity-60 duration-700" />
                <div className="absolute -inset-1.5 rounded-2xl border border-primary/40 animate-pulse" />
                <div
                  className="relative w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-md shadow-primary/30 group-hover:scale-110 transition-transform duration-300 z-10"
                  style={{
                    background:
                      'linear-gradient(135deg, rgb(244, 63, 94) 0%, rgb(225, 29, 72) 50%, rgb(184, 0, 53) 100%)',
                    boxShadow: '0 8px 24px rgba(184, 0, 53, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.6)',
                  }}
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

            <h2 className="text-[20px] font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors flex items-center gap-2">
              <span>Request for Blood</span>
              <span className="material-symbols-outlined text-[18px] opacity-0 group-hover:opacity-100 text-primary transition-opacity duration-300">
                arrow_outward
              </span>
            </h2>
            <p className="text-on-surface-variant text-[14px] leading-relaxed mt-2">
              Post an authorized requisition for scheduled clinical procedures or urgent critical needs across cantonment medical nodes.
            </p>
          </div>

          <div className="mt-6 pt-2">
            <Link
              to="/blood-hub/request"
              id="blood-hub-request-btn"
              className="w-full py-3 px-5 rounded-xl text-white font-semibold text-[14px] shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, rgb(225, 29, 72) 0%, rgb(184, 0, 53) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                boxShadow: 'rgba(184, 0, 53, 0.35) 0px 6px 18px',
              }}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
        <div className="p-5 border-b border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">emergency_heat</span>
              <h3 className="text-[18px] font-bold text-on-surface">Active Campus Requests</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                {requests.length} Open Requisitions
              </span>
            </div>
            <p className="text-on-surface-variant text-[13px] mt-0.5">
              Real-time blood transfusion needs submitted by verified campus coordinators and doctors.
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                className="appearance-none px-3 py-1.5 pr-7 rounded-xl bg-surface-container text-on-surface text-[12px] font-semibold hover:bg-surface-container-high transition-colors focus:outline-none cursor-pointer"
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
              className="px-3 py-1.5 rounded-xl text-white text-[12px] font-semibold flex items-center gap-1.5 shadow-sm hover:brightness-105 transition-all"
              style={{ background: 'linear-gradient(135deg, rgb(225, 29, 72) 0%, rgb(190, 18, 60) 100%)' }}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>Live Sync</span>
            </button>
          </div>
        </div>

        {/* 3-State Data Rendering */}
        {loading ? (
          <div className="p-6">
            <table className="w-full">
              <tbody>
                <TableRowSkeleton cols={6} />
                <TableRowSkeleton cols={6} />
                <TableRowSkeleton cols={6} />
                <TableRowSkeleton cols={6} />
              </tbody>
            </table>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[24px]">cloud_off</span>
            </div>
            <h4 className="text-[16px] font-bold text-on-surface mb-1">Failed to load requisitions</h4>
            <p className="text-[13px] text-on-surface-variant mb-4">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 rounded-xl bg-primary text-white font-semibold text-xs inline-flex items-center gap-1.5"
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/60 text-[11px] font-bold text-outline uppercase tracking-wider border-b border-outline-variant/30">
                  <th className="py-3.5 px-5">Patient / Case</th>
                  <th className="py-3.5 px-4 text-center">Blood Group</th>
                  <th className="py-3.5 px-4">Quantity</th>
                  <th className="py-3.5 px-4">Hospital</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/25 text-[14px]">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-primary/[0.02] transition-colors group">
                    <td className="py-4 px-5 font-semibold text-on-surface">
                      <div className="flex items-center gap-2">
                        <span>{req.patientName}</span>
                        {req.patientType && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-high text-on-surface-variant border border-outline-variant/30">
                            {req.patientType}
                          </span>
                        )}
                      </div>
                      {req.diagnosis && (
                        <span className="text-on-surface-variant font-normal block text-xs mt-0.5">
                          {req.diagnosis}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className="inline-flex items-center justify-center px-3 py-1 rounded-full text-white font-extrabold text-[12px] shadow-sm tracking-wide"
                        style={{
                          background: req.condition === 'Emergency' ? '#b80035' : '#db2e4e',
                        }}
                      >
                        {req.bloodGroup}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-on-surface">
                      {req.units} {req.units === 1 ? 'Unit' : 'Units'}
                    </td>
                    <td className="py-4 px-4 text-on-surface font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[18px]">
                          local_hospital
                        </span>
                        <span className="truncate max-w-[220px]">{req.hospital}</span>
                      </div>
                      {req.hospitalBed && (
                        <span className="text-xs text-on-surface-variant font-normal block pl-6">
                          {req.hospitalBed}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {req.condition === 'Emergency' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold border border-primary/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          Emergency
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface text-[11px] font-bold border border-outline-variant/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-outline" />
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => handleRespond(req)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-white text-[12px] font-bold shadow-sm hover:shadow-md active:scale-95 transition-all"
                        style={{
                          background:
                            'linear-gradient(135deg, rgb(225, 29, 72) 0%, rgb(184, 0, 53) 100%)',
                        }}
                        type="button"
                      >
                        <span>Respond</span>
                        <span className="material-symbols-outlined text-[14px]">
                          volunteer_activism
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        <div className="p-4 bg-surface-container-low/40 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px] text-on-surface-variant">
          <span>
            Showing {requests.length} active hospital requisitions across Saidpur &amp; Rangpur Cantonment
          </span>
          <div className="flex items-center gap-1">
            <span className="px-2 py-1 rounded-lg bg-surface-container-lowest text-on-surface border border-outline-variant/30 font-semibold">
              Live Feed
            </span>
          </div>
        </div>
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
                    className="flex-1 py-2.5 rounded-xl border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmResponse}
                    disabled={isSubmittingResponse}
                    className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                    style={{
                      background:
                        'linear-gradient(135deg, rgb(225, 29, 72) 0%, rgb(184, 0, 53) 100%)',
                    }}
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
