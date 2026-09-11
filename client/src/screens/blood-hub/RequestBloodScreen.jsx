/**
 * RequestBloodScreen — Blood Request Form Shell (Phase 1)
 * Phase 3: Wire to POST /api/blood-requests with idempotency check + express-validator.
 */
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'BOMBAY'];

function RequestBloodScreen() {
  return (
    <div className="page-wrapper">
      <div className="mb-6">
        <h1 className="section-heading">
          <span className="material-symbols-outlined text-[24px] text-primary">add_circle</span>
          Request Blood
        </h1>
        <p className="text-body-sm text-on-surface-variant mt-1">
          Submit an urgent blood request. Compatible donors will be notified immediately.
        </p>
      </div>

      <div className="max-w-[640px]">
        <div className="glass-card p-space-lg card-critical-accent">
          <div className="space-y-space-md">
            <div>
              <label className="input-label" htmlFor="req-bloodgroup">
                Blood Group Required *
              </label>
              <select className="input-field" id="req-bloodgroup">
                <option value="">Select blood group</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="input-label" htmlFor="req-units">Units Needed *</label>
              <input
                className="input-field"
                type="number"
                id="req-units"
                placeholder="e.g. 2"
                min="1"
                max="10"
              />
            </div>

            <div>
              <label className="input-label" htmlFor="req-hospital">Hospital / Location *</label>
              <input
                className="input-field"
                type="text"
                id="req-hospital"
                placeholder="e.g. BAUST Medical Center"
              />
            </div>

            <div>
              <label className="input-label" htmlFor="req-contact">Contact Number *</label>
              <input
                className="input-field"
                type="tel"
                id="req-contact"
                placeholder="+880 1XXXXXXXXX"
              />
            </div>

            <div>
              <label className="input-label" htmlFor="req-notes">Additional Notes</label>
              <textarea
                className="input-field resize-none"
                id="req-notes"
                rows={3}
                placeholder="Any additional information about the urgency or patient condition..."
              />
            </div>

            <div className="pt-space-sm flex items-center gap-space-sm">
              <button className="btn-primary flex-1" id="req-submit-btn">
                <span className="material-symbols-outlined text-[18px]">send</span>
                Submit Request
              </button>
              <button className="btn-outline" id="req-cancel-btn">Cancel</button>
            </div>
          </div>
        </div>

        <p className="text-body-sm text-on-surface-variant mt-4 text-center">
          <span className="material-symbols-outlined text-[14px] align-middle">info</span>
          {' '}Requests are validated server-side. Duplicate submissions within 10 seconds are rejected.
        </p>
      </div>
    </div>
  );
}

export default RequestBloodScreen;
