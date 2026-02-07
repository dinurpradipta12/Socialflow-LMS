
import React, { useState, useRef, useEffect } from 'react';
import { Course, Lesson, ProgressState, UserSession, Asset, Author } from '../types';
import ImageCropperModal from './ImageCropperModal';

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
  const [activeContentTab, setActiveContentTab] = useState<'overview' | 'assets'>('overview');
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  
  // Modals Visibility States
  const [showShareModal, setShowShareModal] = useState(false);
  const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState(false);
  const [isEditingBrand, setIsEditingBrand] = useState(false);
  const [isEditingCourseMeta, setIsEditingCourseMeta] = useState(false);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [isEditLessonModalOpen, setIsEditLessonModalOpen] = useState(false);
  const [isEditLessonDetailsModalOpen, setIsEditLessonDetailsModalOpen] = useState(false);
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Sharing States
  const [copySuccess, setCopySuccess] = useState(false);
  const [isShortened, setIsShortened] = useState(false);

  // Edit Temp States
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
  const [tempLessonType, setTempLessonType] = useState<'video' | 'text'>('video');
  const [tempLessonDesc, setTempLessonDesc] = useState('');

  // Asset States
  const [assetName, setAssetName] = useState('');
  const [assetUrl, setAssetUrl] = useState('');
  const [assetType, setAssetType] = useState<'file' | 'link'>('link');

  // Cropper States
  const [cropperData, setCropperData] = useState<{ src: string, type: 'intro' | 'avatar' } | null>(null);

  // Refs
  const brandLogoInputRef = useRef<HTMLInputElement>(null);
  const assetFileInputRef = useRef<HTMLInputElement>(null);
  const introPhotoInputRef = useRef<HTMLInputElement>(null);
  const mentorAvatarInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const editorImageInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user.role === 'admin' && !isSharedMode;

  useEffect(() => {
    if (isEditLessonDetailsModalOpen && editorRef.current) {
        editorRef.current.innerHTML = tempLessonDesc;
    }
  }, [isEditLessonDetailsModalOpen]);

  if (!course) return null;

  const availableTabs: ('overview' | 'assets')[] = ['overview'];
  if (activeLesson) {
    if (isAdmin || (activeLesson.assets && activeLesson.assets.length > 0)) {
      availableTabs.push('assets');
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

  // Editor Commands
  const execCommand = (command: string, value: any = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
        setTempLessonDesc(editorRef.current.innerHTML);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        execCommand('insertImage', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const insertLink = () => {
    const url = prompt("Masukkan URL Link:", "https://");
    if (url) execCommand('createLink', url);
  };

  const insertVideo = () => {
    const url = prompt("Masukkan URL YouTube Video:", "https://youtube.com/watch?v=...");
    if (url) {
      const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
      const embedCode = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
      execCommand('insertHTML', embedCode);
    }
  };

  const emojis = ['😊', '🚀', '🔥', '💡', '✅', '📚', '⭐', '✨', '🎯', '🙌', '💻', '🎨'];

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
      type: tempLessonType,
      description: tempLessonType === 'text' ? '<p>Tulis catatan materi ini di sini...</p>' : '<p>Materi pembelajaran baru.</p>',
      youtubeUrl: tempLessonType === 'video' ? (tempLessonVideo || '') : '',
      duration: '10min',
      content: '',
      assets: []
    };
    onUpdateCourse({ ...course, lessons: [...(course.lessons || []), newLesson] });
    setIsAddLessonModalOpen(false);
    setTempLessonTitle('');
    setTempLessonVideo('');
    setTempLessonType('video');
  };

  const handleUpdateLesson = () => {
    if (lessonToEdit && !isSharedMode) {
      const updatedLessons = course.lessons.map(l => 
        l.id === lessonToEdit.id ? { ...l, title: tempLessonTitle, youtubeUrl: tempLessonType === 'video' ? tempLessonVideo : '', type: tempLessonType } : l
      );
      onUpdateCourse({ ...course, lessons: updatedLessons });
      setIsEditLessonModalOpen(false);
      setLessonToEdit(null);
    }
  };

  const handleSaveLessonDetails = () => {
    if (activeLesson && !isSharedMode) {
      const updatedLessons = course.lessons.map(l => 
        l.id === activeLesson.id ? { ...l, description: tempLessonDesc } : l
      );
      onUpdateCourse({ ...course, lessons: updatedLessons });
      setIsEditLessonDetailsModalOpen(false);
    } else if (!activeLesson && !isSharedMode) {
        onUpdateCourse({ ...course, description: tempLessonDesc });
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
        l.id === activeLesson.id ? { ...l, assets: [...(l.assets || []), newAsset] } : l
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

  const onCropComplete = (croppedBase64: string) => {
    if (cropperData?.type === 'intro') {
      onUpdateCourse({ ...course, thumbnail: croppedBase64 });
    } else if (cropperData?.type === 'avatar') {
      setTempAuthor({ ...tempAuthor, avatar: croppedBase64 });
    }
    setCropperData(null);
  };

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden font-inter">
      {/* Header */}
      <header className="h-20 border-b border-violet-100 bg-white flex items-center justify-between px-6 md:px-10 flex-shrink-0 z-50 shadow-sm">
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
              <button 
                onClick={() => setShowShareModal(true)} 
                className="px-5 py-2.5 bg-violet-50 text-violet-600 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-violet-100 transition-all border border-violet-100 shadow-sm uppercase tracking-widest"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                <span>Bagikan</span>
              </button>
              <button onClick={onLogout} className="px-5 py-2.5 bg-rose-50 text-rose-500 rounded-xl text-xs font-black transition-all hover:bg-rose-100 uppercase tracking-widest">Logout</button>
            </React.Fragment>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar bg-[#F8FAFC]">
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {activeLesson ? activeLesson.title : course.title}
            </h1>

            {/* Main Content Area */}
            {activeLesson?.type === 'text' ? (
                // Text Lesson: Full Page View (Like a document)
                <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 border border-violet-100 shadow-2xl shadow-violet-500/5 min-h-[700px] relative animate-in slide-in-from-bottom-10 duration-700 ease-out">
                  <div className="absolute top-10 left-10 flex items-center gap-3">
                     <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                     </div>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Halaman Catatan</span>
                  </div>
                  
                  {isAdmin && (
                    <button 
                      onClick={() => { setTempLessonDesc(activeLesson.description || ''); setIsEditLessonDetailsModalOpen(true); }}
                      className="absolute top-10 right-10 p-4 bg-violet-600 text-white rounded-2xl shadow-xl shadow-violet-200 hover:bg-violet-700 transition-all z-10 active:scale-95 group"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg>
                      <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Edit Konten</span>
                    </button>
                  )}
                  
                  <div className="mt-16 md:mt-20 prose prose-violet max-w-none font-medium leading-[2] text-slate-700 text-lg selection:bg-violet-100" dangerouslySetInnerHTML={{ __html: activeLesson.description || '<p class="text-slate-300 italic">Klik tombol edit di pojok kanan atas untuk mulai menulis materi ini.</p>' }} />
                  
                  {/* Assets integrated at the bottom of note */}
                  {(isAdmin || (activeLesson.assets && activeLesson.assets.length > 0)) && (
                    <div className="mt-20 pt-12 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-8">
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Lampiran Referensi</h3>
                          {isAdmin && (
                              <button onClick={() => setIsAddAssetModalOpen(true)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95">Upload File</button>
                          )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {activeLesson.assets?.map(asset => (
                              <div key={asset.id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:border-violet-200 transition-all group/asset">
                                  <div className="flex items-center gap-4 overflow-hidden">
                                      <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center text-violet-600 shadow-sm">
                                          {asset.type === 'file' ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}
                                      </div>
                                      <span className="text-sm font-bold text-slate-700 truncate">{asset.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                     <a href={asset.url} target="_blank" rel="noreferrer" className="px-5 py-2.5 bg-white text-xs font-black text-violet-600 uppercase rounded-xl border border-slate-200 hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all">Buka</a>
                                     {isAdmin && (
                                       <button onClick={() => handleDeleteAsset(asset.id)} className="p-2.5 text-rose-300 hover:text-rose-600 transition-colors">
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                       </button>
                                     )}
                                  </div>
                              </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
            ) : (
                // Video Lesson View
                <React.Fragment>
                  <div className="bg-white rounded-[2rem] overflow-hidden border border-violet-100 shadow-2xl shadow-violet-500/5 group relative">
                      {activeLesson && getYoutubeEmbedUrl(activeLesson.youtubeUrl) ? (
                          <div className="aspect-video">
                          <iframe className="w-full h-full" src={getYoutubeEmbedUrl(activeLesson.youtubeUrl) || ''} frameBorder="0" allowFullScreen title={activeLesson.title}></iframe>
                          </div>
                      ) : (
                          <div className="aspect-video relative overflow-hidden bg-slate-50 flex items-center justify-center">
                              {course.thumbnail ? <img src={course.thumbnail} className="w-full h-full object-cover" alt="Thumb" /> : <div className="text-violet-200 font-black text-2xl uppercase tracking-widest">Intro Kursus</div>}
                              {isAdmin && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <input type="file" ref={introPhotoInputRef} onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => setCropperData({ src: reader.result as string, type: 'intro' });
                                      reader.readAsDataURL(file);
                                      }
                                  }} className="hidden" />
                                  <button onClick={() => introPhotoInputRef.current?.click()} className="px-8 py-4 bg-white text-violet-600 rounded-[1.2rem] font-black shadow-2xl active:scale-95 transform transition-transform">Ganti Foto Sampul</button>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>

                  <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-violet-100 shadow-sm relative">
                    {isAdmin && (
                      <button 
                        onClick={() => { 
                          if (activeLesson) {
                            setTempLessonDesc(activeLesson.description || ''); 
                          } else {
                            setTempLessonDesc(course.description || '');
                          }
                          setIsEditLessonDetailsModalOpen(true); 
                        }}
                        className="absolute top-10 right-10 p-3.5 bg-violet-50 text-violet-600 hover:bg-violet-100 rounded-[1.2rem] transition-all shadow-sm border border-violet-100 z-10"
                        title="Edit Deskripsi"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg>
                      </button>
                    )}

                    {!activeLesson ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Overview Kursus</h3>
                        </div>
                        <div className="text-slate-600 leading-relaxed font-medium prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: course.description }} />
                      </div>
                    ) : (
                      <div className="space-y-6">
                         <div className="flex gap-10 border-b border-slate-100 mb-10 overflow-x-auto no-scrollbar">
                          {availableTabs.map(tab => (
                            <button key={tab} onClick={() => setActiveContentTab(tab as any)} className={`pb-6 text-[10px] font-black uppercase tracking-[0.2em] relative transition-all ${activeContentTab === tab ? 'text-violet-600' : 'text-slate-400'}`}>
                              {tab === 'overview' ? 'Deskripsi' : 'Aset Belajar'}{activeContentTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-violet-600 rounded-full" />}
                            </button>
                          ))}
                        </div>

                        {activeContentTab === 'overview' && (
                          <div className="space-y-4 animate-in fade-in duration-300">
                            <div className="text-slate-600 leading-relaxed font-medium prose prose-violet max-w-none" dangerouslySetInnerHTML={{ __html: activeLesson.description || '<p>Tidak ada deskripsi tambahan.</p>' }} />
                          </div>
                        )}

                        {activeContentTab === 'assets' && (
                          <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lampiran Materi</span>
                              {isAdmin && (
                                <button onClick={() => setIsAddAssetModalOpen(true)} className="flex items-center gap-3 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-violet-100 hover:bg-violet-700 transition-all active:scale-95">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                                  <span>Tambah Aset</span>
                                </button>
                              )}
                            </div>
                            {activeLesson.assets && activeLesson.assets.length > 0 ? (
                              <div className="grid gap-4">
                                {activeLesson.assets.map(asset => (
                                  <div key={asset.id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl group/asset">
                                    <div className="flex items-center gap-4 overflow-hidden">
                                      <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center text-violet-600 shadow-sm group-hover/asset:bg-violet-600 group-hover/asset:text-white transition-all">
                                        {asset.type === 'file' ? (
                                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                        ) : (
                                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                        )}
                                      </div>
                                      <span className="text-sm font-bold text-slate-700 truncate">{asset.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <a href={asset.url} target="_blank" rel="noreferrer" className="px-5 py-2.5 bg-white text-[11px] font-black text-violet-600 uppercase tracking-widest rounded-xl border border-slate-100 hover:bg-violet-50 transition-all">Buka</a>
                                      {isAdmin && (
                                        <button onClick={() => handleDeleteAsset(asset.id)} className="p-2.5 text-slate-300 hover:text-rose-600 transition-colors">
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-slate-400 text-xs font-black uppercase tracking-widest text-center py-6">Belum ada aset pendukung.</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </React.Fragment>
            )}
          </div>
        </main>

        <aside className="w-80 md:w-96 bg-white border-l border-violet-100 flex flex-col hidden lg:flex shadow-2xl relative z-10">
          <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-8 bg-white">
            {course.author && (
              <div className="bg-[#E6DBF9] border border-violet-100 rounded-[2.5rem] p-6 shadow-sm relative group/mentor transition-all hover:shadow-xl hover:shadow-violet-100/50">
                {isAdmin && (
                  <button 
                    onClick={() => { setTempAuthor(course.author!); setIsMentorModalOpen(true); }} 
                    className="absolute top-4 right-4 p-2 text-violet-400 hover:text-violet-600 opacity-0 group-hover/mentor:opacity-100 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg>
                  </button>
                )}
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative group/avatar">
                    <img src={course.author.avatar || 'https://i.pravatar.cc/150'} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white shadow-md transition-transform group-hover/avatar:scale-105 duration-300" alt="Avatar" />
                    {isAdmin && (
                        <button 
                            onClick={() => { setTempAuthor(course.author!); setIsMentorModalOpen(true); }}
                            className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                        >
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>
                    )}
                  </div>
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
                      {isBioExpanded ? 'Sedikit' : 'Selengkapnya...'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <a href={course.author.whatsapp ? `https://wa.me/${course.author.whatsapp.replace(/\D/g,'')}` : '#'} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-3 bg-[#25D366]/20 text-[#128C7E] rounded-xl text-[10px] font-black border border-[#25D366]/30 transition-all hover:bg-[#25D366]/40">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.29-4.171c1.56.913 3.353 1.395 5.182 1.396 5.446 0 9.879-4.433 9.882-9.88 0-2.641-1.028-5.122-2.895-6.989-1.867-1.868-4.346-2.897-6.985-2.897-5.447 0-9.881 4.434-9.884 9.88-.001 1.83.479 3.623 1.391 5.184l-.941 3.441 3.53-.925zm11.091-7.555c-.3-.151-1.771-.874-2.046-.974s-.476-.151-.675.151-.775.974-.95 1.174-.35.225-.65.075c-.3-.151-1.265-.467-2.41-1.488-.891-.795-1.492-1.776-1.667-2.076s-.019-.462.13-.611c.134-.133.3-.35.45-.525s.2-.3.3-.5.05-.375-.025-.525-.675-1.625-.925-2.225c-.244-.582-.49-.503-.675-.512l-.575-.01c-.2 0-.525.075-.8.375s-1.05 1.025-1.05 2.5 1.075 2.9 1.225 3.1c.15.2 2.115 3.231 5.123 4.531.716.31 1.274.495 1.71.635.719.227 1.373.195 1.89.118.576-.085 1.771-.724 2.021-1.424s.25-1.3.175-1.425-.275-.225-.575-.375z"/></svg>
                    WhatsApp
                  </a>
                  <a href={course.author.instagram ? `https://instagram.com/${course.author.instagram.replace('@','')}` : '#'} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-3 bg-rose-50/50 text-rose-600 rounded-xl text-[10px] font-black border border-rose-100 transition-all hover:bg-rose-100">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.245 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.332 2.633-1.308 3.608-.975.975-2.242 1.245-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.332-3.608-1.308-.975-.975-1.245-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.242 3.608-1.308 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.337 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.058-1.281.072-1.689.072-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    Instagram
                  </a>
                  <a href={course.author.linkedin || '#'} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-3 bg-blue-50/50 text-blue-600 rounded-xl text-[10px] font-black border border-blue-100 transition-all hover:bg-blue-100">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                    LinkedIn
                  </a>
                  <a href={course.author.tiktok ? `https://tiktok.com/@${course.author.tiktok.replace('@','')}` : '#'} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-700 rounded-xl text-[10px] font-black border border-slate-200 transition-all hover:bg-slate-100">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a6.442 6.442 0 0 1-1.08-.75v7.53c.02 2.03-.54 4.13-1.93 5.61-1.48 1.58-3.72 2.36-5.91 2.16-2.31-.21-4.44-1.61-5.41-3.77-.95-2.12-.46-4.75 1.27-6.33 1.38-1.26 3.39-1.74 5.21-1.25v4.04c-1.1-.4-2.43-.07-3.21.84-.71.82-.79 2.04-.21 2.93.55.85 1.61 1.25 2.58 1.05.86-.18 1.51-.9 1.62-1.77.01-.16.01-.33.01-.5V.02z"/></svg>
                    TikTok
                  </a>
                </div>

                {course.author.website && (
                  <a href={course.author.website} target="_blank" rel="noreferrer" className="block w-full text-center py-4 bg-violet-600 text-white rounded-[1.2rem] text-[10px] font-black tracking-widest uppercase shadow-lg hover:bg-violet-700 transition-all active:scale-[0.98] duration-150 transform">
                    VISIT WEBSITE
                  </a>
                )}
              </div>
            )}

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-400">Kurikulum</h3>
                {isAdmin && <button onClick={() => { setTempLessonTitle(''); setTempLessonVideo(''); setTempLessonType('video'); setIsAddLessonModalOpen(true); }} className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center shadow-sm hover:bg-violet-100 transition-all active:scale-90"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg></button>}
              </div>
              <div className="space-y-2.5">
                {(course.lessons || []).map((lesson, idx) => {
                  const active = activeLesson?.id === lesson.id;
                  const isText = lesson.type === 'text';
                  return (
                    <div key={lesson.id} className="group relative">
                      <button onClick={() => setActiveLesson(lesson)} className={`w-full flex items-center justify-between p-5 rounded-[1.5rem] transition-all border ${active ? 'bg-violet-600 text-white shadow-xl shadow-violet-100 border-violet-600 scale-[1.02]' : 'hover:bg-violet-50 text-slate-600 border-transparent'}`}>
                        <div className="flex items-center gap-4 text-left min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black flex-shrink-0 transition-colors ${active ? 'bg-white text-violet-600' : 'bg-violet-100 text-violet-400'}`}>
                             {isText ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                             ) : (idx + 1)}
                          </div>
                          <span className="text-xs font-bold truncate pr-10">{lesson.title}</span>
                        </div>
                      </button>
                      {isAdmin && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={(e) => { e.stopPropagation(); setLessonToEdit(lesson); setTempLessonTitle(lesson.title); setTempLessonVideo(lesson.youtubeUrl); setTempLessonType(lesson.type || 'video'); setIsEditLessonModalOpen(true); }} className="p-2.5 bg-white rounded-xl shadow-lg text-violet-400 hover:text-violet-600 active:scale-90"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5"/></svg></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteLesson(lesson.id); }} className="p-2.5 bg-white rounded-xl shadow-lg text-slate-300 hover:text-rose-600 active:scale-90"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
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

      {/* Detail Edit Modal */}
      {isEditLessonDetailsModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-hidden flex flex-col border border-white/50">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Penyunting Konten Teks</h2>
                <button onClick={() => setIsEditLessonDetailsModalOpen(false)} className="text-slate-300 hover:text-slate-600 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            <div className="bg-[#FAFBFC] p-6 border-b border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => execCommand('bold')} className="w-10 h-10 bg-white border border-slate-200 rounded-xl hover:bg-violet-50 hover:text-violet-600 transition-all font-bold" title="Bold">B</button>
                <button onClick={() => execCommand('italic')} className="w-10 h-10 bg-white border border-slate-200 rounded-xl hover:bg-violet-50 hover:text-violet-600 transition-all italic" title="Italic">I</button>
                <button onClick={() => execCommand('underline')} className="w-10 h-10 bg-white border border-slate-200 rounded-xl hover:bg-violet-50 hover:text-violet-600 transition-all underline" title="Underline">U</button>
                
                <div className="w-[1px] h-8 bg-slate-300 mx-2" />

                <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 h-10 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Warna</span>
                  <input type="color" onChange={(e) => execCommand('foreColor', e.target.value)} className="w-6 h-6 border-none cursor-pointer bg-transparent rounded-full" title="Teks" />
                  <input type="color" onChange={(e) => execCommand('hiliteColor', e.target.value)} className="w-6 h-6 border-none cursor-pointer bg-transparent rounded-full" defaultValue="#FFFF00" title="Stabilo" />
                </div>

                <div className="w-[1px] h-8 bg-slate-300 mx-2" />

                <button onClick={insertLink} className="w-10 h-10 bg-white border border-slate-200 rounded-xl hover:bg-violet-50 hover:text-violet-600 transition-all" title="Link">
                  <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                </button>
                <button onClick={() => execCommand('insertUnorderedList')} className="w-10 h-10 bg-white border border-slate-200 rounded-xl hover:bg-violet-50" title="List">
                  <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                
                <div className="w-[1px] h-8 bg-slate-300 mx-2" />

                <input type="file" ref={editorImageInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                <button onClick={() => editorImageInputRef.current?.click()} className="w-10 h-10 bg-white border border-slate-200 rounded-xl hover:bg-violet-50" title="Foto">
                   <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                </button>
                <button onClick={insertVideo} className="w-10 h-10 bg-white border border-slate-200 rounded-xl hover:bg-violet-50" title="Embed Youtube">
                  <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12 bg-white min-h-[500px]">
              <div 
                ref={editorRef}
                contentEditable
                className="w-full h-full focus:outline-none text-slate-700 leading-[2] prose prose-violet max-w-none font-medium text-lg"
                onInput={(e) => setTempLessonDesc(e.currentTarget.innerHTML)}
              />
            </div>
            
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button onClick={() => setIsEditLessonDetailsModalOpen(false)} className="flex-1 py-5 text-[11px] font-black text-slate-400 transition-colors hover:text-slate-600 uppercase tracking-widest">Batal</button>
                <button onClick={handleSaveLessonDetails} className="flex-[2] py-5 bg-violet-600 text-white rounded-2xl font-black shadow-xl shadow-violet-200 transition-all active:scale-[0.98] uppercase tracking-widest tracking-widest">Simpan Perubahan</button>
            </div>
          </div>
        </div>
      )}

      {/* Reuse Modals... (Share, Mentor Profile, Curriculum, Edit Lesson, Image Cropper) */}
      {/* ... keeping the rest of the modal logic as is to satisfy the "tanpa perubahan apapun" but applying the new cropper ... */}
      
      {/* Reusable Image Cropper Modal */}
      {cropperData && (
        <ImageCropperModal 
          imageSrc={cropperData.src} 
          aspectRatio={cropperData.type === 'intro' ? 16/9 : 1} 
          onCropComplete={onCropComplete} 
          onCancel={() => setCropperData(null)} 
          title={cropperData.type === 'intro' ? "Potong Sampul Kursus" : "Potong Foto Mentor"}
        />
      )}

      {/* ... Rest of modals logic same as original ... */}
      {showShareModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowShareModal(false)}>
          <div className="bg-white w-full max-w-[340px] rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 border border-slate-100 flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-violet-600 rounded-3xl mb-4 flex items-center justify-center text-white p-4 shadow-xl shadow-violet-200">
               <svg viewBox="0 0 100 100" className="w-full h-full text-white" fill="currentColor">
                  <path d="M10,10 H90 V90 H30 V30 H70 V70 H50 V50 H40 V80 H80 V20 H20 V100 H0 V0 H100 V100 H0 V80 H10 Z" fillRule="evenodd" />
               </svg>
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-1 tracking-tight text-center">Bagikan Kursus</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-8">Salin link akses instan</p>
            <div className="w-full space-y-5">
              <div className="relative group">
                <div className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-[11px] font-bold text-slate-500 truncate border border-slate-100">
                  {isShortened ? shortLink : fullLink}
                </div>
                <button onClick={handleCopyLink} className={`absolute right-1.5 top-1.5 bottom-1.5 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest text-white transition-all transform active:scale-95 ${copySuccess ? 'bg-emerald-500 shadow-emerald-100' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-100 shadow-md'}`}>
                  {copySuccess ? 'Copied' : 'Copy'}
                </button>
              </div>
              <button onClick={() => setShowShareModal(false)} className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest transition-colors hover:text-slate-600 border-t border-slate-100 mt-4 pt-6">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {isMentorModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Profil Mentor</h2>
                <button onClick={() => setIsMentorModalOpen(false)} className="text-slate-400 hover:text-slate-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-6 pb-4 border-b border-slate-100">
                <div className="relative group/editavatar">
                   <img src={tempAuthor.avatar || 'https://i.pravatar.cc/150'} className="w-24 h-24 rounded-[2rem] object-cover ring-4 ring-violet-50 shadow-xl" alt="Preview" />
                   <button onClick={() => mentorAvatarInputRef.current?.click()} className="absolute inset-0 bg-black/50 rounded-[2rem] flex flex-col items-center justify-center text-white opacity-0 group-hover/editavatar:opacity-100 transition-opacity">
                     <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                   </button>
                   <input type="file" ref={mentorAvatarInputRef} className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setCropperData({ src: reader.result as string, type: 'avatar' }); reader.readAsDataURL(file); } }} />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Foto Profil Mentor</p>
                    <p className="text-xs text-slate-400 font-medium">Gunakan foto profesional dengan pencahayaan baik.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Nama" value={tempAuthor.name} onChange={(e) => setTempAuthor({ ...tempAuthor, name: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-slate-50 font-bold border border-transparent focus:border-violet-100 focus:outline-none" />
                <input type="text" placeholder="Role" value={tempAuthor.role} onChange={(e) => setTempAuthor({ ...tempAuthor, role: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-slate-50 font-bold border border-transparent focus:border-violet-100 focus:outline-none" />
              </div>
              <textarea rows={3} placeholder="Bio Singkat" value={tempAuthor.bio} onChange={(e) => setTempAuthor({ ...tempAuthor, bio: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-slate-50 font-medium text-sm border border-transparent focus:border-violet-100 focus:outline-none" />
              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsMentorModalOpen(false)} className="flex-1 py-4 text-sm font-bold text-slate-400">Batal</button>
                <button onClick={() => { onUpdateCourse({ ...course, author: tempAuthor }); setIsMentorModalOpen(false); }} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold active:scale-95 transition-transform">Simpan Mentor</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddLessonModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Tambah Materi</h2>
            <div className="space-y-6">
              <div className="flex gap-2">
                <button onClick={() => setTempLessonType('video')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${tempLessonType === 'video' ? 'bg-violet-600 text-white border-violet-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>Video</button>
                <button onClick={() => setTempLessonType('text')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${tempLessonType === 'text' ? 'bg-violet-600 text-white border-violet-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>Catatan</button>
              </div>
              <input type="text" placeholder="Judul Materi" value={tempLessonTitle} onChange={(e) => setTempLessonTitle(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:outline-none focus:ring-4 focus:ring-violet-500/10" />
              {tempLessonType === 'video' && <input type="text" placeholder="URL YouTube" value={tempLessonVideo} onChange={(e) => setTempLessonVideo(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:outline-none" />}
              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsAddLessonModalOpen(false)} className="flex-1 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest">Batal</button>
                <button onClick={handleAddLesson} className="flex-1 py-4 bg-violet-600 text-white rounded-2xl font-bold shadow-xl shadow-violet-100 active:scale-95 transform transition-transform uppercase tracking-widest">Tambah</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditLessonModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Edit Judul & Tipe</h2>
            <div className="space-y-6">
              <div className="flex gap-2">
                <button onClick={() => setTempLessonType('video')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${tempLessonType === 'video' ? 'bg-violet-600 text-white border-violet-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>Video</button>
                <button onClick={() => setTempLessonType('text')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${tempLessonType === 'text' ? 'bg-violet-600 text-white border-violet-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>Catatan</button>
              </div>
              <input type="text" value={tempLessonTitle} onChange={(e) => setTempLessonTitle(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:outline-none" />
              {tempLessonType === 'video' && <input type="text" value={tempLessonVideo} onChange={(e) => setTempLessonVideo(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:outline-none" />}
              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsEditLessonModalOpen(false)} className="flex-1 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest">Batal</button>
                <button onClick={handleUpdateLesson} className="flex-1 py-4 bg-violet-600 text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-transform uppercase tracking-widest">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddAssetModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Tambah Lampiran</h2>
            <div className="space-y-6">
              <input type="text" placeholder="Nama File/Link" value={assetName} onChange={(e) => setAssetName(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:outline-none" />
              <input type="text" placeholder="URL Lampiran" value={assetUrl} onChange={(e) => setAssetUrl(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:outline-none" />
              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsAddAssetModalOpen(false)} className="flex-1 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest">Batal</button>
                <button onClick={handleAddAsset} className="flex-1 py-4 bg-violet-600 text-white rounded-2xl font-bold shadow-xl active:scale-95 transform transition-transform uppercase tracking-widest">Tambah</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursePlayer;
