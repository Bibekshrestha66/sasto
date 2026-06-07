import React, { useState, useEffect } from "react";
import { useAuth } from "../_core/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Flag, UserX, UserCheck, Zap, Eye,
  TrendingDown, TrendingUp, History, PieChart, Layers, Download,
  Shield, Users, Package, DollarSign, BarChart3, FileDown,
  Loader2, CheckCircle2, XCircle, AlertCircle, Key, Lock, Unlock, Settings2,
  FileText, ChevronRight, Mail, Phone, MapPin, Briefcase, ShieldCheck, ShieldAlert, ArrowLeft, RefreshCw, Paperclip, X, Truck, Search
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";
import { Megaphone, Crown, Rocket, Sparkles, Star, Trash2, Calendar, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type UserRole = "user" | "seller" | "csr" | "sub_moderator" | "moderator" | "admin" | "super_admin";
const ROOT_OWNER_ID = 1;

export default function SuperAdminDashboard() {
  const { user, loading } = useAuth();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [banReason, setBanReason] = useState<Record<number, string>>({});
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Advanced Analytics State
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "bi_weekly" | "monthly" | "quarterly" | "half_year" | "yearly">("monthly");
  
  // Search Ads State
  const [listingSearchQuery, setListingSearchQuery] = useState("");
  const { data: searchResults, isLoading: searchLoading } = trpc.admin.searchListingsAdmin.useQuery(
    { query: listingSearchQuery },
    { enabled: listingSearchQuery.length > 0 && selectedTab === "search_ads" }
  );

  // Sponsored ads state
  const [promotionStatusFilter, setPromotionStatusFilter] = useState("");
  const [editingPricing, setEditingPricing] = useState<Record<string, { priceNPR: number; durationDays: number; maxSlots: number }>>({});
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectRequestId, setRejectRequestId] = useState<number | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  // Brand Settings State
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyLocation, setCompanyLocation] = useState("");
  const [companyCommissionRate, setCompanyCommissionRate] = useState(0);
  const [hasLoadedConfig, setHasLoadedConfig] = useState(false);

  // Complaints / Reports State
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");

  // Careers State
  const [careerTitle, setCareerTitle] = useState("");
  const [careerDept, setCareerDept] = useState("Engineering");
  const [careerLoc, setCareerLoc] = useState("");
  const [careerSalary, setCareerSalary] = useState("");
  const [careerType, setCareerType] = useState("Full-Time");
  const [careerDesc, setCareerDesc] = useState("");
  const [careerReqs, setCareerReqs] = useState("");

  // Support Desk State
  const [activeChatUserId, setActiveChatUserId] = useState<number | null>(null);
  const [chatReplyContent, setChatReplyContent] = useState("");

  const [supportAttachmentUrl, setSupportAttachmentUrl] = useState<string | null>(null);
  const [supportAttachmentType, setSupportAttachmentType] = useState<string | null>(null);
  const [supportAttachmentName, setSupportAttachmentName] = useState<string | null>(null);
  const [isSupportUploading, setIsSupportUploading] = useState(false);
  const supportFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSupportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsSupportUploading(true);
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
        setSupportAttachmentUrl(data.url);
        setSupportAttachmentName(file.name);
        setSupportAttachmentType(isImage ? "image" : "document");
        toast.success("Attachment uploaded successfully!");
      }
    } catch (err: any) {
      console.error("[Support Upload] Error:", err);
      toast.error("Failed to upload attachment: " + err.message);
    } finally {
      setIsSupportUploading(false);
      if (supportFileInputRef.current) {
        supportFileInputRef.current.value = "";
      }
    }
  };

  const handleSupportRemoveAttachment = () => {
    setSupportAttachmentUrl(null);
    setSupportAttachmentType(null);
    setSupportAttachmentName(null);
  };

  const { subscribeToMessages, onNewMessage, offNewMessage } = useWebSocket();
  const utils = trpc.useUtils();

  const { data: analyticsData } = trpc.admin.getAnalytics.useQuery();
  const { data: usersData, isLoading: usersLoading } = trpc.admin.getAllUsers.useQuery({ page: 1, limit: 50 });
  const { data: flaggedData, isLoading: flaggedLoading } = trpc.admin.getFlaggedListings.useQuery({ page: 1, limit: 20 });
  const { data: financialData, isLoading: finLoading } = trpc.admin.getFinancialStats.useQuery();
  const { data: advancedFinance, isLoading: advFinLoading } = trpc.admin.getAdvancedFinancials.useQuery({});
  const { data: advancedAnalytics, isLoading: advAnalyticsLoading } = trpc.admin.getAdvancedAnalytics.useQuery({ timeframe });
  const { data: pendingVerifications, isLoading: verLoading } = trpc.admin.getPendingVerifications.useQuery({ page: 1, limit: 20 });
  const { data: allVerifications } = trpc.admin.getAllVerifications.useQuery({ page: 1, limit: 50 });
  const { data: selectedUserProfile, isLoading: profileLoading } = trpc.admin.getUserProfile.useQuery(
    { userId: selectedUserId! },
    { enabled: !!selectedUserId }
  );

  // Sponsored Ads queries
  const promotionRequestsQuery = trpc.ads.adminGetPromotionRequests.useQuery(
    { status: promotionStatusFilter || undefined },
    { enabled: selectedTab === "sponsored" }
  );
  const pricingQuery = trpc.ads.getSponsoredPricing.useQuery(undefined, { enabled: selectedTab === "sponsored" });
  const featuredListingsQuery = trpc.ads.adminGetFeaturedListings.useQuery(undefined, { enabled: selectedTab === "sponsored" });

  // Sponsored ads mutations
  const reviewPromotionMutation = trpc.ads.adminReviewPromotion.useMutation();
  useEffect(() => {
    if (reviewPromotionMutation.isSuccess && reviewPromotionMutation.data) {
      toast.success((reviewPromotionMutation.data as any).message);
      promotionRequestsQuery.refetch();
      featuredListingsQuery.refetch();
      setRejectModalOpen(false);
      setRejectNotes("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewPromotionMutation.isSuccess]);
  useEffect(() => {
    if (reviewPromotionMutation.isError) toast.error((reviewPromotionMutation.error as any)?.message || "Action failed");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewPromotionMutation.isError]);

  const setPricingMutation = trpc.ads.adminSetSponsoredPricing.useMutation();
  useEffect(() => {
    if (setPricingMutation.isSuccess) { toast.success("Pricing updated!"); pricingQuery.refetch(); setEditingPricing({}); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPricingMutation.isSuccess]);
  useEffect(() => {
    if (setPricingMutation.isError) toast.error((setPricingMutation.error as any)?.message || "Failed to update pricing");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPricingMutation.isError]);

  const removeFeaturedMutation = trpc.ads.adminSetFeatured.useMutation();
  useEffect(() => {
    if (removeFeaturedMutation.isSuccess) { toast.success("Listing removed from featured ads!"); featuredListingsQuery.refetch(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [removeFeaturedMutation.isSuccess]);
  useEffect(() => {
    if (removeFeaturedMutation.isError) toast.error((removeFeaturedMutation.error as any)?.message || "Failed to remove featured ad");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [removeFeaturedMutation.isError]);

  // Dynamic Company Settings, Reports, Careers, and CSR live queue TRPC Hooks
  const { data: companyConfig, refetch: refetchConfig } = trpc.system.getCompanyConfig.useQuery();
  const updateConfigMutation = trpc.admin.updateCompanyConfig.useMutation();
  useEffect(() => {
    if (updateConfigMutation.isSuccess) { toast.success("Company settings updated live!"); refetchConfig(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateConfigMutation.isSuccess]);
  useEffect(() => {
    if (updateConfigMutation.isError) toast.error((updateConfigMutation.error as any)?.message);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateConfigMutation.isError]);

  const { data: paymentGateways, refetch: refetchGateways } = trpc.admin.getPaymentGateways.useQuery(undefined, {
    enabled: user?.role === "super_admin"
  });
  
  // Local state for payment gateways editing
  const [editingGateways, setEditingGateways] = useState<Record<string, any>>({});

  React.useEffect(() => {
    if (paymentGateways) {
      const initial: Record<string, any> = {};
      paymentGateways.forEach(gw => {
        initial[gw.name] = {
          apiKey: gw.apiKey || "",
          apiSecret: gw.apiSecret || "",
          merchantId: gw.merchantId || "",
          isActive: gw.isActive
        };
      });
      setEditingGateways(initial);
    }
  }, [paymentGateways]);

  const updateGatewayMutation = trpc.admin.updatePaymentGateway.useMutation();
  useEffect(() => {
    if (updateGatewayMutation.isSuccess) { toast.success("Payment Gateway updated successfully!"); refetchGateways(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateGatewayMutation.isSuccess]);
  useEffect(() => {
    if (updateGatewayMutation.isError) toast.error((updateGatewayMutation.error as any)?.message);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateGatewayMutation.isError]);

  // Logistics Partners State and Hooks
  const [newPartnerName, setNewPartnerName] = useState("");
  const [newPartnerDisplayName, setNewPartnerDisplayName] = useState("");
  const { data: logisticsPartners, refetch: refetchLogistics } = trpc.admin.getLogisticsPartners.useQuery(undefined, {
    enabled: user?.role === "super_admin"
  });
  const addLogisticsPartnerMutation = trpc.admin.addLogisticsPartner.useMutation();
  useEffect(() => {
    if (addLogisticsPartnerMutation.isSuccess) { toast.success("Logistics partner added successfully!"); setNewPartnerName(""); setNewPartnerDisplayName(""); refetchLogistics(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addLogisticsPartnerMutation.isSuccess]);
  useEffect(() => {
    if (addLogisticsPartnerMutation.isError) toast.error((addLogisticsPartnerMutation.error as any)?.message);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addLogisticsPartnerMutation.isError]);
  const updateLogisticsPartnerMutation = trpc.admin.updateLogisticsPartner.useMutation();
  useEffect(() => {
    if (updateLogisticsPartnerMutation.isSuccess) { toast.success("Logistics partner updated!"); refetchLogistics(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateLogisticsPartnerMutation.isSuccess]);
  useEffect(() => {
    if (updateLogisticsPartnerMutation.isError) toast.error((updateLogisticsPartnerMutation.error as any)?.message);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateLogisticsPartnerMutation.isError]);
  const deleteLogisticsPartnerMutation = trpc.admin.deleteLogisticsPartner.useMutation();
  useEffect(() => {
    if (deleteLogisticsPartnerMutation.isSuccess) { toast.success("Logistics partner deleted!"); refetchLogistics(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteLogisticsPartnerMutation.isSuccess]);
  useEffect(() => {
    if (deleteLogisticsPartnerMutation.isError) toast.error((deleteLogisticsPartnerMutation.error as any)?.message);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteLogisticsPartnerMutation.isError]);

  const { data: reports, refetch: refetchReports } = trpc.admin.getAllReports.useQuery();
  const resolveReportMutation = trpc.admin.resolveReport.useMutation();
  useEffect(() => {
    if (resolveReportMutation.isSuccess) { toast.success("Complaint ticket resolved successfully!"); refetchReports(); setSelectedReportId(null); setResolveNotes(""); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolveReportMutation.isSuccess]);
  useEffect(() => {
    if (resolveReportMutation.isError) toast.error((resolveReportMutation.error as any)?.message);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolveReportMutation.isError]);

  const { data: careers, refetch: refetchCareers } = trpc.system.getCareers.useQuery();
  const createCareerMutation = trpc.admin.createCareerOpening.useMutation();
  useEffect(() => {
    if (createCareerMutation.isSuccess) {
      toast.success("New career ad posted live!"); refetchCareers();
      setCareerTitle(""); setCareerLoc(""); setCareerSalary(""); setCareerDesc(""); setCareerReqs("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createCareerMutation.isSuccess]);
  useEffect(() => {
    if (createCareerMutation.isError) toast.error((createCareerMutation.error as any)?.message);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createCareerMutation.isError]);

  const archiveCareerMutation = trpc.admin.archiveCareerOpening.useMutation();
  useEffect(() => {
    if (archiveCareerMutation.isSuccess) { toast.success("Career opening archived!"); refetchCareers(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archiveCareerMutation.isSuccess]);
  useEffect(() => {
    if (archiveCareerMutation.isError) toast.error((archiveCareerMutation.error as any)?.message);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archiveCareerMutation.isError]);

  const { data: supportChats, refetch: refetchChats } = trpc.admin.getSupportConversations.useQuery(undefined, {
    refetchInterval: 5000,
  });
  
  const { data: supportMessages, refetch: refetchSupportMessages } = trpc.admin.getSupportMessages.useQuery(
    { userId: activeChatUserId! },
    { 
      enabled: !!activeChatUserId,
      refetchInterval: 2000,
    }
  );

  const sendSupportReplyMutation = trpc.admin.sendSupportReply.useMutation();
  useEffect(() => {
    if (sendSupportReplyMutation.isSuccess) { setChatReplyContent(""); handleSupportRemoveAttachment(); refetchSupportMessages(); refetchChats(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendSupportReplyMutation.isSuccess]);
  useEffect(() => {
    if (sendSupportReplyMutation.isError) toast.error((sendSupportReplyMutation.error as any)?.message);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendSupportReplyMutation.isError]);

  React.useEffect(() => {
    if (companyConfig && !hasLoadedConfig) {
      setCompanyEmail(companyConfig.email);
      setCompanyPhone(companyConfig.phone);
      setCompanyLocation(companyConfig.location);
      setCompanyCommissionRate(companyConfig.commissionRate || 0);
      setHasLoadedConfig(true);
    }
  }, [companyConfig, hasLoadedConfig]);

  // Real-time Support Chat Updates
  React.useEffect(() => {
    if (!user?.id) return;
    subscribeToMessages(user.id);

    const handler = (msg: any) => {
      refetchChats();
      if (activeChatUserId && (msg.senderId === activeChatUserId || msg.recipientId === activeChatUserId)) {
        refetchSupportMessages();
      }
      if (msg.senderId !== user.id) {
        const audio = new Audio("/assets/notification.mp3");
        audio.play().catch(() => {});
      }
    };

    onNewMessage(handler);
    return () => {
      offNewMessage();
    };
  }, [user?.id, activeChatUserId, onNewMessage, offNewMessage, subscribeToMessages, refetchChats, refetchSupportMessages]);

  // RBAC Queries
  const { data: rbacRoles, isLoading: rolesLoading } = trpc.rbac.getRoles.useQuery();
  const { data: allPermissions, isLoading: permsLoading } = trpc.rbac.getPermissions.useQuery();
  
  const togglePermMutation = trpc.rbac.togglePermission.useMutation();
  useEffect(() => {
    if (togglePermMutation.isSuccess) { toast.success("Permission updated!"); utils.rbac.getRoles.invalidate(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [togglePermMutation.isSuccess]);
  useEffect(() => {
    if (togglePermMutation.isError) toast.error((togglePermMutation.error as any)?.message);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [togglePermMutation.isError]);

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation();
  useEffect(() => {
    if (updateRoleMutation.isSuccess) { toast.success("Role updated!"); utils.admin.getAllUsers.invalidate(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateRoleMutation.isSuccess]);
  useEffect(() => {
    if (updateRoleMutation.isError) toast.error((updateRoleMutation.error as any)?.message);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateRoleMutation.isError]);

  const banMutation = trpc.admin.banUser.useMutation();
  useEffect(() => {
    if (banMutation.isSuccess) { toast.success("User banned."); utils.admin.getAllUsers.invalidate(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banMutation.isSuccess]);
  useEffect(() => {
    if (banMutation.isError) toast.error((banMutation.error as any)?.message);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banMutation.isError]);

  const unbanMutation = trpc.admin.unbanUser.useMutation();
  useEffect(() => {
    if (unbanMutation.isSuccess) { toast.success("User unbanned."); utils.admin.getAllUsers.invalidate(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unbanMutation.isSuccess]);
  useEffect(() => {
    if (unbanMutation.isError) toast.error((unbanMutation.error as any)?.message);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unbanMutation.isError]);

  const approveListingMutation = trpc.admin.approveListing.useMutation();
  useEffect(() => {
    if (approveListingMutation.isSuccess) { toast.success("Listing approved!"); utils.admin.getFlaggedListings.invalidate(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approveListingMutation.isSuccess]);
  useEffect(() => {
    if (approveListingMutation.isError) toast.error((approveListingMutation.error as any)?.message);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approveListingMutation.isError]);

  const rejectListingMutation = trpc.admin.rejectListing.useMutation();
  useEffect(() => {
    if (rejectListingMutation.isSuccess) { toast.success("Listing rejected."); utils.admin.getFlaggedListings.invalidate(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rejectListingMutation.isSuccess]);
  useEffect(() => {
    if (rejectListingMutation.isError) toast.error((rejectListingMutation.error as any)?.message);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rejectListingMutation.isError]);

  const featureMutation = trpc.admin.setListingFeatured.useMutation();
  useEffect(() => {
    if (featureMutation.isSuccess) { toast.success("Listing featured on homepage!"); utils.admin.getFlaggedListings.invalidate(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureMutation.isSuccess]);
  useEffect(() => {
    if (featureMutation.isError) toast.error((featureMutation.error as any)?.message);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureMutation.isError]);

  const reviewVerificationMutation = trpc.admin.reviewVerification.useMutation();
  useEffect(() => {
    if (reviewVerificationMutation.isSuccess) {
      toast.success("Verification reviewed!");
      utils.admin.getPendingVerifications.invalidate();
      utils.admin.getAllVerifications.invalidate();
      utils.admin.getAllUsers.invalidate();
      if (selectedUserId) utils.admin.getUserProfile.invalidate({ userId: selectedUserId });
      setAdminNotes("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewVerificationMutation.isSuccess]);
  useEffect(() => {
    if (reviewVerificationMutation.isError) toast.error((reviewVerificationMutation.error as any)?.message);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewVerificationMutation.isError]);

  const downloadCSV = () => {
    if (!financialData) return;
    const headers = ["ID", "Title", "Price (NPR)", "Status", "Featured", "Created At"];
    const rows = financialData.allListings.map((l: any) => [
      l.id, `"${l.title}"`, l.price || 0, l.status, l.isFeatured ? "Yes" : "No",
      new Date(l.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sasto_finance_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Finance report downloaded!");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>;

  if (!user) return (
    <div className="container mx-auto py-12 px-4">
      <Card className="border-red-200 bg-red-50 max-w-md mx-auto">
        <CardHeader><CardTitle className="text-red-700">Please log in to continue.</CardTitle></CardHeader>
        <CardContent><Button onClick={() => window.location.href = "/login"}>Go to Login</Button></CardContent>
      </Card>
    </div>
  );

  const allowedRoles = ["csr", "sub_moderator", "moderator", "admin", "super_admin"];
  if (!allowedRoles.includes(user.role)) return (
    <div className="container mx-auto py-12 px-4">
      <Card className="border-red-200 bg-red-50 max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700"><AlertCircle className="w-5 h-5" />Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">You do not have permission to access the Staff Admin Console.</p>
          <Badge variant="outline">Logged in as: {user.role}</Badge>
          <Button className="mt-4 w-full" onClick={() => window.location.href = "/"}>Go to Home</Button>
        </CardContent>
      </Card>
    </div>
  );

  const filteredUsers = (usersData?.users || []).filter((u: any) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor: Record<string, string> = {
    active: "text-green-600 border-green-200 bg-green-50",
    suspended: "text-yellow-600 border-yellow-200 bg-yellow-50",
    banned: "text-red-600 border-red-200 bg-red-50",
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-green-600" />
              Sasto Staff Admin Console
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Logged in as <span className="font-semibold text-gray-700">{user.name}</span> ({user.email})
            </p>
          </div>
          <Badge className="bg-green-600 text-white capitalize">{user.role?.replace("_", " ")}</Badge>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Users", value: analyticsData?.totalUsers ?? "—", icon: Users, color: "text-blue-600" },
            { label: "Active Listings", value: analyticsData?.activeListings ?? "—", icon: Package, color: "text-green-600" },
            { label: "Featured Ads", value: financialData?.featuredListings ?? "—", icon: Zap, color: "text-yellow-500" },
            { label: "Promo Revenue", value: financialData ? `NPR ${financialData.promotionRevenue.toLocaleString()}` : "—", icon: DollarSign, color: "text-purple-600" },
          ].map((stat) => (
            <Card key={stat.label} className="border-none shadow-md">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-xl font-black text-gray-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="bg-white border shadow-sm rounded-xl p-1 w-full flex flex-wrap gap-1 md:inline-flex h-auto">
            <TabsTrigger value="overview" className="flex items-center gap-1.5 text-xs"><BarChart3 className="w-3.5 h-3.5" />Overview</TabsTrigger>
            <TabsTrigger value="support_desk" className="flex items-center gap-1.5 text-xs"><Mail className="w-3.5 h-3.5" />Support Desk</TabsTrigger>
            <TabsTrigger value="complaints_inbox" className="flex items-center gap-1.5 text-xs"><Flag className="w-3.5 h-3.5" />Complaints</TabsTrigger>
            <TabsTrigger value="job_manager" className="flex items-center gap-1.5 text-xs"><Briefcase className="w-3.5 h-3.5" />Careers</TabsTrigger>
            <TabsTrigger value="brand_settings" className="flex items-center gap-1.5 text-xs"><Settings2 className="w-3.5 h-3.5" />Brand Settings</TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1.5 text-xs"><Users className="w-3.5 h-3.5" />Users</TabsTrigger>
            <TabsTrigger value="profiles" className="flex items-center gap-1.5 text-xs"><FileText className="w-3.5 h-3.5" />Profiles & Docs</TabsTrigger>
            <TabsTrigger value="verifications" className="flex items-center gap-1.5 text-xs"><Shield className="w-3.5 h-3.5" />Verifications</TabsTrigger>
            <TabsTrigger value="flagged" className="flex items-center gap-1.5 text-xs"><Flag className="w-3.5 h-3.5" />Content Mod</TabsTrigger>
            {(user.role === "admin" || user.role === "super_admin") && (
              <TabsTrigger value="sponsored" className="flex items-center gap-1.5 text-xs"><Megaphone className="w-3.5 h-3.5" />Sponsored Ads</TabsTrigger>
            )}
            {user.role === "super_admin" && (
              <>
                <TabsTrigger value="search_ads" className="flex items-center gap-1.5 text-xs"><Search className="w-3.5 h-3.5" />Search Ads</TabsTrigger>
                <TabsTrigger value="finance" className="flex items-center gap-1.5 text-xs"><DollarSign className="w-3.5 h-3.5" />Finance Pro</TabsTrigger>
                <TabsTrigger value="payments" className="flex items-center gap-1.5 text-xs"><DollarSign className="w-3.5 h-3.5" />Payment & Fees</TabsTrigger>
                <TabsTrigger value="logistics" className="flex items-center gap-1.5 text-xs"><Truck className="w-3.5 h-3.5" />Logistics Partners</TabsTrigger>
                <TabsTrigger value="rbac" className="flex items-center gap-1.5 text-xs"><Key className="w-3.5 h-3.5" />Permissions</TabsTrigger>
              </>
            )}
          </TabsList>

          {/* SEARCH ADS */}
          <TabsContent value="search_ads" className="space-y-6">
            <Card className="border-none shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-black">Search Listings</CardTitle>
                <CardDescription>Search ads by their exact ID or by title</CardDescription>
                <div className="relative mt-2 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    placeholder="Enter Listing ID or Title..." 
                    className="pl-9 h-10"
                    value={listingSearchQuery}
                    onChange={(e) => setListingSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {searchLoading ? (
                  <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" /></div>
                ) : searchResults && searchResults.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {searchResults.map((listing) => (
                      <div key={listing.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                            {listing.images && listing.images[0] ? (
                              <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-gray-400" /></div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">#{listing.id} - {listing.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{listing.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-[10px]">{listing.type}</Badge>
                              <Badge variant={listing.status === "active" ? "default" : "secondary"} className="text-[10px] capitalize bg-green-100 text-green-700 hover:bg-green-100 border-none">{listing.status}</Badge>
                              {listing.price && <span className="text-xs font-bold text-gray-700">Rs. {Number(listing.price).toLocaleString()}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <a href={`/listing/${listing.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-md text-xs font-medium border h-8 px-3 hover:bg-gray-50 transition-colors">
                            <Eye className="w-3.5 h-3.5 mr-1" /> View Ad
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : listingSearchQuery.length > 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No listings found for "{listingSearchQuery}"</p>
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-400">
                    <Package className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Type an ID or title to begin searching</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Platform Analytics</h2>
                <p className="text-gray-500 text-sm">Monitor your marketplace growth and revenue</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={timeframe} onValueChange={(val: any) => setTimeframe(val)}>
                  <SelectTrigger className="w-36 bg-white shadow-sm h-10 border-gray-200">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi_weekly">Bi-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="half_year">Half Year</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Users className="w-16 h-16 text-blue-600" />
                </div>
                <CardContent className="p-6 relative z-10">
                  <p className="text-sm font-bold text-blue-600 mb-1 uppercase tracking-wider">Total Users</p>
                  <p className="text-3xl font-black text-gray-900">{analyticsData?.totalUsers ?? "—"}</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-gradient-to-br from-green-50 to-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Package className="w-16 h-16 text-green-600" />
                </div>
                <CardContent className="p-6 relative z-10">
                  <p className="text-sm font-bold text-green-600 mb-1 uppercase tracking-wider">Active Ads</p>
                  <p className="text-3xl font-black text-gray-900">{analyticsData?.activeListings ?? "—"}</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-gradient-to-br from-purple-50 to-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <DollarSign className="w-16 h-16 text-purple-600" />
                </div>
                <CardContent className="p-6 relative z-10">
                  <p className="text-sm font-bold text-purple-600 mb-1 uppercase tracking-wider">Promo Rev</p>
                  <p className="text-3xl font-black text-gray-900">
                    <span className="text-xl">Rs.</span>
                    {financialData ? financialData.promotionRevenue.toLocaleString() : "—"}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-gradient-to-br from-amber-50 to-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <TrendingUp className="w-16 h-16 text-amber-600" />
                </div>
                <CardContent className="p-6 relative z-10">
                  <p className="text-sm font-bold text-amber-600 mb-1 uppercase tracking-wider">Total Value</p>
                  <p className="text-3xl font-black text-gray-900">
                    <span className="text-xl">Rs.</span>
                    {financialData ? financialData.totalValue.toLocaleString() : "—"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Growth Chart */}
            <Card className="border-none shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-black">Growth & Revenue</CardTitle>
                <CardDescription>Platform growth over the selected timeframe</CardDescription>
              </CardHeader>
              <CardContent>
                {advAnalyticsLoading ? (
                  <div className="h-72 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <div className="h-72 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={advancedAnalytics?.chartData || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} tickFormatter={(val) => `Rs.${val}`} />
                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={10} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>
                        <Area yAxisId="left" type="monotone" name="Revenue (Rs)" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                        <Area yAxisId="right" type="monotone" name="New Users" dataKey="newUsers" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Sellers */}
              <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-500" /> Top Sellers
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {advancedAnalytics?.topSellers?.length === 0 && (
                      <div className="p-6 text-center text-gray-400 text-sm">No transaction data available.</div>
                    )}
                    {advancedAnalytics?.topSellers?.map((seller, idx) => (
                      <div key={seller.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-gray-200 text-gray-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-600'}`}>
                            #{idx + 1}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-900">{seller.name}</p>
                            <p className="text-xs text-gray-500">{seller.sales} sales completed</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-sm text-green-600">Rs. {seller.revenue.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-blue-500" /> Top Selling Ads
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {advancedAnalytics?.topProducts?.length === 0 && (
                      <div className="p-6 text-center text-gray-400 text-sm">No transaction data available.</div>
                    )}
                    {advancedAnalytics?.topProducts?.map((product, idx) => (
                      <div key={product.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                            {product.images && product.images[0] ? (
                              <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-gray-400" /></div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-gray-900 truncate pr-4">{product.title}</p>
                            <p className="text-xs text-gray-500">ID: {product.id} • {product.sales} sold</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-black text-sm text-green-600">Rs. {product.revenue.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* USERS */}
          <TabsContent value="users">
            <Card className="border-none shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-black">User Management</CardTitle>
                    <CardDescription>Manage roles and ban bad actors</CardDescription>
                  </div>
                  <Badge variant="outline">{filteredUsers.length} users</Badge>
                </div>
                <Input
                  placeholder="Search users by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="mt-3 max-w-sm h-9 text-sm"
                />
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-green-600" /></div>
                ) : (
                  <div className="space-y-3">
                    {filteredUsers.map((u: any) => (
                      <div key={u.id} className="border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900 text-sm">{u.name}</span>
                            <Badge variant="outline" className={`text-[10px] ${statusColor[u.status] || ""}`}>{u.status}</Badge>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                          <Badge variant="secondary" className="capitalize text-[10px] mt-1">{u.role?.replace("_", " ")}</Badge>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                          <Select
                            defaultValue={u.role}
                            onValueChange={(val) => updateRoleMutation.mutate({ userId: u.id, role: val as UserRole })}
                            disabled={u.id === ROOT_OWNER_ID}
                          >
                            <SelectTrigger className="w-36 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {["user", "seller", "csr", "sub_moderator", "moderator", "admin", "super_admin"].map(r => (
                                <SelectItem key={r} value={r} className="text-xs capitalize">{r.replace("_", " ")}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {u.status === "banned" ? (
                            <Button size="sm" variant="outline" className="h-8 text-xs text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => unbanMutation.mutate({ userId: u.id })}>
                              <UserCheck className="w-3.5 h-3.5 mr-1" />Unban
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                              disabled={u.id === ROOT_OWNER_ID}
                              onClick={() => banMutation.mutate({ userId: u.id, reason: "Admin action" })}>
                              <UserX className="w-3.5 h-3.5 mr-1" />Ban
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {filteredUsers.length === 0 && (
                      <div className="text-center py-12 text-gray-400">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No users found</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROFILES & DOCUMENTS */}
          <TabsContent value="profiles">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: User List */}
              <Card className="border-none shadow-md lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" /> All Users
                  </CardTitle>
                  <Input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="mt-2 h-9 text-sm"
                  />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y max-h-[600px] overflow-y-auto">
                    {(usersData?.users || [])
                      .filter((u: any) =>
                        u.name?.toLowerCase().includes(search.toLowerCase()) ||
                        u.email?.toLowerCase().includes(search.toLowerCase())
                      )
                      .map((u: any) => (
                        <button
                          key={u.id}
                          onClick={() => setSelectedUserId(u.id)}
                          className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-blue-50 transition-colors ${selectedUserId === u.id ? "bg-blue-50 border-l-4 border-blue-600" : ""}`}
                        >
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-black text-sm shrink-0">
                            {u.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm truncate">{u.name}</p>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <Badge variant="secondary" className="text-[9px] capitalize">{u.role?.replace("_"," ")}</Badge>
                            {u.isVerified
                              ? <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                              : <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />}
                          </div>
                        </button>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Right: Profile Detail + Documents */}
              <div className="lg:col-span-2 space-y-6">
                {!selectedUserId ? (
                  <Card className="border-none shadow-md">
                    <CardContent className="py-24 text-center">
                      <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-400 font-bold">Select a user on the left to view their full profile and documents.</p>
                    </CardContent>
                  </Card>
                ) : profileLoading ? (
                  <Card className="border-none shadow-md">
                    <CardContent className="py-24 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                    </CardContent>
                  </Card>
                ) : selectedUserProfile ? (
                  <>
                    {/* Profile Card */}
                    <Card className="border-none shadow-md overflow-hidden">
                      <div className="h-20 bg-gradient-to-r from-blue-600 to-blue-400" />
                      <CardContent className="-mt-10 pb-6">
                        <div className="flex items-end gap-4 mb-6">
                          <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-xl flex items-center justify-center text-blue-700 text-2xl font-black overflow-hidden">
                            {selectedUserProfile.user.avatar
                              ? <img src={selectedUserProfile.user.avatar} className="w-full h-full object-cover" alt="" />
                              : selectedUserProfile.user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="mb-2">
                            <h2 className="text-xl font-black text-gray-900">{selectedUserProfile.user.name}</h2>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary" className="capitalize text-xs">{selectedUserProfile.user.role?.replace("_"," ")}</Badge>
                              {selectedUserProfile.user.isVerified
                                ? <Badge className="bg-green-100 text-green-700 border-none text-[10px]"><ShieldCheck className="w-3 h-3 mr-1" />Verified ({selectedUserProfile.user.verificationLevel})</Badge>
                                : <Badge className="bg-amber-100 text-amber-700 border-none text-[10px]"><ShieldAlert className="w-3 h-3 mr-1" />Unverified</Badge>}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          {[
                            { icon: Mail, label: "Email", value: selectedUserProfile.user.email },
                            { icon: Phone, label: "Phone", value: selectedUserProfile.user.phone || "—" },
                            { icon: MapPin, label: "Location", value: selectedUserProfile.user.location || "—" },
                            { icon: Briefcase, label: "Business", value: selectedUserProfile.user.businessName || "—" },
                            { icon: FileText, label: "License #", value: selectedUserProfile.user.businessLicense || "—" },
                            { icon: Shield, label: "Status", value: selectedUserProfile.user.status },
                          ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="bg-gray-50 p-3 rounded-xl">
                              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                                <Icon className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
                              </div>
                              <p className="font-bold text-gray-900 text-sm truncate">{value}</p>
                            </div>
                          ))}
                        </div>

                        {selectedUserProfile.user.bio && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Bio</p>
                            <p className="text-sm text-gray-700">{selectedUserProfile.user.bio}</p>
                          </div>
                        )}

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-slate-50 p-3 rounded-xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Member Since</p>
                            <p className="font-bold text-gray-900">{new Date(selectedUserProfile.user.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Active Listings</p>
                            <p className="font-bold text-gray-900">{selectedUserProfile.listings.length}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Verification Documents */}
                    <Card className="border-none shadow-md">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-black flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-600" /> Verification Documents
                          <Badge className={`ml-auto text-[10px] ${
                            selectedUserProfile.verifications.length === 0 ? "bg-gray-100 text-gray-500" :
                            selectedUserProfile.verifications[0]?.status === "approved" ? "bg-green-100 text-green-700" :
                            selectedUserProfile.verifications[0]?.status === "rejected" ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-700"
                          }`}>
                            {selectedUserProfile.verifications.length === 0 ? "None Submitted" :
                              selectedUserProfile.verifications[0]?.status?.toUpperCase()}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedUserProfile.verifications.length === 0 ? (
                          <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <Shield className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400 font-bold text-sm">No verification documents submitted yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {selectedUserProfile.verifications.map((v: any) => {
                              const docData = typeof v.data === "string" ? JSON.parse(v.data) : v.data;
                              return (
                                <div key={v.id} className="border rounded-2xl overflow-hidden">
                                  <div className={`px-5 py-3 flex items-center justify-between ${
                                    v.status === "approved" ? "bg-green-50 border-b border-green-100" :
                                    v.status === "rejected" ? "bg-red-50 border-b border-red-100" :
                                    "bg-amber-50 border-b border-amber-100"
                                  }`}>
                                    <div className="flex items-center gap-2">
                                      <Badge className={`uppercase text-[10px] font-black ${v.type === "kyb" ? "bg-blue-600 text-white" : "bg-purple-600 text-white"} border-none`}>
                                        {v.type}
                                      </Badge>
                                      <span className="text-xs font-bold text-gray-600">
                                        Submitted {new Date(v.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    {v.status === "pending" && (
                                      <div className="flex items-center gap-2">
                                        <Input
                                          placeholder="Admin notes (optional)"
                                          value={adminNotes}
                                          onChange={(e) => setAdminNotes(e.target.value)}
                                          className="h-7 text-xs w-48"
                                        />
                                        <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                          onClick={() => reviewVerificationMutation.mutate({ submissionId: v.id, status: "approved", adminNotes })}>
                                          <CheckCircle2 className="w-3 h-3 mr-1" />Approve
                                        </Button>
                                        <Button size="sm" variant="destructive" className="h-7 text-xs"
                                          onClick={() => reviewVerificationMutation.mutate({ submissionId: v.id, status: "rejected", adminNotes })}>
                                          <XCircle className="w-3 h-3 mr-1" />Reject
                                        </Button>
                                      </div>
                                    )}
                                    {v.status !== "pending" && (
                                      <Badge variant="outline" className={`text-[10px] capitalize ${v.status === "approved" ? "text-green-600 border-green-300" : "text-red-600 border-red-300"}`}>
                                        {v.status}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="p-5 space-y-4">
                                    {/* Text fields */}
                                    {(() => {
                                      const textFields = Object.entries(docData).filter(([, v]: [string, any]) =>
                                        !(typeof v === 'string' && (v.startsWith('data:image') || v.startsWith('http') || v.startsWith('/')))
                                      );
                                      const imageFields = Object.entries(docData).filter(([, v]: [string, any]) =>
                                        typeof v === 'string' && (v.startsWith('data:image') || v.startsWith('http') || v.startsWith('/'))
                                      );
                                      return (
                                        <>
                                          {textFields.length > 0 && (
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                              {textFields.map(([key, val]: [string, any]) => (
                                                <div key={key} className="bg-gray-50 p-3 rounded-xl">
                                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">{key.replace(/([A-Z])/g, ' $1')}</p>
                                                  <p className="font-bold text-gray-900 text-sm break-words">{String(val)}</p>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {imageFields.length > 0 && (
                                            <div className={`grid gap-3 ${imageFields.length === 1 ? 'grid-cols-1 max-w-xs' : imageFields.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                              {imageFields.map(([key, val]: [string, any]) => (
                                                <div key={key} className="space-y-1.5">
                                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</p>
                                                  <button type="button" onClick={() => setSelectedImage(val as string)}
                                                    className="block w-full rounded-xl overflow-hidden border-2 border-slate-200 hover:border-blue-500 transition-all shadow-sm hover:shadow-lg group relative bg-slate-100">
                                                    <img src={val as string} alt={key} className="w-full h-40 object-cover"
                                                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center rounded-xl">
                                                      <div className="bg-white/90 px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1.5 text-xs font-bold text-gray-900">
                                                        <Eye className="w-3.5 h-3.5" /> View Full
                                                      </div>
                                                    </div>
                                                  </button>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                  {v.adminNotes && (
                                    <div className="px-5 pb-4">
                                      <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Admin Notes</p>
                                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl">{v.adminNotes}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                ) : null}
              </div>
            </div>
          </TabsContent>

          {/* VERIFICATIONS */}
          <TabsContent value="verifications">
             <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle className="text-base font-black">Pending Verification Requests</CardTitle>
                  <CardDescription>Review KYC (Individual) and KYB (Business) documents</CardDescription>
                </CardHeader>
                <CardContent>
                  {verLoading ? (
                    <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-green-600" /></div>
                  ) : (pendingVerifications?.submissions || []).length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>No pending verifications</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingVerifications?.submissions.map((sub: any) => (
                        <div key={sub.id} className="border rounded-xl bg-white overflow-hidden shadow-sm">
                          {/* Header */}
                          <div className="flex items-start justify-between p-4 border-b bg-gray-50">
                            <div>
                              <p className="font-bold text-gray-900">{sub.userName}</p>
                              <p className="text-xs text-gray-500">{sub.userEmail}</p>
                              <Badge className={`mt-2 uppercase text-[10px] ${sub.type === 'kyb' ? 'bg-blue-600' : 'bg-purple-600'} text-white border-none`}>{sub.type}</Badge>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex gap-2">
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 h-9 px-4"
                                  onClick={() => reviewVerificationMutation.mutate({ submissionId: sub.id, status: "approved" })}>
                                  <UserCheck className="w-3.5 h-3.5 mr-1.5" />Approve
                                </Button>
                                <Button size="sm" variant="destructive" className="h-9 px-4"
                                  onClick={() => reviewVerificationMutation.mutate({ submissionId: sub.id, status: "rejected", adminNotes: "Invalid documents" })}>
                                  <XCircle className="w-3.5 h-3.5 mr-1.5" />Reject
                                </Button>
                              </div>
                              <p className="text-[10px] text-gray-400">Submitted {new Date(sub.createdAt || Date.now()).toLocaleDateString()}</p>
                            </div>
                          </div>

                          {/* Documents Grid */}
                          <div className="p-4">
                            {/* Image documents (selfie, ID front/back) */}
                            {(() => {
                              const imageFields = Object.entries(sub.data || {}).filter(([, v]: [string, any]) =>
                                typeof v === 'string' && (v.startsWith('data:image') || v.startsWith('http') || v.startsWith('/'))
                              );
                              const textFields = Object.entries(sub.data || {}).filter(([, v]: [string, any]) =>
                                !(typeof v === 'string' && (v.startsWith('data:image') || v.startsWith('http') || v.startsWith('/')))
                              );
                              return (
                                <>
                                  {/* Text info */}
                                  {textFields.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                      {textFields.map(([key, value]: [string, any]) => (
                                        <div key={key} className="bg-slate-50 rounded-xl p-3">
                                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">{key.replace(/([A-Z])/g, ' $1')}</p>
                                          <p className="text-sm font-bold text-gray-900 break-words">{String(value)}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Image documents */}
                                  {imageFields.length > 0 && (
                                    <div className={`grid gap-3 ${imageFields.length === 1 ? 'grid-cols-1 max-w-xs' : imageFields.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                      {imageFields.map(([key, value]: [string, any]) => (
                                        <div key={key} className="space-y-1.5">
                                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</p>
                                          <button type="button" onClick={() => setSelectedImage(value as string)}
                                            className="block w-full rounded-xl overflow-hidden border-2 border-slate-200 hover:border-green-500 transition-all shadow-sm hover:shadow-lg group relative bg-slate-100">
                                            <img
                                              src={value as string}
                                              alt={key}
                                              className="w-full h-40 object-cover"
                                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center rounded-xl">
                                              <div className="bg-white/90 px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1.5 text-xs font-bold text-gray-900">
                                                <Eye className="w-3.5 h-3.5" /> View Full
                                              </div>
                                            </div>
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
             </Card>
          </TabsContent>

          {/* FLAGGED CONTENT */}
          <TabsContent value="flagged">
            <Card className="border-none shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-black">Pending / Flagged Listings</CardTitle>
                <CardDescription>Review and approve or reject listings requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                {flaggedLoading ? (
                  <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-green-600" /></div>
                ) : (flaggedData?.listings || []).length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400 opacity-60" />
                    <p className="text-gray-500 font-semibold">All clear! No pending listings.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(flaggedData?.listings || []).map((listing: any) => (
                      <div key={listing.flagId} className="border rounded-xl p-4 bg-white flex flex-col md:flex-row md:items-center gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {listing.images?.[0] ? (
                            <img src={listing.images[0]} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://picsum.photos/seed/listing/100/100"; }} />
                          ) : <Package className="w-8 h-8 m-auto mt-4 text-gray-300" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-gray-900 line-clamp-1">{listing.title}</p>
                          <p className="text-[10px] text-red-600 font-bold uppercase tracking-tight mb-1">Reason: {listing.reason}</p>
                          <p className="text-xs text-gray-500">{listing.location || "Nepal"} · NPR {(listing.price || 0).toLocaleString()}</p>
                          <Badge variant="outline" className="text-[10px] mt-1 text-yellow-600 border-yellow-200 bg-yellow-50">{listing.flagStatus}</Badge>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => approveListingMutation.mutate({ listingId: String(listing.listingId) })}>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Approve
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => rejectListingMutation.mutate({ listingId: String(listing.listingId), reason: "Policy violation" })}>
                            <XCircle className="w-3.5 h-3.5 mr-1" />Reject
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 text-xs text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                            onClick={() => featureMutation.mutate({ listingId: listing.listingId, isFeatured: true, durationDays: 7 })}>
                            <Zap className="w-3.5 h-3.5 mr-1" />Feature
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finance">
            <div className="space-y-6">
               {/* Advanced Amazon-style Summary */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-none shadow-md bg-green-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <TrendingUp className="w-8 h-8 opacity-20" />
                        <Badge className="bg-white/20 text-white border-none">MTD Growth</Badge>
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wider opacity-80">Gross Sales Volume</p>
                      <p className="text-3xl font-black">NPR {advancedFinance?.summary.totalRevenue?.toLocaleString() ?? "0"}</p>
                      <div className="mt-4 flex items-center gap-1 text-xs opacity-80">
                        <TrendingUp className="w-3 h-3" />
                        <span>+12.5% from last month</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4 text-orange-600">
                        <DollarSign className="w-8 h-8 opacity-20" />
                        <Badge variant="outline" className="text-orange-600 border-orange-200">Processing Fees</Badge>
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Platform Revenue (Commission)</p>
                      <p className="text-3xl font-black text-gray-900">NPR {advancedFinance?.summary.totalFees?.toLocaleString() ?? "0"}</p>
                      <p className="mt-4 text-xs text-gray-500 font-medium">Avg fee: 8.5% per transaction</p>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4 text-blue-600">
                        <Package className="w-8 h-8 opacity-20" />
                        <Badge variant="outline" className="text-blue-600 border-blue-200">Orders</Badge>
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Completed Transactions</p>
                      <p className="text-3xl font-black text-gray-900">{advancedFinance?.summary.orderCount?.toLocaleString() ?? "0"}</p>
                      <p className="mt-4 text-xs text-gray-500 font-medium">Daily avg: {((advancedFinance?.summary.orderCount || 0) / 30).toFixed(1)} orders</p>
                    </CardContent>
                  </Card>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Revenue Trend Chart */}
                  <Card className="border-none shadow-md">
                    <CardHeader>
                      <CardTitle className="text-base font-black">Revenue Performance Trend</CardTitle>
                      <CardDescription>Daily gross sales volume for the last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={advancedFinance?.dailyTrends}>
                          <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                          <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `NPR ${val >= 1000 ? (val/1000).toFixed(1)+'k' : val}`} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(val: any) => [`NPR ${val.toLocaleString()}`, 'Revenue']}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Category Performance */}
                  <Card className="border-none shadow-md">
                    <CardHeader>
                      <CardTitle className="text-base font-black">Sales by Category</CardTitle>
                      <CardDescription>Highest revenue generating categories</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={advancedFinance?.categoryStats} layout="vertical">
                           <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} />
                           <XAxis type="number" hide />
                           <YAxis dataKey="categoryName" type="category" fontSize={10} width={80} axisLine={false} tickLine={false} />
                           <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(val: any) => [`NPR ${val.toLocaleString()}`, 'Sales']}
                           />
                           <Bar dataKey="totalSales" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
               </div>

               {/* Detailed Transaction Log */}
               <Card className="border-none shadow-md">
                 <CardHeader className="flex flex-row items-center justify-between">
                   <div>
                     <CardTitle className="text-base font-black">Transaction Ledger</CardTitle>
                     <CardDescription>Amazon-style detailed reporting</CardDescription>
                   </div>
                   <Button variant="outline" size="sm" className="text-xs" onClick={downloadCSV}>
                     <Download className="w-3.5 h-3.5 mr-2" />Export Ledger
                   </Button>
                 </CardHeader>
                 <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b text-gray-400 uppercase tracking-widest">
                            <th className="text-left py-4 px-3 font-bold">Transaction ID</th>
                            <th className="text-left py-4 px-3 font-bold">Type</th>
                            <th className="text-right py-4 px-3 font-bold">Gross Amount</th>
                            <th className="text-right py-4 px-3 font-bold">Fee</th>
                            <th className="text-right py-4 px-3 font-bold">Net</th>
                            <th className="text-center py-4 px-3 font-bold">Status</th>
                            <th className="text-right py-4 px-3 font-bold">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(advancedFinance?.recentTransactions || []).map((t: any) => (
                            <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                              <td className="py-4 px-3 font-mono text-gray-500">TXN-{t.id.toString().padStart(6, '0')}</td>
                              <td className="py-4 px-3 font-bold text-gray-900 capitalize">{t.transactionType}</td>
                              <td className="py-4 px-3 text-right font-black text-gray-900">NPR {t.amount?.toLocaleString() ?? "0"}</td>
                              <td className="py-4 px-3 text-right text-red-500">-NPR {t.platformFee?.toLocaleString() ?? "0"}</td>
                              <td className="py-4 px-3 text-right font-black text-green-600">NPR {t.netAmount?.toLocaleString() ?? "0"}</td>
                              <td className="py-4 px-3 text-center">
                                <Badge className={t.status === 'completed' ? 'bg-green-100 text-green-700 border-none' : 'bg-yellow-100 text-yellow-700 border-none'}>
                                  {t.status}
                                </Badge>
                              </td>
                              <td className="py-4 px-3 text-right text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </CardContent>
               </Card>
            </div>
          </TabsContent>

          <TabsContent value="rbac">
            <div className="space-y-6">
              <Card className="border-none shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-black">Role-Based Access Control</CardTitle>
                      <CardDescription>Define what each role can do across the platform</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => utils.rbac.getRoles.invalidate()}>
                      <Settings2 className="w-3.5 h-3.5 mr-2" />Refresh Rules
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {rolesLoading || permsLoading ? (
                    <div className="py-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-green-600" /></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest min-w-[200px]">Permission</th>
                            {(rbacRoles || []).map(role => (
                              <th key={role.id} className="p-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest min-w-[100px]">
                                {role.name.replace("_", " ")}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(allPermissions || []).map(perm => (
                            <tr key={perm.id} className="border-b hover:bg-gray-50/50 transition">
                              <td className="p-4">
                                <p className="text-sm font-bold text-gray-900">{perm.name.replace("_", " ")}</p>
                                <p className="text-[10px] text-gray-400">{perm.description}</p>
                                <Badge variant="outline" className="text-[9px] mt-1 opacity-60">{perm.category}</Badge>
                              </td>
                              {(rbacRoles || []).map(role => {
                                const hasPerm = role.permissions.some((p: any) => p.name === perm.name);
                                return (
                                  <td key={role.id} className="p-4 text-center">
                                    <Switch
                                      checked={hasPerm}
                                      onCheckedChange={(checked) => togglePermMutation.mutate({
                                        roleId: role.id,
                                        permissionId: perm.id,
                                        active: checked
                                      })}
                                      disabled={role.name === 'super_admin'} // Super admin always has all perms usually, or just protect it
                                    />
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-none shadow-md bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2"><Lock className="w-4 h-4 text-blue-600" />Security Note</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Changes to permissions take effect immediately for all users. Be careful when removing core permissions like <b>post_listing</b> from established business roles.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-amber-50">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2"><Unlock className="w-4 h-4 text-amber-600" />Super Admin Access</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Super Admins bypass all permission checks by default. Toggling permissions for the Super Admin role is disabled for safety.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* BRAND SETTINGS */}
          <TabsContent value="brand_settings">
            <Card className="border-none shadow-md bg-white">
              <CardHeader>
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-green-600" />
                  Dynamic Company Settings
                </CardTitle>
                <CardDescription>
                  Modify the central corporate contact info, location, and corporate email live.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Support Email</label>
                    <Input 
                      type="email" 
                      value={companyEmail} 
                      onChange={(e) => setCompanyEmail(e.target.value)} 
                      placeholder="support@sasto.com"
                      className="rounded-xl border-gray-250 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Direct Phone Support</label>
                    <Input 
                      type="text" 
                      value={companyPhone} 
                      onChange={(e) => setCompanyPhone(e.target.value)} 
                      placeholder="+977-1-4123456"
                      className="rounded-xl border-gray-250 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Corporate Location</label>
                    <Input 
                      type="text" 
                      value={companyLocation} 
                      onChange={(e) => setCompanyLocation(e.target.value)} 
                      placeholder="New Baneshwor, Kathmandu"
                      className="rounded-xl border-gray-250 font-semibold"
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <Button 
                    disabled={updateConfigMutation.isPending}
                    onClick={() => {
                      if (!companyEmail || !companyPhone || !companyLocation) {
                        toast.error("Please fill all configuration details.");
                        return;
                      }
                      updateConfigMutation.mutate({
                        email: companyEmail,
                        phone: companyPhone,
                        location: companyLocation,
                      });
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold h-11 px-6 shadow-md"
                  >
                    {updateConfigMutation.isPending ? "Saving Settings..." : "Save Settings Live"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {user.role === "super_admin" && (
              <TabsContent value="payments">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-none shadow-md bg-white">
                    <CardHeader>
                      <CardTitle className="text-base font-black flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        Platform Commission
                      </CardTitle>
                      <CardDescription>Set the global platform fee percentage taken from every transaction.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Commission Rate (%)</label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={companyCommissionRate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCompanyCommissionRate(val === "" ? 0 : parseFloat(val));
                          }}
                          className="rounded-xl border-gray-250 font-semibold"
                        />
                      </div>
                      <Button 
                        disabled={updateConfigMutation.isPending}
                        onClick={() => {
                          updateConfigMutation.mutate({
                            commissionRate: companyCommissionRate,
                          });
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold h-11 px-6 shadow-md"
                      >
                        {updateConfigMutation.isPending ? "Saving..." : "Save Commission"}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-md bg-white">
                    <CardHeader>
                      <CardTitle className="text-base font-black flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-blue-600" />
                        Payment Gateways
                      </CardTitle>
                      <CardDescription>Enable or configure payment APIs (eSewa, Khalti, Visa, etc.)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {paymentGateways?.map((gw) => (
                        <div key={gw.id} className="border border-gray-100 p-4 rounded-xl space-y-3 bg-gray-50/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-sm text-gray-800">{gw.displayName}</p>
                              <p className="text-xs text-gray-500 font-medium">Gateway: {gw.name}</p>
                            </div>
                            <Switch
                              checked={editingGateways[gw.name]?.isActive || false}
                              onCheckedChange={(val) => {
                                setEditingGateways(prev => ({
                                  ...prev,
                                  [gw.name]: { ...prev[gw.name], isActive: val }
                                }));
                                updateGatewayMutation.mutate({ gatewayName: gw.name, config: { isActive: val } });
                              }}
                            />
                          </div>
                          <div className="space-y-2 pt-2 border-t border-gray-200">
                            <Input
                              placeholder="API Key"
                              value={editingGateways[gw.name]?.apiKey || ""}
                              onChange={(e) => {
                                setEditingGateways(prev => ({
                                  ...prev,
                                  [gw.name]: { ...prev[gw.name], apiKey: e.target.value }
                                }));
                              }}
                              className="h-9 text-xs"
                            />
                            <Input
                              placeholder="API Secret"
                              type="password"
                              value={editingGateways[gw.name]?.apiSecret || ""}
                              onChange={(e) => {
                                setEditingGateways(prev => ({
                                  ...prev,
                                  [gw.name]: { ...prev[gw.name], apiSecret: e.target.value }
                                }));
                              }}
                              className="h-9 text-xs"
                            />
                            <Input
                              placeholder="Merchant ID"
                              value={editingGateways[gw.name]?.merchantId || ""}
                              onChange={(e) => {
                                setEditingGateways(prev => ({
                                  ...prev,
                                  [gw.name]: { ...prev[gw.name], merchantId: e.target.value }
                                }));
                              }}
                              className="h-9 text-xs"
                            />
                            <Button
                              size="sm"
                              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                              onClick={() => {
                                const current = editingGateways[gw.name];
                                updateGatewayMutation.mutate({ 
                                  gatewayName: gw.name, 
                                  config: {
                                    apiKey: current.apiKey,
                                    apiSecret: current.apiSecret,
                                    merchantId: current.merchantId,
                                    isActive: current.isActive
                                  }
                                });
                              }}
                              disabled={updateGatewayMutation.isPending}
                            >
                              Save {gw.displayName} API
                            </Button>
                          </div>
                        </div>
                      ))}
                      {!paymentGateways?.length && (
                        <div className="text-sm text-gray-500">No payment gateways found in database.</div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}

          {/* LOGISTICS PARTNERS */}
          {user.role === "super_admin" && (
            <TabsContent value="logistics">
              <div className="space-y-6">
                <Card className="border-none shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <Truck className="w-5 h-5 text-blue-500" />
                      Logistics Partners Integrations
                    </CardTitle>
                    <CardDescription>Configure webhook endpoints and API keys for delivery partners.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-blue-900 text-sm">Webhook Configuration</h4>
                        <p className="text-xs text-blue-700 mt-1">
                          Share this endpoint with your logistics partners (Upaya, Pathao, NCM, etc.) so they can push status updates to Sasto:
                        </p>
                        <code className="block mt-2 bg-white px-3 py-2 rounded-lg border border-blue-100 text-xs font-mono text-blue-900 break-all">
                          POST https://yourdomain.com/api/webhooks/logistics
                        </code>
                        <p className="text-[10px] text-blue-600 mt-1">
                          Requires payload with `tracking_number` and `status` fields.
                        </p>
                      </div>
                    </div>
                    
                    {/* Add new partner */}
                    <div className="flex gap-4 items-end border-b pb-6">
                      <div className="flex-1">
                        <label className="text-xs font-bold text-gray-700 mb-1 block">Internal Code (e.g., upaya, pathao)</label>
                        <Input 
                          placeholder="pathao" 
                          value={newPartnerName} 
                          onChange={(e) => setNewPartnerName(e.target.value)} 
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-bold text-gray-700 mb-1 block">Display Name (e.g., Pathao Parcel)</label>
                        <Input 
                          placeholder="Pathao Parcel" 
                          value={newPartnerDisplayName} 
                          onChange={(e) => setNewPartnerDisplayName(e.target.value)} 
                        />
                      </div>
                      <Button
                        onClick={() => addLogisticsPartnerMutation.mutate({
                          name: newPartnerName,
                          displayName: newPartnerDisplayName
                        })}
                        disabled={!newPartnerName || !newPartnerDisplayName || addLogisticsPartnerMutation.isPending}
                      >
                        Add Partner
                      </Button>
                    </div>

                    {/* List existing partners */}
                    <div className="space-y-4 mt-6">
                      <h4 className="font-bold text-sm">Configured Partners</h4>
                      {logisticsPartners?.map((partner) => (
                        <div key={partner.id} className="p-4 border rounded-xl bg-gray-50 flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900">{partner.displayName}</span>
                              <Badge variant={partner.isActive ? "default" : "secondary"}>
                                {partner.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-600">Active Status</span>
                                <Switch
                                  checked={partner.isActive || false}
                                  onCheckedChange={(checked) => updateLogisticsPartnerMutation.mutate({
                                    id: partner.id,
                                    isActive: checked
                                  })}
                                />
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteLogisticsPartnerMutation.mutate({ id: partner.id })}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-bold text-gray-700 mb-1 block">Tracking URL Format</label>
                              <Input
                                placeholder="https://pathao.com/tracking?id={{tracking_number}}"
                                defaultValue={partner.trackingUrlFormat || ""}
                                onBlur={(e) => updateLogisticsPartnerMutation.mutate({
                                  id: partner.id,
                                  trackingUrlFormat: e.target.value
                                })}
                              />
                              <p className="text-[10px] text-gray-500 mt-1">Use `{"{{tracking_number}}"}` as placeholder</p>
                            </div>
                            <div>
                              <label className="text-xs font-bold text-gray-700 mb-1 block">API Key (Optional for outgoing)</label>
                              <Input
                                placeholder="sk_test_..."
                                type="password"
                                defaultValue={partner.apiKey || ""}
                                onBlur={(e) => updateLogisticsPartnerMutation.mutate({
                                  id: partner.id,
                                  apiKey: e.target.value
                                })}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {!logisticsPartners?.length && (
                        <p className="text-sm text-gray-500">No logistics partners configured.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* COMPLAINTS INBOX */}
          <TabsContent value="complaints_inbox">
            <Card className="border-none shadow-md bg-white">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <Flag className="w-5 h-5 text-red-500" />
                    Complaints & Support Ticket Inbox
                  </CardTitle>
                  <CardDescription>
                    Review scams, counterfeiting listings, and corporate support complaints from Sasto users.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchReports()}>
                  <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />Refresh List
                </Button>
              </CardHeader>
              <CardContent>
                {!reports || reports.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 font-bold border-2 border-dashed border-gray-100 rounded-3xl">
                    <CheckCircle2 className="w-12 h-12 text-green-500/80 mx-auto mb-2" />
                    Zero unresolved complaints ticket. Everything's clean!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reports.map((t) => (
                      <Card key={t.id} className={`p-5 rounded-2xl border-none shadow-md relative ${t.status === 'resolved' ? 'bg-gray-50/70 opacity-80' : 'bg-red-50/30'}`}>
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <Badge className={t.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                              {t.status.toUpperCase()}
                            </Badge>
                            <h3 className="font-black text-gray-800 text-base mt-1.5">{t.subject}</h3>
                            <p className="text-[11px] text-gray-400">From: <b>{t.reporterName || "Anonymous"}</b> ({t.reporterEmail})</p>
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium shrink-0">{new Date(t.createdAt).toLocaleDateString()}</span>
                        </div>

                        <p className="text-xs text-gray-650 mt-3 leading-relaxed font-medium bg-white/70 p-3 rounded-xl border border-gray-100">{t.description}</p>

                        {t.status === 'resolved' ? (
                          <div className="mt-3 text-xs text-green-700 font-semibold bg-green-50/50 p-2.5 rounded-xl border border-green-100">
                            <b>Resolved Notes:</b> {t.adminNotes || "Resolved successfully with standard moderation review."}
                          </div>
                        ) : (
                          <div className="mt-4 flex gap-2 items-center">
                            <Input 
                              placeholder="Add resolution details..." 
                              value={selectedReportId === t.id ? resolveNotes : ""}
                              onChange={(e) => {
                                setSelectedReportId(t.id);
                                setResolveNotes(e.target.value);
                              }}
                              className="h-9 text-xs rounded-xl bg-white border-gray-200"
                            />
                            <Button 
                              size="sm" 
                              onClick={() => {
                                resolveReportMutation.mutate({
                                  id: t.id,
                                  adminNotes: selectedReportId === t.id ? resolveNotes : "Standard resolution verification done."
                                });
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs h-9 font-bold px-3 shrink-0"
                            >
                              Resolve
                            </Button>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* JOB MANAGER */}
          <TabsContent value="job_manager">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Post job form */}
              <Card className="lg:col-span-1 border-none shadow-md bg-white">
                <CardHeader>
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-green-600" />
                    Post Career Ad
                  </CardTitle>
                  <CardDescription>Create a live vacancy post instantly</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Job Title</label>
                    <Input 
                      placeholder="e.g. Senior Backend Engineer" 
                      value={careerTitle} 
                      onChange={(e) => setCareerTitle(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-500 uppercase">Department</label>
                      <select 
                        value={careerDept} 
                        onChange={(e) => setCareerDept(e.target.value)}
                        className="w-full h-10 px-2 rounded-xl border border-gray-200 text-xs font-bold"
                      >
                        <option>Engineering</option>
                        <option>Marketing</option>
                        <option>Operations</option>
                        <option>Security</option>
                        <option>HR</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-500 uppercase">Job Type</label>
                      <select 
                        value={careerType} 
                        onChange={(e) => setCareerType(e.target.value)}
                        className="w-full h-10 px-2 rounded-xl border border-gray-200 text-xs font-bold"
                      >
                        <option>Full-Time</option>
                        <option>Part-Time</option>
                        <option>Contract</option>
                        <option>Internship</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Work Location</label>
                    <Input 
                      placeholder="e.g. Kathmandu (Hybrid)" 
                      value={careerLoc} 
                      onChange={(e) => setCareerLoc(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Salary Range</label>
                    <Input 
                      placeholder="e.g. NPR 120K - 180K / month" 
                      value={careerSalary} 
                      onChange={(e) => setCareerSalary(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Description</label>
                    <Textarea 
                      placeholder="Job details, roles & responsibilities..." 
                      value={careerDesc} 
                      onChange={(e) => setCareerDesc(e.target.value)}
                      className="text-xs rounded-xl min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Requirements (Optional)</label>
                    <Textarea 
                      placeholder="Requirements & skills..." 
                      value={careerReqs} 
                      onChange={(e) => setCareerReqs(e.target.value)}
                      className="text-xs rounded-xl min-h-[80px]"
                    />
                  </div>
                  <Button 
                    disabled={createCareerMutation.isPending}
                    onClick={() => {
                      if (!careerTitle || !careerLoc || !careerSalary || !careerDesc) {
                        toast.error("Please fill in all required job posting fields.");
                        return;
                      }
                      createCareerMutation.mutate({
                        title: careerTitle,
                        department: careerDept,
                        location: careerLoc,
                        salaryRange: careerSalary,
                        type: careerType,
                        description: careerDesc,
                        requirements: careerReqs,
                      });
                    }}
                    className="w-full bg-slate-900 hover:bg-black text-white rounded-xl h-11 text-xs font-bold pt-0.5 shadow-md mt-2"
                  >
                    {createCareerMutation.isPending ? "Posting Opening..." : "Post Job Ad Live"}
                  </Button>
                </CardContent>
              </Card>

              {/* Active Jobs list */}
              <Card className="lg:col-span-2 border-none shadow-md bg-white">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-black">Active Career Ads</CardTitle>
                    <CardDescription>Take down or archive currently active job postings</CardDescription>
                  </div>
                  <Badge variant="secondary" className="font-bold text-[10px]">{careers?.length || 0} Vacancies</Badge>
                </CardHeader>
                <CardContent>
                  {!careers || careers.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 font-bold border-2 border-dashed border-gray-100 rounded-3xl">
                      No active job advertisements right now. Use the form to post one!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {careers.map((job) => (
                        <div key={job.id} className="border rounded-2xl p-4 flex items-center justify-between gap-4 bg-gray-50/50 hover:bg-gray-50 transition">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 text-[9px] font-bold">{job.department}</Badge>
                              <Badge variant="outline" className="text-[9px] font-bold text-gray-400">{job.type}</Badge>
                            </div>
                            <h4 className="font-black text-gray-800 text-sm">{job.title}</h4>
                            <p className="text-[10px] text-gray-400 font-semibold">{job.location} | {job.salaryRange}</p>
                          </div>
                          <Button 
                            variant="destructive"
                            size="sm"
                            disabled={archiveCareerMutation.isPending}
                            onClick={() => archiveCareerMutation.mutate({ id: job.id })}
                            className="rounded-xl text-xs h-9 px-3 font-bold"
                          >
                            Archive Ad
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          {/* CSR SUPPORT DESK */}
          <TabsContent value="support_desk">
            <Card className="border-none shadow-xl bg-white overflow-hidden rounded-3xl h-[650px] flex flex-col md:flex-row">
              {/* Left sidebar: Conversations list */}
              <div className={`w-full md:w-80 border-r border-gray-100 flex-col h-full bg-slate-50/30 ${activeChatUserId ? "hidden md:flex" : "flex"}`}>
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                  <h3 className="font-black text-gray-800 text-sm uppercase tracking-wider flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    Support Queue
                  </h3>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full" onClick={() => refetchChats()}>
                    <RefreshCw className="w-3.5 h-3.5 text-gray-500 hover:rotate-180 transition-all duration-300" />
                  </Button>
                </div>
                
                {/* Scrollable list */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {!supportChats || supportChats.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400 font-bold">
                      Zero support messages. Excellent queue management!
                    </div>
                  ) : (
                    supportChats.map((c) => {
                      const isActive = activeChatUserId === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => setActiveChatUserId(c.id)}
                          className={`p-3 rounded-2xl cursor-pointer transition flex items-center gap-3 ${isActive ? 'bg-emerald-600 text-white shadow-lg' : 'hover:bg-slate-100/80 bg-white'}`}
                        >
                          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-xs shrink-0">
                            {c.user.name?.substring(0, 2).toUpperCase() || "US"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <h4 className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-gray-800'}`}>{c.user.name || "A Customer"}</h4>
                              <span className={`text-[8px] ${isActive ? 'text-white/80' : 'text-gray-400'}`}>{new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className={`text-[10px] truncate ${isActive ? 'text-white/90' : 'text-gray-400'} font-medium mt-0.5`}>
                              {c.lastMessage.content}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right panel: Active Chat Room */}
              <div className={`flex-1 flex-col h-full bg-white relative ${!activeChatUserId ? "hidden md:flex" : "flex"}`}>
                {activeChatUserId ? (
                  <>
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
                      <Button variant="ghost" size="sm" className="md:hidden p-1.5 h-auto rounded-full" onClick={() => setActiveChatUserId(null)}>
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                      </Button>
                      <div className="w-10 h-10 rounded-full bg-slate-150 text-slate-700 font-black flex items-center justify-center text-sm">
                        {supportChats?.find(c => c.id === activeChatUserId)?.user.name?.substring(0, 2).toUpperCase() || "US"}
                      </div>
                      <div>
                        <h4 className="font-black text-gray-800 text-sm">
                          {supportChats?.find(c => c.id === activeChatUserId)?.user.name || "Customer Helpdesk Ticket"}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-bold">{supportChats?.find(c => c.id === activeChatUserId)?.user.email || ""}</p>
                      </div>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                      {(supportMessages || []).map((msg) => {
                        const isSupportMsg = msg.senderId === 1;
                        return (
                          <div key={msg.id} className={`flex ${isSupportMsg ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${isSupportMsg ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-gray-850 rounded-tl-none border border-gray-100'}`}>
                              {msg.attachmentUrl && (
                                <div className="mb-2">
                                  {msg.attachmentType === "image" ? (
                                    <div className="relative group overflow-hidden rounded-xl border border-black/5 bg-black/5 max-w-full">
                                      <img
                                        src={msg.attachmentUrl || undefined}
                                        alt="Attachment"
                                        className="max-h-60 max-w-full object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-200"
                                        onClick={() => window.open(msg.attachmentUrl || undefined, "_blank")}
                                      />
                                    </div>
                                  ) : (
                                    <a
                                      href={msg.attachmentUrl || undefined}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                                        isSupportMsg
                                          ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-white"
                                          : "bg-gray-50 hover:bg-gray-150 border-gray-150 text-gray-800"
                                      }`}
                                    >
                                      <div className={`p-2 rounded-lg ${isSupportMsg ? "bg-slate-700" : "bg-emerald-100 text-emerald-600"}`}>
                                        <FileText className="w-5 h-5" />
                                      </div>
                                      <div className="flex-1 min-w-0 text-left">
                                        <p className="text-[11px] font-bold truncate">
                                          {msg.attachmentUrl.split("/").pop() || "Document"}
                                        </p>
                                        <p className="text-[9px] opacity-75">
                                          Click to download
                                        </p>
                                      </div>
                                    </a>
                                  )}
                                </div>
                              )}
                              {!(msg.attachmentUrl && (msg.content === "Sent a photo" || msg.content === "Sent a file")) && (
                                <p>{msg.content}</p>
                              )}
                              <span className={`text-[8px] block text-right mt-1.5 ${isSupportMsg ? 'text-white/70' : 'text-gray-400'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Support Attachment Previews */}
                    {(supportAttachmentUrl || isSupportUploading) && (
                      <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-3 bg-white">
                        {isSupportUploading ? (
                          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100 animate-pulse">
                            <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                            Uploading attachment...
                          </div>
                        ) : (
                          <div className="relative flex items-center gap-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 group max-w-xs shadow-sm">
                            {supportAttachmentType === "image" ? (
                              <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-150 flex-shrink-0">
                                <img src={supportAttachmentUrl || undefined} alt="Preview" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0 text-left pr-4">
                              <p className="text-[10px] font-bold text-slate-700 truncate">{supportAttachmentName || "Attachment"}</p>
                              <p className="text-[8px] text-slate-400 capitalize">{supportAttachmentType}</p>
                            </div>
                            <button
                              onClick={handleSupportRemoveAttachment}
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 hover:bg-red-655 text-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer Reply Form */}
                    <div className="p-4 border-t border-gray-100 shrink-0 bg-white flex flex-col gap-2">
                      <div className="flex gap-2 items-center w-full">
                        <input
                          type="file"
                          ref={supportFileInputRef}
                          className="hidden"
                          onChange={handleSupportFileChange}
                          accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                        />
                        
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={isSupportUploading || sendSupportReplyMutation.isPending}
                          onClick={() => supportFileInputRef.current?.click()}
                          className="p-2 h-11 w-11 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 active:scale-95 flex-shrink-0 flex items-center justify-center border border-gray-200"
                          title="Add attachment"
                        >
                          <Paperclip className="w-4 h-4" />
                        </Button>

                        <Input
                          placeholder="Write support reply on behalf of Sasto Support..."
                          value={chatReplyContent}
                          onChange={(e) => setChatReplyContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (chatReplyContent.trim() || supportAttachmentUrl)) {
                              sendSupportReplyMutation.mutate({
                                userId: activeChatUserId,
                                content: chatReplyContent.trim() || (supportAttachmentType === "image" ? "Sent a photo" : "Sent a file"),
                                attachmentUrl: supportAttachmentUrl || undefined,
                                attachmentType: supportAttachmentType || undefined,
                              });
                            }
                          }}
                          className="rounded-xl h-11 text-xs border-gray-250 font-medium"
                        />
                        
                        <Button
                          disabled={(!chatReplyContent.trim() && !supportAttachmentUrl) || isSupportUploading || sendSupportReplyMutation.isPending}
                          onClick={() => {
                            sendSupportReplyMutation.mutate({
                              userId: activeChatUserId,
                              content: chatReplyContent.trim() || (supportAttachmentType === "image" ? "Sent a photo" : "Sent a file"),
                              attachmentUrl: supportAttachmentUrl || undefined,
                              attachmentType: supportAttachmentType || undefined,
                            });
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-4 rounded-xl text-xs shrink-0"
                        >
                          Send Reply
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <Mail className="w-16 h-16 text-slate-200" />
                    <h3 className="text-base font-black text-slate-700">Sasto Live Helpdesk Queue</h3>
                    <p className="text-xs text-slate-400 max-w-sm leading-relaxed font-semibold">
                      Select a customer support conversation from the left queue sidebar to respond, assist, and claim active customer tickets.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* SPONSORED ADS */}
          <TabsContent value="sponsored">
            <div className="space-y-12 bg-white/70 backdrop-blur-md p-6 md:p-10 rounded-[32px] border border-gray-100/80 shadow-xl animate-in fade-in duration-500">
              
              {/* Section 1: Pricing Tiers */}
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-inner">
                    <Settings2 className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-950 tracking-tight">Pricing & Plan Configurations</h2>
                    <p className="text-sm text-gray-500 font-medium">Set the NPR price, slot duration, and visibility limits for Basic, Standard, and Premium packages.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {pricingQuery.isLoading && [1,2,3].map(i => (
                    <div key={i} className="h-64 bg-gray-50/50 border border-gray-100 rounded-3xl animate-pulse" />
                  ))}
                  {(pricingQuery.data ?? []).map((tier: any) => {
                    const icons: Record<string, any> = { basic: Sparkles, standard: Rocket, premium: Crown };
                    const gradients: Record<string, string> = {
                      basic: "from-blue-600 via-indigo-600 to-indigo-700 shadow-blue-100/40",
                      standard: "from-purple-600 via-violet-600 to-indigo-800 shadow-purple-100/40",
                      premium: "from-amber-500 via-orange-500 to-red-600 shadow-amber-100/40",
                    };
                    const badgeStyles: Record<string, string> = {
                      basic: "bg-blue-500/20 text-blue-100 border-blue-400/20",
                      standard: "bg-purple-500/20 text-purple-100 border-purple-400/20",
                      premium: "bg-amber-500/20 text-amber-100 border-amber-400/20",
                    };
                    const TierIcon = icons[tier.tier] || Sparkles;
                    const editing = editingPricing[tier.tier];
                    const hasChanges = editing !== undefined && (editing.priceNPR !== tier.priceNPR || editing.durationDays !== tier.durationDays || editing.maxSlots !== tier.maxSlots);
                    
                    return (
                      <Card key={tier.tier} className="border border-gray-100 shadow-lg rounded-[28px] overflow-hidden bg-white hover:shadow-xl transition-all duration-300 group flex flex-col justify-between">
                        <div>
                          {/* Card Header Banner */}
                          <div className={`bg-gradient-to-br ${gradients[tier.tier]} p-6 text-white relative overflow-hidden shadow-lg`}>
                            {/* Decorative background shape */}
                            <div className="absolute right-0 bottom-0 w-24 h-24 bg-white/10 rounded-full translate-x-8 translate-y-8 blur-sm pointer-events-none group-hover:scale-125 transition-transform duration-500" />
                            
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
                                  <TierIcon className="w-5 h-5 text-white fill-white/25" />
                                </div>
                                <span className="font-black text-xl tracking-tight capitalize">{tier.tier}</span>
                              </div>
                              <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider border ${badgeStyles[tier.tier]}`}>
                                {tier.tier === "premium" ? "Premium Spotlight" : "Featured Ad"}
                              </span>
                            </div>
                            <p className="text-white/80 text-xs font-semibold leading-relaxed pr-6 mt-2">{tier.description || `${tier.durationDays} days visibility boost`}</p>
                          </div>

                          {/* Card Body Configurations */}
                          <div className="p-6 space-y-4">
                            <div>
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Package Price (NPR)</label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400 text-sm">NPR</span>
                                <Input
                                  type="number"
                                  value={editing?.priceNPR ?? tier.priceNPR}
                                  onChange={e => setEditingPricing(prev => ({ 
                                    ...prev, 
                                    [tier.tier]: { 
                                      priceNPR: parseInt(e.target.value)||0, 
                                      durationDays: editing?.durationDays ?? tier.durationDays, 
                                      maxSlots: editing?.maxSlots ?? tier.maxSlots 
                                    } 
                                  }))}
                                  className="pl-14 h-12 font-black text-gray-800 rounded-xl bg-gray-50 border-gray-200/80 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Duration (Days)</label>
                                <div className="relative">
                                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <Input
                                    type="number"
                                    value={editing?.durationDays ?? tier.durationDays}
                                    onChange={e => setEditingPricing(prev => ({ 
                                      ...prev, 
                                      [tier.tier]: { 
                                        priceNPR: editing?.priceNPR ?? tier.priceNPR, 
                                        durationDays: parseInt(e.target.value)||1, 
                                        maxSlots: editing?.maxSlots ?? tier.maxSlots 
                                      } 
                                    }))}
                                    className="pl-11 h-12 font-black text-gray-800 rounded-xl bg-gray-50 border-gray-200/80 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Max Slots</label>
                                <div className="relative">
                                  <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <Input
                                    type="number"
                                    value={editing?.maxSlots ?? tier.maxSlots}
                                    onChange={e => setEditingPricing(prev => ({ 
                                      ...prev, 
                                      [tier.tier]: { 
                                        priceNPR: editing?.priceNPR ?? tier.priceNPR, 
                                        durationDays: editing?.durationDays ?? tier.durationDays, 
                                        maxSlots: parseInt(e.target.value)||1 
                                      } 
                                    }))}
                                    className="pl-11 h-12 font-black text-gray-800 rounded-xl bg-gray-50 border-gray-200/80 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="p-6 pt-0">
                          <Button
                            className={`w-full h-12 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
                              hasChanges 
                                ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-100 hover:scale-[1.02]" 
                                : "bg-gray-100 hover:bg-gray-150 text-gray-500 cursor-not-allowed"
                            }`}
                            disabled={!hasChanges || setPricingMutation.isPending}
                            onClick={() => {
                              if (!editing) return;
                              setPricingMutation.mutate({ tier: tier.tier, ...editing });
                            }}
                          >
                            {setPricingMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Settings2 className="w-4 h-4" />
                                {hasChanges ? "Save Modifications" : "No Changes"}
                              </>
                            )}
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Promotion Requests */}
              <div className="border-t border-gray-100 pt-10">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/20 shadow-inner">
                      <Megaphone className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-950 tracking-tight">Boost Promotion Requests</h2>
                      <p className="text-sm text-gray-500 font-medium">Verify and approve sponsored booster requests from professional sellers.</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 bg-gray-50 p-1 rounded-2xl border border-gray-200/50">
                    {["all", "pending", "approved", "rejected"].map(s => (
                      <button
                        key={s}
                        onClick={() => setPromotionStatusFilter(s === "all" ? "" : s)}
                        className={`px-4 py-2 rounded-xl text-xs font-black capitalize transition-all ${
                          (promotionStatusFilter === "" && s === "all") || promotionStatusFilter === s
                            ? "bg-slate-900 text-white shadow-md"
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {promotionRequestsQuery.isLoading && (
                  <div className="space-y-4">
                    {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-50 border border-gray-100 rounded-3xl animate-pulse" />)}
                  </div>
                )}

                {!promotionRequestsQuery.isLoading && (promotionRequestsQuery.data ?? []).length === 0 && (
                  <div className="text-center py-20 bg-gray-50/40 rounded-[32px] border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200">
                      <Megaphone className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-black text-gray-800 tracking-tight">Everything is Caught Up!</h3>
                    <p className="text-gray-400 text-xs mt-1 font-semibold max-w-xs mx-auto leading-relaxed">No pending promotional requests. Outstanding job on review queue management!</p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  {(promotionRequestsQuery.data ?? []).map((req: any) => {
                    const tierColors: Record<string, string> = {
                      basic: "bg-blue-50 text-blue-700 border-blue-200 shadow-blue-50/20",
                      standard: "bg-purple-50 text-purple-700 border-purple-200 shadow-purple-50/20",
                      premium: "bg-amber-50 text-amber-700 border-amber-200 shadow-amber-50/20",
                    };
                    const statusColors: Record<string, string> = {
                      pending: "bg-yellow-100 text-yellow-800 border-yellow-200/50",
                      approved: "bg-green-100 text-green-800 border-green-200/50",
                      rejected: "bg-red-100 text-red-800 border-red-200/50",
                    };
                    return (
                      <Card key={req.id} className="p-6 border border-gray-100 hover:border-gray-200 shadow-md hover:shadow-lg rounded-[24px] bg-white transition-all group duration-300">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                          <div className="flex items-center gap-5">
                            {/* Listing image */}
                            <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300">
                              {req.listingImages?.[0] ? (
                                <img src={req.listingImages[0]} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 bg-slate-50">
                                  <FileText className="w-8 h-8" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <h4 className="font-black text-gray-900 text-base tracking-tight truncate">{req.listingTitle}</h4>
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black border uppercase tracking-wider ${tierColors[req.tier] || ""}`}>{req.tier}</span>
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black border uppercase tracking-wider ${statusColors[req.status] || ""}`}>{req.status}</span>
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black border uppercase tracking-wider ${req.paymentStatus === 'paid' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-orange-100 text-orange-800 border-orange-200'}`}>{req.paymentStatus}</span>
                              </div>
                              <p className="text-xs text-gray-500 font-semibold flex items-center gap-1.5">
                                <span>Seller: <span className="font-bold text-gray-800">{req.sellerName}</span></span>
                                <span className="text-gray-300">•</span>
                                <span className="text-orange-600 font-black">NPR {(req.priceNPR ?? 0).toLocaleString()}</span>
                                <span className="text-gray-300">•</span>
                                <span>{req.durationDays} Days Duration</span>
                              </p>
                              <p className="text-[10px] text-gray-400 mt-2 font-medium flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Submitted {new Date(req.createdAt).toLocaleDateString()}</p>
                              {req.adminNotes && (
                                <div className="mt-3 bg-gray-50/80 px-4 py-2 rounded-xl border border-gray-100 max-w-md">
                                  <p className="text-[11px] text-gray-500 font-bold italic leading-relaxed">Admin Note: "{req.adminNotes}"</p>
                                </div>
                              )}
                            </div>
                          </div>
                          {req.status === "pending" && (
                            <div className="flex sm:flex-col lg:flex-row gap-2 shrink-0 w-full sm:w-auto">
                              <Button
                                size="sm"
                                className={`flex-1 sm:w-36 rounded-xl h-11 font-bold flex items-center justify-center gap-2 transition-all ${
                                  req.paymentStatus === "paid" 
                                    ? "bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-100 active:scale-95" 
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                }`}
                                disabled={reviewPromotionMutation.isPending || req.paymentStatus !== "paid"}
                                onClick={() => reviewPromotionMutation.mutate({ requestId: req.id, action: "approve" })}
                              >
                                {req.paymentStatus === "paid" ? (
                                  <><CheckCircle2 className="w-4 h-4" /> Approve Boost</>
                                ) : (
                                  <>Waiting for Pay</>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 sm:w-36 border-red-200 text-red-600 hover:bg-red-50 rounded-xl h-11 font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                                onClick={() => { setRejectRequestId(req.id); setRejectModalOpen(true); }}
                              >
                                <XCircle className="w-4 h-4" /> Decline
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Active Featured Listings */}
              <div className="border-t border-gray-100 pt-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/20 shadow-inner">
                    <Star className="w-6 h-6 text-yellow-600 fill-yellow-500/30" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-950 tracking-tight">Active Featured Spotlights</h2>
                    <p className="text-sm text-gray-500 font-medium">Currently live sponsored campaigns active on Homepage and sector sidebars.</p>
                  </div>
                </div>
                
                {featuredListingsQuery.isLoading && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-32 bg-gray-50 border border-gray-100 rounded-3xl animate-pulse" />
                    ))}
                  </div>
                )}

                {(featuredListingsQuery.data ?? []).length === 0 && !featuredListingsQuery.isLoading && (
                  <div className="text-center py-16 bg-gray-50/40 rounded-[32px] border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 text-sm font-semibold">Zero active spotlight listings currently live.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(featuredListingsQuery.data ?? []).map((item: any) => (
                    <Card key={item.id} className="border border-yellow-150 bg-yellow-50/10 rounded-[24px] overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 relative group p-4 flex gap-4">
                      {/* Close/Remove Button */}
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to stop sponsoring and remove "${item.title}" from active featured spotlights?`)) {
                            removeFeaturedMutation.mutate({ listingId: item.id, isFeatured: false });
                          }
                        }}
                        className="absolute top-3 right-3 p-1.5 bg-white hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full border border-gray-100 hover:border-red-100 shadow-sm transition-all duration-200 active:scale-90"
                        title="Remove featured ad"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Listing Image */}
                      <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden shrink-0 shadow-inner">
                        {item.images?.[0] ? (
                          <img src={item.images[0]} className="w-full h-full object-cover" alt="" />
                        ) : <div className="w-full h-full bg-gray-205 rounded-xl" />}
                      </div>

                      {/* Listing Details */}
                      <div className="flex-1 min-w-0 pr-6 flex flex-col justify-between py-1">
                        <div>
                          <p className="font-black text-gray-900 text-sm truncate pr-2 tracking-tight">{item.title}</p>
                          <p className="text-[10px] text-gray-400 font-bold capitalize mt-0.5">{item.type} • Seller: {item.sellerName || "Professional"}</p>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs font-black text-orange-600">NPR {(item.price ?? 0).toLocaleString()}</span>
                          <span className="text-[9px] text-amber-600 font-black bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {item.featuredUntil ? new Date(item.featuredUntil).toLocaleDateString() : "Active"}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

            </div>
          </TabsContent>

          {/* Reject Modal */}
          <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
            <DialogContent className="rounded-2xl border-none shadow-2xl bg-white">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-gray-900">Reject Promotion Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
                <Textarea
                  value={rejectNotes}
                  onChange={e => setRejectNotes(e.target.value)}
                  placeholder="Reason for rejection..."
                  rows={3}
                  className="rounded-xl"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setRejectModalOpen(false)} className="rounded-xl font-bold">Cancel</Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
                    disabled={reviewPromotionMutation.isPending}
                    onClick={() => {
                      if (!rejectRequestId) return;
                      reviewPromotionMutation.mutate({ requestId: rejectRequestId, action: "reject", adminNotes: rejectNotes });
                    }}
                  >
                    {reviewPromotionMutation.isPending ? "Rejecting..." : "Confirm Reject"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </Tabs>
      </div>

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 md:-right-12 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={selectedImage} alt="Full view" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
          </div>
        </div>
      )}

    </div>
  );
}