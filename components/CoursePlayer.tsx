
import React, { useState, useRef } from 'react';
import { Course, Lesson, ProgressState, UserSession, Asset } from '../types';

interface CoursePlayerProps {
  course: Course;
  courses: Course[];
  activeLesson: Lesson | null;
  setActiveLesson: (lesson: Lesson | null) => void;
  onSelectCourse: (course: Course) => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
  user: UserSession;
  progress: ProgressState;
  toggleLessonComplete: (lessonId: string) => void;
  onUpdateCourse: (updatedCourse: Course) => void;
  isSharedMode?: boolean;
}

const CoursePlayer: React.FC<CoursePlayerProps> = ({ 
  course, 
  activeLesson, 
  setActiveLesson, 
  onLogout,
  onOpenAdmin,
  user,
  progress,
  toggleLessonComplete,
  onUpdateCourse,
  isSharedMode = false
}) => {
  const [activeContentTab, setActiveContentTab] = useState<'overview' | 'assets' | 'notes'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Modals & Popups
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isShortened, setIsShortened] = useState(false);
  
  // Admin Edit Modals
  const [editingVideo, setEditingVideo] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState(false);
  
  // Temporary form states
  const [tempVideoUrl, setTempVideoUrl] = useState('');
  const [tempLessonTitle, setTempLessonTitle] = useState('');
  const [tempAssetName, setTempAssetName] = useState('');
  const [tempAssetUrl, setTempAssetUrl] = useState('');
  const [assetSourceType, setAssetSourceType] = useState<'link' | 'file'>('link');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSharedMode) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempAssetUrl(reader.result as string);
        if (!tempAssetName) setTempAssetName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveAsset = () => {
    if (isSharedMode || !activeLesson || !tempAssetName || !tempAssetUrl) return;
    let newAssets: Asset[];
    if (editingAsset) {
      newAssets = activeLesson.assets.map(a => 
        a.id === editingAsset.id 
          ? { ...a, name: tempAssetName, url: tempAssetUrl, type: assetSourceType === 'link' ? 'link' : 'file' } 
          : a
      );
    } else {
      const newAsset: Asset = {
        id: `a-${Date.now()}`,
        name: tempAssetName,
        url: tempAssetUrl,
        type: assetSourceType === 'link' ? 'link' : 'file'
      };
      newAssets = [...activeLesson.assets, newAsset];
    }
    updateLessonData(activeLesson.id, { assets: newAssets });
    closeAssetModal();
  };

  const deleteAsset = (assetId: string) => {
    if (isSharedMode || !activeLesson || !window.confirm('Hapus aset ini secara permanen?')) return;
    const filtered = activeLesson.assets.filter(a => a.id !== assetId);
    updateLessonData(activeLesson.id, { assets: filtered });
  };

  const openEditAsset = (asset: Asset) => {
    if (isSharedMode) return;
    setEditingAsset(asset);
    setTempAssetName(asset.name);
    setTempAssetUrl(asset.url);
    setAssetSourceType(asset.type === 'link' ? 'link' : 'file');
    setIsAssetModalOpen(true);
  };

  const closeAssetModal = () => {
    setIsAssetModalOpen(false);
    setEditingAsset(null);
    setTempAssetName('');
    setTempAssetUrl('');
  };

  const handleAddLesson = () => {
    if (isSharedMode || !tempLessonTitle) return;
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: tempLessonTitle,
      description: 'Materi baru ditambahkan.',
      youtubeUrl: tempVideoUrl || '',
      duration: '10min',
      content: 'Isi materi pelajaran di sini.',
      assets: []
    };
    onUpdateCourse({ ...course, lessons: [...course.lessons, newLesson] });
    setIsAddLessonModalOpen(false);
    setTempLessonTitle('');
    setTempVideoUrl('');
  };

  const isLessonCompleted = activeLesson ? progress.completedLessons.includes(activeLesson.id) : false;

  return (
    <div className="flex flex-col h-screen bg-[#f9fafb] overflow-hidden font-inter">
      {/* Top Header */}
      <header className="h-20 border-b border-gray-100 bg-white flex items-center justify-between px-6 md:px-10 flex-shrink-0 z-50">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveLesson(null)}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg">A</div>
            <span className="font-bold text-lg tracking-tight text-slate-900 hidden sm:block">Arunika</span>
          </div>
          <div className="h-8 w-px bg-slate-100 hidden sm:block"></div>
          
          <div className="flex items-center gap-2 group">
            <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <span>{course.category}</span>
              <span>/</span>
              <span className="text-slate-900 line-clamp-1">{course.title}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!isSharedMode && (
            <button 
              onClick={() => setShowShareModal(true)}
              className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
              <span>Bagikan</span>
            </button>
          )}

          {isAdmin && (
            <button onClick={onOpenAdmin} className="hidden md:flex px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
              Admin Panel
            </button>
          )}

          <button onClick={onLogout} className="px-4 py-2 bg-rose-50 text-rose-500 rounded-xl text-xs font-bold">
            {isSharedMode ? 'Ke Login' : 'Sign Out'}
          </button>

          <div className="h-10 w-px bg-slate-100 mx-2 hidden sm:block"></div>
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
               <p className="text-sm font-bold text-slate-900 leading-none">{user.username}</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                 {isSharedMode ? 'Public Viewer' : user.role}
               </p>
             </div>
             <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${isSharedMode ? 'bg-slate-50 text-slate-300' : 'bg-indigo-100 text-indigo-600'}`}>
               {user.username.charAt(0).toUpperCase()}
             </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hidden lg:flex p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 shadow-sm transition-all">
                  <svg className={`w-5 h-5 transition-transform ${isSidebarOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/></svg>
                </button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                    {activeLesson ? activeLesson.title : "Introduction"}
                  </h1>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {activeLesson ? `Pelajaran ${course.lessons.indexOf(activeLesson) + 1} dari ${course.lessons.length}` : 'Selamat Datang'}
                  </p>
                </div>
              </div>
              
              {activeLesson && (
                <button 
                  onClick={() => toggleLessonComplete(activeLesson.id)}
                  className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg ${isLessonCompleted ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'}`}
                >
                  {isLessonCompleted ? '✓ Selesai' : 'Tandai Selesai'}
                </button>
              )}
            </div>

            {/* Video Player */}
            <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-2xl shadow-indigo-500/5 group relative">
              {activeLesson && getYoutubeEmbedUrl(activeLesson.youtubeUrl) ? (
                <div className="aspect-video relative">
                  <iframe 
                    className="w-full h-full aspect-video" 
                    src={getYoutubeEmbedUrl(activeLesson.youtubeUrl) || ''} 
                    frameBorder="0" 
                    allowFullScreen
                  ></iframe>
                  {isAdmin && (
                    <button onClick={() => { 
                      if (activeLesson) {
                        setTempVideoUrl(activeLesson.youtubeUrl); 
                        setEditingVideo(true); 
                      }
                    }} className="absolute top-6 right-6 bg-white/90 backdrop-blur p-4 rounded-2xl opacity-0 group-hover:opacity-100 transition-all shadow-xl text-indigo-600 z-10">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </button>
                  )}
                </div>
              ) : (
                <div onClick={() => { if (isAdmin) setEditingVideo(true); }} className={`aspect-video flex flex-col items-center justify-center bg-slate-50 border-4 border-dashed border-slate-100 rounded-[2rem] ${isAdmin ? 'cursor-pointer hover:border-indigo-200 transition-all' : ''}`}>
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl text-indigo-500 mb-4">
                    <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615l-4.695 4.502c-0.217 0.208-0.511 0.324-0.787 0.324s-0.57-0.116-0.787-0.324l-4.695-4.502c-0.408-0.418-0.436-1.17 0-1.615z"/></svg>
                  </div>
                  <p className="text-slate-400 font-extrabold uppercase tracking-widest text-xs">Pilih Materi Video</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-[2rem] p-6 md:p-10 border border-slate-100 shadow-sm">
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
                    <p className="text-slate-500 leading-relaxed font-medium">
                      {activeLesson ? activeLesson.description : course.description}
                    </p>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 whitespace-pre-wrap font-medium">
                      {activeLesson ? activeLesson.content : 'Pilih materi untuk melihat detail lengkap kurikulum.'}
                    </div>
                  </div>
                )}

                {activeContentTab === 'assets' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Lampiran Materi</h3>
                      {isAdmin && activeLesson && (
                        <button onClick={() => setIsAssetModalOpen(true)} className="text-[10px] font-black bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg">+ Tambah Aset</button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {activeLesson && activeLesson.assets.length > 0 ? (
                        activeLesson.assets.map(asset => (
                          <div key={asset.id} className="group flex items-center justify-between gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-100 transition-all shadow-sm">
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
                            
                            <div className="flex gap-2 items-center">
                              <a href={asset.url} download={asset.type === 'file' ? asset.name : undefined} target="_blank" rel="noreferrer" className="p-2.5 text-slate-300 hover:text-indigo-600 bg-slate-50 rounded-xl transition-all">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                              </a>
                              {isAdmin && (
                                <>
                                  <button onClick={() => openEditAsset(asset)} className="p-2.5 text-slate-300 hover:text-amber-500 bg-slate-50 rounded-xl transition-all">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                  </button>
                                  <button onClick={() => deleteAsset(asset.id)} className="p-2.5 text-slate-300 hover:text-rose-500 bg-slate-50 rounded-xl transition-all">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-12 text-center text-slate-400 text-xs font-bold border-2 border-dashed border-slate-50 rounded-2xl">
                          Belum ada aset lampiran.
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {activeContentTab === 'notes' && (
                  <textarea 
                    className="w-full h-64 p-8 rounded-3xl bg-slate-50 border border-slate-100 text-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner font-medium"
                    placeholder="Catatan personal Anda (hanya tersimpan lokal)..."
                  />
                )}
              </div>
            </div>
          </div>
        </main>

        <aside className={`${isSidebarOpen ? 'w-80 md:w-96' : 'w-0'} bg-white border-l border-slate-100 transition-all duration-300 overflow-hidden flex flex-col flex-shrink-0 relative hidden lg:flex shadow-2xl shadow-slate-900/5`}>
          <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-8">
            {course.author && (
              <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl shadow-slate-900/20">
                <div className="flex items-center gap-4 mb-4">
                  <img src={course.author.avatar} className="w-14 h-14 rounded-2xl object-cover ring-4 ring-slate-800" alt="" />
                  <div>
                    <h4 className="text-base font-black leading-tight">{course.author.name}</h4>
                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">{course.author.role}</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed line-clamp-2">
                  {course.author.bio}
                </p>
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
                   <span className="text-[10px] font-black text-emerald-500 px-3 py-1 bg-emerald-50 rounded-full">
                    {Math.round((progress.completedLessons.length / Math.max(course.lessons.length, 1)) * 100)}% DONE
                   </span>
                </div>
              </div>
              
              <div className="space-y-2">
                {course.lessons.map((lesson, idx) => {
                  const active = activeLesson?.id === lesson.id;
                  const done = progress.completedLessons.includes(lesson.id);
                  return (
                    <button 
                      key={lesson.id}
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
                  );
                })}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* SHARE MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-white animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bagikan Kursus</h2>
                <button onClick={() => setShowShareModal(false)} className="p-2 text-slate-400 hover:text-slate-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5"/></svg></button>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-1 bg-slate-50 rounded-2xl border border-slate-100">
                   <button onClick={() => setIsShortened(false)} className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${!isShortened ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>ORIGINAL LINK</button>
                   <button onClick={() => setIsShortened(true)} className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${isShortened ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>SHORT LINK</button>
                </div>

                <div className="space-y-2">
                  <div className="relative group">
                    <input 
                      type="text" 
                      readOnly 
                      value={isShortened ? shortenedLink : originalLink} 
                      className="w-full pl-6 pr-14 py-5 rounded-2xl bg-slate-50 border border-slate-100 font-medium text-slate-600 text-sm overflow-hidden text-ellipsis"
                    />
                    <button 
                      onClick={handleCopyLink}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 text-white rounded-xl shadow-lg active:scale-90 transition-all"
                    >
                      {/* FIX: Correctly closed the SVG tag to prevent early JSX tree closure and 'Cannot find name' errors */}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" strokeWidth="2.5"/></svg>
                    </button>
                  </div>
                  {copySuccess && <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest text-center">✓ Link Tersalin!</p>}
                </div>

                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
                    Note: Public viewer hanya bisa melihat materi. Gunakan SHORT LINK untuk membagikan halaman yang lebih bersih dan profesional.
                  </p>
                </div>

                <button onClick={() => setShowShareModal(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl">Selesai</button>
              </div>
           </div>
        </div>
      )}

      {/* ADMIN MODALS */}
      {isAdmin && (
        <React.Fragment>
          {isAddLessonModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-white animate-in zoom-in-95 duration-200">
                  <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Tambah Materi Baru</h2>
                  <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Materi</label>
                        <input type="text" value={tempLessonTitle} onChange={(e) => setTempLessonTitle(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-800 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">YouTube Link</label>
                        <input type="text" value={tempVideoUrl} onChange={(e) => setTempVideoUrl(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium text-slate-800 transition-all" />
                    </div>
                    <div className="flex items-center justify-end gap-4 pt-4">
                        <button onClick={() => setIsAddLessonModalOpen(false)} className="text-sm font-bold text-slate-400 hover:text-slate-600">Batal</button>
                        <button onClick={handleAddLesson} className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl">Tambah</button>
                    </div>
                  </div>
              </div>
            </div>
          )}

          {isAssetModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-white">
                <h2 className="text-2xl font-black text-slate-900 mb-8">{editingAsset ? 'Edit Aset' : 'Aset Baru'}</h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Aset</label>
                    <input type="text" value={tempAssetName} onChange={(e) => setTempAssetName(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sumber</label>
                    <div className="flex p-1 bg-slate-50 rounded-2xl border border-slate-100">
                      <button onClick={() => setAssetSourceType('link')} className={`flex-1 py-2 text-[10px] font-black rounded-xl ${assetSourceType === 'link' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>LINK</button>
                      <button onClick={() => setAssetSourceType('file')} className={`flex-1 py-2 text-[10px] font-black rounded-xl ${assetSourceType === 'file' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>FILE</button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {assetSourceType === 'link' ? (
                      <input type="text" value={tempAssetUrl} onChange={(e) => setTempAssetUrl(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" placeholder="https://..." />
                    ) : (
                      <div className="relative">
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="w-full px-6 py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-xs font-bold">
                          {tempAssetUrl ? '✓ File Ready' : 'Upload File to Cloud'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-4 pt-4">
                    <button onClick={closeAssetModal} className="text-sm font-bold text-slate-400">Batal</button>
                    <button onClick={saveAsset} className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black">Simpan</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {editingVideo && activeLesson && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-white">
                <h2 className="text-2xl font-black text-slate-900 mb-8">Video Link</h2>
                <input type="text" value={tempVideoUrl} onChange={(e) => setTempVideoUrl(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none font-bold text-indigo-600 mb-6" />
                <button 
                  onClick={() => { 
                    if (activeLesson) {
                      updateLessonData(activeLesson.id, { youtubeUrl: tempVideoUrl }); 
                    }
                    setEditingVideo(false); 
                  }} 
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black"
                >
                  Simpan
                </button>
              </div>
            </div>
          )}
        </React.Fragment>
      )}
    </div>
  );
};

export default CoursePlayer;
