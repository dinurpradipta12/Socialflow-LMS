
import React, { useState } from 'react';
import { UserSession } from '../types';

interface LoginProps {
  onLogin: (session: UserSession) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      // Role Developer (Full Access)
      if (email === 'admin1@arunika.com' && password === '123456') {
        onLogin({ username: 'Dinur Pradipta', role: 'developer', isLoggedIn: true });
      } 
      // User Publik Baru (Hanya Course Player)
      else if (email === 'arunika@gmail.com' && password === 'ar4925') {
        onLogin({ username: 'Visitor Arunika', role: 'public', isLoggedIn: true });
      }
      // User Publik Lama
      else if (email === 'user@arunika.com' && password === '123456') {
        onLogin({ username: 'Snail Labs User', role: 'public', isLoggedIn: true });
      } 
      else {
        setError('Email atau password salah. Akses ditolak.');
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white p-6 relative overflow-hidden font-inter">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-100/30 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-violet-50/20 rounded-full blur-[100px]"></div>

      <div className="bg-white/90 backdrop-blur-2xl p-8 md:p-12 rounded-[2.5rem] soft-shadow w-full max-w-md border border-slate-100 relative z-10 animate-in fade-in zoom-in-95">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-violet-600 to-violet-400 rounded-[2rem] mb-6 text-white shadow-2xl shadow-violet-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Arunika LMS</h1>
          <p className="text-slate-400 mt-3 font-semibold text-sm uppercase tracking-widest">Akses Preview Publik</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 transition-all font-bold text-slate-700 shadow-sm"
              placeholder="arunika@gmail.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 transition-all font-bold text-slate-700 shadow-sm"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-4 bg-rose-50 text-rose-500 text-xs font-bold rounded-xl border border-rose-100 flex items-center gap-3 animate-bounce">
              <span className="text-lg">⚠️</span>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-violet-600 text-white font-black py-4 rounded-2xl hover:bg-violet-700 transition-all shadow-2xl shadow-violet-100 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isLoading ? "Memproses..." : "Masuk Sekarang"}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
            Developed by <span className="text-violet-600">Arunika Team</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
