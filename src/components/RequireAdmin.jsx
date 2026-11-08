import { Navigate, Outlet, useLocation } from "react-router";

import { useAuth } from "@hooks/useAuth";

export default function RequireAdmin() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "loading") return <div className="screen-loader">Loading Avengers Admin…</div>;
  if (status === "anonymous") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (user?.role !== "admin") return <Navigate to="/login" replace />;
  return <Outlet />;
}
