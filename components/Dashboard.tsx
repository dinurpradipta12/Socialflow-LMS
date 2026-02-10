
import React, { useState, useRef } from 'react';
import { Course, UserSession, ProgressState, Author, Lesson } from '../types';

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
  onDeleteCourse,
  progress,
  brandName,
  brandLogo
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewCourse, setIsNewCourse] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  
  const courseThumbnailInputRef = useRef<HTMLInputElement>(null);
  const isDev = user.role === 'developer';

  const accessibleCourses = isDev ? courses : courses.filter(c => c.isPublic);
  const categories = ['All', ...new Set(accessibleCourses.map(c => c.category))];
  const filteredCourses = selectedCategory === 'All' ? accessibleCourses : accessibleCourses.filter(c => c.category === selectedCategory);

  const handleCopyLink = (e: React.MouseEvent, course: Course) => {
    e.stopPropagation();
    const link = `${window.location.origin}${window.location.pathname}?course=${course.id}`;
    navigator.clipboard.writeText(link);
    setCopyStatus(course.id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const handleTogglePublic = (e: React.MouseEvent, course: Course) => {
    e.stopPropagation();
    onUpdateCourse({ ...course, isPublic: !course.isPublic });
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
          {isDev && (
            <>
              <button onClick={onOpenAdmin} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                <span className="hidden lg:block text-xs font-black uppercase tracking-widest">Admin</span>
              </button>
              <button onClick={() => { setIsNewCourse(true); setEditingCourse({ id: `course-${Date.now()}`, title: '', category: '', description: '', thumbnail: '', lessons: [], isPublic: false }); setIsEditModalOpen(true); }} className="p-2.5 bg-violet-600 text-white rounded-xl shadow-lg flex items-center gap-2 hover:bg-violet-700 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="3"/></svg>
                <span className="hidden lg:block text-xs font-black uppercase tracking-widest">Tambah</span>
              </button>
            </>
          )}
          <button onClick={onLogout} className="px-5 py-2.5 bg-rose-50 text-rose-500 text-[10px] font-black rounded-xl uppercase tracking-widest">LOGOUT</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Halo, {user.username.split(' ')[0]}!</h2>
          <p className="text-slate-400 mt-3 font-medium text-lg">{isDev ? 'Kelola akses dan tautan unik kursus Anda.' : 'Akses katalog belajar premium Anda.'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map(course => (
            <div key={course.id} onClick={() => onOpenCourse(course)} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col h-full group relative">
              
              {/* Badge Status & Link Manager (Hanya Dev) */}
              {isDev && (
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                  <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${course.isPublic ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full bg-white ${course.isPublic ? 'animate-pulse' : ''}`}></div>
                    {course.isPublic ? 'Live' : 'Hidden'}
                  </div>
                </div>
              )}

              <div className="aspect-video relative overflow-hidden bg-slate-100">
                <img src={course.thumbnail} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="" />
                
                {isDev && (
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <button onClick={(e) => handleCopyLink(e, course)} className={`p-3 rounded-xl shadow-lg transition-all ${copyStatus === course.id ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 hover:text-emerald-500'}`}>
                      {copyStatus === course.id ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      )}
                    </button>
                    <button onClick={(e) => handleTogglePublic(e, course)} className={`p-3 rounded-xl shadow-lg transition-all ${course.isPublic ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 hover:text-emerald-500'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setEditingCourse({...course}); setIsNewCourse(false); setIsEditModalOpen(true); }} className="p-3 bg-white text-slate-600 rounded-xl shadow-lg hover:text-violet-600 transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-violet-600">{course.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-6">{course.description}</p>
                <div className="mt-auto flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>{course.lessons.length} Lesson</span>
                  <span className="text-violet-600">ID: {course.id.slice(-6).toUpperCase()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal Edit Dasar */}
      {isEditModalOpen && editingCourse && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Setelan Kursus</h2>
            <div className="space-y-6">
              <input type="text" value={editingCourse.title} onChange={(e) => setEditingCourse({...editingCourse, title: e.target.value})} placeholder="Judul" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" />
              <input type="text" value={editingCourse.category} onChange={(e) => setEditingCourse({...editingCourse, category: e.target.value})} placeholder="Kategori" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" />
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <button onClick={() => setEditingCourse({...editingCourse, isPublic: !editingCourse.isPublic})} className={`w-12 h-6 rounded-full transition-all relative ${editingCourse.isPublic ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingCourse.isPublic ? 'left-7' : 'left-1'}`}></div>
                </button>
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Diterbitkan ke Publik</span>
              </div>
              <div className="flex gap-4 pt-6">
                {!isNewCourse && (
                  <button onClick={() => { if(confirm('Hapus kursus?')) onDeleteCourse(editingCourse.id); setIsEditModalOpen(false); }} className="px-6 py-4 text-rose-500 font-black text-xs uppercase tracking-widest">Hapus</button>
                )}
                <div className="flex-1 flex gap-4">
                  <button onClick={() => setIsEditModalOpen(false)} className="flex-1 font-bold text-slate-400">Batal</button>
                  <button onClick={() => { if (isNewCourse) onAddCourse(editingCourse); else onUpdateCourse(editingCourse); setIsEditModalOpen(false); }} className="flex-[2] py-4 bg-violet-600 text-white rounded-2xl font-bold shadow-xl">Simpan</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
