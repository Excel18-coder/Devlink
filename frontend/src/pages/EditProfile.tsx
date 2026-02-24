import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { api, uploadFile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle2, Loader2, Upload, FileText, ExternalLink } from "lucide-react";

interface Profile {
  bio: string;
  skills: string[];
  yearsExperience: number;
  portfolioLinks: string[];
  githubUrl: string;
  resumeUrl: string;
  availability: string;
  rateType: string;
  rateAmount: number;
  location: string;
  avatarUrl?: string;
}

const EditProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [form, setForm] = useState({
    bio: "",
    skills: "",
    yearsExperience: 0,
    portfolioLinks: "",
    githubUrl: "",
    availability: "contract",
    rateType: "hourly",
    rateAmount: 0,
    location: ""
  });

  const isNew = searchParams.get("new") === "1";
  const backDest = searchParams.get("next") ?? "/dashboard";

  useEffect(() => {
    if (user?.role !== "developer") {
      navigate("/dashboard");
      return;
    }

    const fetchProfile = async () => {
      try {
        const data = await api<Profile>(`/developers/${user.id}`);
        setForm({
          bio: data.bio || "",
          skills: data.skills?.join(", ") || "",
          yearsExperience: data.yearsExperience || 0,
          portfolioLinks: data.portfolioLinks?.join(", ") || "",
          githubUrl: data.githubUrl || "",
          availability: data.availability || "contract",
          rateType: data.rateType || "hourly",
          rateAmount: data.rateAmount || 0,
          location: data.location || ""
        });
        if (data.avatarUrl) setAvatarPreview(data.avatarUrl);
        if (data.resumeUrl) {
          setResumeUploaded(true);
          setResumeUrl(data.resumeUrl);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate GitHub URL
    if (form.githubUrl && !/^https?:\/\/github\.com//i.test(form.githubUrl)) {
      toast({ title: "GitHub URL must start with https://github.com/", variant: "destructive" });
      return;
    }
    if (!form.githubUrl.trim()) {
      toast({ title: "GitHub URL is required", variant: "destructive" });
      return;
    }
    if (!resumeUploaded) {
      toast({ title: "Please upload your resume (PDF) before saving", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await api("/developers/me", {
        method: "PATCH",
        body: {
          bio: form.bio || undefined,
          skills: form.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          yearsExperience: form.yearsExperience,
          portfolioLinks: form.portfolioLinks
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          githubUrl: form.githubUrl || undefined,
          availability: form.availability,
          rateType: form.rateType,
          rateAmount: form.rateAmount,
          location: form.location || undefined
        }
      });
      toast({ title: "Profile updated!", description: "Your profile has been saved." });
      navigate(searchParams.get("next") ?? "/dashboard");
    } catch (err) {
      toast({ title: "Failed to update profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeUploading(true);
    try {
      const result = await uploadFile<{ resumeUrl: string }>("/developers/me/resume", file, "resume");
      setResumeUploaded(true);
      setResumeUrl(result.resumeUrl);
      toast({ title: "Resume uploaded successfully!" });
    } catch {
      toast({ title: "Failed to upload resume", variant: "destructive" });
    } finally {
      setResumeUploading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const result = await uploadFile<{ avatarUrl: string }>("/developers/me/avatar", file, "avatar");
      setAvatarPreview(result.avatarUrl);
      toast({ title: "Photo updated!" });
    } catch {
      toast({ title: "Failed to upload photo", variant: "destructive" });
    } finally {
      setAvatarUploading(false);
    }
  };

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
        <div className="container mx-auto px-4 max-w-2xl">

          {/* New sign-up welcome banner */}
          {isNew && (
            <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 px-5 py-4 flex items-start gap-3">
              <span className="text-2xl mt-0.5">🎉</span>
              <div>
                <p className="font-semibold text-foreground text-sm">Welcome to Devlink!</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Complete your profile below so employers can find and hire you. Fields marked <span className="text-destructive font-medium">*</span> are required before you can browse jobs or apply.
                </p>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            {!isNew && (
              <Button variant="ghost" size="sm" className="-ml-1" onClick={() => navigate(backDest)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}
            <h1 className="text-xl sm:text-3xl font-heading font-bold">
              {isNew ? "Set Up Your Profile" : "Edit Profile"}
            </h1>
          </div>

          {/* Avatar upload */}
          <div className="mb-6 flex items-center gap-5">
            <div className="relative h-20 w-20 shrink-0">
              <div className="h-20 w-20 rounded-full border-2 border-muted overflow-hidden bg-muted flex items-center justify-center">
                {avatarUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-muted-foreground text-xs text-center px-1">No photo</span>
                )}
              </div>
              <label
                htmlFor="avatar"
                className="absolute inset-0 rounded-full cursor-pointer flex items-end justify-center pb-1 opacity-0 hover:opacity-100 transition-opacity bg-black/30"
                title="Change photo"
              >
                <Upload className="h-4 w-4 text-white mb-1" />
              </label>
            </div>
            <div>
              <Label htmlFor="avatar" className="cursor-pointer">
                <Button variant="outline" size="sm" asChild disabled={avatarUploading}>
                  <span>
                    {avatarUploading ? (
                      <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Uploading…</>
                    ) : avatarPreview ? "Change Photo" : "Upload Photo"}
                  </span>
                </Button>
              </Label>
              <Input id="avatar" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
              <p className="text-xs text-muted-foreground mt-1.5">JPEG, PNG or WebP · shown publicly</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <Label htmlFor="bio">Bio <span className="text-destructive">*</span></Label>
              <Textarea
                id="bio"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={4}
                placeholder="Tell employers about yourself, your experience, and what you're looking for…"
                className={!form.bio.trim() ? "border-destructive/40" : ""}
              />
            </div>

            <div>
              <Label htmlFor="skills">
                Skills <span className="text-destructive">*</span>{" "}
                <span className="text-muted-foreground font-normal text-xs">(comma separated)</span>
              </Label>
              <Input
                id="skills"
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                placeholder="React, TypeScript, Node.js, Python…"
                className={!form.skills.trim() ? "border-destructive/40" : ""}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experience">Years of Experience <span className="text-destructive">*</span></Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  value={form.yearsExperience}
                  onChange={(e) => setForm({ ...form, yearsExperience: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="location">Location <span className="text-destructive">*</span></Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Nairobi, Kenya"
                  className={!form.location.trim() ? "border-destructive/40" : ""}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label>Availability <span className="text-destructive">*</span></Label>
                <Select value={form.availability} onValueChange={(v) => setForm({ ...form, availability: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Rate Type <span className="text-destructive">*</span></Label>
                <Select value={form.rateType} onValueChange={(v) => setForm({ ...form, rateType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="rate">Rate ($) <span className="text-destructive">*</span></Label>
                <Input
                  id="rate"
                  type="number"
                  min="0"
                  value={form.rateAmount}
                  onChange={(e) => setForm({ ...form, rateAmount: Number(e.target.value) })}
                  className={!form.rateAmount ? "border-destructive/40" : ""}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="github">GitHub URL <span className="text-destructive">*</span></Label>
              <Input
                id="github"
                type="url"
                value={form.githubUrl}
                onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                placeholder="https://github.com/username"
                className={!form.githubUrl.trim() ? "border-destructive/40" : ""}
              />
              <p className="text-xs text-muted-foreground mt-1">Must start with https://github.com/</p>
            </div>

            <div>
              <Label htmlFor="portfolio">
                Portfolio Links{" "}
                <span className="text-muted-foreground font-normal text-xs">(comma separated, optional)</span>
              </Label>
              <Input
                id="portfolio"
                value={form.portfolioLinks}
                onChange={(e) => setForm({ ...form, portfolioLinks: e.target.value })}
                placeholder="https://mysite.com, https://dribbble.com/me"
              />
            </div>

            {/* Resume card */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Resume <span className="text-destructive">*</span>{" "}
                  <span className="text-muted-foreground font-normal">(PDF)</span>
                </Label>
                {resumeUploaded && (
                  <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded
                  </span>
                )}
              </div>

              {resumeUrl && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  View current resume
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}

              <div className="flex items-center gap-3">
                <Label htmlFor="resume" className="cursor-pointer">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    disabled={resumeUploading}
                    className={!resumeUploaded ? "border-destructive/50 text-destructive hover:text-destructive" : ""}
                  >
                    <span>
                      {resumeUploading ? (
                        <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Uploading…</>
                      ) : (
                        <><Upload className="h-3.5 w-3.5 mr-1.5" />{resumeUploaded ? "Replace Resume" : "Upload Resume"}</>
                      )}
                    </span>
                  </Button>
                </Label>
                <Input id="resume" type="file" accept=".pdf,application/pdf" onChange={handleResumeUpload} disabled={resumeUploading} className="hidden" />
                <span className="text-xs text-muted-foreground">PDF only · max 10 MB</span>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={saving || avatarUploading || resumeUploading}>
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
              ) : isNew ? "Save & Continue" : "Save Changes"}
            </Button>

            {!isNew && (
              <Button type="button" variant="ghost" className="w-full" onClick={() => navigate(backDest)}>
                Cancel
              </Button>
            )}
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EditProfile;
