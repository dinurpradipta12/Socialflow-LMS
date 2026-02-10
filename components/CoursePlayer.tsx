
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
  brandLogo: string;
  onUpdateBrand: (name: string, logo: string) => void;
}

const CoursePlayer: React.FC<CoursePlayerProps> = ({ 
  course, 
  activeLesson, 
  setActiveLesson, 
  onLogout,
  onOpenAdmin,
  onBackToDashboard,
  user,
  progress,
  toggleLessonComplete,
  onUpdateCourse,
  isSharedMode = false,
  brandName,
  brandLogo,
  onUpdateBrand
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEditingBrand, setIsEditingBrand] = useState(false);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isIntroModalOpen, setIsIntroModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const [tempBrandName, setTempBrandName] = useState(brandName);
  const [tempBrandLogo, setTempBrandLogo] = useState(brandLogo);
  
  const [introTitle, setIntroTitle] = useState(course.title);
  const [introDesc, setIntroDesc] = useState(course.description);
  const [introImg, setIntroImg] = useState(course.introThumbnail || '');

  useEffect(() => {
    if (isIntroModalOpen) {
      setIntroTitle(course.title);
      setIntroDesc(course.description);
      setIntroImg(course.introThumbnail || '');
    }
  }, [isIntroModalOpen, course]);

  const [tempAuthor, setTempAuthor] = useState<Author>(course.author || { 
    name: '', role: '', avatar: '', bio: '', rating: '5.0',
    whatsapp: '', instagram: '', linkedin: '', tiktok: '', website: ''
  });

  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonType, setLessonType] = useState<'video' | 'text'>('video');
  const [lessonVideo, setLessonVideo] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonAssets, setLessonAssets] = useState<Asset[]>([]);

  const brandLogoInputRef = useRef<HTMLInputElement>(null);
  const introPhotoInputRef = useRef<HTMLInputElement>(null);
  const mentorAvatarInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // KRUSIAL: Hanya DEVELOPER yang bisa mengedit
  const canEdit = user?.role === 'developer' && !isSharedMode;
  
  // FIX: Menggunakan parameter ?course= sesuai logic di App.tsx
  const fullLink = `${window.location.origin}${window.location.pathname}?course=${encodeURIComponent(course.id)}${activeLesson ? `&lesson=${encodeURIComponent(activeLesson.id)}` : ''}`;

  useEffect(() => {
    if (isLessonModalOpen && editorRef.current) {
        editorRef.current.innerHTML = lessonContent;
    }
  }, [isLessonModalOpen, lessonContent]);

  const compressImage = (base64: string, maxWidth = 800): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject("Context error");
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
      img.onerror = () => reject("Load error");
    });
  };

  const handleImageUpload = async (file: File, callback: (res: string) => void) => {
    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(reader.result as string);
        callback(compressed);
      } catch (err) { alert("Gagal memproses gambar"); } 
      finally { setIsUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/);
    const videoId = match ? match[1].split('&')[0] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1` : null;
  };

  const handleSaveMentor = () => {
    onUpdateCourse({ ...course, author: tempAuthor });
    setIsMentorModalOpen(false);
  };

  const handleSaveIntro = () => {
    onUpdateCourse({ ...course, title: introTitle, description: introDesc, introThumbnail: introImg });
    setIsIntroModalOpen(false);
  };

  const handleSaveBrand = () => {
    onUpdateBrand(tempBrandName, tempBrandLogo);
    setIsEditingBrand(false);
  };

  const openAddLesson = () => {
    setEditingLesson(null);
    setLessonTitle('');
    setLessonType('video');
    setLessonVideo('');
    setLessonContent('');
    setLessonAssets([]);
    setIsLessonModalOpen(true);
  };

  const openEditLesson = (e: React.MouseEvent, lesson: Lesson) => {
    e.stopPropagation();
    setEditingLesson(lesson);
    setLessonTitle(lesson.title);
    setLessonType(lesson.youtubeUrl ? 'video' : 'text');
    setLessonVideo(lesson.youtubeUrl || '');
    setLessonContent(lesson.content || '');
    setLessonAssets(lesson.assets || []);
    setIsLessonModalOpen(true);
  };

  const handleSaveLesson = () => {
    const updatedLesson: Lesson = {
      id: editingLesson?.id || `lesson-${Date.now()}`,
      title: lessonTitle,
      youtubeUrl: lessonType === 'video' ? lessonVideo : '',
      content: lessonContent,
      description: '', 
      duration: lessonType === 'video' ? '10min' : 'Text',
      assets: lessonAssets
    };
    let newLessons = [...course.lessons];
    if (editingLesson) {
      newLessons = newLessons.map(l => l.id === editingLesson.id ? updatedLesson : l);
    } else {
      newLessons.push(updatedLesson);
    }
    onUpdateCourse({ ...course, lessons: newLessons });
    setActiveLesson(updatedLesson);
    setIsLessonModalOpen(false);
  };

  const handleDeleteLesson = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Hapus materi ini?')) {
      const newLessons = course.lessons.filter(l => l.id !== id);
      onUpdateCourse({ ...course, lessons: newLessons });
      if (activeLesson?.id === id) setActiveLesson(null);
    }
  };

  const addAsset = () => {
    setLessonAssets([...lessonAssets, { id: `asset-${Date.now()}`, name: 'Nama Aset', url: '', type: 'link' }]);
  };

  const updateAsset = (index: number, field: keyof Asset, value: string) => {
    const newAssets = [...lessonAssets];
    newAssets[index] = { ...newAssets[index], [field]: value };
    setLessonAssets(newAssets);
  };

  const removeAsset = (index: number) => {
    setLessonAssets(lessonAssets.filter((_, i) => i !== index));
  };

  const embedUrl = activeLesson ? getYoutubeEmbedUrl(activeLesson.youtubeUrl) : null;
  const isVideoPage = !!embedUrl;
  const isCourseIntro = !activeLesson;

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden font-inter">
      <header className="h-20 border-b border-violet-100 bg-white flex items-center justify-between px-6 md:px-10 flex-shrink-0 z-50">
        <div className="flex items-center gap-6">
          {user?.role === 'developer' && !isSharedMode && (
            <button onClick={onBackToDashboard} className="p-2.5 bg-violet-50 text-violet-400 hover:text-violet-600 rounded-xl border border-violet-100 shadow-sm transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center">
              {brandLogo ? <img src={brandLogo} className="w-full h-full object-contain" alt="Logo" /> : <div className="w-full h-full bg-violet-600 flex items-center justify-center text-white font-black">{brandName ? brandName.charAt(0) : 'A'}</div>}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 hidden sm:block">{brandName}</span>
              {canEdit && (
                <button onClick={() => setIsEditingBrand(true)} className="text-violet-300 hover:text-violet-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg>
                </button>
              )}
              <div className="hidden md:flex items-center gap-3">
                 <div className="h-5 w-[2px] bg-slate-100 mx-2"></div>
                 <span className="text-slate-400 font-bold text-sm truncate max-w-[240px] tracking-tight">{course.title}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user?.role === 'developer' && (
            <button onClick={() => setShowShareModal(true)} className="px-5 py-2.5 bg-violet-50 text-violet-600 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-violet-100 border border-violet-100 uppercase tracking-widest transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
              <span>Bagikan</span>
            </button>
          )}
          <button onClick={onLogout} className="px-5 py-2.5 bg-rose-50 text-rose-500 text-[10px] font-black rounded-xl border border-rose-100 uppercase tracking-widest hover:bg-rose-100 transition-all">Logout</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar bg-white">
          <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-start gap-4">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                {activeLesson ? activeLesson.title : course.title}
              </h1>
              {canEdit && isCourseIntro && (
                <button onClick={() => setIsIntroModalOpen(true)} className="p-3 bg-violet-600 text-white rounded-xl shadow-lg hover:bg-violet-700 active:scale-95 transition-all flex items-center gap-2 shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg>
                  <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Edit Intro</span>
                </button>
              )}
            </div>

            {(isVideoPage || isCourseIntro) && (
              <div className="bg-white rounded-[2rem] overflow-hidden border border-violet-100 shadow-sm group relative">
                {isVideoPage ? (
                  <div className="aspect-video">
                    <iframe className="w-full h-full" src={embedUrl!} frameBorder="0" allowFullScreen></iframe>
                  </div>
                ) : (
                  <div className="aspect-video bg-slate-50 flex items-center justify-center relative overflow-hidden">
                    {course.introThumbnail ? (
                      <img src={course.introThumbnail} className="w-full h-full object-cover" alt="Intro Photo" />
                    ) : course.thumbnail ? (
                      <img src={course.thumbnail} className="w-full h-full object-cover opacity-60" alt="Dashboard Cover" />
                    ) : (
                      <div className="text-slate-300 flex flex-col items-center gap-2">
                         <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 00-2 2z"/></svg>
                         <span className="font-bold text-xs">No Intro Photo</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-violet-100 shadow-sm relative">
              <div className="prose prose-violet max-w-none" dangerouslySetInnerHTML={{ __html: activeLesson ? (activeLesson.content || 'Konten materi ini sedang dalam tahap penyusunan.') : course.description }}></div>
              
              {activeLesson && activeLesson.assets && activeLesson.assets.length > 0 && (
                <div className="mt-12 pt-10 border-t border-violet-50">
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Aset & Lampiran</h4>
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
          <div className="p-8 border-b border-violet-50 bg-slate-50/50">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mentor Kelas</h3>
                {canEdit && (
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
          </div>

          <div className="p-8 border-b border-violet-50 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Daftar Materi</h3>
            {canEdit && (
               <button onClick={openAddLesson} className="w-8 h-8 bg-violet-600 text-white rounded-lg flex items-center justify-center shadow-lg active:scale-95 transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v12m6-6H6"/></svg>
               </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            {course.lessons.map((lesson, i) => (
              <div key={lesson.id} className="relative group/item flex items-center gap-2">
                <button onClick={() => setActiveLesson(lesson)} className={`flex-1 p-5 rounded-2xl flex items-center gap-4 transition-all text-left ${activeLesson?.id === lesson.id ? 'bg-violet-600 text-white shadow-xl shadow-violet-200' : 'hover:bg-violet-50 text-slate-600'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${activeLesson?.id === lesson.id ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>{i + 1}</div>
                  <span className="flex-1 font-bold text-sm leading-snug break-words line-clamp-2">
                  {lesson.title}
                  </span>
                </button>
                {canEdit && (
                  <div className="flex flex-col gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity pr-2 shrink-0">
                    <button onClick={(e) => openEditLesson(e, lesson)} className={`p-1.5 rounded-lg ${activeLesson?.id === lesson.id ? 'bg-white/20 text-white' : 'bg-violet-50 text-violet-600 border border-violet-100'}`}>
                       <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg>
                    </button>
                    <button onClick={(e) => handleDeleteLesson(e, lesson.id)} className={`p-1.5 rounded-lg ${activeLesson?.id === lesson.id ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-500 border border-rose-100'}`}>
                       <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2"/></svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* MODALS */}
      {canEdit && (
        <>
          {isIntroModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
              <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
                <h2 className="text-2xl font-black mb-8">Edit Intro Kelas</h2>
                <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Judul Utama Kursus</label>
                    <input type="text" value={introTitle} onChange={(e) => setIntroTitle(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Foto Intro</label>
                    <div className="flex gap-4 items-center">
                      <div className="w-32 h-20 rounded-xl bg-slate-100 overflow-hidden border">
                        {introImg ? <img src={introImg} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-xs uppercase">No Photo</div>}
                      </div>
                      <input type="file" ref={introPhotoInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], setIntroImg)} />
                      <button onClick={() => introPhotoInputRef.current?.click()} className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg transition-all">Ganti Foto</button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Deskripsi Utama</label>
                    <textarea rows={6} value={introDesc} onChange={(e) => setIntroDesc(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-medium text-sm leading-relaxed" />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button onClick={() => setIsIntroModalOpen(false)} className="flex-1 py-4 font-bold text-slate-400">Batal</button>
                    <button onClick={handleSaveIntro} className="flex-[2] py-4 bg-violet-600 text-white rounded-2xl font-bold shadow-xl">Simpan Intro</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {isLessonModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur">
              <div className="bg-white w-full max-w-3xl rounded-[3rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
                <h2 className="text-3xl font-black mb-8 tracking-tight">{editingLesson ? 'Edit Materi' : 'Tambah Materi'}</h2>
                <div className="space-y-6">
                  <input type="text" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="Judul Materi" className="w-full px-6 py-4 rounded-2xl bg-slate-50 font-bold border border-slate-100" />
                  <input type="text" value={lessonVideo} onChange={(e) => setLessonVideo(e.target.value)} placeholder="Link YouTube" className="w-full px-6 py-4 rounded-2xl bg-slate-50 font-bold text-violet-600 border border-slate-100" />
                  <div ref={editorRef} contentEditable className="min-h-[200px] p-6 bg-slate-50 rounded-2xl border border-slate-100 overflow-y-auto" onInput={(e) => setLessonContent(e.currentTarget.innerHTML)}></div>
                  <div className="flex gap-4">
                    <button onClick={() => setIsLessonModalOpen(false)} className="flex-1 font-bold text-slate-400">Batal</button>
                    <button onClick={handleSaveLesson} className="flex-[2] py-4 bg-violet-600 text-white rounded-2xl font-bold">Simpan Materi</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {showShareModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-white text-center">
            <h3 className="text-2xl font-black text-slate-900 mb-6">Bagikan Kursus</h3>
            <p className="text-xs font-bold text-slate-400 mb-8 uppercase tracking-widest leading-relaxed">Tautan ini hanya untuk <span className="text-emerald-500 font-black">Preview Publik</span>.</p>
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-100 mb-8">
              <input readOnly value={fullLink} className="flex-1 bg-transparent border-none text-[10px] font-bold text-slate-500 px-4 focus:outline-none truncate" />
              <button onClick={() => { navigator.clipboard.writeText(fullLink); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95">{copySuccess ? 'Copied!' : 'Copy'}</button>
            </div>
            <button onClick={() => setShowShareModal(false)} className="w-full py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursePlayer;
