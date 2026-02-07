
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
  const [copySuccess, setCopySuccess] = useState(false);

  const [tempBrandName, setTempBrandName] = useState(brandName);
  const [tempBrandLogo, setTempBrandLogo] = useState(brandLogo);
  
  // Update temp state when props change (especially when entering edit mode)
  useEffect(() => {
    if (isEditingBrand) {
      setTempBrandName(brandName);
      setTempBrandLogo(brandLogo);
    }
  }, [isEditingBrand, brandName, brandLogo]);

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
  const fullLink = `${window.location.origin}${window.location.pathname}?share=${course.id}`;

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
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject("Context error");
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Use lower quality to prevent huge state objects that crash browsers
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
      img.onerror = () => reject("Load error");
    });
  };

  const handleImageUpload = async (file: File, callback: (res: string) => void) => {
    if (!file.type.startsWith('image/')) {
      alert("Hanya file gambar yang diizinkan");
      return;
    }
    // Limit to 5MB to prevent memory issues during base64 conversion
    if (file.size > 5 * 1024 * 1024) {
      alert("Maksimal 5MB untuk menjaga stabilitas halaman.");
      return;
    }
    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(reader.result as string);
        callback(compressed);
      } catch (err) {
        alert("Gagal memproses gambar");
      } finally {
        setIsUploading(false);
      }
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

  const handleSaveBrand = () => {
    if (!tempBrandName.trim()) {
      alert("Nama brand tidak boleh kosong.");
      return;
    }
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
            <button onClick={onBackToDashboard} className="p-2.5 bg-violet-50 text-violet-400 hover:text-violet-600 rounded-xl border border-violet-100 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center`}>
              {brandLogo ? <img src={brandLogo} className="w-full h-full object-contain" alt="Logo" /> : <div className="w-full h-full bg-violet-600 flex items-center justify-center text-white font-black">{brandName ? brandName.charAt(0) : 'A'}</div>}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 hidden sm:block">{brandName}</span>
              {isAdmin && (
                <button onClick={() => setIsEditingBrand(true)} className="text-violet-300 hover:text-violet-600">
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
            <button onClick={() => setShowShareModal(true)} className="px-5 py-2.5 bg-violet-50 text-violet-600 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-violet-100 border border-violet-100 uppercase tracking-widest">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
              <span>Bagikan</span>
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar bg-white">
          <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
              {activeLesson ? activeLesson.title : course.title}
            </h1>

            <div className="bg-white rounded-[2rem] overflow-hidden border border-violet-100 shadow-sm group relative">
              {isVideoPage ? (
                <div className="aspect-video">
                  <iframe className="w-full h-full" src={embedUrl!} frameBorder="0" allowFullScreen></iframe>
                </div>
              ) : (
                <div className="aspect-video bg-slate-50 flex items-center justify-center relative overflow-hidden">
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-violet-600 border-t-transparent"></div>
                      <span className="text-xs font-bold text-violet-600 uppercase tracking-widest">Memproses...</span>
                    </div>
                  ) : course.thumbnail ? (
                    <img src={course.thumbnail} className="w-full h-full object-cover" alt="Cover" />
                  ) : (
                    <div className="text-slate-300 flex flex-col items-center gap-2">
                       <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 00-2 2z"/></svg>
                       <span className="font-bold text-xs">Thumbnail Belum Ada</span>
                    </div>
                  )}
                  {isAdmin && !isUploading && isCourseIntro && (
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-[2px]">
                      <input type="file" ref={introPhotoInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], (res) => onUpdateCourse({ ...course, thumbnail: res }))} />
                      <button onClick={() => introPhotoInputRef.current?.click()} className="px-6 py-3 bg-white text-violet-600 rounded-2xl font-black shadow-2xl active:scale-95 transition-transform">Ganti Foto Intro</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-violet-100 shadow-sm">
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
                           <svg className="w-4 h-4 text-slate-300 group-hover:text-violet-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
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
                    Website
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
              <div key={lesson.id} className="relative group/item">
                <button onClick={() => setActiveLesson(lesson)} className={`w-full p-5 rounded-2xl flex items-center gap-4 transition-all text-left ${activeLesson?.id === lesson.id ? 'bg-violet-600 text-white shadow-xl shadow-violet-200' : 'hover:bg-violet-50 text-slate-600'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${activeLesson?.id === lesson.id ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>{i + 1}</div>
                  <span className="flex-1 font-bold text-sm truncate pr-10">{lesson.title}</span>
                  {progress?.completedLessons?.includes(lesson.id) && <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>}
                </button>
                {isAdmin && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <button onClick={(e) => openEditLesson(e, lesson)} className={`p-2 rounded-lg ${activeLesson?.id === lesson.id ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white text-slate-400 hover:text-violet-600 shadow-sm border border-slate-100'}`}><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg></button>
                    <button onClick={(e) => handleDeleteLesson(e, lesson.id)} className={`p-2 rounded-lg ${activeLesson?.id === lesson.id ? 'bg-white/20 text-white hover:bg-white/40' : 'bg-white text-slate-400 hover:text-rose-600 shadow-sm border border-slate-100'}`}><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2.5"/></svg></button>
                  </div>
                )}
              </div>
            ))}
            {course.lessons.length === 0 && <p className="text-center p-8 text-slate-300 text-xs font-bold italic">Belum ada materi</p>}
          </div>
        </aside>
      </div>

      {isEditingBrand && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl">
            <h2 className="text-2xl font-black mb-6">Pengaturan Brand</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nama Brand</label>
                <input type="text" value={tempBrandName} onChange={(e) => setTempBrandName(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Logo Brand (Opsional)</label>
                <div className="flex gap-4 items-center mt-2">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200">
                    {tempBrandLogo ? <img src={tempBrandLogo} className="w-full h-full object-contain" /> : <span className="text-slate-300 font-black">?</span>}
                  </div>
                  <input type="file" ref={brandLogoInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], setTempBrandLogo)} />
                  <button onClick={() => brandLogoInputRef.current?.click()} className="px-5 py-3 bg-violet-50 text-violet-600 rounded-xl text-xs font-black border border-violet-100 uppercase tracking-widest">Upload</button>
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

      {isMentorModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
            <h2 className="text-3xl font-black mb-8 tracking-tight">Profil Mentor</h2>
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row gap-8 items-center">
                <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden bg-slate-100 ring-4 ring-slate-50 relative group">
                  <img src={tempAuthor.avatar || 'https://i.pravatar.cc/150'} className="w-full h-full object-cover" />
                  {isUploading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-2 border-violet-600 border-t-transparent"></div></div>}
                </div>
                <div className="flex-1 text-center sm:text-left">
                   <input type="file" ref={mentorAvatarInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], (res) => setTempAuthor({...tempAuthor, avatar: res}))} />
                   <button onClick={() => mentorAvatarInputRef.current?.click()} disabled={isUploading} className="px-6 py-3 bg-violet-600 text-white rounded-xl text-xs font-black shadow-lg uppercase tracking-widest hover:bg-violet-700 disabled:opacity-50">Ganti Foto Mentor</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nama Mentor</label>
                    <input type="text" value={tempAuthor.name} onChange={(e) => setTempAuthor({...tempAuthor, name: e.target.value})} placeholder="Nama Mentor" className="w-full px-6 py-4 rounded-2xl bg-slate-50 font-bold border border-slate-100" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Role / Spesialisasi</label>
                    <input type="text" value={tempAuthor.role} onChange={(e) => setTempAuthor({...tempAuthor, role: e.target.value})} placeholder="UI/UX Designer" className="w-full px-6 py-4 rounded-2xl bg-slate-50 font-bold border border-slate-100" />
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Biografi Singkat</label>
                 <textarea rows={4} value={tempAuthor.bio} onChange={(e) => setTempAuthor({...tempAuthor, bio: e.target.value})} placeholder="Tulis biografi mentor..." className="w-full px-6 py-4 rounded-2xl bg-slate-50 font-medium border border-slate-100" />
              </div>

              <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826a4 4 0 005.656 0l4-4a4 4 0 10-5.656-5.656l-1.1 1.1"/></svg>
                    Social Media & Links
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Instagram (Username)</label>
                       <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-slate-300 font-bold">@</span>
                          <input type="text" value={tempAuthor.instagram} onChange={(e) => setTempAuthor({...tempAuthor, instagram: e.target.value})} className="flex-1 bg-transparent border-none text-sm font-bold focus:outline-none" placeholder="crystallucas" />
                       </div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">TikTok (Username)</label>
                       <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-slate-300 font-bold">@</span>
                          <input type="text" value={tempAuthor.tiktok} onChange={(e) => setTempAuthor({...tempAuthor, tiktok: e.target.value})} className="flex-1 bg-transparent border-none text-sm font-bold focus:outline-none" placeholder="crystallucas_design" />
                       </div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">LinkedIn URL</label>
                       <input type="text" value={tempAuthor.linkedin} onChange={(e) => setTempAuthor({...tempAuthor, linkedin: e.target.value})} className="w-full px-5 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold" placeholder="https://linkedin.com/in/..." />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Website Portfolio</label>
                       <input type="text" value={tempAuthor.website} onChange={(e) => setTempAuthor({...tempAuthor, website: e.target.value})} className="w-full px-5 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold" placeholder="https://portfolio.com" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">WhatsApp (628...)</label>
                       <input type="text" value={tempAuthor.whatsapp} onChange={(e) => setTempAuthor({...tempAuthor, whatsapp: e.target.value})} className="w-full px-5 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold" placeholder="62812345678" />
                    </div>
                 </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button onClick={() => setIsMentorModalOpen(false)} className="flex-1 py-5 text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 text-center">Batal</button>
                <button onClick={handleSaveMentor} className="flex-[2] py-5 bg-violet-600 text-white rounded-[2rem] font-black shadow-xl shadow-violet-200 active:scale-[0.98] transition-all">Simpan Profil Mentor</button>
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
                    <input type="text" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="Contoh: Pengenalan Interface" className="w-full px-6 py-4 rounded-2xl bg-slate-50 font-bold border border-slate-100" />
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
                    <input type="text" value={lessonVideo} onChange={(e) => setLessonVideo(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="w-full px-6 py-4 rounded-2xl bg-slate-50 font-bold text-violet-600 border border-slate-100" />
                 </div>
              )}
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Detail Konten / Catatan</label>
                 <div 
                   ref={editorRef} 
                   contentEditable 
                   className="min-h-[250px] p-6 bg-slate-50 rounded-2xl border border-slate-100 overflow-y-auto focus:outline-none focus:ring-4 focus:ring-violet-500/10 font-medium leading-relaxed"
                   onInput={(e) => setLessonContent(e.currentTarget.innerHTML)}
                 ></div>
                 <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-widest italic">*Editor mendukung format HTML dasar</p>
              </div>
              <div className="p-8 bg-violet-50/50 rounded-[2.5rem] border border-violet-100">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Aset Kelas & File</h3>
                    <button onClick={addAsset} className="px-4 py-2 bg-white text-violet-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-violet-100">+ Tambah Aset</button>
                 </div>
                 <div className="space-y-3">
                    {lessonAssets.map((asset, index) => (
                      <div key={asset.id} className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-violet-100 shadow-sm">
                         <input type="text" value={asset.name} onChange={(e) => updateAsset(index, 'name', e.target.value)} placeholder="Nama File/Link" className="flex-1 px-4 py-2 bg-slate-50 rounded-xl text-sm font-bold border-none" />
                         <input type="text" value={asset.url} onChange={(e) => updateAsset(index, 'url', e.target.value)} placeholder="URL Link" className="flex-[2] px-4 py-2 bg-slate-50 rounded-xl text-sm font-medium border-none text-violet-600" />
                         <button onClick={() => removeAsset(index)} className="p-2 text-rose-400 hover:text-rose-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg></button>
                      </div>
                    ))}
                 </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button onClick={() => setIsLessonModalOpen(false)} className="flex-1 py-5 text-sm font-black text-slate-400 uppercase tracking-widest text-center">Batal</button>
                <button onClick={handleSaveLesson} className="flex-[2] py-5 bg-violet-600 text-white rounded-[2rem] font-black shadow-xl shadow-violet-100 active:scale-[0.98]">Simpan Materi</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-white text-center">
            <h3 className="text-2xl font-black text-slate-900 mb-8">Bagikan Kursus</h3>
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-100 mb-8">
              <input readOnly value={fullLink} className="flex-1 bg-transparent border-none text-xs font-bold text-slate-500 px-4 focus:outline-none" />
              <button onClick={() => { navigator.clipboard.writeText(fullLink); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest">{copySuccess ? 'Berhasil!' : 'Salin'}</button>
            </div>
            <button onClick={() => setShowShareModal(false)} className="w-full py-4 text-sm font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600">Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursePlayer;
