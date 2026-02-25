'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Send, Loader2, Check, CheckCheck, FileText, Clock, DollarSign, CheckCircle, XCircle, Briefcase, FileSignature, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

interface ProposalData {
  isProposal: boolean;
  proposalId?: string;
  jobTitle?: string;
  budget?: string;
  duration?: string;
  coverLetter?: string;
  status?: 'pending' | 'accepted' | 'rejected';
}

interface ContractData {
  isContract: boolean;
  contractId?: string;
  title?: string;
  type?: string;
  amount?: string;
  hourlyRate?: string;
  estimatedHours?: string;
  summary?: string;
}

interface ChatBoxProps {
  conversationId: string;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  jobId?: string;
  isOnline?: boolean;
}

export default function ChatBox({
  conversationId: initialConversationId,
  recipientId,
  recipientName,
  recipientAvatar,
  jobId,
  isOnline = false,
}: ChatBoxProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [processingProposal, setProcessingProposal] = useState<string | null>(null);
  const [showContractOptions, setShowContractOptions] = useState<string | null>(null);
  const [rejectedProposals, setRejectedProposals] = useState<Set<string>>(new Set());
  const [acceptedProposals, setAcceptedProposals] = useState<Set<string>>(new Set());
  const [declineConfirmId, setDeclineConfirmId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Parse proposal message to extract data
  const parseProposalMessage = (content: string): ProposalData => {
    if (!content.includes('📝 **New Proposal Submitted**')) {
      return { isProposal: false };
    }

    const proposalIdMatch = content.match(/View full proposal: \/client\/proposals\/([a-f0-9-]+)/);
    const jobTitleMatch = content.match(/job: \*\*(.+?)\*\*/);
    const budgetMatch = content.match(/\*\*Proposed Budget:\*\* \$([\d,]+)/);
    const durationMatch = content.match(/\*\*Estimated Duration:\*\* (.+?)\n/);
    const coverLetterMatch = content.match(/\*\*Cover Letter:\*\*[\s\S]*?([\s\S]+?)\n\nView full proposal:/);

    return {
      isProposal: true,
      proposalId: proposalIdMatch?.[1],
      jobTitle: jobTitleMatch?.[1],
      budget: budgetMatch?.[1],
      duration: durationMatch?.[1],
      coverLetter: coverLetterMatch?.[1],
    };
  };

  // Parse contract message to extract data
  const parseContractMessage = (content: string): ContractData => {
    if (!content.includes('📄 **New Contract:')) {
      return { isContract: false };
    }

    const contractIdMatch = content.match(/\[View Full Contract & Sign\]\(\/contracts\/([a-f0-9-]+)\)/);
    const titleMatch = content.match(/📄 \*\*New Contract: (.+?)\*\*/);
    const typeMatch = content.match(/💼 \*\*Type:\*\* (.+?)\n/);
    const amountMatch = content.match(/💰 \*\*Amount:\*\* \$([\d,]+)/);
    const hourlyRateMatch = content.match(/⏱️ \*\*Hourly Rate:\*\* \$([\d,]+)\/hr/);
    const hoursMatch = content.match(/📅 \*\*Estimated Hours:\*\* ([\d]+) hrs/);
    const summaryMatch = content.match(/📋 \*\*Summary:\*\* (.+?)(?:\n\n|$)/s);

    return {
      isContract: true,
      contractId: contractIdMatch?.[1],
      title: titleMatch?.[1],
      type: typeMatch?.[1],
      amount: amountMatch?.[1],
      hourlyRate: hourlyRateMatch?.[1],
      estimatedHours: hoursMatch?.[1],
      summary: summaryMatch?.[1]?.trim(),
    };
  };

  // Handle proposal approval
  const handleApproveProposal = async (proposalId: string) => {
    setShowContractOptions(proposalId);
    setAcceptedProposals(prev => new Set(prev).add(proposalId));
  };

  // Handle proposal rejection - open confirmation modal
  const handleRejectProposal = (proposalId: string) => {
    setDeclineConfirmId(proposalId);
  };

  // Actual rejection after user confirms in modal
  const confirmRejectProposal = async () => {
    const proposalId = declineConfirmId;
    if (!proposalId) return;
    setDeclineConfirmId(null);
    setProcessingProposal(proposalId);
    try {
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject proposal');
      }

      toast.success('Proposal declined.');
      setRejectedProposals(prev => new Set(prev).add(proposalId));
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      toast.error('Failed to reject proposal');
    } finally {
      setProcessingProposal(null);
    }
  };

  // Handle contract creation
  const handleCreateContract = (proposalId: string, type: 'quick' | 'custom') => {
    if (type === 'quick') {
      // Quick contract with default terms
      router.push(`/client/contracts/create?proposal=${proposalId}&type=quick`);
    } else {
      // Custom contract with detailed options
      router.push(`/client/contracts/create?proposal=${proposalId}&type=custom`);
    }
  };

  // Send system message
  const sendSystemMessage = async (content: string) => {
    if (!conversationId || !user) return;

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          content,
          senderId: user.id,
        }),
      });
    } catch (error) {
      console.error('Error sending system message:', error);
    }
  };

  // Update conversation ID when prop changes (when switching conversations)
  useEffect(() => {
    if (initialConversationId !== conversationId) {
      setConversationId(initialConversationId);
      setMessages([]); // Clear old messages
      setLoading(true); // Show loading state
    }
  }, [initialConversationId, conversationId]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages
  const fetchMessages = async () => {
    if (!conversationId) return;

    try {
      const response = await fetch(`/api/messages?conversationId=${conversationId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch messages');
      }

      setMessages(data.messages || []);
      
      // Mark messages as read
      await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    if (!user) {
      toast.error('You must be logged in to send messages');
      return;
    }

    setSending(true);

    try {
      const payload: {
        content: string;
        conversationId?: string;
        recipient_id?: string;
        job_id?: string;
      } = {
        content: newMessage.trim(),
      };

      if (conversationId) {
        payload.conversationId = conversationId;
      } else {
        payload.recipient_id = recipientId;
        if (jobId) {
          payload.job_id = jobId;
        }
      }

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // If we didn't have a conversation ID, set it now
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
      }

      setNewMessage('');
      
      // Add message optimistically to UI
      if (data.message) {
        setMessages(prev => [...prev, {
          ...data.message,
          sender: {
            id: user.id,
            full_name: user.fullName || 'You',
            avatar_url: user.avatarUrl || '',
          }
        }]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      console.error('Error sending message:', error);
      toast.error(errorMessage);
    } finally {
      setSending(false);
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    fetchMessages();

    // Subscribe to new messages and updates
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          
          // Don't add if it's from current user (already added optimistically)
          if (newMsg.sender_id !== user?.id) {
            // Fetch sender details
            const { data: senderData } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .eq('id', newMsg.sender_id)
              .single();

            setMessages(prev => [...prev, {
              ...newMsg,
              sender: senderData ? {
                ...senderData,
                avatar_url: senderData.avatar_url || ''
              } : undefined,
            }]);

            // Automatically mark as read since user is viewing this conversation
            await fetch('/api/messages', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ conversationId }),
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Update message read status in real-time
          const updatedMsg = payload.new as Message;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === updatedMsg.id 
                ? { ...msg, read: updatedMsg.read } 
                : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, user?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    // Use setTimeout to ensure DOM has updated before scrolling
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [messages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white shadow-sm">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative flex-shrink-0">
            {recipientAvatar ? (
              <Image
                src={recipientAvatar}
                alt={recipientName}
                width={40}
                height={40}
                className="h-9 w-9 md:h-10 md:w-10 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
            ) : (
              <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-white shadow-sm">
                <span className="text-primary font-bold text-sm md:text-base">
                  {recipientName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {/* Online Status Indicator */}
            {isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm"></span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm md:text-base truncate">{recipientName}</h3>
            <p className="text-[10px] md:text-xs text-gray-500">
              {isOnline ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  Active now
                </span>
              ) : (
                'Offline'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-4 lg:p-6 space-y-3 md:space-y-4 bg-gradient-to-b from-gray-50/30 to-white"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary/10 to-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 md:h-10 md:w-10 text-primary" />
              </div>
              <p className="text-gray-600 font-medium mb-1">No messages yet</p>
              <p className="text-xs md:text-sm text-gray-400">
                Start the conversation by sending a message
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              const messageDate = new Date(message.created_at);
              const timeString = messageDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              });

              const proposalData = parseProposalMessage(message.content);
              const contractData = parseContractMessage(message.content);

              // Render contract message with special UI
              if (contractData.isContract) {
                return (
                  <div key={message.id} className="w-full">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6 shadow-md">
                      {/* Contract Header */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className="p-2 bg-emerald-500 rounded-lg">
                          <FileSignature className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 mb-1">
                            🎉 New Contract Received!
                          </h3>
                          <p className="text-sm text-gray-600">
                            {isOwn ? 'You' : message.sender?.full_name || 'Client'} sent you a contract
                          </p>
                        </div>
                      </div>

                      {/* Contract Title */}
                      {contractData.title && (
                        <div className="mb-4 p-3 bg-white rounded-lg border border-emerald-100">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Briefcase className="h-4 w-4 text-emerald-500" />
                            <span className="font-bold text-base">{contractData.title}</span>
                          </div>
                        </div>
                      )}

                      {/* Contract Details */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {contractData.type && (
                          <div className="p-3 bg-white rounded-lg border border-emerald-100">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <span className="text-xs font-semibold text-gray-600">Type</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900">
                              {contractData.type}
                            </p>
                          </div>
                        )}
                        {contractData.amount && (
                          <div className="p-3 bg-white rounded-lg border border-emerald-100">
                            <div className="flex items-center gap-2 mb-1">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="text-xs font-semibold text-gray-600">Amount</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900">
                              ${contractData.amount}
                            </p>
                          </div>
                        )}
                        {contractData.hourlyRate && (
                          <div className="p-3 bg-white rounded-lg border border-emerald-100">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <span className="text-xs font-semibold text-gray-600">Hourly Rate</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900">
                              ${contractData.hourlyRate}/hr
                            </p>
                          </div>
                        )}
                        {contractData.estimatedHours && (
                          <div className="p-3 bg-white rounded-lg border border-emerald-100">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="h-4 w-4 text-orange-600" />
                              <span className="text-xs font-semibold text-gray-600">Est. Hours</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900">
                              {contractData.estimatedHours} hrs
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Summary */}
                      {contractData.summary && (
                        <div className="mb-4 p-4 bg-white rounded-lg border border-emerald-100">
                          <p className="text-xs font-semibold text-gray-600 mb-2">📋 Summary</p>
                          <p className="text-sm text-gray-700">
                            {contractData.summary}
                          </p>
                        </div>
                      )}

                      {/* View Contract Button */}
                      {contractData.contractId && (
                        <button
                          onClick={() => router.push(`/contracts/${contractData.contractId}`)}
                          className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                        >
                          <FileSignature className="h-5 w-5" />
                          <span>View Contract & Sign</span>
                        </button>
                      )}

                      {/* Timestamp */}
                      <div className="mt-4 pt-3 border-t border-emerald-200">
                        <p className="text-xs text-gray-500">{timeString}</p>
                      </div>
                    </div>
                  </div>
                );
              }

              // Render proposal message with special UI
              if (proposalData.isProposal && !isOwn) {
                return (
                  <div key={message.id} className="w-full">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-md">
                      {/* Proposal Header */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className="p-2 bg-blue-500 rounded-lg">
                          <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 mb-1">
                            New Proposal Received
                          </h3>
                          <p className="text-sm text-gray-600">
                            {message.sender?.full_name || 'Freelancer'} wants to work on your project
                          </p>
                        </div>
                      </div>

                      {/* Job Title */}
                      {proposalData.jobTitle && (
                        <div className="mb-4 p-3 bg-white rounded-lg border border-blue-100">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Briefcase className="h-4 w-4 text-blue-500" />
                            <span className="font-semibold text-sm">Project:</span>
                            <span className="text-sm">{proposalData.jobTitle}</span>
                          </div>
                        </div>
                      )}

                      {/* Proposal Details */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {proposalData.budget && (
                          <div className="p-3 bg-white rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2 mb-1">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="text-xs font-semibold text-gray-600">Budget</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900">
                              ${proposalData.budget}
                            </p>
                          </div>
                        )}
                        {proposalData.duration && (
                          <div className="p-3 bg-white rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <span className="text-xs font-semibold text-gray-600">Duration</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900">
                              {proposalData.duration}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Cover Letter Preview */}
                      {proposalData.coverLetter && (
                        <div className="mb-4 p-4 bg-white rounded-lg border border-blue-100">
                          <p className="text-xs font-semibold text-gray-600 mb-2">Cover Letter</p>
                          <p className="text-sm text-gray-700 line-clamp-3 break-words overflow-hidden">
                            {proposalData.coverLetter}
                          </p>
                        </div>
                      )}

                      {/* Declined Badge */}
                      {rejectedProposals.has(proposalData.proposalId!) && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
                          <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                          <span className="text-sm font-semibold text-red-700">Proposal Declined</span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {!rejectedProposals.has(proposalData.proposalId!) && showContractOptions === proposalData.proposalId ? (
                        <div className="space-y-3">
                          <div className="p-4 bg-blue-100 rounded-lg border-2 border-blue-300">
                            <div className="flex items-center gap-2 mb-3">
                              <FileSignature className="h-5 w-5 text-blue-600" />
                              <h4 className="font-bold text-gray-900">Choose Contract Type</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* Quick Contract Option */}
                              <button
                                onClick={() => handleCreateContract(proposalData.proposalId!, 'quick')}
                                className="p-4 bg-white border-2 border-blue-300 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group text-left"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-500 transition-colors">
                                    <CheckCircle className="h-5 w-5 text-blue-600 group-hover:text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="font-bold text-gray-900 mb-1">Quick Contract</h5>
                                    <p className="text-xs text-gray-600">
                                      Use proposal terms with standard agreement
                                    </p>
                                    <p className="text-xs text-blue-600 mt-1 font-semibold">
                                      ⚡ Faster setup
                                    </p>
                                  </div>
                                </div>
                              </button>

                              {/* Custom Contract Option */}
                              <button
                                onClick={() => handleCreateContract(proposalData.proposalId!, 'custom')}
                                className="p-4 bg-white border-2 border-blue-300 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group text-left"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-500 transition-colors">
                                    <FileSignature className="h-5 w-5 text-purple-600 group-hover:text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="font-bold text-gray-900 mb-1">Custom Contract</h5>
                                    <p className="text-xs text-gray-600">
                                      Set milestones, payment terms & details
                                    </p>
                                    <p className="text-xs text-purple-600 mt-1 font-semibold">
                                      🎯 More control
                                    </p>
                                  </div>
                                </div>
                              </button>
                            </div>
                            <button
                              onClick={() => setShowContractOptions(null)}
                              className="mt-3 w-full py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* View Full Proposal Button */}
                          {proposalData.proposalId && (
                            <button
                              onClick={() => router.push(`/client/proposals/${proposalData.proposalId}`)}
                              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                            >
                              <FileText className="h-5 w-5" />
                              <span>View Full Proposal Details</span>
                            </button>
                          )}
                          
                          {/* Action Buttons */}
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleApproveProposal(proposalData.proposalId!)}
                              disabled={processingProposal === proposalData.proposalId}
                              className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                            >
                              {processingProposal === proposalData.proposalId ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-5 w-5" />
                                  <span>Accept</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleRejectProposal(proposalData.proposalId!)}
                              disabled={processingProposal === proposalData.proposalId}
                              className="py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                            >
                              {processingProposal === proposalData.proposalId ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="h-5 w-5" />
                                  <span>Decline</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="mt-4 pt-3 border-t border-blue-200">
                        <p className="text-xs text-gray-500">{timeString}</p>
                      </div>
                    </div>
                  </div>
                );
              }

              // Regular message
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[70%] ${
                      isOwn
                        ? 'bg-gradient-to-br from-primary to-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-900 shadow-sm border border-gray-100'
                    } rounded-2xl px-3 md:px-4 py-2 md:py-2.5`}
                  >
                    {!isOwn && message.sender && (
                      <p className="text-[10px] md:text-xs font-semibold mb-1 text-gray-600">
                        {message.sender.full_name}
                      </p>
                    )}
                    <p className="text-xs md:text-sm whitespace-pre-wrap break-words leading-relaxed">
                      {message.content}
                    </p>
                    <div
                      className={`flex items-center gap-1 mt-1.5 ${
                        isOwn ? 'text-white/80' : 'text-gray-400'
                      }`}
                    >
                      <span className="text-[10px] md:text-xs font-medium">{timeString}</span>
                      {isOwn && (
                        <span className="ml-1">
                          {message.read ? (
                            <CheckCheck className="h-3 w-3 text-blue-400" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="px-3 md:px-4 lg:px-6 py-3 md:py-4 border-t border-gray-200 bg-white shadow-sm">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 md:px-4 py-2.5 md:py-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 transition-all"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Send className="h-5 w-5" />
                <span className="hidden sm:inline">Send</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Decline Confirmation Modal */}
      {declineConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeclineConfirmId(null)}
          />
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Icon */}
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            {/* Text */}
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              Decline Proposal?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
              The freelancer will be notified and an email will be sent. This action cannot be undone.
            </p>
            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setDeclineConfirmId(null)}
                className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRejectProposal}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Yes, Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
