import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { getMissingProfileFields, DeveloperProfileFields } from "@/lib/profileUtils";
import ProfileGate from "@/components/ProfileGate";
import { useLocation } from "react-router-dom";

// Cache profile completeness for 5 minutes so navigating between pages
// doesn't fire a new API call every single time.
const CACHE_TTL = 5 * 60 * 1000;
function readCache(userId: string): string[] | null {
  try {
    const raw = sessionStorage.getItem(`devlink_pmiss_${userId}`);
    if (!raw) return null;
    const { missing, at } = JSON.parse(raw) as { missing: string[]; at: number };
    return Date.now() - at < CACHE_TTL ? missing : null;
  } catch { return null; }
}
function writeCache(userId: string, missing: string[]) {
  try {
    sessionStorage.setItem(`devlink_pmiss_${userId}`, JSON.stringify({ missing, at: Date.now() }));
  } catch { /* ignore */ }
}
export function invalidateProfileCache(userId: string) {
  sessionStorage.removeItem(`devlink_pmiss_${userId}`);
}

/**
 * Route-level guard for developer-only pages.
 *
 * Children are rendered IMMEDIATELY so their data fetches start right away.
 * Only once we confirm the developer profile is incomplete do we overlay the
 * full-page ProfileGate. This eliminates blank screens on first load.
 *
 * Profile completeness is cached in sessionStorage (5 min TTL) so navigating
 * between pages doesn't fire a redundant API call every time.
 */
export default function DeveloperGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  // null = unknown (check in-flight), [] = complete, [...] = missing fields
  const [missing, setMissing] = useState<string[] | null>(() => {
    // Seed from cache synchronously — zero flicker on navigation
    if (!user || user.role !== "developer") return [];
    return readCache(user.id) ?? null;
  });

  useEffect(() => {
    // Not a developer → never block
    if (authLoading || !user || user.role !== "developer") {
      setMissing([]);
      return;
    }

    // Cache hit → use it, skip network call
    const cached = readCache(user.id);
    if (cached !== null) {
      setMissing(cached);
      return;
    }

    // Cache miss → fetch once
    let cancelled = false;
    api<DeveloperProfileFields>(`/developers/${user.id}`)
      .then((profile) => {
        if (cancelled) return;
        const m = getMissingProfileFields(profile);
        writeCache(user.id, m);
        setMissing(m);
      })
      .catch(() => {
        if (!cancelled) setMissing([]); // on error don't block
      });

    return () => { cancelled = true; };
  // Re-run when user or route changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading, location.pathname]);

  // Confirmed incomplete profile → hard block with checklist
  if (user?.role === "developer" && missing !== null && missing.length > 0) {
    return <ProfileGate missing={missing} next={location.pathname} />;
  }

  // Render children immediately — data fetches inside pages start right away.
  // If mid-check (missing === null) children render optimistically; the gate
  // overlays once the check resolves (usually < 300 ms on warm connection).
  return <>{children}</>;
}

