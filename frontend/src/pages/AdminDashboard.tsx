import { useEffect, useRef, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { Users, Briefcase, DollarSign, AlertTriangle, Settings, ScrollText, TrendingUp, RefreshCw, Trash2, ShieldCheck, Save, RotateCcw, Building2, CreditCard, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Analytics {
  totalUsers: number;
  totalDevelopers: number;
  totalEmployers: number;
  openJobs: number;
  activeContracts: number;
  userGrowth: { month: string; users: number }[];
  recentUsers: { id: string; email: string; fullName: string; role: string; createdAt: string }[];
  recentJobs: { id: string; title: string; status: string; createdAt: string }[];
}

interface UserRow {
  id: string;
  email: string;
  role: string;
  fullName: string;
  status: string;
  createdAt: string;
}

interface JobRow {
  id: string;
  title: string;
  status: string;
  companyName: string;
  createdAt: string;
}

interface Dispute {
  id: string;
  employerId: string;
  developerId: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  actorEmail?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface AdminContract {
  id: string;
  employerId: string;
  employerName: string;
  employerEmail: string;
  employerCompany: string;
  developerId: string;
  developerName: string;
  developerEmail: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  developerPaymentDetails: { method: string; accountName: string; details: string } | null;
  milestones: { id: string; title: string; amount: number; status: string; submissionLink: string | null; finalLink: string | null; finalFileUrl: string | null }[];
}

interface EmployerRow {
  id: string;
  userId: string;
  companyName: string;
  website: string | null;
  about: string | null;
  location: string | null;
  avatarUrl: string | null;
  fullName: string;
  email: string;
  userStatus: string;
  memberSince: string;
  jobCount: number;
  contractCount: number;
  createdAt: string;
}

interface LiveStats {
  totalUsers: number;
  openJobs: number;
  activeContracts: number;
  ts: number;
}

const statusColor = (s: string) =>
  s === "active" || s === "open" ? "default" : s === "suspended" || s === "closed" ? "destructive" : "secondary";

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRole] = useState("all");
  const [userStatus, setUserStatus] = useState("all");
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [jobSearch, setJobSearch] = useState("");
  const [contracts, setContracts] = useState<AdminContract[]>([]);
  const [employers, setEmployers] = useState<EmployerRow[]>([]);
  const [contractSearch, setContractSearch] = useState("");
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditEntity, setAuditEntity] = useState("");
  const [auditAction, setAuditAction] = useState("");
  const [config, setConfig] = useState<Record<string, string>>({});
  const [configEdit, setConfigEdit] = useState<Record<string, string>>({});
  const [newAdminForm, setNewAdminForm] = useState({ email: "", password: "", fullName: "" });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  const fetchAnalytics = useCallback(async () => {
    const data = await api<Analytics>("/admin/analytics");
    setAnalytics(data);
    setLastRefresh(new Date());
  }, []);

  const fetchUsers = useCallback(async () => {
    const params = new URLSearchParams({ limit: "100" });
    if (userRole !== "all") params.set("role", userRole);
    if (userStatus !== "all") params.set("status", userStatus);
    if (userSearch) params.set("search", userSearch);
    const data = await api<UserRow[]>(`/admin/users?${params}`);
    setUsers(data);
  }, [userRole, userStatus, userSearch]);

  const fetchJobs = useCallback(async () => {
    const data = await api<JobRow[]>("/admin/jobs");
    setJobs(data);
  }, []);

  const fetchContracts = useCallback(async () => {
    const data = await api<AdminContract[]>("/admin/contracts");
    setContracts(data);
  }, []);

  const fetchEmployers = useCallback(async () => {
    const data = await api<EmployerRow[]>("/admin/employers");
    setEmployers(data);
  }, []);

  const fetchDisputes = useCallback(async () => {
    const data = await api<Dispute[]>("/admin/disputes");
    setDisputes(data);
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    const params = new URLSearchParams({ limit: "100" });
    if (auditEntity) params.set("entity", auditEntity);
    if (auditAction) params.set("action", auditAction);
    const data = await api<AuditLog[]>(`/admin/audit-logs?${params}`);
    setAuditLogs(data);
  }, [auditEntity, auditAction]);

  const fetchConfig = useCallback(async () => {
    const data = await api<Record<string, string>>("/admin/config");
    setConfig(data);
    setConfigEdit(data);
  }, []);

  const fetchAll = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      await Promise.all([fetchAnalytics(), fetchUsers(), fetchJobs(), fetchContracts(), fetchEmployers(), fetchDisputes(), fetchAuditLogs(), fetchConfig()]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchAnalytics, fetchUsers, fetchJobs, fetchContracts, fetchEmployers, fetchDisputes, fetchAuditLogs, fetchConfig]);

  // Initial load + auto-refresh every 30s
  useEffect(() => {
    fetchAll();
    autoRefreshRef.current = setInterval(() => fetchAnalytics(), 30000);
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current); };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // SSE for live stat counters
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    const es = new EventSource(`/api/admin/analytics/stream?token=${encodeURIComponent(token)}`);
    esRef.current = es;
    es.onmessage = (e) => {
      try { setLiveStats(JSON.parse(e.data) as LiveStats); } catch { /* ignore */ }
    };
    return () => es.close();
  }, []);

  // Re-fetch users when filters change
  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  // Re-fetch audit logs when filters change
  useEffect(() => { fetchAuditLogs(); }, [fetchAuditLogs]);

  // Actions — users
  const handleStatusChange = async (userId: string, status: string) => {
    try {
      await api(`/admin/users/${userId}/status`, { method: "PATCH", body: { status } });
      toast({ title: "User status updated" });
      fetchUsers();
    } catch { toast({ title: "Failed to update status", variant: "destructive" }); }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Permanently delete this user?")) return;
    try {
      await api(`/admin/users/${userId}`, { method: "DELETE" });
      toast({ title: "User deleted" });
      fetchUsers();
      fetchAnalytics();
    } catch { toast({ title: "Failed to delete user", variant: "destructive" }); }
  };

  // Actions — jobs
  const handleJobStatus = async (jobId: string, status: string) => {
    try {
      await api(`/admin/jobs/${jobId}/status`, { method: "PATCH", body: { status } });
      toast({ title: "Job status updated" });
      fetchJobs();
    } catch { toast({ title: "Failed to update job", variant: "destructive" }); }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Permanently delete this job? This cannot be undone.")) return;
    try {
      await api(`/admin/jobs/${jobId}`, { method: "DELETE" });
      toast({ title: "Job deleted" });
      fetchJobs();
    } catch { toast({ title: "Failed to delete job", variant: "destructive" }); }
  };

  // Actions — disputes
  const handleResolveDispute = async (contractId: string, resolution: string) => {
    try {
      await api(`/admin/disputes/${contractId}/resolve`, { method: "POST", body: { resolution } });
      toast({ title: "Dispute resolved" });
      fetchDisputes();
    } catch { toast({ title: "Failed to resolve dispute", variant: "destructive" }); }
  };

  // Actions — config
  const handleSaveConfig = async (key: string) => {
    const value = configEdit[key];
    if (value === undefined || value === "") {
      toast({ title: "Value cannot be empty", variant: "destructive" });
      return;
    }
    if (key === "commission_pct") {
      const n = Number(value);
      if (isNaN(n) || n < 0 || n > 100) {
        toast({ title: "Commission % must be a number between 0 and 100", variant: "destructive" });
        return;
      }
    }
    if (key === "max_file_size_mb") {
      const n = Number(value);
      if (isNaN(n) || n <= 0) {
        toast({ title: "Max upload size must be a positive number", variant: "destructive" });
        return;
      }
    }
    try {
      await api("/admin/config", { method: "PATCH", body: { key, value } });
      toast({ title: `"${key}" saved successfully` });
      fetchConfig();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save config";
      toast({ title: msg, variant: "destructive" });
    }
  };

  const handleSaveAllConfig = async () => {
    const changed = Object.entries(configEdit).filter(([k, v]) => v !== config[k]);
    if (!changed.length) {
      toast({ title: "No changes to save" });
      return;
    }
    // Validate before sending
    for (const [key, value] of changed) {
      if (value === undefined || value === "") {
        toast({ title: `"${key}" value cannot be empty`, variant: "destructive" });
        return;
      }
      if (key === "commission_pct") {
        const n = Number(value);
        if (isNaN(n) || n < 0 || n > 100) {
          toast({ title: "Commission % must be a number between 0 and 100", variant: "destructive" });
          return;
        }
      }
      if (key === "max_file_size_mb") {
        const n = Number(value);
        if (isNaN(n) || n <= 0) {
          toast({ title: "Max upload size must be a positive number", variant: "destructive" });
          return;
        }
      }
    }
    try {
      await api("/admin/config/bulk", { method: "PATCH", body: Object.fromEntries(changed) });
      toast({ title: `${changed.length} config value${changed.length > 1 ? "s" : ""} saved` });
      fetchConfig();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save config";
      toast({ title: msg, variant: "destructive" });
    }
  };

  const handleDeleteConfigKey = async (key: string) => {
    if (!confirm(`Delete config key "${key}"? This cannot be undone.`)) return;
    try {
      await api(`/admin/config/${key}`, { method: "DELETE" });
      toast({ title: `Config key "${key}" deleted` });
      fetchConfig();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete config key";
      toast({ title: msg, variant: "destructive" });
    }
  };

  // Actions — create admin
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api("/admin/create-admin", { method: "POST", body: newAdminForm });
      toast({ title: "Admin user created!" });
      setNewAdminForm({ email: "", password: "", fullName: "" });
      fetchUsers();
    } catch { toast({ title: "Failed to create admin", variant: "destructive" }); }
  };

  const displayStats = liveStats ?? { totalUsers: analytics?.totalUsers ?? 0, openJobs: analytics?.openJobs ?? 0, activeContracts: analytics?.activeContracts ?? 0 };

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
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Platform management &amp; real-time analytics
                {lastRefresh && <span className="ml-2 text-xs">· Last updated {lastRefresh.toLocaleTimeString()}</span>}
                {liveStats && <span className="ml-1 text-xs text-green-500">· Live</span>}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchAll(true)} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid grid-cols-4 sm:flex sm:flex-wrap h-auto gap-1 w-full">
              <TabsTrigger value="overview" className="flex items-center justify-center gap-1 text-xs sm:text-sm px-2 py-1.5"><TrendingUp className="h-3.5 w-3.5 shrink-0" /><span>Overview</span></TabsTrigger>
              <TabsTrigger value="users" className="flex items-center justify-center gap-1 text-xs sm:text-sm px-2 py-1.5"><Users className="h-3.5 w-3.5 shrink-0" /><span>Users</span></TabsTrigger>
              <TabsTrigger value="jobs" className="flex items-center justify-center gap-1 text-xs sm:text-sm px-2 py-1.5"><Briefcase className="h-3.5 w-3.5 shrink-0" /><span>Jobs</span></TabsTrigger>
              <TabsTrigger value="contracts" className="flex items-center justify-center gap-1 text-xs sm:text-sm px-2 py-1.5"><FileText className="h-3.5 w-3.5 shrink-0" /><span>Contracts</span></TabsTrigger>
              <TabsTrigger value="employers" className="flex items-center justify-center gap-1 text-xs sm:text-sm px-2 py-1.5"><Building2 className="h-3.5 w-3.5 shrink-0" /><span>Employers</span></TabsTrigger>
              <TabsTrigger value="disputes" className="flex items-center justify-center gap-1 text-xs sm:text-sm px-2 py-1.5"><AlertTriangle className="h-3.5 w-3.5 shrink-0" /><span>Disputes</span>{disputes.length > 0 && <Badge variant="destructive" className="ml-1 text-xs">{disputes.length}</Badge>}</TabsTrigger>
              <TabsTrigger value="audit" className="flex items-center justify-center gap-1 text-xs sm:text-sm px-2 py-1.5"><ScrollText className="h-3.5 w-3.5 shrink-0" /><span>Audit</span></TabsTrigger>
              <TabsTrigger value="config" className="flex items-center justify-center gap-1 text-xs sm:text-sm px-2 py-1.5"><Settings className="h-3.5 w-3.5 shrink-0" /><span>Config</span></TabsTrigger>
            </TabsList>

            {/* ─── OVERVIEW ─────────────────────────────────────────────────── */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stat cards — live */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{displayStats.totalUsers.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">{analytics?.totalDevelopers} devs · {analytics?.totalEmployers} employers</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Open Jobs</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{displayStats.openJobs.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{displayStats.activeContracts.toLocaleString()}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid lg:grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">User Growth (6 months)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={analytics?.userGrowth ?? []}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Recent activity */}
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-base">Recent Sign-ups</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {(analytics?.recentUsers ?? []).map((u) => (
                      <div key={u.id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">{u.fullName || u.email}</p>
                          <p className="text-muted-foreground text-xs">{u.email}</p>
                        </div>
                        <Badge variant={u.role === "admin" ? "default" : "secondary"} className="capitalize">{u.role}</Badge>
                      </div>
                    ))}
                    {!analytics?.recentUsers?.length && <p className="text-muted-foreground text-sm">No users yet</p>}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Recent Jobs</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {(analytics?.recentJobs ?? []).map((j) => (
                      <div key={j.id} className="flex items-center justify-between text-sm">
                        <p className="font-medium truncate flex-1 mr-2">{j.title}</p>
                        <Badge variant={statusColor(j.status)}>{j.status}</Badge>
                      </div>
                    ))}
                    {!analytics?.recentJobs?.length && <p className="text-muted-foreground text-sm">No jobs yet</p>}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ─── USERS ────────────────────────────────────────────────────── */}
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
                  <CardTitle>User Management</CardTitle>
                  <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                    <Input
                      placeholder="Search name or email…"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full sm:w-48"
                    />
                    <Select value={userRole} onValueChange={setUserRole}>
                      <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="Role" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All roles</SelectItem>
                        <SelectItem value="developer">Developer</SelectItem>
                        <SelectItem value="employer">Employer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={userStatus} onValueChange={setUserStatus}>
                      <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="text-left py-3 px-2">Name</th>
                          <th className="text-left py-3 px-2">Email</th>
                          <th className="text-left py-3 px-2">Role</th>
                          <th className="text-left py-3 px-2">Status</th>
                          <th className="text-left py-3 px-2">Joined</th>
                          <th className="text-left py-3 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} className="border-b hover:bg-muted/30">
                            <td className="py-3 px-2 font-medium">{u.fullName || "—"}</td>
                            <td className="py-3 px-2 text-muted-foreground">{u.email}</td>
                            <td className="py-3 px-2">
                              <Badge variant={u.role === "admin" ? "default" : "secondary"} className="capitalize">{u.role}</Badge>
                            </td>
                            <td className="py-3 px-2">
                              <Badge variant={statusColor(u.status)}>{u.status}</Badge>
                            </td>
                            <td className="py-3 px-2 text-muted-foreground text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                            <td className="py-3 px-2">
                              <div className="flex gap-1 flex-wrap">
                                {u.status === "active" ? (
                                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(u.id, "suspended")}>Suspend</Button>
                                ) : (
                                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(u.id, "active")}>Activate</Button>
                                )}
                                <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(u.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!users.length && <p className="text-center py-8 text-muted-foreground">No users found</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Create admin */}
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Create Admin User</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label>Full Name</Label>
                      <Input value={newAdminForm.fullName} onChange={(e) => setNewAdminForm({ ...newAdminForm, fullName: e.target.value })} required />
                    </div>
                    <div className="space-y-1">
                      <Label>Email</Label>
                      <Input type="email" value={newAdminForm.email} onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })} required />
                    </div>
                    <div className="space-y-1">
                      <Label>Password</Label>
                      <Input type="password" value={newAdminForm.password} onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })} required />
                    </div>
                    <Button type="submit" className="sm:col-span-3 w-full sm:w-auto">Create Admin</Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── JOBS ─────────────────────────────────────────────────────── */}
            <TabsContent value="jobs">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
                  <CardTitle>Job Management</CardTitle>
                  <Input
                    placeholder="Search jobs…"
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    className="w-full sm:w-48"
                  />
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[550px] text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="text-left py-3 px-2">Title</th>
                          <th className="text-left py-3 px-2">Company</th>
                          <th className="text-left py-3 px-2">Status</th>
                          <th className="text-left py-3 px-2">Posted</th>
                          <th className="text-left py-3 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobs
                          .filter((j) => !jobSearch || j.title.toLowerCase().includes(jobSearch.toLowerCase()) || (j.companyName ?? "").toLowerCase().includes(jobSearch.toLowerCase()))
                          .map((j) => (
                          <tr key={j.id} className="border-b hover:bg-muted/30">
                            <td className="py-3 px-2 font-medium">{j.title}</td>
                            <td className="py-3 px-2 text-muted-foreground">{j.companyName || "—"}</td>
                            <td className="py-3 px-2"><Badge variant={statusColor(j.status)}>{j.status}</Badge></td>
                            <td className="py-3 px-2 text-muted-foreground text-xs">{new Date(j.createdAt).toLocaleDateString()}</td>
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <Select value={j.status} onValueChange={(v) => handleJobStatus(j.id, v)}>
                                  <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="paused">Pause</SelectItem>
                                    <SelectItem value="closed">Close</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button size="sm" variant="destructive" className="h-7 w-7 p-0" onClick={() => handleDeleteJob(j.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!jobs.length && <p className="text-center py-8 text-muted-foreground">No jobs found</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── CONTRACTS ────────────────────────────────────────────────── */}
            <TabsContent value="contracts">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    All Contracts ({contracts.length})
                  </CardTitle>
                  <Input
                    placeholder="Search employer / developer…"
                    value={contractSearch}
                    onChange={(e) => setContractSearch(e.target.value)}
                    className="w-full sm:w-64"
                  />
                </CardHeader>
                <CardContent>
                  {contracts.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No contracts yet</p>
                  ) : (
                    <div className="space-y-4">
                      {contracts
                        .filter((c) => {
                          const q = contractSearch.toLowerCase();
                          return (
                            !q ||
                            c.employerName.toLowerCase().includes(q) ||
                            c.employerEmail.toLowerCase().includes(q) ||
                            c.employerCompany.toLowerCase().includes(q) ||
                            c.developerName.toLowerCase().includes(q) ||
                            c.developerEmail.toLowerCase().includes(q)
                          );
                        })
                        .map((c) => (
                          <div key={c.id} className="border rounded-lg p-4 space-y-3">
                            {/* Contract header */}
                            <div className="flex items-start justify-between flex-wrap gap-2">
                              <div>
                                <p className="font-mono text-xs text-muted-foreground">#{c.id.slice(-8).toUpperCase()}</p>
                                <p className="font-semibold text-sm mt-0.5">
                                  ${Number(c.totalAmount).toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</p>
                              </div>
                              <Badge variant={c.status === "active" ? "default" : c.status === "completed" ? "secondary" : c.status === "disputed" ? "destructive" : "outline"} className="capitalize">
                                {c.status}
                              </Badge>
                            </div>

                            {/* Employer & Developer */}
                            <div className="grid sm:grid-cols-2 gap-3">
                              <div className="bg-muted/40 rounded p-3 space-y-0.5">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Employer</p>
                                <p className="text-sm font-medium">{c.employerName}</p>
                                {c.employerCompany && <p className="text-xs text-muted-foreground">{c.employerCompany}</p>}
                                <p className="text-xs text-muted-foreground">{c.employerEmail}</p>
                              </div>
                              <div className="bg-muted/40 rounded p-3 space-y-0.5">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Developer</p>
                                <p className="text-sm font-medium">{c.developerName}</p>
                                <p className="text-xs text-muted-foreground">{c.developerEmail}</p>
                              </div>
                            </div>

                            {/* Developer Payment Details */}
                            {c.developerPaymentDetails ? (
                              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded p-3 space-y-1">
                                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                                  <CreditCard className="h-3.5 w-3.5" />
                                  Developer Payment Details
                                </p>
                                <div className="grid sm:grid-cols-3 gap-2 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">Method: </span>
                                    <span className="font-medium capitalize">{c.developerPaymentDetails.method.replace("_", " ")}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Account: </span>
                                    <span className="font-medium">{c.developerPaymentDetails.accountName}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Details: </span>
                                    <span className="font-medium">{c.developerPaymentDetails.details}</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">Developer has not added payment details yet.</p>
                            )}

                            {/* Milestone Status Pipeline */}
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Milestones</p>
                              <div className="space-y-2">
                                {c.milestones.map((m, idx) => (
                                  <div key={m.id || idx} className="flex items-center justify-between flex-wrap gap-2 bg-muted/30 rounded px-3 py-2">
                                    <div className="text-xs">
                                      <span className="font-medium">{m.title}</span>
                                      <span className="text-muted-foreground ml-2">${Number(m.amount).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant={
                                          m.status === "delivered"
                                            ? "default"
                                            : m.status === "released"
                                            ? "secondary"
                                            : m.status === "submitted"
                                            ? "outline"
                                            : "outline"
                                        }
                                        className={`text-xs capitalize ${m.status === "released" ? "text-blue-600 border-blue-300" : m.status === "submitted" ? "text-amber-600 border-amber-300" : ""}`}
                                      >
                                        {m.status === "pending" && "⏳ "}
                                        {m.status === "submitted" && "📎 "}
                                        {m.status === "released" && "💰 "}
                                        {m.status === "delivered" && "✅ "}
                                        {m.status}
                                      </Badge>
                                      {m.submissionLink && (
                                        <a href={m.submissionLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                                          Preview
                                        </a>
                                      )}
                                      {m.finalLink && (
                                        <a href={m.finalLink} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 underline">
                                          Live
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── EMPLOYERS ────────────────────────────────────────────────── */}
            <TabsContent value="employers">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    All Employers ({employers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {employers.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No employer profiles yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[900px] text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="text-left py-3 px-2">Company</th>
                            <th className="text-left py-3 px-2">Owner</th>
                            <th className="text-left py-3 px-2">Contact</th>
                            <th className="text-left py-3 px-2">Location</th>
                            <th className="text-left py-3 px-2">Website</th>
                            <th className="text-left py-3 px-2">Jobs</th>
                            <th className="text-left py-3 px-2">Contracts</th>
                            <th className="text-left py-3 px-2">Status</th>
                            <th className="text-left py-3 px-2">Joined</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employers.map((emp) => (
                            <tr key={emp.id} className="border-b hover:bg-muted/30">
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-2">
                                  {emp.avatarUrl ? (
                                    <img src={emp.avatarUrl} alt={emp.companyName} className="h-7 w-7 rounded-full object-cover" />
                                  ) : (
                                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                  )}
                                  <span className="font-medium">{emp.companyName}</span>
                                </div>
                              </td>
                              <td className="py-3 px-2">{emp.fullName || "—"}</td>
                              <td className="py-3 px-2 text-muted-foreground text-xs">{emp.email}</td>
                              <td className="py-3 px-2 text-xs text-muted-foreground">{emp.location || "—"}</td>
                              <td className="py-3 px-2 text-xs">
                                {emp.website ? (
                                  <a href={emp.website} target="_blank" rel="noopener noreferrer" className="text-primary underline truncate max-w-[120px] block">
                                    {emp.website.replace(/^https?:\/\//, "")}
                                  </a>
                                ) : "—"}
                              </td>
                              <td className="py-3 px-2 text-center font-medium">{emp.jobCount}</td>
                              <td className="py-3 px-2 text-center font-medium">{emp.contractCount}</td>
                              <td className="py-3 px-2">
                                <Badge variant={emp.userStatus === "active" ? "default" : "destructive"} className="capitalize text-xs">
                                  {emp.userStatus}
                                </Badge>
                              </td>
                              <td className="py-3 px-2 text-xs text-muted-foreground whitespace-nowrap">{new Date(emp.memberSince).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── DISPUTES ─────────────────────────────────────────────────── */}
            <TabsContent value="disputes">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Active Disputes ({disputes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {disputes.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No active disputes 🎉</p>
                  ) : (
                    <div className="space-y-4">
                      {disputes.map((d) => (
                        <div key={d.id} className="flex items-center justify-between p-4 border rounded-lg flex-wrap gap-4">
                          <div className="space-y-1">
                            <p className="font-medium">Contract #{d.id.slice(0, 8)}</p>
                            <p className="text-sm text-muted-foreground">Amount: <strong>${Number(d.totalAmount).toLocaleString()}</strong></p>
                            <p className="text-xs text-muted-foreground">Created: {new Date(d.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleResolveDispute(d.id, "release")}>Release to Dev</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleResolveDispute(d.id, "refund")}>Refund Employer</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── AUDIT LOGS ───────────────────────────────────────────────── */}
            <TabsContent value="audit">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
                  <CardTitle>Audit Logs</CardTitle>
                  <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                    <Input placeholder="Filter entity…" value={auditEntity} onChange={(e) => setAuditEntity(e.target.value)} className="w-full sm:w-36" />
                    <Input placeholder="Filter action…" value={auditAction} onChange={(e) => setAuditAction(e.target.value)} className="w-full sm:w-36" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="text-left py-3 px-2">Time</th>
                          <th className="text-left py-3 px-2">Actor</th>
                          <th className="text-left py-3 px-2">Action</th>
                          <th className="text-left py-3 px-2">Entity</th>
                          <th className="text-left py-3 px-2">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="border-b hover:bg-muted/30">
                            <td className="py-3 px-2 text-muted-foreground text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                            <td className="py-3 px-2 text-xs">{log.actorEmail || "system"}</td>
                            <td className="py-3 px-2">
                              <Badge variant="secondary" className="text-xs">{log.action}</Badge>
                            </td>
                            <td className="py-3 px-2 text-xs">{log.entity}</td>
                            <td className="py-3 px-2 text-xs text-muted-foreground max-w-xs truncate">
                              {log.metadata ? JSON.stringify(log.metadata) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!auditLogs.length && <p className="text-center py-8 text-muted-foreground">No audit logs found</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── CONFIG ───────────────────────────────────────────────────── */}
            <TabsContent value="config">
              <div className="space-y-4">
                {/* Header actions */}
                {(() => {
                  const hasChanges = Object.entries(configEdit).some(([k, v]) => v !== config[k]);
                  return (
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h2 className="text-lg font-semibold">Platform Configuration</h2>
                        <p className="text-sm text-muted-foreground">Changes take effect immediately after saving.</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setConfigEdit({ ...config }); toast({ title: "Changes reset" }); }}
                          disabled={!hasChanges}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" /> Reset
                        </Button>
                        <Button size="sm" onClick={handleSaveAllConfig} disabled={!hasChanges}>
                          <Save className="h-4 w-4 mr-1" /> Save All Changes
                          {hasChanges && (
                            <Badge variant="destructive" className="ml-2 text-xs py-0 px-1">
                              {Object.entries(configEdit).filter(([k, v]) => v !== config[k]).length}
                            </Badge>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })()}

                {/* Core platform settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Core Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Commission % */}
                    {(() => {
                      const key = "commission_pct";
                      const isDirty = configEdit[key] !== config[key];
                      const val = configEdit[key] ?? "";
                      const num = Number(val);
                      const isValid = val !== "" && !isNaN(num) && num >= 0 && num <= 100;
                      const sampleContract = 1000;
                      const commission = isValid ? (sampleContract * num) / 100 : null;
                      return (
                        <div className="space-y-2 border-b pb-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-semibold">
                                Commission Rate{" "}
                                <span className="text-xs font-normal text-muted-foreground ml-1">(commission_pct)</span>
                                {isDirty && <Badge variant="secondary" className="ml-2 text-xs py-0">unsaved</Badge>}
                              </Label>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Percentage the platform takes from each released milestone (0–100).
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="relative">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                step={0.5}
                                value={val}
                                onChange={(e) => setConfigEdit({ ...configEdit, [key]: e.target.value })}
                                placeholder="e.g. 10"
                                className={`w-32 pr-7 ${!isValid && val !== "" ? "border-destructive" : ""}`}
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleSaveConfig(key)}
                              disabled={!isDirty || !isValid}
                            >
                              Save
                            </Button>
                          </div>
                          {!isValid && val !== "" && (
                            <p className="text-xs text-destructive">Must be a number between 0 and 100.</p>
                          )}
                          {commission !== null && (
                            <p className="text-xs text-muted-foreground">
                              Preview: on a ${sampleContract.toLocaleString()} contract →{" "}
                              <span className="text-foreground font-medium">${commission.toFixed(2)} commission</span>, developer receives{" "}
                              <span className="text-green-600 font-medium">${(sampleContract - commission).toFixed(2)}</span>
                            </p>
                          )}
                          {config[key] !== undefined && (
                            <p className="text-xs text-muted-foreground">Saved value: <code className="bg-muted px-1 rounded">{config[key]}%</code></p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Max Upload Size */}
                    {(() => {
                      const key = "max_file_size_mb";
                      const isDirty = configEdit[key] !== config[key];
                      const val = configEdit[key] ?? "";
                      const num = Number(val);
                      const isValid = val !== "" && !isNaN(num) && num > 0;
                      return (
                        <div className="space-y-2 border-b pb-5">
                          <div>
                            <Label className="font-semibold">
                              Max Upload Size{" "}
                              <span className="text-xs font-normal text-muted-foreground ml-1">(max_file_size_mb)</span>
                              {isDirty && <Badge variant="secondary" className="ml-2 text-xs py-0">unsaved</Badge>}
                            </Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Maximum file size allowed for user uploads in megabytes.
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="relative">
                              <Input
                                type="number"
                                min={1}
                                step={1}
                                value={val}
                                onChange={(e) => setConfigEdit({ ...configEdit, [key]: e.target.value })}
                                placeholder="e.g. 10"
                                className={`w-32 pr-10 ${!isValid && val !== "" ? "border-destructive" : ""}`}
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">MB</span>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleSaveConfig(key)}
                              disabled={!isDirty || !isValid}
                            >
                              Save
                            </Button>
                          </div>
                          {!isValid && val !== "" && (
                            <p className="text-xs text-destructive">Must be a positive number.</p>
                          )}
                          {config[key] !== undefined && (
                            <p className="text-xs text-muted-foreground">Saved value: <code className="bg-muted px-1 rounded">{config[key]} MB</code></p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Maintenance Mode */}
                    {(() => {
                      const key = "maintenance_mode";
                      const savedBool = config[key] === "true";
                      const editBool = configEdit[key] === "true";
                      const isDirty = configEdit[key] !== config[key];
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                              <Label className="font-semibold">
                                Maintenance Mode{" "}
                                <span className="text-xs font-normal text-muted-foreground ml-1">(maintenance_mode)</span>
                                {isDirty && <Badge variant="secondary" className="ml-2 text-xs py-0">unsaved</Badge>}
                              </Label>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                When enabled, all non-admin API requests return 503. Admin routes remain accessible.
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-sm font-medium ${editBool ? "text-destructive" : "text-muted-foreground"}`}>
                                {editBool ? "ON" : "OFF"}
                              </span>
                              <Switch
                                checked={editBool}
                                onCheckedChange={(checked) =>
                                  setConfigEdit({ ...configEdit, [key]: checked ? "true" : "false" })
                                }
                              />
                            </div>
                          </div>
                          {isDirty && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={editBool ? "destructive" : "default"}
                                onClick={() => handleSaveConfig(key)}
                              >
                                {editBool ? "Enable Maintenance Mode" : "Disable Maintenance Mode"}
                              </Button>
                            </div>
                          )}
                          {config[key] !== undefined && (
                            <p className="text-xs text-muted-foreground">
                              Saved state:{" "}
                              <span className={savedBool ? "text-destructive font-semibold" : "text-green-600 font-semibold"}>
                                {savedBool ? "ENABLED" : "DISABLED"}
                              </span>
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Dynamic / custom config keys */}
                {(() => {
                  const CORE_KEYS = ["commission_pct", "max_file_size_mb", "maintenance_mode"];
                  const customKeys = Object.keys(config).filter((k) => !CORE_KEYS.includes(k));
                  if (!customKeys.length) return null;
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Custom Config Keys</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {customKeys.map((key) => {
                          const isDirty = configEdit[key] !== config[key];
                          return (
                            <div key={key} className="flex items-end gap-2 flex-wrap border-b pb-4 last:border-0">
                              <div className="flex-1 space-y-1 min-w-0">
                                <Label className="font-medium text-sm flex items-center gap-1">
                                  {key}
                                  {isDirty && <Badge variant="secondary" className="ml-1 text-xs py-0">unsaved</Badge>}
                                </Label>
                                <Input
                                  value={configEdit[key] ?? ""}
                                  onChange={(e) => setConfigEdit({ ...configEdit, [key]: e.target.value })}
                                  className="max-w-xs"
                                />
                                <p className="text-xs text-muted-foreground">Saved: <code className="bg-muted px-1 rounded">{config[key]}</code></p>
                              </div>
                              <Button size="sm" onClick={() => handleSaveConfig(key)} disabled={!isDirty || (configEdit[key] ?? "") === ""}>
                                Save
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteConfigKey(key)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Add custom config key */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Add Custom Config Key</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        const key = (fd.get("key") as string).trim();
                        const value = (fd.get("value") as string).trim();
                        if (!key || !value) return;
                        const CORE_KEYS = ["commission_pct", "max_file_size_mb", "maintenance_mode"];
                        if (CORE_KEYS.includes(key)) {
                          toast({ title: `"${key}" is a core config key. Edit it in Core Settings above.`, variant: "destructive" });
                          return;
                        }
                        if (config[key] !== undefined) {
                          toast({ title: `Config key "${key}" already exists. Edit it in Custom Config Keys above.`, variant: "destructive" });
                          return;
                        }
                        try {
                          await api("/admin/config", { method: "PATCH", body: { key, value } });
                          toast({ title: `Config "${key}" added` });
                          fetchConfig();
                          (e.target as HTMLFormElement).reset();
                        } catch (err: unknown) {
                          const msg = err instanceof Error ? err.message : "Failed to save config";
                          toast({ title: msg, variant: "destructive" });
                        }
                      }}
                      className="space-y-3"
                    >
                      <div className="flex gap-2 flex-wrap items-end">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Key (snake_case)</Label>
                          <Input name="key" placeholder="e.g. feature_x_enabled" className="w-48" required />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Value</Label>
                          <Input name="value" placeholder="Value" className="w-48" required />
                        </div>
                        <Button type="submit" size="sm">Add</Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Custom keys are free-form. Use them for feature flags, external API settings, or any runtime parameter.
                      </p>
                    </form>
                  </CardContent>
                </Card>

                {Object.keys(config).length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No config entries yet. Save a value above to create your first entry.
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
