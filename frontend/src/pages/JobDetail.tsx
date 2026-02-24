import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { MapPin, DollarSign, Briefcase, Clock, ArrowLeft } from "lucide-react";
import { getMissingProfileFields } from "@/lib/profileUtils";

interface Job {
  id: string;
  employerId: string;
  companyName: string;
  title: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: string;
  budgetMin: number;
  budgetMax: number;
  rateType: string;
  jobType: string;
  location: string;
  status: string;
  createdAt: string;
}

const JobDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [devProfileComplete, setDevProfileComplete] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const data = await api<Job>(`/jobs/${id}`);
        setJob(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  // Pre-check developer profile completeness so the Apply button is ready
  useEffect(() => {
    if (user?.role !== "developer") return;
    api<{ bio?: string; skills?: string[]; yearsExperience?: number; location?: string; rateAmount?: number; avatarUrl?: string }>(`/developers/${user.id}`)
      .then((p) => setDevProfileComplete(getMissingProfileFields(p).length === 0))
      .catch(() => setDevProfileComplete(false));
  }, [user]);

  const handleApply = async () => {
    if (!user) {
      toast({ title: "Please log in to apply", variant: "destructive" });
      return;
    }
    if (devProfileComplete === false) {
      toast({ title: "Complete your profile first", description: "You need a complete profile before applying for jobs.", variant: "destructive" });
      navigate(`/profile/edit?next=/jobs/${id}`);
      return;
    }
    setApplying(true);
    try {
      await api(`/applications/${id}`, { method: "POST", body: {} });
      toast({ title: "Application submitted!" });
      setApplied(true);
    } catch (err) {
      toast({ title: "Failed to apply", description: (err as Error).message, variant: "destructive" });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 container mx-auto px-4">
          <p>Job not found</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Button variant="ghost" size="sm" className="mb-4 -ml-1" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl sm:text-2xl mb-2 break-words">{job.title}</CardTitle>
                      <p className="text-muted-foreground">{job.companyName}</p>
                    </div>
                    <Badge className="shrink-0">{job.jobType}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location || "Remote"}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      ${job.budgetMin?.toLocaleString()} - ${job.budgetMax?.toLocaleString()}/{job.rateType}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {job.experienceLevel} level
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.requiredSkills?.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="whitespace-pre-wrap text-muted-foreground">{job.description}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div>
              <Card>
                <CardContent className="pt-6">
                  {user?.role === "developer" ? (
                    applied ? (
                      <Button disabled className="w-full">
                        Applied
                      </Button>
                    ) : devProfileComplete === false ? (
                      <div className="space-y-2">
                        <Button onClick={handleApply} className="w-full" variant="destructive">
                          Complete Profile to Apply
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">Your profile must be complete before you can apply.</p>
                      </div>
                    ) : (
                      <Button onClick={handleApply} disabled={applying || devProfileComplete === null} className="w-full">
                        {applying ? "Applying..." : "Apply Now"}
                      </Button>
                    )
                  ) : user?.role === "employer" && user.id === job.employerId ? (
                    <Link to={`/jobs/${job.id}/applicants`}>
                      <Button className="w-full">View Applicants</Button>
                    </Link>
                  ) : !user ? (
                    <Link to="/login">
                      <Button className="w-full">Login to Apply</Button>
                    </Link>
                  ) : null}

                  <div className="mt-6 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Job Type</span>
                      <span className="capitalize">{job.jobType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Experience</span>
                      <span className="capitalize">{job.experienceLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rate Type</span>
                      <span className="capitalize">{job.rateType}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default JobDetail;
