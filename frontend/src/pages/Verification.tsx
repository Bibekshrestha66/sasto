import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ShieldCheck, User, CheckCircle2, AlertCircle, Loader2,
  Upload, Camera, X, FileText, Building2, ChevronRight, Lock,
  BadgeCheck, Clock, ArrowLeft,
} from "lucide-react";

// ─────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────
const kycSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  idType: z.enum(["citizenship", "passport", "license", "nid"]),
  idNumber: z.string().min(3, "ID number is required"),
  idFront: z.string().min(1, "Front image is required"),
  idBack: z.string().min(1, "Back image is required"),
  userPhoto: z.string().min(1, "Live photo is required"),
});

const kybSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  regNumber: z.string().min(2, "Registration number is required"),
  vatPan: z.string().min(5, "VAT/PAN number is required"),
  businessAddress: z.string().min(5, "Business address is required"),
  regDoc: z.string().min(1, "Registration certificate is required"),
  userPhoto: z.string().min(1, "Live photo is required"),
});

type KYCFormData = z.infer<typeof kycSchema>;
type KYBFormData = z.infer<typeof kybSchema>;

// ─────────────────────────────────────────────
// Convert file → base64
// ─────────────────────────────────────────────
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

const navigate = (path: string) => { window.location.href = path; };

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function Verification() {
  const { user, refresh } = useAuth();
  const [step, setStep] = useState(1);
  const [type, setType] = useState<"kyc" | "kyb" | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { name: string; preview: string }>>({});
  const [isResubmitting, setIsResubmitting] = useState(false);

  const { data: submissions, refetch: refetchSubmissions, isLoading } =
    trpc.verification.getStatus.useQuery(undefined);

  const submitMutation = trpc.verification.submit.useMutation();

  const latestSubmission = submissions?.[0];

  useEffect(() => {
    if (user?.isVerified) navigate("/");
  }, [user?.isVerified]);

  const kycForm = useForm<KYCFormData>({
    resolver: zodResolver(kycSchema),
    defaultValues: { idType: "citizenship" },
  });

  const kybForm = useForm<KYBFormData>({
    resolver: zodResolver(kybSchema),
  });

  // Unified file upload: reads as base64 and stores in form
  const handleFileUpload = async (
    file: File,
    fieldName: string,
    form: typeof kycForm | typeof kybForm
  ) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be less than 5MB");
      return;
    }
    setIsUploading(true);
    try {
      const base64 = await fileToBase64(file);
      (form as any).setValue(fieldName, base64, { shouldValidate: true });
      setUploadedFiles(prev => ({
        ...prev,
        [fieldName]: { name: file.name, preview: file.type.startsWith("image/") ? base64 : "" }
      }));
      toast.success(`${fieldName === "userPhoto" ? "Photo" : "Document"} ready for submission`);
    } catch {
      toast.error("Failed to process file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleKYCSubmit = (data: KYCFormData) => {
    submitMutation.mutate({ type: "kyc", data }, {
      onSuccess: async () => {
        toast.success("Verification submitted! We'll review within 24-48 hours.");
        await refetchSubmissions();
        await refresh();
        setStep(3);
      },
      onError: (err) => {
        toast.error(err.message || "Submission failed. Please try again.");
      },
    });
  };

  const handleKYBSubmit = (data: KYBFormData) => {
    submitMutation.mutate({ type: "kyb", data }, {
      onSuccess: async () => {
        toast.success("Verification submitted! We'll review within 24-48 hours.");
        await refetchSubmissions();
        await refresh();
        setStep(3);
      },
      onError: (err) => {
        toast.error(err.message || "Submission failed. Please try again.");
      },
    });
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-green-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Loading verification status…</p>
        </div>
      </div>
    );
  }

  // ── Pending ──
  if (!isResubmitting && latestSubmission && latestSubmission.status === "pending") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-slate-200 p-10 text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Under Review</h2>
          <p className="text-slate-500 mb-6">Your documents are being reviewed. We typically respond within 24–48 hours.</p>
          <div className="flex justify-center gap-3 mb-8">
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              {latestSubmission.type.toUpperCase()} Verification
            </span>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              Pending
            </span>
          </div>
          <Button onClick={() => navigate("/")} className="w-full h-12 rounded-2xl font-bold bg-slate-900 hover:bg-slate-800">
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  // ── Rejected ──
  if (!isResubmitting && latestSubmission && latestSubmission.status === "rejected") {
    const rejectionReason = (latestSubmission as any).adminNotes || "Your documents did not meet our verification requirements.";
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl shadow-slate-200 overflow-hidden">
          {/* Red header */}
          <div className="bg-gradient-to-r from-red-600 to-rose-500 p-8 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white mb-1">Verification Rejected</h2>
            <p className="text-red-100 text-sm">Your documents could not be approved</p>
          </div>

          <div className="p-8">
            {/* Rejection reason box */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
              <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Reason for Rejection
              </p>
              <p className="text-sm text-red-800 leading-relaxed font-medium">{rejectionReason}</p>
            </div>

            {/* What to do next */}
            <div className="bg-slate-50 rounded-2xl p-5 mb-6">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">What to do next</p>
              <ul className="space-y-2 text-sm text-slate-600">
                {[
                  "Ensure all document photos are clear and well-lit",
                  "All four corners of the document must be visible",
                  "Your selfie must clearly match the ID photo",
                  "Make sure the document is not expired",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => { setIsResubmitting(true); setStep(1); }}
                className="w-full h-12 rounded-2xl font-bold bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Re-Submit Documents
              </Button>
              <Button variant="outline" onClick={() => navigate("/")} className="w-full h-12 rounded-2xl font-bold">
                Back to Marketplace
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user?.isVerified) return null;

  // ── Step 1: Type Selection ──
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-sm font-bold px-4 py-2 rounded-full mb-6 border border-green-100">
              <Lock className="w-4 h-4" />
              Secure Verification
            </div>
            <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Get Verified</h1>
            <p className="text-slate-500 text-lg max-w-md mx-auto">
              Unlock all features and build trust with buyers and sellers on Sasto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* KYC */}
            <button
              type="button"
              onClick={() => { setType("kyc"); setStep(2); }}
              className="group text-left bg-white rounded-3xl p-8 border-2 border-slate-100 hover:border-green-400 shadow-lg hover:shadow-2xl hover:shadow-green-100 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-100 transition-colors">
                <User className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Individual (KYC)</h3>
              <p className="text-slate-500 text-sm mb-6">
                For buyers and individual sellers. Verify with your government-issued ID.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                {["Citizenship / Passport / NID", "ID front & back photo", "Live selfie"].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">Individual</span>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            {/* KYB */}
            <button
              type="button"
              onClick={() => { setType("kyb"); setStep(2); }}
              className="group text-left bg-white rounded-3xl p-8 border-2 border-slate-100 hover:border-blue-400 shadow-lg hover:shadow-2xl hover:shadow-blue-100 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Business (KYB)</h3>
              <p className="text-slate-500 text-sm mb-6">
                For dealers, wholesalers, and distributors. Verify your business legally.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                {["Business registration number", "VAT/PAN number", "Registration certificate"].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Business</span>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-start gap-4 shadow-sm">
            <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700 mb-1">Your data is safe</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                All documents are encrypted and used solely for identity verification. We never share your data with third parties.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2 KYC ──
  if (step === 2 && type === "kyc") {
    const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = kycForm;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 mb-8 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back
          </button>

          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-8 py-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">Individual Verification</h2>
                  <p className="text-green-100 text-sm">KYC — Government ID verification</p>
                </div>
              </div>
              {/* Progress */}
              <div className="mt-6 flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-white/40">
                  <div className="h-2 w-full rounded-full bg-white" />
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(handleKYCSubmit)} className="p-8 space-y-6">
              {/* Full Name */}
              <FormField label="Full Name (as on ID)" error={errors.fullName?.message} required>
                <Input
                  id="fullName" placeholder="e.g. Ram Bahadur Thapa"
                  {...register("fullName")}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-colors px-4"
                />
              </FormField>

              {/* ID Type + Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="ID Type" error={errors.idType?.message} required>
                  <Select onValueChange={(val) => setValue("idType", val as any, { shouldValidate: true })} defaultValue="citizenship">
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50">
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="citizenship">🪪 Citizenship</SelectItem>
                      <SelectItem value="passport">📘 Passport</SelectItem>
                      <SelectItem value="license">🚗 Driver's License</SelectItem>
                      <SelectItem value="nid">🆔 NID (National Identity)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="ID Number" error={errors.idNumber?.message} required>
                  <Input
                    id="idNumber" placeholder="e.g. 1234-56789"
                    {...register("idNumber")}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-colors px-4"
                  />
                </FormField>
              </div>

              {/* ID Documents */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DocumentUploadField
                  label="Front Side of ID"
                  fieldName="idFront"
                  uploadedFile={uploadedFiles["idFront"]}
                  isUploading={isUploading}
                  error={errors.idFront?.message}
                  onUpload={(file) => handleFileUpload(file, "idFront", kycForm)}
                  onRemove={() => {
                    kycForm.setValue("idFront", "", { shouldValidate: true });
                    setUploadedFiles(prev => { const n = {...prev}; delete n["idFront"]; return n; });
                  }}
                />
                <DocumentUploadField
                  label="Back Side of ID"
                  fieldName="idBack"
                  uploadedFile={uploadedFiles["idBack"]}
                  isUploading={isUploading}
                  error={errors.idBack?.message}
                  onUpload={(file) => handleFileUpload(file, "idBack", kycForm)}
                  onRemove={() => {
                    kycForm.setValue("idBack", "", { shouldValidate: true });
                    setUploadedFiles(prev => { const n = {...prev}; delete n["idBack"]; return n; });
                  }}
                />
              </div>

              {/* Live Selfie */}
              <CameraCaptureField
                label="Live Selfie"
                uploadedFile={uploadedFiles["userPhoto"]}
                isUploading={isUploading}
                error={errors.userPhoto?.message}
                onCapture={(file) => handleFileUpload(file, "userPhoto", kycForm)}
                onRemove={() => {
                  kycForm.setValue("userPhoto", "", { shouldValidate: true });
                  setUploadedFiles(prev => { const n = {...prev}; delete n["userPhoto"]; return n; });
                }}
              />

              {/* Info */}
              <div className="bg-green-50 rounded-2xl p-4 flex items-start gap-3 border border-green-100">
                <AlertCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <p className="text-xs text-green-800 leading-relaxed">
                  Ensure photos are <strong>clear and well-lit</strong>. All four corners of the document must be visible. Files are encrypted and stored securely.
                </p>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-12 rounded-xl px-6 font-bold">
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black shadow-lg shadow-green-200 transition-all"
                  disabled={isSubmitting || isUploading || submitMutation.isPending}
                >
                  {(isSubmitting || submitMutation.isPending) ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting…</>
                  ) : (
                    <><ShieldCheck className="w-4 h-4 mr-2" />Submit for Review</>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2 KYB ──
  if (step === 2 && type === "kyb") {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = kybForm;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 mb-8 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back
          </button>

          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-500 px-8 py-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">Business Verification</h2>
                  <p className="text-blue-100 text-sm">KYB — Legal business verification</p>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-white/40">
                  <div className="h-2 w-full rounded-full bg-white" />
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(handleKYBSubmit)} className="p-8 space-y-6">
              <FormField label="Legal Business Name" error={errors.businessName?.message} required>
                <Input
                  id="businessName" placeholder="e.g. Thapa Traders Pvt. Ltd."
                  {...register("businessName")}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-colors px-4"
                />
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Registration Number" error={errors.regNumber?.message} required>
                  <Input
                    id="regNumber" placeholder="e.g. 123456/070/071"
                    {...register("regNumber")}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-colors px-4"
                  />
                </FormField>
                <FormField label="VAT / PAN Number" error={errors.vatPan?.message} required>
                  <Input
                    id="vatPan" placeholder="e.g. 123456789"
                    {...register("vatPan")}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-colors px-4"
                  />
                </FormField>
              </div>

              <FormField label="Business Address" error={errors.businessAddress?.message} required>
                <Input
                  id="businessAddress" placeholder="e.g. Newroad, Kathmandu"
                  {...register("businessAddress")}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-colors px-4"
                />
              </FormField>

              <DocumentUploadField
                label="Registration Certificate"
                fieldName="regDoc"
                uploadedFile={uploadedFiles["regDoc"]}
                isUploading={isUploading}
                error={errors.regDoc?.message}
                onUpload={(file) => handleFileUpload(file, "regDoc", kybForm)}
                onRemove={() => {
                  kybForm.setValue("regDoc", "", { shouldValidate: true });
                  setUploadedFiles(prev => { const n = {...prev}; delete n["regDoc"]; return n; });
                }}
              />

              <CameraCaptureField
                label="Live Selfie (Business Representative)"
                uploadedFile={uploadedFiles["userPhoto"]}
                isUploading={isUploading}
                error={errors.userPhoto?.message}
                onCapture={(file) => handleFileUpload(file, "userPhoto", kybForm)}
                onRemove={() => {
                  kybForm.setValue("userPhoto", "", { shouldValidate: true });
                  setUploadedFiles(prev => { const n = {...prev}; delete n["userPhoto"]; return n; });
                }}
              />

              <div className="bg-blue-50 rounded-2xl p-4 flex items-start gap-3 border border-blue-100">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-800 leading-relaxed">
                  Business documents must be <strong>official and current</strong>. Expired documents will be rejected. Files are encrypted and stored securely.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-12 rounded-xl px-6 font-bold">
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-200 transition-all"
                  disabled={isSubmitting || isUploading || submitMutation.isPending}
                >
                  {(isSubmitting || submitMutation.isPending) ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting…</>
                  ) : (
                    <><ShieldCheck className="w-4 h-4 mr-2" />Submit for Review</>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 3: Success ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-slate-200 p-10 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <BadgeCheck className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Submission Received!</h2>
        <p className="text-slate-500 mb-8">
          We'll review your documents within <strong>24–48 hours</strong> and notify you by email once verified.
        </p>
        <Button
          onClick={() => navigate("/")}
          className="w-full h-12 rounded-2xl font-bold bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100"
        >
          Go to Marketplace
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// FormField wrapper
// ─────────────────────────────────────────────
function FormField({ label, error, required, children }: {
  label: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-bold text-slate-700">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3 h-3" />{error}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Document Upload Field
// ─────────────────────────────────────────────
function DocumentUploadField({ label, fieldName, uploadedFile, isUploading, error, onUpload, onRemove }: {
  label: string;
  fieldName: string;
  uploadedFile?: { name: string; preview: string };
  isUploading: boolean;
  error?: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-bold text-slate-700">
        {label}<span className="text-red-500 ml-1">*</span>
      </Label>

      {uploadedFile ? (
        <div className="border-2 border-green-200 bg-green-50 rounded-2xl p-4 flex items-center gap-4">
          {uploadedFile.preview ? (
            <img src={uploadedFile.preview} alt="Preview" className="w-16 h-16 object-cover rounded-xl border border-green-200" />
          ) : (
            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
              <FileText className="w-7 h-7 text-green-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-green-800 truncate">{uploadedFile.name}</p>
            <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" />Ready for submission
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="w-8 h-8 rounded-full bg-white border border-red-200 flex items-center justify-center hover:bg-red-50 transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={`upload-${fieldName}`}
          className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 cursor-pointer transition-all group"
        >
          {isUploading ? (
            <Loader2 className="w-7 h-7 text-slate-400 animate-spin" />
          ) : (
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center group-hover:shadow-md transition-shadow">
              <Upload className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
            </div>
          )}
          <div className="text-center">
            <p className="text-sm font-bold text-slate-700">Click to upload</p>
            <p className="text-xs text-slate-400 mt-0.5">JPG, PNG or PDF — max 5MB</p>
          </div>
          <input
            ref={inputRef}
            id={`upload-${fieldName}`}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleChange}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      )}

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />{error}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Camera Capture Field
// ─────────────────────────────────────────────
function CameraCaptureField({ label, uploadedFile, isUploading, error, onCapture, onRemove }: {
  label: string;
  uploadedFile?: { name: string; preview: string };
  isUploading: boolean;
  error?: string;
  onCapture: (file: File) => void;
  onRemove: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const fallbackInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      setStream(mediaStream);
      setCameraActive(true);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch {
      toast.error("Camera access denied. Please allow camera permissions.");
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
        stopCamera();
        await onCapture(file);
      }
    }, "image/jpeg", 0.9);
  };

  useEffect(() => () => { stream?.getTracks().forEach(t => t.stop()); }, []);

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-bold text-slate-700">
        {label}<span className="text-red-500 ml-1">*</span>
      </Label>

      {uploadedFile?.preview ? (
        <div className="border-2 border-green-200 bg-green-50 rounded-2xl p-4 flex items-center gap-4">
          <img src={uploadedFile.preview} alt="Selfie" className="w-16 h-16 object-cover rounded-xl border border-green-200" />
          <div className="flex-1">
            <p className="text-sm font-bold text-green-800">Photo captured</p>
            <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" />Ready for submission
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="w-8 h-8 rounded-full bg-white border border-red-200 flex items-center justify-center hover:bg-red-50 transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>
      ) : cameraActive ? (
        <div className="border-2 border-blue-300 rounded-2xl overflow-hidden bg-black">
          <div className="relative">
            <video ref={videoRef} autoPlay playsInline className="w-full aspect-video object-cover" />
            <div className="absolute inset-0 border-4 border-white/20 rounded-2xl pointer-events-none" />
            {/* Face guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-40 h-48 border-2 border-white/60 rounded-full" />
            </div>
          </div>
          <div className="p-4 flex gap-3">
            <Button type="button" variant="outline" onClick={stopCamera} className="flex-1 h-10 rounded-xl bg-white/10 text-white border-white/20 hover:bg-white/20">
              Cancel
            </Button>
            <Button type="button" onClick={capturePhoto} className="flex-1 h-10 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-100">
              <Camera className="w-4 h-4 mr-2" />Capture
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={startCamera}
            className="w-full flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-200 rounded-2xl p-8 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all group"
          >
            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:shadow-md transition-shadow">
              <Camera className="w-6 h-6 text-slate-400 group-hover:text-slate-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-700">Open Camera</p>
              <p className="text-xs text-slate-400 mt-0.5">Take a live selfie for verification</p>
            </div>
          </button>
          
          <div className="flex items-center justify-center gap-2">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-xs text-slate-400 font-medium">OR</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
          
          <button
            type="button"
            onClick={() => fallbackInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Photo instead
          </button>
          <input
            ref={fallbackInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onCapture(file);
              if (fallbackInputRef.current) fallbackInputRef.current.value = "";
            }}
          />
        </div>
      )}

      {isUploading && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="w-3 h-3 animate-spin" />Processing photo…
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />{error}
        </p>
      )}
    </div>
  );
}