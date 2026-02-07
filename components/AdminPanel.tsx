
import React, { useState } from 'react';
import { Course, Lesson, SupabaseConfig } from '../types';

interface AdminPanelProps {
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  onBack: () => void;
  dbConfig: SupabaseConfig;
  setDbConfig: (cfg: SupabaseConfig) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ courses, setCourses, onBack, dbConfig, setDbConfig }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState(dbConfig.url);
  const [tempKey, setTempKey] = useState(dbConfig.anonKey);

  const handleSaveSettings = () => {
    setDbConfig({ url: tempUrl, anonKey: tempKey, isConnected: !!(tempUrl && tempKey) });
    setIsSettingsOpen(false);
    alert("Konfigurasi disimpan! Sinkronisasi otomatis diaktifkan.");
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
            <p className="text-slate-400 font-medium">Kelola kursus dan sinkronisasi realtime database.</p>
          </div>
        </div>
        <div className="flex gap-4">
            <button onClick={() => setIsSettingsOpen(true)} className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span className="font-bold text-sm">Settings</span>
            </button>
            <button onClick={() => { alert('Gunakan dashboard untuk menambah kursus agar otomatis masuk ke database.') }} className="bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95">Informasi Sistem</button>
        </div>
      </header>

      <div className={`mb-10 p-6 rounded-[2rem] border flex items-center justify-between ${dbConfig.isConnected ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
         <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full animate-pulse ${dbConfig.isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            <div>
               <p className="text-sm font-black uppercase tracking-widest">Status Sinkronisasi Cloud</p>
               <p className="text-xs font-bold opacity-70">{dbConfig.isConnected ? 'Terhubung secara realtime ke Supabase' : 'Lokal Mode (Data hanya tersimpan di browser ini)'}</p>
            </div>
         </div>
         {!dbConfig.isConnected && <button onClick={() => setIsSettingsOpen(true)} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase">Hubungkan Database</button>}
      </div>

      <div className="bg-white rounded-[2.5rem] soft-shadow border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50">
                <tr>
                    <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Judul Kursus</th>
                    <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Kurikulum</th>
                    <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {courses.map((c) => (
                    <tr key={c.id} className="group hover:bg-violet-50/30">
                        <td className="px-8 py-6">
                            <div className="flex items-center gap-6">
                                <img src={c.thumbnail} className="w-20 h-12 object-cover rounded-xl shadow-sm bg-slate-100" alt="" />
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg leading-tight">{c.title}</h4>
                                    <p className="text-xs text-slate-400 font-medium truncate max-w-xs">{c.category}</p>
                                </div>
                            </div>
                        </td>
                        <td className="px-8 py-6 text-center text-xs font-bold text-slate-500">{c.lessons.length} Pelajaran</td>
                        <td className="px-8 py-6 text-right flex justify-end gap-2">
                            <button onClick={() => setCourses(prev => prev.filter(item => item.id !== c.id))} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] custom-scrollbar">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Supabase Realtime Sync</h2>
                    <button onClick={() => setIsSettingsOpen(false)} className="p-2 text-slate-300 hover:text-slate-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-violet-50 rounded-2xl border border-violet-100">
                        <h4 className="text-xs font-black text-violet-600 uppercase tracking-widest mb-3">PENTING: Gunakan SQL Versi Terbaru</h4>
                        <p className="text-[11px] font-medium text-slate-500 mb-4 leading-relaxed">Copy paste script SQL di bawah ini ke SQL Editor Supabase untuk memastikan sinkronisasi berjalan lancar tanpa glitch.</p>
                        
                        <div className="bg-slate-900 rounded-2xl text-white p-5">
                            <pre className="text-[10px] overflow-x-auto text-emerald-400 font-mono">
{`-- SQL IDEMPOTENT (ANTI ERROR)
create table if not exists lms_storage (
  id text primary key,
  data jsonb not null,
  client_id text,
  updated_at timestamp with time zone default now()
);

-- Tambah kolom jika sudah ada tabel lama
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='lms_storage' and column_name='client_id') then
    alter table lms_storage add column client_id text;
  end if;
end $$;

-- Registrasi Realtime Aman
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'lms_storage') then
    alter publication supabase_realtime add table lms_storage;
  end if;
end $$;`}
                            </pre>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Supabase URL</label>
                            <input type="text" value={tempUrl} onChange={(e) => setTempUrl(e.target.value)} placeholder="https://xyz.supabase.co" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Anon Public Key</label>
                            <input type="password" value={tempKey} onChange={(e) => setTempKey(e.target.value)} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button onClick={() => setIsSettingsOpen(false)} className="flex-1 py-5 text-sm font-black text-slate-400 uppercase tracking-widest">Batal</button>
                        <button onClick={handleSaveSettings} className="flex-[2] py-5 bg-violet-600 text-white rounded-[2rem] font-black shadow-xl shadow-violet-200">Simpan & Hubungkan</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
