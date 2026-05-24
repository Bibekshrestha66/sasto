import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, Send, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Report() {
  const submitReportMutation = trpc.system.submitReport.useMutation();

  const [listingId, setListingId] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("scam");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !description.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReportMutation.mutateAsync({
        reporterName: "User Flag Portal",
        reporterEmail: email,
        subject: `[Report: ${category.toUpperCase()}] Ref: ${listingId || "General"}`,
        description: description,
      });
      setIsSubmitted(true);
      toast.success("Thank you for your report. We are investigating!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        {/* Header banner */}
        <section className="bg-gradient-to-r from-green-600 to-green-500 py-10 md:py-12 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Report an Issue</h1>
            <p className="text-white/90 text-base mb-6 max-w-2xl mx-auto">
              Help us keep Sasto Marketplace safe. Report scams, harassment, or suspicious listings.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
              <div className="bg-white/20 rounded-lg p-2">
                <p className="text-xl font-bold">24-Hr</p>
                <p className="text-xs">Response Review</p>
              </div>
              <div className="bg-white/20 rounded-lg p-2">
                <p className="text-xl font-bold">Active</p>
                <p className="text-xs">Trust Team</p>
              </div>
              <div className="bg-white/20 rounded-lg p-2">
                <p className="text-xl font-bold">100%</p>
                <p className="text-xs">Confidential</p>
              </div>
              <div className="bg-white/20 rounded-lg p-2">
                <p className="text-xl font-bold">Safe</p>
                <p className="text-xs">Environment</p>
              </div>
            </div>
          </div>
        </section>

        {/* Form Container */}
        <main className="max-w-xl mx-auto px-4 py-12">
          {isSubmitted ? (
            <Card className="p-8 rounded-[2rem] border-none shadow-xl bg-white text-center space-y-6 animate-fade-in">
              <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
              <h2 className="text-2xl font-black text-slate-800">Report Submitted!</h2>
              <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto">
                Thank you for contributing to our platform's safety. Sasto moderators review flagged content and reported activities within 24 hours to ensure high safety standards.
              </p>
              <Button
                onClick={() => {
                  setListingId("");
                  setEmail("");
                  setCategory("scam");
                  setDescription("");
                  setIsSubmitted(false);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 h-12 font-black"
              >
                Submit Another Report
              </Button>
            </Card>
          ) : (
            <Card className="p-6 md:p-8 rounded-[2rem] border-none shadow-xl bg-white space-y-6">
              <div className="flex items-center gap-2.5 pb-2">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">Report Form</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs font-black text-slate-500 uppercase tracking-wider">
                    Your Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                    placeholder="e.g. you@example.com"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="listingId" className="text-xs font-black text-slate-500 uppercase tracking-wider">
                    Listing ID or URL (Optional)
                  </Label>
                  <Input
                    id="listingId"
                    type="text"
                    value={listingId}
                    onChange={(e) => setListingId(e.target.value)}
                    className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                    placeholder="e.g. sasto.com/listing/45"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="category" className="text-xs font-black text-slate-500 uppercase tracking-wider">
                    Category of Issue <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-12 px-3 rounded-xl bg-slate-50 border-none font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 text-sm"
                  >
                    <option value="scam">Scam, Fraud, or Deception</option>
                    <option value="counterfeit">Fake or Replica Goods</option>
                    <option value="harassment">Abusive or Inappropriate Chat</option>
                    <option value="spammer">Spam or Misleading Ad Category</option>
                    <option value="other">Other Issues</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="description" className="text-xs font-black text-slate-500 uppercase tracking-wider">
                    Detailed Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="rounded-xl bg-slate-50 border-none font-bold min-h-[120px] focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Provide details about the issue so our trust & safety team can quickly investigate..."
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-slate-900 hover:bg-black text-white h-14 rounded-xl font-black shadow-md flex items-center justify-center gap-2 pt-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting Report...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Report
                    </>
                  )}
                </Button>
              </form>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
