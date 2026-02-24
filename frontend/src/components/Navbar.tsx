import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Code2, Menu, X, MessageSquare, User, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-secondary/95 backdrop-blur-md border-b border-border/10">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <Code2 className="h-7 w-7 text-primary" />
          <span className="font-heading text-xl font-bold text-secondary-foreground">
            Dev<span className="text-primary">link</span>
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/developers" className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors font-medium">
            Find Developers
          </Link>
          <Link to="/jobs" className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors font-medium">
            Browse Jobs
          </Link>
          <Link to="/showcase" className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors font-medium">
            Showcase
          </Link>
          {user && (
            <Link to="/messages" className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors font-medium">
              Messages
            </Link>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button variant="default" size="sm" className="gap-1.5">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Log Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-secondary-foreground/70 hover:text-secondary-foreground hover:bg-secondary-foreground/5">
                  Log In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="hero" size="sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-secondary-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-secondary border-t border-border/10 px-4 pb-4">
          <nav className="flex flex-col divide-y divide-border/10">
            <Link
              to="/developers"
              onClick={() => setMobileOpen(false)}
              className="text-sm text-secondary-foreground/70 hover:text-primary py-3.5 transition-colors"
            >
              Find Developers
            </Link>
            <Link
              to="/jobs"
              onClick={() => setMobileOpen(false)}
              className="text-sm text-secondary-foreground/70 hover:text-primary py-3.5 transition-colors"
            >
              Browse Jobs
            </Link>
            <Link
              to="/showcase"
              onClick={() => setMobileOpen(false)}
              className="text-sm text-secondary-foreground/70 hover:text-primary py-3.5 transition-colors"
            >
              Showcase
            </Link>
            {user && (
              <Link
                to="/messages"
                onClick={() => setMobileOpen(false)}
                className="text-sm text-secondary-foreground/70 hover:text-primary py-3.5 transition-colors"
              >
                Messages
              </Link>
            )}
          </nav>
          <div className="pt-3 flex flex-col gap-2">
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full h-11 gap-2 justify-center">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-11"
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                >
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" size="sm" className="text-secondary-foreground/70 justify-start w-full h-11">
                    Log In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)}>
                  <Button variant="hero" size="sm" className="w-full h-11">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
