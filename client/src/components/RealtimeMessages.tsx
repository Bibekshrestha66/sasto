import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/_core/hooks/useAuth";
import { Send, AlertCircle } from "lucide-react";

interface Message {
  id: number;
  senderId: number;
  senderName?: string;
  content: string;
  timestamp: Date;
  isOwn?: boolean;
}

interface RealtimeMessagesProps {
  conversationId: number;
  recipientId: number;
  recipientName: string;
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
}

export function RealtimeMessages({
  conversationId,
  recipientId,
  recipientName,
  messages: initialMessages,
  onSendMessage,
}: RealtimeMessagesProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "error">("disconnected");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { socket, subscribeToMessages, onNewMessage, offNewMessage } = useWebSocket();

  // Subscribe to messages for this user
  useEffect(() => {
    if (user?.id) {
      subscribeToMessages(user.id);
      setConnectionStatus("connected");
    }

    return () => {
      offNewMessage();
    };
  }, [user?.id, subscribeToMessages, offNewMessage]);

  // Listen for new messages
  useEffect(() => {
    const handleNewMessage = (message: any) => {
      // Only add messages from the current conversation
      if (message.senderId === recipientId) {
        setMessages((prev) => [
          ...prev,
          {
            id: message.id,
            senderId: message.senderId,
            senderName: recipientName,
            content: message.content,
            timestamp: new Date(message.timestamp),
            isOwn: false,
          },
        ]);
        scrollToBottom();
      }
    };

    onNewMessage(handleNewMessage);
  }, [recipientId, recipientName, onNewMessage]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !user) return;

    setIsSending(true);
    try {
      // Add optimistic message
      const optimisticMessage: Message = {
        id: Date.now(),
        senderId: user.id,
        senderName: user.name || "You",
        content: input,
        timestamp: new Date(),
        isOwn: true,
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setInput("");

      // Send to server
      await onSendMessage(input);
      scrollToBottom();
    } catch (error) {
      console.error("Failed to send message:", error);
      // Remove optimistic message on error
      setMessages((prev) => prev.slice(0, -1));
      setInput(input); // Restore input
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="flex flex-col h-96 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{recipientName}</h3>
          <p className="text-xs text-muted-foreground">
            {connectionStatus === "connected" ? "Online" : "Offline"}
          </p>
        </div>
        {connectionStatus === "error" && (
          <div className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span>Connection error</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.isOwn
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.isOwn ? "text-accent-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isSending || connectionStatus !== "connected"}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isSending || connectionStatus !== "connected"}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
