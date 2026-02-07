
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

  const handleCreateNew = () => {
    // Reset kategori ke 'All' agar kursus baru langsung muncul
    setSelectedCategory('All');
    
    const newCourse: Course = {
      id: `course-${Math.random().toString(36).substr(2, 9)}`,
      title: 'Kursus Baru',
      category: 'Design',
      description: 'Klik tombol edit untuk mengubah deskripsi kursus ini.',
      thumbnail: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1000',
      lessons: [],
      author: courses[0]?.author || {
        name: user.username,
        role: 'Instruktur',
        avatar: 'https://i.pravatar.cc/150',
        bio: 'Instruktur kursus ini.',
        rating: '5.0'
      }
    };
    
    onAddCourse(newCourse);
    setEditingCourse(newCourse);
    setIsEditModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, course: Course) => {
    e.stopPropagation();
    setEditingCourse({ ...course });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingCourse) {
      onUpdateCourse(editingCourse);
      setIsEditModalOpen(false);
      setEditingCourse(null);
    }
  };

  const handleDeleteAktion = (e: React.MouseEvent) => {
    e.preventDefault();
    if (editingCourse && window.confirm('Hapus kursus ini secara permanen?')) {
      const idToDelete = editingCourse.id;
      // Step 1: Tutup modal & bersihkan state lokal
      setIsEditModalOpen(false);
      setEditingCourse(null);
      // Step 2: Trigger hapus di parent
      onDeleteCourse(idToDelete);
    }
  };

  const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 640; // Lebih kecil untuk stabilitas payload
        const MAX_HEIGHT = 360;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject("Canvas error");
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6)); // Jpeg dengan kompresi 0.6
      };
      img.onerror = () => reject("Error loading image");
    });
  };

  const handleCourseThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingCourse) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Gambar terlalu besar. Gunakan gambar di bawah 2MB.");
      return;
    }

    setIsCompressing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(reader.result as string);
        setEditingCourse(prev => prev ? { ...prev, thumbnail: compressed } : null);
      } catch (err) {
        alert("Gagal memproses gambar.");
      } finally {
        setIsCompressing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-white font-inter">
      <style>{`
        .course-card-image {
          transition: transform 0.4s ease-out;
          will-change: transform;
        }
        .group:hover .course-card-image {
          transform: scale(1.04);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      <nav className="h-20 bg-white border-b border-violet-100 px-6 md:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 flex items-center justify-center overflow-hidden rounded-xl ${brandLogo ? '' : 'bg-violet-600 shadow-lg'}`}>
            {brandLogo ? <img src={brandLogo} className="w-full h-full object-contain" alt="Logo" /> : <span className="text-white font-black">{brandName.charAt(0).toUpperCase()}</span>}
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">{brandName}</span>
        </div>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <React.Fragment>
              <button onClick={handleCreateNew} className="p-2.5 bg-violet-600 text-white rounded-xl shadow-lg hover:bg-violet-700 transition-all transform active:scale-95 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest px-1">Tambah Kursus</span>
              </button>
              <button onClick={onOpenAdmin} className="hidden sm:block px-5 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl shadow-xl">ADMIN PANEL</button>
            </React.Fragment>
          )}
          <button onClick={onLogout} className="px-5 py-2.5 bg-rose-50 text-rose-500 text-xs font-black rounded-xl hover:bg-rose-100 transition-colors uppercase tracking-widest">LOGOUT</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 bg-white">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">Course Collection</h1>
          <p className="text-slate-500 text-lg font-medium max-w-2xl leading-relaxed">Halo {user.username.split(' ')[0]}, berikut daftar kursus yang tersedia.</p>
        </div>

        <div className="flex items-center gap-3 mb-12 overflow-x-auto no-scrollbar pb-2">
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${selectedCategory === cat ? 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-100' : 'bg-white text-slate-400 border-violet-50 hover:bg-violet-50'}`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredCourses.map(course => {
            const p = getCourseProgress(course);
            return (
              <div key={course.id} onClick={() => onOpenCourse(course)} className="group bg-white rounded-[2.5rem] overflow-hidden border border-violet-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full">
                <div className="relative aspect-video overflow-hidden bg-slate-50">
                  <img src={course.thumbnail} className="course-card-image w-full h-full object-cover" alt={course.title} />
                  <div className="absolute top-6 left-6 z-10"><span className="px-4 py-2 bg-white/90 backdrop-blur rounded-xl text-[10px] font-black text-violet-600 uppercase tracking-widest shadow-lg">{course.category}</span></div>
                  {isAdmin && (
                    <button onClick={(e) => openEditModal(e, course)} className="absolute top-6 right-6 w-10 h-10 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center text-slate-600 opacity-0 group-hover:opacity-100 transition-all z-20">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg>
                    </button>
                  )}
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-violet-600 transition-colors line-clamp-2 leading-tight">{course.title}</h3>
                  <p className="text-slate-500 text-sm font-medium line-clamp-3 mb-8">{course.description}</p>
                  <div className="mt-auto pt-6 border-t border-violet-50 flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{course.lessons.length} Materi</span>
                    {p > 0 && <span className="text-[10px] font-black text-emerald-500 uppercase">{p}% Selesai</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {isEditModalOpen && editingCourse && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Kelola Kursus</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Kursus</label>
                   <input type="text" value={editingCourse.title} onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-slate-50 font-bold border border-slate-100" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                   <input type="text" value={editingCourse.category} onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-slate-50 font-bold border border-slate-100" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Foto Sampul</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-16 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden bg-slate-100">
                    {isCompressing ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-violet-600 border-t-transparent"></div> : <img src={editingCourse.thumbnail} className="w-full h-full object-cover" />}
                  </div>
                  <input type="file" ref={courseThumbnailInputRef} onChange={handleCourseThumbnailUpload} className="hidden" accept="image/*" />
                  <button onClick={() => courseThumbnailInputRef.current?.click()} className="px-4 py-2 bg-violet-50 text-violet-600 rounded-xl text-[10px] font-black uppercase border border-violet-100">Ganti Foto</button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi</label>
                <textarea rows={4} value={editingCourse.description} onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-slate-50 font-medium text-sm border border-slate-100" />
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  type="button"
                  onClick={handleDeleteAktion} 
                  className="px-6 py-4 text-xs font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 rounded-xl transition-colors"
                >
                  Hapus Kursus
                </button>
                <div className="flex-1 flex gap-4">
                  <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 text-sm font-bold text-slate-400">Batal</button>
                  <button onClick={handleSaveEdit} className="flex-[2] py-4 bg-violet-600 text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all">Simpan</button>
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
