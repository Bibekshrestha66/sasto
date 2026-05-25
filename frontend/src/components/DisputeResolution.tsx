import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, MessageSquare, CheckCircle, Clock, FileText } from 'lucide-react';

interface Dispute {
  id: number;
  orderId: number;
  buyerId: number;
  sellerId: number;
  reason: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: Date;
  messages: DisputeMessage[];
  resolution?: string;
}

interface DisputeMessage {
  id: number;
  userId: number;
  userName: string;
  message: string;
  timestamp: Date;
  attachments?: string[];
}

interface DisputeResolutionProps {
  disputeId: number;
  onResolved?: () => void;
}

export const DisputeResolution: React.FC<DisputeResolutionProps> = ({
  disputeId,
  onResolved,
}) => {
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  React.useEffect(() => {
    fetchDispute();
  }, [disputeId]);

  const fetchDispute = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/disputes/${disputeId}`);
      if (!response.ok) throw new Error('Failed to fetch dispute');
      const data = await response.json();
      setDispute(data);
    } catch (error) {
      console.error('Dispute fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !dispute) return;

    setSending(true);
    try {
      const response = await fetch(`/api/disputes/${disputeId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      setMessageText('');
      await fetchDispute();
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setSending(false);
    }
  };

  const handleResolveDispute = async (resolution: string) => {
    try {
      const response = await fetch(`/api/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution }),
      });

      if (!response.ok) throw new Error('Failed to resolve dispute');

      onResolved?.();
      await fetchDispute();
    } catch (error) {
      console.error('Resolve dispute error:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading dispute details...</div>;
  }

  if (!dispute) {
    return <div className="text-center py-8 text-red-600">Dispute not found</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-50 border-red-300 text-red-700';
      case 'in_progress':
        return 'bg-yellow-50 border-yellow-300 text-yellow-700';
      case 'resolved':
        return 'bg-green-50 border-green-300 text-green-700';
      default:
        return 'bg-gray-50 border-gray-300 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertTriangle className="w-5 h-5" />;
      case 'in_progress':
        return <Clock className="w-5 h-5" />;
      case 'resolved':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Dispute Header */}
      <Card className={`p-6 border-2 border-dashed ${getStatusColor(dispute.status)}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {getStatusIcon(dispute.status)}
            <div>
              <h3 className="text-lg font-bold">Dispute #{dispute.id}</h3>
              <p className="text-sm mt-1">Order #{dispute.orderId}</p>
              <p className="text-sm mt-2 font-semibold">{dispute.reason}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">Status</p>
            <p className="text-sm font-bold capitalize">{dispute.status.replace('_', ' ')}</p>
          </div>
        </div>
      </Card>

      {/* Messages Section */}
      <Card className="p-6 border-2 border-dashed border-green-300">
        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Conversation
        </h4>

        {/* Messages List */}
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
          {dispute.messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {msg.userName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{msg.userName}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-700 bg-gray-50 p-3 rounded">{msg.message}</p>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {msg.attachments.map((attachment, idx) => (
                      <a
                        key={idx}
                        href={attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Attachment {idx + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        {dispute.status !== 'closed' && (
          <div className="space-y-3">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              rows={3}
            />
            <Button
              onClick={handleSendMessage}
              disabled={sending || !messageText.trim()}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {sending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        )}
      </Card>

      {/* Resolution Section */}
      {dispute.status === 'in_progress' && (
        <Card className="p-6 border-2 border-dashed border-blue-300">
          <h4 className="text-lg font-bold mb-4">Propose Resolution</h4>
          <div className="space-y-3">
            <Button
              onClick={() => handleResolveDispute('refund')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Refund Buyer
            </Button>
            <Button
              onClick={() => handleResolveDispute('reship')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Reship Item
            </Button>
            <Button
              onClick={() => handleResolveDispute('partial_refund')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Partial Refund
            </Button>
          </div>
        </Card>
      )}

      {/* Resolution Details */}
      {dispute.resolution && (
        <Card className="p-6 border-2 border-dashed border-green-300 bg-green-50">
          <h4 className="font-bold text-green-900 mb-2">Resolution</h4>
          <p className="text-green-700 capitalize">{dispute.resolution.replace('_', ' ')}</p>
        </Card>
      )}
    </div>
  );
};

export default DisputeResolution;
