import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { getMissingProfileFields, DeveloperProfileFields } from "@/lib/profileUtils";
import ProfileGate from "@/components/ProfileGate";
import { useLocation } from "react-router-dom";

/**
 * Route-level guard for developer-only pages.
 *
 * – If the current user is NOT a developer (employer, admin, or logged-out),
 *   children render normally — the page itself handles auth/role redirects.
 * – If the user IS a developer and their profile is incomplete,
 *   the entire page is replaced with <ProfileGate> until they complete it.
 * – While the profile check is in-flight a full-page spinner is shown so
 *   there is no flash of the underlying page.
 * – Profile is re-checked whenever the user navigates back (location change).
 */
export default function DeveloperGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  const [checking, setChecking] = useState(false);
  const [missing, setMissing] = useState<string[] | null>(null);

  useEffect(() => {
    // Only run the check for authenticated developers
    if (authLoading || !user || user.role !== "developer") {
      setMissing([]); // no gate needed
      return;
    }

    let cancelled = false;
    setChecking(true);

    api<DeveloperProfileFields>(`/developers/${user.id}`)
      .then((profile) => {
        if (!cancelled) setMissing(getMissingProfileFields(profile));
      })
      .catch(() => {
        if (!cancelled) setMissing([]); // on error, don't block
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => { cancelled = true; };
  }, [user, authLoading, location.pathname]); // re-check on every navigation

  // Auth still loading or profile fetch in-flight → spinner
  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Developer with incomplete profile → hard block
  if (user?.role === "developer" && missing && missing.length > 0) {
    return <ProfileGate missing={missing} next={location.pathname} />;
  }

  return <>{children}</>;
}
