import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * MessengerView — 1-on-1 Direct Messaging
 *
 * Requirements:
 * - Poll-based chat (5-7 seconds interval).
 * - Optimistic send: instantly appends message to UI with 'sending' status.
 * - Rollback on failure: if request fails, shows visible 'failed' badge with 'Retry' action.
 * - Conversation switcher.
 */
function MessengerView() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const messagesEndRef = useRef(null);
  const currentUserId = user?._id || user?.id;

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ─── 1. FETCH CONVERSATIONS ────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('bloodlink_token');
      if (!token) return;

      const res = await fetch('/api/messages/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);

        // Auto-select first conversation if none selected
        if (!activeConv && data.conversations && data.conversations.length > 0) {
          setActiveConv(data.conversations[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setIsLoadingConvs(false);
    }
  }, [activeConv]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ─── 2. FETCH MESSAGES & 5-7s POLLING ───────────────────────────────────────
  const fetchMessages = useCallback(
    async (isInitial = false) => {
      if (!activeConv) return;
      const token = localStorage.getItem('token') || localStorage.getItem('bloodlink_token');
      if (!token) return;

      if (isInitial) setIsLoadingMessages(true);

      try {
        const res = await fetch(`/api/messages/${activeConv.conversationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const serverMessages = data.messages || [];

          setMessages((prev) => {
            // Keep local pending/failed optimistic messages that aren't on server yet
            const pendingOrFailed = prev.filter((m) => m._isOptimistic && m.status !== 'sent');
            const combined = [...serverMessages, ...pendingOrFailed];
            return combined;
          });

          if (isInitial) scrollToBottom();
        }
      } catch (err) {
        console.error('Error polling messages:', err);
      } finally {
        if (isInitial) setIsLoadingMessages(false);
      }
    },
    [activeConv]
  );

  // Trigger initial fetch when active conversation changes
  useEffect(() => {
    if (activeConv) {
      fetchMessages(true);
      // Mark read
      const token = localStorage.getItem('token') || localStorage.getItem('bloodlink_token');
      if (token) {
        fetch(`/api/messages/${activeConv.conversationId}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    }
  }, [activeConv, fetchMessages]);

  // Set up 6-second polling loop for live updates
  useEffect(() => {
    if (!activeConv) return;
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 6000); // 6s poll interval (within 5-7s spec)
    return () => clearInterval(interval);
  }, [activeConv, fetchMessages]);

  // ─── 3. OPTIMISTIC SEND WITH ROLLBACK & RETRY ──────────────────────────────
  const handleSendMessage = async (customText = null, retryId = null) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || !activeConv) return;

    const token = localStorage.getItem('token') || localStorage.getItem('bloodlink_token');
    if (!token) return;

    const recipientId = activeConv.recipient?._id;
    const tempId = retryId || `temp_${Date.now()}`;

    // If new message (not retry), append optimistic object
    if (!retryId) {
      const optimisticMsg = {
        _id: tempId,
        conversationId: activeConv.conversationId,
        sender: {
          _id: currentUserId,
          name: user?.name || 'Me',
          bloodGroup: user?.bloodGroup || '',
        },
        recipient: recipientId,
        text: textToSend,
        status: 'sending',
        _isOptimistic: true,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      setInputText('');
      setTimeout(scrollToBottom, 50);
    } else {
      // Set to sending state on retry
      setMessages((prev) =>
        prev.map((m) => (m._id === retryId ? { ...m, status: 'sending' } : m))
      );
    }

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId,
          text: textToSend,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to deliver message.');
      }

      const data = await res.json();
      const confirmedMsg = data.data;

      // Replace optimistic placeholder with real confirmed message
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...confirmedMsg, status: 'sent' } : m))
      );
    } catch (err) {
      console.warn('Message send failed, rolling back to retry state:', err);
      // Mark message as 'failed' with retry state
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...m, status: 'failed' } : m))
      );
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm flex h-[580px]">
      {/* ── LEFT: Conversation Selector ────────────────────────────────────── */}
      <div className="w-80 border-r border-outline-variant/30 flex flex-col bg-surface-container-lowest/50">
        <div className="p-3.5 border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">chat</span>
            <span className="font-bold text-sm text-on-surface">Conversations</span>
          </div>
          <span className="text-[10px] text-on-surface-variant font-mono bg-surface-container px-2 py-0.5 rounded-full">
            Poll 6s
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/15">
          {isLoadingConvs ? (
            <div className="p-4 text-center text-xs text-on-surface-variant">Loading contacts...</div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[32px] text-outline mb-1">chat_bubble_outline</span>
              <p>No conversations yet.</p>
              <p className="text-[11px] text-on-surface-variant/70 mt-1">
                Reach out to donors or requesters in Blood Hub to start a thread.
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = activeConv?.conversationId === conv.conversationId;
              const other = conv.recipient || {};
              return (
                <button
                  key={conv.conversationId}
                  onClick={() => setActiveConv(conv)}
                  className={`w-full text-left p-3 flex items-start gap-3 transition-colors ${
                    isSelected
                      ? 'bg-primary/10 border-l-4 border-primary'
                      : 'hover:bg-surface-container/60'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center font-bold text-primary text-xs flex-shrink-0">
                    {other.name ? other.name.charAt(0).toUpperCase() : 'U'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-on-surface truncate">{other.name || 'User'}</span>
                      {other.bloodGroup && (
                        <span className="blood-group-chip text-[9px] px-1 py-0.2">{other.bloodGroup}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">
                      {conv.lastMessage?.text || 'Started conversation'}
                    </p>
                  </div>

                  {conv.unreadCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT: Chat Thread & Input ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-surface-container-lowest">
        {activeConv ? (
          <>
            {/* Header */}
            <div className="p-3.5 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest/80 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center font-bold text-primary text-xs">
                  {activeConv.recipient?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-on-surface">{activeConv.recipient?.name || 'User'}</span>
                    {activeConv.recipient?.bloodGroup && (
                      <span className="blood-group-chip text-[10px]">{activeConv.recipient.bloodGroup}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-on-surface-variant block">
                    {activeConv.recipient?.department || 'BAUST'} · {activeConv.recipient?.userType || 'Donor'}
                  </span>
                </div>
              </div>

              {/* Call Link if phone available */}
              {activeConv.recipient?.phone && (
                <a
                  href={`tel:${activeConv.recipient.phone}`}
                  className="btn-outline py-1 px-3 text-xs font-bold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">call</span>
                  <span>Call</span>
                </a>
              )}
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoadingMessages ? (
                <div className="text-center text-xs text-on-surface-variant py-4">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-xs text-on-surface-variant py-12">
                  Say hello! Coordinate blood donation or transfer details here.
                </div>
              ) : (
                messages.map((m) => {
                  const isMine =
                    (m.sender?._id || m.sender)?.toString() === currentUserId?.toString();
                  const isFailed = m.status === 'failed';
                  const isSending = m.status === 'sending';

                  return (
                    <div
                      key={m._id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs ${
                          isMine
                            ? isFailed
                              ? 'bg-red-50 border border-primary text-on-surface'
                              : 'bg-primary text-white shadow-sm'
                            : 'bg-surface-container border border-outline-variant/30 text-on-surface'
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-line">{m.text}</p>
                      </div>

                      {/* Delivery Status & Retry */}
                      <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-on-surface-variant">
                        <span>
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isMine && (
                          <>
                            {isSending && <span className="italic text-outline">Sending...</span>}
                            {m.status === 'sent' && (
                              <span className="material-symbols-outlined text-[12px] text-primary">done</span>
                            )}
                            {m.status === 'read' && (
                              <span className="material-symbols-outlined text-[12px] text-primary">done_all</span>
                            )}
                            {isFailed && (
                              <div className="flex items-center gap-1 text-primary font-bold">
                                <span>Failed to send.</span>
                                <button
                                  type="button"
                                  onClick={() => handleSendMessage(m.text, m._id)}
                                  className="underline hover:text-red-700"
                                >
                                  Retry
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-3 border-t border-outline-variant/30 bg-surface-container-lowest/80">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="input-field py-2 text-xs flex-1"
                  maxLength={1000}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>Send</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-on-surface-variant">
            <span className="material-symbols-outlined text-[48px] text-outline mb-2">forum</span>
            <p className="text-sm font-semibold">Select a conversation to start messaging</p>
            <p className="text-xs text-on-surface-variant mt-1">
              Direct chat lets you coordinate patient bed location, arrival times, and donation confirmation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MessengerView;
