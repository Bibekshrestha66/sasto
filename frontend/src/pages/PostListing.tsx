import React, { useState, useRef } from "react";
import { useLocation } from "wouter";
import {
  Upload, X, AlertCircle, Loader2, MapPin, Tag, Palette,
  ClipboardList, ChevronDown, ChevronRight, ChevronLeft, Shield
} from "lucide-react";

import { NEPAL_DISTRICTS, COLORS } from "@/lib/constants";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const LISTING_TYPES = [
  {
    id: "sell",
    label: "Sell",
    icon: "🛍️",
    description: "Sell your item",
  },
  {
    id: "auction",
    label: "Auction",
    icon: "🔨",
    description: "Auction your item",
  },
  {
    id: "rent",
    label: "Rent",
    icon: "🏠",
    description: "Rent your item",
  },
];


export default function PostListing() {
  const [, navigate] = useLocation();
  const { user, loading, isAuthenticated } = useAuth();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories from backend
  const [formData, setFormData] = useState({
    type: "sell",
    category: "",
    subCategory: "",
    title: "",
    description: "",
    price: "",
    location: "",
    district: "Kathmandu",
    brand: "",
    model: "",
    color: "",
    condition: "",
    phone: "",
    email: "",
    stock: "1",
    images: [] as File[],
  });

  const currentSector = formData.type === "rent" ? "rental" : formData.type === "auction" ? "auction" : "marketplace";

  const { data: categories } = trpc.categories.list.useQuery({ sector: currentSector });
  const visibleCategories = categories?.filter((cat: any) => cat.slug !== "want-to-buy" && cat.slug !== "kids-clothing");

  const { data: subCategories, isLoading: subLoading } = trpc.categories.getSubcategories.useQuery(
    { parentId: parseInt(formData.category, 10) },
    { enabled: !!formData.category }
  );
  
  const { data: companyConfig } = trpc.admin.getCompanyConfig.useQuery();
  const commissionRate = companyConfig?.commissionRate ?? 0;

  const createListingMutation = trpc.listings.create.useMutation();

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      toast.error("Unable to access camera");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
            const dt = new DataTransfer();
            dt.items.add(file);
            handleImageUpload(dt.files);
            stopCamera();
          }
        }, "image/jpeg");
      }
    }
  };

  /**
   * AUTH CHECK - Using the real auth hook
   */
  
  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-green-600" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    localStorage.setItem("redirectAfterLogin", "/post-listing");
    navigate("/login");
    return null;
  }


  // Check if user is allowed to post listings (professional roles only)
  const professionalRoles = ["seller", "dealer", "wholesaler", "distributor"];
  const isAdmin = user.role === "admin" || user.role === "super_admin";
  const isProfessionalRole = professionalRoles.includes(user.role);
  
  if (!isAdmin && !isProfessionalRole) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md p-6 text-center border-orange-200 bg-orange-50">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Professional Account Required</h2>
          <p className="text-gray-600 mb-4">
            Only Sellers, Dealers, Wholesalers, and Distributors can post listings.
          </p>
          <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => navigate("/become-seller")}>
            Upgrade Account
          </Button>
        </Card>
      </div>
    );
  }

  // Check if verified
  if (!isAdmin && !user.isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md p-6 text-center border-blue-200 bg-blue-50">
          <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Verification Required</h2>
          <p className="text-gray-600 mb-4">
            You must verify your identity or business before you can post listings.
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate("/verification")}>
            Get Verified Now
          </Button>
        </Card>
      </div>
    );
  }

  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "type") {
      setFormData((prev) => ({
        ...prev,
        type: value,
        category: "",
        subCategory: "",
      }));
      return;
    }

    if (name === "category") {
      setFormData((prev) => ({
        ...prev,
        category: value,
        subCategory: "",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);

    if (fileArray.length + formData.images.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    // Check file sizes (max 5MB per file)
    const oversizedFiles = fileArray.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error("Each image must be less than 5MB");
      return;
    }

    // Check file types
    const invalidFiles = fileArray.filter(
      file => !["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)
    );
    if (invalidFiles.length > 0) {
      toast.error("Only JPEG, PNG, and WEBP images are allowed");
      return;
    }

    const previews = fileArray.map((file) => URL.createObjectURL(file));

    setImagePreviews((prev) => [...prev, ...previews]);
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...fileArray],
    }));
  };

  const removeImage = (index: number) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Convert images to Base64
      const base64Images = await Promise.all(
        formData.images.map(file => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
          });
        })
      );

      // Map form type values to backend enum values
      const typeMap: Record<string, "marketplace" | "auction" | "rental"> = {
        sell: "marketplace",
        auction: "auction",
        rent: "rental",
      };

      await createListingMutation.mutateAsync({
        title: formData.title,
        description: formData.description,
        categoryId: parseInt(formData.subCategory || formData.category, 10),
        type: typeMap[formData.type] || "marketplace",
        price: parseFloat(formData.price),
        stock: formData.stock ? parseInt(formData.stock, 10) : 1,
        images: base64Images.length > 0 ? base64Images : undefined,
        location: formData.location || undefined,
        district: formData.district || undefined,
        brand: formData.brand || undefined,
        model: formData.model || undefined,
        color: formData.color || undefined,
        condition: formData.condition as any,
      } as any);

      toast.success("Listing posted successfully!");
      navigate("/marketplace");
    } catch (error) {
      console.error("Failed to post listing:", error);
      toast.error("Failed to post listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = {
    1: formData.type !== "",
    2: formData.title.trim() !== "" && 
       formData.description.trim() !== "" && 
       formData.price !== "" && 
       parseFloat(formData.price) > 0 &&
       formData.category !== "" &&
       formData.district !== "",
    3: formData.images.length > 0 && 
       formData.phone.trim() !== "",
  };

  // Auto-fill email from user data
  const handleStep3Load = () => {
    if (!formData.email && user?.email) {
      setFormData((prev: any) => ({ ...prev, email: user.email }));
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate("/marketplace")}
            className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-700 transition-colors mb-2 group"
          >
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to Marketplace
          </button>

          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
            Create Your Listing
          </h1>
          <p className="text-slate-500 text-sm">
            Turn your items into cash with Sasto Marketplace
          </p>
        </div>

        {/* Modern Stepper */}
        <div className="relative mb-10 max-w-lg mx-auto">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-green-500 -translate-y-1/2 z-0 transition-all duration-500 ease-in-out" 
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />
          
          <div className="relative z-10 flex justify-between">
            {[
              { id: 1, label: "Type", icon: <Tag className="w-3.5 h-3.5" /> },
              { id: 2, label: "Details", icon: <ClipboardList className="w-3.5 h-3.5" /> },
              { id: 3, label: "Media", icon: <Upload className="w-3.5 h-3.5" /> }
            ].map((s) => (
              <div key={s.id} className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md ${
                    s.id === step
                      ? "bg-green-600 text-white scale-110"
                      : s.id < step
                      ? "bg-green-500 text-white"
                      : "bg-white text-slate-400 border border-slate-200"
                  }`}
                >
                  {s.id < step ? "✓" : s.icon}
                </div>
                <span className={`mt-2 text-[11px] font-bold uppercase tracking-wider ${s.id === step ? "text-slate-900" : "text-slate-500"}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <Card className="p-6 border-none shadow-lg shadow-slate-200/50 rounded-2xl overflow-hidden bg-white">
              <div className="mb-6 text-center sm:text-left">
                <h2 className="text-xl font-bold text-slate-800 mb-1">What are you listing?</h2>
                <p className="text-sm text-slate-500">Choose the type of listing that best fits your needs</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {LISTING_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        type: type.id,
                      }))
                    }
                    className={`relative overflow-hidden border rounded-xl p-4 text-center transition-all duration-300 transform hover:-translate-y-1 ${
                      formData.type === type.id
                        ? "border-green-500 bg-green-50/30 shadow-sm ring-1 ring-green-500/10"
                        : "border-slate-100 bg-slate-50/20 hover:border-green-200"
                    }`}
                  >
                    <div className="text-3xl mb-2 grayscale-[0.5] hover:grayscale-0 transition-all">{type.icon}</div>
                    <div className="font-bold text-slate-800 text-base mb-1">{type.label}</div>
                    <div className="text-[11px] text-slate-500 leading-tight">{type.description}</div>
                  </button>
                ))}
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <Label className="text-slate-700 text-sm font-bold mb-2 block">
                  Select Category
                </Label>
                <div className="relative">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 shadow-sm"
                    required
                  >
                    <option value="">Select Category</option>
                    {visibleCategories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                {formData.category && (subCategories?.length || 0) > 0 && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label className="text-slate-700 text-sm font-bold mb-2 block">
                      Select Sub-Category
                    </Label>
                    <div className="relative">
                      <select
                        name="subCategory"
                        value={formData.subCategory}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 shadow-sm"
                        required
                      >
                        <option value="">Select Sub-Category</option>
                        {subCategories?.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                )}
                
                {formData.category && subLoading && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading sub-categories...
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* STEP 2 - Details */}
          {step === 2 && (
            <Card className="p-6 border-none shadow-lg shadow-slate-200/50 rounded-2xl bg-white space-y-6">
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-bold text-slate-800 mb-1">Item Details</h2>
                <p className="text-sm text-slate-500">Provide accurate information to help buyers find your item</p>
              </div>

              <div className="space-y-5">
                <div>
                  <Label htmlFor="title" className="text-slate-700 text-sm font-bold mb-1.5 block">Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., iPhone 14 Pro - Like New"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="bg-slate-50 border-slate-200 rounded-lg px-4 py-3 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 h-11"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Max 100 characters. Keep it catchy!
                  </p>
                </div>

                <div>
                  <Label htmlFor="description" className="text-slate-700 text-sm font-bold mb-1.5 block">Description *</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    name="description"
                    placeholder="Describe your item in detail (features, condition, reason for selling)..."
                    value={formData.description}
                    onChange={handleInputChange}
                    className="bg-slate-50 border-slate-200 rounded-lg px-4 py-3 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price" className="text-slate-700 text-sm font-bold mb-1.5 block">Your Price (NPR) *</Label>
                    <div className="relative">
                      <Input
                        id="price"
                        type="number"
                        name="price"
                        placeholder="0.00"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="pl-12 bg-slate-50 border-slate-200 rounded-lg pr-4 py-3 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 font-bold h-11"
                        required
                        min="0"
                        step="100"
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold border-r border-slate-100 pr-3 text-xs">
                        Rs.
                      </div>
                    </div>
                  </div>

                  <div>
                    {formData.price && parseFloat(formData.price) > 0 && commissionRate > 0 && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm shadow-sm">
                        <div className="flex justify-between text-slate-600 mb-1">
                          <span>Your take-home:</span>
                          <span className="font-semibold">Rs. {parseFloat(formData.price).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-amber-700 mb-2">
                          <span>Platform commission ({commissionRate}%):</span>
                          <span className="font-semibold">+ Rs. {(parseFloat(formData.price) * commissionRate / 100).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-green-700 font-bold pt-2 border-t border-amber-200/60">
                          <span>Buyer pays:</span>
                          <span>Rs. {(parseFloat(formData.price) * (1 + commissionRate / 100)).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {formData.type === "sell" && (
                    <div>
                      <Label htmlFor="stock" className="text-slate-700 text-sm font-bold mb-1.5 block">Quantity / Stock *</Label>
                      <Input
                        id="stock"
                        type="number"
                        name="stock"
                        placeholder="1"
                        value={formData.stock}
                        onChange={handleInputChange}
                        className="bg-slate-50 border-slate-200 rounded-lg px-4 py-3 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 h-11"
                        min="1"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="condition" className="text-slate-700 text-sm font-bold mb-1.5 block">Condition *</Label>
                    <div className="relative">
                      <select
                        id="condition"
                        name="condition"
                        value={formData.condition}
                        onChange={handleInputChange}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 text-sm"
                        required
                      >
                        <option value="" disabled hidden>Select Condition</option>
                        <option value="new">New</option>
                        <option value="like-new">Like New</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    Location & Specifications
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="district" className="text-slate-700 text-sm font-bold mb-1.5 block">District *</Label>
                    <div className="relative">
                      <select
                        id="district"
                        name="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 text-sm"
                        required
                      >
                        {NEPAL_DISTRICTS.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="location" className="text-slate-700 text-sm font-bold mb-1.5 block">Specific Area</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="e.g., New Road, Kathmandu"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="bg-slate-50 border-slate-200 rounded-lg px-4 py-3 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="brand" className="text-slate-700 text-sm font-bold mb-1.5 block">Brand</Label>
                    <Input
                      id="brand"
                      name="brand"
                      placeholder="e.g., Apple"
                      value={formData.brand}
                      onChange={handleInputChange}
                      className="bg-slate-50 border-slate-200 rounded-lg px-4 py-3 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="model" className="text-slate-700 text-sm font-bold mb-1.5 block">Model</Label>
                    <Input
                      id="model"
                      name="model"
                      placeholder="e.g., iPhone 15"
                      value={formData.model}
                      onChange={handleInputChange}
                      className="bg-slate-50 border-slate-200 rounded-lg px-4 py-3 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 h-11"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="color" className="text-slate-700 text-sm font-bold mb-1.5 block">Color</Label>
                    <div className="relative">
                      <select
                        id="color"
                        name="color"
                        value={formData.color}
                        onChange={handleInputChange}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 text-sm"
                      >
                        <option value="">Select a color</option>
                        {COLORS.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {step === 3 && (
            <Card className="p-6 border-none shadow-lg shadow-slate-200/50 rounded-2xl bg-white space-y-6">
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-bold text-slate-800 mb-1">Media & Contact</h2>
                <p className="text-sm text-slate-500">The final step! Add photos and your contact details</p>
              </div>

              <div className="space-y-5">
                <div>
                  <Label className="text-slate-700 text-sm font-bold mb-3 block">Photos *</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="relative group aspect-square">
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        capture="environment"
                        onChange={(e) => handleImageUpload(e.target.files)}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-green-50 hover:border-green-300 transition-all cursor-pointer group"
                      >
                        <Upload className="w-5 h-5 text-slate-400 group-hover:text-green-600 mb-1" />
                        <span className="text-[10px] font-bold text-slate-500">Add Photos</span>
                        <span className="text-[9px] text-slate-400">{formData.images.length}/5</span>
                      </label>
                    </div>

                    {cameraActive ? (
                      <div className="relative group aspect-square flex flex-col items-center justify-center border-2 border-green-500 rounded-xl bg-black overflow-hidden col-span-2">
                         <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                         <div className="absolute bottom-2 flex gap-2">
                           <button type="button" onClick={capturePhoto} className="bg-white text-green-600 px-3 py-1 rounded-full text-xs font-bold shadow">Snap</button>
                           <button type="button" onClick={stopCamera} className="bg-white text-red-600 px-3 py-1 rounded-full text-xs font-bold shadow">Cancel</button>
                         </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={startCamera}
                        disabled={formData.images.length >= 5}
                        className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-green-50 hover:border-green-300 transition-all cursor-pointer group disabled:opacity-50"
                      >
                        <div className="w-5 h-5 text-slate-400 group-hover:text-green-600 mb-1 flex items-center justify-center">📷</div>
                        <span className="text-[10px] font-bold text-slate-500">Camera</span>
                      </button>
                    )}

                    {imagePreviews.map((image, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden shadow-sm border border-slate-100">
                        <img
                          src={image}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transform hover:scale-110 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    First image will be the cover. JPEG, PNG, WEBP max 5MB.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5 border-t border-slate-100">
                  <div>
                    <Label htmlFor="phone" className="text-slate-700 text-sm font-bold mb-1.5 block">Phone Number *</Label>
                    <div className="relative">
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="98XXXXXXXX"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="pl-12 bg-slate-50 border-slate-200 rounded-lg pr-4 py-3 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 h-11"
                        required
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm">
                        🇳🇵
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-slate-700 text-sm font-bold mb-1.5 block">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="bg-slate-50 border-slate-200 rounded-lg px-4 py-3 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 h-11"
                      required
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="h-12 px-8 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all order-2 sm:order-1 text-sm"
              >
                Previous Step
              </Button>
            )}

            {step < 3 ? (
              <Button
                type="button"
                onClick={() => {
                  if (isStepValid[step as keyof typeof isStepValid]) {
                    if (step === 2) {
                      handleStep3Load();
                    }
                    setStep(step + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    toast.error("Please fill all required fields correctly");
                  }
                }}
                className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-base shadow-md transition-all order-1 sm:order-2"
                disabled={!isStepValid[step as keyof typeof isStepValid]}
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="submit"
                className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-base shadow-md transition-all order-1 sm:order-2"
                disabled={isSubmitting || !isStepValid[3]}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  "Publish Listing"
                )}
              </Button>
            )}
          </div>
        </form>

        {/* Footer Tips */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100/50">
            <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-2 text-sm">
              <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
              Selling Tips
            </h4>
            <ul className="text-xs text-blue-800/80 space-y-1 list-none">
              <li className="flex items-start gap-2">• Photos with natural light sell 3x faster.</li>
              <li className="flex items-start gap-2">• Be transparent about any minor defects.</li>
            </ul>
          </div>
          
          <div className="p-4 rounded-xl bg-green-50/50 border border-green-100/50">
            <h4 className="font-bold text-green-900 flex items-center gap-2 mb-2 text-sm">
              <AlertCircle className="w-3.5 h-3.5 text-green-600" />
              Safety First
            </h4>
            <ul className="text-xs text-green-800/80 space-y-1 list-none">
              <li className="flex items-start gap-2">• Meet buyers in public, well-lit places.</li>
              <li className="flex items-start gap-2">• Verify payment before handing over items.</li>
            </ul>
          </div>
        </div>

        {/* User Identity */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Logged in as <span className="text-slate-900">{user.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}