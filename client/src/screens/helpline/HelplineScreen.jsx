import { useState, useEffect } from 'react';

const CATEGORIES = [
  { id: 'All', label: 'All Contacts', icon: 'contacts' },
  { id: 'Medical', label: 'Medical & Hospitals', icon: 'local_hospital' },
  { id: 'Committee', label: 'Executive Committee', icon: 'groups' },
  { id: 'Campus', label: 'Campus Security & Logistics', icon: 'security' },
  { id: 'WhatsApp', label: 'WhatsApp Community', icon: 'chat' },
];

function HelplineScreen() {
  const [contacts, setContacts] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hotline, setHotline] = useState('+880 1769-662215');

  const fetchHelpline = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/helpline');
      if (!res.ok) throw new Error('Failed to load helpline directory');
      const data = await res.json();
      setContacts(data.contacts || []);
      setGrouped(data.grouped || {});
      if (data.emergencyHotline) setHotline(data.emergencyHotline);
    } catch (err) {
      setError(err.message || 'Unable to fetch helpline contacts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHelpline();
  }, []);

  const filteredContacts = contacts.filter((c) => {
    if (activeCategory !== 'All' && c.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.location && c.location.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="page-wrapper max-w-[1080px] mx-auto pb-16 space-y-6">
      {/* 24/7 Emergency Sticky Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30 flex items-center justify-between shadow-sm flex-wrap gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center flex-shrink-0 shadow-md animate-pulse">
            <span className="material-symbols-outlined text-[28px]">emergency</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-on-surface text-base">BAUST Emergency Clinical &amp; Ambulance Relay Desk</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary text-white tracking-wide uppercase">24/7 LIVE</span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Ground Floor, Academic Building South · Direct campus doctor triage, CMH Cantonment liaison &amp; rapid transport
            </p>
          </div>
        </div>

        <a
          href={`tel:${hotline.replace(/\s+/g, '')}`}
          className="btn-primary py-2.5 px-5 text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-primary/30 flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">call</span>
          <span>{hotline}</span>
        </a>
      </div>

      {/* Official WhatsApp Community Panel */}
      <div className="p-5 rounded-2xl bg-surface-container border border-outline-variant/30 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[28px]">groups</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-on-surface">Official BAUST BloodLink WhatsApp Community</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                1,450+ Active Donors
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Instant requisition broadcasts, live emergency coordination, and volunteer network for Saidpur &amp; Rangpur zone.
            </p>
          </div>
        </div>

        <a
          href="https://chat.whatsapp.com/sample-bloodlink-baust"
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">chat</span>
          <span>Join WhatsApp Group</span>
        </a>
      </div>

      {/* Page Header & Search */}
      <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
        <div>
          <h1 className="section-heading">
            <span className="material-symbols-outlined text-[26px] text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>
              medical_services
            </span>
            Helpline &amp; Executive Directory
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Verified contacts for medical officers, ambulance units, hospital partners, student executive committee, and campus security
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder="Search by name, role, hospital, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-9 py-2 text-xs w-full"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-outline-variant/30">
        {CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.id;
          const count = cat.id === 'All' ? contacts.length : (grouped[cat.id] || []).length;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
                isSelected
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
              <span>{cat.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-surface-container-high'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-5 rounded-2xl animate-pulse space-y-3">
              <div className="h-5 bg-surface-container rounded w-1/2" />
              <div className="h-4 bg-surface-container rounded w-3/4" />
              <div className="h-8 bg-surface-container rounded w-full mt-4" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="glass-panel p-8 text-center rounded-2xl error-state">
          <span className="material-symbols-outlined text-[48px] text-primary">error</span>
          <h3 className="text-headline-sm font-semibold text-on-surface mt-2">{error}</h3>
          <button onClick={fetchHelpline} className="btn-primary mt-4">
            Retry
          </button>
        </div>
      )}

      {/* Contacts Grid */}
      {!isLoading && !error && (
        <>
          {filteredContacts.length === 0 ? (
            <div className="glass-panel p-10 text-center rounded-2xl">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant">search_off</span>
              <p className="text-body-md text-on-surface-variant mt-2">
                No contacts found matching &ldquo;{searchQuery}&rdquo;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredContacts.map((c) => (
                <div
                  key={c._id || c.phone}
                  className="glass-card p-5 rounded-2xl border border-outline-variant/30 shadow-sm transition-all hover:border-primary/40 hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-[22px]">
                            {c.category === 'Medical'
                              ? 'local_hospital'
                              : c.category === 'Committee'
                              ? 'groups'
                              : c.category === 'WhatsApp'
                              ? 'chat'
                              : 'security'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-on-surface">{c.name}</h3>
                          <span className="text-xs text-primary font-medium">{c.role}</span>
                        </div>
                      </div>

                      {c.isAvailable24_7 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary flex-shrink-0">
                          24/7 Available
                        </span>
                      )}
                    </div>

                    {/* Location Tag */}
                    {c.location && (
                      <div className="flex items-center gap-1 text-[11px] text-on-surface-variant mb-4 pl-1">
                        <span className="material-symbols-outlined text-[13px] text-primary flex-shrink-0">
                          pin_drop
                        </span>
                        <span>{c.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-outline-variant/20 flex items-center gap-2">
                    <a
                      href={`tel:${c.phone}`}
                      className="btn-primary flex-1 py-1.5 text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[15px]">call</span>
                      <span>Call {c.phone}</span>
                    </a>

                    {c.whatsappNumber && (
                      <a
                        href={`https://wa.me/${c.whatsappNumber.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-outline py-1.5 px-3 text-xs font-bold flex items-center gap-1 text-on-surface hover:text-primary"
                        title="Chat on WhatsApp"
                      >
                        <span className="material-symbols-outlined text-[16px]">chat</span>
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {c.email && (
                      <a
                        href={`mailto:${c.email}`}
                        className="btn-outline py-1.5 px-3 text-xs font-bold flex items-center gap-1 text-on-surface hover:text-primary"
                        title="Send Email"
                      >
                        <span className="material-symbols-outlined text-[16px]">mail</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default HelplineScreen;

