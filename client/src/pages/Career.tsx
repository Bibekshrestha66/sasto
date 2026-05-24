import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, DollarSign, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Career() {
  const { data: jobs, isLoading } = trpc.system.getCareers.useQuery();

  const handleApply = (title: string) => {
    toast.success(`Application form for "${title}" opened! Send your CV to careers@sasto.com.`);
  };

  const jobsCount = jobs ? jobs.length : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section – EXACT SAME AS HELP, ABOUT, TERMS */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Careers at Sasto</h1>
          <p className="text-green-100 text-base mb-6 max-w-2xl mx-auto">
            Build Nepal's leading e-commerce and local marketplace platform. Join our energetic team!
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">{isLoading ? "..." : jobsCount}</p>
              <p className="text-xs">Open Positions</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">Hybrid</p>
              <p className="text-xs">Work Options</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">Top Pay</p>
              <p className="text-xs">Competitive Salary</p>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <p className="text-xl font-bold">Growing</p>
              <p className="text-xs">Energetic Team</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        {/* Core Values Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black text-slate-800 text-center uppercase tracking-wider">Why Work with Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 rounded-3xl border-none shadow-md bg-white text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Impact Driven</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect millions of buyers and sellers directly across Nepal to stimulate local commerce.
              </p>
            </Card>

            <Card className="p-6 rounded-3xl border-none shadow-md bg-white text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Growth & Learning</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Work alongside high-caliber software developers and business minds using cutting-edge tech.
              </p>
            </Card>

            <Card className="p-6 rounded-3xl border-none shadow-md bg-white text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Competitive Perks</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enjoy market-rate competitive compensation packets, hybrid flexible working policies, and robust health packages.
              </p>
            </Card>
          </div>
        </section>

        {/* Job Listings Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-wider">Open Positions</h2>
          
          {isLoading ? (
            <div className="text-center py-12 text-slate-400 font-bold">
              Loading active positions...
            </div>
          ) : !jobs || jobs.length === 0 ? (
            <div className="text-center py-16 px-6 rounded-[2rem] border-2 border-dashed border-slate-200 bg-white space-y-4 shadow-sm">
              <Briefcase className="w-16 h-16 text-slate-300 mx-auto animate-pulse" />
              <h3 className="text-xl font-black text-slate-700">No Active Openings</h3>
              <p className="text-xs text-slate-450 max-w-sm mx-auto leading-relaxed">
                We do not have any active postings at this micro-moment, but we are always scouting for top talent. Submit an open pitch to careers@sasto.com!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <Card key={job.id} className="p-6 rounded-3xl border-none shadow-md bg-white flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 font-bold text-[10px]">{job.department}</Badge>
                      <Badge variant="outline" className="text-slate-400 font-bold text-[10px]">{job.type}</Badge>
                    </div>
                    <h3 className="text-lg font-black text-slate-800">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> {job.salaryRange}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleApply(job.title)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 px-6 font-black shrink-0"
                  >
                    Apply Now
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Call to action */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-center text-white space-y-4">
          <h3 className="text-xl font-bold">Don't see a fitting open position?</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            We are always on the lookout for stellar talent in design, security, and community outreach. Send your open pitch and resume to <strong className="text-emerald-500">careers@sasto.com</strong>.
          </p>
        </div>
      </main>
    </div>
  );
}