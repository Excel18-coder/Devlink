import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/useSEO";
import { ping } from "@/lib/api";

const Login = () => {
  useSEO({
    title: "Sign In to Devlink",
    description: "Sign in to your Devlink account to access your dashboard, manage contracts, and connect with top clients or developers.",
    canonical: "https://devlink.co.ke/login",
    noIndex: true,
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [warmingUp, setWarmingUp] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Ping the server as soon as the login page mounts so a cold-started
  // backend wakes up while the user is filling in their credentials.
  useEffect(() => {
    ping();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setWarmingUp(false);

    const attempt = async (isRetry = false): Promise<void> => {
      try {
        await login(email, password);
        toast({ title: "Welcome back!" });
        navigate("/dashboard");
      } catch (err) {
        const msg = (err as Error).message;
        if (msg === "__TIMEOUT__" && !isRetry) {
          // Server was probably cold — show a warming-up message and retry
          // automatically with a longer 60 s window.
          setWarmingUp(true);
          try {
            await login(email, password, 60_000);
            toast({ title: "Welcome back!" });
            navigate("/dashboard");
          } catch (retryErr) {
            const retryMsg = (retryErr as Error).message;
            toast({
              title: "Login failed",
              description:
                retryMsg === "__TIMEOUT__"
                  ? "The server is still waking up. Please wait a moment and try again."
                  : retryMsg,
              variant: "destructive",
            });
          } finally {
            setWarmingUp(false);
          }
        } else {
          toast({
            title: "Login failed",
            description:
              msg === "__TIMEOUT__"
                ? "The server is taking too long to respond. Please try again."
                : msg,
            variant: "destructive",
          });
        }
      }
    };

    try {
      await attempt();
    } finally {
      setLoading(false);
      setWarmingUp(false);
    }
  };

  const buttonLabel = warmingUp
    ? "Server waking up, retrying…"
    : loading
    ? "Signing in…"
    : "Sign In";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto px-4">
          <div className="bg-card border border-border rounded-xl p-6 sm:p-8">
            <h1 className="text-2xl font-heading font-bold text-center mb-6">Welcome Back</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || warmingUp}>
                {buttonLabel}
              </Button>
            </form>
            <p className="text-sm text-muted-foreground text-center mt-4">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
