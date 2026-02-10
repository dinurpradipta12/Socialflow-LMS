
import React, { useState, useEffect, useRef } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserSession, Course, Lesson, ProgressState, SupabaseConfig } from './types';
import { INITIAL_COURSES } from './constants';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CoursePlayer from './components/CoursePlayer';
import AdminPanel from './components/AdminPanel';

type ViewType = 'dashboard' | 'player' | 'admin';

const App: React.FC = () => {
  const AUTH_KEY = 'arunika_lms_session';
  const COURSE_KEY = 'arunika_lms_courses';
  const PROGRESS_KEY = 'arunika_lms_progress';
  const BRAND_KEY = 'arunika_lms_brand';
  const LOGO_KEY = 'arunika_lms_logo';
  const SUPABASE_KEY = 'arunika_lms_supabase_config';

  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const [dbConfig, setDbConfig] = useState<SupabaseConfig>(() => {
    try {
      const stored = localStorage.getItem(SUPABASE_KEY);
      return stored ? JSON.parse(stored) : { url: '', anonKey: '', isConnected: false };
    } catch { return { url: '', anonKey: '', isConnected: false }; }
  });

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [brandName, setBrandName] = useState(() => localStorage.getItem(BRAND_KEY) || 'Arunika');
  const [brandLogo, setBrandLogo] = useState(() => localStorage.getItem(LOGO_KEY) || '');
  
  const sanitizeCourse = (c: any): Course => ({
    id: c?.id || `temp-${Date.now()}`,
    title: c?.title || 'Untitled Course',
    category: c?.category || 'General',
    description: c?.description || '',
    thumbnail: c?.thumbnail || '',
    introThumbnail: c?.introThumbnail || '',
    isPublic: !!c?.isPublic,
    lessons: Array.isArray(c?.lessons) ? c.lessons.map((l: any) => ({
      ...l,
      id: l?.id || `l-${Math.random()}`,
      assets: Array.isArray(l?.assets) ? l.assets : []
    })) : [],
    author: c?.author || { name: 'Mentor', role: 'Instructor', avatar: '', bio: '', rating: '5.0' }
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const stored = localStorage.getItem(COURSE_KEY);
      const parsed = stored ? JSON.parse(stored) : INITIAL_COURSES;
      return Array.isArray(parsed) ? parsed.map(sanitizeCourse) : INITIAL_COURSES;
    } catch { return INITIAL_COURSES; }
  });

  const [progress, setProgress] = useState<ProgressState>(() => {
    try {
      const stored = localStorage.getItem(PROGRESS_KEY);
      const parsed = stored ? JSON.parse(stored) : { completedLessons: [] };
      return (parsed && Array.isArray(parsed.completedLessons)) ? parsed : { completedLessons: [] };
    } catch { return { completedLessons: [] }; }
  });

  const [view, setView] = useState<ViewType>('dashboard');
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  // LOGIKA ROUTING: Deteksi Share Link atau Deep Link
  useEffect(() => {
    if (!session || courses.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('course');
    
    if (courseId) {
      const targetCourse = courses.find(c => c.id === courseId);
      if (targetCourse) {
        // Jika Developer, langsung buka. Jika Publik, hanya buka jika isPublic true.
        if (session.role === 'developer' || targetCourse.isPublic) {
          setActiveCourse(targetCourse);
          setView('player');
          const lessonId = params.get('lesson');
          if (lessonId && Array.isArray(targetCourse.lessons)) {
            const targetLesson = targetCourse.lessons.find(l => l.id === lessonId);
            if (targetLesson) setActiveLesson(targetLesson);
          }
        }
      }
    }
  }, [courses, session]);

  const handleUpdateCourse = (updatedCourse: Course) => {
    const cleanCourse = sanitizeCourse(updatedCourse);
    setCourses(prev => prev.map(c => c.id === cleanCourse.id ? cleanCourse : c));
  };

  const handleAddCourse = (newCourse: Course) => {
    const cleanCourse = sanitizeCourse(newCourse);
    setCourses(prev => [...prev, cleanCourse]);
  };

  if (!session) return <Login onLogin={(u) => { setSession(u); localStorage.setItem(AUTH_KEY, JSON.stringify(u)); }} />;

  return (
    <div className="min-h-screen bg-white">
      {view === 'dashboard' && (
        <Dashboard 
          courses={courses}
          user={session}
          onLogout={() => { setSession(null); localStorage.removeItem(AUTH_KEY); setView('dashboard'); }}
          onOpenCourse={(c) => { 
            setActiveCourse(c); 
            setActiveLesson(null); 
            setView('player');
            // Update URL tanpa reload
            const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + `?course=${c.id}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
          }}
          onOpenAdmin={() => setView('admin')}
          onUpdateCourse={handleUpdateCourse}
          onAddCourse={handleAddCourse}
          onDeleteCourse={(id) => setCourses(prev => prev.filter(c => c.id !== id))}
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
          setActiveLesson={(l) => {
            setActiveLesson(l);
            const params = new URLSearchParams(window.location.search);
            params.set('course', activeCourse.id);
            if (l) params.set('lesson', l.id); else params.delete('lesson');
            const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + params.toString();
            window.history.pushState({ path: newUrl }, '', newUrl);
          }}
          onSelectCourse={setActiveCourse}
          onLogout={() => { setSession(null); localStorage.removeItem(AUTH_KEY); setView('dashboard'); }}
          onOpenAdmin={() => setView('admin')}
          onBackToDashboard={() => {
            setView('dashboard');
            // Reset URL
            const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.pushState({ path: newUrl }, '', newUrl);
          }}
          user={session}
          progress={progress}
          toggleLessonComplete={(id) => setProgress(prev => ({
            completedLessons: prev.completedLessons.includes(id) ? prev.completedLessons.filter(l => l !== id) : [...prev.completedLessons, id]
          }))}
          onUpdateCourse={handleUpdateCourse}
          brandName={brandName}
          brandLogo={brandLogo}
          onUpdateBrand={(n, l) => { setBrandName(n); setBrandLogo(l); }}
        />
      )}

      {view === 'admin' && session.role === 'developer' && (
        <AdminPanel 
          courses={courses}
          setCourses={setCourses}
          onBack={() => setView('dashboard')}
          dbConfig={dbConfig}
          setDbConfig={(cfg) => { setDbConfig(cfg); localStorage.setItem(SUPABASE_KEY, JSON.stringify(cfg)); }}
        />
      )}
    </div>
  );
};

export default App;
