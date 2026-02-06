import React, { useState, useEffect } from 'react';
import { UserSession, Course, Lesson, ProgressState } from './types';
import { INITIAL_COURSES } from './constants';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CoursePlayer from './components/CoursePlayer';
import AdminPanel from './components/AdminPanel';

const App: React.FC = () => {
  const AUTH_KEY = 'arunika_lms_session';
  const COURSE_KEY = 'arunika_lms_courses';
  const PROGRESS_KEY = 'arunika_lms_progress';
  const BRAND_KEY = 'arunika_lms_brand';
  const LOGO_KEY = 'arunika_lms_logo';

  // Initialize session
  const [session, setSession] = useState<UserSession | null>(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  // Initialize brand settings
  const [brandName, setBrandName] = useState(() => localStorage.getItem(BRAND_KEY) || 'Arunika');
  const [brandLogo, setBrandLogo] = useState(() => localStorage.getItem(LOGO_KEY) || '');

  // Initialize courses - crucial for persistence
  const [courses, setCourses] = useState<Course[]>(() => {
    const stored = localStorage.getItem(COURSE_KEY);
    return stored ? JSON.parse(stored) : INITIAL_COURSES;
  });

  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<ProgressState>(() => {
    const stored = localStorage.getItem(PROGRESS_KEY);
    return stored ? JSON.parse(stored) : { completedLessons: [] };
  });
  const [view, setView] = useState<'dashboard' | 'player' | 'admin'>('dashboard');
  const [isSharedMode, setIsSharedMode] = useState(false);

  // Handle Shared Link on Mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedCourseId = urlParams.get('share');
    if (sharedCourseId) {
      const targetCourse = courses.find((c: Course) => c.id === sharedCourseId);
      if (targetCourse) {
        setActiveCourse(targetCourse);
        setSession({ username: 'Public Visitor', role: 'public', isLoggedIn: false });
        setIsSharedMode(true);
        setView('player');
      }
    }
  }, []);

  // Sync to Local Storage
  useEffect(() => {
    if (!isSharedMode) {
      localStorage.setItem(COURSE_KEY, JSON.stringify(courses));
    }
  }, [courses, isSharedMode]);

  useEffect(() => {
    localStorage.setItem(BRAND_KEY, brandName);
  }, [brandName]);

  useEffect(() => {
    localStorage.setItem(LOGO_KEY, brandLogo);
  }, [brandLogo]);

  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }, [progress]);

  const handleLogin = (user: UserSession) => {
    setSession(user);
    setIsSharedMode(false);
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    setView('dashboard');
    const url = new URL(window.location.href);
    url.searchParams.delete('share');
    window.history.replaceState({}, '', url.toString());
  };

  const handleLogout = () => {
    setSession(null);
    setIsSharedMode(false);
    localStorage.removeItem(AUTH_KEY);
    setView('dashboard');
    setActiveCourse(null);
    setActiveLesson(null);
  };

  const handleUpdateCourse = (updatedCourse: Course) => {
    if (isSharedMode) return;
    setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
    if (activeCourse?.id === updatedCourse.id) {
      setActiveCourse(updatedCourse);
    }
    if (activeLesson) {
      const refreshedLesson = updatedCourse.lessons.find(l => l.id === activeLesson.id);
      if (refreshedLesson) setActiveLesson(refreshedLesson);
    }
  };

  const handleAddCourse = (newCourse: Course) => {
    if (isSharedMode) return;
    setCourses(prev => [...prev, newCourse]);
  };

  const handleDeleteCourse = (id: string) => {
    if (isSharedMode) return;
    setCourses(prev => prev.filter(c => c.id !== id));
  };

  const toggleLessonComplete = (lessonId: string) => {
    setProgress(prev => {
      const isCompleted = prev.completedLessons.includes(lessonId);
      return { 
        completedLessons: isCompleted 
          ? prev.completedLessons.filter(id => id !== lessonId) 
          : [...prev.completedLessons, lessonId] 
      };
    });
  };

  if (!session && !isSharedMode) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#F5F3FF]">
      {view === 'dashboard' && (
        <Dashboard 
          courses={courses}
          user={session!}
          onLogout={handleLogout}
          onOpenCourse={(course) => {
            setActiveCourse(course);
            setActiveLesson(null);
            setView('player');
          }}
          onOpenAdmin={() => setView('admin')}
          onUpdateCourse={handleUpdateCourse}
          onAddCourse={handleAddCourse}
          onDeleteCourse={handleDeleteCourse}
          progress={progress}
          brandName={brandName}
          brandLogo={brandLogo}
        />
      )}

      {view === 'player' && activeCourse && (
        <CoursePlayer 
          course={activeCourse} 
          courses={courses}
          activeLesson={activeLesson}
          setActiveLesson={setActiveLesson}
          onSelectCourse={(c) => { setActiveCourse(c); setActiveLesson(null); }}
          onLogout={handleLogout}
          onOpenAdmin={() => setView('admin')}
          onBackToDashboard={() => setView('dashboard')}
          user={session!}
          progress={progress}
          toggleLessonComplete={toggleLessonComplete}
          onUpdateCourse={handleUpdateCourse}
          isSharedMode={isSharedMode}
          brandName={brandName}
          setBrandName={setBrandName}
          brandLogo={brandLogo}
          setBrandLogo={setBrandLogo}
        />
      )}

      {view === 'admin' && session?.role === 'admin' && !isSharedMode && (
        <AdminPanel 
          courses={courses}
          setCourses={setCourses}
          onBack={() => setView('dashboard')}
        />
      )}
    </div>
  );
};

export default App;