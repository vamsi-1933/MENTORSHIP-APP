import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useSearchParams,
  useNavigate,
} from "react-router-dom";

/* Layout */
import DashboardLayout from "./layouts/DashboardLayout";

/* Pages */
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import CoordinatorDashboard from "./pages/CoordinatorDashboard";
import MentorDashboard from "./pages/MentorDashboard";
import MenteeDashboard from "./pages/MenteeDashboard";
import { authAPI } from "./lib/api";

function roleHome(role) {
  switch (role) {
    case "admin":
      return "/admin-dashboard";
    case "coordinator":
    case "super_coordinator":
      return "/coordinator-dashboard";
    case "mentor":
      return "/mentor-dashboard";
    case "mentee":
      return "/mentee-dashboard";
    default:
      return "/";
  }
}

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

/* ==========================================================
   Google OAuth Handler
   Backend still redirects with ?token=&user= — we cannot stop that
   without backend changes. Frontend mitigates by:
   1) reading the token once
   2) immediately replacing the history entry (strip query from URL)
   3) loading the user from /auth/me (ignore user blob in URL)
========================================================== */

const GoogleAuthHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Signing you in...");

  useEffect(() => {
    let cancelled = false;

    const finishLogin = async (token, userFromUrl) => {
      localStorage.setItem("token", token);

      try {
        const res = await authAPI.me();
        if (cancelled) return;

        const user = res.data?.user;
        if (!user?.role) throw new Error("Invalid user");

        localStorage.setItem("user", JSON.stringify(user));
        navigate(roleHome(user.role), { replace: true });
        return;
      } catch {
        // Fallback if /me fails (e.g. brief network glitch) but redirect had user
        if (userFromUrl?.role) {
          localStorage.setItem("user", JSON.stringify(userFromUrl));
          navigate(roleHome(userFromUrl.role), { replace: true });
          return;
        }

        if (cancelled) return;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/?error=session", { replace: true });
      }
    };

    const tokenFromUrl = searchParams.get("token");
    const userParam = searchParams.get("user");

    let userFromUrl = null;
    if (userParam) {
      try {
        userFromUrl = JSON.parse(userParam);
      } catch {
        userFromUrl = null;
      }
    }

    if (tokenFromUrl) {
      // Strip secrets from the address bar without remounting this effect
      window.history.replaceState({}, "", "/dashboard");
      finishLogin(tokenFromUrl, userFromUrl);
      return () => {
        cancelled = true;
      };
    }

    const cachedToken = localStorage.getItem("token");
    if (cachedToken) {
      finishLogin(cachedToken, readStoredUser());
      return () => {
        cancelled = true;
      };
    }

    setStatus("Sign-in incomplete. Redirecting...");
    navigate("/?error=auth", { replace: true });
    return () => {
      cancelled = true;
    };
    // Intentionally once on mount — avoid canceling /auth/me when URL is cleaned
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen">
      {status}
    </div>
  );
};

/* ==========================================================
   Protected Route
========================================================== */

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const user = readStoredUser();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};



export default function App() {

  return (

    <Router>

      <Routes>

        <Route path="/" element={<Login />} />

        <Route
          path="/dashboard"
          element={<GoogleAuthHandler />}
        />

        <Route element={<DashboardLayout />}>

          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
              >
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/coordinator-dashboard"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "coordinator",
                  "super_coordinator",
                ]}
              >
                <CoordinatorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mentor-dashboard"
            element={
              <ProtectedRoute
                allowedRoles={["mentor"]}
              >
                <MentorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mentee-dashboard"
            element={
              <ProtectedRoute
                allowedRoles={["mentee"]}
              >
                <MenteeDashboard />
              </ProtectedRoute>
            }
          />

        </Route>

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>

    </Router>

  );

}