'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft,
  Send,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  MessageSquare,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  role?: string;
  is_admin?: boolean;
}

interface DisputeMessage {
  id: string;
  message: string;
  is_admin_note: boolean;
  attachments?: any[];
  created_at: string;
  sender: Profile & { is_admin?: boolean };
}

interface DisputeDetail {
  id: string;
  dispute_type: string;
  reason: string;
  amount_disputed: number | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
  resolution_type: string | null;
  resolution_details: string | null;
  opened_by: string;
  currentUserRole: 'client' | 'freelancer' | 'admin';
  clientProfileId: string;
  freelancerProfileId: string;
  clientProfile: Profile | null;
  freelancerProfile: Profile | null;
  opened_by_profile: Profile | null;
  contract: {
    id: string;
    title: string;
    total_amount: number;
    status: string;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  open:         { label: 'Open',         className: 'bg-yellow-100 text-yellow-800' },
  under_review: { label: 'Under Review', className: 'bg-blue-100 text-blue-800' },
  resolved:     { label: 'Resolved',     className: 'bg-green-100 text-green-800' },
  closed:       { label: 'Closed',       className: 'bg-gray-100 text-gray-700' },
};

function roleLabel(role: string | undefined, isAdmin?: boolean) {
  if (isAdmin) return 'Admin';
  if (role === 'client') return 'Client';
  if (role === 'freelancer') return 'Freelancer';
  return 'User';
}

function bubbleStyle(role: 'client' | 'freelancer' | 'admin' | string, isSelf: boolean) {
  if (role === 'admin') {
    return 'bg-purple-600 text-white';
  }
  if (isSelf) {
    return 'bg-blue-600 text-white';
  }
  return 'bg-white border border-gray-200 text-gray-900';
}

function avatarBg(role: string | undefined, isAdmin?: boolean) {
  if (isAdmin || role === 'admin') return 'bg-purple-600';
  if (role === 'client') return 'bg-blue-600';
  return 'bg-emerald-600';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DisputeThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: disputeId } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [messages, setMessages] = useState<DisputeMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [text, setText] = useState('');
  const [isAdminNote, setIsAdminNote] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchAll();

    // Poll every 8 s for new messages
    pollRef.current = setInterval(fetchMessages, 8000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, disputeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchAll() {
    setLoading(true);
    await Promise.all([fetchDispute(), fetchMessages()]);
    setLoading(false);
  }

  async function fetchDispute() {
    try {
      const res = await fetch(`/api/disputes/${disputeId}`, { credentials: 'include' });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Failed to load dispute');
        router.push('/contracts');
        return;
      }
      const data = await res.json();
      setDispute(data.dispute);
    } catch {
      toast.error('Failed to load dispute');
    }
  }

  async function fetchMessages() {
    try {
      const res = await fetch(`/api/disputes/${disputeId}/messages`, { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      // silently ignore polling errors
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchMessages();
    setRefreshing(false);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/disputes/${disputeId}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), is_admin_note: isAdminNote }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Failed to send');
        return;
      }

      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      setText('');
      setIsAdminNote(false);
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!dispute) return null;

  const isAdmin     = dispute.currentUserRole === 'admin';
  const isClosed    = dispute.status === 'resolved' || dispute.status === 'closed';
  const statusCfg   = STATUS_CONFIG[dispute.status] ?? STATUS_CONFIG.closed;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Shield className="h-5 w-5 text-red-500 shrink-0" />
              <h1 className="font-semibold text-gray-900 truncate">
                Dispute: {dispute.contract?.title ?? 'Contract'}
              </h1>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusCfg.className}`}>
                {statusCfg.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {dispute.dispute_type.replace(/_/g, ' ')} •{' '}
              {new Date(dispute.created_at).toLocaleDateString()}
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-5 w-5 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 flex flex-col gap-4">

        {/* Dispute Info Card */}
        <DisputeInfoCard dispute={dispute} isAdmin={isAdmin} />

        {/* Party Avatars */}
        <PartyBar dispute={dispute} />

        {/* Messages */}
        <div className="flex-1 bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Dispute Thread</span>
            </div>
            <span className="text-xs text-gray-400">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[320px] max-h-[480px]">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No messages yet. Start the conversation.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  currentUserId={user?.id ?? ''}
                  dispute={dispute}
                />
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Compose */}
          {!isClosed ? (
            <form onSubmit={handleSend} className="border-t p-4 bg-gray-50 rounded-b-2xl">
              {isAdmin && (
                <label className="flex items-center gap-2 text-xs text-purple-700 mb-2 cursor-pointer select-none w-fit">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={isAdminNote}
                    onChange={(e) => setIsAdminNote(e.target.checked)}
                  />
                  <Lock className="h-3 w-3" />
                  Internal admin note (hidden from parties)
                </label>
              )}
              <div className="flex gap-2">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (text.trim()) handleSend(e as any);
                    }
                  }}
                  placeholder={
                    isAdminNote
                      ? 'Internal note — only visible to admins…'
                      : 'Type your message… (Enter to send, Shift+Enter for new line)'
                  }
                  rows={2}
                  className={`flex-1 resize-none rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    isAdminNote
                      ? 'border-purple-300 bg-purple-50 focus:ring-purple-400'
                      : 'border-gray-300 bg-white focus:ring-blue-400'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!text.trim() || sending}
                  className={`self-end px-4 py-2 rounded-xl text-white font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition ${
                    isAdminNote ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {sending ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {sending ? '' : 'Send'}
                </button>
              </div>
            </form>
          ) : (
            <div className="border-t p-4 bg-green-50 rounded-b-2xl text-center">
              <CheckCircle className="h-5 w-5 text-green-600 inline mr-1 mb-0.5" />
              <span className="text-sm text-green-700 font-medium">
                This dispute is {dispute.status}. The thread is now read-only.
              </span>
              {dispute.resolution_details && (
                <p className="text-xs text-green-600 mt-1">Resolution: {dispute.resolution_details}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DisputeInfoCard({ dispute, isAdmin }: { dispute: DisputeDetail; isAdmin: boolean }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 mb-1">Dispute Reason</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{dispute.reason}</p>

          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
            <span>
              Type: <strong className="text-gray-700">{dispute.dispute_type.replace(/_/g, ' ')}</strong>
            </span>
            {dispute.amount_disputed != null && (
              <span>
                Amount disputed:{' '}
                <strong className="text-red-600">${dispute.amount_disputed.toLocaleString()}</strong>
              </span>
            )}
            <span>
              Contract amount:{' '}
              <strong className="text-gray-700">${dispute.contract?.total_amount?.toLocaleString()}</strong>
            </span>
            {dispute.resolved_at && (
              <span>
                Resolved: <strong className="text-green-700">{new Date(dispute.resolved_at).toLocaleDateString()}</strong>
              </span>
            )}
          </div>

          {dispute.resolution_details && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              <strong>Resolution:</strong> {dispute.resolution_details}
            </div>
          )}
        </div>

        <a
          href={`/contracts/${dispute.contract?.id}`}
          className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
        >
          View Contract →
        </a>
      </div>
    </div>
  );
}

function PartyBar({ dispute }: { dispute: DisputeDetail }) {
  const parties = [
    {
      label: 'Client',
      profile: dispute.clientProfile,
      role: 'client',
    },
    {
      label: 'Freelancer',
      profile: dispute.freelancerProfile,
      role: 'freelancer',
    },
    {
      label: 'Admin',
      profile: null,
      role: 'admin',
    },
  ];

  return (
    <div className="flex gap-3 bg-white rounded-2xl border shadow-sm p-4">
      {parties.map(({ label, profile, role }) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${avatarBg(role)}`}
          >
            {role === 'admin' ? (
              <Shield className="h-4 w-4" />
            ) : profile?.full_name ? (
              profile.full_name.charAt(0).toUpperCase()
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-900">
              {role === 'admin' ? 'Neplancer Admin' : profile?.full_name ?? 'Unknown'}
            </p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
          {parties.indexOf({ label, profile, role } as any) < 2 && (
            <span className="text-gray-300 text-lg mx-1">·</span>
          )}
        </div>
      ))}
    </div>
  );
}

function MessageBubble({
  msg,
  currentUserId,
  dispute,
}: {
  msg: DisputeMessage;
  currentUserId: string;
  dispute: DisputeDetail;
}) {
  const isSelf   = msg.sender.id === currentUserId;
  const isAdmin  = !!msg.sender.is_admin;
  const senderRole = isAdmin ? 'admin' : msg.sender.role ?? 'client';

  const align = isSelf ? 'items-end' : 'items-start';

  const bubble = bubbleStyle(senderRole, isSelf);
  const avatar  = avatarBg(senderRole, isAdmin);

  const initial = msg.sender.full_name?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <div className={`flex flex-col gap-1 ${align}`}>
      {/* sender label */}
      <div className={`flex items-center gap-1.5 text-xs text-gray-500 ${isSelf ? 'flex-row-reverse' : ''}`}>
        <div
          className={`h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatar}`}
        >
          {isAdmin ? <Shield className="h-3 w-3" /> : initial}
        </div>
        <span className="font-medium text-gray-700">
          {msg.sender.full_name}
        </span>
        <span>·</span>
        <span>{roleLabel(msg.sender.role, isAdmin)}</span>
        {msg.is_admin_note && (
          <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full">
            <Lock className="h-2.5 w-2.5" />
            Internal
          </span>
        )}
      </div>

      {/* bubble */}
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words shadow-sm ${bubble} ${
          msg.is_admin_note ? 'ring-2 ring-purple-300 ring-offset-1' : ''
        } ${isSelf ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
      >
        {msg.message}
      </div>

      {/* timestamp */}
      <span className={`text-xs text-gray-400 ${isSelf ? 'text-right' : ''}`}>
        <Clock className="h-3 w-3 inline mr-0.5" />
        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        {' · '}
        {new Date(msg.created_at).toLocaleDateString()}
      </span>
    </div>
  );
}
