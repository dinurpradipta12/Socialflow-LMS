
import React, { useState } from 'react';
import { Course, Lesson, SupabaseConfig } from '../types';

interface AdminPanelProps {
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  onBack: () => void;
  dbConfig: SupabaseConfig;
  setDbConfig: (cfg: SupabaseConfig) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ courses = [], setCourses, onBack, dbConfig, setDbConfig }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState(dbConfig.url);
  const [tempKey, setTempKey] = useState(dbConfig.anonKey);
  const [copySuccess, setCopySuccess] = useState(false);

  const safeCourses = Array.isArray(courses) ? courses : [];

  const handleClearCache = () => {
    if (confirm("Hapus semua data cache lokal? Tindakan ini akan mereset tampilan sementara tetapi tidak menghapus data di Supabase (jika terhubung).")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const sqlCode = `-- 1. Buat Tabel
create table if not exists lms_storage (
  id text primary key,
  data jsonb not null,
  client_id text default '',
  updated_at timestamp with time zone default now()
);

-- 2. Aktifkan Fitur Identitas Lengkap (PENTING)
alter table lms_storage replica identity full;

-- 3. Daftarkan ke Realtime
drop publication if exists supabase_realtime;
create publication supabase_realtime for table lms_storage;`;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleSaveSettings = () => {
    setDbConfig({ url: tempUrl, anonKey: tempKey, isConnected: !!(tempUrl && tempKey) });
    setIsSettingsOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 bg-white font-inter">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-violet-600 shadow-sm transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Pusat Kontrol</h1>
            <p className="text-slate-400 font-medium">Kelola sinkronisasi cloud Supabase.</p>
          </div>
        </div>
        <div className="flex gap-3">
            <button onClick={handleClearCache} className="p-4 bg-rose-50 text-rose-600 rounded-2xl flex items-center gap-3 font-bold px-6 border border-rose-100 active:scale-95 transition-all text-xs">
                <span>Bersihkan Cache</span>
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-4 bg-slate-900 text-white rounded-2xl flex items-center gap-3 font-bold px-8 active:scale-95 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span>Setup Database</span>
            </button>
        </div>
      </header>

      <div className={`mb-10 p-8 rounded-[2.5rem] border flex items-center justify-between ${dbConfig.isConnected ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
         <div className="flex items-center gap-5">
            <div className={`w-4 h-4 rounded-full ${dbConfig.isConnected ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}></div>
            <div>
               <p className="text-xs font-black uppercase tracking-widest">Koneksi Realtime</p>
               <p className="text-sm font-bold opacity-80">{dbConfig.isConnected ? 'Aplikasi terhubung ke cloud.' : 'Mode Offline.'}</p>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
            <thead className="bg-slate-50">
                <tr>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kursus Tersimpan</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {safeCourses.map((c) => (
                    <tr key={c.id}>
                        <td className="px-8 py-6 font-bold text-slate-800">{c.title}</td>
                        <td className="px-8 py-6 text-right">
                            <button onClick={() => { if(confirm('Hapus?')) setCourses(prev => prev.filter(i => i.id !== c.id)) }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2"/></svg>
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
                <h2 className="text-2xl font-black mb-8">Konfigurasi Supabase</h2>
                
                <div className="space-y-6">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Langkah 1: Jalankan SQL di Supabase Dashboard</h4>
                           <button onClick={handleCopySQL} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${copySuccess ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}>
                              {copySuccess ? 'Tersalin!' : 'Copy SQL'}
                           </button>
                        </div>
                        <div className="bg-slate-900 rounded-xl p-4 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-48">
                            <pre>{sqlCode}</pre>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-3 italic">*Salin kode di atas dan tempel di 'SQL Editor' pada Dashboard Supabase Anda.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Langkah 2: Masukkan URL & Key</label>
                          <input type="text" value={tempUrl} onChange={(e) => setTempUrl(e.target.value)} placeholder="Supabase URL" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" />
                        </div>
                        <input type="password" value={tempKey} onChange={(e) => setTempKey(e.target.value)} placeholder="Anon Key" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" />
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setIsSettingsOpen(false)} className="flex-1 py-4 font-bold text-slate-400">Batal</button>
                        <button onClick={handleSaveSettings} className="flex-[2] py-4 bg-violet-600 text-white rounded-2xl font-bold shadow-xl">Hubungkan Sekarang</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
