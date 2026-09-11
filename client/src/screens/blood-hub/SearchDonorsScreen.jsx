import { useState } from 'react';
import { DonorCardSkeleton } from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';

/**
 * SearchDonorsScreen — Donor Search Shell (Phase 1)
 * Phase 3: Replace with real paginated API + server-side cooldown filter.
 */
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'BOMBAY'];
const DEPARTMENTS = ['CSE', 'EEE', 'ME', 'ICT', 'ENG', 'BBA', 'AIS', 'IPE', 'CE'];

function SearchDonorsScreen() {
  const [filters, setFilters] = useState({ bloodGroup: '', department: '' });
  const [state] = useState('empty'); // 'loading' | 'empty' | 'error' | 'ready'

  return (
    <div className="page-wrapper">
      <div className="mb-6">
        <h1 className="section-heading">
          <span className="material-symbols-outlined text-[24px] text-primary">search</span>
          Search Donors
        </h1>
        <p className="text-body-sm text-on-surface-variant mt-1">
          Find eligible blood donors by group, department, and availability
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel rounded-xl p-space-md mb-6 flex items-end gap-space-md flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="input-label">Blood Group</label>
          <select
            className="input-field"
            value={filters.bloodGroup}
            onChange={(e) => setFilters((f) => ({ ...f, bloodGroup: e.target.value }))}
            id="search-bloodgroup-select"
          >
            <option value="">All Blood Groups</option>
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="input-label">Department</label>
          <select
            className="input-field"
            value={filters.department}
            onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}
            id="search-department-select"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <button className="btn-primary flex-shrink-0" id="search-donors-btn">
          <span className="material-symbols-outlined text-[18px]">search</span>
          Search
        </button>
      </div>

      {/* Results: 3-state */}
      {state === 'loading' && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <DonorCardSkeleton key={i} />)}
        </div>
      )}
      {state === 'empty' && (
        <EmptyState
          icon="person_search"
          title="No donors found"
          description="Try adjusting your blood group or department filter. Donors who donated within the last 90 days are automatically excluded."
        />
      )}
      {state === 'error' && (
        <div className="error-state">
          <span className="material-symbols-outlined text-[40px] text-primary">cloud_off</span>
          <p className="text-body-md text-on-surface-variant">Failed to load donors.</p>
          <button className="btn-primary" id="search-donors-retry-btn">
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

export default SearchDonorsScreen;
