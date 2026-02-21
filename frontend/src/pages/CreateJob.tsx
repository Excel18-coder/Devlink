import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { ArrowLeft } from "lucide-react";

const CreateJob = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    requiredSkills: "",
    experienceLevel: "mid",
    budgetMin: "",
    budgetMax: "",
    rateType: "project",
    jobType: "remote",
    location: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        title: form.title,
        description: form.description,
        requiredSkills: form.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean),
        experienceLevel: form.experienceLevel,
        budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
        budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
        rateType: form.rateType,
        jobType: form.jobType,
        location: form.location || undefined
      };
      await api("/jobs", { method: "POST", body: data });
      toast({ title: "Job posted successfully!" });
      navigate("/dashboard");
    } catch (err) {
      toast({ title: "Failed to post job", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== "employer") {
    navigate("/dashboard");
    return null;
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
            <h1 className="text-3xl font-heading font-bold">Post a New Job</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={6}
                required
              />
            </div>

            <div>
              <Label htmlFor="skills">Required Skills (comma separated)</Label>
              <Input
                id="skills"
                value={form.requiredSkills}
                onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })}
                placeholder="React, TypeScript, Node.js"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Experience Level</Label>
                <Select
                  value={form.experienceLevel}
                  onValueChange={(v) => setForm({ ...form, experienceLevel: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="mid">Mid-Level</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Job Type</Label>
                <Select
                  value={form.jobType}
                  onValueChange={(v) => setForm({ ...form, jobType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="onsite">On-site</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
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
                <Label htmlFor="budgetMin">Budget Min ($)</Label>
                <Input
                  id="budgetMin"
                  type="number"
                  value={form.budgetMin}
                  onChange={(e) => setForm({ ...form, budgetMin: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="budgetMax">Budget Max ($)</Label>
                <Input
                  id="budgetMax"
                  type="number"
                  value={form.budgetMax}
                  onChange={(e) => setForm({ ...form, budgetMax: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g., Remote, Nairobi, etc."
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Posting..." : "Post Job"}
            </Button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CreateJob;
