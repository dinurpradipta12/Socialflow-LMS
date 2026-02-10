
import React, { useState, useEffect } from 'react';
import { UserSession, Course, Lesson, ProgressState, SupabaseConfig } from './types';
import { INITIAL_COURSES } from './constants';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CoursePlayer from './components/CoursePlayer';
import AdminPanel from './components/AdminPanel';
import PublicCoursePreview from './components/PublicCoursePreview';

type ViewType = 'dashboard' | 'player' | 'admin' | 'public-preview';

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

  // Jika `dbConfig` tersedia, lakukan pengecekan koneksi sederhana ke endpoint REST Supabase
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (!dbConfig?.url || !dbConfig?.anonKey) {
          // pastikan flag false jika tidak ada konfigurasi
          setDbConfig(prev => ({ ...prev, isConnected: false }));
          return;
        }

        // Panggil endpoint REST sederhana untuk mengecek apakah tabel lms_storage dapat diakses
        const restUrl = `${dbConfig.url.replace(/\/$/, '')}/rest/v1/lms_storage?select=id&limit=1`;
        const res = await fetch(restUrl, {
          headers: {
            apikey: dbConfig.anonKey,
            Authorization: `Bearer ${dbConfig.anonKey}`,
          },
        });

        if (res.ok) {
          setDbConfig(prev => ({ ...prev, isConnected: true }));
        } else {
          setDbConfig(prev => ({ ...prev, isConnected: false }));
        }
      } catch (e) {
        setDbConfig(prev => ({ ...prev, isConnected: false }));
      }
    };

    checkConnection();
  }, [dbConfig.url, dbConfig.anonKey]);

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

  // LOGIKA ROUTING: Deteksi Direct Access via URL ?course=ID&lesson=ID atau ?publicCourse=ID&publicLesson=ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Check public preview first
    const publicCourseId = params.get('publicCourse');
    const publicLessonId = params.get('publicLesson');
    
    if (publicCourseId && courses.length > 0) {
      const targetCourse = courses.find(c => c.id === publicCourseId);
      if (targetCourse) {
        setActiveCourse(targetCourse);
        setView('public-preview');
        
        if (publicLessonId) {
          const targetLesson = targetCourse.lessons.find(l => l.id === publicLessonId);
          if (targetLesson) setActiveLesson(targetLesson);
        }
        return;
      }
    }

    // Then check regular course access
    const courseId = params.get('course');
    const lessonId = params.get('lesson');
    
    if (courseId && courses.length > 0) {
      const targetCourse = courses.find(c => c.id === courseId);
      
      if (targetCourse) {
        // Jika kursus publik dan belum login, beri guest session
        if (targetCourse.isPublic && !session) {
          const guestSession: UserSession = { username: 'Public Visitor', role: 'public', isLoggedIn: true };
          setSession(guestSession);
        }
        
        // Hanya proses jika sudah ada session (Guest atau User)
        // Jika kursus private dan belum login, biarkan Login.tsx menghandle
        if (targetCourse.isPublic || (session && session.isLoggedIn)) {
          setActiveCourse(targetCourse);
          setView('player');
          
          if (lessonId) {
            const targetLesson = targetCourse.lessons.find(l => l.id === lessonId);
            if (targetLesson) setActiveLesson(targetLesson);
          }
        }
      }
    }
  }, [courses, session]);

  const handleUpdateCourse = (updatedCourse: Course) => {
    const cleanCourse = sanitizeCourse(updatedCourse);
    setCourses(prev => {
      const next = prev.map(c => c.id === cleanCourse.id ? cleanCourse : c);
      try { localStorage.setItem(COURSE_KEY, JSON.stringify(next)); } catch {}

      // Jika konfigurasi Supabase tersedia dan terhubung, lakukan upsert ke tabel lms_storage
      if (dbConfig?.url && dbConfig?.anonKey && dbConfig.isConnected) {
        try {
          const restUrl = `${dbConfig.url.replace(/\/$/, '')}/rest/v1/lms_storage`;
          fetch(restUrl, {
            method: 'POST',
            headers: {
              apikey: dbConfig.anonKey,
              Authorization: `Bearer ${dbConfig.anonKey}`,
              'Content-Type': 'application/json',
              Prefer: 'resolution=merge-duplicates'
            },
            body: JSON.stringify({ id: cleanCourse.id, data: cleanCourse, client_id: session?.username || '' }),
          }).catch(() => { /* swallow network errors silently */ });
        } catch (e) {
          // ignore
        }
      }

      return next;
    });
  };

  const handleAddCourse = (newCourse: Course) => {
    const cleanCourse = sanitizeCourse(newCourse);
    setCourses(prev => {
      const next = [...prev, cleanCourse];
      try { localStorage.setItem(COURSE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  if (!session) return <Login onLogin={(u) => { setSession(u); localStorage.setItem(AUTH_KEY, JSON.stringify(u)); }} />;

  return (
    <div className="min-h-screen bg-white">
      {view === 'public-preview' && activeCourse && (
        <PublicCoursePreview
          course={activeCourse}
          activeLesson={activeLesson}
          setActiveLesson={(l) => {
            setActiveLesson(l);
            const url = l ? `?publicCourse=${activeCourse.id}&publicLesson=${l.id}` : `?publicCourse=${activeCourse.id}`;
            window.history.pushState({}, '', url);
          }}
          brandName={brandName}
          brandLogo={brandLogo}
        />
      )}

      {view === 'dashboard' && (
        <Dashboard 
          courses={courses}
          user={session}
          onLogout={() => { 
            setSession(null); 
            localStorage.removeItem(AUTH_KEY); 
            setView('dashboard');
            window.history.pushState({}, '', window.location.pathname);
          }}
          onOpenCourse={(c) => { 
            setActiveCourse(c); 
            setActiveLesson(null);
            setView('player');
            window.history.pushState({}, '', `?course=${c.id}`);
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
            const url = l ? `?course=${activeCourse.id}&lesson=${l.id}` : `?course=${activeCourse.id}`;
            window.history.pushState({}, '', url);
          }}
          onSelectCourse={setActiveCourse}
          onLogout={() => { 
            setSession(null); 
            localStorage.removeItem(AUTH_KEY); 
            setView('dashboard'); 
            window.history.pushState({}, '', window.location.pathname); 
          }}
          onOpenAdmin={() => setView('admin')}
          onBackToDashboard={() => { 
            setView('dashboard'); 
            window.history.pushState({}, '', window.location.pathname); 
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

      {view === 'admin' && session?.role === 'admin' && (
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
