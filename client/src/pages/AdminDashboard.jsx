import { useEffect, useRef, useState } from "react";
import { FileUp, CheckCircle2, AlertCircle } from "lucide-react";
import DashboardHeader from "../../components/DashboardHeader";
import StatsCard from "../../components/StatsCard";
import Loader from "../../components/Loader";
import { adminAPI } from "../lib/api";

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await adminAPI.dashboard();
      setDashboard(res.data.data);
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: "Could not load dashboard stats.",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadCSV = async () => {
    if (!csvFile) {
      setMessage({ type: "error", text: "Please select a CSV file." });
      return;
    }

    try {
      setUploading(true);
      setMessage(null);

      const formData = new FormData();
      formData.append("file", csvFile);

      const res = await adminAPI.uploadUsers(formData);
      const data = res.data;

      setMessage({
        type: "success",
        text: `Imported ${data.imported ?? 0} users${
          data.skipped ? ` · skipped ${data.skipped}` : ""
        }.`,
      });

      setCsvFile(null);
      if (fileRef.current) fileRef.current.value = "";
      loadDashboard();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Unable to upload CSV.",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="admin-page">
      <DashboardHeader
        title="Overview"
        subtitle="Monitor roles, activity, and onboard users into SAATHI."
      />

      <section className="admin-section">
        <h2 className="admin-section__title">People by role</h2>
        <div className="admin-grid admin-grid--roles">
          <StatsCard title="Total users" value={dashboard?.totalUsers} tone="ink" />
          <StatsCard title="Mentors" value={dashboard?.mentors} tone="sky" />
          <StatsCard title="Mentees" value={dashboard?.mentees} tone="aqua" />
          <StatsCard title="Coordinators" value={dashboard?.coordinators} tone="sand" />
          <StatsCard title="Super coordinators" value={dashboard?.superCoordinators} tone="yellow" />
          <StatsCard title="Admins" value={dashboard?.admins} tone="deep" />
        </div>
      </section>

      <section className="admin-section">
        <h2 className="admin-section__title">Platform activity</h2>
        <div className="admin-grid admin-grid--activity">
          <StatsCard title="Active mentorships" value={dashboard?.totalMentorships} tone="sky" />
          <StatsCard title="Interactions" value={dashboard?.totalInteractions} tone="aqua" />
          <StatsCard title="Feedback submitted" value={dashboard?.totalFeedbackSubmitted} tone="yellow" />
        </div>
      </section>

      <section id="upload" className="admin-panel">
        <div className="admin-panel__head">
          <div>
            <h2 className="admin-panel__title">Upload users</h2>
            <p className="admin-panel__desc">
              Import a CSV with Roll No, Name, EmailId, Role, Mobile, Gender, Program, and Department.
            </p>
          </div>
          <div className="admin-panel__badge">
            <FileUp size={18} />
            CSV
          </div>
        </div>

        <div className="admin-upload">
          <label className="admin-upload__drop">
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={(e) => {
                setCsvFile(e.target.files?.[0] || null);
                setMessage(null);
              }}
            />
            <span className="admin-upload__drop-title">
              {csvFile ? csvFile.name : "Choose a CSV file"}
            </span>
            <span className="admin-upload__drop-hint">
              {csvFile
                ? `${Math.max(1, Math.round(csvFile.size / 1024))} KB selected`
                : "Accepted format: .csv"}
            </span>
          </label>

          <button
            type="button"
            onClick={uploadCSV}
            disabled={uploading || !csvFile}
            className="admin-upload__btn"
          >
            {uploading ? "Uploading…" : "Upload CSV"}
          </button>
        </div>

        {message && (
          <div className={`admin-alert admin-alert--${message.type}`}>
            {message.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <p>{message.text}</p>
          </div>
        )}
      </section>
    </div>
  );
}
