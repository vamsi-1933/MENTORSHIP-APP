import {
  LayoutDashboard,
  Users,
  Upload,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

export default function Sidebar() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role;
  const location = useLocation();

  const adminChildren = [
    {
      name: "Overview",
      path: "/admin-dashboard",
      end: true,
      icon: <LayoutDashboard size={16} strokeWidth={1.75} />,
    },
    {
      name: "Upload users",
      path: "/admin-dashboard#upload",
      icon: <Upload size={16} strokeWidth={1.75} />,
    },
  ];

  const simpleLinks = {
    coordinator: [
      {
        name: "Dashboard",
        path: "/coordinator-dashboard",
        end: true,
        icon: <LayoutDashboard size={18} strokeWidth={1.75} />,
      },
    ],
    super_coordinator: [
      {
        name: "Dashboard",
        path: "/coordinator-dashboard",
        end: true,
        icon: <LayoutDashboard size={18} strokeWidth={1.75} />,
      },
    ],
    mentor: [
      {
        name: "Dashboard",
        path: "/mentor-dashboard",
        end: true,
        icon: <LayoutDashboard size={18} strokeWidth={1.75} />,
      },
    ],
    mentee: [
      {
        name: "Dashboard",
        path: "/mentee-dashboard",
        end: true,
        icon: <LayoutDashboard size={18} strokeWidth={1.75} />,
      },
    ],
  };

  const isAdminHome =
    role === "admin" && location.pathname.startsWith("/admin-dashboard");

  return (
    <aside className="dash-sidebar">
      <div className="dash-sidebar__brand">
        <img src="/saathi-logo.png" alt="" className="dash-sidebar__logo" />
        <div>
          <p className="dash-sidebar__title">SAATHI</p>
          <p className="dash-sidebar__tag">Mentorship</p>
        </div>
      </div>

      <p className="dash-sidebar__label">Menu</p>

      <nav className="dash-sidebar__nav">
        {role === "admin" ? (
          <>
            <NavLink
              to="/admin-dashboard"
              end
              className={() =>
                `dash-sidebar__link${isAdminHome ? " is-active" : ""}`
              }
            >
              <Users size={18} strokeWidth={1.75} />
              <span>Workspace</span>
            </NavLink>

            <div className="dash-sidebar__tree">
              {adminChildren.map((item) => {
                const hashActive =
                  item.path.includes("#") && location.hash === "#upload";
                const overviewActive =
                  item.end &&
                  location.pathname === "/admin-dashboard" &&
                  location.hash !== "#upload";
                const active = hashActive || overviewActive;

                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    end={item.end}
                    className={() =>
                      `dash-sidebar__sublink${active ? " is-active" : ""}`
                    }
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </>
        ) : (
          simpleLinks[role]?.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `dash-sidebar__link${isActive ? " is-active" : ""}`
              }
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))
        )}
      </nav>
    </aside>
  );
}
