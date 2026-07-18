import React, { useState, useEffect } from 'react';
import DashboardHeader from '../../components/DashboardHeader';
import axios from 'axios';
import { 
  BarChart3, TrendingUp, Users, ShieldAlert, Megaphone, 
  CheckCircle2, AlertTriangle, Download, X
} from 'lucide-react';

export default function SuperCoordinatorDashboard() {
  const [deptStats, setDeptStats] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAnnounceOpen, setIsAnnounceOpen] = useState(false);
  const [announceForm, setAnnounceForm] = useState({ 
    title: '', content: '', priority: 'normal' 
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/analytics/departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDeptStats(data);
      
      // Generate alerts based on thresholds
      const generatedAlerts = [];
      data.forEach(dept => {
        if (dept.verificationRate < 70 && dept.totalSessions > 0) {
          generatedAlerts.push({
            dept: dept.name,
            type: 'low_verification',
            message: `Verification rate critically low at ${dept.verificationRate}%`,
            severity: 'critical'
          });
        }
        if (dept.inactiveMentors > 3) {
          generatedAlerts.push({
            dept: dept.name,
            type: 'inactive_mentors',
            message: `${dept.inactiveMentors} mentors inactive for >14 days`,
            severity: 'warning'
          });
        }
      });
      
      setAlerts(generatedAlerts);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/announcements', announceForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✅ Announcement broadcasted successfully!');
      setIsAnnounceOpen(false);
      setAnnounceForm({ title: '', content: '', priority: 'normal' });
    } catch (err) { 
      alert(err.response?.data?.message || 'Failed to create announcement'); 
    }
  };

  // Calculate institute-wide totals
  const totalMentors = deptStats.reduce((sum, d) => sum + d.totalMentors, 0);
  const avgVerification = deptStats.length > 0 
    ? Math.round(deptStats.reduce((sum, d) => sum + d.verificationRate, 0) / deptStats.length) 
    : 0;
  const totalSessions = deptStats.reduce((sum, d) => sum + d.totalSessions, 0);
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;

  if (loading) return (
    <div className="p-10 text-center">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
      <p className="mt-4 text-slate-500">Loading institute analytics...</p>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gradient-to-r from-green-400 via-red-500 to-black-400 min-h-screen">
          <DashboardHeader
    
        
       title ="Institute Overview" 
      subtitle="Strategic monitoring across all departments" 
    />
    
      <div className="flex justify-between items-start">
        <div>
        
        </div>
        <button 
          onClick={() => setIsAnnounceOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm transition-colors"
        >
          <Megaphone size={18} /> Broadcast Announcement
        </button>
      </div>

      {/* Institute-Wide Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard title="Total Active Mentors" value={totalMentors} icon={<Users />} color="indigo" />
        <MetricCard title="Avg Verification Rate" value={`${avgVerification}%`} icon={<CheckCircle2 />} color="emerald" />
        <MetricCard title="Total Sessions Logged" value={totalSessions.toLocaleString()} icon={<BarChart3 />} color="blue" />
        <MetricCard title="Critical Alerts" value={criticalAlerts} icon={<ShieldAlert />} color="red " />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Department Performance Comparison */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-800">
              <BarChart3 className="text-indigo-600" /> Department Performance
            </h2>
            <button className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              <Download size={14} /> Export CSV
            </button>
          </div>
          
          {deptStats.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No department data available. Create mentorships to see analytics.
            </div>
          ) : (
            <div className="space-y-6">
              {deptStats.map(dept => (
                <div key={dept.name}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700">{dept.name}</span>
                    <span className={`font-semibold ${
                      dept.verificationRate >= 80 ? 'text-emerald-600' : 
                      dept.verificationRate >= 60 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {dept.verificationRate}% Verified
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-3 rounded-full transition-all duration-700 ease-out ${
                        dept.verificationRate >= 80 ? 'bg-emerald-500' : 
                        dept.verificationRate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                      }`} 
                      style={{ width: `${Math.min(dept.verificationRate, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                    <span>{dept.totalMentors} mentors • {dept.activeMentors} active</span>
                    <span>{dept.totalSessions} sessions logged</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Required & Health Monitor */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-800">
              <ShieldAlert className="text-red-500" /> Action Required
            </h2>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm text-emerald-700 font-medium">All systems healthy</p>
                </div>
              ) : (
                alerts.map((alert, idx) => (
                  <div key={idx} className={`p-4 rounded-lg border ${
                    alert.severity === 'critical' 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-amber-50 border-amber-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <TrendingUp className={`mt-0.5 flex-shrink-0 ${
                        alert.severity === 'critical' ? 'text-red-500' : 'text-amber-500'
                      }`} size={18} />
                      <div>
                        <p className={`font-semibold text-sm ${
                          alert.severity === 'critical' ? 'text-red-800' : 'text-amber-800'
                        }`}>
                          {alert.dept}
                        </p>
                        <p className={`text-xs mt-1 ${
                          alert.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
                        }`}>
                          {alert.message}
                        </p>
                        <button className="mt-2 text-xs font-medium underline opacity-80 hover:opacity-100">
                          Investigate →
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-slate-700 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 transition-colors">
                Generate Report
              </button>
              <button className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 transition-colors">
                Manage Coordinators
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ANNOUNCEMENT MODAL */}
      {isAnnounceOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Broadcast Announcement</h3>
                <p className="text-sm text-slate-500 mt-1">Visible to all users institute-wide</p>
              </div>
              <button onClick={() => setIsAnnounceOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateAnnouncement} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input 
                  required
                  value={announceForm.title}
                  onChange={e => setAnnounceForm({...announceForm, title: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g., Mentor Orientation Schedule"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <select 
                  value={announceForm.priority}
                  onChange={e => setAnnounceForm({...announceForm, priority: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                <textarea 
                  required
                  rows={4}
                  value={announceForm.content}
                  onChange={e => setAnnounceForm({...announceForm, content: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="Announcement details..."
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                Publish Announcement
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Metric Card Component
function MetricCard({ title, value, icon, color }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    red: 'bg-red-50 text-red-600 border-red-100'
  };
  
  return (
    <div className={`p-6 rounded-xl border border-black ${colors[color]} flex items-center gap-4`}>
      <div className="p-3 rounded-full bg-black/80">{icon}</div>
      <div>
        <p className="text-sm font-medium opacity-80">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
    </div>
  );
}