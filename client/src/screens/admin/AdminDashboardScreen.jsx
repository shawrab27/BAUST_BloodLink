/**
 * AdminDashboardScreen — Super Admin & Coordinator Command Center Shell (Phase 1)
 *
 * Phase 6: Real RBAC-gated (/api/admin/*) routes, aggregation metrics, feed moderation,
 * blood registry approval queue, SOS live monitor, helpline CMS, user management, audit log.
 *
 * Theme override: dark slate blue + red palette (applied via parent admin-layout class).
 */
function AdminDashboardScreen() {
  return (
    <div className="page-wrapper">
      {/* Admin Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px] text-primary"
                style={{ fontVariationSettings: '"FILL" 1' }}>admin_panel_settings</span>
            </div>
            <h1 className="section-heading">Admin Command Center</h1>
          </div>
          <p className="text-body-sm text-on-surface-variant mt-1 ml-13">
            RBAC-gated · All actions logged to Audit Log
          </p>
        </div>
        <span className="status-badge eligible">
          <span className="w-2 h-2 rounded-full bg-primary" />
          ADMIN ACCESS
        </span>
      </div>

      {/* Admin Navigation Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {ADMIN_SECTIONS.map((section) => (
          <div key={section.id} className="glass-card p-space-md" id={`admin-section-${section.id}`}>
            <div className="flex items-center gap-space-sm mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px] text-primary"
                  style={{ fontVariationSettings: '"FILL" 1' }}>{section.icon}</span>
              </div>
              <div>
                <h3 className="text-label-lg font-bold text-on-surface">{section.title}</h3>
                <p className="text-label-sm text-on-surface-variant">{section.subtitle}</p>
              </div>
            </div>
            <p className="text-body-sm text-on-surface-variant mb-3">{section.description}</p>
            <button className="btn-outline py-1.5 px-3 text-label-md w-full"
              id={`admin-open-${section.id}`}>
              Open Section
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        ))}
      </div>

      {/* Overview Metrics Placeholder */}
      <div className="glass-panel rounded-xl p-space-md">
        <h2 className="section-heading mb-4">Platform Overview</h2>
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'Total Users', icon: 'group', value: '—' },
            { label: 'Blood Requests', icon: 'bloodtype', value: '—' },
            { label: 'Donations This Week', icon: 'favorite', value: '—' },
            { label: 'Pending Approvals', icon: 'pending', value: '—' },
            { label: 'Audit Events (24h)', icon: 'fact_check', value: '—' },
          ].map((m) => (
            <div key={m.label} className="text-center p-space-md bg-surface-container-high rounded-xl">
              <span className="material-symbols-outlined text-[28px] text-primary"
                style={{ fontVariationSettings: '"FILL" 1' }}>{m.icon}</span>
              <p className="text-headline-md font-bold text-on-surface mt-1">{m.value}</p>
              <p className="text-label-sm text-on-surface-variant">{m.label}</p>
            </div>
          ))}
        </div>
        <p className="text-body-sm text-on-surface-variant text-center mt-4">
          Real aggregation queries activated in Phase 6
        </p>
      </div>
    </div>
  );
}

const ADMIN_SECTIONS = [
  {
    id: 'feed-moderation',
    title: 'Feed Moderation',
    subtitle: 'Pin · Edit · Flag · Delete',
    icon: 'newspaper',
    description: 'Review and moderate community posts. Pin important announcements, flag inappropriate content.',
  },
  {
    id: 'blood-registry',
    title: 'Blood Registry',
    subtitle: 'Approval Queue',
    icon: 'bloodtype',
    description: 'Approve or reject blood group registrations. Approvals write bloodGroup to user record permanently.',
  },
  {
    id: 'sos-monitor',
    title: 'SOS Monitor',
    subtitle: 'Live Emergency Feed',
    icon: 'e911_emergency',
    description: 'View live emergency requests, override escalation status, and dispatch volunteer responders.',
  },
  {
    id: 'helpline-cms',
    title: 'Helpline CMS',
    subtitle: 'Full CRUD · Drag-reorder',
    icon: 'contact_phone',
    description: 'Manage helpline directory entries. Changes reflect on public Helpline screen immediately.',
  },
  {
    id: 'user-management',
    title: 'User Management',
    subtitle: 'Roles · Status · RBAC',
    icon: 'manage_accounts',
    description: 'Manage user accounts, assign roles, toggle availability, and suspend accounts.',
  },
  {
    id: 'audit-log',
    title: 'Audit Log',
    subtitle: 'Immutable · Paginated',
    icon: 'fact_check',
    description: 'View all admin actions with timestamps, actor IDs, and action details. Cursor-paginated.',
  },
];

export default AdminDashboardScreen;
