
import React, { useState, useEffect } from 'react';
import { UserSession, Course, Lesson, ProgressState } from './types';
import { INITIAL_COURSES } from './constants';
import Login from './components/Login';
import CoursePlayer from './components/CoursePlayer';
import AdminPanel from './components/AdminPanel';

const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<ProgressState>({ completedLessons: [] });
  const [view, setView] = useState<'player' | 'admin'>('player');
  const [isSharedMode, setIsSharedMode] = useState(false);

  useEffect(() => {
    // 1. Load Initial Data
    const storedCourses = localStorage.getItem('arunika_lms_courses');
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
    } else {
      // Regular login session check
      const storedSession = localStorage.getItem('arunika_lms_session');
      if (storedSession) {
        setSession(JSON.parse(storedSession));
      }
    }

    if (!sharedCourseId && data.length > 0) {
      setActiveCourse(data[0]);
    }

    const storedProgress = localStorage.getItem('arunika_lms_progress');
    if (storedProgress) setProgress(JSON.parse(storedProgress));
  }, []);

  useEffect(() => {
    if (courses.length > 0 && !isSharedMode) {
      localStorage.setItem('arunika_lms_courses', JSON.stringify(courses));
    }
  }, [courses, isSharedMode]);

  useEffect(() => {
    localStorage.setItem('arunika_lms_progress', JSON.stringify(progress));
  }, [progress]);

  const handleLogin = (user: UserSession) => {
    setSession(user);
    setIsSharedMode(false);
    localStorage.setItem('arunika_lms_session', JSON.stringify(user));
    
    // Clean URL when logging in
    const url = new URL(window.location.href);
    url.searchParams.delete('share');
    window.history.replaceState({}, '', url.toString());
  };

  const handleLogout = () => {
    setSession(null);
    setIsSharedMode(false);
    localStorage.removeItem('arunika_lms_session');
    setView('player');
    setActiveLesson(null);
    
    // Clean URL on logout
    const url = new URL(window.location.href);
    url.searchParams.delete('share');
    window.history.replaceState({}, '', url.toString());
  };

  const handleUpdateCourse = (updatedCourse: Course) => {
    if (isSharedMode) return; // Strict lock for shared mode
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

  // If no session and not in shared mode, show login
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
