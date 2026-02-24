import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

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

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60000, retry: 1 } },
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
          <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/create" element={<CreateJob />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/jobs/:id/applicants" element={<JobApplicants />} />
            <Route path="/developers" element={<Developers />} />
            <Route path="/developers/:id" element={<DeveloperProfile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/company/edit" element={<EditCompany />} />
            <Route path="/contracts/create" element={<CreateContract />} />
            <Route path="/contracts/:id" element={<ContractDetail />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/showcase" element={<Showcase />} />
            <Route path="/showcase/:id" element={<ShowcaseDetail />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
