import React, { useState } from 'react';
import { Course, Lesson } from '../types';

interface PublicCoursePreviewProps {
  course: Course;
  activeLesson: Lesson | null;
  setActiveLesson: (lesson: Lesson | null) => void;
  brandName: string;
  brandLogo: string;
}

const PublicCoursePreview: React.FC<PublicCoursePreviewProps> = ({
  course,
  activeLesson,
  setActiveLesson,
  brandName,
  brandLogo,
}) => {
  const [showCopied, setShowCopied] = useState(false);

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

  const embedUrl = activeLesson ? getYoutubeEmbedUrl(activeLesson.youtubeUrl) : null;

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden font-inter">
      {/* Header */}
      <header className="h-20 border-b border-violet-100 bg-white flex items-center justify-between px-6 md:px-10 flex-shrink-0 z-50">
        <div className="flex items-center gap-6">
          <button
            onClick={handleBackToHome}
            className="p-2.5 bg-violet-50 text-violet-400 hover:text-violet-600 rounded-xl border border-violet-100 shadow-sm transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center">
              {brandLogo ? (
                <img src={brandLogo} className="w-full h-full object-contain" alt="Logo" />
              ) : (
                <div className="w-full h-full bg-violet-600 flex items-center justify-center text-white font-black">
                  {brandName ? brandName.charAt(0) : 'A'}
                </div>
              )}
            </div>
            <span className="font-bold text-slate-900 hidden sm:block">{brandName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-black rounded-lg border border-blue-200 uppercase tracking-widest">
            Preview Publik
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Lessons List */}
        <aside className="w-64 border-r border-violet-100 overflow-y-auto custom-scrollbar hidden md:block">
          <div className="p-4 space-y-2">
            <h3 className="text-sm font-black text-slate-600 px-3 py-2 uppercase tracking-widest">
              Daftar Materi ({course.lessons.length})
            </h3>
            {course.lessons.map((lesson, idx) => (
              <button
                key={lesson.id}
                onClick={() => setActiveLesson(lesson)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all border ${
                  activeLesson?.id === lesson.id
                    ? 'bg-violet-50 border-violet-300 text-violet-900 font-semibold'
                    : 'border-transparent hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xs font-black text-slate-400 mt-0.5">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{lesson.title}</p>
                    {lesson.description && (
                      <p className="text-xs text-slate-500 truncate">{lesson.description}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Player */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar bg-white">
          <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                {activeLesson ? activeLesson.title : course.title}
              </h1>
              {activeLesson && (
                <p className="text-slate-600 mt-2 text-sm">{activeLesson.description}</p>
              )}
            </div>

            {/* Video Player */}
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
                  <img
                    src={course.introThumbnail || course.thumbnail}
                    className="w-full h-full object-cover opacity-60"
                    alt=""
                  />
                ) : (
                  <div className="text-center">
                    <svg className="w-16 h-16 text-slate-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-slate-400 mt-4">Tidak ada video untuk ditampilkan</p>
                  </div>
                )}
              </div>
            )}

            {/* Course Description */}
            {!activeLesson && course.description && (
              <div className="bg-violet-50 border border-violet-200 rounded-2xl p-6 space-y-4">
                <h2 className="font-black text-slate-900 text-lg">Tentang Kursus Ini</h2>
                <p className="text-slate-700 leading-relaxed">{course.description}</p>
              </div>
            )}

            {/* Lesson Content */}
            {activeLesson && activeLesson.description && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 space-y-4">
                <h2 className="font-black text-slate-900">Deskripsi Materi</h2>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{activeLesson.description}</p>
              </div>
            )}

            {/* Author Info */}
            {course.author && (
              <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                {course.author.avatar && (
                  <img
                    src={course.author.avatar}
                    alt={course.author.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div>
                  <h3 className="font-black text-slate-900">{course.author.name}</h3>
                  <p className="text-sm text-slate-600">{course.author.role}</p>
                  {course.author.bio && (
                    <p className="text-sm text-slate-600 mt-1">{course.author.bio}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Lesson Selector */}
      <div className="md:hidden border-t border-violet-100 bg-white overflow-x-auto">
        <div className="flex gap-2 p-3 min-w-min">
          {course.lessons.map((lesson, idx) => (
            <button
              key={lesson.id}
              onClick={() => setActiveLesson(lesson)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all text-xs font-semibold ${
                activeLesson?.id === lesson.id
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {idx + 1}. {lesson.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PublicCoursePreview;
