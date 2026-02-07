
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

  const [myClientId] = useState(() => Math.random().toString(36).substring(7));
  const [isInitialSyncing, setIsInitialSyncing] = useState(false);

  const [session, setSession] = useState<UserSession | null>(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [dbConfig, setDbConfig] = useState<SupabaseConfig>(() => {
    const stored = localStorage.getItem(SUPABASE_KEY);
    try {
      return stored ? JSON.parse(stored) : { url: '', anonKey: '', isConnected: false };
    } catch {
      return { url: '', anonKey: '', isConnected: false };
    }
  });

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [brandName, setBrandName] = useState(() => localStorage.getItem(BRAND_KEY) || 'Arunika');
  const [brandLogo, setBrandLogo] = useState(() => localStorage.getItem(LOGO_KEY) || '');
  const [courses, setCourses] = useState<Course[]>(() => {
    const stored = localStorage.getItem(COURSE_KEY);
    try {
      const parsed = stored ? JSON.parse(stored) : INITIAL_COURSES;
      return Array.isArray(parsed) ? parsed : INITIAL_COURSES;
    } catch {
      return INITIAL_COURSES;
    }
  });
  const [progress, setProgress] = useState<ProgressState>(() => {
    const stored = localStorage.getItem(PROGRESS_KEY);
    try {
      const parsed = stored ? JSON.parse(stored) : { completedLessons: [] };
      return parsed && Array.isArray(parsed.completedLessons) ? parsed : { completedLessons: [] };
    } catch {
      return { completedLessons: [] };
    }
  });

  const [view, setView] = useState<ViewType>('dashboard');
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [isSharedMode, setIsSharedMode] = useState(false);

  // Deep Linking Handler
  useEffect(() => {
    const currentCourses = Array.isArray(courses) ? courses : [];
    if (currentCourses.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const sharedCourseId = params.get('share');
    const sharedLessonId = params.get('lesson');

    if (sharedCourseId) {
      const targetCourse = currentCourses.find(c => c.id === sharedCourseId);
      if (targetCourse) {
        setActiveCourse(targetCourse);
        setView('player');
        setIsSharedMode(true);
        
        if (sharedLessonId && Array.isArray(targetCourse.lessons)) {
          const targetLesson = targetCourse.lessons.find(l => l.id === sharedLessonId);
          if (targetLesson) {
            setActiveLesson(targetLesson);
          }
        }
      }
    }
  }, [courses]);

  const syncToCloud = async (id: string, data: any) => {
    if (!supabase) return;
    try {
      await supabase.from('lms_storage').upsert({ 
        id, 
        data, 
        client_id: myClientId,
        updated_at: new Date().toISOString() 
      }, { onConflict: 'id' });
    } catch (err) {
      console.error("Cloud Sync Failure:", err);
    }
  };

  useEffect(() => {
    if (dbConfig.url && dbConfig.anonKey) {
      const client = createClient(dbConfig.url, dbConfig.anonKey);
      setSupabase(client);
      
      const initializeData = async () => {
        setIsInitialSyncing(true);
        try {
          const { data, error } = await client.from('lms_storage').select('*');
          if (error) throw error;
          
          if (data && data.length > 0) {
            const cloudCourses = data.find(i => i.id === 'courses')?.data;
            const cloudBrand = data.find(i => i.id === 'brand')?.data;
            const cloudProgress = data.find(i => i.id === 'progress')?.data;

            if (cloudCourses && Array.isArray(cloudCourses)) {
              setCourses(cloudCourses);
              localStorage.setItem(COURSE_KEY, JSON.stringify(cloudCourses));
            }
            if (cloudBrand) {
              setBrandName(cloudBrand.name || 'Arunika');
              setBrandLogo(cloudBrand.logo || '');
              localStorage.setItem(BRAND_KEY, cloudBrand.name || 'Arunika');
              localStorage.setItem(LOGO_KEY, cloudBrand.logo || '');
            }
            if (cloudProgress && Array.isArray(cloudProgress.completedLessons)) {
              setProgress(cloudProgress);
              localStorage.setItem(PROGRESS_KEY, JSON.stringify(cloudProgress));
            }
          }
        } catch (err) {
          console.error("Initial Sync Error:", err);
        } finally {
          setIsInitialSyncing(false);
        }
      };
      
      initializeData();

      const channel = client.channel('lms_realtime_v3')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'lms_storage' }, (payload) => {
          const newData = payload.new as any;
          if (!newData || newData.client_id === myClientId) return;

          if (newData.id === 'courses' && Array.isArray(newData.data)) {
            setCourses(newData.data);
            localStorage.setItem(COURSE_KEY, JSON.stringify(newData.data));
          }
          if (newData.id === 'brand' && newData.data) {
            setBrandName(newData.data.name || 'Arunika');
            setBrandLogo(newData.data.logo || '');
            localStorage.setItem(BRAND_KEY, newData.data.name || 'Arunika');
            localStorage.setItem(LOGO_KEY, newData.data.logo || '');
          }
          if (newData.id === 'progress' && newData.data && Array.isArray(newData.data.completedLessons)) {
            setProgress(newData.data);
            localStorage.setItem(PROGRESS_KEY, JSON.stringify(newData.data));
          }
        })
        .subscribe();

      return () => { client.removeChannel(channel); };
    }
  }, [dbConfig.url, dbConfig.anonKey, myClientId]);

  const handleUpdateCourse = (updatedCourse: Course) => {
    if (!updatedCourse || !updatedCourse.id) return;
    setCourses(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const next = safePrev.map(c => c.id === updatedCourse.id ? updatedCourse : c);
      localStorage.setItem(COURSE_KEY, JSON.stringify(next));
      syncToCloud('courses', next);
      return next;
    });
    
    if (activeCourse?.id === updatedCourse.id) {
      setActiveCourse(updatedCourse);
      if (activeLesson && Array.isArray(updatedCourse.lessons)) {
        const matchingLesson = updatedCourse.lessons.find(l => l.id === activeLesson.id);
        if (matchingLesson) {
          setActiveLesson(matchingLesson);
        }
      }
    }
  };

  const handleUpdateBrand = (name: string, logo: string) => {
    setBrandName(name);
    setBrandLogo(logo);
    localStorage.setItem(BRAND_KEY, name);
    localStorage.setItem(LOGO_KEY, logo);
    syncToCloud('brand', { name, logo });
  };

  const handleAddCourse = (newCourse: Course) => {
    if (!newCourse) return;
    setCourses(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const next = [...safePrev, newCourse];
      localStorage.setItem(COURSE_KEY, JSON.stringify(next));
      syncToCloud('courses', next);
      return next;
    });
  };

  const handleDeleteCourse = (id: string) => {
    setCourses(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const next = safePrev.filter(c => c.id !== id);
      localStorage.setItem(COURSE_KEY, JSON.stringify(next));
      syncToCloud('courses', next);
      return next;
    });
  };

  const handleToggleProgress = (id: string) => {
    setProgress(prev => {
      const safeCompleted = (prev && Array.isArray(prev.completedLessons)) ? prev.completedLessons : [];
      const next = { 
        completedLessons: safeCompleted.includes(id) 
          ? safeCompleted.filter(l => l !== id) 
          : [...safeCompleted, id] 
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
      syncToCloud('progress', next);
      return next;
    });
  };

  if (!session) return <Login onLogin={(user) => { setSession(user); localStorage.setItem(AUTH_KEY, JSON.stringify(user)); }} />;

  return (
    <div className="min-h-screen bg-white relative">
      {isInitialSyncing && (
        <div className="fixed top-0 left-0 w-full h-1 bg-violet-100 z-[200]">
          <div className="h-full bg-violet-600 animate-[loading_2s_ease-in-out_infinite]" style={{width: '30%'}}></div>
        </div>
      )}

      {view === 'dashboard' && (
        <Dashboard 
          courses={courses || []}
          user={session}
          onLogout={() => { setSession(null); localStorage.removeItem(AUTH_KEY); setView('dashboard'); }}
          onOpenCourse={(c) => { 
            setActiveCourse(c); 
            setActiveLesson(null); 
            setIsSharedMode(false);
            setView('player'); 
          }}
          onOpenAdmin={() => setView('admin')}
          onUpdateCourse={handleUpdateCourse}
          onAddCourse={handleAddCourse}
          onDeleteCourse={handleDeleteCourse}
          progress={progress || { completedLessons: [] }}
          brandName={brandName}
          brandLogo={brandLogo}
        />
      )}

      {view === 'player' && activeCourse && (
        <CoursePlayer 
          course={activeCourse} 
          courses={courses || []}
          activeLesson={activeLesson}
          setActiveLesson={setActiveLesson}
          onSelectCourse={setActiveCourse}
          onLogout={() => { setSession(null); setView('dashboard'); }}
          onOpenAdmin={() => setView('admin')}
          onBackToDashboard={() => {
            window.history.replaceState({}, '', window.location.pathname);
            setIsSharedMode(false);
            setView('dashboard');
          }}
          user={session}
          progress={progress || { completedLessons: [] }}
          toggleLessonComplete={handleToggleProgress}
          onUpdateCourse={handleUpdateCourse}
          brandName={brandName}
          brandLogo={brandLogo}
          onUpdateBrand={handleUpdateBrand}
          isSharedMode={isSharedMode}
        />
      )}

      {view === 'admin' && (
        <AdminPanel 
          courses={courses || []}
          setCourses={(val) => {
            const next = typeof val === 'function' ? val(courses || []) : val;
            setCourses(next);
            syncToCloud('courses', next);
          }}
          onBack={() => setView('dashboard')}
          dbConfig={dbConfig}
          setDbConfig={(cfg) => { 
            setDbConfig(cfg); 
            localStorage.setItem(SUPABASE_KEY, JSON.stringify(cfg));
          }}
        />
      )}
    </div>
  );
};

export default App;
