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
import {
  ArrowLeft, ExternalLink, Github, Heart, Star, Globe,
  Briefcase, TrendingUp, Users, Calendar
} from "lucide-react";

interface ShowcaseDetail {
  id: string;
  developerId: string;
  developerName: string;
  developerAvatar: string | null;
  developerRating: number;
  developerSkills: string[];
  developerExperience: number;
  developerAvailability: string;
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
  likedBy: string[];
  createdAt: string;
}

const categoryLabel: Record<string, string> = {
  web: "Web", mobile: "Mobile", api: "API / Backend",
  data: "Data", ai: "AI / ML", design: "Design", other: "Other"
};

const ShowcaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showcase, setShowcase] = useState<ShowcaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api<ShowcaseDetail>(`/showcases/${id}`);
        setShowcase(data);
      } catch {
        toast({ title: "Showcase not found", variant: "destructive" });
        navigate("/showcase");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLike = async () => {
    if (!user) {
      toast({ title: "Sign in to like showcases", variant: "destructive" });
      return;
    }
    setLiking(true);
    try {
      const res = await api<{ likes: number; liked: boolean }>(`/showcases/${id}/like`, { method: "POST" });
      setShowcase((prev) => prev ? { ...prev, likes: res.likes, likedBy: res.liked ? [...prev.likedBy, user.id] : prev.likedBy.filter((uid) => uid !== user.id) } : prev);
    } catch (err) {
      toast({ title: (err as Error).message, variant: "destructive" });
    } finally {
      setLiking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!showcase) return null;

  const isLiked = user ? showcase.likedBy.includes(user.id) : false;
  const lookingForLabels: Record<string, { label: string; icon: React.ReactNode; desc: string }> = {
    employers: {
      label: "Open to Hiring",
      icon: <Briefcase className="h-4 w-4" />,
      desc: "This developer is open to job opportunities related to this project."
    },
    investors: {
      label: "Seeking Investment",
      icon: <TrendingUp className="h-4 w-4" />,
      desc: "This developer is looking for investors or co-founders for this project."
    },
    both: {
      label: "Open to Both",
      icon: <Users className="h-4 w-4" />,
      desc: "This developer welcomes both hiring opportunities and investor interest."
    }
  };
  const lf = lookingForLabels[showcase.lookingFor] ?? lookingForLabels.both;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">

          {/* Back */}
          <Button variant="ghost" size="sm" className="mb-6 -ml-1" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Showcase
          </Button>

          <div className="grid lg:grid-cols-3 gap-8">

            {/* ── Main content ─────────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Hero image */}
              {showcase.imageUrl ? (
                <div className="rounded-xl overflow-hidden border border-border h-64 sm:h-80">
                  <img src={showcase.imageUrl} alt={showcase.title} className="w-full h-full object-cover" decoding="async" />
                </div>
              ) : (
                <div className="rounded-xl border border-border h-64 sm:h-80 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <span className="text-7xl font-heading font-bold text-primary/20">
                    {showcase.title.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Title & meta */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="secondary" className="capitalize">{categoryLabel[showcase.category] ?? showcase.category}</Badge>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${showcase.lookingFor === "employers" ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300" : showcase.lookingFor === "investors" ? "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300" : "bg-primary/10 text-primary"}`}>
                    {lf.icon} {lf.label}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-2">{showcase.title}</h1>
                <p className="text-muted-foreground text-base sm:text-lg">{showcase.tagline}</p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                {showcase.projectUrl && (
                  <a href={showcase.projectUrl} target="_blank" rel="noreferrer">
                    <Button variant="hero" size="sm">
                      <Globe className="h-4 w-4 mr-1.5" /> Live Demo
                    </Button>
                  </a>
                )}
                {showcase.repoUrl && (
                  <a href={showcase.repoUrl} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm">
                      <Github className="h-4 w-4 mr-1.5" /> View Code
                    </Button>
                  </a>
                )}
                <Button
                  variant={isLiked ? "default" : "outline"}
                  size="sm"
                  onClick={handleLike}
                  disabled={liking}
                  className={isLiked ? "text-white" : ""}
                >
                  <Heart className={`h-4 w-4 mr-1.5 ${isLiked ? "fill-current" : ""}`} />
                  {showcase.likes} {showcase.likes === 1 ? "Like" : "Likes"}
                </Button>
              </div>

              {/* Description */}
              <Card>
                <CardHeader><CardTitle className="text-base">About this project</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {showcase.description}
                  </p>
                </CardContent>
              </Card>

              {/* Tech stack */}
              <Card>
                <CardHeader><CardTitle className="text-base">Tech Stack</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {showcase.techStack.map((t) => (
                      <Badge key={t} variant="secondary" className="text-sm">{t}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Opportunity card */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">{lf.icon}</div>
                    <div>
                      <p className="font-semibold text-sm mb-1">{lf.label}</p>
                      <p className="text-sm text-muted-foreground">{lf.desc}</p>
                      <Link to={`/developers/${showcase.developerId}`}>
                        <Button size="sm" className="mt-3">
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> View Full Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Sidebar ──────────────────────────────────────────────── */}
            <div className="space-y-5">

              {/* Developer card */}
              <Card>
                <CardHeader><CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Built by</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    {showcase.developerAvatar ? (
                      <img src={showcase.developerAvatar} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-muted" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-base font-bold text-primary">
                          {showcase.developerName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-sm">{showcase.developerName}</p>
                      {showcase.developerRating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-muted-foreground">{showcase.developerRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Experience</p>
                      <p className="font-medium">{showcase.developerExperience} yr{showcase.developerExperience !== 1 ? "s" : ""}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Availability</p>
                      <p className="font-medium capitalize">{showcase.developerAvailability.replace("-", " ")}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Top Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {showcase.developerSkills.slice(0, 6).map((s) => (
                        <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>

                  <Link to={`/developers/${showcase.developerId}`} className="block">
                    <Button variant="outline" size="sm" className="w-full">View Developer Profile</Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Meta info */}
              <Card>
                <CardContent className="pt-5 space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Posted {new Date(showcase.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Heart className="h-4 w-4" />
                    <span>{showcase.likes} {showcase.likes === 1 ? "like" : "likes"}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Contact CTA */}
              {user && user.id !== showcase.developerId && (
                <Link to="/messages">
                  <Button className="w-full">
                    Contact Developer
                  </Button>
                </Link>
              )}
              {!user && (
                <Link to="/register">
                  <Button className="w-full">Sign Up to Connect</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ShowcaseDetail;
