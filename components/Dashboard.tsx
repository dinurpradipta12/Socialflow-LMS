
import React, { useState, useRef } from 'react';
import { Course, UserSession, ProgressState, Author } from '../types';
import ImageCropperModal from './ImageCropperModal';

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
  
  // Cropper States
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  
  const courseThumbnailInputRef = useRef<HTMLInputElement>(null);

  const categories = ['All', ...new Set(courses.map(c => c.category).filter(Boolean))];

  const filteredCourses = selectedCategory === 'All' 
    ? courses 
    : courses.filter(c => c.category === selectedCategory);

  const getCourseProgress = (course: Course) => {
    if (!course.lessons || course.lessons.length === 0) return 0;
    const completed = course.lessons.filter(l => progress.completedLessons.includes(l.id)).length;
    return Math.round((completed / course.lessons.length) * 100);
  };

  const handleCreateNew = () => {
    const defaultAuthor: Author = courses[0]?.author || {
      name: user.username,
      role: 'Instructor',
      avatar: 'https://i.pravatar.cc/150',
      bio: 'Professional Instructor at Arunika.',
      rating: '5.0'
    };

    const newCourse: Course = {
      id: `course-${Date.now()}`,
      title: 'Judul Kursus Baru',
      category: 'Design',
      description: '<p>Deskripsi kursus baru yang menarik.</p>',
      thumbnail: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1000',
      lessons: [],
      author: defaultAuthor
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

  const handleCourseThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropperSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedBase64: string) => {
    if (editingCourse) {
      setEditingCourse({ ...editingCourse, thumbnail: croppedBase64 });
    }
    setCropperSrc(null);
  };

  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-white font-inter">
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
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">Course Template Collection</h1>
          <p className="text-slate-500 text-lg font-medium max-w-2xl leading-relaxed">Kelola dan kembangkan materi pembelajaran interaktif Anda di sini.</p>
        </div>

        <div className="flex items-center gap-3 mb-12 overflow-x-auto no-scrollbar pb-2">
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border shadow-sm ${selectedCategory === cat ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-400 border-violet-100 hover:bg-violet-50'}`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredCourses.map(course => {
            const p = getCourseProgress(course);
            return (
              <div key={course.id} onClick={() => onOpenCourse(course)} className="group bg-white rounded-[2.5rem] overflow-hidden border border-violet-100 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer flex flex-col h-full relative">
                <div className="relative aspect-video overflow-hidden">
                  <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={course.title} />
                  <div className="absolute top-6 left-6"><span className="px-4 py-2 bg-white/90 backdrop-blur rounded-xl text-[10px] font-black text-violet-600 uppercase tracking-widest shadow-lg">{course.category}</span></div>
                  {isAdmin && (
                    <button onClick={(e) => openEditModal(e, course)} className="absolute top-6 right-6 w-10 h-10 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center text-slate-600 opacity-0 group-hover:opacity-100 transition-all z-10"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg></button>
                  )}
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-violet-600 transition-colors line-clamp-2 leading-tight">{course.title}</h3>
                  <div className="text-slate-500 text-sm font-medium line-clamp-3 mb-8 prose-sm" dangerouslySetInnerHTML={{ __html: course.description }} />
                  <div className="mt-auto pt-6 border-t border-violet-50 flex items-center justify-between">
                    <div className="flex items-center gap-3"><span className="text-xs font-black text-slate-400 uppercase tracking-widest">{course.lessons?.length || 0} Pelajaran</span></div>
                    {p > 0 && <span className="text-[10px] font-black text-emerald-500 uppercase">{p}% Complete</span>}
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
                   <input type="text" value={editingCourse.title} onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-slate-50 font-bold border border-slate-100 focus:outline-none focus:ring-4 focus:ring-violet-500/10" placeholder="Judul" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                   <input type="text" value={editingCourse.category} onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-slate-50 font-bold border border-slate-100 focus:outline-none focus:ring-4 focus:ring-violet-500/10" placeholder="Kategori" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thumbnail Kursus</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-16 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 shadow-inner">
                    {editingCourse.thumbnail ? (
                      <img src={editingCourse.thumbnail} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <span className="text-slate-300 font-bold">?</span>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={courseThumbnailInputRef} 
                    onChange={handleCourseThumbnailUpload} 
                    className="hidden" 
                    accept="image/*"
                  />
                  <button 
                    onClick={() => courseThumbnailInputRef.current?.click()} 
                    className="px-4 py-2 bg-violet-50 text-violet-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-100 transition-all border border-violet-100"
                  >
                    Upload Foto
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi Singkat</label>
                <textarea rows={4} value={editingCourse.description} onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-slate-50 font-medium text-sm border border-slate-100 leading-relaxed focus:outline-none focus:ring-4 focus:ring-violet-500/10" placeholder="Deskripsi" />
              </div>

              <div className="flex gap-4 pt-6">
                <button onClick={() => { if(window.confirm('Hapus kursus ini secara permanen?')) { onDeleteCourse(editingCourse.id); setIsEditModalOpen(false); }}} className="px-6 py-4 text-xs font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 rounded-xl transition-colors">Hapus Kursus</button>
                <div className="flex-1 flex gap-4"><button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 text-sm font-bold text-slate-400 hover:text-slate-600">Batal</button><button onClick={handleSaveEdit} className="flex-[2] py-4 bg-violet-600 text-white rounded-2xl font-bold shadow-xl active:scale-[0.98] transition-all hover:bg-violet-700">Simpan Perubahan</button></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Image Cropper Modal */}
      {cropperSrc && (
        <ImageCropperModal 
          imageSrc={cropperSrc} 
          aspectRatio={16/9} 
          onCropComplete={onCropComplete} 
          onCancel={() => setCropperSrc(null)} 
          title="Potong Thumbnail Kursus"
        />
      )}
    </div>
  );
};

export default Dashboard;
