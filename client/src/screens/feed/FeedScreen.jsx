import { useState, useEffect } from 'react';
import { FeedSkeleton } from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';

/**
 * FeedScreen — Home Feed Shell (Phase 1 placeholder)
 *
 * Requirement: Three explicit states — loading (skeleton), empty (message), error (retry)
 * Phase 5 will populate with real post data, comments, reposts, etc.
 */
function FeedScreen() {
  const [state, setState] = useState('loading'); // 'loading' | 'empty' | 'error' | 'ready'

  useEffect(() => {
    // Phase 1: Simulate skeleton loading, then show empty state
    // Phase 5: Replace with real API call
    const t = setTimeout(() => setState('empty'), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="section-heading">
            <span className="material-symbols-outlined text-[24px] text-primary">newspaper</span>
            Community Feed
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Campus blood donation updates, announcements, and stories
          </p>
        </div>
        <button className="btn-primary" id="feed-create-post-btn">
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Post
        </button>
      </div>

      {/* Feed Content: 3-state rendering */}
      <div className="max-w-[720px]">
        {state === 'loading' && <FeedSkeleton count={4} />}

        {state === 'empty' && (
          <div className="glass-panel rounded-xl">
            <EmptyState
              icon="newspaper"
              title="No posts yet"
              description="Be the first to share a blood donation story, request, or campus update."
              action={
                <button className="btn-primary" id="feed-first-post-btn">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  Create First Post
                </button>
              }
            />
          </div>
        )}

        {state === 'error' && (
          <div className="glass-panel rounded-xl">
            <div className="error-state">
              <span className="material-symbols-outlined text-[40px] text-primary">cloud_off</span>
              <div>
                <h3 className="text-headline-sm font-semibold text-on-surface">Failed to load feed</h3>
                <p className="text-body-md text-on-surface-variant">
                  Could not connect to the server. Please check your connection.
                </p>
              </div>
              <button className="btn-primary" onClick={() => setState('loading')} id="feed-retry-btn">
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FeedScreen;
