import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import DeveloperGuard from "@/components/DeveloperGuard";

const Index = lazy(() => import("./pages/Index"));
const Jobs = lazy(() => import("./pages/Jobs"));
const Developers = lazy(() => import("./pages/Developers"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CreateJob = lazy(() => import("./pages/CreateJob"));
const JobDetail = lazy(() => import("./pages/JobDetail"));
const JobApplicants = lazy(() => import("./pages/JobApplicants"));
const DeveloperProfile = lazy(() => import("./pages/DeveloperProfile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const EditCompany = lazy(() => import("./pages/EditCompany"));
const ContractDetail = lazy(() => import("./pages/ContractDetail"));
const CreateContract = lazy(() => import("./pages/CreateContract"));
const Messages = lazy(() => import("./pages/Messages"));
const Showcase = lazy(() => import("./pages/Showcase"));
const ShowcaseDetail = lazy(() => import("./pages/ShowcaseDetail"));
const EditJob = lazy(() => import("./pages/EditJob"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 min — reuse cached data before refetching
      gcTime: 10 * 60 * 1000,     // 10 min — keep in memory for instant back-nav
      retry: 1,
      refetchOnWindowFocus: false, // don't re-fetch every time user switches tabs
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public — no gate */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Profile edit is the gate destination — never block it */}
                <Route path="/profile/edit" element={<EditProfile />} />
                <Route path="/company/edit" element={<EditCompany />} />

                {/* All other routes — developers must complete profile first */}
                <Route path="/jobs" element={<DeveloperGuard><Jobs /></DeveloperGuard>} />
                <Route path="/jobs/create" element={<DeveloperGuard><CreateJob /></DeveloperGuard>} />
                <Route path="/jobs/:id" element={<DeveloperGuard><JobDetail /></DeveloperGuard>} />
                <Route path="/jobs/:id/applicants" element={<DeveloperGuard><JobApplicants /></DeveloperGuard>} />
                <Route path="/jobs/:id/edit" element={<DeveloperGuard><EditJob /></DeveloperGuard>} />
                <Route path="/developers" element={<DeveloperGuard><Developers /></DeveloperGuard>} />
                <Route path="/developers/:id" element={<DeveloperGuard><DeveloperProfile /></DeveloperGuard>} />
                <Route path="/dashboard" element={<DeveloperGuard><Dashboard /></DeveloperGuard>} />
                <Route path="/contracts/create" element={<DeveloperGuard><CreateContract /></DeveloperGuard>} />
                <Route path="/contracts/:id" element={<DeveloperGuard><ContractDetail /></DeveloperGuard>} />
                <Route path="/messages" element={<DeveloperGuard><Messages /></DeveloperGuard>} />
                <Route path="/showcase" element={<DeveloperGuard><Showcase /></DeveloperGuard>} />
                <Route path="/showcase/:id" element={<DeveloperGuard><ShowcaseDetail /></DeveloperGuard>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
