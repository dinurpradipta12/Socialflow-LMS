
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
}) => {
  const [showShareModal, setShowShareModal] = useState(false);

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
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Kurikulum Kelas</h3>
             <div className="space-y-2">
                {course.lessons.map((lesson, i) => (
                  <button 
                    key={lesson.id} 
                    onClick={() => setActiveLesson(lesson)} 
                    className={`w-full p-5 rounded-2xl flex items-center gap-4 transition-all text-left ${activeLesson?.id === lesson.id ? 'bg-violet-600 text-white shadow-xl shadow-violet-200' : 'hover:bg-violet-50 text-slate-600'}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${activeLesson?.id === lesson.id ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>{i + 1}</div>
                    <span className="font-bold text-sm leading-snug line-clamp-2">{lesson.title}</span>
                  </button>
                ))}
             </div>
          </div>

          <div className="p-8 mt-auto border-t border-violet-50">
             <div className="flex gap-4 items-center">
                <img src={course.author?.avatar || 'https://i.pravatar.cc/150'} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt="Avatar" />
                <div className="flex-1 min-w-0">
                   <h4 className="font-black text-slate-900 truncate text-xs">{course.author?.name}</h4>
                   <p className="text-violet-600 text-[9px] font-bold uppercase tracking-wider mt-0.5">{course.author?.role}</p>
                </div>
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
    </div>
  );
};

export default CoursePlayer;
