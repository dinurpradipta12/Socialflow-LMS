import React, { useState, useEffect } from 'react';
import { UserSession, Course, Lesson, ProgressState } from './types';
import { INITIAL_COURSES } from './constants';
import Login from './components/Login';
import CoursePlayer from './components/CoursePlayer';
import AdminPanel from './components/AdminPanel';

const App: React.FC = () => {
  // Persistence key constants
  const AUTH_KEY = 'arunika_lms_session';
  const COURSE_KEY = 'arunika_lms_courses';
  const PROGRESS_KEY = 'arunika_lms_progress';

  // Initialize session from localStorage immediately to prevent flicker
  const [session, setSession] = useState<UserSession | null>(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<ProgressState>(() => {
    const stored = localStorage.getItem(PROGRESS_KEY);
    return stored ? JSON.parse(stored) : { completedLessons: [] };
  });
  const [view, setView] = useState<'player' | 'admin'>('player');
  const [isSharedMode, setIsSharedMode] = useState(false);

  useEffect(() => {
    // 1. Load Initial Data
    const storedCourses = localStorage.getItem(COURSE_KEY);
    const data = storedCourses ? JSON.parse(storedCourses) : INITIAL_COURSES;
    setCourses(data);

    // 2. Detect Public Share Link
    const urlParams = new URLSearchParams(window.location.search);
    const sharedCourseId = urlParams.get('share');

    if (sharedCourseId) {
      const targetCourse = data.find((c: Course) => c.id === sharedCourseId);
      if (targetCourse) {
        setActiveCourse(targetCourse);
        // Special Session for Public Access
        setSession({ username: 'Public Visitor', role: 'public', isLoggedIn: false });
        setIsSharedMode(true);
      }
    } else if (data.length > 0) {
      setActiveCourse(data[0]);
    }
  }, []);

  // Sync courses to localStorage
  useEffect(() => {
    if (courses.length > 0 && !isSharedMode) {
      localStorage.setItem(COURSE_KEY, JSON.stringify(courses));
    }
  }, [courses, isSharedMode]);

  // Sync progress to localStorage
  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }, [progress]);

  const handleLogin = (user: UserSession) => {
    setSession(user);
    setIsSharedMode(false);
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    
    // Clean URL when logging in
    const url = new URL(window.location.href);
    url.searchParams.delete('share');
    window.history.replaceState({}, '', url.toString());
  };

  const handleLogout = () => {
    setSession(null);
    setIsSharedMode(false);
    localStorage.removeItem(AUTH_KEY);
    setView('player');
    setActiveLesson(null);
    
    // Clean URL on logout
    const url = new URL(window.location.href);
    url.searchParams.delete('share');
    window.history.replaceState({}, '', url.toString());
  };

  const handleUpdateCourse = (updatedCourse: Course) => {
    if (isSharedMode) return;
    setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
    setActiveCourse(updatedCourse);
    
    if (activeLesson) {
      const refreshedLesson = updatedCourse.lessons.find(l => l.id === activeLesson.id);
      if (refreshedLesson) setActiveLesson(refreshedLesson);
    }
  };

  const toggleLessonComplete = (lessonId: string) => {
    setProgress(prev => {
      const isCompleted = prev.completedLessons.includes(lessonId);
      if (isCompleted) {
        return { completedLessons: prev.completedLessons.filter(id => id !== lessonId) };
      } else {
        return { completedLessons: [...prev.completedLessons, lessonId] };
      }
    });
  };

  // Show login only if no session and not in shared mode
  if (!session && !isSharedMode) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#f4f7fa]">
      {view === 'player' && activeCourse && (
        <CoursePlayer 
          course={activeCourse} 
          courses={courses}
          activeLesson={activeLesson}
          setActiveLesson={setActiveLesson}
          onSelectCourse={(c) => { setActiveCourse(c); setActiveLesson(null); }}
          onLogout={handleLogout}
          onOpenAdmin={() => setView('admin')}
          user={session!}
          progress={progress}
          toggleLessonComplete={toggleLessonComplete}
          onUpdateCourse={handleUpdateCourse}
          isSharedMode={isSharedMode}
        />
      )}

      {view === 'admin' && session?.role === 'admin' && !isSharedMode && (
        <AdminPanel 
          courses={courses}
          setCourses={setCourses}
          onBack={() => setView('player')}
        />
      )}
    </div>
  );
};

export default App;