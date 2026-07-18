import React from 'react';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DashboardHeader({ title, subtitle }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-4xl font-bold text-blue-950">{title}</h1>
        {subtitle && <p className="text-slate-600 mt-1">{subtitle}</p>}
      </div>
      
      <div className="flex items-center gap-4">
        {/* User Badge */}
        <div className="hidden md:flex items-center gap-2 bg-[#1e293b] px-3 py-2 rounded-lg border border-slate-700">
          <User size={16} className="text-indigo-400" />
          <span className="text-sm text-white-800 font-medium">{user?.name || 'User'}</span>
          <span className="text-xs text-slate-500 capitalize">({user?.role?.replace('_', ' ')})</span>
        </div>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-500 shadow-lg shadow-red-500/50 ... hover:text-red-400 
                     px-4 py-2 rounded-lg border border-red-500/20 transition-all duration-200 text-sm font-medium"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>
  );
}