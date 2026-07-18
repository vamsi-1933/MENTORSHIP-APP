import React, { useState, useEffect } from 'react';
import DashboardHeader from '../../components/DashboardHeader';
import axios from 'axios';
import Papa from 'papaparse';
import { 
  Users, UserPlus, Upload, FileSpreadsheet, AlertCircle, 
  CheckCircle2, Loader2, X, Download, Trash2 
} from 'lucide-react';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('single'); // 'single' | 'bulk'
  
  // Single User Form
  const [singleForm, setSingleForm] = useState({ 
    name: '', email: '', password: '', role: 'mentee', department: '', hostel: '' 
  });
  const [creating, setCreating] = useState(false);

  // Bulk Import State
  const [csvFile, setCsvFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [parseError, setParseError] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/users', { headers });
      setUsers(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  // --- SINGLE USER CREATION ---
  const handleCreateSingle = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await axios.post('http://localhost:5000/api/users', singleForm, { headers });
      alert('✅ User created successfully!');
      setSingleForm({ name: '', email: '', password: '', role: 'mentee', department: '', hostel: '' });
      fetchUsers();
    } catch (err) { 
      alert(err.response?.data?.message || 'Creation failed'); 
    } finally { 
      setCreating(false); 
    }
  };

  // --- BULK CSV IMPORT ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setCsvFile(file);
    setImportResult(null);
    setParseError('');
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Validate required columns
        const requiredCols = ['name', 'email', 'role', 'department'];
        const missing = requiredCols.filter(col => !results.meta.fields.includes(col));
        
        if (missing.length > 0) {
          setParseError(`Missing required columns: ${missing.join(', ')}. Expected: ${requiredCols.join(', ')}`);
          setCsvFile(null);
          return;
        }
        
        // Validate email domains in preview
        const invalidEmails = results.data.filter(row => !row.email?.endsWith('@smail.iitm.ac.in'));
        if (invalidEmails.length > 0) {
          setParseError(`${invalidEmails.length} rows have invalid email domain (must end with @smail.iitm.ac.in)`);
          setCsvFile(null);
          return;
        }
        
        setPreviewData(results.data.slice(0, 5));
      },
      error: (err) => {
        setParseError('CSV Parse Error: ' + err.message);
        setCsvFile(null);
      }
    });
  };

  const handleBulkImport = async () => {
    if (!csvFile) return;
    setIsImporting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      
      const { data } = await axios.post('http://localhost:5000/api/users/bulk-import', formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      });
      
      setImportResult(data);
      fetchUsers();
    } catch (err) { 
      setImportResult({ success: false, message: err.response?.data?.message || 'Import failed' });
    } finally { 
      setIsImporting(false); 
    }
  };

  const downloadTemplate = () => {
    const csv = 'name,email,role,department,hostel\nJohn Doe,john.doe@smail.iitm.ac.in,mentee,Computer Science,Hostel A';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto w-8 h-8" /></div>;

  return (
    <div className="p-8 max-w-7xl bg-gradient-to-r from-teal-400 to-yellow-200 mx-auto space-y-8">
      <DashboardHeader 
    title="Admin Dashboard" 
    subtitle="Manage users, roles, and institute settings" 

/>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-amber-300  flex items-center gap-2">
          
        </h1>
        <div className="bg-white rounded-lg border border-gray-200 p-1 flex shadow-sm">
          <button 
            onClick={() => { setActiveTab('single'); setImportResult(null); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'single' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-gray-50'
            }`}
          >
            Add Single User
          </button>
          <button 
            onClick={() => { setActiveTab('bulk'); setImportResult(null); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'bulk' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-gray-50'
            }`}
          >
            Bulk CSV Import
          </button>
        </div>
      </div>
      
  
      {/* SINGLE USER FORM */}
      {activeTab === 'single' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-3 text-slate-800">
            <UserPlus size={20} /> Create New User
          </h2>
          <form onSubmit={handleCreateSingle} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-mist-800">
            <input placeholder="Full Name" className="border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={singleForm.name} onChange={e => setSingleForm({...singleForm, name: e.target.value})} required />
            <input type="email" placeholder="email@smail.iitm.ac.in" className="border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={singleForm.email} onChange={e => setSingleForm({...singleForm, email: e.target.value.toLowerCase()})} required />
            <input type="password" placeholder="Password" className="border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={singleForm.password} onChange={e => setSingleForm({...singleForm, password: e.target.value})} required />
            <select className="border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={singleForm.role} onChange={e => setSingleForm({...singleForm, role: e.target.value})}>
              <option value="mentee">Mentee</option>
              <option value="mentor">Mentor</option>
              <option value="coordinator">Coordinator</option>
              <option value="super_coordinator">Super Coordinator</option>
              <option value="admin">Admin</option>
            </select>
            <input placeholder="Department" className="border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={singleForm.department} onChange={e => setSingleForm({...singleForm, department: e.target.value})} required />
            <input placeholder="Hostel (Optional)" className="border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={singleForm.hostel} onChange={e => setSingleForm({...singleForm, hostel: e.target.value})} />
            <button type="submit" disabled={creating} className="md:col-span-2 bg-indigo-600 text-white p-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {creating ? <><Loader2 className="animate-spin w-4 h-4" /> Creating...</> : 'Create User'}
            </button>
          </form>
        </div>
      )}

      {/* BULK CSV IMPORT */}
      {activeTab === 'bulk' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-800">
              <Upload size={20} /> Bulk Import Users
            </h2>
            <button onClick={downloadTemplate} className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
              <Download size={14} /> Download CSV Template
            </button>
          </div>

          {/* File Upload Zone */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors relative">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isImporting}
            />
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">{csvFile ? csvFile.name : 'Click or drag CSV file here'}</p>
            <p className="text-xs text-slate-400 mt-1">Required columns: name, email, role, department</p>
          </div>

          {/* Parse Error */}
          {parseError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{parseError}</p>
            </div>
          )}

          {/* Preview Table */}
          {previewData.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Preview (First 5 rows):</p>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      {Object.keys(previewData[0]).map(key => (
                        <th key={key} className="p-3 font-medium text-slate-600 capitalize">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {previewData.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="p-3 text-slate-700">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Button & Result */}
          {previewData.length > 0 && (
            <div className="space-y-4">
              <button 
                onClick={handleBulkImport} 
                disabled={isImporting}
                className="w-full bg-emerald-600 text-white p-3 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isImporting ? <><Loader2 className="animate-spin w-4 h-4" /> Importing...</> : `Import ${previewData.length > 0 ? '+' : ''} Users`}
              </button>

              {importResult && (
                <div className={`p-4 rounded-lg border flex items-start gap-3 ${
                  importResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                }`}>
                  {importResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="text-sm">
                    {importResult.success ? (
                      <>
                        <p className="font-semibold text-emerald-800">Import Successful!</p>
                        <p className="text-emerald-700 mt-1">Created: {importResult.created} | Skipped (duplicate): {importResult.skipped}</p>
                      </>
                    ) : (
                      <p className="font-semibold text-red-800">{importResult.message}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* USERS TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-semibold justify-center text-slate-800">All Users ({users.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 font-medium text-slate-600">Name</th>
                <th className="p-4 font-medium text-slate-600">Email</th>
                <th className="p-4 font-medium text-slate-600">Role</th>
                <th className="p-4 font-medium text-slate-600">Department</th>
                <th className="p-4 font-medium text-slate-600">Hostel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-800">{u.name}</td>
                  <td className="p-4 text-slate-600">{u.email}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'super_coordinator' ? 'bg-blue-100 text-blue-700' :
                      u.role === 'coordinator' ? 'bg-indigo-100 text-indigo-700' :
                      u.role === 'mentor' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>{u.role.replace('_', ' ')}</span>
                  </td>
                  <td className="p-4 text-slate-600">{u.department || '-'}</td>
                  <td className="p-4 text-slate-600">{u.hostel || '-'}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan="5" className="p-8 text-center text-slate-400">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}