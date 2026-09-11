import EmptyState from '../../components/common/EmptyState';

/**
 * NotificationsScreen — Notifications & Messenger Shell (Phase 1)
 * Phase 5: 7-10s poll-based notification list + poll-based chat messenger with retry UI.
 */
function NotificationsScreen() {
  return (
    <div className="page-wrapper">
      <div className="mb-6">
        <h1 className="section-heading">
          <span className="material-symbols-outlined text-[24px] text-primary">notifications</span>
          Notifications & Messages
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Notifications Panel */}
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="p-space-md border-b border-outline-variant/40 flex items-center justify-between">
            <h2 className="text-headline-sm font-bold text-on-surface">Notifications</h2>
            <button className="text-label-md text-primary hover:underline" id="notif-mark-all-read">
              Mark all read
            </button>
          </div>
          <div className="p-space-md">
            <EmptyState
              icon="notifications_none"
              title="No notifications"
              description="You're all caught up! New blood requests and alerts will appear here."
            />
          </div>
          <div className="p-space-sm border-t border-outline-variant/40 text-center">
            <p className="text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[12px] align-middle">schedule</span>
              {' '}Auto-refreshes every 7 seconds
            </p>
          </div>
        </div>

        {/* Messenger Panel */}
        <div className="glass-panel rounded-xl overflow-hidden flex flex-col">
          <div className="p-space-md border-b border-outline-variant/40">
            <h2 className="text-headline-sm font-bold text-on-surface">Messages</h2>
          </div>
          <div className="flex-1 p-space-md">
            <EmptyState
              icon="chat"
              title="No conversations"
              description="Start a conversation with a donor or blood requester to coordinate a donation."
            />
          </div>
          {/* Message composer placeholder */}
          <div className="p-space-md border-t border-outline-variant/40 flex items-center gap-space-sm">
            <input
              className="input-field flex-1"
              placeholder="Type a message... (sends on ⏎)"
              id="messenger-input"
              disabled
            />
            <button className="btn-primary flex-shrink-0" id="messenger-send-btn" disabled>
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>
          <p className="px-space-md pb-space-sm text-body-sm text-on-surface-variant text-center">
            <span className="material-symbols-outlined text-[12px] align-middle">schedule</span>
            {' '}Messages poll every 5 seconds
          </p>
        </div>
      </div>
    </div>
  );
}

export default NotificationsScreen;
