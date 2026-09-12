import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DonorCardSkeleton } from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';

const BLOOD_GROUPS = [
  'All',
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
  'Bombay (hh)',
];

const DEPARTMENTS = [
  'All',
  'CSE',
  'EEE',
  'ME',
  'ICT',
  'ENG',
  'BBA',
  'AIS',
  'IPE',
  'CE',
];

const USER_ROLES = ['All', 'Student', 'Teacher', 'Staff'];

/**
 * SearchDonorsScreen — Phase 3 Donor Directory
 * Matches Stitch Screen: "BAUST BloodLink - Search Donors Directory"
 */
function SearchDonorsScreen() {
  const navigate = useNavigate();
  const [bloodGroup, setBloodGroup] = useState('All');
  const [department, setDepartment] = useState('All');
  const [userType, setUserType] = useState('All');
  const [status, setStatus] = useState('active'); // 'active' | 'cooldown' | 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [donors, setDonors] = useState([]);
  const [counts, setCounts] = useState({ total: 0, active: 0, cooldown: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchDonors = useCallback(
    async (isLoadMore = false) => {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      try {
        const params = new URLSearchParams();
        params.append('limit', '18');
        params.append('status', status);

        if (bloodGroup !== 'All') {
          params.append('bloodGroup', bloodGroup);
        }
        if (department !== 'All') {
          params.append('department', department);
        }
        if (userType !== 'All') {
          params.append('userType', userType);
        }
        if (searchTerm.trim()) {
          params.append('search', searchTerm.trim());
        }
        if (isLoadMore && cursor) {
          params.append('cursor', cursor);
        }

        const res = await fetch(`/api/donors?${params.toString()}`);
        if (!res.ok) {
          throw new Error('Failed to fetch campus donors');
        }

        const data = await res.json();
        if (isLoadMore) {
          setDonors((prev) => [...prev, ...(data.donors || [])]);
        } else {
          setDonors(data.donors || []);
        }

        setCounts(data.counts || { total: 0, active: 0, cooldown: 0 });
        setCursor(data.nextCursor);
        setHasMore(Boolean(data.hasMore));
      } catch (err) {
        setError(err.message || 'Error connecting to donor registry');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [bloodGroup, department, userType, status, searchTerm, cursor]
  );

  // Re-fetch whenever filters change
  useEffect(() => {
    fetchDonors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bloodGroup, department, userType, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDonors(false);
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
              person_search
            </span>
            Donor Directory
          </h1>
          <p className="text-on-surface-variant text-[15px] font-normal mt-0.5">
            Verified institutional blood donors across Saidpur Cantonment &amp; BAUST campus
          </p>
        </div>

        <button
          onClick={() => navigate('/blood-hub/request')}
          className="px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center gap-2 transition-all active:scale-95 self-start md:self-auto"
          style={{
            background: 'linear-gradient(135deg, rgb(225, 29, 72) 0%, rgb(184, 0, 53) 100%)',
          }}
        >
          <span className="material-symbols-outlined text-[18px]">add_box</span>
          <span>Request Blood</span>
        </button>
      </div>

      {/* 2. Filter & Search Control Panel */}
      <div className="bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-5 border border-outline-variant/30 shadow-sm mb-6 space-y-4">
        {/* Top Search & Dropdown Row */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              placeholder="Search donor name or 16-character institutional ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              id="donor-search-input"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-primary transition-all placeholder:text-on-surface-variant/60"
            />
          </div>

          <div className="flex gap-2">
            {/* Department Dropdown */}
            <div className="relative min-w-[130px]">
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                id="donor-dept-filter"
                className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface text-xs font-semibold focus:outline-none cursor-pointer"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d === 'All' ? 'All Depts' : d}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant">
                expand_more
              </span>
            </div>

            {/* Role Dropdown */}
            <div className="relative min-w-[120px]">
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                id="donor-role-filter"
                className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface text-xs font-semibold focus:outline-none cursor-pointer"
              >
                {USER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r === 'All' ? 'All Roles' : r}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant">
                expand_more
              </span>
            </div>

            <button
              type="submit"
              id="donor-search-btn"
              className="px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-xs shadow-sm hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">filter_alt</span>
              <span>Filter</span>
            </button>
          </div>
        </form>

        {/* Blood Group Chips Row */}
        <div>
          <div className="text-[11px] font-bold text-outline uppercase tracking-wider mb-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-primary">bloodtype</span>
            <span>Blood Group Filter:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {BLOOD_GROUPS.map((bg) => {
              const isSelected = bloodGroup === bg;
              return (
                <button
                  key={bg}
                  type="button"
                  onClick={() => setBloodGroup(bg)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-primary text-white shadow-sm ring-2 ring-primary/40'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container border border-outline-variant/20'
                  }`}
                >
                  {bg}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Segmented Switch + Count Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-outline-variant/20">
          <div className="inline-flex p-1 rounded-xl bg-surface-container-low/90 backdrop-blur-sm self-start">
            <button
              type="button"
              onClick={() => setStatus('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                status === 'active'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Active Donors ({counts.active})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatus('cooldown')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                status === 'cooldown'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-on-surface-variant/40" />
              <span>On Cooldown ({counts.cooldown})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                status === 'all'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>Show All ({counts.total})</span>
            </button>
          </div>

          <div className="text-xs text-on-surface-variant font-medium">
            Showing <strong className="text-on-surface font-bold">{donors.length}</strong> verified donors
          </div>
        </div>
      </div>

      {/* 3. 3-State Donor Card Stream */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <DonorCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
          <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-[24px]">cloud_off</span>
          </div>
          <h4 className="text-[16px] font-bold text-on-surface mb-1">Could not load donors</h4>
          <p className="text-[13px] text-on-surface-variant mb-4">{error}</p>
          <button
            onClick={() => fetchDonors(false)}
            className="px-4 py-2 rounded-xl bg-primary text-white font-semibold text-xs inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Retry Query
          </button>
        </div>
      ) : donors.length === 0 ? (
        <div className="py-12 bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
          <EmptyState
            icon="person_search"
            title="No donors found"
            description="No donors matched your current combination of blood group, department, and 90-day cooldown status. Try broadening your filters."
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {donors.map((donor) => {
              const roleDetails =
                donor.userType === 'Student'
                  ? `${donor.department} • Student${donor.studentDetails?.batch ? ` (Batch ${donor.studentDetails.batch})` : ''}`
                  : donor.userType === 'Teacher'
                    ? `${donor.department} • ${donor.teacherDetails?.designation || 'Faculty'}`
                    : `${donor.department || donor.staffDetails?.workingSector || 'Staff'} • Staff`;

              const isCooldown = donor.cooldownDaysRemaining > 0;

              return (
                <div
                  key={donor._id}
                  className="group relative rounded-2xl bg-surface-container-lowest/90 backdrop-blur-xl p-5 border border-outline-variant/30 hover:border-primary/40 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top Row: Avatar + Details + Blood Group Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-primary to-primary-fixed shadow-sm">
                          <img
                            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${donor.institutionalId}`}
                            alt={donor.name}
                            className="w-full h-full object-cover rounded-full bg-surface-container"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-[15px] text-on-surface truncate">
                              {donor.name}
                            </h3>
                            <span
                              className="material-symbols-outlined text-primary text-[16px]"
                              title="Verified Campus Identity"
                            >
                              verified
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-primary truncate">
                            {roleDetails}
                          </p>
                          <p className="text-[11px] text-on-surface-variant">
                            ID: {donor.institutionalId}
                          </p>
                        </div>
                      </div>

                      {/* Blood Group Badge */}
                      <div
                        className="flex flex-col items-center justify-center min-w-[44px] h-[44px] rounded-xl text-white shadow-sm font-black text-[18px]"
                        style={{
                          background:
                            donor.bloodGroup === 'BOMBAY'
                              ? '#ac2926'
                              : 'linear-gradient(135deg, rgb(225, 29, 72) 0%, rgb(184, 0, 53) 100%)',
                        }}
                      >
                        <span>{donor.bloodGroup === 'BOMBAY' ? 'hh' : donor.bloodGroup}</span>
                      </div>
                    </div>

                    {/* Status & Location Pill */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      {isCooldown ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-outline" />
                          <span>Cooldown ({donor.cooldownDaysRemaining}d left)</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          <span>Active Donor</span>
                        </div>
                      )}

                      <span className="text-[11px] text-on-surface-variant flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[13px]">location_on</span>
                        Saidpur Cantonment
                      </span>
                    </div>

                    {/* Metrics Panel */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-surface-container-low/70 text-xs">
                      <div>
                        <span className="block text-[10px] text-on-surface-variant uppercase font-bold">
                          Last Donated
                        </span>
                        <span className="font-semibold text-on-surface">
                          {donor.daysSinceDonation !== null
                            ? `${donor.daysSinceDonation} days ago`
                            : 'First-time Donor'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-on-surface-variant uppercase font-bold">
                          Total Bags
                        </span>
                        <span className="font-semibold text-on-surface">
                          {donor.totalDonations || 0} Bags Donated
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action: Open Request Blood Form pre-filled for this donor */}
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/blood-hub/request?bloodGroup=${encodeURIComponent(donor.bloodGroup)}&donorId=${donor._id}&donorName=${encodeURIComponent(donor.name)}`
                        )
                      }
                      className="w-full py-2.5 px-4 rounded-xl text-white text-xs font-bold shadow-sm hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      style={{
                        background:
                          'linear-gradient(135deg, rgb(225, 29, 72) 0%, rgb(184, 0, 53) 100%)',
                      }}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        send_time_extension
                      </span>
                      <span>Request Blood</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-8">
              <button
                type="button"
                onClick={() => fetchDonors(true)}
                disabled={loadingMore}
                className="px-6 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-xs shadow-sm border border-outline-variant/30 inline-flex items-center gap-2 transition-all active:scale-95"
              >
                {loadingMore ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                    <span>Loading more donors...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">expand_more</span>
                    <span>Load More Donors</span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SearchDonorsScreen;
