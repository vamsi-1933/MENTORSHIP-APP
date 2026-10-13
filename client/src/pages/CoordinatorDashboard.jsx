import { useEffect, useState, useMemo } from "react";
import DashboardHeader from "../../components/DashboardHeader";
import StatsCard from "../../components/StatsCard";
import Loader from "../../components/Loader";
import { coordinatorAPI } from "../lib/api";

export default function CoordinatorDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔍 Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  //  Selection State
  const [selectedMentor, setSelectedMentor] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const isSuper = user?.role === "super_coordinator";

  const title = isSuper ? "Super Coordinator Dashboard" : "Coordinator Dashboard";
  const subtitle = isSuper 
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

  // 🧠 Filtering & Sorting Logic for Mentor List
  const filteredMentors = useMemo(() => {
    if (!dashboard) return [];
    
    let list = [...dashboard.mentorList];

    // 1. Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m => 
        m.name.toLowerCase().includes(q) || 
        m.rollNo.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
      );
    }

    // 2. Department Filter
    if (departmentFilter !== "all") {
      list = list.filter(m => m.department === departmentFilter);
    }

    // 3. Sort
    if (sortBy === "name-asc") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "name-desc") list.sort((a, b) => b.name.localeCompare(a.name));
    // Add date sorting logic here if needed

    return list;
  }, [dashboard, searchQuery, departmentFilter, sortBy]);

  // Get unique departments for dropdown
  const departments = useMemo(() => {
    if (!dashboard) return [];
    return [...new Set(dashboard.mentorList.map(m => m.department))];
  }, [dashboard]);

  if (loading) return <Loader />;

  return (
    <>
      <DashboardHeader title={title} subtitle={subtitle} />

      {/* 🔍 SEARCH & FILTER BAR */}
      <div className="dash-box mb-6 p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Search</label>
            <input
              type="text"
              placeholder="Mentor name, roll no, mentee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">All departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="newest">Newest date</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 📊 STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <StatsCard title="Mentors" value={dashboard.cards.totalMentors} />
        <StatsCard title="Pending Verifications" value={dashboard.cards.pendingVerifications} color="bg-yellow-500" />
        <StatsCard title="Pending Reviews" value={dashboard.cards.pendingReviews} color="bg-red-500" />
        <StatsCard title="Feedback Submitted" value={dashboard.cards.mentorFeedbackSubmitted} color="bg-green-600" />
      </div>

      {/*  MENTOR LIST TABLE (Only shows when NO mentor is selected) */}
      {!selectedMentor && (
      <div className="dash-box mb-8">
        <h2 className="text-2xl font-semibold mb-2">Mentor List</h2>
        <p className="text-gray-500 text-sm mb-5">
          Click a mentor to show only their interactions. Showing {filteredMentors.length} of {dashboard.mentorList.length}
        </p>

        <div className="overflow-visible"> 
          {/* Note: Changed overflow-x-auto to overflow-visible so the shadow isn't cut off at edges */}
          <table className="min-w-full border-separate border-spacing-0">
            {/* border-separate is CRITICAL for z-index/shadow to work on rows */}
            
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 text-left font-medium text-gray-700 border-b border-gray-200">Roll No</th>
                <th className="p-3 text-left font-medium text-gray-700 border-b border-gray-200">Name</th>
                <th className="p-3 text-left font-medium text-gray-700 border-b border-gray-200">Department</th>
                <th className="p-3 text-left font-medium text-gray-700 border-b border-gray-200">Email</th>
                <th className="p-3 text-center font-medium text-gray-700 border-b border-gray-200">Assigned Mentees</th>
                <th className="p-3 text-center font-medium text-gray-700 border-b border-gray-200">Interactions</th>
              </tr>
            </thead>
            
            <tbody>
              {filteredMentors.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-6 text-gray-500">No mentors found.</td>
                </tr>
              ) : (
                filteredMentors.map((mentor) => {
                  const isSelected = selectedMentor?._id === mentor._id;
                  
                  return (
                    <tr 
                      key={mentor._id} 
                      onClick={() => setSelectedMentor(mentor)}
                      className={`
                        group cursor-pointer transition-all duration-200 ease-out
                        ${isSelected 
                          ? 'bg-blue-50' 
                          : 'hover:-translate-y-1 hover:shadow-lg hover:z-20 relative bg-white hover:bg-white'
                        }
                      `}
                    >
                      {/* Added borders manually because border-separate removes default table borders */}
                      <td className="p-3 text-gray-900 border-b border-gray-100 group-hover:border-transparent">{mentor.rollNo}</td>
                      <td className="p-3 font-medium text-gray-900 border-b border-gray-100 group-hover:border-transparent flex items-center gap-2">
                        {mentor.name}
                        {isSelected && <span className="text-xs text-blue-600 font-bold bg-blue-100 px-2 py-0.5 rounded-full">Selected</span>}
                      </td>
                      <td className="p-3 text-gray-700 border-b border-gray-100 group-hover:border-transparent">{mentor.department}</td>
                      <td className="p-3 text-gray-700 border-b border-gray-100 group-hover:border-transparent">{mentor.email}</td>
                      <td className="p-3 text-center border-b border-gray-100 group-hover:border-transparent">
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">{mentor.assignedMentees}</span>
                      </td>
                      <td className="p-3 text-center border-b border-gray-100 group-hover:border-transparent">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">{mentor.interactions}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* 👤 SELECTED MENTOR HEADER (Only shows when a mentor IS selected) */}
      {selectedMentor && (
        <div className="dash-box mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border-l-4 border-l-blue-600">
          <div>
            <p className="text-sm text-gray-500 mb-1">Viewing interactions for</p>
            <h2 className="text-xl font-bold text-gray-900">
              {selectedMentor.name} 
              <span className="font-normal text-gray-600 ml-2 text-base">
                {selectedMentor.rollNo} · {selectedMentor.department}
              </span>
            </h2>
          </div>
          <button 
            onClick={() => setSelectedMentor(null)}
            className="px-5 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition text-sm font-medium shadow-sm"
          >
            Clear selection
          </button>
        </div>
      )}

      {/*  PENDING VERIFICATIONS (Filtered by Selected Mentor) */}
      <div className="dash-box mb-8">
        <h2 className="text-2xl font-semibold mb-2">Pending Verifications</h2>
        <p className="text-gray-500 text-sm mb-5">
          Meeting photos waiting for you to Verify or Reject. 
          {selectedMentor ? ` Showing for ${selectedMentor.name}.` : " Showing all."}
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 text-left font-medium text-gray-700">Date</th>
                <th className="p-3 text-left font-medium text-gray-700">Mentor</th>
                <th className="p-3 text-left font-medium text-gray-700">Dept</th>
                <th className="p-3 text-left font-medium text-gray-700">Mentees</th>
                <th className="p-3 text-left font-medium text-gray-700">Type</th>
                <th className="p-3 text-left font-medium text-gray-700">Summary</th>
                <th className="p-3 text-left font-medium text-gray-700">Image</th>
                <th className="p-3 text-left font-medium text-gray-700">Details</th>
                <th className="p-3 text-left font-medium text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const verifications = selectedMentor 
                  ? dashboard.pendingVerificationList.filter(v => v.mentor?._id === selectedMentor._id)
                  : dashboard.pendingVerificationList;

                return verifications.length === 0 ? (
                  <tr><td colSpan="9" className="text-center p-6 text-gray-500">No pending verifications.</td></tr>
                ) : (
                  verifications.map((item) => (
                    <tr key={`${item.sessionId}-${item.mentee._id}`} className="border-t">
                      <td className="p-3">{new Date(item.interactionDate).toLocaleDateString()}</td>
                      <td className="p-3">{item.mentor?.name}</td>
                      <td className="p-3 text-sm">{item.mentor?.department}</td>
                      <td className="p-3">{item.mentee?.name}</td>
                      <td className="p-3">{item.interactionType}</td>
                      <td className="p-3 max-w-xs truncate">{item.session?.meetingSummary}</td>
                      <td className="p-3"><div className="w-10 h-10 bg-gray-200 rounded"></div></td>
                      <td className="p-3"><button className="text-blue-600 hover:underline text-sm">View</button></td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">Verify</button>
                          <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* ⭐ PENDING REVIEWS (Filtered by Selected Mentor) */}
      <div className="dash-box mb-8">
        <h2 className="text-2xl font-semibold mb-2">Pending Reviews</h2>
        <p className="text-gray-500 text-sm mb-5">
          Interactions flagged for review.
          {selectedMentor ? ` Showing for ${selectedMentor.name}.` : " Showing all."}
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 text-left font-medium text-gray-700">Date</th>
                <th className="p-3 text-left font-medium text-gray-700">Mentor</th>
                <th className="p-3 text-left font-medium text-gray-700">Interaction Type</th>
                <th className="p-3 text-left font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const reviews = selectedMentor 
                  ? dashboard.pendingReviewList.filter(r => r.mentor?._id === selectedMentor._id)
                  : dashboard.pendingReviewList;

                return reviews.length === 0 ? (
                  <tr><td colSpan="4" className="text-center p-6 text-gray-500">No pending reviews.</td></tr>
                ) : (
                  reviews.map((item) => (
                    <tr key={item.sessionId} className="border-t">
                      <td className="p-3">{new Date(item.interactionDate).toLocaleDateString()}</td>
                      <td className="p-3">{item.mentor?.name}</td>
                      <td className="p-3">{item.interactionType}</td>
                      <td className="p-3">
                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
                          {item.reason}
                        </span>
                      </td>
                    </tr>
                  ))
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/*  MENTOR FEEDBACK (Filtered by Selected Mentor) */}
      <div className="dash-box mb-8">
        <h2 className="text-2xl font-semibold mb-5">Mentor Feedback</h2>
        <div className="space-y-4">
          {(() => {
            const feedbacks = selectedMentor 
              ? dashboard.mentorFeedbacks.filter(f => f.mentor?._id === selectedMentor._id)
              : dashboard.mentorFeedbacks;

            return feedbacks.length === 0 ? (
              <p className="text-gray-500">No mentor feedback submitted yet.</p>
            ) : (
              feedbacks.map((feedback) => (
                <div key={feedback._id} className="border rounded-lg p-5 bg-white">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-lg">{feedback.mentor?.name}</h3>
                      <p className="text-gray-500 text-sm">{feedback.mentor?.department}</p>
                    </div>
                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full shrink-0 text-sm font-bold">
                      ⭐ {feedback.rating}/5
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm"><strong className="text-gray-700">Interaction:</strong> {feedback.session?.interactionType}</p>
                    <p className="text-sm"><strong className="text-gray-700">Summary:</strong> {feedback.session?.meetingSummary}</p>
                    <p className="mt-3 text-gray-800 italic border-l-4 border-indigo-200 pl-4 py-1 bg-indigo-50 rounded-r">
                      "{feedback.feedback}"
                    </p>
                  </div>
                </div>
              ))
            );
          })()}
        </div>
      </div>
    </>
  );
}