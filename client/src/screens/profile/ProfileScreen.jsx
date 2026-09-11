import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProfileScreen — User Profile (Phase 2 Auth Integration)
 * Displays authenticated user's credentials, role sub-documents,
 * blood group status (locked post-verification), availability status, and cooldown status.
 */
function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="page-wrapper max-w-[800px] mx-auto text-center py-16">
        <div className="glass-card p-space-xl">
          <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto mb-space-md flex items-center justify-center">
            <span className="material-symbols-outlined text-[40px] text-primary">
              account_circle
            </span>
          </div>
          <h2 className="text-headline-md font-bold text-on-surface">Sign In Required</h2>
          <p className="text-body-md text-on-surface-variant mt-2 max-w-md mx-auto">
            Please sign in with your institutional credentials to access your donor profile, donation
            records, and settings.
          </p>
          <div className="flex justify-center gap-space-md mt-6">
            <Link to="/login" className="btn-primary" id="profile-signin-btn">
              <span className="material-symbols-outlined text-[18px]">login</span>
              Sign In
            </Link>
            <Link to="/register" className="btn-secondary" id="profile-register-btn">
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 90-day donor cooldown status computed by User model toSafeObject()
  const isEligible = user.isDonorEligible !== false;

  return (
    <div className="page-wrapper">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="section-heading">
          <span
            className="material-symbols-outlined text-[24px] text-primary"
            style={{ fontVariationSettings: '"FILL" 1' }}
          >
            account_circle
          </span>
          My Profile
        </h1>
        <div className="flex items-center gap-3">
          <span
            className={`status-pill ${
              isEligible ? 'status-pill-success' : 'status-pill-warning'
            }`}
          >
            <span className="status-dot" />
            {isEligible ? 'Eligible to Donate' : 'Cooldown Active'}
          </span>
          {user.isDisasterVolunteer && (
            <span className="px-3 py-1 rounded-full text-label-sm font-semibold bg-primary text-on-primary shadow-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">emergency</span>
              Disaster Volunteer
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="col-span-1">
          <div className="glass-card p-space-lg text-center">
            <div className="w-20 h-20 rounded-full bg-primary-container mx-auto mb-space-md flex items-center justify-center ring-4 ring-primary/30 shadow-crimson-sm">
              <span
                className="material-symbols-outlined text-[40px] text-on-primary-container"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                account_circle
              </span>
            </div>

            <h2 className="text-headline-sm font-bold text-on-surface">{user.name}</h2>
            <p className="text-body-sm font-mono text-on-surface-variant mt-0.5 tracking-wider">
              {user.institutionalId}
            </p>

            <div className="flex justify-center items-center gap-2 mt-3">
              <span className="blood-group-chip text-label-md px-3 py-1 font-bold">
                {user.bloodGroup}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-label-sm font-medium bg-surface-container border border-outline-variant text-on-surface-variant">
                {user.userType || 'Student'}
              </span>
            </div>

            <div className="divider my-space-md" />

            <div className="space-y-2.5 text-left">
              <div className="flex justify-between items-center text-body-sm">
                <span className="text-on-surface-variant">Department</span>
                <span className="font-semibold text-on-surface">{user.department}</span>
              </div>

              <div className="flex justify-between items-center text-body-sm">
                <span className="text-on-surface-variant">Gender</span>
                <span className="font-semibold text-on-surface">{user.gender}</span>
              </div>

              <div className="flex justify-between items-center text-body-sm">
                <span className="text-on-surface-variant">Email</span>
                <span className="font-medium text-on-surface truncate max-w-[180px]" title={user.email}>
                  {user.email}
                </span>
              </div>

              {user.phone && (
                <div className="flex justify-between items-center text-body-sm">
                  <span className="text-on-surface-variant">Phone</span>
                  <span className="font-medium text-on-surface">{user.phone}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-body-sm">
                <span className="text-on-surface-variant">Availability</span>
                <span
                  className={`font-semibold ${
                    user.availabilityStatus === 'Available' ? 'text-primary' : 'text-on-surface-variant'
                  }`}
                >
                  {user.availabilityStatus || 'Available'}
                </span>
              </div>

              <div className="flex justify-between items-center text-body-sm">
                <span className="text-on-surface-variant">Registry Status</span>
                <span className="text-label-sm font-medium text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">
                    {user.isBloodGroupVerified ? 'verified' : 'lock'}
                  </span>
                  {user.isBloodGroupVerified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>

              {/* Role-Specific Sub-documents */}
              {user.userType === 'Student' && user.studentDetails && (
                <>
                  <div className="divider my-2" />
                  {user.studentDetails.batch && (
                    <div className="flex justify-between items-center text-body-sm">
                      <span className="text-on-surface-variant">Batch</span>
                      <span className="font-medium text-on-surface">{user.studentDetails.batch}</span>
                    </div>
                  )}
                  {user.studentDetails.section && (
                    <div className="flex justify-between items-center text-body-sm">
                      <span className="text-on-surface-variant">Section</span>
                      <span className="font-medium text-on-surface">{user.studentDetails.section}</span>
                    </div>
                  )}
                  {user.studentDetails.session && (
                    <div className="flex justify-between items-center text-body-sm">
                      <span className="text-on-surface-variant">Session</span>
                      <span className="font-medium text-on-surface">{user.studentDetails.session}</span>
                    </div>
                  )}
                </>
              )}

              {user.userType === 'Teacher' && user.teacherDetails && (
                <>
                  <div className="divider my-2" />
                  {user.teacherDetails.designation && (
                    <div className="flex justify-between items-center text-body-sm">
                      <span className="text-on-surface-variant">Designation</span>
                      <span className="font-medium text-on-surface">{user.teacherDetails.designation}</span>
                    </div>
                  )}
                  {user.teacherDetails.roomNumber && (
                    <div className="flex justify-between items-center text-body-sm">
                      <span className="text-on-surface-variant">Room</span>
                      <span className="font-medium text-on-surface">{user.teacherDetails.roomNumber}</span>
                    </div>
                  )}
                </>
              )}

              {user.userType === 'Staff' && user.staffDetails && (
                <>
                  <div className="divider my-2" />
                  {user.staffDetails.designation && (
                    <div className="flex justify-between items-center text-body-sm">
                      <span className="text-on-surface-variant">Designation</span>
                      <span className="font-medium text-on-surface">{user.staffDetails.designation}</span>
                    </div>
                  )}
                  {user.staffDetails.office && (
                    <div className="flex justify-between items-center text-body-sm">
                      <span className="text-on-surface-variant">Office</span>
                      <span className="font-medium text-on-surface">{user.staffDetails.office}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <button
              onClick={logout}
              className="btn-secondary w-full mt-6 text-body-sm justify-center"
              id="profile-logout-btn"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Sign Out
            </button>
          </div>
        </div>

        {/* Stats + Details */}
        <div className="col-span-2 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: 'Total Donations',
                value: user.donationCount || 0,
                icon: 'favorite',
              },
              {
                label: 'Last Donation',
                value: user.lastDonationDate
                  ? new Date(user.lastDonationDate).toLocaleDateString()
                  : 'Never',
                icon: 'calendar_today',
              },
              {
                label: 'Cooldown Status',
                value: isEligible ? 'Ready' : 'In Cooldown',
                icon: 'timer',
              },
            ].map((stat) => (
              <div key={stat.label} className="glass-panel rounded-xl p-space-md text-center">
                <span
                  className="material-symbols-outlined text-[24px] text-primary"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  {stat.icon}
                </span>
                <p className="text-headline-md font-bold text-on-surface mt-1">{stat.value}</p>
                <p className="text-label-sm text-on-surface-variant">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="glass-panel rounded-xl p-space-md">
            <h3 className="section-heading mb-4">Donation History</h3>
            <div className="empty-state py-8">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant">
                history
              </span>
              <p className="text-body-md text-on-surface-variant">
                No recorded donations yet on BAUST BloodLink.
              </p>
              <p className="text-label-sm text-on-surface-variant mt-1">
                Completed donations will appear here and unlock lifetime donor badges.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileScreen;
