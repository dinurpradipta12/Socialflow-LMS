
import React, { useState } from 'react';
import { UserSession } from '../types';

interface LoginProps {
  onLogin: (session: UserSession) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username === 'snllabs' && password === '4925') {
      onLogin({ username, role: 'public', isLoggedIn: true });
    } else if (username === 'adminsnail' && password === '4925') {
      onLogin({ username, role: 'admin', isLoggedIn: true });
    } else {
      setError('Akses ditolak. Cek kredensial Anda.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#e0e7ff] p-6 relative overflow-hidden">
      {/* Background blobs for "cold" feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/50 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-100/50 rounded-full blur-3xl"></div>

      <div className="bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] soft-shadow w-full max-w-md border border-white/50 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-indigo-500 to-cyan-400 rounded-[2rem] mb-6 text-white shadow-xl shadow-indigo-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Snail LMS</h1>
          <p className="text-slate-400 mt-3 font-medium">Eksplorasi kelas tutorial premium</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase ml-1 tracking-widest">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all font-medium text-slate-700"
              placeholder="Username"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase ml-1 tracking-widest">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all font-medium text-slate-700"
              placeholder="••••••••"
            />
          </div>

          {error && <div className="p-4 bg-red-50 text-red-500 text-sm rounded-xl border border-red-100 animate-pulse">{error}</div>}

          <button 
            type="submit" 
            className="w-full bg-slate-900 text-white font-bold py-4.5 rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-[0.98] py-4"
          >
            Mulai Belajar
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-xs text-slate-400 font-medium">
            Powered by <span className="text-indigo-500 font-bold">Snail Labs</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
