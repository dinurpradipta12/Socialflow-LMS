
import React, { useState, useEffect } from 'react';
import { Course, Lesson, ProgressState, UserSession, Asset } from '../types';
import ShareModal from './ShareModal';

interface CoursePlayerProps {
  course: Course;
  courses: Course[];
  activeLesson: Lesson | null;
  setActiveLesson: (lesson: Lesson | null) => void;
  onSelectCourse: (course: Course) => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onBackToDashboard: () => void;
  user: UserSession;
  progress: ProgressState;
  toggleLessonComplete: (lessonId: string) => void;
  onUpdateCourse: (updatedCourse: Course) => void;
  brandName: string;
  brandLogo: string;
  onUpdateBrand: (name: string, logo: string) => void;
}

const CoursePlayer: React.FC<CoursePlayerProps> = ({ 
  course, 
  activeLesson, 
  setActiveLesson, 
  onLogout,
  onBackToDashboard,
  user,
  brandName,
  brandLogo,
  onUpdateCourse,
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [tempAuthor, setTempAuthor] = useState(course.author || { name: '', role: '', avatar: '', bio: '', rating: '5.0', instagram: '', tiktok: '', linkedin: '', website: '' });
  const isAdmin = (user?.role === 'admin') || (user?.username === 'admin1@arunika.com');

  // Curriculum / Lesson editor
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLessonIndex, setEditingLessonIndex] = useState<number | null>(null);
  const emptyLesson = { id: `l-${Date.now()}`, title: '', description: '', youtubeUrl: '', duration: '', content: '', assets: [] };
  const [tempLesson, setTempLesson] = useState<any>(emptyLesson);

  const openAddLesson = () => {
    setEditingLessonIndex(null);
    setTempLesson({ ...emptyLesson, id: `l-${Math.random().toString(36).slice(2,9)}` });
    setIsLessonModalOpen(true);
  };

  const openEditLesson = (idx: number) => {
    setEditingLessonIndex(idx);
    setTempLesson({ ...course.lessons[idx] });
    setIsLessonModalOpen(true);
  };

  const saveLesson = () => {
    const updated = { ...course } as Course;
    if (!Array.isArray(updated.lessons)) updated.lessons = [];
    if (editingLessonIndex === null) {
      updated.lessons = [...updated.lessons, tempLesson];
    } else {
      updated.lessons = updated.lessons.map((l, i) => i === editingLessonIndex ? tempLesson : l);
    }
    onUpdateCourse && onUpdateCourse(updated);
    setIsLessonModalOpen(false);
  };

  const removeLesson = (idx: number) => {
    if (!confirm('Hapus materi ini?')) return;
    const updated = { ...course } as Course;
    updated.lessons = updated.lessons.filter((_, i) => i !== idx);
    onUpdateCourse && onUpdateCourse(updated);
  };

  const addAssetToTemp = () => {
    const newAsset = { id: `a-${Math.random().toString(36).slice(2,9)}`, name: '', url: '', type: 'file' };
    setTempLesson((t: any) => ({ ...t, assets: [...(t.assets || []), newAsset] }));
  };

  const updateTempAsset = (assetId: string, field: string, value: any) => {
    setTempLesson((t: any) => ({ ...t, assets: (t.assets || []).map((a: any) => a.id === assetId ? { ...a, [field]: value } : a) }));
  };

  const removeTempAsset = (assetId: string) => {
    setTempLesson((t: any) => ({ ...t, assets: (t.assets || []).filter((a: any) => a.id !== assetId) }));
  };

  // Helper untuk mendapatkan YouTube Embed URL yang aman
  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return null;
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      const videoId = (match && match[2].length === 11) ? match[2] : null;
      return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1` : null;
    } catch (e) {
      return null;
    }
  };

  // LINK GENERATOR: Menghasilkan link dalam bentuk ?course=ID atau ?course=ID&lesson=ID
  const shareLink = activeLesson 
    ? `${window.location.origin}${window.location.pathname}?course=${course.id}&lesson=${activeLesson.id}`
    : `${window.location.origin}${window.location.pathname}?course=${course.id}`;

  const embedUrl = activeLesson ? getYoutubeEmbedUrl(activeLesson.youtubeUrl) : null;

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden font-inter">
      <header className="h-20 border-b border-violet-100 bg-white flex items-center justify-between px-6 md:px-10 flex-shrink-0 z-50">
        <div className="flex items-center gap-6">
          <button onClick={onBackToDashboard} className="p-2.5 bg-violet-50 text-violet-400 hover:text-violet-600 rounded-xl border border-violet-100 shadow-sm transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center">
              {brandLogo ? <img src={brandLogo} className="w-full h-full object-contain" alt="Logo" /> : <div className="w-full h-full bg-violet-600 flex items-center justify-center text-white font-black">{brandName ? brandName.charAt(0) : 'A'}</div>}
            </div>
            <span className="font-bold text-slate-900 hidden sm:block">{brandName}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowShareModal(true)} className="px-5 py-2.5 bg-violet-50 text-violet-600 rounded-xl text-xs font-black flex items-center gap-2 border border-violet-100 uppercase tracking-widest transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
            <span>Bagikan</span>
          </button>
          <button onClick={onLogout} className="px-5 py-2.5 bg-rose-50 text-rose-500 text-[10px] font-black rounded-xl border border-rose-100 uppercase tracking-widest transition-all">Logout</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar bg-white">
          <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
              {activeLesson ? activeLesson.title : course.title}
            </h1>
            
            {embedUrl ? (
              <div className="aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl">
                 <iframe 
                   className="w-full h-full" 
                   src={embedUrl} 
                   frameBorder="0" 
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                   allowFullScreen
                 ></iframe>
              </div>
            ) : (
              <div className="aspect-video bg-slate-50 rounded-[2rem] flex items-center justify-center border border-violet-100 overflow-hidden">
                 {course.introThumbnail || course.thumbnail ? (
                   <img src={course.introThumbnail || course.thumbnail} className="w-full h-full object-cover opacity-60" alt="" />
                 ) : (
                   <div className="text-slate-300 flex flex-col items-center gap-2">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="font-bold text-xs">Pilih materi untuk memulai</span>
                   </div>
                 )}
              </div>
            )}
            
            <div className="bg-white rounded-[2.5rem] p-8 border border-violet-50 prose prose-violet max-w-none shadow-sm">
               <div dangerouslySetInnerHTML={{ __html: activeLesson?.content || course.description }}></div>
               
               {activeLesson?.assets && activeLesson.assets.length > 0 && (
                 <div className="mt-12 pt-10 border-t border-violet-50">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Materi Pendukung</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {activeLesson.assets.map(asset => (
                         <a key={asset.id} href={asset.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-violet-50 hover:border-violet-100 transition-all group">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-violet-600 shadow-sm">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                            </div>
                            <span className="font-bold text-slate-700 text-sm flex-1 truncate">{asset.name}</span>
                         </a>
                       ))}
                    </div>
                 </div>
               )}
            </div>
          </div>
        </main>
        
        <aside className="hidden lg:flex w-96 border-l border-violet-100 bg-white flex-col">
          <div className="p-8 border-b border-violet-50 bg-slate-50/30">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Kurikulum Kelas</h3>
               {isAdmin && (
                 <button onClick={openAddLesson} className="px-3 py-1.5 bg-white text-violet-600 rounded-lg border border-violet-100 text-xs font-bold">+ Tambah Materi</button>
               )}
             </div>
             <div className="space-y-2">
                {course.lessons.map((lesson, i) => (
                  <div key={lesson.id} className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all ${activeLesson?.id === lesson.id ? 'bg-violet-600 text-white shadow-xl shadow-violet-200' : 'hover:bg-violet-50 text-slate-600'}`}>
                    <button onClick={() => setActiveLesson(lesson)} className="flex items-center gap-4 flex-1 text-left">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${activeLesson?.id === lesson.id ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>{i + 1}</div>
                      <span className="font-bold text-sm leading-snug line-clamp-2">{lesson.title}</span>
                    </button>
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditLesson(i)} className="p-2 bg-white text-slate-500 hover:text-violet-600 rounded-lg border border-slate-100">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg>
                        </button>
                        <button onClick={() => removeLesson(i)} className="p-2 bg-white text-rose-500 hover:bg-rose-50 rounded-lg border border-slate-100">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2"/></svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
             </div>
          </div>

          <div className="p-8 mt-auto border-t border-violet-50 bg-slate-50/50">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mentor Kelas</h3>
                {isAdmin && (
                   <button onClick={() => { setTempAuthor(course.author || tempAuthor); setIsMentorModalOpen(true); }} className="p-2 bg-white text-violet-400 hover:text-violet-600 rounded-lg shadow-sm border border-violet-100 transition-all">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg>
                   </button>
                )}
             </div>
             <div className="flex gap-4 items-center">
                <img src={course.author?.avatar || 'https://i.pravatar.cc/150'} className="w-14 h-14 rounded-2xl object-cover shadow-lg ring-2 ring-white" alt="Avatar" />
                <div className="flex-1 min-w-0">
                   <h4 className="font-black text-slate-900 truncate text-sm">{course.author?.name || 'Mentor Name'}</h4>
                   <p className="text-violet-600 text-[10px] font-bold uppercase tracking-wider mt-0.5 truncate">{course.author?.role || 'Expertise'}</p>
                </div>
             </div>

             <div className="flex flex-wrap gap-2 mt-4">
                {course.author?.instagram && <a href={`https://instagram.com/${course.author.instagram}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-white rounded-lg text-slate-400 hover:text-pink-500 border border-slate-100 transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></a>}
                {course.author?.tiktok && <a href={`https://tiktok.com/@${course.author.tiktok}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-white rounded-lg text-slate-400 hover:text-black border border-slate-100 transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.81.33-.85.51-1.44 1.43-1.58 2.41-.08.4-.07.82-.01 1.22.15 1.02.9 1.97 1.81 2.39 1.02.46 2.26.27 3.1-.46.51-.41.83-1.01.91-1.66.06-.68.03-1.37.03-2.05V0z"/></svg></a>}
                {course.author?.linkedin && <a href={course.author.linkedin} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-white rounded-lg text-slate-400 hover:text-blue-600 border border-slate-100 transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg></a>}
                {course.author?.website && (
                  <a href={course.author.website} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-white text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-violet-600 border border-slate-100 rounded-lg flex items-center transition-all shadow-sm">
                    Template Lainnya
                  </a>
                )}
             </div>
          </div>
        </aside>
      </div>

      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          course={course}
          activeLesson={activeLesson}
          brandName={brandName}
        />
      )}

      {isMentorModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-white overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-blue-50">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900">Edit Mentor Kelas</h2>
                <button onClick={() => setIsMentorModalOpen(false)} className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-8 max-h-96 overflow-y-auto space-y-6">
              {/* Avatar */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Foto Avatar (URL)</label>
                <input 
                  type="text" 
                  value={tempAuthor.avatar || ''} 
                  onChange={(e) => setTempAuthor({ ...tempAuthor, avatar: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 text-sm"
                  placeholder="https://..."
                />
              </div>

              {/* Nama */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nama Mentor</label>
                <input 
                  type="text" 
                  value={tempAuthor.name || ''} 
                  onChange={(e) => setTempAuthor({ ...tempAuthor, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 text-sm"
                  placeholder="Nama lengkap"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Jabatan/Keahlian</label>
                <input 
                  type="text" 
                  value={tempAuthor.role || ''} 
                  onChange={(e) => setTempAuthor({ ...tempAuthor, role: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 text-sm"
                  placeholder="Contoh: Senior Developer"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Bio</label>
                <textarea 
                  value={tempAuthor.bio || ''} 
                  onChange={(e) => setTempAuthor({ ...tempAuthor, bio: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 text-sm h-24 resize-none"
                  placeholder="Deskripsi singkat mentor"
                />
              </div>

              {/* Social Media */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Instagram</label>
                  <input 
                    type="text" 
                    value={tempAuthor.instagram || ''} 
                    onChange={(e) => setTempAuthor({ ...tempAuthor, instagram: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 text-sm"
                    placeholder="username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">TikTok</label>
                  <input 
                    type="text" 
                    value={tempAuthor.tiktok || ''} 
                    onChange={(e) => setTempAuthor({ ...tempAuthor, tiktok: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 text-sm"
                    placeholder="username"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">LinkedIn</label>
                  <input 
                    type="text" 
                    value={tempAuthor.linkedin || ''} 
                    onChange={(e) => setTempAuthor({ ...tempAuthor, linkedin: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 text-sm"
                    placeholder="URL profile"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Website</label>
                  <input 
                    type="text" 
                    value={tempAuthor.website || ''} 
                    onChange={(e) => setTempAuthor({ ...tempAuthor, website: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 text-sm"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Rating</label>
                <input 
                  type="number" 
                  min="0"
                  max="5"
                  step="0.1"
                  value={tempAuthor.rating || '5.0'} 
                  onChange={(e) => setTempAuthor({ ...tempAuthor, rating: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 text-sm"
                  placeholder="0-5"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
              <button
                onClick={() => setIsMentorModalOpen(false)}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-bold text-sm transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onUpdateCourse({ ...course, author: tempAuthor });
                  setIsMentorModalOpen(false);
                }}
                className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm transition-colors"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursePlayer;
