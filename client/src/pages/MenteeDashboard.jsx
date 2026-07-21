import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardHeader from "../../components/DashboardHeader"
import { 
  CheckCircle2, XCircle, Clock, MessageSquare, Star, 
  Send, AlertTriangle, Calendar, User, ShieldCheck
} from 'lucide-react';

export default function MenteeDashboard() {
  const [sessions, setSessions] = useState([]);
  const [mentorName, setMentorName] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Verification Modal State
  const [verifyModal, setVerifyModal] = useState({ open: false, session: null });
  const [verifyForm, setVerifyForm] = useState({ status: 'approved', comments: '' });
  
  // Feedback Form State
  const [feedbackForm, setFeedbackForm] = useState({ rating: 0, comment: '' });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      // Fetch sessions assigned to this mentee
      const { data } = await axios.get('http://localhost:8000/api/sessions/mentee/' + user._id, { headers });
      
      setSessions(data.sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate)));
      
      // Extract mentor name from first session or fetch separately if needed
      if (data.length > 0 && data[0].mentorship?.mentor) {
        setMentorName(data[0].mentorship.mentor.name || 'Your Mentor');
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleVerifySubmit = async () => {
    try {
      await axios.put(
        `http://localhost:8000/api/sessions/${verifyModal.session._id}/verify`,
        verifyForm,
        { headers }
      );
      alert(`Session ${verifyForm.status === 'approved' ? 'approved' : 'rejected'} successfully!`);
      setVerifyModal({ open: false, session: null });
      setVerifyForm({ status: 'approved', comments: '' });
      fetchData();
    } catch (err) { alert('Verification failed'); }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (feedbackForm.rating === 0) {
      alert('Please select a rating before submitting.');
      return;
    }
    
    setSubmittingFeedback(true);
    try {
      await axios.post('http://localhost:8000/api/feedback', {
        rating: feedbackForm.rating,
        comment: feedbackForm.comment,
        department: user.department
        // Note: mentee ID is intentionally NOT sent to preserve anonymity
      }, { headers });
      
      setFeedbackSuccess(true);
      setFeedbackForm({ rating: 0, comment: '' });
      setTimeout(() => setFeedbackSuccess(false), 3000);
    } catch (err) { alert('Feedback submission failed'); } finally { setSubmittingFeedback(false); }
  };

  const getStatusBadge = (status) => {
    const styles = {
      submitted: 'bg-amber-100 text-amber-700 border-amber-200',
      mentee_verified: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      approved: 'bg-blue-100 text-blue-700 border-blue-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
      draft: 'bg-gray-100 text-gray-600 border-gray-200'
    };
    const labels = {
      submitted: '⏳ Awaiting Your Verification',
      mentee_verified: '✅ Verified by You',
      approved: ' Coordinator Approved',
      rejected: ' Rejected',
      draft: '📝 Draft'
    };
    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) return <div className="p-10 text-center">Loading your mentorship data...</div>;

  const pendingCount = sessions.filter(s => s.status === 'submitted').length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gradient-to-r from-green-400 to-blue-300 min-h-screen">
      
      <DashboardHeader 
      title={`Welcome,${user?.name}`} />
      <div className="flex justify-between items-start">
        <div>
          {/* <h1 className="text-3xl font-bold text-indigo-900">Welcome, {user?.name}!</h1> */}
          <p className="text-slate-700 mt-1">Mentor: <span className="font-medium text-indigo-700">{mentorName}</span></p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg flex items-center gap-2">
            <AlertTriangle className="text-amber-600" size={18} />
            <span className="text-sm font-medium text-amber-800">{pendingCount} Session(s) Pending Verification</span>
          </div>
        )}
      </div>

      {/* SESSION VERIFICATION LIST */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Calendar className="text-indigo-600" /> Session History & Verification
          </h2>
        </div>
        
        <div className="divide-y divide-gray-100">
          {sessions.map(session => (
            <div key={session._id} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-slate-800">{session.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {new Date(session.scheduledDate).toLocaleDateString()} • {session.duration} mins • {session.interactionType}
                  </p>
                </div>
                {getStatusBadge(session.status)}
              </div>

              {/* Mentor Report Preview */}
              {session.mentorReport && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Mentor's Notes</p>
                  <p className="text-sm text-slate-700"><strong>Topics:</strong> {session.mentorReport.topicsCovered}</p>
                  {session.mentorReport.nextSteps && (
                    <p className="text-sm text-slate-700 mt-2"><strong>Next Steps:</strong> {session.mentorReport.nextSteps}</p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {session.status === 'submitted' && (
                <button 
                  onClick={() => setVerifyModal({ open: true, session })}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Verify This Session
                </button>
              )}
              
              {/* Show rejection reason if applicable */}
              {session.status === 'rejected' && session.menteeValidation?.comments && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <strong className='text-black text-sm'>Your Rejection Reason:</strong> {session.menteeValidation.comments}
                </div>
              )}
            </div>
          ))}
          
          {sessions.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No sessions reported yet. Your mentor will log meetings here.</p>
            </div>
          )}
        </div>
      </div>

      {/* ANONYMOUS FEEDBACK SECTION */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-50 rounded-full">
            <ShieldCheck className="text-purple-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Anonymous Feedback</h2>
            <p className="text-sm text-slate-500">Your identity is hidden. Share honest feedback about your mentor's guidance.</p>
          </div>
        </div>

        {feedbackSuccess ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-lg font-semibold text-emerald-800">Thank you for your feedback!</p>
            <p className="text-sm text-emerald-600 mt-1">Your response has been submitted anonymously.</p>
          </div>
        ) : (
          <form onSubmit={handleFeedbackSubmit} className="space-y-5">
            {/* Star Rating */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Overall Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackForm({...feedbackForm, rating: star})}
                    className={`p-2 rounded-lg transition-all ${
                      feedbackForm.rating >= star 
                        ? 'text-yellow-400 bg-yellow-50 scale-110' 
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  >
                    <Star size={28} fill={feedbackForm.rating >= star ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Comments</label>
              <textarea 
                rows={3}
                value={feedbackForm.comment}
                onChange={e => setFeedbackForm({...feedbackForm, comment: e.target.value})}
                className="w-full p-3 border text-black text-sm border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="What went well? What could be improved?"
              />
            </div>

            <button 
              type="submit" 
              disabled={submittingFeedback || feedbackForm.rating === 0}
              className="bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              {submittingFeedback ? 'Submitting...' : <><Send size={16} /> Submit Anonymously</>}
            </button>
          </form>
        )}
      </div>

      {/* VERIFICATION MODAL */}
      {verifyModal.open && verifyModal.session && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-slate-800">Verify Session</h3>
              <p className="text-sm text-slate-500 mt-1">{verifyModal.session.title}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex gap-3">
                <button 
                  onClick={() => setVerifyForm({...verifyForm, status: 'approved'})}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    verifyForm.status === 'approved' 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                      : 'border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold">Yes, it happened</p>
                  <p className="text-xs mt-1 opacity-80">Meeting occurred as reported</p>
                </button>
                
                <button 
                  onClick={() => setVerifyForm({...verifyForm, status: 'rejected'})}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    verifyForm.status === 'rejected' 
                      ? 'border-red-500 bg-red-50 text-red-700' 
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <XCircle className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold">No, issue found</p>
                  <p className="text-xs mt-1 opacity-80">Meeting didn't happen or was inaccurate</p>
                </button>
              </div>

              {verifyForm.status === 'rejected' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Rejection *</label>
                  <textarea 
                    required
                    rows={3}
                    value={verifyForm.comments}
                    onChange={e => setVerifyForm({...verifyForm, comments: e.target.value})}
                    className="w-full p-3 border border-red-300  text-black text-sm rounded-lg resize-none focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="Please explain why this report is inaccurate..."
                  />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button 
                onClick={handleVerifySubmit}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700"
              >
                Confirm Verification
              </button>
              <button 
                onClick={() => setVerifyModal({ open: false, session: null })}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-slate-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}