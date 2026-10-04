"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  User,
  Car,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Check,
  CheckCheck,
  ArrowLeft,
  Search,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/lib/api";
import { Conversation, ConversationDetail, Message } from "@/types";
import { HonorScoreBadge } from "@/components/ui/HonorScoreBadge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

function ChatContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeConvIdRef = useRef<number | null>(null);

  useEffect(() => {
    activeConvIdRef.current = activeConversation ? activeConversation.id : null;
  }, [activeConversation]);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initial load & URL params handling
  useEffect(() => {
    if (!user) return;

    const initChat = async () => {
      setLoading(true);
      try {
        const convList = await apiService.getConversations();
        setConversations(convList);

        const targetUserId = searchParams.get("user_id");
        const targetBookingId = searchParams.get("booking_id");
        const targetConvId = searchParams.get("conversation_id");

        if (targetConvId) {
          const detail = await apiService.getConversation(Number(targetConvId));
          setActiveConversation(detail);
          setMessages(detail.messages || []);
          await apiService.markConversationRead(Number(targetConvId));
        } else if (targetUserId) {
          const detail = await apiService.createConversation({
            recipient_id: Number(targetUserId),
            booking_id: targetBookingId ? Number(targetBookingId) : undefined,
          });
          setActiveConversation(detail);
          setMessages(detail.messages || []);
          await apiService.markConversationRead(detail.id);
        } else if (convList.length > 0) {
          const first = convList[0];
          const detail = await apiService.getConversation(first.id);
          setActiveConversation(detail);
          setMessages(detail.messages || []);
          await apiService.markConversationRead(first.id);
        }
      } catch (err) {
        console.error("Failed to load conversations:", err);
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [user, searchParams]);

  // Polling for active conversation messages (every 3 seconds)
  useEffect(() => {
    if (!user || !activeConversation) return;

    const pollMessages = async () => {
      try {
        const convId = activeConversation.id;
        const latestMsgs = await apiService.getConversationMessages(convId);
        setMessages(latestMsgs);

        // Mark as read if any incoming messages are unread
        const hasUnread = latestMsgs.some((m) => m.sender_id !== user.id && !m.is_read);
        if (hasUnread) {
          await apiService.markConversationRead(convId);
        }
      } catch (err) {
        // Silently catch polling errors
      }
    };

    const interval = setInterval(pollMessages, 3000);
    return () => clearInterval(interval);
  }, [user, activeConversation]);

  // Polling for conversations list (every 5 seconds)
  useEffect(() => {
    if (!user) return;

    const pollConversations = async () => {
      try {
        const list = await apiService.getConversations();
        setConversations(list);
      } catch (err) {}
    };

    const interval = setInterval(pollConversations, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectConversation = async (conv: Conversation) => {
    try {
      const detail = await apiService.getConversation(conv.id);
      setActiveConversation(detail);
      setMessages(detail.messages || []);
      await apiService.markConversationRead(conv.id);

      // Update local unread counter in list
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
      );
    } catch (err) {
      console.error("Failed to select conversation:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || sending) return;

    const textToSend = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      const sent = await apiService.sendMessage(activeConversation.id, textToSend);
      setMessages((prev) => [...prev, sent]);

      // Update conversation list preview
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? { ...c, last_message: sent, updated_at: new Date().toISOString() }
            : c
        )
      );
    } catch (err) {
      console.error("Failed to send message:", err);
      setNewMessage(textToSend);
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-subtle h-[600px] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-gray-600">Loading your conversations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4 space-y-4">
        <MessageSquare className="w-12 h-12 text-blue-600 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">Sign in to use Messages</h2>
        <p className="text-xs text-gray-500">You need an active account to chat with owners and renters.</p>
        <Link href="/login">
          <Button variant="primary">Sign In</Button>
        </Link>
      </div>
    );
  }

  const otherUser = activeConversation
    ? activeConversation.user1_id === user.id
      ? activeConversation.user2
      : activeConversation.user1
    : null;

  const filteredConversations = conversations.filter((c) => {
    const other = c.user1_id === user.id ? c.user2 : c.user1;
    return other?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm overflow-hidden flex flex-col md:flex-row h-[780px]">
        {/* Left Sidebar: Conversations List */}
        <div className="w-full md:w-80 lg:w-96 border-r border-gray-200/80 flex flex-col bg-gray-50/40">
          {/* Header */}
          <div className="p-4 border-b border-gray-200/80 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Messages
              </h1>
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {conversations.length} chats
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-100/80 hover:bg-gray-100 focus:bg-white border border-transparent focus:border-blue-500 rounded-xl outline-none transition-colors"
              />
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-2">
                <MessageSquare className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-xs font-bold text-gray-600">No conversations found</p>
                <p className="text-[11px] text-gray-400">
                  {searchTerm ? "No results matching your search" : "Your active booking chats will appear here"}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const partner = conv.user1_id === user.id ? conv.user2 : conv.user1;
                const isSelected = activeConversation?.id === conv.id;

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-50/70 border-l-4 border-blue-600"
                        : "hover:bg-gray-100/60 bg-white"
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={partner?.profile_picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80"}
                        alt={partner?.full_name || "User"}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
                      />
                      {conv.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white font-bold text-[9px] rounded-full flex items-center justify-center ring-2 ring-white">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-900 truncate">
                          {partner?.full_name || "RideSync User"}
                        </span>
                        {conv.last_message && (
                          <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">
                            {formatDate(conv.last_message.created_at)}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {conv.last_message
                          ? conv.last_message.content
                          : "No messages yet — start the chat"}
                      </p>

                      {conv.booking_id && (
                        <span className="inline-block mt-1 text-[9px] font-semibold text-blue-700 bg-blue-100/60 px-1.5 py-0.2 rounded">
                          Trip #{conv.booking_id}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Chat Window */}
        {activeConversation && otherUser ? (
          <div className="flex-1 flex flex-col bg-white">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200/80 flex items-center justify-between bg-white/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <img
                  src={otherUser.profile_picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80"}
                  alt={otherUser.full_name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-600/20"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-sm text-gray-900">{otherUser.full_name}</h2>
                    <HonorScoreBadge score={otherUser.honor_score} showIcon={false} />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                    {activeConversation.booking_id ? (
                      <span className="text-blue-600 font-medium">Rental Booking #{activeConversation.booking_id}</span>
                    ) : (
                      <span>Direct Message</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/reports?reported_user_id=${otherUser.id}`}>
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-rose-600 gap-1 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Report
                  </Button>
                </Link>
                <Link href={`/profile`}>
                  <Button variant="outline" size="sm" className="gap-1 text-xs">
                    <User className="w-3.5 h-3.5" />
                    Profile
                  </Button>
                </Link>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/20">
              {messages.length === 0 ? (
                <div className="text-center py-24 space-y-2">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800">Start the Conversation</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Say hello to {otherUser.full_name} to coordinate vehicle pickup, schedule check-ins, or ask rental details.
                  </p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMine = m.sender_id === user.id;

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[78%] sm:max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-xs ${
                          isMine
                            ? "bg-blue-600 text-white rounded-br-xs"
                            : "bg-white text-gray-900 border border-gray-200/80 rounded-bl-xs"
                        }`}
                      >
                        {m.content}
                      </div>

                      <div className="flex items-center gap-1 mt-1 px-1">
                        <span className="text-[10px] text-gray-400">
                          {formatDate(m.created_at)}
                        </span>
                        {isMine && (
                          m.is_read ? (
                            <span title="Read"><CheckCheck className="w-3 h-3 text-blue-500" /></span>
                          ) : (
                            <span title="Sent"><Check className="w-3 h-3 text-gray-400" /></span>
                          )
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200/80 bg-white flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message ${otherUser.full_name}...`}
                className="flex-1 py-2.5 px-4 text-xs bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-2xl outline-none transition-all"
                disabled={sending}
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="rounded-2xl px-4 gap-1.5 h-10"
                disabled={!newMessage.trim() || sending}
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send</span>
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/20">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-sm">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Your Chat Space</h3>
            <p className="text-xs text-gray-500 max-w-sm mt-1">
              Select a conversation from the sidebar or click "Contact Host" on any vehicle listing to start messaging.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-12 text-center text-sm text-gray-500">
          Loading Chat...
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
