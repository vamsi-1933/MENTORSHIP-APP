import React, { useState, useEffect } from 'react';
import DashboardHeader from '../../components/DashboardHeader';
import axios from 'axios';
import { 
  Users, FileText, Plus, Clock, CheckCircle2, AlertCircle, 
  Save, Send, X, Calendar, MessageSquare, BookOpen
} from 'lucide-react';

export default function MentorDashboard() {
  const [myMentees, setMyMentees] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Session Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    menteeId: '',
    title: '',
    scheduledDate: '',
    duration: 30,
    interactionType: 'In-person',
    discussionTopics: [],
    topicsCovered: '',
    progressNotes: '',
    nextSteps: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [autoSaveMsg, setAutoSaveMsg] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { 
    fetchData(); 
    loadDraft(); 
  }, []);

  // Auto-save draft every 30 seconds when form is open
  useEffect(() => {
    if (!isFormOpen) return;
    const interval = setInterval(() => {
      if (formData.title || formData.topicsCovered) {
        localStorage.setItem('mentor_draft', JSON.stringify(formData));
        setAutoSaveMsg('Draft saved at ' + new Date().toLocaleTimeString());
        setTimeout(() => setAutoSaveMsg(''), 2000);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isFormOpen, formData]);

const fetchData = async () => {
  try {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    console.log('🔄 Fetching mentor data...');

    // 1. Fetch mentorships
    const mentRes = await axios.get('http://localhost:8000/api/mentorships', { 
      headers,
      params: { mentor: user._id }
    });
    
    console.log('📋 Mentorships fetched:', mentRes.data.length);
    
    setMyMentees(mentRes.data.map(m => ({
      id: m.mentee._id,
      name: m.mentee.name,
      hostel: m.hostel,
      mentorshipId: m._id
    })));

    // 2. Fetch sessions
    const sessRes = await axios.get('http://localhost:8000/api/sessions', { headers });
    
    console.log('📊 Sessions fetched:', sessRes.data.length); // ← CRITICAL DEBUG LOG
    console.log('📊 Session data:', sessRes.data); // ← SEE WHAT BACKEND RETURNS
    
    const sortedSessions = sessRes.data.sort(
      (a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate)
    );
    
    setSessions(sortedSessions);
    
    // Update stats
    const verified = sortedSessions.filter(s => 
      s.status === 'mentee_verified' || s.status === 'approved'
    ).length;
    const pending = sortedSessions.filter(s => s.status === 'submitted').length;
    
    console.log(`📈 Stats - Verified: ${verified}, Pending: ${pending}`);
    
  } catch (err) { 
    console.error('❌ Mentor data fetch failed:', err.response?.data || err.message);
  } finally { 
    setLoading(false); 
  }
};

  const loadDraft = () => {
    const saved = localStorage.getItem('mentor_draft');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
        setIsFormOpen(true);
      } catch (e) {}
    }
  };

  const toggleTopic = (topic) => {
    setFormData(prev => ({
      ...prev,
      discussionTopics: prev.discussionTopics.includes(topic)
        ? prev.discussionTopics.filter(t => t !== topic)
        : [...prev.discussionTopics, topic]
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.menteeId) newErrors.menteeId = 'Please select a mentee';
    if (!formData.title.trim()) newErrors.title = 'Session title is required';
    if (!formData.scheduledDate) newErrors.scheduledDate = 'Date is required';
    if (formData.duration < 15) newErrors.duration = 'Minimum session duration is 15 minutes';
    if (!formData.nextSteps.trim()) newErrors.nextSteps = 'Next steps are required for accountability';
    if (formData.discussionTopics.length === 0) newErrors.discussionTopics = 'Select at least one topic';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;
  
  setSubmitting(true);
  try {
    // Find the correct mentorship ID for selected mentee
    const mentorship = myMentees.find(m => m.id === formData.menteeId);
    
    if (!mentorship) {
      alert(' Selected mentee not found in your assignments');
      setSubmitting(false);
      return;
    }

    const payload = {
      mentorship: mentorship.mentorshipId,
      title: formData.title,
      scheduledDate: formData.scheduledDate,
      duration: parseInt(formData.duration), // Ensure number type
      interactionType: formData.interactionType,
      discussionTopics: formData.discussionTopics,
      mentorReport: {
        topicsCovered: formData.topicsCovered,
        progressNotes: formData.progressNotes,
        nextSteps: formData.nextSteps
      },
      status: 'submitted'
    };

    console.log('📤 Submitting session:', payload); // Debug log

    const response = await axios.post(
      'http://localhost:8000/api/sessions', 
      payload, 
      { headers }
    );

    console.log('✅ Session created:', response.data); // Success log
    
    alert('✅ Session report submitted successfully!');
    
    // Clear form and draft
    localStorage.removeItem('mentor_draft');
    setFormData({
      menteeId: '', title: '', scheduledDate: '', duration: 30,
      interactionType: 'In-person', discussionTopics: [],
      topicsCovered: '', progressNotes: '', nextSteps: ''
    });
    setIsFormOpen(false);
    
    // CRITICAL: Force refresh dashboard data
    await fetchData(); 
    
  } catch (err) {
    console.error('❌ Submission failed:', err.response?.data || err.message);
    alert(err.response?.data?.message || 'Submission failed. Check console for details.');
  } finally { 
    setSubmitting(false); 
  }
};

  const getStatusColor = (status) => {
    switch(status) {
      case 'submitted': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'mentee_verified': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'approved': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) return <div className="p-10 text-center">Loading your mentorship data...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gradient-to-r from-orange-300 to-slate-500 min-h-screen">
      <DashboardHeader 
      />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-indigo-900 my-2">Mentor Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {user?.name}</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm"
        >
          <Plus size={18} /> Log New Session
        </button>
      </div>

      {/* My Mentees Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-xl/30 ...">
          <div className="flex items-center gap-4 ">
            <div className="p-3 bg-indigo-50 rounded-full"><Users className="text-indigo-600" /></div>
            <div >
              <p className="text-sm text-slate-600">Active Mentees</p>
              <p className="text-2xl font-bold text-black">{myMentees.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-xl/30 ...">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-full"><CheckCircle2 className="text-emerald-600" /></div>
            <div>
              <p className="text-sm text-slate-600">Verified Sessions</p>
              <p className="text-2xl font-bold  text-black">{sessions.filter(s => s.status === 'mentee_verified' || s.status === 'approved').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-xl/30 ...">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-full"><Clock className="text-amber-600" /></div>
            <div>
              <p className="text-sm text-slate-600">Pending Verification</p>
              <p className="text-2xl font-bold text-black">{sessions.filter(s => s.status === 'submitted').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* SESSION LOG FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50  backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-green-100 rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="p-6 border-b  border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-slate-800 ">Log Mentorship Session</h3>
                {autoSaveMsg && <p className="text-xs text-emerald-600 mt-1">{autoSaveMsg}</p>}
              </div>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Mentee Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Mentee *</label>
                <select 
                  value={formData.menteeId}
                  onChange={e => setFormData({...formData, menteeId: e.target.value})}
                  className={`w-full p-2.5 border text-black text-sm rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${errors.menteeId ? 'border-red-300' : 'border-gray-300'}`}
                >
                  <option className=' text-black'value="">Choose a mentee...</option>
                  {myMentees.map(m => (
                    <option className='bg-green-100 text-black' key={m.id} value={m.id}>{m.name} ({m.hostel})</option>
                  ))}
                </select>
                {errors.menteeId && <p className="text-xs text-red-500 mt-1">{errors.menteeId}</p>}
              </div>

              {/* Session Details Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                  <input 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className={`w-full p-2.5  text-black text-sm border rounded-lg ${errors.title ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="e.g., Course Registration Help"
                  />
                  {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                  <input 
                    type="date"
                    value={formData.scheduledDate}
                    onChange={e => setFormData({...formData, scheduledDate: e.target.value})}
                    className={`w-full p-2.5  text-black text-sm border rounded-lg ${errors.scheduledDate ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {errors.scheduledDate && <p className="text-xs text-red-500 mt-1">{errors.scheduledDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duration (mins) *</label>
                  <input 
                    type="number"
                    min="15"
                    value={formData.duration}
                    onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})}
                    className={`w-full p-2.5 border  text-black text-sm rounded-lg ${errors.duration ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration}</p>}
                </div>
              </div>

              {/* Interaction Type & Topics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Interaction Type</label>
                  <select 
                    value={formData.interactionType}
                    onChange={e => setFormData({...formData, interactionType: e.target.value})}
                    className="w-full p-2.5  text-black text-sm border border-gray-300 rounded-lg"
                  >
                    <option>In-person</option>
                    <option>Online Call</option>
                    <option>Academic Guidance</option>
                    <option>Hostel Visit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Discussion Topics *</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['Academics', 'Hostel Life', 'Clubs', 'Internships', 'Wellbeing', 'Career'].map(topic => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => toggleTopic(topic)}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                          formData.discussionTopics.includes(topic)
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-600 border-gray-300 hover:border-indigo-400'
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                  {errors.discussionTopics && <p className="text-xs text-red-500 mt-1">{errors.discussionTopics}</p>}
                </div>
              </div>

              {/* Detailed Report Fields */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <BookOpen size={14} /> Topics Covered *
                  </label>
                  <textarea 
                    rows={3}
                    value={formData.topicsCovered}
                    onChange={e => setFormData({...formData, topicsCovered: e.target.value})}
                    className="w-full p-2.5 border  text-black text-sm border-gray-300 rounded-lg resize-none"
                    placeholder="What was discussed in detail..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <MessageSquare size={14} /> Progress Notes
                  </label>
                  <textarea 
                    rows={2}
                    value={formData.progressNotes}
                    onChange={e => setFormData({...formData, progressNotes: e.target.value})}
                    className="w-full p-2.5 border  text-black text-sm border-gray-300 rounded-lg resize-none"
                    placeholder="Observations about mentee's state..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <Calendar size={14} /> Next Steps *
                  </label>
                  <textarea 
                    rows={2}
                    value={formData.nextSteps}
                    onChange={e => setFormData({...formData, nextSteps: e.target.value})}
                    className={`w-full p-2.5 border  text-black text-sm rounded-lg resize-none ${errors.nextSteps ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="Actionable items for next meeting..."
                  />
                  {errors.nextSteps && <p className="text-xs text-red-500 mt-1">{errors.nextSteps}</p>}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex gap-3">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 bg-indigo-600   text-black text-sm py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? 'Submitting...' : <><Send size={16} /> Submit Report</>}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    localStorage.setItem('mentor_draft', JSON.stringify(formData));
                    setAutoSaveMsg('Draft saved manually!');
                    setTimeout(() => setAutoSaveMsg(''), 2000);
                  }}
                  className="px-4 py-2.5 border border-gray-300   text-black text-sm rounded-lg text-slate-600 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Save size={16} /> Save Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SESSION HISTORY TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-slate-800">Session History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 font-medium text-slate-600">Mentee</th>
                <th className="p-4 font-medium text-slate-600">Title</th>
                <th className="p-4 font-medium text-slate-600">Date</th>
                <th className="p-4 font-medium text-slate-600">Duration</th>
                <th className="p-4 font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map(session => (
                <tr key={session._id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-800">
                    {session.mentorship?.mentee?.name || 'Unknown'}
                  </td>
                  <td className="p-4 text-slate-600">{session.title}</td>
                  <td className="p-4 text-slate-500">
                    {new Date(session.scheduledDate).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-slate-500">{session.duration} mins</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(session.status)}`}>
                      {session.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr><td colSpan="5" className="p-8 text-center text-slate-400">No sessions logged yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}