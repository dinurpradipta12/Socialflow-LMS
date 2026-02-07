
import React, { useState } from 'react';
import { Course, Lesson } from '../types';

interface AdminPanelProps {
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  onBack: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ courses, setCourses, onBack }) => {
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [managingLessonsCourseId, setManagingLessonsCourseId] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);

  // Form states
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCategory, setCourseCategory] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseThumb, setCourseThumb] = useState('');

  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonVideo, setLessonVideo] = useState('');
  const [lessonDur, setLessonDur] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonType, setLessonType] = useState<'video' | 'text'>('video');

  const handleAddCourse = () => {
    setEditingCourse(null);
    setCourseTitle('');
    setCourseCategory('');
    setCourseDesc('');
    setCourseThumb(`https://picsum.photos/seed/${Math.random()}/800/450`);
    setIsCourseModalOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setCourseTitle(course.title);
    setCourseCategory(course.category);
    setCourseDesc(course.description);
    setCourseThumb(course.thumbnail);
    setIsCourseModalOpen(true);
  };

  const saveCourse = () => {
    if (!courseTitle) return;
    if (editingCourse) {
      setCourses(prev => prev.map(c => c.id === editingCourse.id ? { ...c, title: courseTitle, category: courseCategory, description: courseDesc, thumbnail: courseThumb } : c));
    } else {
      const newCourse: Course = {
        id: `course-${Date.now()}`,
        title: courseTitle,
        category: courseCategory,
        description: courseDesc,
        thumbnail: courseThumb,
        lessons: []
      };
      setCourses(prev => [...prev, newCourse]);
    }
    setIsCourseModalOpen(false);
  };

  const handleDeleteCourse = (id: string) => {
    if (window.confirm('PERINGATAN: Hapus kursus ini beserta seluruh materi di dalamnya?')) {
      setCourses(prev => prev.filter(c => c.id !== id));
    }
  };

  const moveCourse = (index: number, direction: 'up' | 'down') => {
    const newCourses = [...courses];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newCourses.length) return;
    [newCourses[index], newCourses[target]] = [newCourses[target], newCourses[index]];
    setCourses(newCourses);
  };

  const currentManagingCourse = courses.find(c => c.id === managingLessonsCourseId);

  const handleAddLesson = () => {
    setEditingLesson(null);
    setLessonTitle('');
    setLessonVideo('https://www.youtube.com/watch?v=');
    setLessonDur('10');
    setLessonContent('');
    setLessonType('video');
    setIsLessonModalOpen(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonTitle(lesson.title);
    setLessonVideo(lesson.youtubeUrl);
    setLessonDur(lesson.duration);
    setLessonContent(lesson.content);
    setLessonType(lesson.type || 'video');
    setIsLessonModalOpen(true);
  };

  const saveLesson = () => {
    if (!managingLessonsCourseId || !lessonTitle) return;
    setCourses(prev => prev.map(c => {
      if (c.id !== managingLessonsCourseId) return c;
      let newLessons = [...c.lessons];
      const lessonData = {
          title: lessonTitle,
          youtubeUrl: lessonType === 'video' ? lessonVideo : '',
          duration: lessonDur,
          content: lessonContent,
          type: lessonType,
          description: editingLesson?.description || '<p>Isi deskripsi materi di sini.</p>',
          assets: editingLesson?.assets || []
      };

      if (editingLesson) {
        newLessons = newLessons.map(l => l.id === editingLesson.id ? { ...l, ...lessonData } : l);
      } else {
        newLessons.push({ id: `l-${Date.now()}`, ...lessonData });
      }
      return { ...c, lessons: newLessons };
    }));
    setIsLessonModalOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 bg-white">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
        <div className="flex items-center gap-6">
          <button onClick={() => { managingLessonsCourseId ? setManagingLessonsCourseId(null) : onBack(); }} className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-violet-600 shadow-sm transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">{managingLessonsCourseId ? 'Kelola Kurikulum' : 'Pusat Kontrol'}</h1>
            <p className="text-slate-400 font-medium">{managingLessonsCourseId ? `Materi: ${currentManagingCourse?.title}` : 'Kelola kursus, urutan, dan materi belajar.'}</p>
          </div>
        </div>
        {!managingLessonsCourseId ? (
            <button onClick={handleAddCourse} className="bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95">Buat Kursus Baru</button>
        ) : (
            <button onClick={handleAddLesson} className="bg-violet-600 text-white px-8 py-4 rounded-[1.5rem] font-bold shadow-xl shadow-violet-100 hover:bg-violet-700 transition-all active:scale-95">Tambah Materi</button>
        )}
      </header>

      <div className="bg-white rounded-[2.5rem] soft-shadow border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50">
                <tr>
                    <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{managingLessonsCourseId ? 'Materi Pelajaran' : 'Judul Kursus'}</th>
                    {!managingLessonsCourseId && <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Kurikulum</th>}
                    <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {!managingLessonsCourseId ? (
                    courses.map((c, i) => (
                        <tr key={c.id} className="group hover:bg-violet-50/30">
                            <td className="px-8 py-6">
                                <div className="flex items-center gap-6">
                                    <img src={c.thumbnail} className="w-20 h-12 object-cover rounded-xl shadow-sm" alt="" />
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-lg leading-tight">{c.title}</h4>
                                        <p className="text-xs text-slate-400 font-medium truncate max-w-xs">{c.description}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-8 py-6 text-center">
                                <button onClick={() => setManagingLessonsCourseId(c.id)} className="px-5 py-1.5 bg-violet-50 text-violet-600 rounded-full text-xs font-bold hover:bg-violet-100 transition-all">
                                    {c.lessons.length} Pelajaran
                                </button>
                            </td>
                            <td className="px-8 py-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => moveCourse(i, 'up')} disabled={i === 0} className="p-2 text-slate-300 hover:text-violet-600 disabled:opacity-0"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg></button>
                                    <button onClick={() => moveCourse(i, 'down')} disabled={i === courses.length - 1} className="p-2 text-slate-300 hover:text-violet-600 disabled:opacity-0"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                                    <button onClick={() => handleEditCourse(c)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-white rounded-xl transition-all shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg></button>
                                    <button onClick={() => handleDeleteCourse(c.id)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
                                </div>
                            </td>
                        </tr>
                    ))
                ) : (
                    currentManagingCourse?.lessons.map((l, i) => (
                        <tr key={l.id} className="group hover:bg-violet-50/30">
                            <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 text-xs font-extrabold">
                                        {l.type === 'text' ? (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        ) : (i + 1)}
                                    </div>
                                    <div className="flex flex-col">
                                        <h4 className="font-bold text-slate-800">{l.title}</h4>
                                        <span className="text-[9px] font-black text-violet-400 uppercase tracking-tighter">{l.type || 'video'} material</span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => handleEditLesson(l)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-white rounded-xl transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg></button>
                                    <button onClick={() => { 
                                      if(window.confirm('Hapus?')) {
                                        setCourses(prev => prev.map(c => c.id === managingLessonsCourseId ? { ...c, lessons: c.lessons.filter(item => item.id !== l.id) } : c));
                                      }
                                    }} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>

      {/* Course Modal */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
            <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 border border-white animate-in zoom-in-95 duration-200 shadow-2xl">
                <h2 className="text-2xl font-extrabold text-slate-900 mb-8 tracking-tight">{editingCourse ? 'Edit Kursus' : 'Kursus Baru'}</h2>
                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Judul Kursus</label>
                        <input type="text" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-violet-500/10 font-bold text-slate-800" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Kategori</label>
                        <input type="text" value={courseCategory} onChange={(e) => setCourseCategory(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-violet-500/10 font-bold text-slate-800" placeholder="e.g. UI / UX Design" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Deskripsi</label>
                        <textarea rows={3} value={courseDesc} onChange={(e) => setCourseDesc(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-violet-500/10 font-medium text-slate-600" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Thumbnail URL</label>
                        <input type="text" value={courseThumb} onChange={(e) => setCourseThumb(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-violet-500/10 font-medium text-slate-600" />
                    </div>
                    <div className="pt-6 flex justify-end gap-4">
                        <button onClick={() => setIsCourseModalOpen(false)} className="px-8 py-3.5 font-bold text-slate-400 hover:text-slate-600 transition-colors">Batal</button>
                        <button onClick={saveCourse} className="px-10 py-3.5 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200">Simpan Kursus</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Lesson Modal */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 border border-white animate-in zoom-in-95 duration-200 shadow-2xl">
                <h2 className="text-2xl font-extrabold text-slate-900 mb-8 tracking-tight">{editingLesson ? 'Edit Materi' : 'Materi Baru'}</h2>
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 block">Tipe Konten</label>
                        <div className="flex gap-2">
                             <button onClick={() => setLessonType('video')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all border ${lessonType === 'video' ? 'bg-violet-600 text-white border-violet-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>Video YouTube</button>
                             <button onClick={() => setLessonType('text')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all border ${lessonType === 'text' ? 'bg-violet-600 text-white border-violet-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>Halaman Catatan</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Judul Materi</label>
                            <input type="text" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-violet-500/10 font-bold text-slate-800" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Durasi (Menit)</label>
                            <input type="text" value={lessonDur} onChange={(e) => setLessonDur(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-violet-500/10 font-bold text-slate-800" />
                        </div>
                    </div>
                    {lessonType === 'video' ? (
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">YouTube Video Link</label>
                            <input type="text" value={lessonVideo} onChange={(e) => setLessonVideo(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-violet-500/10 font-medium text-violet-600" />
                        </div>
                    ) : (
                        <div className="p-6 bg-violet-50 rounded-2xl border border-violet-100">
                             <p className="text-sm font-bold text-violet-600 leading-tight flex items-center gap-3">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Isi konten teks dapat diedit secara visual melalui editor teks detail saat melihat kursus sebagai instruktur.
                             </p>
                        </div>
                    )}
                </div>
                <div className="pt-8 flex justify-end gap-4">
                    <button onClick={() => setIsLessonModalOpen(false)} className="px-8 py-3.5 font-bold text-slate-400 hover:text-slate-600 transition-colors">Batal</button>
                    <button onClick={saveLesson} className="px-10 py-3.5 bg-violet-600 text-white rounded-2xl font-bold shadow-xl shadow-violet-100">Simpan Materi</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
