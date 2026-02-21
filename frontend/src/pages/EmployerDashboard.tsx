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
import { Briefcase, Users, DollarSign, FileText, Plus, MessageSquare, Trash2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Job {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

interface DeveloperPaymentDetails {
  method: "bank_transfer" | "mobile_money" | "other";
  accountName: string;
  details: string;
}

interface Contract {
  id: string;
  developerId: string;
  status: string;
  totalAmount: number;
  developerPaymentDetails: DeveloperPaymentDetails | null;
  createdAt: string;
}

interface RecentApplicant {
  id: string;
  developerId: string;
  developerName: string;
  jobId: string;
  jobTitle: string;
  coverLetter?: string;
  status: string;
  createdAt: string;
}

const methodLabels: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  mobile_money: "Mobile Money",
  other: "Other"
};

const statusColor = (s: string) =>
  s === "active" || s === "open" || s === "accepted" ? "default" :
  s === "closed" || s === "rejected" ? "destructive" : "secondary";

const EmployerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [recentApplicants, setRecentApplicants] = useState<RecentApplicant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [jobsData, contractsData, applicantsData] = await Promise.all([
        api<Job[]>(`/jobs/employer/${user?.id}`),
        api<Contract[]>("/contracts"),
        api<RecentApplicant[]>("/applications/employer/recent")
      ]);
      setJobs(jobsData);
      setContracts(contractsData);
      setRecentApplicants(applicantsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleJobStatus = async (jobId: string, status: string) => {
    try {
      await api(`/jobs/${jobId}/status`, { method: "PATCH", body: { status } });
      toast({ title: `Job set to ${status}` });
      fetchAll();
    } catch {
      toast({ title: "Failed to update job status", variant: "destructive" });
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Permanently delete this job?")) return;
    try {
      await api(`/jobs/${jobId}`, { method: "DELETE" });
      toast({ title: "Job deleted" });
      fetchAll();
    } catch {
      toast({ title: "Failed to delete job", variant: "destructive" });
    }
  };

  const handleApplicantStatus = async (appId: string, status: string) => {
    try {
      await api(`/applications/${appId}/status`, { method: "PATCH", body: { status } });
      toast({ title: `Applicant ${status}` });
      fetchAll();
    } catch {
      toast({ title: "Failed to update applicant", variant: "destructive" });
    }
  };

  const openJobs = jobs.filter((j) => j.status === "open");
  const activeContracts = contracts.filter((c) => c.status === "active" || c.status === "disputed");
  const historyContracts = contracts.filter((c) => c.status === "completed" || c.status === "cancelled");
  const totalSpent = historyContracts.filter((c) => c.status === "completed").reduce((s, c) => s + c.totalAmount, 0);
  const pendingApplicants = recentApplicants.filter((a) => a.status === "submitted");
  const contractsNeedingPayment = contracts.filter((c) => c.status === "active" && !c.developerPaymentDetails);

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
              <p className="text-muted-foreground">Employer Dashboard</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link to="/messages">
                <Button variant="outline" size="sm"><MessageSquare className="h-4 w-4 mr-1" />Messages</Button>
              </Link>
              <Link to="/company/edit">
                <Button variant="outline" size="sm">Edit Company</Button>
              </Link>
              <Link to="/jobs/create">
                <Button size="sm"><Plus className="h-4 w-4 mr-1" />Post Job</Button>
              </Link>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="jobs">
                Jobs <Badge variant="secondary" className="ml-1 text-xs">{jobs.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="contracts">
                Contracts
                {activeContracts.length > 0 && <Badge variant="secondary" className="ml-1 text-xs">{activeContracts.length} active</Badge>}
                {historyContracts.length > 0 && <Badge variant="outline" className="ml-1 text-xs">{historyContracts.length} done</Badge>}
                {contractsNeedingPayment.length > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs">{contractsNeedingPayment.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="applicants">
                Applicants
                {pendingApplicants.length > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs">{pendingApplicants.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ── OVERVIEW ─────────────────────────────────────────────── */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Open Jobs</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{openJobs.length}</div>
                    <p className="text-xs text-muted-foreground">{jobs.length} total</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Pending Applicants</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{pendingApplicants.length}</div>
                    <p className="text-xs text-muted-foreground">{recentApplicants.length} total recent</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{activeContracts.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${totalSpent.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {contracts.filter((c) => c.status === "completed").length} completed
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Recent Jobs</CardTitle>
                    <Link to="/jobs/create">
                      <Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" />New</Button>
                    </Link>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {jobs.slice(0, 5).map((j) => (
                      <Link key={j.id} to={`/jobs/${j.id}/applicants`} className="flex items-center justify-between hover:bg-muted/50 p-2 rounded">
                        <div>
                          <p className="font-medium text-sm">{j.title}</p>
                          <p className="text-xs text-muted-foreground">{new Date(j.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Badge variant={statusColor(j.status)}>{j.status}</Badge>
                      </Link>
                    ))}
                    {!jobs.length && <p className="text-muted-foreground text-sm">No jobs posted yet</p>}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Active Contracts</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {activeContracts.slice(0, 5).map((c) => (
                      <Link key={c.id} to={`/contracts/${c.id}`} className="flex items-center justify-between hover:bg-muted/50 p-2 rounded">
                        <div>
                          <p className="font-medium text-sm">Contract #{c.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">${c.totalAmount.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!c.developerPaymentDetails && (
                            <Badge variant="secondary" className="text-xs">No payment info</Badge>
                          )}
                          <Badge variant={statusColor(c.status)}>{c.status}</Badge>
                        </div>
                      </Link>
                    ))}
                    {!activeContracts.length && <p className="text-muted-foreground text-sm">No active contracts</p>}
                    <Link to="/developers">
                      <Button variant="outline" size="sm" className="w-full mt-2">Find Developers</Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── JOBS ─────────────────────────────────────────────────── */}
            <TabsContent value="jobs">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>My Jobs ({jobs.length})</CardTitle>
                  <Link to="/jobs/create">
                    <Button size="sm"><Plus className="h-4 w-4 mr-1" />Post Job</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {jobs.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No jobs posted yet</p>
                      <Link to="/jobs/create"><Button>Post Your First Job</Button></Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {jobs.map((j) => (
                        <div key={j.id} className="flex items-center justify-between p-4 border rounded-lg gap-4 flex-wrap">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{j.title}</p>
                              <Badge variant={statusColor(j.status)}>{j.status}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">Posted {new Date(j.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Link to={`/jobs/${j.id}/applicants`}>
                              <Button size="sm" variant="outline"><Users className="h-3 w-3 mr-1" />Applicants</Button>
                            </Link>
                            <Select value={j.status} onValueChange={(v) => handleJobStatus(j.id, v)}>
                              <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="paused">Paused</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteJob(j.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
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
                      <CardContent className="py-6 text-center">
                        <p className="text-muted-foreground text-sm mb-3">No active contracts yet</p>
                        <Link to="/developers"><Button variant="outline" size="sm">Find Developers</Button></Link>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {activeContracts.map((c) => (
                        <Card key={c.id}>
                          <CardContent className="pt-5 pb-5">
                            <div className="flex items-start justify-between flex-wrap gap-4 mb-3">
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
                            {/* Developer payment details */}
                            {c.developerPaymentDetails ? (
                              <div className="border-t pt-3 mt-1">
                                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2">
                                  <CreditCard className="h-3 w-3" /> Developer Payment Info
                                </p>
                                <div className="grid sm:grid-cols-3 gap-2 text-sm">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Method</p>
                                    <p className="font-medium">{methodLabels[c.developerPaymentDetails.method]}</p>
                                  </div>
                                  {c.developerPaymentDetails.accountName && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">Name</p>
                                      <p className="font-medium">{c.developerPaymentDetails.accountName}</p>
                                    </div>
                                  )}
                                  <div className="sm:col-span-2">
                                    <p className="text-xs text-muted-foreground">Details</p>
                                    <p className="text-sm whitespace-pre-wrap">{c.developerPaymentDetails.details}</p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="border-t pt-3 mt-1">
                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                  ⚠ Developer hasn't provided payment details yet — remind them via{" "}
                                  <Link to="/messages" className="underline">Messages</Link> or check the contract page.
                                </p>
                              </div>
                            )}
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

            {/* ── APPLICANTS ───────────────────────────────────────────── */}
            <TabsContent value="applicants">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Applicants ({recentApplicants.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentApplicants.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No applicants yet. Post jobs to attract talent.</p>
                  ) : (
                    <div className="space-y-3">
                      {recentApplicants.map((a) => (
                        <div key={a.id} className="flex items-start justify-between p-4 border rounded-lg gap-4 flex-wrap">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{a.developerName || "Developer"}</p>
                              <Badge variant={statusColor(a.status)}>{a.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              For: <strong>{a.jobTitle}</strong> · {new Date(a.createdAt).toLocaleDateString()}
                            </p>
                            {a.coverLetter && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.coverLetter}</p>
                            )}
                          </div>
                          <div className="flex gap-2 flex-wrap flex-shrink-0">
                            {a.status === "submitted" && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => handleApplicantStatus(a.id, "shortlisted")}>Shortlist</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleApplicantStatus(a.id, "rejected")}>Reject</Button>
                              </>
                            )}
                            {a.status === "shortlisted" && (
                              <Button size="sm" onClick={() => handleApplicantStatus(a.id, "accepted")}>Accept</Button>
                            )}
                            {a.status === "accepted" && (
                              <Link to={`/contracts/create?developerId=${a.developerId}&jobId=${a.jobId}`}>
                                <Button size="sm" variant="outline">Create Contract</Button>
                              </Link>
                            )}
                            <Link to={`/developers/${a.developerId}`}>
                              <Button size="sm" variant="ghost">Profile</Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EmployerDashboard;
