import { useEffect, useState } from "react";
import DashboardHeader from "../../components/DashboardHeader";
import StatsCard from "../../components/StatsCard";
import Loader from "../../components/Loader";
import { coordinatorAPI } from "../lib/api";

export default function CoordinatorDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));

  const title =
    user?.role === "super_coordinator"
      ? "Super Coordinator Dashboard"
      : "Coordinator Dashboard";

  const subtitle =
    user?.role === "super_coordinator"
      ? "Monitor the institute mentorship program"
      : "Monitor the department mentorship program";

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await coordinatorAPI.dashboard();
      setDashboard(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <>
      <DashboardHeader
        title={title}
        subtitle={subtitle}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">

        <StatsCard
          title="Mentors"
          value={dashboard.cards.totalMentors}
        />

        <StatsCard
          title="Pending Verifications"
          value={dashboard.cards.pendingVerifications}
          color="bg-yellow-500"
        />

        <StatsCard
          title="Pending Reviews"
          value={dashboard.cards.pendingReviews}
          color="bg-red-500"
        />

        <StatsCard
          title="Feedback Submitted"
          value={dashboard.cards.mentorFeedbackSubmitted}
          color="bg-green-600"
        />

      </div>
            {/* Mentor List */}

      <div className="dash-box mb-8">

        <h2 className="text-2xl font-semibold mb-5">
          Mentor List
        </h2>

        <div className="overflow-x-auto">

          <table className="min-w-full border">

            <thead className="bg-slate-100">

              <tr>

                <th className="p-3 text-left">Roll No</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Department</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-center">Assigned Mentees</th>
                <th className="p-3 text-center">Interactions</th>

              </tr>

            </thead>

            <tbody>

              {dashboard.mentorList.length === 0 ? (

                <tr>

                  <td
                    colSpan="6"
                    className="text-center p-6 text-gray-500"
                  >
                    No mentors found.
                  </td>

                </tr>

              ) : (

                dashboard.mentorList.map((mentor) => (

                  <tr
                    key={mentor._id}
                    className="border-t hover:bg-gray-50"
                  >

                    <td className="p-3">
                      {mentor.rollNo}
                    </td>

                    <td className="p-3 font-medium">
                      {mentor.name}
                    </td>

                    <td className="p-3">
                      {mentor.department}
                    </td>

                    <td className="p-3">
                      {mentor.email}
                    </td>

                    <td className="p-3 text-center">

                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">

                        {mentor.assignedMentees}

                      </span>

                    </td>

                    <td className="p-3 text-center">

                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">

                        {mentor.interactions}

                      </span>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>
            {/* Pending Verifications */}

      <div className="dash-box mb-8">
        <h2 className="text-2xl font-semibold mb-5">
          Pending Verifications
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Mentor</th>
                <th className="p-3 text-left">Mentee</th>
                <th className="p-3 text-left">Interaction Type</th>
              </tr>
            </thead>

            <tbody>
              {dashboard.pendingVerificationList.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center p-6 text-gray-500"
                  >
                    No pending verifications.
                  </td>
                </tr>
              ) : (
                dashboard.pendingVerificationList.map((item) => (
                  <tr key={`${item.sessionId}-${item.mentee._id}`} className="border-t">
                    <td className="p-3">
                      {new Date(item.interactionDate).toLocaleDateString()}
                    </td>

                    <td className="p-3">
                      {item.mentor?.name}
                    </td>

                    <td className="p-3">
                      {item.mentee?.name}
                    </td>

                    <td className="p-3">
                      {item.interactionType}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Reviews */}

      <div className="dash-box mb-8">
        <h2 className="text-2xl font-semibold mb-5">
          Pending Reviews
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Mentor</th>
                <th className="p-3 text-left">Interaction Type</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {dashboard.pendingReviewList.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center p-6 text-gray-500"
                  >
                    No pending reviews.
                  </td>
                </tr>
              ) : (
                dashboard.pendingReviewList.map((item) => (
                  <tr key={item.sessionId} className="border-t">
                    <td className="p-3">
                      {new Date(item.interactionDate).toLocaleDateString()}
                    </td>

                    <td className="p-3">
                      {item.mentor?.name}
                    </td>

                    <td className="p-3">
                      {item.interactionType}
                    </td>

                    <td className="p-3">
                      <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
                        {item.reason}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mentor Feedback */}

      <div className="dash-box mb-8">
        <h2 className="text-2xl font-semibold mb-5">
          Mentor Feedback
        </h2>

        <div className="space-y-4">

          {dashboard.mentorFeedbacks.length === 0 ? (

            <p className="text-gray-500">
              No mentor feedback submitted yet.
            </p>

          ) : (

            dashboard.mentorFeedbacks.map((feedback) => (

              <div
                key={feedback._id}
                className="border rounded-lg p-5"
              >

                <div className="flex flex-wrap justify-between items-start gap-2">

                  <div className="min-w-0">
                    <h3 className="font-semibold text-lg">
                      {feedback.mentor?.name}
                    </h3>

                    <p className="text-gray-500 text-sm">
                      {feedback.mentor?.department}
                    </p>
                  </div>

                  <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full shrink-0">
                    ⭐ {feedback.rating}/5
                  </span>

                </div>

                <div className="mt-4">
                  <p>
                    <strong>Interaction:</strong>{" "}
                    {feedback.session?.interactionType}
                  </p>

                  <p className="mt-2">
                    <strong>Summary:</strong>{" "}
                    {feedback.session?.meetingSummary}
                  </p>

                  <p className="mt-3 text-gray-700">
                    {feedback.feedback}
                  </p>
                </div>

              </div>

            ))

          )}

        </div>
      </div>

    </>
  );
}