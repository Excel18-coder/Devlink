import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, UserCircle2, ArrowRight } from "lucide-react";
import { REQUIRED_FIELD_LABELS } from "@/lib/profileUtils";

interface Props {
  missing: string[];  // keys from REQUIRED_FIELD_LABELS
  next?: string;      // redirect back here after completing profile
}

const ALL_FIELDS = Object.keys(REQUIRED_FIELD_LABELS);
const STEPS = ["Set Up Profile", "Browse Jobs", "Apply", "Get Hired"];

export default function ProfileGate({ missing, next }: Props) {
  const completed = ALL_FIELDS.filter((f) => !missing.includes(f));
  const pct = Math.round((completed.length / ALL_FIELDS.length) * 100);

  const editUrl = next
    ? `/profile/edit?next=${encodeURIComponent(next)}`
    : "/profile/edit";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 pt-20 pb-12">
        <div className="w-full max-w-lg">

          {/* Icon + heading */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 mb-5">
              <UserCircle2 className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-2">
              Complete your profile first
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-sm mx-auto">
              Employers search for developers by profile details. You won't appear in search results or be able to apply for jobs until your profile is complete.
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Profile completion</span>
              <span className="font-semibold text-foreground">{pct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-card border border-border rounded-xl divide-y divide-border mb-6 overflow-hidden">
            {ALL_FIELDS.map((key) => {
              const done = !missing.includes(key);
              return (
                <div key={key} className="flex items-center gap-3 px-4 py-3">
                  {done
                    ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    : <XCircle className="h-5 w-5 text-destructive shrink-0" />
                  }
                  <span className={`text-sm flex-1 ${done ? "text-muted-foreground line-through" : "text-foreground font-medium"}`}>
                    {REQUIRED_FIELD_LABELS[key]}
                  </span>
                  {done && <span className="text-xs text-green-600 font-medium">Done</span>}
                  {!done && <span className="text-xs text-destructive font-medium">Required</span>}
                </div>
              );
            })}
          </div>

          {/* Journey steps */}
          <div className="flex items-center justify-center gap-1.5 mb-8 flex-wrap">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-1.5">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                  ${i === 0
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-muted text-muted-foreground border-transparent"}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold
                    ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                    {i + 1}
                  </span>
                  {step}
                </div>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* CTA */}
          <Link to={editUrl} className="block">
            <Button size="lg" className="w-full text-base font-semibold">
              Complete My Profile <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <p className="text-center text-xs text-muted-foreground mt-3">
            Takes about 2 minutes · Increases job matches by 3×
          </p>
        </div>
      </div>
    </div>
  );
}
