import { Link } from 'react-router-dom';

/**
 * BloodHubScreen — Blood Hub Landing Shell (Phase 1)
 * Phase 3 will add real BloodRequest data + donor search with cooldown filtering.
 */
function BloodHubScreen() {
  return (
    <div className="page-wrapper">
      <div className="mb-6">
        <h1 className="section-heading">
          <span className="material-symbols-outlined text-[24px] text-primary"
            style={{ fontVariationSettings: '"FILL" 1' }}>water_drop</span>
          Blood Hub
        </h1>
        <p className="text-body-sm text-on-surface-variant mt-1">
          Request blood, find compatible donors, and manage blood donation records
        </p>
      </div>

      {/* 3D Action Cards — matching Stitch "Blood Hub 3D Cards" screen */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <ActionCard
          icon="search"
          title="Search Donors"
          description="Find compatible donors by blood group, department, and availability status."
          to="/blood-hub/search"
          id="blood-hub-search-card"
          accent
        />
        <ActionCard
          icon="add_circle"
          title="Request Blood"
          description="Submit an urgent blood request. Matching donors will be notified instantly."
          to="/blood-hub/request"
          id="blood-hub-request-card"
          accent
        />
        <ActionCard
          icon="history"
          title="Active Requests"
          description="View and track all open blood requests across the campus."
          to="/blood-hub/requests"
          id="blood-hub-requests-card"
        />
      </div>

      {/* Stats placeholder */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Registered Donors', value: '—', icon: 'group' },
          { label: 'Blood Requests', value: '—', icon: 'bloodtype' },
          { label: 'Donations This Month', value: '—', icon: 'favorite' },
          { label: 'Emergency Responses', value: '—', icon: 'emergency' },
        ].map((stat) => (
          <div key={stat.label} className="glass-panel rounded-xl p-space-md">
            <span className="material-symbols-outlined text-[28px] text-primary mb-2"
              style={{ fontVariationSettings: '"FILL" 1' }}>{stat.icon}</span>
            <p className="text-display font-extrabold text-on-surface leading-none">{stat.value}</p>
            <p className="text-label-md text-on-surface-variant mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionCard({ icon, title, description, to, id, accent = false }) {
  return (
    <Link to={to} id={id} className="block">
      <div className={`glass-card p-space-lg h-full transition-all ${accent ? 'card-critical-accent' : ''}`}>
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-space-md">
          <span className="material-symbols-outlined text-[28px] text-primary"
            style={{ fontVariationSettings: '"FILL" 1' }}>{icon}</span>
        </div>
        <h3 className="text-headline-sm font-bold text-on-surface mb-2">{title}</h3>
        <p className="text-body-md text-on-surface-variant leading-relaxed">{description}</p>
        <div className="flex items-center gap-1.5 mt-space-md text-primary text-label-lg font-semibold">
          Open <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </div>
      </div>
    </Link>
  );
}

export default BloodHubScreen;
