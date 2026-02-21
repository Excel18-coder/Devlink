import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, DollarSign, Briefcase } from "lucide-react";
import { api } from "@/lib/api";

interface Job {
  id: string;
  title: string;
  companyName: string;
  location: string;
  budgetMin: number;
  budgetMax: number;
  rateType: string;
  jobType: string;
  requiredSkills: string[];
  createdAt: string;
}

const typeColor: Record<string, string> = {
  "remote": "bg-accent/10 text-accent",
  "contract": "bg-primary/10 text-primary",
  "onsite": "bg-muted text-muted-foreground",
};

const Jobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async (searchTerm?: string) => {
    try {
      const params = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : "";
      const data = await api<Job[]>(`/jobs${params}`);
      setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    fetchJobs(search);
  };

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "1d ago";
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-10">
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Browse Jobs</h1>
            <p className="text-muted-foreground">Find your next remote or contract opportunity.</p>
          </div>

          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search jobs by title, skill, or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-body"
              />
            </div>
            <Button variant="outline" size="default" onClick={handleSearch}>Search</Button>
          </div>

          {/* Job List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No jobs found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <Link key={job.id} to={`/jobs/${job.id}`}>
                  <div className="bg-card border border-border rounded-xl p-6 card-elevated flex flex-col lg:flex-row lg:items-center gap-4 hover:border-primary/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-heading font-semibold text-card-foreground text-lg">{job.title}</h3>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${typeColor[job.jobType] || ""}`}>
                          {job.jobType}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{job.companyName}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location || "Remote"}</span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          ${job.budgetMin?.toLocaleString()} - ${job.budgetMax?.toLocaleString()}/{job.rateType}
                        </span>
                        <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{getTimeAgo(job.createdAt)}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {job.requiredSkills?.map(skill => (
                          <Badge key={skill} variant="secondary" className="text-xs font-body">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="default" size="sm" className="lg:self-center shrink-0">View Details</Button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Jobs;
