import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, X, Minimize2, Maximize2 } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface ChatMessage {
  id: string;
  sender: 'user' | 'support';
  message: string;
  timestamp: Date;
  attachments?: string[];
}

interface LiveChatProps {
  sessionId?: string;
  onClose?: () => void;
}

export const LiveChat: React.FC<LiveChatProps> = ({ sessionId, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket } = useWebSocket();

  useEffect(() => {
    if (!socket) return;

    // Join chat room
    socket.emit('join_chat', { sessionId });

    // Listen for messages
    socket.on('message', (data: any) => {
      setMessages((prev) => [
        ...prev,
        {
          id: data.id,
          sender: data.sender,
          message: data.message,
          timestamp: new Date(data.timestamp),
        },
      ]);
    });

    // Listen for typing indicator
    socket.on('typing', (data: any) => {
      setIsTyping(data.isTyping);
    });

    // Connection status
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    return () => {
      socket.off('message');
      socket.off('typing');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [socket, sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !socket) return;

    const message: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      sender: 'user',
      message: inputText,
      timestamp: new Date(),
    };

    socket.emit('send_message', {
      sessionId,
      message: inputText,
    });

    setMessages((prev) => [...prev, message]);
    setInputText('');
  };

  const handleTyping = (text: string) => {
    setInputText(text);
    socket?.emit('typing', { sessionId, isTyping: text.length > 0 });
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg flex items-center gap-2"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-sm font-semibold">Chat Support</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-96 z-50 flex flex-col bg-white rounded-lg shadow-xl border border-gray-200">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div>
          <h3 className="font-bold">Support Chat</h3>
          <p className="text-xs opacity-90">
            {isConnected ? '🟢 Online' : '🔴 Offline'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-green-700 rounded"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-green-700 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>Start a conversation</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.sender === 'user'
                  ? 'bg-green-600 text-white rounded-br-none'
                  : 'bg-gray-200 text-gray-900 rounded-bl-none'
              }`}
            >
              <p className="text-sm">{msg.message}</p>
              <p className="text-xs opacity-70 mt-1">
                {msg.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-2 items-center text-gray-600">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span className="text-xs">Support is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-sm"
            disabled={!isConnected}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || !isConnected}
            className="bg-green-600 hover:bg-green-700 text-white p-2"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LiveChat;
