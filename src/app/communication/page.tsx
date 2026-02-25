'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {  
  Search, 
  ArrowLeft,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ChatBox from '@/components/ChatBox';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  job_id: string | null;
  updated_at: string;
  otherUser: {
    id: string;
    full_name: string;
    avatar_url: string;
    role: string;
  };
  lastMessage: {
    id: string;
    content: string;
    created_at: string;
    read: boolean;
    sender_id: string;
  } | null;
  unreadCount?: number;
}

export default function CommunicationPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Update document title with unread count
  useEffect(() => {
    const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
    if (totalUnread > 0) {
      document.title = `(${totalUnread}) Messages - Neplancer`;
    } else {
      document.title = 'Messages - Neplancer';
    }
  }, [conversations]);

  // Initial load
  useEffect(() => {
    if (!user) {
      return;
    }
    
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Handle URL param for conversation selection
  useEffect(() => {
    const paramId = searchParams.get('conversationId');
    if (paramId) {
      setSelectedConversationId(paramId);
    }
  }, [searchParams]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    // Track online presence
    const presenceChannel = supabase.channel('online_users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const onlineUserIds = new Set(
          Object.keys(state)
            .map((key) => (state[key][0] as { user_id?: string })?.user_id)
            .filter((id): id is string => Boolean(id))
        );
        setOnlineUsers(onlineUserIds);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const userId = (newPresences[0] as { user_id?: string })?.user_id;
        if (userId) {
          setOnlineUsers(prev => new Set([...prev, userId]));
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const userId = (leftPresences[0] as { user_id?: string })?.user_id;
        if (userId) {
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Subscribe to new messages and conversations
    const channel = supabase
      .channel('communication_list_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMsg = payload.new as {
            id: string;
            conversation_id: string;
            sender_id: string;
            content: string;
            created_at: string;
            read: boolean;
          };
          
          // Don't show notification for own messages
          const isOwnMessage = newMsg.sender_id === user.id;
          
          setConversations(prev => {
            // Check if we have this conversation
            const existingIndex = prev.findIndex(c => c.id === newMsg.conversation_id);
            
            if (existingIndex >= 0) {
              // Move to top and update last message
              const conversation = prev[existingIndex];
              const isCurrentConversation = conversation.id === selectedConversationId;
              
              // Show notification for new messages from others
              if (!isOwnMessage && !isCurrentConversation) {
                toast.info(`New message from ${conversation.otherUser?.full_name}`, {
                  description: newMsg.content.substring(0, 50) + (newMsg.content.length > 50 ? '...' : ''),
                  duration: 4000,
                });
                
                // Play notification sound (optional)
                if (typeof Audio !== 'undefined') {
                  try {
                    const audio = new Audio('/notification.mp3');
                    audio.volume = 0.3;
                    audio.play().catch(() => {/* Ignore errors */});
                  } catch {
                    // Ignore audio errors
                  }
                }
              }
              
              const updatedConversation = {
                ...conversation,
                lastMessage: {
                  id: newMsg.id,
                  content: newMsg.content,
                  created_at: newMsg.created_at,
                  read: newMsg.read,
                  sender_id: newMsg.sender_id,
                },
                updated_at: newMsg.created_at,
                // Increment unread count only if not own message and not viewing this conversation
                unreadCount: (!isOwnMessage && !isCurrentConversation) 
                  ? (conversation.unreadCount || 0) + 1 
                  : (isCurrentConversation ? 0 : conversation.unreadCount || 0),
              };
              
              const newConversations = [...prev];
              newConversations.splice(existingIndex, 1);
              return [updatedConversation, ...newConversations];
            } else {
              // New conversation - reload to get details
              if (!isOwnMessage) {
                toast.info('New conversation started', {
                  description: newMsg.content.substring(0, 50) + (newMsg.content.length > 50 ? '...' : ''),
                  duration: 4000,
                });
              }
              loadConversations();
              return prev;
            }
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          // Handle message read status updates
          const updatedMsg = payload.new as { id: string; conversation_id: string; read: boolean };
          setConversations(prev => 
            prev.map(conv => {
              if (conv.id === updatedMsg.conversation_id && 
                  conv.lastMessage?.id === updatedMsg.id && 
                  conv.lastMessage) {
                return {
                  ...conv,
                  lastMessage: {
                    id: conv.lastMessage.id,
                    content: conv.lastMessage.content,
                    created_at: conv.lastMessage.created_at,
                    sender_id: conv.lastMessage.sender_id,
                    read: updatedMsg.read,
                  },
                };
              }
              return conv;
            })
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          // New conversation created - reload
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      presenceChannel.unsubscribe();
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedConversationId]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/conversations');
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
        
        const paramId = searchParams.get('conversationId');
        if (!paramId && data.conversations?.length > 0 && !selectedConversationId) {
           // Optional: Auto-select first conversation
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true;
    return c.otherUser?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen md:h-[calc(100vh-64px)] bg-gray-100 flex overflow-hidden">
      {/* Sidebar - Conversation List */}
      <div className={`${
        selectedConversationId ? 'hidden md:flex' : 'flex'
      } w-full md:w-80 lg:w-96 flex-shrink-0 flex-col bg-white border-r border-gray-200 shadow-sm overflow-hidden`}>
        {/* Search Header */}
        <div className="p-3 md:p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Messages
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 md:h-5 md:w-5" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 md:pl-10 pr-4 py-2 md:py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => {
                  setSelectedConversationId(conversation.id);
                  // Reset unread count for this conversation
                  setConversations(prev =>
                    prev.map(c =>
                      c.id === conversation.id ? { ...c, unreadCount: 0 } : c
                    )
                  );
                  // Update URL without refresh
                  window.history.pushState({}, '', `/communication?conversationId=${conversation.id}`);
                }}
                className={`w-full p-3 md:p-4 flex items-start gap-2 md:gap-3 hover:bg-gray-50 transition-all duration-150 border-b border-gray-100 ${
                  selectedConversationId === conversation.id ? 'bg-blue-50 hover:bg-blue-50 border-l-4 border-l-primary' : ''
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-gray-200 relative ring-2 ring-white">
                    {conversation.otherUser?.avatar_url ? (
                      <Image
                        src={conversation.otherUser.avatar_url}
                        alt={conversation.otherUser.full_name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-base md:text-lg">
                        {conversation.otherUser?.full_name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  {/* Online Status Indicator */}
                  {onlineUsers.has(conversation.otherUser?.id) && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>
                  )}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-semibold text-sm md:text-base text-gray-900 truncate">
                      {conversation.otherUser?.full_name || 'Unknown User'}
                    </h3>
                    {conversation.lastMessage && (
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2 font-medium">
                        {formatTime(conversation.lastMessage.created_at)}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <p className={`text-xs md:text-sm truncate flex-1 ${
                      conversation.lastMessage && !conversation.lastMessage.read && conversation.lastMessage.sender_id !== user?.id
                        ? 'font-bold text-gray-900' 
                        : 'text-gray-600'
                    }`}>
                      {conversation.lastMessage ? (
                        <>
                          {conversation.lastMessage.sender_id === user?.id && (
                            <span className="font-semibold text-gray-500">You: </span>
                          )}
                          {conversation.lastMessage.content}
                        </>
                      ) : (
                        <span className="text-gray-400 italic">Started a conversation</span>
                      )}
                    </p>
                    {conversation.unreadCount && conversation.unreadCount > 0 ? (
                      <span className="min-w-[18px] md:min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-primary to-blue-600 text-white text-[10px] md:text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                        {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                      </span>
                    ) : conversation.lastMessage && !conversation.lastMessage.read && conversation.lastMessage.sender_id !== user?.id ? (
                      <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                    ) : null}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 min-w-0 flex flex-col bg-white overflow-hidden ${
        !selectedConversationId ? 'hidden md:flex' : 'flex'
      }`}>
        {selectedConversation ? (
          <>
            {/* Mobile Header to go back */}
            <div className="md:hidden flex items-center gap-3 p-3 border-b bg-white shadow-sm sticky top-0 z-10">
              <button 
                onClick={() => setSelectedConversationId(null)}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 relative">
                  {selectedConversation.otherUser?.avatar_url ? (
                    <Image
                      src={selectedConversation.otherUser.avatar_url}
                      alt={selectedConversation.otherUser.full_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
                      {selectedConversation.otherUser?.full_name?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                {onlineUsers.has(selectedConversation.otherUser?.id) && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900 truncate text-sm">
                  {selectedConversation.otherUser?.full_name || 'Chat'}
                </h2>
                <p className="text-xs text-gray-500">
                  {onlineUsers.has(selectedConversation.otherUser?.id) ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
            
            <ChatBox
              conversationId={selectedConversation.id}
              recipientId={selectedConversation.otherUser?.id}
              recipientName={selectedConversation.otherUser?.full_name}
              recipientAvatar={selectedConversation.otherUser?.avatar_url}
              jobId={selectedConversation.job_id || undefined}
              isOnline={onlineUsers.has(selectedConversation.otherUser?.id)}
            />
          </>
        ) : (
          <div className="flex-1 flex-col items-center justify-center text-gray-400 p-8 hidden md:flex bg-gradient-to-br from-gray-50 to-white">
            <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-blue-50 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <MessageSquare className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Messages</h3>
            <p className="text-center max-w-sm text-gray-600 leading-relaxed">
              Select a conversation from the sidebar to start messaging with clients or freelancers.
            </p>
            <div className="mt-6 text-sm text-gray-500 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Real-time messaging enabled
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
