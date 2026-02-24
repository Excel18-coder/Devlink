import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

import { Mail, ShieldCheck, UserPlus, ArrowRight, RefreshCw } from "lucide-react";

type Step = "email" | "otp" | "details";

const Register = () => {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>("email");

  // Step 1
  const [email, setEmail] = useState("");

  // Step 2
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Step 3
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"developer" | "employer">("developer");

  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "developer" || roleParam === "employer") setRole(roleParam);
  }, [searchParams]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // ── Step 1: Send OTP ─────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api("/auth/send-otp", { method: "POST", body: { email } });
      toast({ title: "Verification code sent!", description: `Check your inbox at ${email}` });
      setStep("otp");
      setResendCooldown(60);
    } catch (err) {
      toast({ title: "Failed to send code", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await api("/auth/send-otp", { method: "POST", body: { email } });
      toast({ title: "New code sent!", description: `Check your inbox at ${email}` });
      setResendCooldown(60);
    } catch (err) {
      toast({ title: "Failed to resend code", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ───────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api("/auth/verify-otp", { method: "POST", body: { email, otp } });
      toast({ title: "Email verified!", description: "Now complete your account details." });
      setStep("details");
    } catch (err) {
      toast({ title: "Verification failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Register ─────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, role, fullName);
      toast({ title: "Account created!", description: "Welcome to Devlink 🎉" });
      navigate("/dashboard");
    } catch (err) {
      toast({ title: "Registration failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Progress indicator ───────────────────────────────────────────────────
  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: "email", label: "Email", icon: <Mail className="w-4 h-4" /> },
    { key: "otp", label: "Verify", icon: <ShieldCheck className="w-4 h-4" /> },
    { key: "details", label: "Details", icon: <UserPlus className="w-4 h-4" /> },
  ];
  const stepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto px-4">
          <div className="bg-card border border-border rounded-xl p-6 sm:p-8">
            {/* Header */}
            <h1 className="text-2xl font-heading font-bold text-center mb-2">Create Account</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              {step === "email" && "Enter your email to get started"}
              {step === "otp" && "Enter the 6-digit code we sent you"}
              {step === "details" && "Almost there — fill in your details"}
            </p>

            {/* Step progress */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {steps.map((s, i) => (
                <div key={s.key} className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      i < stepIndex
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : i === stepIndex
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s.icon}
                    {s.label}
                  </div>
                  {i < steps.length - 1 && (
                    <ArrowRight className={`w-3 h-3 ${i < stepIndex ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                  )}
                </div>
              ))}
            </div>

            {/* ── Step 1: Email ── */}
            {step === "email" && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                      Sending code… (may take a moment)
                    </span>
                  ) : "Send Verification Code"}
                </Button>
              </form>
            )}

            {/* ── Step 2: OTP ── */}
            {step === "otp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <Label htmlFor="otp">Verification code</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    required
                    autoFocus
                    className="text-center text-xl tracking-[0.5em] font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Sent to <span className="font-medium text-foreground">{email}</span>
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                  {loading ? "Verifying…" : "Verify Email"}
                </Button>
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => { setStep("email"); setOtp(""); }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Change email
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    className="flex items-center gap-1 text-primary hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                  </button>
                </div>
              </form>
            )}

            {/* ── Step 3: Details ── */}
            {step === "details" && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name / Company Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    placeholder="Min. 8 characters"
                    required
                  />
                </div>
                <div>
                  <Label>I am a</Label>
                  <div className="flex gap-4 mt-2">
                    <Button
                      type="button"
                      variant={role === "developer" ? "default" : "outline"}
                      onClick={() => setRole("developer")}
                      className="flex-1"
                    >
                      Developer
                    </Button>
                    <Button
                      type="button"
                      variant={role === "employer" ? "default" : "outline"}
                      onClick={() => setRole("employer")}
                      className="flex-1"
                    >
                      Employer
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account…" : "Create Account"}
                </Button>
              </form>
            )}

            <p className="text-sm text-muted-foreground text-center mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Register;

