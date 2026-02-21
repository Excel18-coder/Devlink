import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ArrowLeft } from "lucide-react";

interface Milestone {
  title: string;
  amount: string;
  dueDate: string;
}

const CreateContract = () => {
  const [searchParams] = useSearchParams();
  const developerId = searchParams.get("developerId") || "";
  const jobId = searchParams.get("jobId") || "";
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([
    { title: "", amount: "", dueDate: "" }
  ]);

  const addMilestone = () => {
    setMilestones([...milestones, { title: "", amount: "", dueDate: "" }]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: string) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!developerId) {
      toast({ title: "Developer ID is required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const data = {
        developerId,
        jobId: jobId || undefined,
        milestones: milestones
          .filter((ms) => ms.title && ms.amount)
          .map((ms) => ({
            title: ms.title,
            amount: Number(ms.amount),
            dueDate: ms.dueDate || undefined
          }))
      };
      const result = await api<{ id: string }>("/contracts", { method: "POST", body: data });
      toast({ title: "Contract created!" });
      navigate(`/contracts/${result.id}`);
    } catch (err) {
      toast({ title: "Failed to create contract", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== "employer") {
    navigate("/dashboard");
    return null;
  }

  const totalAmount = milestones.reduce((sum, ms) => sum + (Number(ms.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="flex items-center gap-3 mb-8">
            <Button variant="ghost" size="sm" className="-ml-1" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <h1 className="text-xl sm:text-3xl font-heading font-bold">Create Contract</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="developerId">Developer ID</Label>
              <Input
                id="developerId"
                value={developerId}
                disabled
                className="bg-muted"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>Milestones</Label>
                <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Milestone
                </Button>
              </div>

              <div className="space-y-4">
                {milestones.map((ms, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-sm">Milestone {index + 1}</span>
                      {milestones.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMilestone(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-3">
                      <div>
                        <Label htmlFor={`ms-title-${index}`}>Title</Label>
                        <Input
                          id={`ms-title-${index}`}
                          value={ms.title}
                          onChange={(e) => updateMilestone(index, "title", e.target.value)}
                          placeholder="e.g., Initial Design Phase"
                          required
                        />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`ms-amount-${index}`}>Amount ($)</Label>
                          <Input
                            id={`ms-amount-${index}`}
                            type="number"
                            min="0"
                            value={ms.amount}
                            onChange={(e) => updateMilestone(index, "amount", e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor={`ms-date-${index}`}>Due Date (optional)</Label>
                          <Input
                            id={`ms-date-${index}`}
                            type="date"
                            value={ms.dueDate}
                            onChange={(e) => updateMilestone(index, "dueDate", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Contract Value</span>
                <span>${totalAmount.toLocaleString()}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Platform fee (10%) will be deducted from each milestone payment.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Contract"}
            </Button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CreateContract;
