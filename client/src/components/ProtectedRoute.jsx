import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { getCurrentUser } from "../services/api";

function ProtectedRoute() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    getCurrentUser().then(
      () => setStatus("authenticated"),
      () => setStatus("unauthenticated")
    );
  }, []);

  if (status === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf7f2]">
        Loading your workspace...
      </main>
    );
  }

  return status === "authenticated" ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
