
import React, { useState, useRef } from 'react';
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
  courses, 
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
  const [isCompressing, setIsCompressing] = useState(false);
  
  const courseThumbnailInputRef = useRef<HTMLInputElement>(null);

  const categories = ['All', ...new Set(courses.map(c => c.category).filter(Boolean))];

  const filteredCourses = selectedCategory === 'All' 
    ? courses 
    : courses.filter(c => c.category === selectedCategory);

  const getCourseProgress = (course: Course) => {
    if (course.lessons.length === 0) return 0;
    const completed = course.lessons.filter(l => progress.completedLessons.includes(l.id)).length;
    return Math.round((completed / course.lessons.length) * 100);
  };

  const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject("Canvas Error");
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/jpeg', 0.4));
      };
      img.onerror = () => reject("Load Error");
    });
  };

  const handleCourseThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingCourse) return;

    setIsCompressing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(reader.result as string);
        setEditingCourse(prev => prev ? { ...prev, thumbnail: compressed } : null);
      } catch (err) {
        alert("Gagal kompres foto.");
      } finally {
        setIsCompressing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateNew = () => {
    const newCourse: Course = {
      id: `course-${Date.now()}`,
      title: 'Judul Kursus Baru',
      category: 'Design',
      description: 'Deskripsi kursus baru yang menarik.',
      thumbnail: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1000',
      lessons: [],
      author: courses[0]?.author || {
        name: user.username,
        role: 'Mentor',
        avatar: 'https://i.pravatar.cc/150',
        bio: 'Instruktur kelas.',
        rating: '5.0'
      }
    };
    onAddCourse(newCourse);
    setEditingCourse(newCourse);
    setIsEditModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-inter">
      <nav className="h-20 bg-white border-b border-slate-100 px-6 md:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-xl bg-violet-600 shadow-lg">
            {brandLogo ? <img src={brandLogo} className="w-full h-full object-contain" /> : <span className="text-white font-black">{brandName.charAt(0)}</span>}
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">{brandName}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {user.role === 'admin' && (
            <>
              <button 
                onClick={onOpenAdmin} 
                className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                <span className="hidden lg:block text-xs font-black uppercase tracking-widest">Pusat Kontrol</span>
              </button>
              <button 
                onClick={handleCreateNew} 
                className="p-2.5 bg-violet-600 text-white rounded-xl shadow-lg flex items-center gap-2 hover:bg-violet-700 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="3"/></svg>
                <span className="hidden lg:block text-xs font-black uppercase tracking-widest">Tambah</span>
              </button>
            </>
          )}
          <div className="h-8 w-px bg-slate-100 mx-1 hidden sm:block"></div>
          <button onClick={onLogout} className="px-5 py-2.5 bg-rose-50 text-rose-500 text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-rose-100 transition-colors">LOGOUT</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Header Section */}
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Halo, <span className="text-violet-600">{user.username.split(' ')[0]}!</span> 👋
          </h2>
          <p className="text-slate-400 mt-3 font-medium text-lg max-w-2xl">
            Disini adalah kumpulan halaman LMS dari template yang kamu punya.
          </p>
        </div>

        <div className="flex items-center gap-3 mb-12 overflow-x-auto no-scrollbar pb-2">
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border shrink-0 ${selectedCategory === cat ? 'bg-violet-600 text-white border-violet-600 shadow-xl shadow-violet-100' : 'bg-white text-slate-400 border-slate-100 hover:bg-violet-50'}`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map(course => (
            <div key={course.id} onClick={() => onOpenCourse(course)} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col h-full group">
              <div className="aspect-video relative overflow-hidden bg-slate-100">
                <img src={course.thumbnail} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                {user.role === 'admin' && (
                  <button onClick={(e) => { e.stopPropagation(); setEditingCourse({...course}); setIsEditModalOpen(true); }} className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur rounded-xl text-slate-600 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:text-violet-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg>
                  </button>
                )}
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-violet-600 transition-colors">{course.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-6">{course.description}</p>
                <div className="mt-auto flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>{course.lessons.length} Pelajaran</span>
                  {getCourseProgress(course) > 0 && <span className="text-emerald-500">{getCourseProgress(course)}% Selesai</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {isEditModalOpen && editingCourse && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Edit Kursus</h2>
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Judul Kursus</label>
                <input type="text" value={editingCourse.title} onChange={(e) => setEditingCourse({...editingCourse, title: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" placeholder="Judul" />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Kategori</label>
                <input type="text" value={editingCourse.category} onChange={(e) => setEditingCourse({...editingCourse, category: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" placeholder="Contoh: Design, Programming, Marketing" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Thumbnail Kelas</label>
                <div className="flex gap-4 items-center">
                  <div className="w-24 h-16 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                     {isCompressing ? <div className="flex items-center justify-center h-full animate-spin">...</div> : <img src={editingCourse.thumbnail} className="w-full h-full object-cover" />}
                  </div>
                  <input type="file" ref={courseThumbnailInputRef} className="hidden" accept="image/*" onChange={handleCourseThumbnailUpload} />
                  <button onClick={() => courseThumbnailInputRef.current?.click()} className="px-5 py-2 bg-violet-50 text-violet-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-violet-100">Ganti Foto</button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Deskripsi</label>
                <textarea rows={4} value={editingCourse.description} onChange={(e) => setEditingCourse({...editingCourse, description: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-medium" />
              </div>
              <div className="flex gap-4 pt-6">
                <button onClick={() => { if(confirm('Hapus?')) { onDeleteCourse(editingCourse.id); setIsEditModalOpen(false); }}} className="px-6 py-4 text-rose-500 font-black text-xs uppercase tracking-widest hover:bg-rose-50 rounded-xl transition-colors">Hapus</button>
                <div className="flex-1 flex gap-4">
                   <button onClick={() => setIsEditModalOpen(false)} className="flex-1 font-bold text-slate-400">Batal</button>
                   <button onClick={() => { onUpdateCourse(editingCourse); setIsEditModalOpen(false); }} className="flex-[2] py-4 bg-violet-600 text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all">Simpan</button>
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
