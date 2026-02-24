import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Briefcase, FileText, DollarSign, Star, MessageSquare, User, Layers, Plus, Trash2, ExternalLink, Github, Globe, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  status: string;
  createdAt: string;
  coverLetter?: string;
}

interface Contract {
  id: string;
  employerId: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

interface DeveloperProfile {
  bio: string;
  skills: string[];
  yearsExperience: number;
  availability: string;
  rateType: string;
  rateAmount: number;
  ratingAvg: number;
  location: string;
  resumeUrl?: string;
  avatarUrl?: string;
  githubUrl?: string;
  portfolioLinks?: string[];
}

interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ShowcaseItem {
  id: string;
  title: string;
  tagline: string;
  description: string;
  techStack: string[];
  projectUrl?: string;
  repoUrl?: string;
  imageUrl?: string;
  category: string;
  lookingFor: string;
  status: string;
  likes: number;
  createdAt: string;
}

const EMPTY_SHOWCASE_FORM = {
  title: "",
  tagline: "",
  description: "",
  techStack: "",
  projectUrl: "",
  repoUrl: "",
  category: "web" as string,
  lookingFor: "both" as string,
  status: "active" as string
};

const statusColor = (s: string) =>
  s === "accepted" || s === "active" || s === "completed" ? "default" :
  s === "rejected" ? "destructive" : "secondary";

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} className={`h-4 w-4 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
    ))}
  </div>
);

const DeveloperDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [appStatusFilter, setAppStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showcases, setShowcases] = useState<ShowcaseItem[]>([]);
  const [showcaseDialogOpen, setShowcaseDialogOpen] = useState(false);
  const [editingShowcase, setEditingShowcase] = useState<ShowcaseItem | null>(null);
  const [showcaseForm, setShowcaseForm] = useState({ ...EMPTY_SHOWCASE_FORM });
  const [showcaseImageFile, setShowcaseImageFile] = useState<File | null>(null);
  const [showcaseImagePreview, setShowcaseImagePreview] = useState<string | null>(null);
  const [showcaseSaving, setShowcaseSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [appsData, contractsData, profileData, reviewsData, showcasesData] = await Promise.all([
        api<Application[]>("/applications/me"),
        api<Contract[]>("/contracts"),
        api<DeveloperProfile>(`/developers/${user?.id}`),
        api<Review[]>("/reviews/me"),
        api<ShowcaseItem[]>("/showcases/me")
      ]);
      setApplications(appsData);
      setContracts(contractsData);
      setProfile(profileData);
      setReviews(reviewsData);
      setShowcases(showcasesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleWithdraw = async (appId: string) => {
    if (!confirm("Withdraw this application?")) return;
    try {
      await api(`/applications/${appId}`, { method: "DELETE" });
      toast({ title: "Application withdrawn" });
      fetchAll();
    } catch (err) {
      toast({ title: (err as Error).message, variant: "destructive" });
    }
  };

  const openCreateShowcase = () => {
    setEditingShowcase(null);
    setShowcaseForm({ ...EMPTY_SHOWCASE_FORM });
    setShowcaseImageFile(null);
    setShowcaseImagePreview(null);
    setShowcaseDialogOpen(true);
  };

  const openEditShowcase = (item: ShowcaseItem) => {
    setEditingShowcase(item);
    setShowcaseForm({
      title: item.title,
      tagline: item.tagline,
      description: item.description,
      techStack: item.techStack.join(", "),
      projectUrl: item.projectUrl ?? "",
      repoUrl: item.repoUrl ?? "",
      category: item.category,
      lookingFor: item.lookingFor,
      status: item.status
    });
    setShowcaseImageFile(null);
    setShowcaseImagePreview(item.imageUrl ?? null);
    setShowcaseDialogOpen(true);
  };

  const handleSaveShowcase = async () => {
    // ── Client-side validation (mirrors backend Zod rules) ──────────────────
    const techArr = showcaseForm.techStack.split(",").map((s) => s.trim()).filter(Boolean);
    if (showcaseForm.title.trim().length < 3) {
      toast({ title: "Title must be at least 3 characters", variant: "destructive" }); return;
    }
    if (showcaseForm.tagline.trim().length < 10) {
      toast({ title: "Tagline must be at least 10 characters", variant: "destructive" }); return;
    }
    if (showcaseForm.description.trim().length < 20) {
      toast({ title: "Description must be at least 20 characters", variant: "destructive" }); return;
    }
    if (techArr.length === 0) {
      toast({ title: "Add at least one technology to the tech stack", variant: "destructive" }); return;
    }
    if (showcaseForm.projectUrl && !/^https?:\/\//i.test(showcaseForm.projectUrl)) {
      toast({ title: "Live demo URL must start with https://", variant: "destructive" }); return;
    }
    if (showcaseForm.repoUrl && !/^https?:\/\//i.test(showcaseForm.repoUrl)) {
      toast({ title: "Repository URL must start with https://", variant: "destructive" }); return;
    }

    setShowcaseSaving(true);
    try {
      const payload = {
        ...showcaseForm,
        techStack: techArr,
        projectUrl: showcaseForm.projectUrl.trim() || undefined,
        repoUrl: showcaseForm.repoUrl.trim() || undefined
      };
      let showcaseId = editingShowcase?.id;
      if (editingShowcase) {
        await api(`/showcases/${editingShowcase.id}`, { method: "PATCH", body: payload });
      } else {
        const res = await api<{ id: string }>("/showcases", { method: "POST", body: payload });
        showcaseId = res.id;
      }
      // Upload image if selected
      if (showcaseImageFile && showcaseId) {
        const fd = new FormData();
        fd.append("image", showcaseImageFile);
        const token = localStorage.getItem("accessToken");
        const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
        const imgRes = await fetch(`${API_BASE}/showcases/${showcaseId}/image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd
        });
        if (!imgRes.ok) {
          const imgErr = await imgRes.json().catch(() => ({ message: "Image upload failed" }));
          toast({ title: imgErr.message || "Image upload failed", variant: "destructive" });
        }
      }
      toast({ title: editingShowcase ? "Showcase updated!" : "Showcase created!" });
      setShowcaseDialogOpen(false);
      fetchAll();
    } catch (err) {
      toast({ title: (err as Error).message || "Something went wrong", variant: "destructive" });
    } finally {
      setShowcaseSaving(false);
    }
  };

  const handleDeleteShowcase = async (id: string) => {
    if (!confirm("Delete this showcase? This cannot be undone.")) return;
    try {
      await api(`/showcases/${id}`, { method: "DELETE" });
      toast({ title: "Showcase deleted" });
      fetchAll();
    } catch (err) {
      toast({ title: (err as Error).message, variant: "destructive" });
    }
  };

  const activeContracts = contracts.filter((c) => c.status === "active" || c.status === "disputed");
  const historyContracts = contracts.filter((c) => c.status === "completed" || c.status === "cancelled");
  const totalEarnings = historyContracts.filter((c) => c.status === "completed").reduce((s, c) => s + c.totalAmount, 0);
  const pendingEarnings = contracts.filter((c) => c.status === "active").reduce((s, c) => s + c.totalAmount, 0);
  const filteredApps = appStatusFilter === "all" ? applications : applications.filter((a) => a.status === appStatusFilter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-xl sm:text-3xl font-heading font-bold">Welcome, {user?.fullName}</h1>
              <p className="text-muted-foreground">Developer Dashboard</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link to="/messages">
                <Button variant="outline" size="sm"><MessageSquare className="h-4 w-4 mr-1" />Messages</Button>
              </Link>
              <Link to="/profile/edit">
                <Button variant="outline" size="sm"><User className="h-4 w-4 mr-1" />Edit Profile</Button>
              </Link>
              <Link to="/jobs">
                <Button size="sm"><Briefcase className="h-4 w-4 mr-1" />Browse Jobs</Button>
              </Link>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="applications">
                Applications
                <Badge variant="secondary" className="ml-1 text-xs">{applications.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="contracts">
                Contracts
                {activeContracts.length > 0 && <Badge variant="secondary" className="ml-1 text-xs">{activeContracts.length} active</Badge>}
                {historyContracts.length > 0 && <Badge variant="outline" className="ml-1 text-xs">{historyContracts.length} done</Badge>}
              </TabsTrigger>
              <TabsTrigger value="reviews">
                Reviews
                <Badge variant="secondary" className="ml-1 text-xs">{reviews.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="showcase">
                <Layers className="h-3.5 w-3.5 mr-1" />
                Showcase
                <Badge variant="secondary" className="ml-1 text-xs">{showcases.length}</Badge>
              </TabsTrigger>
            </TabsList>

            {/* ── OVERVIEW ─────────────────────────────────────────────── */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Applications</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{applications.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {applications.filter((a) => a.status === "accepted").length} accepted
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{activeContracts.length}</div>
                    <p className="text-xs text-muted-foreground">${pendingEarnings.toLocaleString()} pending</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${totalEarnings.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {contracts.filter((c) => c.status === "completed").length} completed
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Rating</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {profile?.ratingAvg ? profile.ratingAvg.toFixed(1) : "—"}
                    </div>
                    <p className="text-xs text-muted-foreground">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-base">Recent Applications</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {applications.slice(0, 5).map((app) => (
                      <div key={app.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{app.jobTitle || "Unknown Job"}</p>
                          <p className="text-xs text-muted-foreground">{app.companyName || "Unknown Company"}</p>
                        </div>
                        <Badge variant={statusColor(app.status)}>{app.status}</Badge>
                      </div>
                    ))}
                    {!applications.length && <p className="text-muted-foreground text-sm">No applications yet</p>}
                    <Link to="/jobs">
                      <Button variant="outline" size="sm" className="w-full mt-2">Browse Jobs</Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Active Contracts</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {activeContracts.slice(0, 5).map((c) => (
                      <Link
                        key={c.id}
                        to={`/contracts/${c.id}`}
                        className="flex items-center justify-between hover:bg-muted/50 p-2 rounded"
                      >
                        <div>
                          <p className="font-medium text-sm">Contract #{c.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">${c.totalAmount.toLocaleString()}</p>
                        </div>
                        <Badge variant={statusColor(c.status)}>{c.status}</Badge>
                      </Link>
                    ))}
                    {!activeContracts.length && <p className="text-muted-foreground text-sm">No active contracts</p>}
                  </CardContent>
                </Card>
              </div>

              {/* Profile summary */}
              {profile && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Profile Summary</CardTitle>
                    <Link to="/profile/edit"><Button variant="outline" size="sm">Edit</Button></Link>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-4 mb-4">
                      {profile.avatarUrl && (
                        <img
                          src={profile.avatarUrl}
                          alt="Avatar"
                          className="h-16 w-16 rounded-full object-cover border-2 border-muted flex-shrink-0"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-1">Bio</p>
                        <p className="text-sm">{profile.bio || "Not set — add a bio in Edit Profile"}</p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-muted-foreground">Rate</p>
                        <p className="font-medium">${profile.rateAmount}/{profile.rateType}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Experience</p>
                        <p className="font-medium">{profile.yearsExperience} yr{profile.yearsExperience !== 1 ? "s" : ""}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Availability</p>
                        <p className="font-medium capitalize">{profile.availability}</p>
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                        {!profile.skills.length && <p className="text-sm text-muted-foreground">No skills listed</p>}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {profile.resumeUrl && (
                        <a href={profile.resumeUrl} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm">View Resume</Button>
                        </a>
                      )}
                      {profile.githubUrl && (
                        <a href={profile.githubUrl} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm">GitHub</Button>
                        </a>
                      )}
                      {(profile.portfolioLinks ?? []).map((link, i) => (
                        <a key={i} href={link} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm">Portfolio {i + 1}</Button>
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── APPLICATIONS ─────────────────────────────────────────── */}
            <TabsContent value="applications">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
                  <CardTitle>My Applications ({filteredApps.length})</CardTitle>
                  <Select value={appStatusFilter} onValueChange={setAppStatusFilter}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="shortlisted">Shortlisted</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent>
                  {filteredApps.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No applications found</p>
                      <Link to="/jobs"><Button>Browse Jobs</Button></Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredApps.map((app) => (
                        <div
                          key={app.id}
                          className="flex items-start justify-between p-4 border rounded-lg gap-4 flex-wrap"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{app.jobTitle || "Unknown Job"}</p>
                              <Badge variant={statusColor(app.status)}>{app.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {app.companyName || "Unknown Company"} · {new Date(app.createdAt).toLocaleDateString()}
                            </p>
                            {app.coverLetter && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{app.coverLetter}</p>
                            )}
                          </div>
                          <div className="flex gap-2 flex-wrap flex-shrink-0">
                            <Link to={`/jobs/${app.jobId}`}>
                              <Button variant="outline" size="sm">View Job</Button>
                            </Link>
                            {app.status === "submitted" && (
                              <Button variant="destructive" size="sm" onClick={() => handleWithdraw(app.id)}>
                                Withdraw
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── CONTRACTS ────────────────────────────────────────────── */}
            <TabsContent value="contracts">
              <div className="space-y-6">
                {/* Active contracts */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Active Contracts ({activeContracts.length})
                  </h3>
                  {activeContracts.length === 0 ? (
                    <Card>
                      <CardContent className="py-6 text-center text-muted-foreground text-sm">
                        No active contracts. Apply to jobs to get started.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {activeContracts.map((c) => (
                        <Card key={c.id}>
                          <CardContent className="pt-5 pb-5">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                              <div>
                                <p className="font-semibold">Contract #{c.id.slice(0, 8)}</p>
                                <p className="text-sm text-muted-foreground">Started {new Date(c.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold">${c.totalAmount.toLocaleString()}</span>
                                <Badge variant={c.status === "disputed" ? "destructive" : "default"}>{c.status}</Badge>
                                <Link to={`/contracts/${c.id}`}>
                                  <Button size="sm">Manage</Button>
                                </Link>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contract history */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    History ({historyContracts.length})
                  </h3>
                  {historyContracts.length === 0 ? (
                    <Card>
                      <CardContent className="py-6 text-center text-muted-foreground text-sm">
                        Completed and cancelled contracts will appear here.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {historyContracts.map((c) => (
                        <Card key={c.id} className="opacity-80 bg-muted/20">
                          <CardContent className="pt-5 pb-5">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                              <div>
                                <p className="font-semibold">Contract #{c.id.slice(0, 8)}</p>
                                <p className="text-sm text-muted-foreground">
                                  {c.status === "completed" ? "Completed" : "Cancelled"} · {new Date(c.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-muted-foreground">${c.totalAmount.toLocaleString()}</span>
                                <Badge variant={c.status === "completed" ? "secondary" : "outline"} className={c.status === "completed" ? "text-green-700 border-green-300 bg-green-50 dark:bg-green-950/30" : ""}>
                                  {c.status === "completed" ? "✓ Completed" : "Cancelled"}
                                </Badge>
                                <Link to={`/contracts/${c.id}`}>
                                  <Button size="sm" variant="outline">View</Button>
                                </Link>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ── REVIEWS ──────────────────────────────────────────────── */}
            <TabsContent value="reviews">
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">
                        No reviews yet. Complete contracts to receive reviews.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  reviews.map((r) => (
                    <Card key={r.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between flex-wrap gap-4">
                          <div>
                            <p className="font-medium">{r.reviewerName || "Anonymous"}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(r.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <StarRating rating={r.rating} />
                        </div>
                        {r.comment && (
                          <p className="text-sm text-muted-foreground mt-3">{r.comment}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
            {/* ── SHOWCASE ─────────────────────────────────────────────── */}
            <TabsContent value="showcase">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">My Showcase</h3>
                    <p className="text-sm text-muted-foreground">Present your products to employers and investors</p>
                  </div>
                  <Button size="sm" onClick={openCreateShowcase}>
                    <Plus className="h-4 w-4 mr-1" /> Add Project
                  </Button>
                </div>

                {showcases.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Layers className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="font-medium mb-1">No projects showcased yet</p>
                      <p className="text-sm text-muted-foreground mb-4">Add your best work to attract employers and investors.</p>
                      <Button onClick={openCreateShowcase}><Plus className="h-4 w-4 mr-1" /> Add Your First Project</Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {showcases.map((item) => (
                      <Card key={item.id} className="flex flex-col">
                        {item.imageUrl && (
                          <div className="h-36 overflow-hidden rounded-t-lg">
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <CardContent className="pt-4 pb-4 flex flex-col flex-1">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-sm line-clamp-1">{item.title}</h4>
                            <div className="flex gap-1 shrink-0">
                              <Badge variant={item.status === "active" ? "default" : "secondary"} className="text-xs capitalize">{item.status}</Badge>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{item.tagline}</p>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {item.techStack.slice(0, 3).map((t) => (
                              <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                            ))}
                            {item.techStack.length > 3 && <Badge variant="outline" className="text-xs">+{item.techStack.length - 3}</Badge>}
                          </div>
                          <div className="mt-auto flex items-center justify-between">
                            <div className="flex gap-2">
                              {item.projectUrl && (
                                <a href={item.projectUrl} target="_blank" rel="noreferrer">
                                  <Button variant="ghost" size="sm" className="h-7 px-2"><Globe className="h-3.5 w-3.5" /></Button>
                                </a>
                              )}
                              {item.repoUrl && (
                                <a href={item.repoUrl} target="_blank" rel="noreferrer">
                                  <Button variant="ghost" size="sm" className="h-7 px-2"><Github className="h-3.5 w-3.5" /></Button>
                                </a>
                              )}
                              <Link to={`/showcase/${item.id}`}>
                                <Button variant="ghost" size="sm" className="h-7 px-2"><ExternalLink className="h-3.5 w-3.5" /></Button>
                              </Link>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => openEditShowcase(item)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="destructive" size="sm" className="h-7 px-2" onClick={() => handleDeleteShowcase(item.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* ── Showcase Dialog ───────────────────────────────────────── */}
          <Dialog open={showcaseDialogOpen} onOpenChange={setShowcaseDialogOpen}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingShowcase ? "Edit Showcase" : "Add New Showcase"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label>Title *</Label>
                  <Input
                    placeholder="My Awesome App"
                    value={showcaseForm.title}
                    onChange={(e) => setShowcaseForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Tagline * <span className="text-xs text-muted-foreground">(min 10 chars)</span></Label>
                  <Input
                    placeholder="A short, catchy description of what it does"
                    value={showcaseForm.tagline}
                    onChange={(e) => setShowcaseForm((f) => ({ ...f, tagline: e.target.value }))}
                  />
                  <p className={`text-xs ${showcaseForm.tagline.length < 10 ? "text-destructive" : "text-muted-foreground"}`}>
                    {showcaseForm.tagline.length} / 200 characters
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Description * <span className="text-xs text-muted-foreground">(min 20 chars)</span></Label>
                  <Textarea
                    placeholder="Describe the problem it solves, how it works, key features…"
                    rows={4}
                    value={showcaseForm.description}
                    onChange={(e) => setShowcaseForm((f) => ({ ...f, description: e.target.value }))}
                  />
                  <p className={`text-xs ${showcaseForm.description.length < 20 ? "text-destructive" : "text-muted-foreground"}`}>
                    {showcaseForm.description.length} / 2000 characters
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Tech Stack * <span className="text-xs text-muted-foreground">(comma-separated)</span></Label>
                  <Input
                    placeholder="React, Node.js, PostgreSQL"
                    value={showcaseForm.techStack}
                    onChange={(e) => setShowcaseForm((f) => ({ ...f, techStack: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Category</Label>
                    <Select value={showcaseForm.category} onValueChange={(v) => setShowcaseForm((f) => ({ ...f, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="web">Web</SelectItem>
                        <SelectItem value="mobile">Mobile</SelectItem>
                        <SelectItem value="api">API / Backend</SelectItem>
                        <SelectItem value="data">Data</SelectItem>
                        <SelectItem value="ai">AI / ML</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Looking For</Label>
                    <Select value={showcaseForm.lookingFor} onValueChange={(v) => setShowcaseForm((f) => ({ ...f, lookingFor: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employers">Employers</SelectItem>
                        <SelectItem value="investors">Investors</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Live Demo URL</Label>
                  <Input
                    placeholder="https://myapp.com"
                    value={showcaseForm.projectUrl}
                    onChange={(e) => setShowcaseForm((f) => ({ ...f, projectUrl: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Repository URL</Label>
                  <Input
                    placeholder="https://github.com/you/repo"
                    value={showcaseForm.repoUrl}
                    onChange={(e) => setShowcaseForm((f) => ({ ...f, repoUrl: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Screenshot / Cover Image</Label>
                  {showcaseImagePreview && (
                    <div className="mb-2 rounded-lg overflow-hidden border border-border h-32">
                      <img src={showcaseImagePreview} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setShowcaseImageFile(file);
                        setShowcaseImagePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Visibility</Label>
                    <Select value={showcaseForm.status} onValueChange={(v) => setShowcaseForm((f) => ({ ...f, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Public (visible to all)</SelectItem>
                        <SelectItem value="draft">Draft (hidden)</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowcaseDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveShowcase} disabled={showcaseSaving}>
                  {showcaseSaving ? "Saving…" : editingShowcase ? "Save Changes" : "Publish Showcase"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DeveloperDashboard;
