import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, apiFormData } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, DollarSign, AlertCircle, ExternalLink, Download, Upload, CreditCard, Pencil, PackageCheck, ArrowLeft } from "lucide-react";

interface DeveloperPaymentDetails {
  method: "bank_transfer" | "mobile_money" | "other";
  accountName: string;
  details: string;
  updatedAt?: string;
}

interface Milestone {
  id: string;
  title: string;
  amount: number;
  dueDate: string | null;
  status: "pending" | "submitted" | "released" | "delivered";
  submissionLink: string | null;
  submissionNote: string | null;
  finalLink: string | null;
  finalFileUrl: string | null;
}

interface Contract {
  id: string;
  jobId: string;
  employerId: string;
  developerId: string;
  status: string;
  totalAmount: number;
  developerPaymentDetails: DeveloperPaymentDetails | null;
  createdAt: string;
  milestones: Milestone[];
}

const methodLabels: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  mobile_money: "Mobile Money",
  other: "Other"
};

const ContractDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [delivering, setDelivering] = useState<string | null>(null);
  const [savingPayment, setSavingPayment] = useState(false);
  const [editingPayment, setEditingPayment] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [addMilestoneForm, setAddMilestoneForm] = useState({ title: "", amount: "", dueDate: "" });

  // Payment details form (developer)
  const [paymentForm, setPaymentForm] = useState({ method: "", accountName: "", details: "" });

  // Per-milestone submit forms — demo link + note only (no ZIP)
  const [submitForms, setSubmitForms] = useState<Record<string, { submissionLink: string; submissionNote: string }>>({});

  // Per-milestone final delivery forms — official domain + ZIP file (after payment)
  const [deliverForms, setDeliverForms] = useState<Record<string, { finalLink: string; file: File | null }>>({});
  const deliverFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => { fetchContract(); }, [id]);  // eslint-disable-line react-hooks/exhaustive-deps

  const fetchContract = async () => {
    try {
      const data = await api<Contract>(`/contracts/${id}`);
      setContract(data);
      if (data.developerPaymentDetails) {
        setPaymentForm({
          method: data.developerPaymentDetails.method,
          accountName: data.developerPaymentDetails.accountName,
          details: data.developerPaymentDetails.details
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePaymentDetails = async () => {
    if (!paymentForm.method) { toast({ title: "Select a payment method", variant: "destructive" }); return; }
    if (!paymentForm.details.trim()) { toast({ title: "Payment details are required", variant: "destructive" }); return; }
    setSavingPayment(true);
    try {
      await api(`/contracts/${id}/payment-details`, {
        method: "POST",
        body: { method: paymentForm.method, accountName: paymentForm.accountName, details: paymentForm.details }
      });
      toast({ title: "Payment details saved" });
      setEditingPayment(false);
      fetchContract();
    } catch (err) {
      toast({ title: (err as Error).message, variant: "destructive" });
    } finally {
      setSavingPayment(false);
    }
  };

  // Step 1: Developer submits preview/demo link only
  const handleSubmitMilestone = async (msId: string) => {
    const form = submitForms[msId] ?? { submissionLink: "", submissionNote: "" };
    if (!form.submissionLink.trim()) {
      toast({ title: "A preview/demo link is required (e.g. Vercel, Netlify URL)", variant: "destructive" });
      return;
    }
    setSubmitting(msId);
    try {
      await api(`/contracts/${id}/milestones/${msId}/submit`, {
        method: "POST",
        body: { submissionLink: form.submissionLink.trim(), submissionNote: form.submissionNote.trim() }
      });
      toast({ title: "Work submitted for employer review" });
      setSubmitForms((prev) => { const n = { ...prev }; delete n[msId]; return n; });
      fetchContract();
    } catch (err) {
      toast({ title: (err as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(null);
    }
  };

  // Step 2: Employer approves & releases (confirms payment sent off-site)
  const handleRelease = async (msId: string) => {
    setReleasing(msId);
    try {
      await api(`/contracts/${id}/milestones/${msId}/release`, { method: "POST" });
      toast({ title: "Milestone released — developer will now submit final deliverables" });
      fetchContract();
    } catch (err) {
      toast({ title: (err as Error).message, variant: "destructive" });
    } finally {
      setReleasing(null);
    }
  };

  // Step 3: Developer delivers final ZIP + official domain after payment
  const handleDeliver = async (msId: string) => {
    const form = deliverForms[msId] ?? { finalLink: "", file: null };
    if (!form.finalLink.trim()) {
      toast({ title: "The official hosted domain/link is required", variant: "destructive" });
      return;
    }
    setDelivering(msId);
    try {
      const fd = new FormData();
      fd.append("finalLink", form.finalLink.trim());
      if (form.file) fd.append("deliveryFile", form.file);
      await apiFormData(`/contracts/${id}/milestones/${msId}/deliver`, fd);
      toast({ title: "Final deliverable submitted!" });
      setDeliverForms((prev) => { const n = { ...prev }; delete n[msId]; return n; });
      fetchContract();
    } catch (err) {
      toast({ title: (err as Error).message, variant: "destructive" });
    } finally {
      setDelivering(null);
    }
  };

  const handleDispute = async () => {
    try {
      await api(`/contracts/${id}/dispute`, { method: "POST" });
      toast({ title: "Dispute raised. Admin will review." });
      fetchContract();
    } catch {
      toast({ title: "Failed to raise dispute", variant: "destructive" });
    }
  };

  const handleAddMilestone = async () => {
    const amount = Number(addMilestoneForm.amount);
    if (!addMilestoneForm.title.trim()) { toast({ title: "Milestone title is required", variant: "destructive" }); return; }
    if (isNaN(amount) || amount <= 0) { toast({ title: "Amount must be a positive number", variant: "destructive" }); return; }
    setAddingMilestone(true);
    try {
      await api(`/contracts/${id}/milestones`, {
        method: "POST",
        body: { title: addMilestoneForm.title.trim(), amount, dueDate: addMilestoneForm.dueDate || undefined }
      });
      toast({ title: "Milestone added" });
      setAddMilestoneForm({ title: "", amount: "", dueDate: "" });
      setShowAddMilestone(false);
      fetchContract();
    } catch (err) {
      toast({ title: (err as Error).message, variant: "destructive" });
    } finally {
      setAddingMilestone(false);
    }
  };

  const handleComplete = async () => {
    if (!confirm("Mark this contract as complete? This cannot be undone.")) return;
    setCompleting(true);
    try {
      await api(`/contracts/${id}/complete`, { method: "POST" });
      toast({ title: "Contract marked as complete 🎉" });
      fetchContract();
    } catch (err) {
      toast({ title: (err as Error).message, variant: "destructive" });
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 container mx-auto px-4">
          <p>Contract not found</p>
        </div>
        <Footer />
      </div>
    );
  }

  const isEmployer = user?.id === contract.employerId;
  const isDeveloper = user?.id === contract.developerId;
  const paidCount = contract.milestones.filter((m) => m.status === "released" || m.status === "delivered").length;
  const deliveredCount = contract.milestones.filter((m) => m.status === "delivered").length;
  const hasPaymentDetails = !!contract.developerPaymentDetails;
  const allDelivered = contract.milestones.length > 0 && contract.milestones.every((m) => m.status === "delivered");
  const anyDelivered = contract.milestones.some((m) => m.status === "delivered");
  const milestoneTotal = contract.milestones.reduce((s, m) => s + m.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            <Button variant="ghost" size="sm" className="mb-2 -ml-1" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            {/* ── Contract Summary ── */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle>Contract #{contract.id.slice(0, 8)}</CardTitle>
                  <Badge
                    variant={contract.status === "completed" ? "default" : contract.status === "disputed" ? "destructive" : "secondary"}
                    className="capitalize"
                  >
                    {contract.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-sm text-muted-foreground">Total Budget</p>
                    <p className="text-xl font-bold">${contract.totalAmount.toLocaleString()}</p>
                    {milestoneTotal !== contract.totalAmount && (
                      <p className="text-xs text-muted-foreground">Milestones: ${milestoneTotal.toLocaleString()}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Milestones Paid</p>
                    <p className="text-xl font-bold">{paidCount} / {contract.milestones.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fully Delivered</p>
                    <p className="text-xl font-bold">{deliveredCount} / {contract.milestones.length}</p>
                  </div>
                </div>
                {contract.milestones.length > 0 && (
                  <div className="w-full bg-muted rounded-full h-2 mb-4">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${(deliveredCount / contract.milestones.length) * 100}%` }}
                    />
                  </div>
                )}
                {contract.status === "active" && (isEmployer || isDeveloper) && (
                  <Button variant="destructive" size="sm" onClick={handleDispute}>
                    <AlertCircle className="h-4 w-4 mr-1" /> Raise Dispute
                  </Button>
                )}
                {isEmployer && contract.status === "active" && allDelivered && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg space-y-2">
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">✓ All milestones delivered!</p>
                    <p className="text-xs text-green-600 dark:text-green-500">You can add another milestone or mark the contract as complete.</p>
                    <Button size="sm" onClick={handleComplete} disabled={completing}>
                      {completing ? "Completing…" : "Mark Contract as Complete"}
                    </Button>
                  </div>
                )}
                {contract.status === "completed" && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">🎉 Contract Completed</p>
                    <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">All work has been delivered and the contract is closed.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Developer Payment Details ── */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Payment Details
                </CardTitle>
                {isDeveloper && hasPaymentDetails && !editingPayment && (
                  <Button size="sm" variant="outline" onClick={() => setEditingPayment(true)}>
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEmployer && hasPaymentDetails && (
                  <div className="space-y-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Developer's payment information</p>
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        <span className="font-medium">Method:</span> {methodLabels[contract.developerPaymentDetails!.method]}
                      </p>
                      {contract.developerPaymentDetails!.accountName && (
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                          <span className="font-medium">Account Name:</span> {contract.developerPaymentDetails!.accountName}
                        </p>
                      )}
                      <p className="text-sm text-blue-700 dark:text-blue-400 whitespace-pre-wrap">
                        <span className="font-medium">Details:</span> {contract.developerPaymentDetails!.details}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      💡 Payments are made directly off-site. Release each milestone after verifying the work and confirming payment.
                    </p>
                  </div>
                )}

                {isEmployer && !hasPaymentDetails && (
                  <p className="text-sm text-muted-foreground py-2">
                    ⏳ The developer hasn't provided payment details yet.
                  </p>
                )}

                {isDeveloper && hasPaymentDetails && !editingPayment && (
                  <div className="space-y-2">
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Method</p>
                        <p className="font-medium">{methodLabels[contract.developerPaymentDetails!.method]}</p>
                      </div>
                      {contract.developerPaymentDetails!.accountName && (
                        <div>
                          <p className="text-muted-foreground text-xs">Account Name</p>
                          <p className="font-medium">{contract.developerPaymentDetails!.accountName}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Details</p>
                      <p className="text-sm whitespace-pre-wrap">{contract.developerPaymentDetails!.details}</p>
                    </div>
                  </div>
                )}

                {isDeveloper && (!hasPaymentDetails || editingPayment) && (
                  <div className="space-y-4">
                    {!hasPaymentDetails && (
                      <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                        ⚠ Please fill in your payment details so the employer knows how to pay you.
                      </p>
                    )}
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Payment Method</Label>
                        <Select value={paymentForm.method} onValueChange={(v) => setPaymentForm((p) => ({ ...p, method: v }))}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select method" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="mobile_money">Mobile Money</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Account Name (optional)</Label>
                        <Input
                          placeholder="e.g. John Doe"
                          value={paymentForm.accountName}
                          onChange={(e) => setPaymentForm((p) => ({ ...p, accountName: e.target.value }))}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Payment Details</Label>
                      <Textarea
                        placeholder={
                          paymentForm.method === "bank_transfer"
                            ? "Bank: ABSA · Account: 1234567890 · Branch: 051001"
                            : paymentForm.method === "mobile_money"
                            ? "Phone: +27 61 234 5678 · Network: MTN"
                            : "Describe how you'd like to be paid..."
                        }
                        value={paymentForm.details}
                        onChange={(e) => setPaymentForm((p) => ({ ...p, details: e.target.value }))}
                        rows={3}
                        className="text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSavePaymentDetails} disabled={savingPayment}>
                        {savingPayment ? "Saving…" : "Save Payment Details"}
                      </Button>
                      {editingPayment && (
                        <Button size="sm" variant="outline" onClick={() => setEditingPayment(false)}>Cancel</Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Milestones ── */}
            <Card>
              <CardHeader>
                <CardTitle>Milestones</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Step 1: Developer submits preview link → Step 2: Employer reviews & releases (pays off-site) → Step 3: Developer delivers ZIP + official domain
                </p>
              </CardHeader>
              <CardContent>
                {contract.milestones.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No milestones defined</p>
                ) : (
                  <div className="space-y-5">
                    {contract.milestones.map((ms) => {
                      const busySubmit = submitting === ms.id;
                      const busyRelease = releasing === ms.id;
                      const busyDeliver = delivering === ms.id;
                      const submitForm = submitForms[ms.id] ?? { submissionLink: "", submissionNote: "" };
                      const deliverForm = deliverForms[ms.id] ?? { finalLink: "", file: null };

                      return (
                        <div key={ms.id} className="border rounded-lg overflow-hidden">
                          {/* Milestone header */}
                          <div className="flex items-center justify-between p-4 bg-muted/20 flex-wrap gap-2">
                            <div className="flex items-center gap-3">
                              {ms.status === "delivered" ? (
                                <PackageCheck className="h-5 w-5 text-green-500 flex-shrink-0" />
                              ) : ms.status === "released" ? (
                                <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                              ) : ms.status === "submitted" ? (
                                <Clock className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                              ) : (
                                <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold break-words">{ms.title}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                                  <DollarSign className="h-3 w-3" />
                                  <span className="font-medium">${ms.amount.toLocaleString()}</span>
                                  {ms.dueDate && <span>· Due {new Date(ms.dueDate).toLocaleDateString()}</span>}
                                </div>
                              </div>
                            </div>
                            <Badge
                              variant={ms.status === "delivered" || ms.status === "released" ? "default" : ms.status === "submitted" ? "secondary" : "outline"}
                              className={
                                ms.status === "delivered" ? "bg-green-500 text-white" :
                                ms.status === "released" ? "bg-blue-100 text-blue-800 border-blue-200" :
                                ms.status === "submitted" ? "bg-yellow-100 text-yellow-800 border-yellow-200" : ""
                              }
                            >
                              {ms.status}
                            </Badge>
                          </div>

                          <div className="p-4 space-y-4">

                            {/* ── STEP 1: Developer submits preview/demo link ── */}
                            {isDeveloper && ms.status === "pending" && (
                              <div className="space-y-3">
                                <p className="text-sm font-medium">Submit a preview of your work for review</p>
                                <div className="space-y-1">
                                  <Label className="text-xs">Preview / Demo Link <span className="text-destructive">*</span></Label>
                                  <div className="flex items-center gap-1">
                                    <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <Input
                                      type="url"
                                      placeholder="https://preview.vercel.app or staging link"
                                      value={submitForm.submissionLink}
                                      onChange={(e) => setSubmitForms((prev) => ({ ...prev, [ms.id]: { ...submitForm, submissionLink: e.target.value } }))}
                                      className="h-9 text-sm"
                                    />
                                  </div>
                                  <p className="text-xs text-muted-foreground">A Vercel/Netlify preview or staging URL for the employer to review before paying</p>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Notes <span className="text-muted-foreground">(optional)</span></Label>
                                  <Textarea
                                    placeholder="Any notes for the employer about this submission..."
                                    value={submitForm.submissionNote}
                                    onChange={(e) => setSubmitForms((prev) => ({ ...prev, [ms.id]: { ...submitForm, submissionNote: e.target.value } }))}
                                    rows={2}
                                    className="text-sm"
                                  />
                                </div>
                                <Button size="sm" onClick={() => handleSubmitMilestone(ms.id)} disabled={busySubmit}>
                                  {busySubmit ? "Submitting…" : "Submit for Review"}
                                </Button>
                              </div>
                            )}

                            {/* Developer: submitted — waiting for employer review & payment */}
                            {isDeveloper && ms.status === "submitted" && (
                              <div className="space-y-2">
                                <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">⏳ Submitted — awaiting employer review & payment</p>
                                {ms.submissionLink && (
                                  <a href={ms.submissionLink} target="_blank" rel="noreferrer">
                                    <Button size="sm" variant="outline"><ExternalLink className="h-3 w-3 mr-1" />View Preview</Button>
                                  </a>
                                )}
                                {ms.submissionNote && <p className="text-xs text-muted-foreground">{ms.submissionNote}</p>}
                              </div>
                            )}

                            {/* ── STEP 2: Employer reviews preview and releases (pays off-site) ── */}
                            {isEmployer && ms.status === "submitted" && (
                              <div className="space-y-3">
                                <p className="text-sm font-medium">Developer's preview submission</p>
                                {ms.submissionLink && (
                                  <a href={ms.submissionLink} target="_blank" rel="noreferrer">
                                    <Button size="sm" variant="outline">
                                      <ExternalLink className="h-3 w-3 mr-1" /> View Preview
                                    </Button>
                                  </a>
                                )}
                                {ms.submissionNote && (
                                  <div className="bg-muted/40 rounded-lg p-3">
                                    <p className="text-xs text-muted-foreground font-medium mb-1">Developer's note</p>
                                    <p className="text-sm">{ms.submissionNote}</p>
                                  </div>
                                )}
                                <div className="pt-1">
                                  <Button size="sm" onClick={() => handleRelease(ms.id)} disabled={busyRelease}>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    {busyRelease ? "Releasing…" : "Approve & Release Milestone"}
                                  </Button>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Releasing confirms you've reviewed the work and paid the developer off-site. They will then submit the source code ZIP and official domain.
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Employer: pending — waiting */}
                            {isEmployer && ms.status === "pending" && (
                              <p className="text-sm text-muted-foreground">Awaiting developer submission…</p>
                            )}

                            {/* ── STEP 3: Developer submits final deliverables after payment ── */}
                            {isDeveloper && ms.status === "released" && (
                              <div className="space-y-3">
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">✓ Payment released — submit your final deliverables</p>
                                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">Provide the official hosted domain and the ZIP of your source code.</p>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Official Hosted Domain <span className="text-destructive">*</span></Label>
                                  <div className="flex items-center gap-1">
                                    <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <Input
                                      type="url"
                                      placeholder="https://client-domain.com"
                                      value={deliverForm.finalLink}
                                      onChange={(e) => setDeliverForms((prev) => ({ ...prev, [ms.id]: { ...deliverForm, finalLink: e.target.value } }))}
                                      className="h-9 text-sm"
                                    />
                                  </div>
                                  <p className="text-xs text-muted-foreground">The permanent production domain for this project</p>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">ZIP of Source Code <span className="text-muted-foreground">(optional but recommended)</span></Label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="file"
                                      accept=".zip,.tar.gz,.rar,.7z"
                                      className="hidden"
                                      ref={(el) => { deliverFileRefs.current[ms.id] = el; }}
                                      onChange={(e) => {
                                        const file = e.target.files?.[0] ?? null;
                                        setDeliverForms((prev) => ({ ...prev, [ms.id]: { ...deliverForm, file } }));
                                      }}
                                    />
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => deliverFileRefs.current[ms.id]?.click()}
                                    >
                                      <Upload className="h-3 w-3 mr-1" />
                                      {deliverForm.file ? deliverForm.file.name : "Choose ZIP file"}
                                    </Button>
                                    {deliverForm.file && (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setDeliverForms((prev) => ({ ...prev, [ms.id]: { ...deliverForm, file: null } }));
                                          if (deliverFileRefs.current[ms.id]) deliverFileRefs.current[ms.id]!.value = "";
                                        }}
                                      >
                                        ✕
                                      </Button>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">Upload the full source code ZIP (max 50 MB)</p>
                                </div>
                                <Button size="sm" onClick={() => handleDeliver(ms.id)} disabled={busyDeliver}>
                                  <PackageCheck className="h-3 w-3 mr-1" />
                                  {busyDeliver ? "Delivering…" : "Submit Final Deliverables"}
                                </Button>
                              </div>
                            )}

                            {/* Employer: released — waiting for final delivery */}
                            {isEmployer && ms.status === "released" && (
                              <div className="space-y-2">
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">✓ Payment confirmed — awaiting final deliverables</p>
                                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">The developer will submit the source code ZIP and official domain shortly.</p>
                                </div>
                                {ms.submissionLink && (
                                  <a href={ms.submissionLink} target="_blank" rel="noreferrer">
                                    <Button size="sm" variant="ghost" className="h-7 text-xs">
                                      <ExternalLink className="h-3 w-3 mr-1" /> Preview Link
                                    </Button>
                                  </a>
                                )}
                              </div>
                            )}

                            {/* ── DELIVERED: show final official deliverables ── */}
                            {ms.status === "delivered" && (
                              <div className="space-y-2">
                                <p className="text-sm text-green-700 dark:text-green-400 font-medium">✓ Fully Delivered</p>
                                <div className="flex flex-wrap gap-2">
                                  {ms.finalLink && (
                                    <a href={ms.finalLink} target="_blank" rel="noreferrer">
                                      <Button size="sm" variant="outline" className="h-7 text-xs">
                                        <ExternalLink className="h-3 w-3 mr-1" /> Official Domain
                                      </Button>
                                    </a>
                                  )}
                                  {ms.finalFileUrl && (
                                    <a href={ms.finalFileUrl} target="_blank" rel="noreferrer" download>
                                      <Button size="sm" variant="outline" className="h-7 text-xs">
                                        <Download className="h-3 w-3 mr-1" /> Download Source ZIP
                                      </Button>
                                    </a>
                                  )}
                                  {ms.submissionLink && (
                                    <a href={ms.submissionLink} target="_blank" rel="noreferrer">
                                      <Button size="sm" variant="ghost" className="h-7 text-xs">
                                        <ExternalLink className="h-3 w-3 mr-1" /> Preview Link
                                      </Button>
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Employer: add new milestone */}
                {isEmployer && contract.status === "active" && anyDelivered && (
                  <div className="mt-5 border-t pt-4">
                    {!showAddMilestone ? (
                      <Button size="sm" variant="outline" onClick={() => setShowAddMilestone(true)}>
                        + Add Next Milestone
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold">Add a New Milestone</p>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Title <span className="text-destructive">*</span></Label>
                            <Input
                              placeholder="e.g. Phase 2 — Backend API"
                              value={addMilestoneForm.title}
                              onChange={(e) => setAddMilestoneForm((p) => ({ ...p, title: e.target.value }))}
                              className="h-9 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Amount ($) <span className="text-destructive">*</span></Label>
                            <Input
                              type="number"
                              min={1}
                              placeholder="e.g. 500"
                              value={addMilestoneForm.amount}
                              onChange={(e) => setAddMilestoneForm((p) => ({ ...p, amount: e.target.value }))}
                              className="h-9 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Due Date <span className="text-muted-foreground">(optional)</span></Label>
                            <Input
                              type="date"
                              value={addMilestoneForm.dueDate}
                              onChange={(e) => setAddMilestoneForm((p) => ({ ...p, dueDate: e.target.value }))}
                              className="h-9 text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleAddMilestone} disabled={addingMilestone}>
                            {addingMilestone ? "Adding…" : "Add Milestone"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setShowAddMilestone(false); setAddMilestoneForm({ title: "", amount: "", dueDate: "" }); }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ContractDetail;
