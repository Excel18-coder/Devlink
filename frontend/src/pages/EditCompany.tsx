import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { api, uploadFile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

interface Employer {
  companyName: string;
  website: string;
  about: string;
  location: string;
  avatarUrl?: string;
}

const EditCompany = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    companyName: "",
    website: "",
    about: "",
    location: ""
  });

  useEffect(() => {
    if (user?.role !== "employer") {
      navigate("/dashboard");
      return;
    }

    const fetchProfile = async () => {
      try {
        const data = await api<Employer>(`/employers/${user.id}`);
        setForm({
          companyName: data.companyName || "",
          website: data.website || "",
          about: data.about || "",
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
      await api("/employers/me", {
        method: "PATCH",
        body: {
          companyName: form.companyName || undefined,
          website: form.website || undefined,
          about: form.about || undefined,
          location: form.location || undefined
        }
      });
      toast({ title: "Company profile updated!" });
      navigate("/dashboard");
    } catch (err) {
      toast({ title: "Failed to update profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadFile<{ avatarUrl: string }>("/employers/me/avatar", file, "avatar");
      setAvatarPreview(result.avatarUrl);
      toast({ title: "Company logo uploaded!" });
    } catch {
      toast({ title: "Failed to upload logo", variant: "destructive" });
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
            <h1 className="text-xl sm:text-3xl font-heading font-bold">Edit Company Profile</h1>
          </div>

          {/* Logo upload */}
          <div className="mb-6 flex items-center gap-4">
            <div className="h-20 w-20 rounded-full border-2 border-muted overflow-hidden bg-muted flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Company logo" className="h-full w-full object-cover" />
              ) : (
                <span className="text-muted-foreground text-xs text-center px-1">No logo</span>
              )}
            </div>
            <div>
              <Label htmlFor="avatar" className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>Upload Logo</span>
                </Button>
              </Label>
              <Input id="avatar" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} />
              <p className="text-xs text-muted-foreground mt-1">JPEG, PNG or WebP</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://yourcompany.com"
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="City, Country or Remote"
              />
            </div>

            <div>
              <Label htmlFor="about">About the Company</Label>
              <Textarea
                id="about"
                value={form.about}
                onChange={(e) => setForm({ ...form, about: e.target.value })}
                rows={6}
                placeholder="Tell developers about your company..."
              />
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

export default EditCompany;
