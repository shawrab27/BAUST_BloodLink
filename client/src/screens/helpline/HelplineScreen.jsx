/**
 * HelplineScreen — Executive Helpline & Committee Directory Shell (Phase 1)
 * Phase 5: Real Helpline schema from DB, full CRUD (admin), WhatsApp links, drag-reorder.
 */
const PLACEHOLDER_CONTACTS = [
  { category: 'Medical Center', name: 'BAUST Health Center', phone: 'N/A', type: 'medical' },
  { category: 'Committee', name: 'Blood Donation Committee', phone: 'N/A', type: 'committee' },
  { category: 'Campus Security', name: 'Campus Security Office', phone: 'N/A', type: 'campus' },
];

function HelplineScreen() {
  return (
    <div className="page-wrapper">
      <div className="mb-6">
        <h1 className="section-heading">
          <span className="material-symbols-outlined text-[24px] text-primary">medical_services</span>
          Helpline & Directory
        </h1>
        <p className="text-body-sm text-on-surface-variant mt-1">
          Emergency contacts, committee members, and campus medical services
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {PLACEHOLDER_CONTACTS.map((contact, i) => (
          <div key={i} className="glass-card p-space-md">
            <div className="flex items-center gap-space-sm mb-space-sm">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px] text-primary"
                  style={{ fontVariationSettings: '"FILL" 1' }}>
                  {contact.type === 'medical' ? 'local_hospital' : contact.type === 'committee' ? 'groups' : 'security'}
                </span>
              </div>
              <div>
                <p className="text-label-lg font-semibold text-on-surface">{contact.name}</p>
                <p className="text-label-sm text-on-surface-variant">{contact.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-space-sm">
              <span className="blood-group-chip text-[10px]">{contact.phone}</span>
              <button className="btn-outline py-1 px-3 text-label-sm flex-shrink-0">
                <span className="material-symbols-outlined text-[14px]">call</span>
                Call
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel rounded-xl mt-8">
        <div className="empty-state py-12">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant">contact_phone</span>
          <p className="text-body-md text-on-surface-variant">
            Full helpline directory will be available after Phase 5.
          </p>
        </div>
      </div>
    </div>
  );
}

export default HelplineScreen;
