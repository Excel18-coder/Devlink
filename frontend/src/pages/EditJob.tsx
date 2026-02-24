import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Briefcase, Trash2 } from "lucide-react";

interface JobDetail {
  id: string;
  employerId: string;
  title: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: string;
  budgetMin: number | null;
  budgetMax: number | null;
  rateType: string;
  jobType: string;
  location: string;
  status: string;
}

const EditJob = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    requiredSkills: "",
    experienceLevel: "mid",
    budgetMin: "",
    budgetMax: "",
    rateType: "project",
    jobType: "remote",
    location: "",
    status: "open"
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api<JobDetail>(`/jobs/${id}`);
        // Guard — only the owner employer can edit
        if (data.employerId !== user?.id) {
          navigate("/dashboard");
          return;
        }
        setForm({
          title: data.title,
          description: data.description,
          requiredSkills: data.requiredSkills.join(", "),
          experienceLevel: data.experienceLevel || "mid",
          budgetMin: data.budgetMin != null ? String(data.budgetMin) : "",
          budgetMax: data.budgetMax != null ? String(data.budgetMax) : "",
          rateType: data.rateType || "project",
          jobType: data.jobType || "remote",
          location: data.location || "",
          status: data.status || "open"
        });
      } catch {
        toast({ title: "Job not found", variant: "destructive" });
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/jobs/${id}`, {
        method: "PATCH",
        body: {
          title: form.title,
          description: form.description,
          requiredSkills: form.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean),
          experienceLevel: form.experienceLevel,
          budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
          budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
          rateType: form.rateType,
          jobType: form.jobType,
          location: form.location || undefined
        }
      });
      // Also update status if it changed
      await api(`/jobs/${id}/status`, { method: "PATCH", body: { status: form.status } });
      toast({ title: "Job updated successfully!" });
      navigate("/dashboard");
    } catch (err) {
      toast({ title: (err as Error).message || "Failed to update job", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Permanently delete this job? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await api(`/jobs/${id}`, { method: "DELETE" });
      toast({ title: "Job deleted" });
      navigate("/dashboard");
    } catch (err) {
      toast({ title: (err as Error).message || "Failed to delete job", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <div className="h-10 w-10 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading job…</p>
      </div>
    );
  }

  if (user?.role !== "employer") {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">

          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="-ml-1" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-heading font-bold flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" /> Edit Job
                </h1>
                <p className="text-sm text-muted-foreground">Update the details for this listing</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {deleting ? "Deleting…" : "Delete Job"}
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Title */}
            <div className="space-y-1">
              <Label htmlFor="title">Job Title <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={6}
                required
              />
            </div>

            {/* Skills */}
            <div className="space-y-1">
              <Label htmlFor="skills">Required Skills <span className="text-muted-foreground text-xs">(comma separated)</span></Label>
              <Input
                id="skills"
                value={form.requiredSkills}
                onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })}
                placeholder="React, TypeScript, Node.js"
              />
            </div>

            {/* Level + Type */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Experience Level</Label>
                <Select value={form.experienceLevel} onValueChange={(v) => setForm({ ...form, experienceLevel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="mid">Mid-Level</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Job Type</Label>
                <Select value={form.jobType} onValueChange={(v) => setForm({ ...form, jobType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="onsite">On-site</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Rate + Budget */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Rate Type</Label>
                <Select value={form.rateType} onValueChange={(v) => setForm({ ...form, rateType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="budgetMin">Budget Min ($)</Label>
                <Input
                  id="budgetMin"
                  type="number"
                  min={0}
                  value={form.budgetMin}
                  onChange={(e) => setForm({ ...form, budgetMin: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="budgetMax">Budget Max ($)</Label>
                <Input
                  id="budgetMax"
                  type="number"
                  min={0}
                  value={form.budgetMax}
                  onChange={(e) => setForm({ ...form, budgetMax: e.target.value })}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1">
              <Label htmlFor="location">Location <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g., Remote, Nairobi, Lagos"
              />
            </div>

            {/* Status */}
            <div className="space-y-1">
              <Label>Job Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open — accepting applications</SelectItem>
                  <SelectItem value="paused">Paused — temporarily closed</SelectItem>
                  <SelectItem value="closed">Closed — no longer accepting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EditJob;
