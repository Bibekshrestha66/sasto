import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, AlertCircle, Clock, CheckCircle, User, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function CSRDashboard() {
  const [selectedTab, setSelectedTab] = useState("tickets");
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [response, setResponse] = useState("");

  // Fetch support tickets
  const { data: tickets, isLoading: ticketsLoading } = (trpc as any).support?.getTickets?.useQuery() || { data: [], isLoading: false };

  // Fetch user complaints
  const { data: complaints, isLoading: complaintsLoading } = (trpc as any).support?.getComplaints?.useQuery() || { data: [], isLoading: false };

  const resolveTicket = (trpc as any).support?.resolveTicket?.useMutation({
    onSuccess: () => {
      toast.success("Ticket resolved");
      setResponse("");
      setSelectedTicket(null);
    },
  });

  const respondToTicket = (trpc as any).support?.respondToTicket?.useMutation({
    onSuccess: () => {
      toast.success("Response sent");
      setResponse("");
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Customer Support Dashboard</h1>
        <p className="text-gray-600">Manage customer inquiries and complaints</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-2 border-dashed border-accent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open Tickets</p>
              <p className="text-2xl font-bold">{tickets?.filter((t: any) => t.status === "open").length || 0}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4 border-2 border-dashed border-accent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold">{tickets?.filter((t: any) => t.status === "in_progress").length || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-4 border-2 border-dashed border-accent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-bold">{tickets?.filter((t: any) => t.status === "resolved").length || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4 border-2 border-dashed border-accent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Complaints</p>
              <p className="text-2xl font-bold">{complaints?.length || 0}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
        </TabsList>

        {/* Support Tickets */}
        <TabsContent value="tickets" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Ticket List */}
            <div className="lg:col-span-1 space-y-2 max-h-96 overflow-y-auto">
              {ticketsLoading ? (
                <Card className="p-4">Loading...</Card>
              ) : tickets?.length === 0 ? (
                <Card className="p-4 text-center text-gray-600">No tickets</Card>
              ) : (
                tickets?.map((ticket: any) => (
                  <Card
                    key={ticket.id}
                    className={`p-3 cursor-pointer border-2 border-dashed transition-all ${
                      selectedTicket === ticket.id ? "border-accent bg-accent/10" : "border-gray-300"
                    }`}
                    onClick={() => setSelectedTicket(ticket.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{ticket.subject}</h4>
                        <p className="text-xs text-gray-600 truncate">{ticket.user?.name}</p>
                      </div>
                      <Badge
                        variant={
                          ticket.status === "open"
                            ? "destructive"
                            : ticket.status === "in_progress"
                              ? "secondary"
                              : "default"
                        }
                        className="ml-2 flex-shrink-0"
                      >
                        {ticket.status}
                      </Badge>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Ticket Details */}
            <div className="lg:col-span-2">
              {selectedTicket ? (
                (() => {
                  const ticket = tickets?.find((t: any) => t.id === selectedTicket);
                  return (
                    <Card className="p-6 border-2 border-dashed border-accent space-y-4">
                      <div>
                        <h3 className="text-xl font-bold mb-2">{ticket?.subject}</h3>
                        <div className="flex items-center gap-2 mb-4">
                          <User className="w-4 h-4" />
                          <span className="text-sm">{ticket?.user?.name}</span>
                          <Badge>{ticket?.status}</Badge>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded">
                        <p className="text-sm text-gray-700">{ticket?.message}</p>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-semibold">Your Response</label>
                        <Textarea
                          placeholder="Type your response here..."
                          value={response}
                          onChange={(e) => setResponse(e.target.value)}
                          className="min-h-24"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() =>
                              respondToTicket.mutate({
                                ticketId: selectedTicket,
                                response,
                              })
                            }
                            disabled={!response.trim()}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Send Response
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              resolveTicket.mutate({
                                ticketId: selectedTicket,
                              })
                            }
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Resolve Ticket
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })()
              ) : (
                <Card className="p-6 border-2 border-dashed border-accent text-center text-gray-600">
                  Select a ticket to view details
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Complaints */}
        <TabsContent value="complaints" className="space-y-4">
          {complaintsLoading ? (
            <Card className="p-4">Loading...</Card>
          ) : complaints?.length === 0 ? (
            <Card className="p-4 text-center text-gray-600">No complaints</Card>
          ) : (
            complaints?.map((complaint: any) => (
              <Card key={complaint.id} className="p-4 border-2 border-dashed border-orange-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold">{complaint.subject}</h3>
                    <p className="text-sm text-gray-600 mt-1">{complaint.complainant?.name}</p>
                    <p className="text-sm text-gray-700 mt-2">{complaint.description}</p>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="outline">{complaint.type}</Badge>
                      <Badge
                        variant={complaint.status === "open" ? "destructive" : complaint.status === "investigating" ? "secondary" : "default"}
                      >
                        {complaint.status}
                      </Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Investigate
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
