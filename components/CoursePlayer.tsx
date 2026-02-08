
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
  
  // States untuk Edit Intro
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

  const isAdmin = user.role === 'admin' && !isSharedMode;
  
// =========================
// SHARE LINK (HALAMAN INI SAJA - PREVIEW MODE)
// =========================
const basePath = `/course/${course.id}`;

const lessonParam = activeLesson
  ? `&lesson=${encodeURIComponent(activeLesson.id)}`
  : '';

const fullLink = `${window.location.origin}${basePath}?share=${encodeURIComponent(
  course.id
)}${lessonParam}&view=preview`;

  useEffect(() => {
    if (isLessonModalOpen && editorRef.current) {
        editorRef.current.innerHTML = lessonContent;
    }
  }, [isLessonModalOpen, lessonContent]);

  const compressImage = (base64: string, maxWidth = 1000): Promise<string> => {
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
          {!isSharedMode && (
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
              {isAdmin && (
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
          {!isSharedMode && (
            <button onClick={() => setShowShareModal(true)} className="px-5 py-2.5 bg-violet-50 text-violet-600 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-violet-100 border border-violet-100 uppercase tracking-widest transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
              <span>Bagikan</span>
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar bg-white">
          <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-start gap-4">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                {activeLesson ? activeLesson.title : course.title}
              </h1>
              {isAdmin && isCourseIntro && (
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
                {course.author?.instagram && <a href={`https://instagram.com/${course.author.instagram}`} target="_blank" className="p-1.5 bg-white rounded-lg text-slate-400 hover:text-pink-500 border border-slate-100 transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></a>}
                {course.author?.tiktok && <a href={`https://tiktok.com/@${course.author.tiktok}`} target="_blank" className="p-1.5 bg-white rounded-lg text-slate-400 hover:text-black border border-slate-100 transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.81.33-.85.51-1.44 1.43-1.58 2.41-.08.4-.07.82-.01 1.22.15 1.02.9 1.97 1.81 2.39 1.02.46 2.26.27 3.1-.46.51-.41.83-1.01.91-1.66.06-.68.03-1.37.03-2.05V0z"/></svg></a>}
                {course.author?.linkedin && <a href={course.author.linkedin} target="_blank" className="p-1.5 bg-white rounded-lg text-slate-400 hover:text-blue-600 border border-slate-100 transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg></a>}
                {course.author?.website && (
                  <a href={course.author.website} target="_blank" className="px-3 py-1.5 bg-white text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-violet-600 border border-slate-100 rounded-lg flex items-center transition-all shadow-sm">
                    Template Lainnya
                  </a>
                )}
             </div>
          </div>

          <div className="p-8 border-b border-violet-50 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Daftar Materi</h3>
            {isAdmin && (
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
                {isAdmin && (
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

      {/* Modal Edit Intro */}
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
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Foto Intro (Cover Detail)</label>
                <div className="flex gap-4 items-center">
                  <div className="w-32 h-20 rounded-xl bg-slate-100 overflow-hidden border">
                    {introImg ? <img src={introImg} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-xs uppercase italic">No Photo</div>}
                  </div>
                  <input type="file" ref={introPhotoInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], setIntroImg)} />
                  <button onClick={() => introPhotoInputRef.current?.click()} className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Ganti Foto Intro</button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Deskripsi Utama (HTML/Text)</label>
                <textarea rows={6} value={introDesc} onChange={(e) => setIntroDesc(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-medium text-sm leading-relaxed" />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsIntroModalOpen(false)} className="flex-1 py-4 font-bold text-slate-400">Batal</button>
                <button onClick={handleSaveIntro} className="flex-[2] py-4 bg-violet-600 text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all">Simpan Perubahan Intro</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mentor */}
      {isMentorModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
            <h2 className="text-2xl font-black mb-8">Konfigurasi Mentor</h2>
            <div className="space-y-8">
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Foto Profil Mentor</label>
                 <div className="flex gap-4 items-center">
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden border shadow-inner">
                       {tempAuthor.avatar ? <img src={tempAuthor.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-xs uppercase tracking-widest italic">?</div>}
                    </div>
                    <input type="file" ref={mentorAvatarInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], (res) => setTempAuthor({...tempAuthor, avatar: res}))} />
                    <button onClick={() => mentorAvatarInputRef.current?.click()} className="px-5 py-3 bg-violet-50 text-violet-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-violet-100">Ganti Foto Mentor</button>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nama Lengkap</label>
                   <input type="text" placeholder="Nama Mentor" value={tempAuthor.name} onChange={(e) => setTempAuthor({...tempAuthor, name: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Spesialisasi</label>
                   <input type="text" placeholder="Role (e.g. Designer)" value={tempAuthor.role} onChange={(e) => setTempAuthor({...tempAuthor, role: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" />
                </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Bio Singkat</label>
                 <textarea placeholder="Bio..." value={tempAuthor.bio} onChange={(e) => setTempAuthor({...tempAuthor, bio: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-medium text-sm" rows={3} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">WA (628xxx)</label>
                    <input type="text" value={tempAuthor.whatsapp || ''} onChange={(e) => setTempAuthor({...tempAuthor, whatsapp: e.target.value})} placeholder="628123" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-xs" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">IG (@handle)</label>
                    <input type="text" value={tempAuthor.instagram || ''} onChange={(e) => setTempAuthor({...tempAuthor, instagram: e.target.value})} placeholder="@user" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-xs" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">LinkedIn (URL)</label>
                    <input type="text" value={tempAuthor.linkedin || ''} onChange={(e) => setTempAuthor({...tempAuthor, linkedin: e.target.value})} placeholder="https://" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-xs" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">TikTok (@handle)</label>
                    <input type="text" value={tempAuthor.tiktok || ''} onChange={(e) => setTempAuthor({...tempAuthor, tiktok: e.target.value})} placeholder="@user" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-xs" />
                 </div>
                 <div className="space-y-1 lg:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Website (URL)</label>
                    <input type="text" value={tempAuthor.website || ''} onChange={(e) => setTempAuthor({...tempAuthor, website: e.target.value})} placeholder="https://" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-xs" />
                 </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsMentorModalOpen(false)} className="flex-1 py-4 font-bold text-slate-400">Batal</button>
                <button onClick={handleSaveMentor} className="flex-[2] py-4 bg-violet-600 text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all">Simpan Mentor</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLessonModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur">
          <div className="bg-white w-full max-w-3xl rounded-[3rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
            <h2 className="text-3xl font-black mb-8 tracking-tight">{editingLesson ? 'Edit Materi' : 'Tambah Materi Baru'}</h2>
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Judul Pelajaran</label>
                    <input type="text" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 font-bold border border-slate-100" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tipe Konten</label>
                    <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
                       <button onClick={() => setLessonType('video')} className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${lessonType === 'video' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400'}`}>Video</button>
                       <button onClick={() => setLessonType('text')} className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${lessonType === 'text' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400'}`}>Pages Teks</button>
                    </div>
                 </div>
              </div>
              {lessonType === 'video' && (
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Link YouTube</label>
                    <input type="text" value={lessonVideo} onChange={(e) => setLessonVideo(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 font-bold text-violet-600 border border-slate-100" />
                 </div>
              )}
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Detail Konten / Catatan</label>
                 <div 
                   ref={editorRef} 
                   contentEditable 
                   className="min-h-[200px] p-6 bg-slate-50 rounded-2xl border border-slate-100 overflow-y-auto focus:outline-none focus:ring-4 focus:ring-violet-500/10 font-medium leading-relaxed"
                   onInput={(e) => setLessonContent(e.currentTarget.innerHTML)}
                 ></div>
                 <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-widest italic">*Mendukung formatting HTML sederhana.</p>
              </div>

              {/* Lampiran Assets - Dikembalikan */}
              <div className="p-8 bg-violet-50/50 rounded-[2.5rem] border border-violet-100">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Lampiran & File Materi</h3>
                    <button onClick={addAsset} className="px-4 py-2 bg-white text-violet-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-violet-100 hover:bg-violet-600 hover:text-white transition-all">+ Tambah Aset</button>
                 </div>
                 <div className="space-y-3">
                    {lessonAssets.map((asset, index) => (
                      <div key={asset.id} className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-violet-100 shadow-sm items-start">
                         <div className="flex-1 w-full space-y-2">
                           <input type="text" value={asset.name} onChange={(e) => updateAsset(index, 'name', e.target.value)} placeholder="Nama File/Link" className="w-full px-4 py-2 bg-slate-50 rounded-xl text-xs font-bold border-none" />
                           <input type="text" value={asset.url} onChange={(e) => updateAsset(index, 'url', e.target.value)} placeholder="URL Aset" className="w-full px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-medium border-none text-violet-600" />
                         </div>
                         <button onClick={() => removeAsset(index)} className="p-2 text-rose-400 hover:text-rose-600 shrink-0"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg></button>
                      </div>
                    ))}
                    {lessonAssets.length === 0 && <p className="text-center py-4 text-[10px] font-bold text-slate-300 uppercase italic">Belum ada lampiran.</p>}
                 </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button onClick={() => setIsLessonModalOpen(false)} className="flex-1 py-5 text-sm font-black text-slate-400 uppercase tracking-widest text-center">Batal</button>
                <button onClick={handleSaveLesson} className="flex-[2] py-5 bg-violet-600 text-white rounded-[2rem] font-black shadow-xl active:scale-[0.98]">Simpan Materi</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditingBrand && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl">
            <h2 className="text-2xl font-black mb-6 tracking-tight">Pengaturan Brand</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nama Platform</label>
                <input type="text" value={tempBrandName} onChange={(e) => setTempBrandName(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Logo Brand</label>
                <div className="flex gap-4 items-center mt-2">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200 shadow-inner">
                    {tempBrandLogo ? <img src={tempBrandLogo} className="w-full h-full object-contain" alt="Preview Logo" /> : <span className="text-slate-300 font-black">?</span>}
                  </div>
                  <input type="file" ref={brandLogoInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], setTempBrandLogo)} />
                  <button onClick={() => brandLogoInputRef.current?.click()} className="px-5 py-3 bg-violet-50 text-violet-600 rounded-xl text-xs font-black border border-violet-100 uppercase tracking-widest shadow-sm">Upload Logo</button>
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button onClick={() => setIsEditingBrand(false)} className="flex-1 py-4 text-sm font-bold text-slate-400 hover:text-slate-600 text-center">Batal</button>
                <button onClick={handleSaveBrand} className="flex-1 py-4 bg-violet-600 text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-white text-center">
            <h3 className="text-2xl font-black text-slate-900 mb-6">Bagikan Kursus</h3>
            <p className="text-xs font-bold text-slate-400 mb-8 uppercase tracking-widest leading-relaxed">Tautan ini hanya untuk <span className="text-emerald-500">Preview Publik</span>. Orang lain tidak akan bisa mengedit kursus ini.</p>
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-100 mb-8">
              <input readOnly value={fullLink} className="flex-1 bg-transparent border-none text-[10px] font-bold text-slate-500 px-4 focus:outline-none truncate" />
              <button onClick={() => { navigator.clipboard.writeText(fullLink); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">{copySuccess ? 'Copied!' : 'Copy'}</button>
            </div>
            <button onClick={() => setShowShareModal(false)} className="w-full py-4 text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-colors">Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursePlayer;
