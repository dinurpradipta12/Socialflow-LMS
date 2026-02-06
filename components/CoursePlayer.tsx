import React, { useState, useRef } from 'react';
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
  onOpenAdmin,
  onBackToDashboard,
  user,
  progress,
  toggleLessonComplete,
  onUpdateCourse,
  isSharedMode = false,
  brandName,
  setBrandName,
  brandLogo,
  setBrandLogo
}) => {
  const [activeContentTab, setActiveContentTab] = useState<'overview' | 'assets' | 'notes'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  
  // Modals & Popups
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isShortened, setIsShortened] = useState(false);
  
  // Admin Edit Modals
  const [editingVideo, setEditingVideo] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState(false);
  
  // Site Name & Logo Edit
  const [isEditingBrand, setIsEditingBrand] = useState(false);
  const [tempBrandName, setTempBrandName] = useState(brandName);
  const [tempBrandLogo, setTempBrandLogo] = useState(brandLogo);

  // Course Title & Description Edit
  const [isEditingCourseMeta, setIsEditingCourseMeta] = useState(false);
  const [tempCourseTitle, setTempCourseTitle] = useState(course.title);
  const [tempCourseDesc, setTempCourseDesc] = useState(course.description);

  // Mentor Edit Modal
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [tempAuthor, setTempAuthor] = useState<Author>(course.author || { 
    name: '', role: '', avatar: '', bio: '', rating: '5.0',
    whatsapp: '', instagram: '', linkedin: '', tiktok: '', website: ''
  });

  // Lesson Edit Modal (Rename)
  const [isEditLessonModalOpen, setIsEditLessonModalOpen] = useState(false);
  const [lessonToEdit, setLessonToEdit] = useState<Lesson | null>(null);
  const [tempLessonRename, setTempLessonRename] = useState('');

  // Temporary form states
  const [tempVideoUrl, setTempVideoUrl] = useState('');
  const [tempLessonTitle, setTempLessonTitle] = useState('');
  const [tempAssetName, setTempAssetName] = useState('');
  const [tempAssetUrl, setTempAssetUrl] = useState('');
  const [assetSourceType, setAssetSourceType] = useState<'link' | 'file'>('link');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const brandLogoInputRef = useRef<HTMLInputElement>(null);
  const mentorAvatarInputRef = useRef<HTMLInputElement>(null);
  const introPhotoInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user.role === 'admin' && !isSharedMode;

  // Link Shortening Logic (Simulated)
  const originalLink = `${window.location.origin}${window.location.pathname}?share=${course.id}`;
  const shortenedLink = `https://snl.labs/s/${course.id.split('-')[1] || 'course'}`; 

  const handleCopyLink = () => {
    const linkToCopy = isShortened ? shortenedLink : originalLink;
    navigator.clipboard.writeText(linkToCopy);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return null;
    let videoId = '';
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/);
    if (match) {
        videoId = match[1];
        if (videoId.includes('&')) videoId = videoId.split('&')[0];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1` : null;
  };

  const updateLessonData = (lessonId: string, updates: Partial<Lesson>) => {
    if (isSharedMode) return;
    const updatedLessons = course.lessons.map(l => l.id === lessonId ? { ...l, ...updates } : l);
    onUpdateCourse({ ...course, lessons: updatedLessons });
  };

  const handleBrandLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setTempBrandLogo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleMentorAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setTempAuthor({ ...tempAuthor, avatar: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleIntroPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onUpdateCourse({ ...course, thumbnail: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBrand = () => {
    setBrandName(tempBrandName);
    setBrandLogo(tempBrandLogo);
    setIsEditingBrand(false);
  };

  const handleSaveMentor = () => {
    onUpdateCourse({ ...course, author: tempAuthor });
    setIsMentorModalOpen(false);
  };

  const handleSaveCourseMeta = () => {
    onUpdateCourse({ ...course, title: tempCourseTitle, description: tempCourseDesc });
    setIsEditingCourseMeta(false);
  };

  const handleOpenEditLesson = (lesson: Lesson) => {
    setLessonToEdit(lesson);
    setTempLessonRename(lesson.title);
    setIsEditLessonModalOpen(true);
  };

  const handleSaveLessonRename = () => {
    if (lessonToEdit) {
      updateLessonData(lessonToEdit.id, { title: tempLessonRename });
      setIsEditLessonModalOpen(false);
      setLessonToEdit(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f9fafb] overflow-hidden font-inter">
      {/* Top Header */}
      <header className="h-20 border-b border-gray-100 bg-white flex items-center justify-between px-6 md:px-10 flex-shrink-0 z-50">
        <div className="flex items-center gap-6">
          {!isSharedMode && (
            <button 
              onClick={onBackToDashboard}
              className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm border border-slate-100"
              title="Kembali ke Dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden transition-all ${brandLogo ? '' : 'bg-indigo-600 shadow-lg border border-indigo-100'}`}>
              {brandLogo ? (
                <img src={brandLogo} className="w-full h-full object-contain" alt="Brand Logo" />
              ) : (
                <span className="text-white font-black">{brandName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-slate-900 hidden sm:block">{brandName}</span>
              {isAdmin && (
                <button onClick={() => { setTempBrandName(brandName); setTempBrandLogo(brandLogo); setIsEditingBrand(true); }} className="text-slate-300 hover:text-indigo-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg>
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!isSharedMode && (
            <React.Fragment>
              <button 
                onClick={() => setShowShareModal(true)}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                <span>Bagikan</span>
              </button>
              {isAdmin && (
                <button onClick={onOpenAdmin} className="hidden md:flex px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg transition-transform active:scale-95">
                  Admin Panel
                </button>
              )}
              <button onClick={onLogout} className="px-4 py-2 bg-rose-50 text-rose-500 rounded-xl text-xs font-bold transition-all hover:bg-rose-100">
                Sign Out
              </button>
            </React.Fragment>
          )}
          {isSharedMode && (
            <div className="flex items-center px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 animate-pulse">
              Public Access Active
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 group">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {activeLesson ? activeLesson.title : course.title}
                </h1>
                {isAdmin && !activeLesson && (
                  <button onClick={() => { setTempCourseTitle(course.title); setTempCourseDesc(course.description); setIsEditingCourseMeta(true); }} className="text-slate-300 hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg>
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-2xl shadow-indigo-500/5 group relative">
              {activeLesson && getYoutubeEmbedUrl(activeLesson.youtubeUrl) ? (
                <div className="aspect-video relative">
                  <iframe className="w-full h-full aspect-video" src={getYoutubeEmbedUrl(activeLesson.youtubeUrl) || ''} frameBorder="0" allowFullScreen></iframe>
                  {isAdmin && (
                    <button onClick={() => { setTempVideoUrl(activeLesson.youtubeUrl); setEditingVideo(true); }} className="absolute top-6 right-6 bg-white/90 backdrop-blur p-4 rounded-2xl opacity-0 group-hover:opacity-100 transition-all shadow-xl text-indigo-600 z-10">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </button>
                  )}
                </div>
              ) : (
                <div className="aspect-video relative overflow-hidden bg-slate-50 flex items-center justify-center">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} className="w-full h-full object-cover" alt="Introduction Poster" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl text-indigo-500 mb-4">
                        <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168l4.263 2.132a1 1 0 010 1.736l-4.263 2.132A1 1 0 018 12.3V7.7a1 1 0 011.555-.832z"/></svg>
                      </div>
                      <p className="text-slate-400 font-extrabold uppercase tracking-widest text-xs">Pilih Materi Video</p>
                    </div>
                  )}
                  {isAdmin && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <input type="file" ref={introPhotoInputRef} onChange={handleIntroPhotoUpload} className="hidden" />
                      <button onClick={() => introPhotoInputRef.current?.click()} className="px-6 py-3 bg-white text-indigo-600 rounded-2xl font-black shadow-2xl flex items-center gap-2 transform transition-transform hover:scale-105 active:scale-95">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeWidth="2.5"/></svg>
                        Ganti Foto Intro
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-slate-100 shadow-sm">
              {activeLesson ? (
                <React.Fragment>
                  <div className="flex gap-8 border-b border-slate-50 mb-8 overflow-x-auto no-scrollbar">
                    {['overview', 'assets', 'notes'].map(tab => (
                      <button key={tab} onClick={() => setActiveContentTab(tab as any)} className={`pb-4 text-xs font-black uppercase tracking-widest relative transition-all ${activeContentTab === tab ? 'text-indigo-600' : 'text-slate-300'}`}>
                        {tab}
                        {activeContentTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full" />}
                      </button>
                    ))}
                  </div>

                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {activeContentTab === 'overview' && (
                      <div className="space-y-6">
                        <h3 className="text-xl font-black text-slate-900">Deskripsi Pelajaran</h3>
                        <p className="text-slate-500 leading-relaxed font-medium">{activeLesson.description}</p>
                        <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 text-slate-600 whitespace-pre-wrap font-medium text-sm leading-relaxed">
                          {activeLesson.content || 'Pilih materi untuk melihat detail lengkap kurikulum.'}
                        </div>
                      </div>
                    )}
                    {activeContentTab === 'assets' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Lampiran Materi</h3>
                          {isAdmin && (
                            <button onClick={() => setIsAssetModalOpen(true)} className="text-[10px] font-black bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg">+ Tambah Aset</button>
                          )}
                        </div>
                        <div className="space-y-3">
                          {activeLesson.assets.length > 0 ? (
                            activeLesson.assets.map(asset => (
                              <div key={asset.id} className="group flex items-center justify-between gap-4 p-5 bg-white border border-slate-100 rounded-2xl hover:border-indigo-100 transition-all shadow-sm">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all flex-shrink-0">
                                      {asset.type === 'link' ? (
                                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826L10.242 9.242m-4.242 4.242L4.828 14.656a4 4 0 015.656-5.656l1.103 1.103"/></svg>
                                      ) : (
                                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-black text-slate-800 truncate">{asset.name}</p>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{asset.type}</p>
                                    </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="py-12 text-center text-slate-400 text-xs font-bold border-2 border-dashed border-slate-50 rounded-2xl">Belum ada aset lampiran.</div>
                          )}
                        </div>
                      </div>
                    )}
                    {activeContentTab === 'notes' && (
                      <textarea className="w-full h-64 p-8 rounded-3xl bg-slate-50 border border-slate-100 text-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner font-medium" placeholder="Catatan personal Anda..."/>
                    )}
                  </div>
                </React.Fragment>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Overview Kursus</h3>
                    {isAdmin && (
                      <button onClick={() => { setTempCourseTitle(course.title); setTempCourseDesc(course.description); setIsEditingCourseMeta(true); }} className="text-indigo-600 font-black text-xs flex items-center gap-2 hover:bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 transition-colors shadow-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg>
                        Edit Detail
                      </button>
                    )}
                  </div>
                  <div className="p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100">
                    <p className="text-slate-600 leading-relaxed font-medium text-base whitespace-pre-wrap">{course.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        <aside className={`${isSidebarOpen ? 'w-80 md:w-96' : 'w-0'} bg-white border-l border-slate-100 transition-all duration-300 overflow-hidden flex flex-col flex-shrink-0 relative hidden lg:flex shadow-2xl shadow-slate-900/5`}>
          <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-8">
            {course.author && (
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm relative group/mentor transition-all">
                {isAdmin && (
                  <button onClick={() => { setTempAuthor(course.author!); setIsMentorModalOpen(true); }} className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-indigo-50 rounded-xl text-slate-400 hover:text-indigo-600 opacity-0 group-hover/mentor:opacity-100 transition-all shadow-sm z-10">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg>
                  </button>
                )}
                
                <div className="flex items-center gap-4 mb-5">
                  <img src={course.author.avatar} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 shadow-md" alt={course.author.name} />
                  <div>
                    <h4 className="text-base font-black text-slate-900 leading-tight">{course.author.name}</h4>
                    <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-1">{course.author.role}</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className={`text-[11px] text-slate-500 font-medium leading-relaxed ${!isBioExpanded ? 'line-clamp-3' : ''} whitespace-pre-wrap`}>
                    {course.author.bio}
                  </p>
                  {course.author.bio.length > 100 && (
                    <button 
                      onClick={() => setIsBioExpanded(!isBioExpanded)}
                      className="text-[10px] font-black text-indigo-600 mt-2 hover:underline transition-all"
                    >
                      {isBioExpanded ? 'Show less' : 'See more...'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <a href={course.author.whatsapp ? `https://wa.me/${course.author.whatsapp.replace(/\D/g,'')}` : '#'} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#25D366]/10 text-[#128C7E] rounded-xl text-[10px] font-black transition-all hover:bg-[#25D366]/20 border border-[#25D366]/10">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.29-4.171c1.56.913 3.353 1.395 5.182 1.396 5.446 0 9.879-4.433 9.882-9.88 0-2.641-1.028-5.122-2.895-6.989-1.867-1.868-4.346-2.897-6.985-2.897-5.447 0-9.881 4.434-9.884 9.88-.001 1.83.479 3.623 1.391 5.184l-.941 3.441 3.53-.925zm11.091-7.555c-.3-.151-1.771-.874-2.046-.974s-.476-.151-.675.151-.775.974-.95 1.174-.35.225-.65.075c-.3-.151-1.265-.467-2.41-1.488-.891-.795-1.492-1.776-1.667-2.076s-.019-.462.13-.611c.134-.133.3-.35.45-.525s.2-.3.3-.5.05-.375-.025-.525-.675-1.625-.925-2.225c-.244-.582-.49-.503-.675-.512l-.575-.01c-.2 0-.525.075-.8.375s-1.05 1.025-1.05 2.5 1.075 2.9 1.225 3.1c.15.2 2.115 3.231 5.123 4.531.716.31 1.274.495 1.71.635.719.227 1.373.195 1.89.118.576-.085 1.771-.724 2.021-1.424s.25-1.3.175-1.425-.275-.225-.575-.375z"/></svg>
                    Contact WA
                  </a>
                  <a href={course.author.instagram ? `https://instagram.com/${course.author.instagram.replace('@','')}` : '#'} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-2.5 px-3 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black transition-all hover:bg-rose-100 border border-rose-100/50">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.245 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.332 2.633-1.308 3.608-.975.975-2.242 1.245-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.332-3.608-1.308-.975-.975-1.245-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.242 3.608-1.308 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.337 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.058-1.281.072-1.689.072-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    Instagram
                  </a>
                  <a href={course.author.linkedin ? course.author.linkedin : '#'} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#0077b5]/10 text-[#0077b5] rounded-xl text-[10px] font-black transition-all hover:bg-[#0077b5]/20 border border-[#0077b5]/10">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                    LinkedIn
                  </a>
                  <a href={course.author.tiktok ? `https://tiktok.com/@${course.author.tiktok.replace('@','')}` : '#'} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-100 text-slate-800 rounded-xl text-[10px] font-black transition-all hover:bg-slate-200 border border-slate-200">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a6.442 6.442 0 0 1-1.08-.75v7.53c.02 2.03-.54 4.13-1.93 5.61-1.48 1.58-3.72 2.36-5.91 2.16-2.31-.21-4.44-1.61-5.41-3.77-.95-2.12-.46-4.75 1.27-6.33 1.38-1.26 3.39-1.74 5.21-1.25v4.04c-1.1-.4-2.43-.07-3.21.84-.71.82-.79 2.04-.21 2.93.55.85 1.61 1.25 2.58 1.05.86-.18 1.51-.9 1.62-1.77.01-.16.01-.33.01-.5V.02z"/></svg>
                    TikTok
                  </a>
                </div>
                
                {course.author.website && (
                  <a href={course.author.website} target="_blank" rel="noreferrer" className="block w-full text-center py-4 bg-indigo-600 text-white rounded-xl text-[10px] font-black tracking-widest uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all transform active:scale-[0.98]">
                    VISIT WEBSITE
                  </a>
                )}
              </div>
            )}

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Kurikulum</h3>
                <div className="flex items-center gap-2">
                   {isAdmin && (
                     <button onClick={() => setIsAddLessonModalOpen(true)} className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-100 transition-all shadow-sm">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
                     </button>
                   )}
                </div>
              </div>
              <div className="space-y-2">
                {course.lessons.map((lesson, idx) => {
                  const active = activeLesson?.id === lesson.id;
                  const done = progress.completedLessons.includes(lesson.id);
                  return (
                    <div key={lesson.id} className="group relative">
                      <button 
                        onClick={() => setActiveLesson(lesson)}
                        className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all border ${active ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100' : 'hover:bg-slate-50 text-slate-600 border-transparent'}`}
                      >
                        <div className="flex items-center gap-4 min-w-0 text-left">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black transition-all flex-shrink-0 ${active ? 'bg-white text-indigo-600' : done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            {done ? '✓' : idx + 1}
                          </div>
                          <span className="text-xs font-bold truncate tracking-tight">{lesson.title}</span>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-widest ml-2 flex-shrink-0 ${active ? 'text-indigo-200' : 'text-slate-300'}`}>{lesson.duration}</span>
                      </button>
                      {isAdmin && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleOpenEditLesson(lesson); }} 
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white rounded-lg shadow-md text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* MODALS */}
      {isEditingBrand && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-white animate-in zoom-in-95">
            <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Ganti Branding App</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo Aplikasi (PNG Transparan Disarankan)</label>
                <div className="flex items-center gap-4">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300 ${tempBrandLogo ? '' : 'bg-slate-100'}`}>
                    {tempBrandLogo ? <img src={tempBrandLogo} className="w-full h-full object-contain" alt="Preview" /> : <span className="text-slate-400 text-2xl font-bold">?</span>}
                  </div>
                  <input type="file" ref={brandLogoInputRef} onChange={handleBrandLogoUpload} className="hidden" />
                  <button onClick={() => brandLogoInputRef.current?.click()} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all">Upload Logo</button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Aplikasi</label>
                <input type="text" value={tempBrandName} onChange={(e) => setTempBrandName(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold" />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsEditingBrand(false)} className="flex-1 py-4 text-sm font-bold text-slate-400">Batal</button>
                <button onClick={handleSaveBrand} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl">Simpan Branding</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditingCourseMeta && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Edit Detail Kursus</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Kursus</label>
                <input type="text" value={tempCourseTitle} onChange={(e) => setTempCourseTitle(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi Kursus</label>
                <textarea rows={8} value={tempCourseDesc} onChange={(e) => setTempCourseDesc(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-medium text-sm leading-relaxed" />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsEditingCourseMeta(false)} className="flex-1 py-4 text-sm font-bold text-slate-400">Batal</button>
                <button onClick={handleSaveCourseMeta} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl">Simpan Perubahan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isMentorModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl border border-white max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Edit Mentor & Social Links</h2>
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Foto Mentor</label>
                  <div className="flex items-center gap-4">
                    <img src={tempAuthor.avatar} className="w-20 h-20 rounded-2xl object-cover border-4 border-slate-50 shadow-lg" alt="Avatar" />
                    <input type="file" ref={mentorAvatarInputRef} onChange={handleMentorAvatarUpload} className="hidden" />
                    <button onClick={() => mentorAvatarInputRef.current?.click()} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all">Ganti Foto</button>
                  </div>
                </div>
                <div className="space-y-4">
                   <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Mentor</label>
                    <input type="text" value={tempAuthor.name} onChange={(e) => setTempAuthor({ ...tempAuthor, name: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</label>
                    <input type="text" value={tempAuthor.role} onChange={(e) => setTempAuthor({ ...tempAuthor, role: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bio (Deskripsi Mentor)</label>
                <textarea rows={4} value={tempAuthor.bio} onChange={(e) => setTempAuthor({ ...tempAuthor, bio: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-medium text-sm leading-relaxed" placeholder="Tulis bio mentor di sini..." />
              </div>

              <div className="space-y-4 border-t border-slate-50 pt-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Social Media Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp (e.g. 62812345678)</label>
                    <input type="text" value={tempAuthor.whatsapp || ''} onChange={(e) => setTempAuthor({ ...tempAuthor, whatsapp: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 text-sm font-bold text-emerald-600" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instagram Username</label>
                    <input type="text" value={tempAuthor.instagram || ''} onChange={(e) => setTempAuthor({ ...tempAuthor, instagram: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 text-sm font-bold text-rose-600" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">LinkedIn URL</label>
                    <input type="text" value={tempAuthor.linkedin || ''} onChange={(e) => setTempAuthor({ ...tempAuthor, linkedin: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 text-sm font-bold text-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TikTok Username</label>
                    <input type="text" value={tempAuthor.tiktok || ''} onChange={(e) => setTempAuthor({ ...tempAuthor, tiktok: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-800" />
                  </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Website URL</label>
                    <input type="text" value={tempAuthor.website || ''} onChange={(e) => setTempAuthor({ ...tempAuthor, website: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 text-sm font-bold text-indigo-600" placeholder="https://..." />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsMentorModalOpen(false)} className="flex-1 py-4 text-sm font-bold text-slate-400 transition-colors hover:text-slate-600">Batal</button>
                <button onClick={handleSaveMentor} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl transition-transform active:scale-95">Simpan Mentor</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditLessonModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-white animate-in zoom-in-95">
            <h2 className="text-xl font-black text-slate-900 mb-6 tracking-tight">Ganti Judul Pelajaran</h2>
            <input type="text" value={tempLessonRename} onChange={(e) => setTempLessonRename(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold mb-6" />
            <div className="flex gap-4">
              <button onClick={() => setIsEditLessonModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-400">Batal</button>
              <button onClick={handleSaveLessonRename} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursePlayer;