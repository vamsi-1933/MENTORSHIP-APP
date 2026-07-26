import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

export default function DashboardLayout() {
  return (
    <div className="dash-stage">
      <div className="dash-shell">
        <Sidebar />
        <div className="dash-shell__main">
          <Navbar />
          <main className="dash-shell__content">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
