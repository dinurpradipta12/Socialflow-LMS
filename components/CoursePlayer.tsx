
import React, { useState, useRef, useEffect } from 'react';
import { Course, Lesson, ProgressState, UserSession, Asset, Author } from '../types';

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
  isSharedMode?: boolean;
  brandName: string;
  setBrandName: (name: string) => void;
  brandLogo: string;
  setBrandLogo: (logo: string) => void;
}

const CoursePlayer: React.FC<CoursePlayerProps> = ({ 
  course, 
  activeLesson, 
  setActiveLesson, 
  onLogout,
  onBackToDashboard,
  user,
  progress,
  toggleLessonComplete,
  onUpdateCourse,
  isSharedMode = false,
  brandName,
  brandLogo
}) => {
  const [activeContentTab, setActiveContentTab] = useState<'overview' | 'assets' | 'notes'>('overview');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Editor States
  const [isEditModalOpen, setIsEditModalOpen] = useState<'lesson' | 'course' | 'mentor' | null>(null);
  const [tempData, setTempData] = useState({ title: '', desc: '', content: '', role: '', avatar: '' });

  const editorRef1 = useRef<HTMLDivElement>(null);
  const editorRef2 = useRef<HTMLDivElement>(null);
  const mentorAvatarInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user.role === 'admin' && !isSharedMode;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + '?share=' + course.id);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const execCommand = (cmd: string, val: string = '') => {
    document.execCommand(cmd, false, val);
  };

  const openEditor = (mode: 'lesson' | 'course' | 'mentor') => {
    if (mode === 'lesson' && activeLesson) {
      setTempData({ ...tempData, desc: activeLesson.description || '', content: activeLesson.content || '' });
    } else if (mode === 'course') {
      setTempData({ ...tempData, desc: course.description || '' });
    } else if (mode === 'mentor' && course.author) {
      setTempData({ 
        title: course.author.name, 
        role: course.author.role, 
        desc: course.author.bio, 
        avatar: course.author.avatar,
        content: '' 
      });
    }
    setIsEditModalOpen(mode);
  };

  const handleSave = () => {
    if (isEditModalOpen === 'lesson' && activeLesson) {
      const updatedLessons = course.lessons.map(l => 
        l.id === activeLesson.id ? { ...l, description: editorRef1.current?.innerHTML || '', content: editorRef2.current?.innerHTML || '' } : l
      );
      onUpdateCourse({ ...course, lessons: updatedLessons });
    } else if (isEditModalOpen === 'course') {
      onUpdateCourse({ ...course, description: editorRef1.current?.innerHTML || '' });
    } else if (isEditModalOpen === 'mentor' && course.author) {
      onUpdateCourse({ 
        ...course, 
        author: { 
          ...course.author, 
          name: tempData.title, 
          role: tempData.role, 
          avatar: tempData.avatar, 
          bio: editorRef1.current?.innerHTML || '' 
        } 
      });
    }
    setIsEditModalOpen(null);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setTempData({ ...tempData, avatar: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const Toolbar = () => (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-white/90 backdrop-blur-md border border-slate-100 rounded-2xl sticky top-0 z-10 mb-3 soft-shadow">
      <button onClick={() => execCommand('bold')} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 font-bold">B</button>
      <button onClick={() => execCommand('italic')} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 italic">I</button>
      <button onClick={() => execCommand('underline')} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 underline">U</button>
      <div className="w-px h-5 bg-slate-200 mx-1" />
      <button onClick={() => execCommand('formatBlock', 'H2')} className="px-2 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 font-black text-xs">H2</button>
      <div className="w-px h-5 bg-slate-200 mx-1" />
      <button onClick={() => execCommand('justifyLeft')} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 21h18v-2H3v2zM3 7V5h18v2H3zm0 7h18v-2H3v2zm0 4h18v-2H3v2z"/></svg></button>
      <button onClick={() => execCommand('justifyCenter')} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6V5h10v2H7z"/></svg></button>
      <button onClick={() => execCommand('justifyRight')} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 21h18v-2H3v2zM3 7V5h18v2H3zm0 7h18v-2H3v2zm0 4h18v-2H3v2z" className="scale-x-[-1] origin-center"/></svg></button>
      <div className="w-px h-5 bg-slate-200 mx-1" />
      <button onClick={() => execCommand('insertUnorderedList')} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg></button>
      <button onClick={() => execCommand('removeFormat')} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-rose-50 text-rose-500"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M13.17 4.83L12.5 4H5v16h2v-6h5.17l.67.83H19V4.83h-5.83z" className="opacity-40"/><path d="M12.71 14l-.71-.71L3.41 4.71 2 6.12l4.88 4.88V21h2v-6h3.17l4.01 4.01 1.41-1.41L12.71 14zm-1.54-1.54L8.83 10.12V7.5l2.34 2.34v2.62z"/></svg></button>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#fafafa] overflow-hidden font-inter">
      {/* Header */}
      <header className="h-24 border-b border-slate-100 bg-white/80 backdrop-blur-xl flex items-center justify-between px-8 md:px-12 flex-shrink-0 z-50">
        <div className="flex items-center gap-8">
          {!isSharedMode && (
            <button onClick={onBackToDashboard} className="w-12 h-12 bg-slate-50 text-slate-400 hover:text-violet-600 rounded-2xl border border-slate-100 flex items-center justify-center transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
          )}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-violet-600 rounded-2xl flex items-center justify-center shadow-xl p-2.5 overflow-hidden">
              {brandLogo ? <img src={brandLogo} className="w-full h-full object-contain" alt="Logo" /> : <svg viewBox="0 0 100 100" className="w-full h-full text-white" fill="currentColor"><path d="M10,10 H90 V90 H30 V30 H70 V70 H50 V50 H40 V80 H80 V20 H20 V100 H0 V0 H100 V100 H0 V80 H10 Z" fillRule="evenodd" /></svg>}
            </div>
            <span className="font-black text-xl tracking-tighter text-slate-900 hidden sm:block">{brandName}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isSharedMode && (
            <React.Fragment>
              <button onClick={() => setShowShareModal(true)} className="px-6 py-3.5 bg-violet-600 text-white rounded-[1.5rem] text-[10px] font-black flex items-center gap-3 shadow-xl uppercase tracking-widest hover:bg-violet-700 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                <span>Share</span>
              </button>
              <button onClick={onLogout} className="px-6 py-3.5 bg-rose-50 text-rose-500 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-rose-100">Exit</button>
            </React.Fragment>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar bg-white">
          <div className="max-w-5xl mx-auto space-y-12">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight">
              {activeLesson ? activeLesson.title : course.title}
            </h1>

            {/* Video / Thumbnail Area */}
            <div className="bg-white rounded-[3.5rem] overflow-hidden border border-slate-100 soft-shadow group relative aspect-video shadow-2xl">
              {activeLesson ? (
                <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${activeLesson.youtubeUrl.split('v=')[1] || activeLesson.youtubeUrl.split('/').pop()}?rel=0&modestbranding=1`} frameBorder="0" allowFullScreen title={activeLesson.title}></iframe>
              ) : (
                <div className="w-full h-full relative overflow-hidden bg-slate-50 flex items-center justify-center">
                  <img src={course.thumbnail} className="w-full h-full object-cover opacity-60" alt="Thumb" />
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <button onClick={() => setActiveLesson(course.lessons[0])} className="w-24 h-24 bg-violet-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform">
                      <svg className="w-10 h-10 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-[3rem] p-10 md:p-14 border border-slate-100 soft-shadow relative">
              {isAdmin && (
                <button 
                  onClick={() => openEditor(activeLesson ? 'lesson' : 'course')}
                  className="absolute top-8 right-8 p-3 bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white rounded-2xl transition-all shadow-sm z-10"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg>
                </button>
              )}

              {!activeLesson ? (
                <div className="space-y-6">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">Course Overview</h3>
                  <div className="text-slate-500 leading-relaxed font-medium text-lg prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: course.description }} />
                </div>
              ) : (
                <div className="space-y-10">
                   <div className="flex gap-10 border-b border-slate-50 overflow-x-auto no-scrollbar">
                    {['overview', 'assets', 'notes'].map(tab => (
                      <button key={tab} onClick={() => setActiveContentTab(tab as any)} className={`pb-6 text-[10px] font-black uppercase tracking-widest relative transition-all ${activeContentTab === tab ? 'text-violet-600' : 'text-slate-300'}`}>
                        {tab}{activeContentTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-violet-600 rounded-full" />}
                      </button>
                    ))}
                  </div>
                  <div className="animate-in fade-in duration-500">
                    {activeContentTab === 'overview' && <div className="text-slate-500 leading-relaxed text-lg font-medium prose prose-violet max-w-none" dangerouslySetInnerHTML={{ __html: activeLesson.description }} />}
                    {activeContentTab === 'notes' && <div className="p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-slate-600 font-medium leading-relaxed prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: activeLesson.content || 'No notes available.' }} />}
                    {activeContentTab === 'assets' && (
                      <div className="grid gap-4">
                        {activeLesson.assets.length > 0 ? activeLesson.assets.map(asset => (
                          <div key={asset.id} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[2rem]">
                            <span className="font-bold text-slate-700">{asset.name}</span>
                            <a href={asset.url} className="px-6 py-2.5 bg-white text-[10px] font-black text-violet-600 uppercase tracking-widest rounded-xl border border-slate-100 shadow-sm">Download</a>
                          </div>
                        )) : <p className="text-slate-400 font-medium text-center py-10">No resources attached.</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <aside className="w-96 bg-white border-l border-slate-100 flex flex-col hidden lg:flex shadow-2xl">
          <div className="p-10 flex-1 overflow-y-auto custom-scrollbar space-y-12">
            {course.author && (
              <div className="bg-violet-50/50 rounded-[3rem] p-8 space-y-6 relative group">
                {isAdmin && (
                   <button 
                    onClick={() => openEditor('mentor')}
                    className="absolute top-4 right-4 w-10 h-10 bg-white text-violet-600 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-violet-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg>
                  </button>
                )}
                <div className="flex items-center gap-5">
                  <img src={course.author.avatar} className="w-16 h-16 rounded-[1.5rem] object-cover ring-4 ring-white shadow-xl" alt="Avatar" />
                  <div>
                    <h4 className="text-lg font-black text-slate-900 leading-tight">{course.author.name}</h4>
                    <p className="text-[10px] text-violet-600 font-black uppercase tracking-widest mt-1">{course.author.role}</p>
                  </div>
                </div>
                <div className="text-xs text-slate-500 font-medium leading-relaxed prose prose-slate prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: course.author.bio }} />
              </div>
            )}

            <div className="space-y-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Curriculum</h3>
              <div className="space-y-3">
                {course.lessons.map((lesson, idx) => (
                  <button key={lesson.id} onClick={() => setActiveLesson(lesson)} className={`w-full flex items-center justify-between p-6 rounded-[2rem] transition-all border ${activeLesson?.id === lesson.id ? 'bg-violet-600 text-white border-violet-600 shadow-xl' : 'bg-white hover:bg-slate-50 border-slate-50'}`}>
                    <div className="flex items-center gap-5 text-left min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${activeLesson?.id === lesson.id ? 'bg-white text-violet-600' : 'bg-violet-100 text-violet-600'}`}>{idx + 1}</div>
                      <span className="text-xs font-bold truncate">{lesson.title}</span>
                    </div>
                    {progress.completedLessons.includes(lesson.id) && <svg className={`w-5 h-5 ${activeLesson?.id === lesson.id ? 'text-white' : 'text-emerald-500'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* MODAL EDITOR */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tighter">
              {isEditModalOpen === 'mentor' ? 'Edit Mentor Profile' : 'Blogger-Style Editor'}
            </h2>
            
            <div className="space-y-8">
              {isEditModalOpen === 'mentor' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Mentor Avatar</label>
                    <div className="flex items-center gap-6">
                       <img src={tempData.avatar} className="w-24 h-24 rounded-[2rem] object-cover ring-4 ring-slate-50 shadow-lg" alt="" />
                       <div className="flex flex-col gap-2">
                          <input type="file" ref={mentorAvatarInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                          <button onClick={() => mentorAvatarInputRef.current?.click()} className="px-5 py-2.5 bg-violet-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-violet-700 transition-all">Ganti Foto</button>
                       </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Full Name</label>
                      <input type="text" value={tempData.title} onChange={e => setTempData({...tempData, title: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Role / Jabatan</label>
                      <input type="text" value={tempData.role} onChange={e => setTempData({...tempData, role: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:outline-none" />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  {isEditModalOpen === 'mentor' ? 'Bio Mentor (Fleksibel)' : 'Overview / Deskripsi'}
                </label>
                <Toolbar />
                <div 
                  ref={editorRef1}
                  contentEditable
                  className="w-full min-h-[200px] p-8 rounded-[2rem] bg-slate-50 border border-slate-100 font-medium text-slate-700 leading-relaxed focus:bg-white focus:ring-4 ring-violet-500/10 focus:outline-none prose prose-violet max-w-none"
                  dangerouslySetInnerHTML={{ __html: tempData.desc }}
                />
              </div>

              {isEditModalOpen === 'lesson' && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes / Materi Detail</label>
                  <Toolbar />
                  <div 
                    ref={editorRef2}
                    contentEditable
                    className="w-full min-h-[250px] p-8 rounded-[2rem] bg-slate-50 border border-slate-100 font-medium text-slate-700 leading-relaxed focus:bg-white focus:ring-4 ring-violet-500/10 focus:outline-none prose prose-violet max-w-none"
                    dangerouslySetInnerHTML={{ __html: tempData.content }}
                  />
                </div>
              )}

              <div className="flex gap-4 pt-6 sticky bottom-0 bg-white/90 backdrop-blur-xl py-4">
                <button onClick={() => setIsEditModalOpen(null)} className="flex-1 py-5 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">Batal</button>
                <button onClick={handleSave} className="flex-[2] py-5 bg-violet-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-violet-700 transition-all active:scale-[0.98]">Simpan Perubahan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-[340px] rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 border border-white flex flex-col items-center">
            <div className="w-16 h-16 bg-violet-600 rounded-[1.5rem] mb-6 flex items-center justify-center text-white p-4 shadow-xl">
               <svg viewBox="0 0 100 100" className="w-full h-full text-white" fill="currentColor"><path d="M10,10 H90 V90 H30 V30 H70 V70 H50 V50 H40 V80 H80 V20 H20 V100 H0 V0 H100 V100 H0 V80 H10 Z" fillRule="evenodd" /></svg>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight text-center">Bagikan Kursus</h2>
            <div className="w-full space-y-4 mt-8">
              <button onClick={handleCopyLink} className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${copySuccess ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                {copySuccess ? 'Link Tersalin!' : 'Salin Link Akses'}
              </button>
              <button onClick={() => setShowShareModal(false)} className="w-full py-4 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-600">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursePlayer;
