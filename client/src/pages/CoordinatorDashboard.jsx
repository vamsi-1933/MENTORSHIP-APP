import React, { useState, useEffect } from 'react';
import DashboardHeader from "../../components/DashboardHeader"
import axios from 'axios';
import { 
  Users, FileText, AlertTriangle, CheckCircle, BarChart3, 
  UserPlus, X, Calendar, Search, Filter, Clock
} from 'lucide-react';

export default function CoordinatorDashboard() {
  const [sessions, setSessions] = useState([]);
  const [mentorships, setMentorships] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  
  // Assignment Modal State
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ mentorId: '', menteeId: '' });
  const [assignError, setAssignError] = useState('');
  
  // Review Modal State
  const [reviewModal, setReviewModal] = useState({ open: false, session: null });

  const user = JSON.parse(localStorage.getItem('user'));
  const myDept = user?.department || '';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all necessary data in parallel
      const [sessRes, mentRes, usersRes] = await Promise.all([
        axios.get('http://localhost:5000/api/sessions', { headers }),
        axios.get('http://localhost:5000/api/mentorships', { headers }),
        axios.get('http://localhost:5000/api/users', { headers })
      ]);

      // Filter by coordinator's department
      const deptSessions = sessRes.data.filter(s => s.mentorship?.department === myDept);
      const deptMentorships = mentRes.data.filter(m => m.department === myDept);
      
      setSessions(deptSessions);
      setMentorships(deptMentorships);
      setUsers(usersRes.data.filter(u => u.department === myDept && (u.role === 'mentor' || u.role === 'mentee')));

      setStats({
        total: deptSessions.length,
        verified: deptSessions.filter(s => s.status === 'mentee_verified' || s.status === 'approved').length,
        pending: deptSessions.filter(s => s.status === 'submitted').length
      });
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setAssignError('');
    
    try {
      const token = localStorage.getItem('token');
      
      // Check mentor capacity before assigning
      const mentorCurrentLoad = mentorships.filter(m => 
        m.mentor === assignForm.mentorId && m.status === 'active'
      ).length;
      
      if (mentorCurrentLoad >= 5) {
        setAssignError('This mentor already has 5 active mentees (max capacity reached).');
        return;
      }

      await axios.post('http://localhost:5000/api/mentorships', assignForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('✅ Mentorship assigned successfully!');
      setIsAssignOpen(false);
      setAssignForm({ mentorId: '', menteeId: '' });
      fetchData();
    } catch (err) { 
      setAssignError(err.response?.data?.message || 'Assignment failed'); 
    }
  };

  const handleReviewSession = async (action) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/sessions/${reviewModal.session._id}/review`, 
        { action }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Session ${action === 'approve' ? 'approved' : 'flagged'} successfully`);
      setReviewModal({ open: false, session: null });
      fetchData();
    } catch (err) { alert('Review failed'); }
  };

  const getUserName = (id) => {
    const u = users.find(user => user._id === id);
    return u ? u.name : 'Unknown User';
  };

  if (loading) return <div className="p-10 text-center">Loading department analytics...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gradient-to-r from-amber-300 via-green-300 to-pink-300  min-h-screen">
      <DashboardHeader title={"WELCOME,COORDINATOR"}/>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-indigo-900 p-0 m-0">{myDept} Coordinator Portal</h1>
          <p className="text-slate-500 mt-1">Manage mentors, verify sessions, and track engagement</p>
        </div>
        <button 
          onClick={() => setIsAssignOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm"
        >
          <UserPlus size={18} /> Assign Mentorship
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 hover:shadow-amber-100">
        <StatCard className='border-black border-2 hover:shadow-amber-300' title="Total Reports" value={stats.total} icon={<FileText />} color="blue" />
        <StatCard title="Verified by Mentees" value={stats.verified} icon={<CheckCircle />} color="emerald" />
        <StatCard title="Pending Verification" value={stats.pending} icon={<AlertTriangle />} color="amber" />
      </div>

      {/* Mentor Activity Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-300 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-black  flex items-center gap-2"><BarChart3 size={20} /> Session Review Queue</h2>
          <span className="text-sm font-semibold text-slate-800 bg-slate-100 px-3 py-1 rounded-full">Department: {myDept}</span>
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4 text-sm font-medium text-slate-600">Mentor</th>
              <th className="p-4 text-sm font-medium text-slate-600">Session Title</th>
              <th className="p-4 text-sm font-medium text-slate-600">Date</th>
              <th className="p-4 text-sm font-medium text-slate-600">Status</th>
              <th className="p-4 text-sm font-medium text-slate-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sessions.map(session => (
              <tr key={session._id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-800">
                  {getUserName(session.mentorship?.mentor)}
                </td>
                <td className="p-4 text-slate-600">{session.title}</td>
                <td className="p-4 text-sm text-slate-500">
                  {new Date(session.scheduledDate).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <StatusBadge status={session.status} />
                </td>
                <td className="p-4">
                  {session.status === 'mentee_verified' ? (
                    <button 
                      onClick={() => setReviewModal({ open: true, session })}
                      className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded hover:bg-indigo-100 font-medium"
                    >
                      Final Review
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Awaiting mentee</span>
                  )}
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr><td colSpan="5" className="p-8 text-center text-slate-500">No sessions found for this department</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ASSIGN MENTORSHIP MODAL */}
      {isAssignOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-500 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Assign New Mentorship</h3>
              <button onClick={() => setIsAssignOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAssign} className="p-6 space-y-4">
              {assignError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {assignError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">Select Mentor</label>
                <select className='bg-blue-300 text-black'
                  required
                  value={assignForm.mentorId}
                  onChange={e => setAssignForm({...assignForm, mentorId: e.target.value})}
                  className="w-full p-2.5 border bg-blue-300 text-black text-shadow-white border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value ="">Choose a mentor...</option>
                  {users.filter(u => u.role === 'mentor').map(u => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white-700 mb-1">Select Mentee</label>
                <select 
                  required
                  value={assignForm.menteeId}
                  onChange={e => setAssignForm({...assignForm, menteeId: e.target.value})}
                  className="w-full p-2.5 border  bg-blue-300 text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Choose a mentee...</option>
                  {users.filter(u => u.role === 'mentee').map(u => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 mt-2">
                Confirm Assignment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW SESSION MODAL */}
      {reviewModal.open && reviewModal.session && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-slate-800">Final Session Review</h3>
              <p className="text-sm text-slate-500 mt-1">{reviewModal.session.title}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Mentor Report</p>
                <p className="text-sm text-slate-700"><strong>Topics:</strong> {reviewModal.session.mentorReport?.topicsCovered}</p>
                <p className="text-sm text-slate-700 mt-2"><strong>Next Steps:</strong> {reviewModal.session.mentorReport?.nextSteps}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">Mentee Validation</p>
                <p className="text-sm text-emerald-800">{reviewModal.session.menteeValidation?.comments || 'Approved without comments'}</p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => handleReviewSession('approve')} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700">
                Approve & Archive
              </button>
              <button onClick={() => setReviewModal({ open: false, session: null })} className="px-4 py-2.5 border border-gray-300 rounded-lg text-slate-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Components
function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100 hover:shadow border-black',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100'
  };
  
  return (
    <div className={`p-6 rounded-xl border ${colors[color]} flex items-center gap-4`}>
      <div className={`p-3 rounded-full bg-white/80`}>{icon}</div>
      <div>
        <p className="text-sm font-medium opacity-80">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    submitted: 'bg-amber-100 text-amber-700 border-amber-200',
    mentee_verified: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    approved: 'bg-blue-100 text-blue-700 border-blue-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    draft: 'bg-gray-100 text-gray-600 border-gray-200'
  };
  
  const labels = {
    submitted: 'Awaiting Mentee',
    mentee_verified: 'Verified by Mentee',
    approved: 'Coordinator Approved',
    rejected: 'Rejected',
    draft: 'Draft'
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.draft}`}>
      {labels[status] || status}
    </span>
  );
}