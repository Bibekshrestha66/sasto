import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, Send, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Contact() {
  const { data: config } = trpc.system.getCompanyConfig.useQuery();
  const submitContactMsg = trpc.system.submitReport.useMutation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitContactMsg.mutateAsync({
        reporterName: name,
        reporterEmail: email,
        subject: subject || "Contact Inquiry",
        description: message,
      });
      toast.success("Message sent successfully! We will get back to you soon.");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const supportPhone = config?.phone || "+977-1-4123456";
  const supportEmail = config?.email || "support@sasto.com";
  const supportLocation = config?.location || "New Baneshwor, Kathmandu";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header banner */}
      <section className="bg-gradient-to-r from-green-600 to-green-500 py-10 md:py-12 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Contact Us</h1>
          <p className="text-white/90 text-base mb-6 max-w-2xl mx-auto">
            Have questions or feedback? Our team is here to support you.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">Fast</p>
              <p className="text-xs">Replies</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">Phone</p>
              <p className="text-xs">Direct Line</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">Kathmandu</p>
              <p className="text-xs">Corporate HQ</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">24/7</p>
              <p className="text-xs">Online Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Contact details info cards */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="p-6 rounded-3xl border-none shadow-lg bg-white flex items-start gap-4">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider mb-1">Phone Support</h3>
              <p className="font-bold text-slate-700 text-base">{supportPhone}</p>
              <p className="text-xs text-slate-400 mt-1">Sun - Fri, 9:00 AM - 6:00 PM</p>
            </div>
          </Card>

          <Card className="p-6 rounded-3xl border-none shadow-lg bg-white flex items-start gap-4">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider mb-1">Email Support</h3>
              <p className="font-bold text-slate-700 text-base">{supportEmail}</p>
              <p className="text-xs text-slate-400 mt-1">Response within 24 hours</p>
            </div>
          </Card>

          <Card className="p-6 rounded-3xl border-none shadow-lg bg-white flex items-start gap-4">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider mb-1">Corporate HQ</h3>
              <p className="font-bold text-slate-700 text-base">{supportLocation}</p>
              <p className="text-xs text-slate-400 mt-1">Sasto Tech Private Limited</p>
            </div>
          </Card>
        </div>

        {/* Right Side: Message Submission Form */}
        <div className="lg:col-span-2">
          <Card className="p-6 md:p-8 rounded-[2rem] border-none shadow-xl bg-white space-y-6">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-wider">Send a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-xs font-black text-slate-500 uppercase tracking-wider">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                    placeholder="e.g. Ram Bahadur"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs font-black text-slate-500 uppercase tracking-wider">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                    placeholder="e.g. ram@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="subject" className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  Subject
                </Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                  placeholder="e.g. Feedback on Auctions"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="message" className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  Your Message <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="message"
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="rounded-xl bg-slate-50 border-none font-bold min-h-[150px]"
                  placeholder="Tell us what you need help with..."
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
                    Sending Message...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </Card>
        </div>

      </main>
    </div>
  );
}
