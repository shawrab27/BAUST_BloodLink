import { FeedSkeleton } from '../../components/common/SkeletonLoader';

/**
 * ProfileScreen — User Profile Shell (Phase 1)
 * Phase 5: Donation history, leaderboard, locked blood-group field after approval.
 */
function ProfileScreen() {
  return (
    <div className="page-wrapper">
      <div className="mb-6">
        <h1 className="section-heading">
          <span className="material-symbols-outlined text-[24px] text-primary"
            style={{ fontVariationSettings: '"FILL" 1' }}>account_circle</span>
          My Profile
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="col-span-1">
          <div className="glass-card p-space-lg text-center">
            <div className="w-20 h-20 rounded-full bg-primary-container mx-auto mb-space-md flex items-center justify-center ring-4 ring-primary/30">
              <span className="material-symbols-outlined text-[40px] text-on-primary-container"
                style={{ fontVariationSettings: '"FILL" 1' }}>account_circle</span>
            </div>
            <h2 className="text-headline-sm font-bold text-on-surface">—</h2>
            <p className="text-body-sm text-on-surface-variant mt-1">Sign in to view profile</p>
            <div className="flex justify-center mt-3">
              <span className="blood-group-chip">—</span>
            </div>
            <div className="divider my-space-md" />
            <div className="space-y-2 text-left">
              {['Institutional ID', 'Department', 'Availability'].map((field) => (
                <div key={field} className="flex justify-between items-center">
                  <span className="text-label-md text-on-surface-variant">{field}</span>
                  <span className="text-label-md font-semibold text-on-surface">—</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats + History */}
        <div className="col-span-2 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Donations', value: '—', icon: 'favorite' },
              { label: 'Last Donation', value: '—', icon: 'calendar_today' },
              { label: 'Donor Rank', value: '—', icon: 'leaderboard' },
            ].map((stat) => (
              <div key={stat.label} className="glass-panel rounded-xl p-space-md text-center">
                <span className="material-symbols-outlined text-[24px] text-primary"
                  style={{ fontVariationSettings: '"FILL" 1' }}>{stat.icon}</span>
                <p className="text-headline-md font-bold text-on-surface mt-1">{stat.value}</p>
                <p className="text-label-sm text-on-surface-variant">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="glass-panel rounded-xl p-space-md">
            <h3 className="section-heading mb-4">Donation History</h3>
            <div className="empty-state py-8">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant">history</span>
              <p className="text-body-md text-on-surface-variant">No donation records yet.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileScreen;
