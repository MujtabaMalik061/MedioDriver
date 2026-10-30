import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";
import { useEffect } from "react";

export const AdminRoute = ({ children }) => {
  const { authAllow, currentUser, loading } = useAuth();
  if (loading)
    return (
      <Loader loading={true} size="50" style={{ height: "85vh", width: "100%" }} />
    );
  if (!authAllow) return <Navigate to="/signin" replace />;
  if (currentUser?.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
};

export const ProtectedRoute = ({ children, role = [] }) => {
  const { authAllow, currentUser, loading } = useAuth();
  if (loading)
    return (
      <Loader
        loading={true}
        size="50"
        style={{ height: "85vh", width: "100%" }}
      />
    );

  if (!authAllow) return <Navigate to="/signIn" replace />;

  if (role.length && !role.includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const PublicRoute = ({ children }) => {
  const { authAllow, currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authAllow) navigate("/dashboard");
  }, [authAllow, currentUser, navigate]);

  if (loading) {
    return (
      <Loader
        loading={true}
        size="50"
        style={{ height: "85vh", width: "100%" }}
      />
    );
  }

  if (authAllow) return null;

  return children;
};
