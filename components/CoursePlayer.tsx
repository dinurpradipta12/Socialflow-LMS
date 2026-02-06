
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
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  
  // Modals
  const [showShareModal, setShowShareModal] = useState(false);
  const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState(false);
  const [isEditingBrand, setIsEditingBrand] = useState(false);
  const [isEditingCourseMeta, setIsEditingCourseMeta] = useState(false);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [isEditLessonModalOpen, setIsEditLessonModalOpen] = useState(false);
  const [isEditLessonDetailsModalOpen, setIsEditLessonDetailsModalOpen] = useState(false);
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);

  // States
  const [copySuccess, setCopySuccess] = useState(false);
  const [isShortened, setIsShortened] = useState(false);
  const [tempBrandName, setTempBrandName] = useState(brandName);
  const [tempBrandLogo, setTempBrandLogo] = useState(brandLogo);
  const [tempCourseTitle, setTempCourseTitle] = useState(course.title);
  const [tempCourseDesc, setTempCourseDesc] = useState(course.description);
  const [tempAuthor, setTempAuthor] = useState<Author>(course.author || { 
    name: '', role: '', avatar: '', bio: '', rating: '5.0',
    whatsapp: '', instagram: '', linkedin: '', tiktok: '', website: ''
  });
  
  const [lessonToEdit, setLessonToEdit] = useState<Lesson | null>(null);
  const [tempLessonTitle, setTempLessonTitle] = useState('');
  const [tempLessonVideo, setTempLessonVideo] = useState('');

  // Lesson Detail Edits
  const [tempLessonDesc, setTempLessonDesc] = useState('');
  const [tempLessonContent, setTempLessonContent] = useState('');

  // Asset States
  const [assetName, setAssetName] = useState('');
  const [assetUrl, setAssetUrl] = useState('');
  const [assetType, setAssetType] = useState<'file' | 'link'>('link');

  const brandLogoInputRef = useRef<HTMLInputElement>(null);
  const assetFileInputRef = useRef<HTMLInputElement>(null);
  const introPhotoInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user.role === 'admin' && !isSharedMode;

  // Tabs Visibility Logic
  const availableTabs: ('overview' | 'assets' | 'notes')[] = ['overview'];
  if (activeLesson) {
    if (isAdmin || (activeLesson.assets && activeLesson.assets.length > 0)) {
      availableTabs.push('assets');
    }
    if (isAdmin || (activeLesson.content && activeLesson.content.trim().length > 0)) {
      availableTabs.push('notes');
    }
  }

  // Sharing Logic
  const fullLink = `${window.location.origin}${window.location.pathname}?share=${course.id}`;
  const shortLink = `https://arunika.site/s/${course.id.split('-')[1] || 'course'}`; 

  const handleCopyLink = () => {
    const linkToCopy = isShortened ? shortLink : fullLink;
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

  const handleAddLesson = () => {
    if (isSharedMode || !tempLessonTitle) return;
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: tempLessonTitle,
      description: 'Materi pembelajaran baru.',
      youtubeUrl: tempLessonVideo || '',
      duration: '10min',
      content: '',
      assets: []
    };
    onUpdateCourse({ ...course, lessons: [...course.lessons, newLesson] });
    setIsAddLessonModalOpen(false);
    setTempLessonTitle('');
    setTempLessonVideo('');
  };

  const handleUpdateLesson = () => {
    if (lessonToEdit && !isSharedMode) {
      const updatedLessons = course.lessons.map(l => 
        l.id === lessonToEdit.id ? { ...l, title: tempLessonTitle, youtubeUrl: tempLessonVideo } : l
      );
      onUpdateCourse({ ...course, lessons: updatedLessons });
      setIsEditLessonModalOpen(false);
      setLessonToEdit(null);
    }
  };

  const handleSaveLessonDetails = () => {
    if (activeLesson && !isSharedMode) {
      const updatedLessons = course.lessons.map(l => 
        l.id === activeLesson.id ? { ...l, description: tempLessonDesc, content: tempLessonContent } : l
      );
      onUpdateCourse({ ...course, lessons: updatedLessons });
      setIsEditLessonDetailsModalOpen(false);
    }
  };

  const handleAddAsset = () => {
    if (activeLesson && assetName && (assetUrl || assetType === 'file') && !isSharedMode) {
      const newAsset: Asset = {
        id: `asset-${Date.now()}`,
        name: assetName,
        url: assetUrl,
        type: assetType === 'file' ? 'file' : 'link'
      };
      const updatedLessons = course.lessons.map(l => 
        l.id === activeLesson.id ? { ...l, assets: [...l.assets, newAsset] } : l
      );
      onUpdateCourse({ ...course, lessons: updatedLessons });
      setIsAddAssetModalOpen(false);
      setAssetName('');
      setAssetUrl('');
    }
  };

  const handleDeleteAsset = (assetId: string) => {
    if (activeLesson && isAdmin && !isSharedMode) {
      const updatedLessons = course.lessons.map(l => 
        l.id === activeLesson.id ? { ...l, assets: l.assets.filter(a => a.id !== assetId) } : l
      );
      onUpdateCourse({ ...course, lessons: updatedLessons });
    }
  };

  const handleDeleteLesson = (lessonId: string) => {
    if (isSharedMode || !window.confirm('Hapus materi ini secara permanen?')) return;
    const updatedLessons = course.lessons.filter(l => l.id !== lessonId);
    onUpdateCourse({ ...course, lessons: updatedLessons });
    if (activeLesson?.id === lessonId) setActiveLesson(null);
  };

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden font-inter">
      {/* Header */}
      <header className="h-20 border-b border-violet-100 bg-white flex items-center justify-between px-6 md:px-10 flex-shrink-0 z-50">
        <div className="flex items-center gap-6">
          {!isSharedMode && (
            <button 
              onClick={onBackToDashboard}
              className="p-2.5 bg-violet-50 text-violet-400 hover:text-violet-600 rounded-xl transition-all shadow-sm border border-violet-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden transition-all ${brandLogo ? 'bg-transparent' : 'bg-violet-600 shadow-lg border border-violet-100 p-2'}`}>
              {brandLogo ? (
                <img src={brandLogo} className="w-full h-full object-contain" alt="Logo" />
              ) : (
                <svg viewBox="0 0 100 100" className="w-full h-full text-white" fill="currentColor">
                  <path d="M10,10 H90 V90 H30 V30 H70 V70 H50 V50 H40 V80 H80 V20 H20 V100 H0 V0 H100 V100 H0 V80 H10 Z" fillRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-slate-900 hidden sm:block">{brandName}</span>
              {isAdmin && (
                <button onClick={() => { setTempBrandName(brandName); setTempBrandLogo(brandLogo); setIsEditingBrand(true); }} className="text-violet-300 hover:text-violet-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg>
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!isSharedMode && (
            <React.Fragment>
              <button onClick={() => setShowShareModal(true)} className="px-5 py-2.5 bg-violet-50 text-violet-600 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-violet-100 transition-all border border-violet-100 shadow-sm uppercase tracking-widest">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                <span>Bagikan</span>
              </button>
              <button onClick={onLogout} className="px-5 py-2.5 bg-rose-50 text-rose-500 rounded-xl text-xs font-black transition-all hover:bg-rose-100 uppercase tracking-widest">Logout</button>
            </React.Fragment>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar bg-white">
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {activeLesson ? activeLesson.title : course.title}
            </h1>

            <div className="bg-white rounded-[2rem] overflow-hidden border border-violet-100 shadow-2xl shadow-violet-500/5 group relative">
              {activeLesson && getYoutubeEmbedUrl(activeLesson.youtubeUrl) ? (
                <div className="aspect-video">
                  <iframe className="w-full h-full" src={getYoutubeEmbedUrl(activeLesson.youtubeUrl) || ''} frameBorder="0" allowFullScreen title={activeLesson.title}></iframe>
                </div>
              ) : (
                <div className="aspect-video relative overflow-hidden bg-slate-50 flex items-center justify-center">
                  {course.thumbnail ? <img src={course.thumbnail} className="w-full h-full object-cover" alt="Thumb" /> : <div className="text-violet-200 font-black text-2xl uppercase tracking-widest">Pilih Materi</div>}
                  {isAdmin && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <input type="file" ref={introPhotoInputRef} onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => onUpdateCourse({ ...course, thumbnail: reader.result as string });
                          reader.readAsDataURL(file);
                        }
                      }} className="hidden" />
                      <button onClick={() => introPhotoInputRef.current?.click()} className="px-6 py-3 bg-white text-violet-600 rounded-2xl font-black shadow-2xl">Ganti Foto Intro</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-violet-100 shadow-sm relative">
              {isAdmin && activeLesson && (
                <button 
                  onClick={() => { setTempLessonDesc(activeLesson.description || ''); setTempLessonContent(activeLesson.content || ''); setIsEditLessonDetailsModalOpen(true); }}
                  className="absolute top-8 right-8 p-3 bg-violet-50 text-violet-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all shadow-sm border border-violet-100 z-10"
                  title="Edit Detail Materi"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg>
                </button>
              )}

              {!activeLesson ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Overview Kursus</h3>
                    {isAdmin && <button onClick={() => { setTempCourseTitle(course.title); setTempCourseDesc(course.description); setIsEditingCourseMeta(true); }} className="text-violet-600 font-black text-xs px-4 py-2 bg-violet-50 rounded-xl">Edit</button>}
                  </div>
                  <p className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{course.description}</p>
                </div>
              ) : (
                <div className="space-y-6">
                   <div className="flex gap-8 border-b border-violet-50 mb-8 overflow-x-auto no-scrollbar">
                    {availableTabs.map(tab => (
                      <button key={tab} onClick={() => setActiveContentTab(tab as any)} className={`pb-4 text-xs font-black uppercase tracking-widest relative transition-all ${activeContentTab === tab ? 'text-violet-600' : 'text-slate-300'}`}>
                        {tab}{activeContentTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-violet-600 rounded-full" />}
                      </button>
                    ))}
                  </div>

                  {activeContentTab === 'overview' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <p className="text-slate-600 leading-relaxed font-medium">{activeLesson.description || 'Tidak ada deskripsi.'}</p>
                    </div>
                  )}

                  {activeContentTab === 'assets' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Lampiran Materi</span>
                        {isAdmin && (
                          <button onClick={() => setIsAddAssetModalOpen(true)} className="p-2 bg-violet-50 text-violet-600 rounded-lg hover:bg-violet-100" title="Upload Asset">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                          </button>
                        )}
                      </div>
                      {activeLesson.assets && activeLesson.assets.length > 0 ? (
                        <div className="grid gap-3">
                          {activeLesson.assets.map(asset => (
                            <div key={asset.id} className="flex items-center justify-between p-4 bg-violet-50/30 border border-violet-100 rounded-2xl group/asset">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-violet-600 shadow-sm">
                                  {asset.type === 'file' ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                  ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                  )}
                                </div>
                                <span className="text-sm font-bold text-slate-700">{asset.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <a href={asset.url} target="_blank" rel="noreferrer" className="px-4 py-2 bg-white text-xs font-black text-violet-600 uppercase tracking-widest rounded-xl border border-violet-50 hover:bg-violet-50 transition-all">Download</a>
                                {isAdmin && (
                                  <button onClick={() => handleDeleteAsset(asset.id)} className="p-2 text-violet-300 hover:text-rose-600 opacity-0 group-hover/asset:opacity-100 transition-all">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 text-sm font-medium">Belum ada lampiran aset.</p>
                      )}
                    </div>
                  )}

                  {activeContentTab === 'notes' && (
                    <div className="animate-in fade-in duration-300">
                      <div className="p-8 bg-violet-50/50 border border-violet-100 rounded-[2rem] text-slate-600 whitespace-pre-wrap font-medium text-sm leading-relaxed">
                        {activeLesson.content || 'Catatan kosong.'}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>

        <aside className="w-80 md:w-96 bg-white border-l border-violet-100 flex flex-col hidden lg:flex shadow-2xl">
          <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-8 bg-white">
            {/* MENTOR CARD - ENSURE VISIBILITY ABOVE CURRICULUM */}
            {course.author && (
              <div className="bg-[#E6DBF9] border border-violet-100 rounded-[2.5rem] p-6 shadow-sm relative group/mentor transition-all">
                {isAdmin && <button onClick={() => { setTempAuthor(course.author!); setIsMentorModalOpen(true); }} className="absolute top-4 right-4 p-2 text-violet-400 hover:text-violet-600 opacity-0 group-hover/mentor:opacity-100 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg></button>}
                
                <div className="flex items-center gap-4 mb-4">
                  <img src={course.author.avatar} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white shadow-md" alt="Avatar" />
                  <div>
                    <h4 className="text-base font-black text-slate-900 leading-tight">{course.author.name}</h4>
                    <p className="text-[10px] text-violet-700 font-bold uppercase tracking-widest mt-1">{course.author.role}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className={`text-[11px] text-slate-500 font-medium leading-relaxed ${!isBioExpanded ? 'line-clamp-3' : ''}`}>
                    {course.author.bio}
                  </p>
                  {course.author.bio.length > 80 && (
                    <button onClick={() => setIsBioExpanded(!isBioExpanded)} className="text-[10px] font-black text-violet-700 mt-2 hover:underline">
                      {isBioExpanded ? 'See less' : 'See more...'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <a href={course.author.whatsapp ? `https://wa.me/${course.author.whatsapp.replace(/\D/g,'')}` : '#'} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 py-2.5 bg-[#25D366]/20 text-[#128C7E] rounded-xl text-[10px] font-black border border-[#25D366]/30 transition-all hover:bg-[#25D366]/40">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.29-4.171c1.56.913 3.353 1.395 5.182 1.396 5.446 0 9.879-4.433 9.882-9.88 0-2.641-1.028-5.122-2.895-6.989-1.867-1.868-4.346-2.897-6.985-2.897-5.447 0-9.881 4.434-9.884 9.88-.001 1.83.479 3.623 1.391 5.184l-.941 3.441 3.53-.925zm11.091-7.555c-.3-.151-1.771-.874-2.046-.974s-.476-.151-.675.151-.775.974-.95 1.174-.35.225-.65.075c-.3-.151-1.265-.467-2.41-1.488-.891-.795-1.492-1.776-1.667-2.076s-.019-.462.13-.611c.134-.133.3-.35.45-.525s.2-.3.3-.5.05-.375-.025-.525-.675-1.625-.925-2.225c-.244-.582-.49-.503-.675-.512l-.575-.01c-.2 0-.525.075-.8.375s-1.05 1.025-1.05 2.5 1.075 2.9 1.225 3.1c.15.2 2.115 3.231 5.123 4.531.716.31 1.274.495 1.71.635.719.227 1.373.195 1.89.118.576-.085 1.771-.724 2.021-1.424s.25-1.3.175-1.425-.275-.225-.575-.375z"/></svg>
                    WA
                  </a>
                  <a href={course.author.instagram ? `https://instagram.com/${course.author.instagram.replace('@','')}` : '#'} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 py-2.5 bg-rose-50/50 text-rose-600 rounded-xl text-[10px] font-black border border-rose-100 transition-all hover:bg-rose-100">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.245 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.332 2.633-1.308 3.608-.975.975-2.242 1.245-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.332-3.608-1.308-.975-.975-1.245-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.242 3.608-1.308 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.337 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.058-1.281.072-1.689.072-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    Instagram
                  </a>
                  <a href={course.author.linkedin || '#'} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 py-2.5 bg-blue-50/50 text-blue-600 rounded-xl text-[10px] font-black border border-blue-100 transition-all hover:bg-blue-100">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                    LinkedIn
                  </a>
                  <a href={course.author.tiktok ? `https://tiktok.com/@${course.author.tiktok.replace('@','')}` : '#'} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-50/50 text-slate-700 rounded-xl text-[10px] font-black border border-slate-200 transition-all hover:bg-slate-100">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a6.442 6.442 0 0 1-1.08-.75v7.53c.02 2.03-.54 4.13-1.93 5.61-1.48 1.58-3.72 2.36-5.91 2.16-2.31-.21-4.44-1.61-5.41-3.77-.95-2.12-.46-4.75 1.27-6.33 1.38-1.26 3.39-1.74 5.21-1.25v4.04c-1.1-.4-2.43-.07-3.21.84-.71.82-.79 2.04-.21 2.93.55.85 1.61 1.25 2.58 1.05.86-.18 1.51-.9 1.62-1.77.01-.16.01-.33.01-.5V.02z"/></svg>
                    TikTok
                  </a>
                </div>

                {course.author.website && (
                  <a href={course.author.website} target="_blank" rel="noreferrer" className="block w-full text-center py-4 bg-violet-600 text-white rounded-xl text-[10px] font-black tracking-widest uppercase shadow-lg hover:bg-violet-700 transition-all">
                    VISIT WEBSITE
                  </a>
                )}
              </div>
            )}

            {/* CURRICULUM SECTION */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-violet-400">Kurikulum</h3>
                {isAdmin && <button onClick={() => { setTempLessonTitle(''); setTempLessonVideo(''); setIsAddLessonModalOpen(true); }} className="w-8 h-8 bg-violet-50 text-violet-600 rounded-lg flex items-center justify-center shadow-sm"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg></button>}
              </div>
              <div className="space-y-2">
                {course.lessons.map((lesson, idx) => {
                  const active = activeLesson?.id === lesson.id;
                  return (
                    <div key={lesson.id} className="group relative">
                      <button onClick={() => setActiveLesson(lesson)} className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all border ${active ? 'bg-violet-600 text-white shadow-xl border-violet-600' : 'hover:bg-violet-50 text-slate-600 border-transparent'}`}>
                        <div className="flex items-center gap-4 text-left min-w-0">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${active ? 'bg-white text-violet-600' : 'bg-violet-100 text-violet-400'}`}>{idx + 1}</div>
                          <span className="text-xs font-bold truncate">{lesson.title}</span>
                        </div>
                      </button>
                      {isAdmin && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={(e) => { e.stopPropagation(); setLessonToEdit(lesson); setTempLessonTitle(lesson.title); setTempLessonVideo(lesson.youtubeUrl); setIsEditLessonModalOpen(true); }} className="p-2 bg-white rounded-lg shadow-md text-violet-400 hover:text-violet-600"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteLesson(lesson.id); }} className="p-2 bg-white rounded-lg shadow-md text-violet-400 hover:text-rose-600"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Share Modal - Refined to small aesthetic popup */}
      {showShareModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-[320px] rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 border border-slate-100 flex flex-col items-center">
            <div className="w-12 h-12 bg-violet-600 rounded-2xl mb-4 flex items-center justify-center text-white p-2.5 shadow-lg shadow-violet-100">
               <svg viewBox="0 0 100 100" className="w-full h-full text-white" fill="currentColor">
                  <path d="M10,10 H90 V90 H30 V30 H70 V70 H50 V50 H40 V80 H80 V20 H20 V100 H0 V0 H100 V100 H0 V80 H10 Z" fillRule="evenodd" />
               </svg>
            </div>
            <h2 className="text-lg font-black text-slate-900 mb-1 tracking-tight text-center">Bagikan Kursus</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-6">Akses Link Preview</p>
            <div className="w-full space-y-4">
              <div className="relative group">
                <div className="w-full px-4 py-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-500 truncate border border-slate-100">
                  {isShortened ? shortLink : fullLink}
                </div>
                <button 
                  onClick={handleCopyLink} 
                  className={`absolute right-1 top-1 bottom-1 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest text-white transition-all ${copySuccess ? 'bg-emerald-500 shadow-emerald-100' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-100 shadow-md'}`}
                >
                  {copySuccess ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="flex items-center justify-center gap-4">
                <button 
                  onClick={() => setIsShortened(!isShortened)} 
                  className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${isShortened ? 'bg-violet-600 text-white border-violet-600' : 'text-violet-600 border-violet-100 bg-violet-50/50 hover:bg-violet-50'}`}
                >
                  {isShortened ? 'Link Pendek Aktif' : 'Perpendek Link?'}
                </button>
              </div>
              <button 
                onClick={() => setShowShareModal(false)} 
                className="w-full py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest transition-colors hover:text-slate-600 border-t border-slate-50 mt-2 pt-4"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lesson Modal */}
      {isAddLessonModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Tambah Kurikulum</h2>
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Materi</label>
                <input type="text" value={tempLessonTitle} onChange={(e) => setTempLessonTitle(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:ring-4 focus:ring-violet-500/10 focus:outline-none" placeholder="Contoh: Pengenalan Interface" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL YouTube</label>
                <input type="text" value={tempLessonVideo} onChange={(e) => setTempLessonVideo(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:ring-4 focus:ring-violet-500/10 focus:outline-none" placeholder="https://youtube.com/..." />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsAddLessonModalOpen(false)} className="flex-1 py-4 text-sm font-bold text-slate-400 transition-colors hover:text-slate-600">Batal</button>
                <button onClick={handleAddLesson} className="flex-1 py-4 bg-violet-600 text-white rounded-2xl font-bold shadow-xl shadow-violet-100 transition-all active:scale-[0.98]">Tambah Materi</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lesson Modal */}
      {isEditLessonModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Edit Materi</h2>
            <div className="space-y-6">
               <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Materi</label>
                <input type="text" value={tempLessonTitle} onChange={(e) => setTempLessonTitle(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:ring-4 focus:ring-violet-500/10 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL YouTube</label>
                <input type="text" value={tempLessonVideo} onChange={(e) => setTempLessonVideo(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:ring-4 focus:ring-violet-500/10 focus:outline-none" />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsEditLessonModalOpen(false)} className="flex-1 py-4 text-sm font-bold text-slate-400 transition-colors hover:text-slate-600">Batal</button>
                <button onClick={handleUpdateLesson} className="flex-1 py-4 bg-violet-600 text-white rounded-2xl font-bold shadow-xl shadow-violet-100 transition-all active:scale-[0.98]">Simpan Perubahan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* App Branding Modal */}
      {isEditingBrand && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">App Branding</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo (Upload PNG Transparan)</label>
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-xl border-2 border-dashed border-violet-200 flex items-center justify-center overflow-hidden ${tempBrandLogo ? '' : 'bg-slate-50'}`}>
                    {tempBrandLogo ? <img src={tempBrandLogo} className="w-full h-full object-contain" alt="Logo" /> : <span className="text-slate-300">?</span>}
                  </div>
                  <input type="file" ref={brandLogoInputRef} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setTempBrandLogo(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} className="hidden" />
                  <button onClick={() => brandLogoInputRef.current?.click()} className="px-4 py-2 bg-violet-50 text-violet-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-violet-100 transition-all hover:bg-violet-100">Upload</button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama App</label>
                <input type="text" value={tempBrandName} onChange={(e) => setTempBrandName(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:outline-none" />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsEditingBrand(false)} className="flex-1 py-4 text-sm font-bold text-slate-400 transition-colors hover:text-slate-600">Batal</button>
                <button onClick={() => { setBrandName(tempBrandName); setBrandLogo(tempBrandLogo); setIsEditingBrand(false); }} className="flex-1 py-4 bg-violet-600 text-white rounded-2xl font-bold shadow-xl shadow-violet-100 transition-all active:scale-[0.98]">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Detail Modal (Title/Desc) */}
      {isEditingCourseMeta && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Edit Detail Kursus</h2>
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Kursus</label>
                <input type="text" value={tempCourseTitle} onChange={(e) => setTempCourseTitle(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi Kursus</label>
                <textarea rows={6} value={tempCourseDesc} onChange={(e) => setTempCourseDesc(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-medium text-sm leading-relaxed" />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsEditingCourseMeta(false)} className="flex-1 py-4 text-sm font-bold text-slate-400 transition-colors hover:text-slate-600">Batal</button>
                <button onClick={() => { onUpdateCourse({ ...course, title: tempCourseTitle, description: tempCourseDesc }); setIsEditingCourseMeta(false); }} className="flex-1 py-4 bg-violet-600 text-white rounded-2xl font-bold shadow-xl shadow-violet-100 transition-all active:scale-[0.98]">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mentor Detail Modal */}
      {isMentorModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Edit Profil Mentor</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama</label>
                  <input type="text" value={tempAuthor.name} onChange={(e) => setTempAuthor({ ...tempAuthor, name: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-slate-50 font-bold" placeholder="Nama Mentor" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role</label>
                  <input type="text" value={tempAuthor.role} onChange={(e) => setTempAuthor({ ...tempAuthor, role: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-slate-50 font-bold" placeholder="Role" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bio</label>
                <textarea rows={4} value={tempAuthor.bio} onChange={(e) => setTempAuthor({ ...tempAuthor, bio: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-slate-50 font-medium text-sm leading-relaxed" placeholder="Bio..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp (628...)</label>
                  <input type="text" value={tempAuthor.whatsapp || ''} onChange={(e) => setTempAuthor({ ...tempAuthor, whatsapp: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-slate-50 font-bold" placeholder="628..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Instagram (@user)</label>
                  <input type="text" value={tempAuthor.instagram || ''} onChange={(e) => setTempAuthor({ ...tempAuthor, instagram: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-slate-50 font-bold" placeholder="@user" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">LinkedIn URL</label>
                  <input type="text" value={tempAuthor.linkedin || ''} onChange={(e) => setTempAuthor({ ...tempAuthor, linkedin: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-slate-50 font-bold" placeholder="Link" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">TikTok (@user)</label>
                  <input type="text" value={tempAuthor.tiktok || ''} onChange={(e) => setTempAuthor({ ...tempAuthor, tiktok: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-slate-50 font-bold" placeholder="@user" />
                </div>
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Website URL</label>
                  <input type="text" value={tempAuthor.website || ''} onChange={(e) => setTempAuthor({ ...tempAuthor, website: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-slate-50 font-bold" placeholder="https://..." />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsMentorModalOpen(false)} className="flex-1 py-4 text-sm font-bold text-slate-400 transition-colors hover:text-slate-600">Batal</button>
                <button onClick={() => { onUpdateCourse({ ...course, author: tempAuthor }); setIsMentorModalOpen(false); }} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 transition-all active:scale-[0.98]">Simpan Mentor</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lesson Details Modal */}
      {isEditLessonDetailsModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Edit Detail Materi</h2>
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Overview Materi</label>
                <textarea rows={4} value={tempLessonDesc} onChange={(e) => setTempLessonDesc(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-medium text-sm leading-relaxed" placeholder="Deskripsi singkat materi..." />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catatan / Konten Detail (Notes)</label>
                <textarea rows={8} value={tempLessonContent} onChange={(e) => setTempLessonContent(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-medium text-sm leading-relaxed" placeholder="Tulis catatan lengkap atau konten materi di sini..." />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsEditLessonDetailsModalOpen(false)} className="flex-1 py-4 text-sm font-bold text-slate-400 transition-colors hover:text-slate-600">Batal</button>
                <button onClick={handleSaveLessonDetails} className="flex-1 py-4 bg-violet-600 text-white rounded-2xl font-bold shadow-xl shadow-violet-100 transition-all active:scale-[0.98]">Simpan Detail</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      {isAddAssetModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Upload / Tambah Asset</h2>
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Asset</label>
                <input type="text" value={assetName} onChange={(e) => setAssetName(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:outline-none" placeholder="e.g. Starter Kit PDF" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipe Asset</label>
                <div className="flex gap-2">
                  <button onClick={() => setAssetType('link')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${assetType === 'link' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-400 border-violet-100'}`}>Link</button>
                  <button onClick={() => setAssetType('file')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${assetType === 'file' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-400 border-violet-100'}`}>File (PDF/ZIP)</button>
                </div>
              </div>
              {assetType === 'link' ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL Link</label>
                  <input type="text" value={assetUrl} onChange={(e) => setAssetUrl(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-medium text-sm" placeholder="https://..." />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Upload File</label>
                  <div className="flex items-center gap-4">
                    <input type="file" ref={assetFileInputRef} onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (file) {
                         const reader = new FileReader();
                         reader.onloadend = () => { setAssetUrl(reader.result as string); setAssetName(file.name); };
                         reader.readAsDataURL(file);
                       }
                    }} className="hidden" accept=".pdf,.zip,.rar,.7z" />
                    <button onClick={() => assetFileInputRef.current?.click()} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold border border-dashed border-slate-200 hover:bg-slate-100 transition-all">Pilih File</button>
                  </div>
                  {assetUrl && <div className="text-[10px] text-emerald-500 font-black uppercase tracking-widest text-center">File terpilih: {assetName}</div>}
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsAddAssetModalOpen(false)} className="flex-1 py-4 text-sm font-bold text-slate-400 transition-colors hover:text-slate-600">Batal</button>
                <button onClick={handleAddAsset} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 transition-all active:scale-[0.98]">Simpan Asset</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursePlayer;
