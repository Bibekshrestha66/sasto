import React, { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import {
  Upload, X, AlertCircle, Loader2, MapPin, ChevronDown, ChevronLeft, Shield, Camera
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

export default function EditListing() {
  const [, navigate] = useLocation();
  const { id } = useParams<{ id: string }>();
  const { user, loading, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    originalPrice: "",
    location: "",
    district: "Kathmandu",
    brand: "",
    model: "",
    color: "",
    condition: "new",
    stock: "1",
    category: "",
    subCategory: "",
    type: "marketplace" as "marketplace" | "auction" | "rental",
  });

  // Existing images (string URLs already saved) + new File uploads
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  // Camera
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const utils = trpc.useUtils();

  const { data: existingListing, isLoading: isListingLoading } = trpc.listings.getById.useQuery(
    parseInt(id),
    { enabled: !!id && !isNaN(parseInt(id)) }
  );

  const currentSector = formData.type === "rental" ? "rental" : formData.type === "auction" ? "auction" : "marketplace";
  const { data: categories } = trpc.categories.list.useQuery({ sector: currentSector });
  const visibleCategories = categories?.filter((cat: any) => cat.slug !== "want-to-buy" && cat.slug !== "kids-clothing");
  const { data: subCategories } = trpc.categories.getSubcategories.useQuery(
    { parentId: parseInt(formData.category, 10), sector: currentSector },
    { enabled: !!formData.category && !isNaN(parseInt(formData.category)) }
  );

  const updateListingMutation = trpc.listings.update.useMutation({
    onSuccess: () => {
      toast.success("Listing updated successfully!");
      utils.seller.getListings.invalidate();
      navigate("/seller/dashboard");
    },
    onError: (err) => {
      toast.error("Failed to update listing: " + err.message);
      setIsSubmitting(false);
    },
  });

  // Pre-fill form when existing listing loads
  useEffect(() => {
    if (existingListing) {
      setFormData({
        title: existingListing.title || "",
        description: existingListing.description || "",
        price: existingListing.price?.toString() || "",
        originalPrice: existingListing.originalPrice?.toString() || "",
        location: existingListing.location || "",
        district: existingListing.district || "Kathmandu",
        brand: existingListing.brand || "",
        model: existingListing.model || "",
        color: existingListing.color || "",
        condition: existingListing.condition || "new",
        stock: existingListing.stock?.toString() || "1",
        category: existingListing.categoryId?.toString() || "",
        subCategory: "",
        type: (existingListing.type as any) || "marketplace",
      });
      const imgs = existingListing.images as string[] | null;
      if (imgs && Array.isArray(imgs)) {
        setExistingImages(imgs);
      }
    }
  }, [existingListing]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
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
            addNewFiles([file]);
            stopCamera();
          }
        }, "image/jpeg");
      }
    }
  };

  const addNewFiles = (files: File[]) => {
    const totalImages = existingImages.length + newImageFiles.length + files.length;
    if (totalImages > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }
    const oversized = files.filter(f => f.size > 5 * 1024 * 1024);
    if (oversized.length > 0) { toast.error("Each image must be less than 5MB"); return; }
    const invalid = files.filter(f => !["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(f.type));
    if (invalid.length > 0) { toast.error("Only JPEG, PNG, and WEBP images are allowed"); return; }
    const previews = files.map(f => URL.createObjectURL(f));
    setNewImageFiles(prev => [...prev, ...files]);
    setNewImagePreviews(prev => [...prev, ...previews]);
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(newImagePreviews[index]);
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "type") {
      setFormData(prev => ({ ...prev, type: value as any, category: "", subCategory: "" }));
      return;
    }

    if (name === "category") {
      setFormData(prev => ({ ...prev, category: value, subCategory: "" }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error("Title is required"); return; }
    if (!formData.price || parseFloat(formData.price) <= 0) { toast.error("A valid price is required"); return; }

    setIsSubmitting(true);

    // Convert new file images to base64
    const newBase64 = await Promise.all(
      newImageFiles.map(file =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        })
      )
    );

    const allImages = [...existingImages, ...newBase64];

    updateListingMutation.mutate({
      id: parseInt(id),
      title: formData.title,
      description: formData.description,
      type: formData.type,
      price: parseFloat(formData.price),
      stock: formData.stock ? parseInt(formData.stock) : 1,
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
      images: allImages.length > 0 ? allImages : undefined,
      location: formData.location || undefined,
      district: formData.district || undefined,
      brand: formData.brand || undefined,
      model: formData.model || undefined,
      color: formData.color || undefined,
      condition: formData.condition as any,
    } as any);
  };

  if (loading || isListingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-green-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    navigate("/login");
    return null;
  }

  const professionalRoles = ["seller", "dealer", "wholesaler", "distributor"];
  const isAdmin = user.role === "admin" || user.role === "super_admin";
  const isProfessional = professionalRoles.includes(user.role);

  if (!isAdmin && !isProfessional) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md p-6 text-center border-orange-200 bg-orange-50">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Professional Account Required</h2>
          <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => navigate("/become-seller")}>
            Upgrade Account
          </Button>
        </Card>
      </div>
    );
  }

  if (!isAdmin && !user.isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md p-6 text-center border-blue-200 bg-blue-50">
          <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Verification Required</h2>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate("/verification")}>
            Get Verified Now
          </Button>
        </Card>
      </div>
    );
  }

  if (!existingListing) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md p-6 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Listing not found</h2>
          <Button onClick={() => navigate("/seller/dashboard")}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  const totalImages = existingImages.length + newImageFiles.length;

  return (
    <div className="min-h-screen bg-[#f8fafc] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate("/seller/dashboard")}
            className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-700 transition-colors mb-2 group"
          >
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to Seller Dashboard
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
            Edit Listing
          </h1>
          <p className="text-slate-500 text-sm">
            Update your listing details below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Details */}
          <Card className="p-6 border-none shadow-lg shadow-slate-200/50 rounded-2xl bg-white space-y-5">
            <h2 className="text-xl font-bold text-slate-800">Basic Details</h2>

            <div>
              <Label htmlFor="title" className="text-slate-700 text-sm font-bold mb-1.5 block">Title *</Label>
              <Input
                id="title" name="title"
                placeholder="e.g., iPhone 14 Pro - Like New"
                value={formData.title}
                onChange={handleInputChange}
                className="bg-slate-50 border-slate-200 rounded-lg px-4 py-3 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 h-11"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-slate-700 text-sm font-bold mb-1.5 block">Description *</Label>
              <Textarea
                id="description" name="description" rows={4}
                placeholder="Describe your item in detail..."
                value={formData.description}
                onChange={handleInputChange}
                className="bg-slate-50 border-slate-200 rounded-lg px-4 py-3 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="type" className="text-slate-700 text-sm font-bold mb-1.5 block">Listing Type</Label>
              <div className="relative">
                <select
                  id="type" name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 text-sm"
                >
                  <option value="marketplace">Marketplace (Sell)</option>
                  <option value="auction">Auction</option>
                  <option value="rental">Rental</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="category" className="text-slate-700 text-sm font-bold mb-1.5 block">Category</Label>
              <div className="relative">
                <select
                  id="category" name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 text-sm"
                >
                  <option value="">Select Category</option>
                  {visibleCategories?.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {subCategories && subCategories.length > 0 && (
              <div>
                <Label htmlFor="subCategory" className="text-slate-700 text-sm font-bold mb-1.5 block">Sub-Category</Label>
                <div className="relative">
                  <select
                    id="subCategory" name="subCategory"
                    value={formData.subCategory}
                    onChange={handleInputChange}
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 text-sm"
                  >
                    <option value="">Select Sub-Category</option>
                    {subCategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Pricing & Inventory */}
          <Card className="p-6 border-none shadow-lg shadow-slate-200/50 rounded-2xl bg-white space-y-5">
            <h2 className="text-xl font-bold text-slate-800">Pricing & Inventory</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price" className="text-slate-700 text-sm font-bold mb-1.5 block">Selling Price (NPR) *</Label>
                <div className="relative">
                  <Input
                    id="price" type="number" name="price"
                    placeholder="0.00" value={formData.price}
                    onChange={handleInputChange}
                    className="pl-12 bg-slate-50 border-slate-200 rounded-lg pr-4 py-3 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 font-bold h-11"
                    required min="0" step="100"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold border-r border-slate-100 pr-3 text-xs">
                    Rs.
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="originalPrice" className="text-slate-700 text-sm font-bold mb-1.5 block">Original Price (Optional)</Label>
                <div className="relative">
                  <Input
                    id="originalPrice" type="number" name="originalPrice"
                    placeholder="0.00" value={formData.originalPrice}
                    onChange={handleInputChange}
                    className="pl-12 bg-slate-50 border-slate-200 rounded-lg pr-4 py-3 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 h-11"
                    min="0" step="100"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 border-r border-slate-100 pr-3 text-xs">
                    Rs.
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="stock" className="text-slate-700 text-sm font-bold mb-1.5 block">Quantity / Stock</Label>
                <Input
                  id="stock" type="number" name="stock"
                  placeholder="1" value={formData.stock}
                  onChange={handleInputChange}
                  className="bg-slate-50 border-slate-200 rounded-lg px-4 py-3 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 h-11"
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="condition" className="text-slate-700 text-sm font-bold mb-1.5 block">Condition</Label>
                <div className="relative">
                  <select
                    id="condition" name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 text-sm"
                  >
                    <option value="new">Brand New</option>
                    <option value="like-new">Like New / Mint</option>
                    <option value="good">Good Condition</option>
                    <option value="fair">Fair / Used</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Location & Specs */}
          <Card className="p-6 border-none shadow-lg shadow-slate-200/50 rounded-2xl bg-white space-y-5">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              Location & Specifications
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="district" className="text-slate-700 text-sm font-bold mb-1.5 block">District *</Label>
                <div className="relative">
                  <select
                    id="district" name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 text-sm"
                  >
                    {NEPAL_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="location" className="text-slate-700 text-sm font-bold mb-1.5 block">Specific Area</Label>
                <Input
                  id="location" name="location"
                  placeholder="e.g., New Road, Kathmandu"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="bg-slate-50 border-slate-200 rounded-lg px-4 py-3 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 h-11"
                />
              </div>
              <div>
                <Label htmlFor="brand" className="text-slate-700 text-sm font-bold mb-1.5 block">Brand</Label>
                <Input
                  id="brand" name="brand"
                  placeholder="e.g., Apple"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="bg-slate-50 border-slate-200 rounded-lg px-4 py-3 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 h-11"
                />
              </div>
              <div>
                <Label htmlFor="model" className="text-slate-700 text-sm font-bold mb-1.5 block">Model</Label>
                <Input
                  id="model" name="model"
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
                    id="color" name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 text-sm"
                  >
                    <option value="">Select a color</option>
                    {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Photos */}
          <Card className="p-6 border-none shadow-lg shadow-slate-200/50 rounded-2xl bg-white space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Photos</h2>
            <p className="text-xs text-slate-400">
              <AlertCircle className="w-3 h-3 inline mr-1" />
              Max 5 photos. First image is the cover.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Upload button */}
              {totalImages < 5 && (
                <>
                  <div className="relative group aspect-square">
                    <input
                      type="file" multiple
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={(e) => addNewFiles(Array.from(e.target.files || []))}
                      className="hidden" id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-green-50 hover:border-green-300 transition-all cursor-pointer"
                    >
                      <Upload className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-[10px] font-bold text-slate-500">Add Photos</span>
                      <span className="text-[9px] text-slate-400">{totalImages}/5</span>
                    </label>
                  </div>

                  {/* Camera */}
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
                      type="button" onClick={startCamera}
                      className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-green-50 hover:border-green-300 transition-all"
                    >
                      <Camera className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-[10px] font-bold text-slate-500">Camera</span>
                    </button>
                  )}
                </>
              )}

              {/* Existing images */}
              {existingImages.map((img, idx) => (
                <div key={`existing-${idx}`} className="relative group aspect-square rounded-xl overflow-hidden shadow-sm border border-slate-100">
                  <img src={img} alt={`Existing ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-1 left-1 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                    {idx === 0 ? "Cover" : `#${idx + 1}`}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button" onClick={() => removeExistingImage(idx)}
                      className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transform hover:scale-110 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* New file previews */}
              {newImagePreviews.map((img, idx) => (
                <div key={`new-${idx}`} className="relative group aspect-square rounded-xl overflow-hidden shadow-sm border border-blue-200">
                  <img src={img} alt={`New ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-1 left-1 bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">New</div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button" onClick={() => removeNewImage(idx)}
                      className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transform hover:scale-110 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button" variant="outline"
              onClick={() => navigate("/seller/dashboard")}
              className="h-12 px-8 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-base shadow-md transition-all"
              disabled={isSubmitting || updateListingMutation.isPending}
            >
              {(isSubmitting || updateListingMutation.isPending) ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}