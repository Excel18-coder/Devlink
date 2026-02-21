import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import DeveloperDashboard from "./DeveloperDashboard";
import EmployerDashboard from "./EmployerDashboard";
import AdminDashboard from "./AdminDashboard";

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "developer") {
    return <DeveloperDashboard />;
  }

  if (user.role === "employer") {
    return <EmployerDashboard />;
  }

  if (user.role === "admin") {
    return <AdminDashboard />;
  }

  return <Navigate to="/" replace />;
};

export default Dashboard;
