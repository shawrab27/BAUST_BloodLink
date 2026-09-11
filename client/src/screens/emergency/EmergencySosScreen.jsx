/**
 * EmergencySosScreen — Emergency SOS Cockpit Shell (Phase 1)
 * Phase 4: Firebase Admin SDK, FCM push, 7s polling, zero-match escalation.
 */
function EmergencySosScreen() {
  return (
    <div className="page-wrapper">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="emergency-ping w-3 h-3" />
          <h1 className="section-heading">
            <span className="material-symbols-outlined text-[24px] text-primary animate-pulse"
              style={{ fontVariationSettings: '"FILL" 1' }}>e911_emergency</span>
            Emergency SOS
          </h1>
          <span className="status-badge eligible ml-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            LIVE MONITORING
          </span>
        </div>
        <p className="text-body-sm text-on-surface-variant mt-1">
          Trigger an emergency blood request. All matching donors and disaster volunteers are notified instantly via push and in-app alert.
        </p>
      </div>

      {/* SOS Trigger Panel */}
      <div className="grid grid-cols-2 gap-6 max-w-[900px]">
        <div className="glass-modal p-space-lg">
          <h2 className="text-headline-md font-bold text-on-surface mb-space-md">Trigger SOS Alert</h2>
          <div className="space-y-space-md">
            <div>
              <label className="input-label">Blood Group Needed</label>
              <select className="input-field" id="sos-bloodgroup">
                <option value="">Select blood group</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-','BOMBAY'].map((bg) => (
                  <option key={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Your Current Location</label>
              <input className="input-field" placeholder="Enter location or use map pin" id="sos-location" />
            </div>
            <div>
              <label className="input-label">Emergency Description</label>
              <textarea className="input-field resize-none" rows={3} id="sos-description"
                placeholder="Brief description of the emergency..." />
            </div>
            <button className="btn-primary w-full text-base py-3" id="sos-trigger-btn">
              <span className="material-symbols-outlined">e911_emergency</span>
              SEND SOS ALERT
            </button>
          </div>
        </div>

        {/* Status Panel */}
        <div className="glass-panel rounded-xl p-space-lg">
          <h2 className="text-headline-md font-bold text-on-surface mb-space-md">Response Status</h2>
          <div className="empty-state min-h-[200px]">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant">radar</span>
            <p className="text-body-md text-on-surface-variant">
              No active SOS. Trigger an alert to begin matching donors.
            </p>
          </div>
          <p className="text-body-sm text-on-surface-variant text-center mt-4">
            <span className="material-symbols-outlined text-[14px] align-middle">schedule</span>
            {' '}Status refreshes every 7 seconds
          </p>
        </div>
      </div>
    </div>
  );
}

export default EmergencySosScreen;
