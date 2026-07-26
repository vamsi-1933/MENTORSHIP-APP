import { useEffect, useState } from "react";

import DashboardHeader from "../../components/DashboardHeader";
import StatsCard from "../../components/StatsCard";
import Loader from "../../components/Loader";

import { mentorAPI } from "../lib/api";

export default function MentorDashboard() {

  const [dashboard, setDashboard] = useState(null);

  const [loading, setLoading] = useState(true);

  const [showAddMentee, setShowAddMentee] =
    useState(false);

  const [rollNo, setRollNo] =
    useState("");

  const [showInteraction, setShowInteraction] =
    useState(false);

  const [interactionData, setInteractionData] =
    useState({

      interactionDate: "",

      interactionType: "In Person",

      meetingSummary: "",

      menteeIds: [],

    });

  useEffect(() => {

    loadDashboard();

  }, []);

  const loadDashboard = async () => {

    try {

      const res =
        await mentorAPI.dashboard();

      setDashboard(res.data.data);

    }

    catch (err) {

      console.log(err);

    }

    finally {

      setLoading(false);

    }

  };

  if (loading) {

    return <Loader />;

  }

  return (

        <>

      <DashboardHeader

        title="Mentor Dashboard"

        subtitle="Manage your mentees and interactions"

      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">

        <StatsCard

          title="Assigned Mentees"

          value={
            dashboard.assignedMentees.length
          }

        />

        <StatsCard

          title="Interactions"

          value={
            dashboard.interactionHistory.length
          }

          color="bg-green-600"

        />

        <StatsCard

          title="Pending Verification"

          value={

            dashboard.interactionHistory.filter(

              session =>
                session.pending.length > 0

            ).length

          }

          color="bg-orange-500"

        />

      </div>
      {/* ==========================================================
                Assigned Mentees
            ========================================================== */}

      <div className="dash-box mb-8">

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">

          <h2 className="text-xl sm:text-2xl font-semibold">

            Assigned Mentees

          </h2>

          <button

            onClick={() =>
              setShowAddMentee(true)
            }

            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg w-full sm:w-auto"

          >

            + Add Mentee

          </button>

        </div>

        <div className="overflow-x-auto">

          <table className="min-w-full border">

            <thead className="bg-slate-100">

              <tr>

                <th className="p-3 text-left">
                  Roll No
                </th>

                <th className="p-3 text-left">
                  Name
                </th>

                <th className="p-3 text-left">
                  Email
                </th>

                <th className="p-3 text-left">
                  Mobile
                </th>

                <th className="p-3 text-left">
                  Department
                </th>

              </tr>

            </thead>

            <tbody>

              {dashboard.assignedMentees.map(
                (mentee) => (

                  <tr
                    key={mentee._id}
                    className="border-t"
                  >

                    <td className="p-3">

                      {mentee.rollNo}

                    </td>

                    <td className="p-3">

                      {mentee.name}

                    </td>

                    <td className="p-3">

                      {mentee.email}

                    </td>

                    <td className="p-3">

                      {mentee.mobile ||
                        "-"}

                    </td>

                    <td className="p-3">

                      {mentee.department}

                    </td>

                  </tr>

                )

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* ==========================================================
                Add Mentee Modal
            ========================================================== */}

      {showAddMentee && (

        <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-4 z-50">

          <div className="bg-white rounded-xl w-full max-w-[420px] p-5 sm:p-6">

            <h2 className="text-xl font-semibold mb-5">

              Add Mentee

            </h2>

            <input

              type="text"

              placeholder="Enter Roll Number"

              value={rollNo}

              onChange={(e) =>
                setRollNo(
                  e.target.value
                )
              }

              className="border rounded-lg w-full p-3 mb-5"

            />

            <div className="flex justify-end gap-3">

              <button

                onClick={() => {

                  setShowAddMentee(
                    false
                  );

                  setRollNo("");

                }}

                className="px-5 py-2 border rounded-lg"

              >

                Cancel

              </button>

              <button

                onClick={async () => {

                  try {

                    await mentorAPI.addMentee({

                      rollNo,

                    });

                    setShowAddMentee(
                      false
                    );

                    setRollNo("");

                    loadDashboard();

                  }

                  catch (err) {

                    alert(

                      err.response?.data
                        ?.message ||
                      "Unable to add mentee."

                    );

                  }

                }}

                className="bg-indigo-600 text-white px-5 py-2 rounded-lg"

              >

                Add

              </button>

            </div>

          </div>

        </div>

      )}
      {/* Create Interaction */}

      <div className="dash-box mb-8">

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">

          <h2 className="text-xl sm:text-2xl font-semibold">
            Create Interaction
          </h2>

          <button
            onClick={() => setShowInteraction(!showInteraction)}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg w-full sm:w-auto"
          >
            {showInteraction ? "Close" : "New Interaction"}
          </button>

        </div>

        {showInteraction && (

          <form
            className="space-y-5"
            onSubmit={async (e) => {

              e.preventDefault();

              try {

                await mentorAPI.createInteraction(interactionData);

                alert("Interaction created successfully.");

                setInteractionData({
                  interactionDate: "",
                  interactionType: "In Person",
                  meetingSummary: "",
                  menteeIds: [],
                });

                setShowInteraction(false);

                loadDashboard();

              } catch (err) {

                alert(
                  err.response?.data?.message ||
                  "Unable to create interaction."
                );

              }

            }}
          >

            <div>

              <label className="block mb-2 font-medium">
                Interaction Date
              </label>

              <input
                type="date"
                className="border rounded-lg p-3 w-full"
                value={interactionData.interactionDate}
                onChange={(e) =>
                  setInteractionData({
                    ...interactionData,
                    interactionDate: e.target.value,
                  })
                }
              />

            </div>

            <div>

              <label className="block mb-2 font-medium">
                Interaction Type
              </label>

              <select
                className="border rounded-lg p-3 w-full"
                value={interactionData.interactionType}
                onChange={(e) =>
                  setInteractionData({
                    ...interactionData,
                    interactionType: e.target.value,
                  })
                }
              >

                <option>In Person</option>
                <option>Online</option>
                <option>Phone Call</option>

              </select>

            </div>

            <div>

              <label className="block mb-2 font-medium">
                Meeting Summary
              </label>

              <textarea
                rows={4}
                className="border rounded-lg p-3 w-full"
                value={interactionData.meetingSummary}
                onChange={(e) =>
                  setInteractionData({
                    ...interactionData,
                    meetingSummary: e.target.value,
                  })
                }
              />

            </div>

            <div>

              <label className="block mb-2 font-medium">
                Select Mentees
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

                {dashboard.assignedMentees.map((mentee) => (

                  <label
                    key={mentee._id}
                    className="border rounded-lg p-3 flex items-center gap-2"
                  >

                    <input
                      type="checkbox"
                      checked={interactionData.menteeIds.includes(
                        mentee._id
                      )}
                      onChange={(e) => {

                        if (e.target.checked) {

                          setInteractionData({

                            ...interactionData,

                            menteeIds: [
                              ...interactionData.menteeIds,
                              mentee._id,
                            ],

                          });

                        } else {

                          setInteractionData({

                            ...interactionData,

                            menteeIds:
                              interactionData.menteeIds.filter(
                                (id) => id !== mentee._id
                              ),

                          });

                        }

                      }}
                    />

                    {mentee.name}

                  </label>

                ))}

              </div>

            </div>

            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg"
            >
              Submit Interaction
            </button>

          </form>

        )}

      </div>
            {/* ==========================================================
          Interaction History
      ========================================================== */}

      <div className="dash-box">

        <h2 className="text-2xl font-semibold mb-5">
          Interaction History
        </h2>

        <div className="overflow-x-auto">

          <table className="min-w-full border">

            <thead className="bg-slate-100">

              <tr>

                <th className="p-3 text-left">Date</th>

                <th className="p-3 text-left">Type</th>

                <th className="p-3 text-left">Meeting Summary</th>

                <th className="p-3 text-left">Approved</th>

                <th className="p-3 text-left">Pending</th>

                <th className="p-3 text-left">Rejected</th>

              </tr>

            </thead>

            <tbody>

              {dashboard.interactionHistory.length === 0 ? (

                <tr>

                  <td
                    colSpan="6"
                    className="text-center p-8 text-gray-500"
                  >

                    No interactions found.

                  </td>

                </tr>

              ) : (

                dashboard.interactionHistory.map(
                  (interaction) => (

                    <tr
                      key={interaction._id}
                      className="border-t"
                    >

                      <td className="p-3">

                        {new Date(
                          interaction.interactionDate
                        ).toLocaleDateString()}

                      </td>

                      <td className="p-3">

                        {interaction.interactionType}

                      </td>

                      <td className="p-3">

                        {interaction.meetingSummary}

                      </td>

                      <td className="p-3">

                        {interaction.approved.length === 0
                          ? "-"
                          : interaction.approved
                              .map(
                                (student) =>
                                  student.name
                              )
                              .join(", ")}

                      </td>

                      <td className="p-3">

                        {interaction.pending.length === 0
                          ? "-"
                          : interaction.pending
                              .map(
                                (student) =>
                                  student.name
                              )
                              .join(", ")}

                      </td>

                      <td className="p-3">

                        {interaction.rejected.length === 0
                          ? "-"
                          : interaction.rejected
                              .map(
                                (student) =>
                                  student.name
                              )
                              .join(", ")}

                      </td>

                    </tr>

                  )

                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </>

  );

}