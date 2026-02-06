import React, { useState } from 'react';
import { Course, UserSession, ProgressState } from '../types';

interface DashboardProps {
  courses: Course[];
  user: UserSession;
  onLogout: () => void;
  onOpenCourse: (course: Course) => void;
  onOpenAdmin: () => void;
  progress: ProgressState;
  brandName: string;
  brandLogo: string;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  courses, 
  user, 
  onLogout, 
  onOpenCourse, 
  onOpenAdmin,
  progress,
  brandName,
  brandLogo
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...new Set(courses.map(c => c.category))];

  const filteredCourses = selectedCategory === 'All' 
    ? courses 
    : courses.filter(c => c.category === selectedCategory);

  const getCourseProgress = (course: Course) => {
    if (course.lessons.length === 0) return 0;
    const completed = course.lessons.filter(l => progress.completedLessons.includes(l.id)).length;
    return Math.round((completed / course.lessons.length) * 100);
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] font-inter">
      {/* Navbar Dashboard */}
      <nav className="h-20 bg-white border-b border-slate-100 px-6 md:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 flex items-center justify-center overflow-hidden rounded-xl ${brandLogo ? '' : 'bg-indigo-600 shadow-lg'}`}>
            {brandLogo ? (
              <img src={brandLogo} className="w-full h-full object-contain" alt="Logo" />
            ) : (
              <span className="text-white font-black">{brandName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">{brandName}</span>
        </div>

        <div className="flex items-center gap-4">
          {user.role === 'admin' && (
            <button 
              onClick={onOpenAdmin}
              className="px-5 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl shadow-xl transition-transform active:scale-95"
            >
              ADMIN PANEL
            </button>
          )}
          <button 
            onClick={onLogout}
            className="px-5 py-2.5 bg-rose-50 text-rose-500 text-xs font-black rounded-xl hover:bg-rose-100 transition-colors"
          >
            LOGOUT
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Selamat Datang, {user.username.split(' ')[0]}!
          </h1>
          <p className="text-slate-500 text-lg font-medium max-w-2xl">
            Lanjutkan perjalanan belajarmu di <span className="text-indigo-600 font-bold">{brandName}</span>. Pilih kursus terbaik yang telah kami siapkan khusus untukmu.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-3 mb-12 overflow-x-auto no-scrollbar pb-2">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border shadow-sm ${selectedCategory === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200 hover:text-indigo-600'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredCourses.map(course => {
            const p = getCourseProgress(course);
            return (
              <div 
                key={course.id}
                onClick={() => onOpenCourse(course)}
                className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 cursor-pointer flex flex-col h-full"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img 
                    src={course.thumbnail} 
                    alt={course.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute top-6 left-6">
                    <span className="px-4 py-2 bg-white/90 backdrop-blur rounded-xl text-[10px] font-black text-indigo-600 uppercase tracking-widest shadow-lg">
                      {course.category}
                    </span>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {[1,2,3].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                            <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Student" />
                          </div>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-white">+2.4k students</span>
                    </div>
                  </div>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
                    {course.title}
                  </h3>
                  <p className="text-slate-500 text-sm font-medium line-clamp-3 mb-8 leading-relaxed">
                    {course.description}
                  </p>
                  
                  <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        </svg>
                      </div>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{course.lessons.length} Pelajaran</span>
                    </div>
                    
                    {p > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{width: `${p}%`}}></div>
                        </div>
                        <span className="text-[10px] font-black text-emerald-500">{p}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredCourses.length === 0 && (
          <div className="py-32 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
               </svg>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Belum ada kursus ditemukan</h3>
            <p className="text-slate-400 font-medium">Coba gunakan kategori lain atau hubungi administrator.</p>
          </div>
        )}
      </main>

      {/* Footer Minimalist */}
      <footer className="mt-20 py-12 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 opacity-50">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm">
              {brandName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-black uppercase tracking-[0.2em]">{brandName}</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            © 2025 Arunika Learning Ecosystem. All Rights Reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">Privacy</a>
            <a href="#" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;