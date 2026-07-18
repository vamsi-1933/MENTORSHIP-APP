import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../lib/api';
import { Handshake, Mail, Lock, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ REAL-TIME DOMAIN VALIDATION
  const isValidDomain = email.endsWith('@smail.iitm.ac.in');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!isValidDomain) {
      setError('Please use a valid @smail.iitm.ac.in email address.');
      return;
    }

    setLoading(true);

    try {
      const { data } = await authAPI.login({ email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));

      const roleRoutes = {
        admin: '/admin-dashboard',
        super_coordinator: '/super_coordinator-dashboard',
        coordinator: '/coordinator-dashboard',
        mentor: '/mentor-dashboard',
        mentee: '/mentee-dashboard'
      };

      navigate(roleRoutes[data.role] || '/');
      
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
        
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg mx-auto">
            <Handshake className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Mentorship Portal</h1>
          <p className="text-indigo-200 text-sm">IIT Madras Student Mentorship Program</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* Email Field with Domain Validation */}
          <div>
            <label className="block text-sm font-medium text-indigo-200 mb-2">Institute Email</label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                email && !isValidDomain ? 'text-red-400' : 
                isValidDomain ? 'text-emerald-400' : 'text-indigo-400'
              }`} />
              <input
                type="email"
                placeholder="username@smail.iitm.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                required
                className={`w-full pl-11 pr-10 py-3 bg-white/10 border rounded-xl text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 transition-all ${
                  email && !isValidDomain 
                    ? 'border-red-500/50 focus:ring-red-500' : 
                    isValidDomain 
                    ? 'border-emerald-500/50 focus:ring-emerald-500' : 
                    'border-white/20 focus:ring-indigo-500'
                }`}
              />
              {/* Validation Icon */}
              {email && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isValidDomain ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    email.includes('@') && <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>
              )}
            </div>
            {!isValidDomain && email.length > 0 && (
              <p className="mt-2 text-xs text-red-300/80">Only @smail.iitm.ac.in addresses are allowed</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-indigo-200 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !isValidDomain}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Authenticating...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-indigo-300/60 text-xs">
            Restricted to IIT Madras Students & Staff
          </p>
        </div>
      </div>
    </div>
  );
}