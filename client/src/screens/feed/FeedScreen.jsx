import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FeedSkeleton } from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import ErrorBoundary from '../../components/common/ErrorBoundary';

const POPULAR_TAGS = ['#BloodRequest', '#CampusDrive', '#Emergency', '#DonationStory', '#O+Needed', '#BAUST'];

function FeedScreenContent() {
  const { user } = useAuth();

  // Feed state
  const [posts, setPosts] = useState([]);
  const [state, setState] = useState('loading'); // 'loading' | 'ready' | 'empty' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);

  // New Post state
  const [newPostText, setNewPostText] = useState('');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [postError, setPostError] = useState('');

  // Repost Modal state
  const [repostTarget, setRepostTarget] = useState(null);
  const [repostQuote, setRepostQuote] = useState('');
  const [isSubmittingRepost, setIsSubmittingRepost] = useState(false);

  // Comments state per post: { [postId]: { isOpen, comments: [], page, total, isLoading, isSubmitting, text: '' } }
  const [commentsState, setCommentsState] = useState({});

  // ─── FETCH FEED (Cursor-based) ─────────────────────────────────────────────
  const fetchFeed = useCallback(async (reset = false, nextCursorVal = null, tagFilter = selectedTag) => {
    try {
      if (reset) {
        setState('loading');
      } else {
        setIsLoadingMore(true);
      }

      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ limit: '10' });
      if (nextCursorVal) params.append('cursor', nextCursorVal);
      if (tagFilter) params.append('tag', tagFilter.replace('#', ''));

      const res = await fetch(`/api/posts?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error(`Failed to load feed (${res.status})`);
      }

      const data = await res.json();
      const fetchedPosts = data.posts || [];

      if (reset) {
        setPosts(fetchedPosts);
        setState(fetchedPosts.length === 0 ? 'empty' : 'ready');
      } else {
        setPosts((prev) => [...prev, ...fetchedPosts]);
        setState('ready');
      }

      setCursor(data.nextCursor || null);
      setHasMore(Boolean(data.hasMore));
    } catch (err) {
      console.error('Feed error:', err);
      if (reset) {
        setErrorMessage(err.message || 'Unable to connect to server.');
        setState('error');
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [selectedTag]);

  useEffect(() => {
    fetchFeed(true, null, selectedTag);
  }, [fetchFeed, selectedTag]);

  // ─── CREATE POST ───────────────────────────────────────────────────────────
  const handleCreatePost = async (e) => {
    e.preventDefault();
    setPostError('');

    if (!newPostText.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setPostError('Please sign in to share a post with the campus.');
      return;
    }

    setIsSubmittingPost(true);

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newPostText.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to publish post');
      }

      // Optimistically prepend post to feed
      setPosts((prev) => [data.post, ...prev]);
      setNewPostText('');
      setState('ready');
    } catch (err) {
      setPostError(err.message || 'Failed to create post');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // ─── LOVE TOGGLE ───────────────────────────────────────────────────────────
  const handleToggleLove = async (postId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p._id === postId) {
          const wasLoved = p.isLovedByMe;
          return {
            ...p,
            isLovedByMe: !wasLoved,
            loveCount: Math.max(0, p.loveCount + (wasLoved ? -1 : 1)),
          };
        }
        return p;
      })
    );

    try {
      const res = await fetch(`/api/posts/${postId}/love`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((p) => (p._id === postId ? { ...p, loveCount: data.loveCount, isLovedByMe: data.isLoved } : p))
        );
      }
    } catch (err) {
      console.error('Love toggle error:', err);
    }
  };

  // ─── REPOST MODAL ──────────────────────────────────────────────────────────
  const handleOpenRepost = (post) => {
    setRepostTarget(post);
    setRepostQuote('');
  };

  const handleConfirmRepost = async () => {
    if (!repostTarget) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsSubmittingRepost(true);
    try {
      const res = await fetch(`/api/posts/${repostTarget._id}/repost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quote: repostQuote.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((p) =>
            p._id === repostTarget._id
              ? { ...p, repostCount: data.repostCount, isRepostedByMe: data.isReposted }
              : p
          )
        );
        setRepostTarget(null);
      }
    } catch (err) {
      console.error('Repost error:', err);
    } finally {
      setIsSubmittingRepost(false);
    }
  };

  // ─── COMMENTS (Separate Collection) ────────────────────────────────────────
  const toggleComments = async (postId) => {
    const current = commentsState[postId] || { isOpen: false, comments: [], page: 1, total: 0 };
    if (current.isOpen) {
      setCommentsState((prev) => ({
        ...prev,
        [postId]: { ...current, isOpen: false },
      }));
      return;
    }

    // Open and fetch initial 20 comments
    setCommentsState((prev) => ({
      ...prev,
      [postId]: { ...current, isOpen: true, isLoading: true },
    }));

    try {
      const res = await fetch(`/api/posts/${postId}/comments?limit=20&page=1`);
      if (res.ok) {
        const data = await res.json();
        setCommentsState((prev) => ({
          ...prev,
          [postId]: {
            ...current,
            isOpen: true,
            isLoading: false,
            comments: data.comments || [],
            page: 1,
            total: data.totalComments || 0,
            hasMore: data.hasMore,
          },
        }));
      }
    } catch (err) {
      console.error('Comment fetch error:', err);
      setCommentsState((prev) => ({
        ...prev,
        [postId]: { ...current, isOpen: true, isLoading: false },
      }));
    }
  };

  const handleAddComment = async (postId) => {
    const postComments = commentsState[postId];
    if (!postComments || !postComments.text || !postComments.text.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const textToSend = postComments.text.trim();

    // Optimistic reset of input
    setCommentsState((prev) => ({
      ...prev,
      [postId]: { ...prev[postId], text: '', isSubmitting: true },
    }));

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: textToSend }),
      });

      if (res.ok) {
        const data = await res.json();
        // Append comment to list and increment count on post
        setCommentsState((prev) => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            isSubmitting: false,
            comments: [...(prev[postId].comments || []), data.comment],
            total: (prev[postId].total || 0) + 1,
          },
        }));

        setPosts((prev) =>
          prev.map((p) => (p._id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p))
        );
      }
    } catch (err) {
      console.error('Comment submission error:', err);
      setCommentsState((prev) => ({
        ...prev,
        [postId]: { ...prev[postId], isSubmitting: false },
      }));
    }
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return '';
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="page-wrapper max-w-[800px] mx-auto">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="section-heading">
            <span className="material-symbols-outlined text-[26px] text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>
              newspaper
            </span>
            Campus BloodLink Feed
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Real-time blood drive broadcasts, emergency requisitions, and donor recognition stories
          </p>
        </div>
      </div>

      {/* Tag Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4">
        <button
          onClick={() => setSelectedTag(null)}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            selectedTag === null
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
          }`}
        >
          All Updates
        </button>
        {POPULAR_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
              selectedTag === tag
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
            }`}
          >
            <span>{tag}</span>
          </button>
        ))}
      </div>

      {/* Create Post Card */}
      {user && (
        <div className="glass-card p-4 rounded-2xl mb-6 border border-primary/20 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0 font-bold text-primary">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1">
              <form onSubmit={handleCreatePost}>
                <textarea
                  rows={3}
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  placeholder="Share an emergency requisition or blood donation update with the BAUST community..."
                  className="w-full bg-transparent border-none resize-none focus:outline-none text-sm text-on-surface placeholder:text-on-surface-variant/60"
                  maxLength={2000}
                />

                {postError && (
                  <p className="text-xs text-primary font-medium mt-1">{postError}</p>
                )}

                <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-on-surface-variant font-mono">
                    <span>{newPostText.length}</span>/2000
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isSubmittingPost || !newPostText.trim()}
                      className="btn-primary py-1.5 px-4 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[15px]">send</span>
                      {isSubmittingPost ? 'Publishing...' : 'Broadcast'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 3 Explicit States */}
      {state === 'loading' && <FeedSkeleton count={3} />}

      {state === 'empty' && (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <EmptyState
            icon="newspaper"
            title="No community posts found"
            description="Be the first to share an emergency requisition, donation story, or campus blood announcement."
          />
        </div>
      )}

      {state === 'error' && (
        <div className="glass-panel rounded-2xl p-8 text-center error-state">
          <span className="material-symbols-outlined text-[48px] text-primary">wifi_off</span>
          <div>
            <h3 className="text-headline-sm font-semibold text-on-surface">Unable to load feed</h3>
            <p className="text-body-md text-on-surface-variant mt-1">{errorMessage}</p>
          </div>
          <button
            className="btn-primary mt-4"
            onClick={() => fetchFeed(true)}
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Retry Connection
          </button>
        </div>
      )}

      {state === 'ready' && (
        <div className="space-y-4">
          {posts.map((post) => {
            const author = post.author || {};
            const cState = commentsState[post._id] || { isOpen: false, comments: [] };

            return (
              <div key={post._id} className="glass-card p-5 rounded-2xl border border-outline-variant/30 shadow-sm transition-all hover:border-primary/30">
                {/* Author Info */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                      {author.name ? author.name.charAt(0).toUpperCase() : 'B'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-on-surface">{author.name || 'Campus Volunteer'}</span>
                        {author.bloodGroup && (
                          <span className="blood-group-chip text-[10px] px-1.5 py-0.5">
                            {author.bloodGroup}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-on-surface-variant block">
                        {author.department || 'BAUST'} · {author.userType || 'Student'} · {formatRelativeTime(post.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <p className="text-sm text-on-surface whitespace-pre-line leading-relaxed mb-3">
                  {post.content}
                </p>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className="text-[11px] font-semibold text-primary bg-primary/5 hover:bg-primary/15 px-2 py-0.5 rounded-full cursor-pointer transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Interaction Footer */}
                <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
                  <div className="flex items-center gap-4">
                    {/* Love Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleLove(post._id)}
                      className={`flex items-center gap-1.5 py-1 px-2 rounded-lg transition-all ${
                        post.isLovedByMe
                          ? 'text-primary font-bold bg-primary/10'
                          : 'hover:text-primary hover:bg-surface-container'
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-[18px]"
                        style={post.isLovedByMe ? { fontVariationSettings: '"FILL" 1' } : {}}
                      >
                        favorite
                      </span>
                      <span>{post.loveCount || 0}</span>
                    </button>

                    {/* Comments Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleComments(post._id)}
                      className="flex items-center gap-1.5 py-1 px-2 rounded-lg hover:text-primary hover:bg-surface-container transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                      <span>{post.commentCount || 0}</span>
                    </button>

                    {/* Repost Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenRepost(post)}
                      className={`flex items-center gap-1.5 py-1 px-2 rounded-lg transition-all ${
                        post.isRepostedByMe
                          ? 'text-primary font-bold bg-primary/10'
                          : 'hover:text-primary hover:bg-surface-container'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">repeat</span>
                      <span>{post.repostCount || 0}</span>
                    </button>
                  </div>
                </div>

                {/* Inline Comment Section (Standalone Collection, Paginated 20) */}
                {cState.isOpen && (
                  <div className="mt-4 pt-3 border-t border-outline-variant/30 space-y-3">
                    {cState.isLoading ? (
                      <div className="text-center py-2 text-xs text-on-surface-variant">Loading comments...</div>
                    ) : (
                      <>
                        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                          {cState.comments.length === 0 ? (
                            <p className="text-xs text-on-surface-variant italic py-1">No comments yet. Start the conversation!</p>
                          ) : (
                            cState.comments.map((comment) => (
                              <div key={comment._id} className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-xs">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-on-surface">{comment.author?.name || 'Volunteer'}</span>
                                  <span className="text-[10px] text-on-surface-variant">{formatRelativeTime(comment.createdAt)}</span>
                                </div>
                                <p className="text-on-surface-variant">{comment.content}</p>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Add Comment Input */}
                        {user && (
                          <div className="flex items-center gap-2 pt-2">
                            <input
                              type="text"
                              value={cState.text || ''}
                              onChange={(e) =>
                                setCommentsState((prev) => ({
                                  ...prev,
                                  [post._id]: { ...prev[post._id], text: e.target.value },
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddComment(post._id);
                              }}
                              placeholder="Write a comment..."
                              className="input-field py-1.5 px-3 text-xs flex-1"
                              maxLength={500}
                            />
                            <button
                              type="button"
                              onClick={() => handleAddComment(post._id)}
                              disabled={!cState.text || !cState.text.trim()}
                              className="btn-primary py-1.5 px-3 text-xs flex-shrink-0 disabled:opacity-50"
                            >
                              Post
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Cursor Pagination: Load More Button */}
          {hasMore && (
            <div className="text-center pt-4 pb-8">
              <button
                type="button"
                onClick={() => fetchFeed(false, cursor)}
                disabled={isLoadingMore}
                className="btn-outline py-2 px-6 text-xs font-bold inline-flex items-center gap-2"
              >
                {isLoadingMore ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Loading more updates...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">expand_more</span>
                    <span>Load Earlier Posts</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Repost Modal */}
      {repostTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="glass-modal max-w-[480px] w-full p-5 rounded-2xl border border-primary/30 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">repeat</span>
                <span className="font-bold text-sm text-on-surface">Repost to Feed</span>
              </div>
              <button
                type="button"
                onClick={() => setRepostTarget(null)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <textarea
              rows={2}
              value={repostQuote}
              onChange={(e) => setRepostQuote(e.target.value)}
              placeholder="Add your own commentary or emergency note (optional)..."
              className="input-field text-xs py-2 px-3 resize-none"
              maxLength={500}
            />

            {/* Quoted Preview */}
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs">
              <span className="font-bold text-on-surface block mb-1">
                {repostTarget.author?.name || 'Campus Volunteer'}
              </span>
              <p className="text-on-surface-variant line-clamp-2">{repostTarget.content}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRepostTarget(null)}
                className="btn-outline py-1.5 px-4 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRepost}
                disabled={isSubmittingRepost}
                className="btn-primary py-1.5 px-4 text-xs font-bold"
              >
                {isSubmittingRepost ? 'Reposting...' : 'Confirm Repost'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * FeedScreen with dedicated section Error Boundary
 */
function FeedScreen() {
  return (
    <ErrorBoundary section="Community Feed">
      <FeedScreenContent />
    </ErrorBoundary>
  );
}

export default FeedScreen;
