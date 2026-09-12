import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FeedSkeleton } from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import ErrorBoundary from '../../components/common/ErrorBoundary';

const CATEGORY_PILLS = [
  { id: 'all', label: 'All Activity', icon: 'dynamic_feed', tag: null },
  { id: 'urgent', label: 'Urgent Blood Appeals', icon: 'warning', tag: 'Emergency', pulse: true },
  { id: 'milestones', label: 'Donation Milestones', icon: 'stars', tag: 'DonationStory' },
  { id: 'drives', label: 'Campus Blood Drives', icon: 'diversity_1', tag: 'CampusDrive' },
];

function FeedScreenContent() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Feed state
  const [posts, setPosts] = useState([]);
  const [state, setState] = useState('loading'); // 'loading' | 'ready' | 'empty' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedPill, setSelectedPill] = useState('all');

  // New Post Composer state
  const [newPostText, setNewPostText] = useState('');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [postAttachmentType, setPostAttachmentType] = useState('text');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [postError, setPostError] = useState('');

  // Media Attachment Upload state
  const fileInputRef = useRef(null);
  const [mediaPreview, setMediaPreview] = useState(null);

  // Live Telemetry & Sidebar Stats
  const [sidebarStats, setSidebarStats] = useState({
    verifiedDonors: 1248,
    activeRequests: 14,
    totalPosts: 3,
    bloodGroups: {
      'A+': 18,
      'B+': 14,
      'O+': 22,
      'AB+': 6,
      'O-': 1,
      'A-': 4,
      'B-': 5,
      'AB-': 2,
    },
    honorRoll: [
      { rank: 1, name: 'Kazi Rayhan', subtitle: 'ME 7th Batch • 4 Donations', bloodGroup: 'B+', donationCount: 4 },
      { rank: 2, name: 'Sabbir Hossain', subtitle: 'CSE 10th Batch • 3 Donations', bloodGroup: 'A+', donationCount: 3 },
      { rank: 3, name: 'Farzana Akter', subtitle: 'BBA 8th Batch • 3 Donations', bloodGroup: 'O+', donationCount: 3 },
    ],
  });

  // Repost Modal state
  const [repostTarget, setRepostTarget] = useState(null);
  const [repostQuote, setRepostQuote] = useState('');
  const [isSubmittingRepost, setIsSubmittingRepost] = useState(false);

  // Comments state per post: { [postId]: { isOpen, comments: [], page, total, isLoading, isSubmitting, text: '' } }
  const [commentsState, setCommentsState] = useState({});

  // ─── FETCH SIDEBAR STATS (Real Aggregations) ───────────────────────────────
  const fetchSidebarStats = useCallback(async () => {
    try {
      const res = await fetch('/api/posts/sidebar-stats');
      if (res.ok) {
        const data = await res.json();
        setSidebarStats(data);
      }
    } catch (err) {
      console.error('Error fetching sidebar telemetry stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchSidebarStats();
    const interval = setInterval(fetchSidebarStats, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, [fetchSidebarStats]);

  // ─── FETCH FEED (Cursor-based) ─────────────────────────────────────────────
  const fetchFeed = useCallback(async (reset = false, nextCursorVal = null, pillId = selectedPill) => {
    try {
      if (reset) {
        setState('loading');
      } else {
        setIsLoadingMore(true);
      }

      const activeTag = CATEGORY_PILLS.find((p) => p.id === pillId)?.tag;
      const token = localStorage.getItem('token') || localStorage.getItem('bloodlink_token');
      const params = new URLSearchParams({ limit: '10' });
      if (nextCursorVal) params.append('cursor', nextCursorVal);
      if (activeTag) params.append('tag', activeTag);

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
  }, [selectedPill]);

  useEffect(() => {
    fetchFeed(true, null, selectedPill);
  }, [fetchFeed, selectedPill]);

  // ─── SILENT FEED POLLING (8s interval to pick up other users' new posts) ───
  const fetchFeedSilent = useCallback(async () => {
    try {
      const activeTag = CATEGORY_PILLS.find((p) => p.id === selectedPill)?.tag;
      const token = localStorage.getItem('token') || localStorage.getItem('bloodlink_token');
      const params = new URLSearchParams({ limit: '10' });
      if (activeTag) params.append('tag', activeTag);

      const res = await fetch(`/api/posts?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        const incoming = data.posts || [];
        setPosts((prev) => {
          if (prev.length === 0) return incoming;
          const existingIds = new Set(prev.map((p) => p._id));
          const newItems = incoming.filter((p) => !existingIds.has(p._id));
          if (newItems.length === 0) {
            const incomingMap = new Map(incoming.map((p) => [p._id, p]));
            return prev.map((p) => {
              const fresh = incomingMap.get(p._id);
              if (fresh) {
                return {
                  ...p,
                  loveCount: fresh.loveCount,
                  commentCount: fresh.commentCount,
                  repostCount: fresh.repostCount,
                  isLovedByMe: p.isLovedByMe !== undefined ? p.isLovedByMe : fresh.isLovedByMe,
                  isRepostedByMe: p.isRepostedByMe !== undefined ? p.isRepostedByMe : fresh.isRepostedByMe,
                };
              }
              return p;
            });
          }
          return [...newItems, ...prev];
        });
      }
    } catch (err) {
      console.warn('Silent feed poll failed:', err);
    }
  }, [selectedPill]);

  useEffect(() => {
    const interval = setInterval(fetchFeedSilent, 8000); // 8s silent auto-poll
    return () => clearInterval(interval);
  }, [fetchFeedSilent]);

  // ─── MEDIA ATTACHMENT HANDLER ──────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPostError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPostError('Image size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setMediaPreview(loadEvt.target.result);
      setPostAttachmentType('image');
      setIsComposerOpen(true);
      setPostError('');
    };
    reader.onerror = () => {
      setPostError('Failed to read selected image.');
    };
    reader.readAsDataURL(file);
  };

  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // ─── CREATE POST ───────────────────────────────────────────────────────────
  const handleCreatePost = async (e) => {
    e.preventDefault();
    setPostError('');

    if (!newPostText.trim() && !mediaPreview) return;

    const token = localStorage.getItem('token') || localStorage.getItem('bloodlink_token');
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
        body: JSON.stringify({
          content: newPostText.trim(),
          mediaUrl: mediaPreview || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to publish post');
      }

      // Optimistically prepend post to feed immediately
      setPosts((prev) => [data.post, ...prev]);
      setNewPostText('');
      setMediaPreview(null);
      setIsComposerOpen(false);
      setState('ready');
      fetchSidebarStats(); // Refresh counters
    } catch (err) {
      setPostError(err.message || 'Failed to create post');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // ─── LOVE TOGGLE ───────────────────────────────────────────────────────────
  const handleToggleLove = async (postId) => {
    const token = localStorage.getItem('token') || localStorage.getItem('bloodlink_token');
    if (!token) return;

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p._id === postId) {
          const wasLoved = p.isLovedByMe;
          return {
            ...p,
            isLovedByMe: !wasLoved,
            loveCount: Math.max(0, (p.loveCount || 0) + (wasLoved ? -1 : 1)),
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
    const token = localStorage.getItem('token') || localStorage.getItem('bloodlink_token');
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

    const token = localStorage.getItem('token') || localStorage.getItem('bloodlink_token');
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

  // Helper to test if a post is an urgent emergency appeal
  const isUrgentPost = (post) => {
    const text = (post.content || '').toLowerCase();
    const hasEmergencyTag = post.tags && post.tags.some((t) => /emergency|urgent|needed|requisition/i.test(t));
    return hasEmergencyTag || /urgent|critical|emergency|surgery|accident|icu/i.test(text);
  };

  return (
    <div className="relative z-10 w-full max-w-[1360px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Main Feed 2-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start pb-12">
        
        {/* ══════════════════════════════════════════════════════════════════════
            COLUMN 1: Central Community Feed Stream (flex-1 max-w-[780px])
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 w-full max-w-[780px] flex flex-col gap-5">
          
          {/* ── Glass Post Creation Box ── */}
          <section className="bg-surface-container-lowest/85 backdrop-blur-xl rounded-2xl p-4 shadow-md shadow-primary/5 border border-outline-variant/30 transition-all">
            <div className="flex items-center gap-3">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name || 'User'}
                  className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-primary/25 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-primary/25 shrink-0 text-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              
              <div className="flex-1">
                <button
                  onClick={() => setIsComposerOpen((o) => !o)}
                  className="w-full text-left bg-surface-container-low/90 hover:bg-surface-container rounded-xl px-4 py-2.5 text-sm text-on-surface-variant transition-colors shadow-inner flex items-center justify-between group"
                  type="button"
                >
                  <span className="font-medium text-slate-500">What's on your mind?</span>
                  <span className="material-symbols-outlined text-primary text-[20px] group-hover:scale-110 transition-transform">
                    edit_note
                  </span>
                </button>
              </div>
            </div>

            {/* Expanded Post Composer */}
            {isComposerOpen && (
              <form onSubmit={handleCreatePost} className="mt-3 pt-3 border-t border-outline-variant/30 space-y-3 animate-fade-in">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />

                <textarea
                  rows={3}
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  placeholder="Share a blood request, donation update, or life-saving announcement..."
                  className="w-full bg-surface-container-lowest/60 rounded-xl p-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none border border-outline-variant/30"
                  maxLength={2000}
                  autoFocus
                />

                {/* Media Preview Box */}
                {mediaPreview && (
                  <div className="relative rounded-xl overflow-hidden border border-outline-variant/40 max-h-[220px] w-fit bg-surface-container-low">
                    <img
                      src={mediaPreview}
                      alt="Attachment Preview"
                      className="max-h-[200px] w-auto object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setMediaPreview(null)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center text-xs shadow-md transition-all"
                      title="Remove Image"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                )}

                {postError && (
                  <p className="text-xs text-primary font-medium">{postError}</p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleTriggerFileInput}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        mediaPreview || postAttachmentType === 'image'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-surface-container-low/80 hover:bg-surface-container border-outline-variant/40 text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[17px] text-primary">image</span>
                      <span>{mediaPreview ? 'Change Image' : 'Image'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPostAttachmentType('text')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        postAttachmentType === 'text'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-surface-container-low/80 hover:bg-surface-container border-outline-variant/40 text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[17px] text-tertiary">text_fields</span>
                      <span>Text</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPostAttachmentType('feelings')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        postAttachmentType === 'feelings'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-surface-container-low/80 hover:bg-surface-container border-outline-variant/40 text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[17px] text-secondary">mood</span>
                      <span>Feelings</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPostAttachmentType('activity')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        postAttachmentType === 'activity'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-surface-container-low/80 hover:bg-surface-container border-outline-variant/40 text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[17px] text-primary">celebration</span>
                      <span>Activity</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-on-surface-variant">
                      {newPostText.length}/2000
                    </span>
                    <button
                      type="submit"
                      disabled={isSubmittingPost || (!newPostText.trim() && !mediaPreview)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-white text-xs font-semibold shadow-md shadow-primary/25 hover:shadow-primary/40 active:scale-95 transition-all disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(135deg, rgb(225, 29, 72) 0%, rgb(190, 18, 60) 100%)',
                        boxShadow: 'rgba(225, 29, 72, 0.35) 0px 4px 14px, rgba(255, 255, 255, 0.25) 0px 1px 0px inset',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                      }}
                    >
                      <span className="material-symbols-outlined text-[16px] text-white">send</span>
                      <span>{isSubmittingPost ? 'Posting...' : 'Post'}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {!isComposerOpen && (
              <div className="mt-3 pt-3 border-t border-outline-variant/40 flex flex-wrap items-center justify-between gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={handleTriggerFileInput}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low/80 hover:bg-surface-container border border-outline-variant/40 text-on-surface text-xs font-semibold transition-all shadow-xs"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[17px] text-primary">image</span>
                    <span>Image</span>
                  </button>
                  <button
                    onClick={() => { setIsComposerOpen(true); setPostAttachmentType('text'); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low/80 hover:bg-surface-container border border-outline-variant/40 text-on-surface text-xs font-semibold transition-all shadow-xs"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[17px] text-tertiary">text_fields</span>
                    <span>Text</span>
                  </button>
                  <button
                    onClick={() => { setIsComposerOpen(true); setPostAttachmentType('feelings'); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low/80 hover:bg-surface-container border border-outline-variant/40 text-on-surface text-xs font-semibold transition-all shadow-xs"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[17px] text-secondary">mood</span>
                    <span>Feelings</span>
                  </button>
                  <button
                    onClick={() => { setIsComposerOpen(true); setPostAttachmentType('activity'); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low/80 hover:bg-surface-container border border-outline-variant/40 text-on-surface text-xs font-semibold transition-all shadow-xs"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[17px] text-primary">celebration</span>
                    <span>Activity</span>
                  </button>
                </div>

                <button
                  onClick={() => setIsComposerOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-white text-xs font-semibold shadow-md shadow-primary/25 hover:shadow-primary/40 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, rgb(225, 29, 72) 0%, rgb(190, 18, 60) 100%)',
                    boxShadow: 'rgba(225, 29, 72, 0.35) 0px 4px 14px, rgba(255, 255, 255, 0.25) 0px 1px 0px inset',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                  }}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px] text-white">send</span>
                  <span>Post</span>
                </button>
              </div>
            )}
          </section>

          {/* ── Category Filter Pills Bar ── */}
          <nav aria-label="Feed Categories" className="flex items-center gap-2 overflow-x-auto pb-1">
            {CATEGORY_PILLS.map((pill) => {
              const isActive = selectedPill === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => setSelectedPill(pill.id)}
                  type="button"
                  className={`px-4 py-2 rounded-full font-semibold text-xs shrink-0 flex items-center gap-1.5 transition-all shadow-sm ${
                    isActive
                      ? 'text-white'
                      : 'bg-surface-container-lowest/90 hover:bg-surface-container-high text-on-surface-variant hover:text-primary'
                  }`}
                  style={
                    isActive
                      ? {
                          background: 'linear-gradient(135deg, rgb(225, 29, 72) 0%, rgb(190, 18, 60) 100%)',
                          boxShadow: 'rgba(225, 29, 72, 0.35) 0px 4px 16px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                        }
                      : {
                          border: '1px solid rgba(136, 8, 37, 0.2)',
                          boxShadow: 'rgba(136, 8, 37, 0.08) 0px 2px 8px',
                        }
                  }
                >
                  <span className={`material-symbols-outlined text-[16px] ${isActive ? 'text-white' : 'text-primary'}`}>
                    {pill.icon}
                  </span>
                  <span>{pill.label}</span>
                  {pill.pulse && (
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping ml-0.5" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* ── Feed Stream States ── */}
          {state === 'loading' && <FeedSkeleton count={3} />}

          {state === 'empty' && (
            <div className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-2xl p-8 text-center border border-outline-variant/30 shadow-md">
              <EmptyState
                icon="newspaper"
                title="No community posts found"
                description="Be the first to share an emergency requisition, donation story, or campus blood announcement."
              />
            </div>
          )}

          {state === 'error' && (
            <div className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-2xl p-8 text-center error-state border border-primary/30 shadow-md">
              <span className="material-symbols-outlined text-[48px] text-primary">wifi_off</span>
              <div className="mt-2">
                <h3 className="text-lg font-bold text-on-surface">Unable to load feed</h3>
                <p className="text-sm text-on-surface-variant mt-1">{errorMessage}</p>
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
            <div className="space-y-5">
              {posts.map((post) => {
                const author = post.author || {};
                const cState = commentsState[post._id] || { isOpen: false, comments: [] };
                const urgent = isUrgentPost(post);

                return (
                  <article
                    key={post._id}
                    className={`relative bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-5 shadow-lg shadow-primary/5 transition-all overflow-hidden border ${
                      urgent ? 'border-primary/40 shadow-primary/10' : 'border-outline-variant/30 hover:border-primary/30'
                    }`}
                  >
                    {/* Urgent Medical Case Left Accent Bar & Header Ribbon */}
                    {urgent && (
                      <>
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1.5 animate-pulse"
                          style={{
                            background: 'linear-gradient(135deg, rgb(225, 29, 72) 0%, rgb(190, 18, 60) 100%)',
                            boxShadow: 'rgba(225, 29, 72, 0.5) 0px 0px 12px',
                          }}
                        />
                        <div
                          className="-mx-5 -mt-5 px-5 py-2.5 mb-3 flex items-center justify-between"
                          style={{
                            background: 'linear-gradient(90deg, rgba(225, 29, 72, 0.14) 0%, rgba(225, 29, 72, 0.03) 100%)',
                            borderBottom: '1px solid rgba(225, 29, 72, 0.2)',
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full animate-ping"
                              style={{
                                background: 'rgb(225, 29, 72)',
                                boxShadow: 'rgba(225, 29, 72, 0.6) 0px 0px 10px',
                              }}
                            />
                            <span className="text-xs text-primary font-bold uppercase tracking-wider">
                              CRITICAL MEDICAL EMERGENCY
                            </span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Author Meta Row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {author.avatarUrl ? (
                          <img
                            src={author.avatarUrl}
                            alt={author.name || 'Author'}
                            className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-primary/20"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold shadow-sm text-sm">
                            <span className="material-symbols-outlined text-[22px]">
                              {urgent ? 'local_hospital' : 'account_circle'}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h2 className="text-sm font-bold text-on-surface leading-tight">
                              {author.name || 'Campus Member'}
                            </h2>
                            <span className="material-symbols-outlined text-primary text-[18px]" title="Verified Member">
                              verified
                            </span>
                            {author.bloodGroup && (
                              <span className="blood-group-chip text-[10px] px-1.5 py-0.2">
                                {author.bloodGroup}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-on-surface-variant">
                            {author.department || 'BAUST'} • {author.userType || 'Member'} •{' '}
                            <span className="font-medium text-primary">{formatRelativeTime(post.createdAt)}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        className="p-1.5 rounded-lg text-outline hover:bg-surface-container transition-colors"
                        type="button"
                        aria-label="Options"
                      >
                        <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                      </button>
                    </div>

                    {/* Urgent Case Highlight Box */}
                    {urgent && (
                      <div className="bg-surface-container-low/90 rounded-xl p-3.5 mb-3 border border-primary/20">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <span className="text-sm font-bold text-primary tracking-tight">
                            URGENT REQUISITION
                          </span>
                          <span
                            className="inline-flex items-center px-3 py-0.5 rounded-full text-white text-xs font-bold shadow-sm"
                            style={{
                              background: 'linear-gradient(135deg, rgb(225, 29, 72) 0%, rgb(190, 18, 60) 100%)',
                              boxShadow: 'rgba(225, 29, 72, 0.35) 0px 2px 10px',
                            }}
                          >
                            Emergency Patient
                          </span>
                        </div>
                        <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line">
                          {post.content}
                        </p>
                      </div>
                    )}

                    {/* Standard Post Content */}
                    {!urgent && (
                      <p className="text-sm text-on-surface whitespace-pre-line leading-relaxed mb-3">
                        {post.content}
                      </p>
                    )}

                    {/* Post Attached Media Image */}
                    {post.mediaUrl && (
                      <div className="mb-3 rounded-xl overflow-hidden border border-outline-variant/30 bg-surface-container-low max-h-[400px]">
                        <img
                          src={post.mediaUrl}
                          alt="Attached media"
                          className="w-full max-h-[400px] object-cover rounded-xl hover:scale-[1.01] transition-transform"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Post Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] font-semibold text-primary bg-primary/5 hover:bg-primary/15 px-2 py-0.5 rounded-full transition-colors"
                          >
                            #{tag.replace('#', '')}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Urgent Quick CTA Row */}
                    {urgent && (
                      <div className="flex flex-wrap items-center gap-3 pt-1 mb-3">
                        <Link
                          to="/blood-hub"
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md shadow-primary/30 hover:shadow-primary/50 transition-all"
                          style={{
                            background: 'linear-gradient(135deg, rgb(225, 29, 72) 0%, rgb(190, 18, 60) 100%)',
                            boxShadow: 'rgba(225, 29, 72, 0.4) 0px 4px 20px, rgba(255, 255, 255, 0.25) 0px 1px 0px inset',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                          }}
                        >
                          <span className="material-symbols-outlined text-[18px]">volunteer_activism</span>
                          <span>I Can Donate</span>
                        </Link>
                        <a
                          href="tel:+8801769660000"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold shadow-xs transition-colors"
                        >
                          <span className="material-symbols-outlined text-[17px] text-primary">phone_forwarded</span>
                          <span>Call Medical Desk</span>
                        </a>
                      </div>
                    )}

                    {/* Social Engagement Bar */}
                    <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant font-medium">
                      <div className="flex items-center gap-4">
                        {/* Love / Like Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleLove(post._id)}
                          className={`inline-flex items-center gap-1.5 transition-colors ${
                            post.isLovedByMe ? 'text-primary font-bold' : 'hover:text-primary'
                          }`}
                        >
                          <span
                            className="material-symbols-outlined text-[19px]"
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
                          className="inline-flex items-center gap-1.5 hover:text-on-surface transition-colors"
                        >
                          <span className="material-symbols-outlined text-[19px]">chat_bubble</span>
                          <span>{post.commentCount || 0} Comments</span>
                        </button>

                        {/* Repost Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenRepost(post)}
                          className={`inline-flex items-center gap-1.5 transition-colors ${
                            post.isRepostedByMe ? 'text-primary font-bold' : 'hover:text-on-surface'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[19px]">repeat</span>
                          <span>{post.repostCount || 0} Reposts</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({ title: 'BAUST BloodLink Update', text: post.content, url: window.location.href });
                          }
                        }}
                        className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                        title="Share Update"
                      >
                        <span className="material-symbols-outlined text-[18px]">share</span>
                        <span>Share</span>
                      </button>
                    </div>

                    {/* Inline Comment Thread */}
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
                  </article>
                );
              })}

              {/* Cursor Pagination: Load Earlier Posts */}
              {hasMore && (
                <div className="text-center pt-3 pb-6">
                  <button
                    type="button"
                    onClick={() => fetchFeed(false, cursor)}
                    disabled={isLoadingMore}
                    className="btn-outline py-2 px-6 text-xs font-bold inline-flex items-center gap-2 rounded-xl"
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
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            COLUMN 2: Right-Side Glass Widget Rail (fixed width 340px)
        ══════════════════════════════════════════════════════════════════════ */}
        <aside aria-label="Campus Blood Stats & Shortcuts" className="w-full lg:w-[340px] shrink-0 flex flex-col gap-5">
          
          {/* WIDGET 1: Direct One-Tap Emergency SOS Shortcut */}
          <section
            className="bg-surface-container-lowest/95 backdrop-blur-2xl rounded-2xl p-5 shadow-xl shadow-primary/15 relative overflow-hidden"
            style={{
              border: '1px solid rgba(225, 29, 72, 0.25)',
              boxShadow: 'rgba(225, 29, 72, 0.12) 0px 8px 32px',
            }}
          >
            <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-primary/10 blur-xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] uppercase tracking-widest text-primary font-bold">
                24/7 Red Alert System
              </span>
            </div>
            <h3 className="text-base font-bold text-on-surface mb-1">Emergency Blood Needed?</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
              Broadcast an immediate SOS alert to {sidebarStats.verifiedDonors}+ matching verified campus donors and clinical volunteers within 5km radius.
            </p>
            <button
              onClick={() => navigate('/emergency')}
              className="w-full py-3 px-4 rounded-xl text-white text-xs font-bold shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
              type="button"
              style={{
                background: 'linear-gradient(135deg, rgb(225, 29, 72) 0%, rgb(190, 18, 60) 100%)',
                boxShadow: 'rgba(225, 29, 72, 0.45) 0px 6px 24px, rgba(255, 255, 255, 0.25) 0px 1px 0px inset',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <span className="material-symbols-outlined text-[20px] animate-pulse">crisis_alert</span>
              <span>Trigger Emergency SOS</span>
            </button>
          </section>

          {/* WIDGET 2: Campus Blood Bank Live Inventory & Network Stats */}
          <section className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-2xl p-5 shadow-md shadow-primary/5 border border-outline-variant/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[20px]">monitor_heart</span>
                <h3 className="text-sm font-bold text-on-surface">Campus Registry</h3>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"
                  style={{
                    background: 'rgb(136, 8, 37)',
                    boxShadow: 'rgba(136, 8, 37, 0.45) 0px 0px 8px',
                  }}
                />
                <span>LIVE</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="p-2.5 rounded-xl bg-surface-container-low flex flex-col justify-between">
                <span className="text-xs text-on-surface-variant">Verified Donors</span>
                <span className="text-xl font-extrabold text-on-surface mt-0.5">
                  {sidebarStats.verifiedDonors?.toLocaleString?.() || sidebarStats.verifiedDonors || 1248}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-primary/10 flex flex-col justify-between">
                <span className="text-xs text-primary font-medium">Active Requests</span>
                <span className="text-xl font-extrabold text-primary mt-0.5">
                  {sidebarStats.activeRequests || 0} live
                </span>
              </div>
            </div>

            <span className="block text-[11px] text-outline uppercase tracking-wider mb-2 font-bold">
              Blood Group Availability
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-xl bg-surface-container/60 flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface">A+</span>
                <span className="text-xs font-semibold text-primary">
                  {sidebarStats.bloodGroups?.['A+'] || 18} Ready
                </span>
              </div>
              <div className="p-2 rounded-xl bg-surface-container/60 flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface">B+</span>
                <span className="text-xs font-semibold text-primary">
                  {sidebarStats.bloodGroups?.['B+'] || 14} Ready
                </span>
              </div>
              <div className="p-2 rounded-xl bg-surface-container/60 flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface">O+</span>
                <span className="text-xs font-semibold text-primary">
                  {sidebarStats.bloodGroups?.['O+'] || 22} Ready
                </span>
              </div>
              <div className="p-2 rounded-xl bg-surface-container/60 flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface">AB+</span>
                <span className="text-xs font-semibold text-on-surface-variant">
                  {sidebarStats.bloodGroups?.['AB+'] || 6} Ready
                </span>
              </div>
              <div className="p-2 rounded-xl bg-primary/15 col-span-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-primary">O- (Negative)</span>
                  <span
                    className="px-1.5 py-0.2 rounded bg-primary text-[10px] text-white font-bold"
                    style={{
                      background: 'rgb(136, 8, 37)',
                      boxShadow: 'rgba(136, 8, 37, 0.45) 0px 0px 8px',
                    }}
                  >
                    CRITICAL
                  </span>
                </div>
                <span className="text-xs font-bold text-primary">
                  {sidebarStats.bloodGroups?.['O-'] || 1} Alert
                </span>
              </div>
            </div>
          </section>

          {/* WIDGET 3: Top Campus Donors Leaderboard (Honor Roll) */}
          <section className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-2xl p-5 shadow-md shadow-primary/5 border border-outline-variant/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-tertiary text-[20px]">military_tech</span>
                <h3 className="text-sm font-bold text-on-surface">Monthly Honor Roll</h3>
              </div>
              <span className="text-[11px] text-outline font-semibold">Semester 24</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {(sidebarStats.honorRoll || []).map((honor) => (
                <div key={honor.rank} className="flex items-center justify-between p-2 rounded-xl bg-surface-container-low/80">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                        honor.rank === 1
                          ? 'text-white'
                          : 'bg-surface-container-high text-on-surface'
                      }`}
                      style={
                        honor.rank === 1
                          ? { background: 'linear-gradient(135deg, rgb(225, 29, 72) 0%, rgb(190, 18, 60) 100%)' }
                          : {}
                      }
                    >
                      {honor.rank}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface">{honor.name}</p>
                      <p className="text-[10px] text-on-surface-variant">{honor.subtitle}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
                </div>
              ))}
            </div>
          </section>

          {/* WIDGET 4: Quick 24/7 Campus Emergency Contacts */}
          <section className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-2xl p-5 shadow-md shadow-primary/5 border border-outline-variant/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-[20px]">call</span>
              <h3 className="text-sm font-bold text-on-surface">Campus Support</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-outline-variant/20">
                <span className="text-on-surface-variant">BAUST Medical Desk:</span>
                <a className="font-bold text-primary hover:underline" href="tel:01769660000">
                  01769-660000
                </a>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-outline-variant/20">
                <span className="text-on-surface-variant">Ambulance Rapid Unit:</span>
                <a className="font-bold text-primary hover:underline" href="tel:01711223344">
                  01711-223344
                </a>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-on-surface-variant">BloodLink Dispatch:</span>
                <a className="font-bold text-primary hover:underline" href="tel:01712009988">
                  01712-009988
                </a>
              </div>
            </div>
          </section>
        </aside>
      </div>

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
                {repostTarget.author?.name || 'Campus Member'}
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

function FeedScreen() {
  return (
    <ErrorBoundary section="Community Feed">
      <FeedScreenContent />
    </ErrorBoundary>
  );
}

export default FeedScreen;
