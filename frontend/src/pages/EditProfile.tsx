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
import { ArrowLeft } from "lucide-react";

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
      toast({ title: "Profile updated!" });
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
    try {
      await uploadFile("/developers/me/resume", file, "resume");
      toast({ title: "Resume uploaded successfully!" });
    } catch {
      toast({ title: "Failed to upload resume", variant: "destructive" });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadFile<{ avatarUrl: string }>("/developers/me/avatar", file, "avatar");
      setAvatarPreview(result.avatarUrl);
      toast({ title: "Avatar uploaded successfully!" });
    } catch {
      toast({ title: "Failed to upload avatar", variant: "destructive" });
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
          <div className="flex items-center gap-3 mb-8">
            <Button variant="ghost" size="sm" className="-ml-1" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <h1 className="text-xl sm:text-3xl font-heading font-bold">Edit Profile</h1>
          </div>

          {/* Avatar upload */}
          <div className="mb-6 flex items-center gap-4">
            <div className="h-20 w-20 rounded-full border-2 border-muted overflow-hidden bg-muted flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-muted-foreground text-xs">No photo</span>
              )}
            </div>
            <div>
              <Label htmlFor="avatar" className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>Upload Photo</span>
                </Button>
              </Label>
              <Input id="avatar" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} />
              <p className="text-xs text-muted-foreground mt-1">JPEG, PNG or WebP</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={4}
                placeholder="Tell employers about yourself..."
              />
            </div>

            <div>
              <Label htmlFor="skills">Skills (comma separated)</Label>
              <Input
                id="skills"
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                placeholder="React, TypeScript, Node.js"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  value={form.yearsExperience}
                  onChange={(e) => setForm({ ...form, yearsExperience: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label>Availability</Label>
                <Select
                  value={form.availability}
                  onValueChange={(v) => setForm({ ...form, availability: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Rate Type</Label>
                <Select
                  value={form.rateType}
                  onValueChange={(v) => setForm({ ...form, rateType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="rate">Rate ($)</Label>
                <Input
                  id="rate"
                  type="number"
                  min="0"
                  value={form.rateAmount}
                  onChange={(e) => setForm({ ...form, rateAmount: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="github">GitHub URL</Label>
              <Input
                id="github"
                type="url"
                value={form.githubUrl}
                onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                placeholder="https://github.com/username"
              />
            </div>

            <div>
              <Label htmlFor="portfolio">Portfolio Links (comma separated)</Label>
              <Input
                id="portfolio"
                value={form.portfolioLinks}
                onChange={(e) => setForm({ ...form, portfolioLinks: e.target.value })}
                placeholder="https://portfolio.com, https://dribbble.com/..."
              />
            </div>

            <div>
              <Label htmlFor="resume">Upload Resume</Label>
              <Input id="resume" type="file" accept=".pdf,application/pdf" onChange={handleResumeUpload} />
              <p className="text-xs text-muted-foreground mt-1">PDF only</p>
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EditProfile;
