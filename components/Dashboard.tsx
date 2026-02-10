
import React, { useState } from 'react';
import { Course, UserSession, ProgressState } from '../types';

interface DashboardProps {
  courses: Course[];
  user: UserSession;
  onLogout: () => void;
  onOpenCourse: (course: Course) => void;
  onOpenAdmin: () => void;
  onUpdateCourse: (course: Course) => void;
  onAddCourse: (course: Course) => void;
  onDeleteCourse: (id: string) => void;
  progress: ProgressState;
  brandName: string;
  brandLogo: string;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  courses = [], 
  user, 
  onLogout, 
  onOpenCourse, 
  onOpenAdmin,
  onUpdateCourse,
  onAddCourse,
  progress,
  brandName,
  brandLogo
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewCourse, setIsNewCourse] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  
  const isAdmin = user?.role === 'admin';
  
  const accessibleCourses = isAdmin ? courses : courses.filter(c => c?.isPublic);
  const categories = ['All', ...new Set(accessibleCourses.map(c => c?.category).filter(Boolean))];

  const filteredCourses = selectedCategory === 'All' 
    ? accessibleCourses 
    : accessibleCourses.filter(c => c?.category === selectedCategory);

  const handleCopyLink = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const link = `${window.location.origin}${window.location.pathname}?course=${id}`;
    navigator.clipboard.writeText(link);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const handleTogglePublic = (e: React.MouseEvent, course: Course) => {
    e.stopPropagation();
    if (course) onUpdateCourse({ ...course, isPublic: !course.isPublic });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-inter">
      <nav className="h-20 bg-white border-b border-slate-100 px-6 md:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
            {brandLogo ? <img src={brandLogo} className="w-full h-full object-contain" alt="Logo" /> : <div className="w-full h-full bg-violet-600 rounded-xl flex items-center justify-center text-white font-black">{brandName ? brandName.charAt(0) : 'A'}</div>}
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">{brandName || 'Arunika'}</span>
        </div>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <>
              <button onClick={onOpenAdmin} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                <span className="hidden lg:block text-xs font-black uppercase tracking-widest">Admin</span>
              </button>
              <button onClick={() => { setIsNewCourse(true); setEditingCourse({ id: `c-${Date.now()}`, title: '', category: '', description: '', thumbnail: '', lessons: [], isPublic: false }); setIsEditModalOpen(true); }} className="p-2.5 bg-violet-600 text-white rounded-xl shadow-lg flex items-center gap-2 hover:bg-violet-700 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="3"/></svg>
                <span className="hidden lg:block text-xs font-black uppercase tracking-widest">Tambah</span>
              </button>
            </>
          )}
          <button onClick={onLogout} className="px-5 py-2.5 bg-rose-50 text-rose-500 text-[10px] font-black rounded-xl uppercase tracking-widest active:scale-95 transition-all">LOGOUT</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Halo, <span className="text-violet-600">{(user?.username || 'User').split(' ')[0]}!</span></h2>
          <p className="text-slate-400 mt-3 font-medium text-lg max-w-2xl">
            {isAdmin ? 'Pusat kontrol konten belajar Anda. Kelola visibilitas publik di sini.' : 'Jelajahi materi premium untuk tingkatkan keahlian Anda hari ini.'}
          </p>
        </div>

        {categories.length > 1 && (
          <div className="flex gap-3 mb-10 overflow-x-auto pb-2 no-scrollbar">
             {categories.map(cat => (
               <button 
                 key={cat} 
                 onClick={() => setSelectedCategory(cat)} 
                 className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-violet-600 text-white shadow-lg shadow-violet-100' : 'bg-white text-slate-400 border border-slate-100 hover:border-violet-200'}`}
               >
                 {cat}
               </button>
             ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map(course => (
            <div key={course.id} onClick={() => onOpenCourse(course)} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex flex-col h-full group relative">
              
              {isAdmin && (
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                  <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${course?.isPublic ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full bg-white ${course?.isPublic ? 'animate-pulse' : ''}`}></div>
                    {course?.isPublic ? 'Public' : 'Private'}
                  </div>
                </div>
              )}

              <div className="aspect-video relative overflow-hidden bg-slate-100">
                <img src={course?.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                
                {isAdmin && (
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <button onClick={(e) => handleCopyLink(e, course.id)} className={`p-3 rounded-xl shadow-lg transition-all ${copyStatus === course.id ? 'bg-emerald-500 text-white' : 'bg-white text-slate-600 hover:text-emerald-500'}`}>
                      {copyStatus === course.id ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      )}
                    </button>
                    <button onClick={(e) => handleTogglePublic(e, course)} className={`p-3 rounded-xl shadow-lg transition-all ${course?.isPublic ? 'bg-emerald-500 text-white' : 'bg-white text-slate-600 hover:text-violet-600'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth="2"/></svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-violet-600 transition-colors line-clamp-2">{course?.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-6 font-medium leading-relaxed">{course?.description}</p>
                <div className="mt-auto flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-50 pt-6">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.754 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    {course?.lessons?.length || 0} Materi
                  </span>
                  <span className="text-violet-600 bg-violet-50 px-3 py-1 rounded-lg">ID: {course?.id?.slice(-6).toUpperCase() || 'NEW'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal Edit Dasar */}
      {isEditModalOpen && editingCourse && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar border border-white">
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Setelan Kursus</h2>
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nama Kursus</label>
                <input type="text" value={editingCourse.title} onChange={(e) => setEditingCourse({...editingCourse, title: e.target.value})} placeholder="Judul" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" />
              </div>
              <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <button onClick={() => setEditingCourse({...editingCourse, isPublic: !editingCourse.isPublic})} className={`w-12 h-6 rounded-full transition-all relative ${editingCourse.isPublic ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingCourse.isPublic ? 'left-7' : 'left-1'}`}></div>
                </button>
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-900">Izinkan Akses Publik</span>
                  <span className="text-[10px] font-bold text-slate-400">Pengunjung dapat melihat materi tanpa login.</span>
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button onClick={() => setIsEditModalOpen(false)} className="flex-1 font-bold text-slate-400">Batal</button>
                <button onClick={() => { if(isNewCourse) onAddCourse(editingCourse); else onUpdateCourse(editingCourse); setIsEditModalOpen(false); }} className="flex-[2] py-4 bg-violet-600 text-white rounded-2xl font-bold shadow-xl shadow-violet-100 active:scale-95 transition-all">Simpan Perubahan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
