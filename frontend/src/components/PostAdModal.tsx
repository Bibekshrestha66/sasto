import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Upload, X, ChevronRight, ChevronLeft, Loader2, Video, Crop } from "lucide-react";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";

// ─── Canvas crop helper ───────────────────────────────────────────────────────
// Crops a File to a 4:3 rectangle centered on the image using an offscreen canvas.
async function cropToRatio(file: File, ratio = 4 / 3): Promise<File> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const srcW = img.naturalWidth;
      const srcH = img.naturalHeight;
      let cropW = srcW;
      let cropH = Math.round(srcW / ratio);
      if (cropH > srcH) { cropH = srcH; cropW = Math.round(srcH * ratio); }
      const sx = Math.round((srcW - cropW) / 2);
      const sy = Math.round((srcH - cropH) / 2);
      const canvas = document.createElement("canvas");
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, cropW, cropH);
      canvas.toBlob((blob) => {
        if (!blob) { resolve(file); return; }
        resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }));
      }, "image/jpeg", 0.92);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}
// ─────────────────────────────────────────────────────────────────────────────

const FALLBACK_MARKETPLACE_CATEGORIES = [
  { id: 1, name: "Mobile Phones", icon: "📱" },
  { id: 2, name: "Electronics & Appliances", icon: "📺" },
  { id: 3, name: "Vehicles", icon: "🚗" },
  { id: 4, name: "Property", icon: "🏠" },
  { id: 5, name: "Jobs", icon: "💼" },
  { id: 6, name: "Services", icon: "🔧" },
  { id: 7, name: "Fashion & Beauty", icon: "👗" },
  { id: 8, name: "Pets & Animals", icon: "🐕" },
  { id: 9, name: "Books & Education", icon: "📚" },
  { id: 10, name: "Furniture & Household", icon: "🛋️" },
  { id: 11, name: "Kids & Babies", icon: "👶" },
  { id: 12, name: "Commercial", icon: "🏭" },
  { id: 13, name: "Agriculture", icon: "🌾" },
  { id: 14, name: "Digital", icon: "💻" },
  { id: 15, name: "Groceries", icon: "🛒" },
  { id: 16, name: "Medical", icon: "🩺" },
  { id: 17, name: "Rooms", icon: "🛏️" },
];

const FALLBACK_AUCTION_CATEGORIES = [
  { id: 101, name: "Property", icon: "🏠" },
  { id: 102, name: "Vehicle", icon: "🚗" },
  { id: 103, name: "Electronics", icon: "💻" },
  { id: 104, name: "Collectibles & Luxury", icon: "💎" },
];

const FALLBACK_RENTAL_CATEGORIES = [
  { id: 201, name: "Property", icon: "🏘️" },
  { id: 202, name: "Vehicles", icon: "🚘" },
  { id: 203, name: "Commercial", icon: "🏢" },
  { id: 204, name: "Equipment", icon: "🛠️" },
  { id: 205, name: "Electronics", icon: "💻" },
  { id: 206, name: "Skills", icon: "🧑‍🏫" },
];

function getFallbackCategories(sector: string) {
  if (sector === "auction") return FALLBACK_AUCTION_CATEGORIES;
  if (sector === "rental") return FALLBACK_RENTAL_CATEGORIES;
  return FALLBACK_MARKETPLACE_CATEGORIES;
}

const LISTING_TYPES = [
  { value: "marketplace", label: "Marketplace (Buy/Sell)" },
  { value: "auction", label: "Auction" },
  { value: "rental", label: "Rental" },
];

const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "used", label: "Used" },
];

const MAX_IMAGES = 6;
const MAX_VIDEO = 1;
const MAX_IMAGE_SIZE_MB = 5;
const MAX_VIDEO_SIZE_MB = 50;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

interface ListingFormData {
  title: string;
  description: string;
  price: number | null;
  originalPrice: number | null;
  condition: string;
  location: string;
}

interface PostAdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

async function compressImage(file: File): Promise<File> {
  const options = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true };
  try {
    return await imageCompression(file, options);
  } catch {
    return file;
  }
}

export default function PostAdModal({ isOpen, onClose }: PostAdModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [listingType, setListingType] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [formData, setFormData] = useState<ListingFormData>({
    title: "",
    description: "",
    price: null,
    originalPrice: null,
    condition: "good",
    location: "",
  });
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState<Record<number, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  // Pending crop: holds the raw file before confirmation
  const [pendingCropFile, setPendingCropFile] = useState<File | null>(null);
  const [pendingCropUrl, setPendingCropUrl] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  // Fetch categories from backend; fall back to local list if unavailable
  const currentSector = listingType || "marketplace";
  const { data: fetchedCategories = [], isLoading: categoriesLoading } = trpc.categories.list.useQuery({ sector: currentSector });
  const visibleCategories = (fetchedCategories && fetchedCategories.length > 0)
    ? fetchedCategories
        .filter((c: any) => c.slug !== "want-to-buy" && c.slug !== "kids-clothing")
        .map((c: any) => ({ id: c.id, name: c.name, icon: c.icon || "📌" }))
    : getFallbackCategories(currentSector);

  const createListingMutation = trpc.listings.create.useMutation({
    onSuccess: () => {
      toast.success("Listing created successfully!");
      resetForm();
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create listing");
    },
  });

  const resetForm = useCallback(() => {
    setStep(1);
    setListingType("");
    setSelectedCategory(null);
    setFormData({
      title: "",
      description: "",
      price: null,
      originalPrice: null,
      condition: "good",
      location: "",
    });
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setImages([]);
    setPreviewUrls([]);
    setUploadingImages(false);
    setImageUploadProgress({});
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoFile(null);
    setVideoPreviewUrl(null);
    if (pendingCropUrl) URL.revokeObjectURL(pendingCropUrl);
    setPendingCropFile(null);
    setPendingCropUrl(null);
    setIsCropping(false);
  }, [previewUrls, videoPreviewUrl, pendingCropUrl]);

  useEffect(() => {
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [previewUrls]);

  useEffect(() => {
    if (!isOpen) resetForm();
  }, [isOpen, resetForm]);

  useEffect(() => {
    setSelectedCategory(null);
  }, [listingType]);

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error(`Invalid file type: ${file.type}. Please upload JPG, PNG, or WEBP.`);
      return false;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Max ${MAX_IMAGE_SIZE_MB}MB.`);
      return false;
    }
    return true;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (images.length + files.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    for (const file of files) if (!validateFile(file)) return;
    // Show crop UI for first file; queue rest
    const first = files[0];
    const rawUrl = URL.createObjectURL(first);
    setPendingCropFile(first);
    setPendingCropUrl(rawUrl);
    setIsCropping(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropConfirm = async () => {
    if (!pendingCropFile) return;
    setIsCropping(false);
    setUploadingImages(true);
    try {
      const cropped = await cropToRatio(pendingCropFile);
      const compressed = await compressImage(cropped);
      const previewUrl = URL.createObjectURL(compressed);
      setImages((prev) => [...prev, compressed]);
      setPreviewUrls((prev) => [...prev, previewUrl]);
    } catch {
      toast.error("Failed to process image");
    } finally {
      if (pendingCropUrl) URL.revokeObjectURL(pendingCropUrl);
      setPendingCropFile(null);
      setPendingCropUrl(null);
      setUploadingImages(false);
    }
  };

  const handleCropCancel = () => {
    if (pendingCropUrl) URL.revokeObjectURL(pendingCropUrl);
    setPendingCropFile(null);
    setPendingCropUrl(null);
    setIsCropping(false);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      toast.error("Only MP4, MOV, or WEBM videos are allowed");
      return;
    }
    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      toast.error(`Video must be under ${MAX_VIDEO_SIZE_MB}MB`);
      return;
    }
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const removeVideo = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoFile(null);
    setVideoPreviewUrl(null);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "price" || name === "originalPrice") {
      const numValue = value === "" ? null : parseFloat(value);
      setFormData((prev) => ({ ...prev, [name]: isNaN(numValue as number) ? null : numValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!listingType) { toast.error("Please select a listing type"); return false; }
      if (!selectedCategory) { toast.error("Please select a category"); return false; }
    } else if (step === 2) {
      if (!formData.title.trim()) { toast.error("Please enter a title"); return false; }
      if (formData.title.length > 100) { toast.error("Title must be less than 100 characters"); return false; }
      if (!formData.description.trim()) { toast.error("Please enter a description"); return false; }
      if (!formData.price || formData.price <= 0) { toast.error("Please enter a valid price"); return false; }
      if (!formData.location.trim()) { toast.error("Please enter a location"); return false; }
    } else if (step === 3) {
      if (images.length === 0) { toast.error("Please upload at least one image"); return false; }
    }
    return true;
  };

  const handleNext = () => { if (validateStep()) setStep((s) => s + 1); };
  const handleBack = () => setStep((s) => s - 1);

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    for (let i = 0; i < images.length; i++) {
      setImageUploadProgress((prev) => ({ ...prev, [i]: true }));
      try {
        const { authFetch } = await import("@/lib/authFetch");
        const res = await authFetch("/api/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: images[i].name, contentType: images[i].type }),
        });
        if (!res.ok) throw new Error("Failed to get upload URL");
        const { url, fileId } = await res.json();
        const uploadRes = await fetch(url, { method: "PUT", body: images[i], headers: { "Content-Type": images[i].type } });
        if (!uploadRes.ok) throw new Error(`Upload failed for image ${i + 1}`);
        uploadedUrls.push(fileId);
      } catch (err) {
        toast.error(`Failed to upload image ${i + 1}`);
        throw err;
      } finally {
        setImageUploadProgress((prev) => ({ ...prev, [i]: false }));
      }
    }
    return uploadedUrls;
  };

  const uploadVideo = async (): Promise<string | undefined> => {
    if (!videoFile) return undefined;
    try {
      const { authFetch } = await import("@/lib/authFetch");
      const res = await authFetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: videoFile.name, contentType: videoFile.type }),
      });
      if (!res.ok) throw new Error("Failed to get video upload URL");
      const { url, fileId } = await res.json();
      const uploadRes = await fetch(url, { method: "PUT", body: videoFile, headers: { "Content-Type": videoFile.type } });
      if (!uploadRes.ok) throw new Error("Upload failed for video");
      return fileId;
    } catch (err) {
      toast.error("Failed to upload video");
      throw err;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    try {
      setUploadingImages(true);
      const imageUrls = await uploadImages();
      const videoUrl = await uploadVideo();
      await (createListingMutation as any).mutateAsync({
        title: formData.title,
        description: formData.description,
        price: formData.price!,
        originalPrice: formData.originalPrice || undefined,
        categoryId: selectedCategory!,
        condition: (formData.condition === "like_new" ? "like-new" : formData.condition === "used" ? "fair" : formData.condition) as "new" | "like-new" | "good" | "fair",
        location: formData.location,
        type: listingType as "marketplace" | "auction" | "rental",
        images: imageUrls,
        videoUrl: videoUrl,
      });
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to create listing. Please try again.");
    } finally {
      setUploadingImages(false);
    }
  };

  if (!user) return null;
  const isUploading = createListingMutation.isPending || uploadingImages;
  const canGoNext = step < 4 && !isUploading;
  const canSubmit = step === 4 && !isUploading;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post a New Ad - Step {step} of 4</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-3">Select Listing Type</label>
                <div className="grid grid-cols-1 gap-2">
                  {LISTING_TYPES.map((type) => (
                    <button key={type.value} type="button" onClick={() => setListingType(type.value)}
                      className={`p-3 text-left border-2 rounded-lg transition ${listingType === type.value ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-green-300"}`}>
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-3">Select Category</label>
                <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto p-1">
                  {(categoriesLoading ? getFallbackCategories(currentSector) : visibleCategories).map((cat) => (
                    <button key={cat.id} type="button" onClick={() => setSelectedCategory(cat.id)}
                      className={`p-3 text-center border-2 rounded-lg transition ${selectedCategory === cat.id ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-green-300"}`}>
                      <div className="text-2xl mb-1">{cat.icon}</div>
                      <div className="text-xs font-medium">{cat.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-2">Title</label>
                <Input id="title" name="title" value={formData.title} onChange={handleInputChange} placeholder="Enter item title" maxLength={100} />
                <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100 characters</p>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">Description</label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Describe your item in detail..." rows={4} maxLength={500} />
                <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500 characters</p>
              </div>

              {/* ========== PRICE FIELDS – GUARANTEED NO OVERLAP ========== */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Selling Price */}
                <div>
                  <label htmlFor="price" className="block text-sm font-medium mb-2">
                    Selling Price (NPR) <span className="text-red-500">*</span>
                  </label>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    backgroundColor: "white",
                    // TEMPORARY YELLOW BORDER TO CONFIRM NEW CODE IS RUNNING
                    borderLeft: "4px solid #f59e0b"
                  }}>
                    <span style={{
                      padding: "0.5rem 0.75rem",
                      backgroundColor: "#f9fafb",
                      borderRight: "1px solid #d1d5db",
                      borderTopLeftRadius: "0.375rem",
                      borderBottomLeftRadius: "0.375rem",
                      color: "#6b7280",
                      fontWeight: "500",
                    }}>Rs.</span>
                    <input
                      type="number"
                      name="price"
                      id="price"
                      value={formData.price === null ? "" : formData.price}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      step="1"
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        outline: "none",
                        border: "none",
                        borderRadius: "0 0.375rem 0.375rem 0",
                        fontSize: "1rem",
                      }}
                    />
                  </div>
                </div>

                {/* Original Price */}
                <div>
                  <label htmlFor="originalPrice" className="block text-sm font-medium mb-2">Original Price (Optional)</label>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    backgroundColor: "white",
                  }}>
                    <span style={{
                      padding: "0.5rem 0.75rem",
                      backgroundColor: "#f9fafb",
                      borderRight: "1px solid #d1d5db",
                      borderTopLeftRadius: "0.375rem",
                      borderBottomLeftRadius: "0.375rem",
                      color: "#6b7280",
                      fontWeight: "500",
                    }}>Rs.</span>
                    <input
                      type="number"
                      name="originalPrice"
                      id="originalPrice"
                      value={formData.originalPrice === null ? "" : formData.originalPrice}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      step="1"
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        outline: "none",
                        border: "none",
                        borderRadius: "0 0.375rem 0.375rem 0",
                        fontSize: "1rem",
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">If entered, your ad will show in "Deals & Offers"</p>
                </div>
              </div>
              {/* ========== END PRICE FIELDS ========== */}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="condition" className="block text-sm font-medium mb-2">Condition</label>
                  <Select value={formData.condition} onValueChange={(val) => setFormData((p) => ({ ...p, condition: val }))}>
                    <SelectTrigger id="condition"><SelectValue placeholder="Select condition" /></SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map((cond) => (<SelectItem key={cond.value} value={cond.value}>{cond.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium mb-2">Location</label>
                  <Input id="location" name="location" value={formData.location} onChange={handleInputChange} placeholder="City or District" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {/* ── Photo upload (max 6) ── */}
              <div>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                  📸 Photos ({images.length}/{MAX_IMAGES})
                  <span className="text-xs text-gray-400 font-normal">Each photo is auto-cropped to 4:3 card size</span>
                </label>
                {images.length < MAX_IMAGES && (
                  <div className="border-2 border-dashed border-green-300 rounded-lg p-5 text-center hover:bg-green-50 transition">
                    <label className="cursor-pointer block">
                      <Upload className="mx-auto h-7 w-7 text-green-600 mb-1" />
                      <p className="text-sm text-gray-600">Click to add photo</p>
                      <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP — max 5 MB</p>
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" disabled={uploadingImages || isCropping} />
                    </label>
                  </div>
                )}
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    {previewUrls.map((url, i) => (
                      <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-200" style={{ aspectRatio: '4/3' }}>
                        <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-contain bg-gray-50" />
                        <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition"><X className="h-3 w-3" /></button>
                        {i === 0 && <span className="absolute bottom-1 left-1 text-[9px] bg-green-600 text-white px-1.5 py-0.5 rounded-full">Cover</span>}
                      </div>
                    ))}
                  </div>
                )}
                {uploadingImages && <div className="flex items-center gap-2 mt-2 text-xs text-gray-500"><Loader2 className="h-4 w-4 animate-spin" />Processing image…</div>}
              </div>

              {/* ── Video upload (max 1) ── */}
              <div className="border-t pt-4">
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                  🎬 Video ({videoFile ? 1 : 0}/{MAX_VIDEO})
                  <span className="text-xs text-gray-400 font-normal">MP4/MOV/WEBM — max 50 MB</span>
                </label>
                {!videoFile ? (
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-5 text-center hover:bg-blue-50 transition">
                    <label className="cursor-pointer block">
                      <Video className="mx-auto h-7 w-7 text-blue-500 mb-1" />
                      <p className="text-sm text-gray-600">Click to add a video</p>
                      <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime,video/webm" onChange={handleVideoUpload} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <div className="relative rounded-lg overflow-hidden border border-gray-200">
                    <video src={videoPreviewUrl!} controls className="w-full max-h-48 bg-black" />
                    <button type="button" onClick={removeVideo} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><X className="h-3 w-3" /></button>
                  </div>
                )}
              </div>

              {/* ── Crop confirmation modal ── */}
              {isCropping && pendingCropUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                  <div className="bg-white rounded-2xl p-5 max-w-sm w-full mx-4 shadow-2xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Crop className="w-4 h-4 text-green-600" />
                      <h3 className="font-bold text-sm">Crop Photo to 4:3</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">Preview shows how the photo fits the ad card. Click Confirm to auto-crop the centre region.</p>
                    <div className="rounded-xl overflow-hidden border border-gray-200 mb-4" style={{ aspectRatio: '4/3' }}>
                      <img src={pendingCropUrl} alt="Crop preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={handleCropCancel} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm">Cancel</button>
                      <button type="button" onClick={handleCropConfirm} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold">Confirm &amp; Crop</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <Card className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500">Type</p><p className="font-medium capitalize">{listingType}</p></div>
                <div><p className="text-xs text-gray-500">Category</p><p className="font-medium">{visibleCategories.find((c) => c.id === selectedCategory)?.name || "—"}</p></div>
                <div><p className="text-xs text-gray-500">Title</p><p className="font-medium">{formData.title || "—"}</p></div>
                <div><p className="text-xs text-gray-500">Price</p><p className="font-medium">Rs. {formData.price?.toLocaleString() || "—"}{formData.originalPrice && formData.originalPrice > formData.price! && <span className="ml-2 text-xs line-through text-gray-400">Rs. {formData.originalPrice.toLocaleString()}</span>}</p></div>
              </div>
              <div><p className="text-xs text-gray-500">Description</p><p className="text-sm line-clamp-3">{formData.description || "—"}</p></div>
              <div><p className="text-xs text-gray-500 mb-2">Images ({images.length})</p><div className="grid grid-cols-4 gap-2">{previewUrls.slice(0, 4).map((url, i) => (<img key={i} src={url} alt={`Review ${i + 1}`} className="w-full h-16 object-cover rounded" />))}{previewUrls.length > 4 && <div className="w-full h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">+{previewUrls.length - 4}</div>}</div></div>
            </Card>
          )}

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleBack} disabled={step === 1 || isUploading}><ChevronLeft className="h-4 w-4 mr-2" />Back</Button>
            {step < 4 ? (
              <Button onClick={handleNext} disabled={!canGoNext} className="bg-green-600 hover:bg-green-700">Next<ChevronRight className="h-4 w-4 ml-2" /></Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!canSubmit} className="bg-green-600 hover:bg-green-700">{isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{isUploading ? "Processing..." : "Post Ad"}</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}