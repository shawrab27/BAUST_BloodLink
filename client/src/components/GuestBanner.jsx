import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * GuestBanner — a dismissible sticky ribbon shown to OAuth/Guest users.
 * Rendered at the top of all authenticated pages via AppLayout.
 * Gives one-click access to /complete-profile without interrupting browsing.
 */
function GuestBanner() {
  const { isGuest, user } = useAuth();
  const navigate = useNavigate();

  if (!isGuest) return null;

  return (
    <div
      id="guest-banner"
      role="banner"
      className="sticky top-0 z-50 w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 px-4 flex items-center justify-between gap-3 shadow-md"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="material-symbols-outlined text-[20px] flex-shrink-0">info</span>
        <span className="text-sm font-medium truncate">
          <span className="font-bold">{user?.name || 'Guest'}</span>
          {' '}— browsing as Guest.{' '}
          <span className="hidden sm:inline">
            To request blood, message donors, or join WhatsApp,{' '}
          </span>
          complete your campus profile.
        </span>
      </div>
      <button
        id="guest-banner-complete-profile-btn"
        onClick={() => navigate('/complete-profile')}
        className="flex-shrink-0 px-4 py-1.5 rounded-lg bg-white text-amber-700 text-xs font-bold hover:bg-amber-50 active:scale-95 transition-all"
      >
        Complete Profile
      </button>
    </div>
  );
}

export default GuestBanner;
