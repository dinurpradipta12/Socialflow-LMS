
import React from 'react';
import { Course, UserSession, ProgressState } from '../types';

interface DashboardProps {
  courses: Course[];
  user: UserSession;
  onLogout: () => void;
  onOpenCourse: (course: Course) => void;
  onOpenAdmin: () => void;
  progress: ProgressState;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  courses, 
  user, 
  onLogout, 
  onOpenCourse, 
  onOpenAdmin,
  progress 
}) => {
  const getCourseProgress = (course: Course) => {
    if (course.lessons.length === 0) return 0;
    const completed = course.lessons.filter(l => progress.completedLessons.includes(l.id)).length;
    return Math.round((completed / course.lessons.length) * 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:px-6 md:py-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Halo, {user.username}! 👋</h1>
          <p className="text-slate-500 mt-1">Lanjutkan progres belajarmu hari ini.</p>
        </div>
        <div className="flex items-center gap-4">
          {user.role === 'admin' && (
            <button 
              onClick={onOpenAdmin}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Admin Panel
            </button>
          )}
          <button 
            onClick={onLogout}
            className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">Kursus Saya</h2>
          <div className="text-sm text-slate-500">{courses.length} Kursus Tersedia</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map(course => {
            const p = getCourseProgress(course);
            return (
              <div 
                key={course.id} 
                className="group bg-white rounded-3xl overflow-hidden soft-shadow hover:translate-y-[-4px] transition-all cursor-pointer border border-slate-100"
                onClick={() => onOpenCourse(course)}
              >
                <div className="relative aspect-video">
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-60"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-blue-600 uppercase tracking-wider">
                      Tutorial
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">{course.title}</h3>
                  <p className="text-sm text-slate-500 mb-6 line-clamp-2 h-10">{course.description}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-tight">
                      <span>Progres Belajar</span>
                      <span>{p}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all duration-700 ease-out" 
                        style={{ width: `${p}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {courses.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center soft-shadow border border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-600">Belum ada kursus yang tersedia.</h3>
            <p className="text-slate-400 mt-2">Cek kembali nanti atau hubungi admin.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
