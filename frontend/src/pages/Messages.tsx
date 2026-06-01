import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import {
  Send,
  Search,
  ChevronLeft,
  Mail,
  Phone,
  MoreHorizontal,
  Paperclip,
  FileText,
  X,
  Image,
  File,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type MsgGroup = {
  senderId: number;
  isMine: boolean;
  msgs: any[];
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function Messages() {
  const { user } = useAuth();

  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict file type validation: Only images, photos (images), text, and document files
    const isImage = file.type.startsWith("image/");
    const isDocOrText = file.type === "text/plain" || 
                        file.type === "application/pdf" || 
                        file.type === "application/msword" || 
                        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (!isImage && !isDocOrText) {
      toast.error("Invalid file type. Only images, photos, text, and documents are attachable!");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      if (data.url) {
        setAttachmentUrl(data.url);
        setAttachmentName(file.name);
        const type = isImage ? "image" : "document";
        setAttachmentType(type);
        toast.success("Attachment uploaded successfully!");
      }
    } catch (err: any) {
      console.error("[Upload] Error:", err);
      toast.error("Failed to upload attachment: " + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAttachment = () => {
    setAttachmentUrl(null);
    setAttachmentType(null);
    setAttachmentName(null);
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();

  const {
    subscribeToMessages,
    onNewMessage,
    offNewMessage,
  } = useWebSocket();

  // ───────────────────────────────────────────────────────────
  // Queries
  // ───────────────────────────────────────────────────────────

  const {
    data: conversations = [],
    isLoading: isLoadingConv,
  } = trpc.messages.getConversations.useQuery(undefined, {
    enabled: !!user,
  });

  const {
    data: messages = [],
    isLoading: isLoadingMsgs,
  } = trpc.messages.getMessages.useQuery(
    selectedConversation?.partnerId,
    {
      enabled: !!selectedConversation?.partnerId,
      refetchOnWindowFocus: false,
    }
  );

  // ───────────────────────────────────────────────────────────
  // URL Preselect
  // ───────────────────────────────────────────────────────────

 useEffect(() => {
  const params = new URLSearchParams(window.location.search);

  const partnerIdParam = params.get("partnerId");

  if (!partnerIdParam) return;

  const partnerId = Number(partnerIdParam);

  if (!partnerId) return;

  const existing = conversations.find(
    (c: any) => c.partnerId === partnerId
  );

  setSelectedConversation(
    existing || {
      partnerId,
      partnerName:
        partnerId === 1
          ? "Sasto Support Desk"
          : `User #${partnerId}`,
      partnerAvatar: null,
      content: "",
      createdAt: new Date().toISOString(),
      isRead: true,
      isOnline: true,
    }
  );
}, [conversations, user]);

  // ───────────────────────────────────────────────────────────
  // WebSocket
  // ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user?.id) return;

    subscribeToMessages(user.id);

    const handler = (msg: any) => {
      console.log("[WebSocket] Received new-message event:", msg);
      console.log("[WebSocket] Selected conversation partnerId:", selectedConversation?.partnerId);
      console.log("[WebSocket] Current user id:", user?.id);

      utils.messages.getConversations.invalidate();

      const isPartnerMatch =
        selectedConversation?.partnerId === msg.senderId ||
        selectedConversation?.partnerId === msg.recipientId;

      console.log("[WebSocket] Partner match status:", isPartnerMatch);

      if (isPartnerMatch) {
        if (selectedConversation?.partnerId) {
          console.log("[WebSocket] Invalidating getMessages for partner:", selectedConversation.partnerId);
          utils.messages.getMessages.invalidate(selectedConversation.partnerId);
        }
      }

      // Play sound only for incoming messages
      if (msg.senderId !== user.id) {
        const audio = new Audio("/assets/notification.mp3");

        audio.play().catch(() => {});
      }
    };

    onNewMessage(handler);

    return () => {
      offNewMessage();
    };
  }, [
    user?.id,
    selectedConversation?.partnerId,
    onNewMessage,
    offNewMessage,
    subscribeToMessages,
  ]);

  // ───────────────────────────────────────────────────────────
  // Auto Scroll
  // ───────────────────────────────────────────────────────────

  const prevMessagesLength = useRef(messages.length);

  useEffect(() => {
    if (!scrollRef.current) return;

    const isNewMessage = messages.length > prevMessagesLength.current;
    prevMessagesLength.current = messages.length;

    // Use a small timeout to let the DOM paint the newly added message first
    const timer = setTimeout(() => {
      if (!scrollRef.current) return;
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: isNewMessage ? "smooth" : "auto",
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [messages]);

  // ───────────────────────────────────────────────────────────
  // Optimized Conversation Search
  // ───────────────────────────────────────────────────────────

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv: any) =>
      conv.partnerName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  // ───────────────────────────────────────────────────────────
  // Send Mutation
  // ───────────────────────────────────────────────────────────

  const sendMessageMutation = trpc.messages.send.useMutation();

  // ───────────────────────────────────────────────────────────
  // Send Handler
  // ───────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    if (
      (!messageInput.trim() && !attachmentUrl) ||
      !selectedConversation ||
      sendMessageMutation.isPending
    ) {
      return;
    }

    sendMessageMutation.mutate({
      recipientId: selectedConversation.partnerId,
      content: messageInput.trim() || (attachmentType === "image" ? "Sent a photo" : "Sent a file"),
      listingId: selectedConversation.listingId ?? undefined,
      attachmentUrl: attachmentUrl || undefined,
      attachmentType: attachmentType || undefined,
    }, {
      onSuccess: () => {
        setMessageInput("");
        handleRemoveAttachment();
        if (selectedConversation?.partnerId) {
          utils.messages.getMessages.invalidate(selectedConversation.partnerId);
        }
        utils.messages.getConversations.invalidate();
      },
      onError: (err: any) => {
        toast.error("Failed to send: " + err.message);
      },
    });
  }, [
    messageInput,
    selectedConversation,
    sendMessageMutation,
    attachmentUrl,
    attachmentType,
  ]);

  // ───────────────────────────────────────────────────────────
  // Not Logged In
  // ───────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-10 text-center shadow-xl rounded-2xl border-0">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-10 h-10 text-green-600" />
          </div>

          <p className="text-lg font-bold text-gray-800 mb-1">
            Sign in to view messages
          </p>

          <p className="text-sm text-gray-400">
            Your conversations are waiting.
          </p>
        </Card>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────
  // UI
  // ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container py-6 max-w-6xl mx-auto px-4">
        {/* Header */}

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Messages
          </h1>

          <div className="flex items-center gap-2 text-xs text-gray-500 bg-white px-3 py-1.5 rounded-full border shadow-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Real-time Connected
          </div>
        </div>

        {/* Shell */}

        <div className="grid grid-cols-1 lg:grid-cols-12 h-[calc(100vh-160px)] min-h-[500px] max-h-[750px] shadow-2xl rounded-3xl overflow-hidden border border-gray-200 bg-white">
          {/* Left Sidebar */}

          <div
            className={`lg:col-span-4 flex flex-col border-r border-gray-100 bg-white min-h-0 ${
              selectedConversation
                ? "hidden lg:flex"
                : "flex"
            }`}
          >
            {/* Search */}

            <div className="px-4 py-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }
                  className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-sm border-0 outline-none focus:bg-gray-50 transition-all"
                />
              </div>
            </div>

            {/* Conversation List */}

            <div className="flex-1 min-h-0 overflow-y-auto">
              {isLoadingConv ? (
                <div className="p-6 text-center text-sm text-gray-400">
                  Loading...
                </div>
              ) : filteredConversations.length > 0 ? (
                filteredConversations.map((conv: any) => {
                  const isActive =
                    selectedConversation?.partnerId ===
                    conv.partnerId;

                  const convDate = conv.createdAt ? new Date(conv.createdAt) : null;

                  return (
                    <div
                      key={conv.partnerId}
                      onClick={() =>
                        setSelectedConversation(conv)
                      }
                      className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all border-b border-gray-50 ${
                        isActive
                          ? "bg-green-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {/* Avatar */}

                      <div className="relative flex-shrink-0">
                        {conv.partnerAvatar ? (
                          <img
                            src={conv.partnerAvatar}
                            className="w-12 h-12 rounded-full object-cover"
                            alt=""
                          />
                        ) : (
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${
                              isActive
                                ? "bg-green-600 text-white"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {conv.partnerName
                              ?.charAt(0)
                              ?.toUpperCase() || "?"}
                          </div>
                        )}

                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      </div>

                      {/* Info */}

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {conv.partnerName}
                          </p>

                          <p className="text-[10px] text-gray-400 ml-2 flex-shrink-0">
                            {convDate ? convDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                          </p>
                        </div>

                        <p className="text-xs text-gray-400 truncate">
                          {conv.content}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-300">
                  <Search className="w-10 h-10" />

                  <p className="text-sm font-medium">
                    No conversations
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Side */}

          <div
            className={`lg:col-span-8 flex flex-col min-h-0 bg-[#f0f2f5] ${
              !selectedConversation ? "hidden lg:flex" : "flex"
            }`}
          >
            {selectedConversation ? (
              <>
                {/* Header */}

                <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-gray-100 shadow-sm z-20 relative">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="lg:hidden p-1.5 rounded-full hover:bg-gray-100 transition"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>

                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        {selectedConversation.partnerName?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                    </div>

                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        {selectedConversation.partnerName}
                      </p>
                      <p className="text-[11px] text-green-500 font-medium">
                        {selectedConversation.isOnline ? "● Online" : "Last seen recently"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button className="p-2 rounded-full hover:bg-gray-100 transition text-gray-400">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-gray-100 transition text-gray-400">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div
                  ref={scrollRef}
                  className="flex-1 min-h-0 overflow-y-auto px-4 py-5 flex flex-col bg-slate-50/50"
                >
                  {isLoadingMsgs ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce"
                            style={{
                              animationDelay: `${i * 0.15}s`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : messages && messages.length > 0 ? (
                    (() => {
                      let lastDateStr = "";
                      return messages.map((msg: any) => {
                        const isMine = msg.senderId === user?.id;
                        const msgDate = new Date(msg.createdAt);
                        const dateStr = msgDate.toLocaleDateString([], {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        });
                        const showSeparator = dateStr !== lastDateStr;
                        lastDateStr = dateStr;

                        let displayDate = dateStr;
                        const today = new Date();
                        const yesterday = new Date();
                        yesterday.setDate(today.getDate() - 1);

                        if (msgDate.toDateString() === today.toDateString()) {
                          displayDate = "Today";
                        } else if (msgDate.toDateString() === yesterday.toDateString()) {
                          displayDate = "Yesterday";
                        }

                        return (
                          <React.Fragment key={msg.id}>
                            {showSeparator && (
                              <div className="flex justify-center my-4">
                                <span className="bg-gray-200/80 text-gray-650 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm select-none tracking-wide uppercase">
                                  {displayDate}
                                </span>
                              </div>
                            )}
                            <div className={`flex mb-4 ${isMine ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[75%] rounded-2xl p-3 ${isMine ? "bg-green-600 text-white rounded-tr-none" : "bg-white text-gray-850 shadow-sm border border-gray-100 rounded-tl-none"}`}>
                                {msg.attachmentUrl && (
                                  <div className="mb-2">
                                    {msg.attachmentType === "image" ? (
                                      <div className="relative group overflow-hidden rounded-xl border border-black/5 bg-black/5 max-w-full">
                                        <img
                                          src={msg.attachmentUrl}
                                          alt="Attachment"
                                          className="max-h-60 max-w-full object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-200"
                                          onClick={() => window.open(msg.attachmentUrl, "_blank")}
                                        />
                                      </div>
                                    ) : (
                                      <a
                                        href={msg.attachmentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                                          isMine
                                            ? "bg-green-700/40 hover:bg-green-700/60 border-green-500/20 text-white"
                                            : "bg-gray-50 hover:bg-gray-150 border-gray-150 text-gray-800"
                                        }`}
                                      >
                                        <div className={`p-2 rounded-lg ${isMine ? "bg-green-600" : "bg-green-100 text-green-600"}`}>
                                          <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                          <p className="text-xs font-bold truncate">
                                            {msg.attachmentUrl.split("/").pop() || "Document"}
                                          </p>
                                          <p className="text-[10px] opacity-75">
                                            Click to download
                                          </p>
                                        </div>
                                      </a>
                                    )}
                                  </div>
                                )}
                                {!(msg.attachmentUrl && (msg.content === "Sent a photo" || msg.content === "Sent a file")) && (
                                  <p className="text-sm font-medium leading-relaxed break-words">{msg.content}</p>
                                )}
                                <span className={`text-[10px] block mt-1.5 ${isMine ? "text-green-100 text-right" : "text-gray-450"}`}>
                                  {msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      });
                    })()
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                      <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center">
                        <Mail className="w-8 h-8 text-green-500" />
                      </div>

                      <p className="text-sm font-semibold text-gray-500">
                        Say hello 👋
                      </p>

                      <p className="text-xs text-gray-400">
                        Send your first message below
                      </p>
                    </div>
                  )}
                </div>

                {/* Attachment Previews */}
                {(attachmentUrl || isUploading) && (
                  <div className="px-4 py-2 bg-white border-t border-gray-100 flex items-center gap-3">
                    {isUploading ? (
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 animate-pulse">
                        <Loader2 className="w-4 h-4 text-green-500 animate-spin" />
                        Uploading attachment...
                      </div>
                    ) : (
                      <div className="relative flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 group max-w-xs shadow-sm">
                        {attachmentType === "image" ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-150 flex-shrink-0">
                            <img src={attachmentUrl!} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 text-left pr-4">
                          <p className="text-xs font-bold text-gray-700 truncate">{attachmentName || "Attachment"}</p>
                          <p className="text-[10px] text-gray-400 capitalize">{attachmentType}</p>
                        </div>
                        <button
                          onClick={handleRemoveAttachment}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-650 text-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Input */}

                <div className="px-4 py-3 bg-white border-t border-gray-100">
                  <div className="flex items-end gap-3 bg-gray-100 rounded-3xl px-4 py-2 focus-within:ring-2 focus-within:ring-green-500/30 transition-all">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileChange}
                      accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    />
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || sendMessageMutation.isPending}
                      className="p-1.5 rounded-full hover:bg-gray-200 transition-colors text-gray-500 active:scale-95 flex-shrink-0 mb-0.5"
                      title="Add attachment"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>

                    <textarea
                      rows={1}
                      placeholder="Write a message..."
                      value={messageInput}
                      onChange={(e) =>
                        setMessageInput(e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !e.shiftKey
                        ) {
                          e.preventDefault();

                          handleSend();
                        }
                      }}
                      className="flex-1 resize-none bg-transparent border-0 outline-none text-sm text-gray-800 placeholder-gray-400 max-h-32"
                    />

                    <button
                      onClick={handleSend}
                      disabled={
                        (!messageInput.trim() && !attachmentUrl) ||
                        isUploading ||
                        sendMessageMutation.isPending
                      }
                      className="w-9 h-9 rounded-full bg-green-500 hover:bg-green-600 disabled:opacity-40 flex items-center justify-center transition-all active:scale-95 shadow-md shadow-green-200 flex-shrink-0"
                    >
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 bg-[#f0f2f5]">
                <div className="w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center">
                  <Mail className="w-12 h-12 text-green-500" />
                </div>

                <div>
                  <h2 className="text-xl font-black text-gray-800">
                    Your Messages
                  </h2>

                  <p className="text-sm text-gray-400 mt-1 max-w-xs">
                    Select a conversation from the left
                    to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}