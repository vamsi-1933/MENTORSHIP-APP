import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../src/lib/api";

const WORKSPACE = {
  admin: "Admin workspace",
  super_coordinator: "Coordinator workspace",
  coordinator: "Coordinator workspace",
  mentor: "Mentor workspace",
  mentee: "Mentee workspace",
};

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(readStoredUser);

  useEffect(() => {
    let cancelled = false;

    const syncUser = async () => {
      try {
        const res = await authAPI.me();
        const fresh = res.data?.user;
        if (!fresh || cancelled) return;

        localStorage.setItem("user", JSON.stringify(fresh));
        setUser(fresh);
      } catch {
        // keep cached user if /me fails
      }
    };

    syncUser();
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const roleLabel = user?.role ? user.role.replaceAll("_", " ") : "";

  return (
    <header className="dash-navbar">
      <div>
        <p className="dash-navbar__eyebrow">IIT Madras</p>
        <h1 className="dash-navbar__title">
          {WORKSPACE[user?.role] || "SAATHI workspace"}
        </h1>
      </div>

      <div className="dash-navbar__right">
        <div className="dash-navbar__user">
          <p className="dash-navbar__name">{user?.name}</p>
          <p className="dash-navbar__role">{roleLabel}</p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="dash-navbar__logout"
          title="Sign out"
        >
          <LogOut size={18} />
          <span>Sign out</span>
        </button>
      </div>
    </header>
  );
}
