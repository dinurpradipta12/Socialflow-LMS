
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

  const [myClientId] = useState(() => 'client-' + Math.random().toString(36).substring(7));
  const [isInitialSyncing, setIsInitialSyncing] = useState(false);
  const lastUpdateFromCloud = useRef<number>(0);
  const syncTimeoutRef = useRef<number | null>(null);

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
  
  // Fungsi untuk memastikan data kursus tidak korup
  const sanitizeCourse = (c: any): Course => ({
    id: c.id || `temp-${Date.now()}`,
    title: c.title || 'Untitled Course',
    category: c.category || 'General',
    description: c.description || '',
    thumbnail: c.thumbnail || '',
    lessons: Array.isArray(c.lessons) ? c.lessons.map((l: any) => ({
      ...l,
      id: l.id || `l-${Math.random()}`,
      assets: Array.isArray(l.assets) ? l.assets : []
    })) : [],
    author: c.author || { name: 'Mentor', role: 'Instructor', avatar: '', bio: '', rating: '5.0' }
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
  const [isSharedMode, setIsSharedMode] = useState(false);

  const syncToCloud = async (id: string, data: any) => {
    if (!supabase || (Date.now() - lastUpdateFromCloud.current < 2000)) return;
    
    try {
      // Supabase limit check approx (1MB)
      const payloadSize = new Blob([JSON.stringify(data)]).size;
      if (payloadSize > 1000000) {
        console.warn("Payload too large for Realtime. Local only.");
        return;
      }

      await supabase.from('lms_storage').upsert({ 
        id, 
        data, 
        client_id: myClientId,
        updated_at: new Date().toISOString() 
      }, { onConflict: 'id' });
    } catch (err) { console.error(`Sync Fail (${id}):`, err); }
  };

  useEffect(() => {
    if (Array.isArray(courses)) {
      try {
        localStorage.setItem(COURSE_KEY, JSON.stringify(courses));
      } catch (e) { console.error("LocalStorage Full. Only updating memory."); }
      
      if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = window.setTimeout(() => syncToCloud('courses', courses), 1000);
    }
  }, [courses]);

  useEffect(() => {
    localStorage.setItem(BRAND_KEY, brandName);
    localStorage.setItem(LOGO_KEY, brandLogo);
    syncToCloud('brand', { name: brandName, logo: brandLogo });
  }, [brandName, brandLogo]);

  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    syncToCloud('progress', progress);
  }, [progress]);

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
            lastUpdateFromCloud.current = Date.now();
            const cloudCourses = data.find(i => i.id === 'courses')?.data;
            if (Array.isArray(cloudCourses)) setCourses(cloudCourses.map(sanitizeCourse));
            
            const cloudBrand = data.find(i => i.id === 'brand')?.data;
            if (cloudBrand) {
              setBrandName(cloudBrand.name || 'Arunika');
              setBrandLogo(cloudBrand.logo || '');
            }

            const cloudProgress = data.find(i => i.id === 'progress')?.data;
            if (cloudProgress && Array.isArray(cloudProgress.completedLessons)) setProgress(cloudProgress);
          }
        } catch (err) { console.error("Init Sync Error:", err); } 
        finally { setIsInitialSyncing(false); }
      };
      
      initializeData();

      const channel = client.channel('lms_realtime_v7')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'lms_storage' }, (payload) => {
          const newData = payload.new as any;
          if (!newData || newData.client_id === myClientId) return;

          lastUpdateFromCloud.current = Date.now();
          if (newData.id === 'courses' && Array.isArray(newData.data)) {
            const sanitized = newData.data.map(sanitizeCourse);
            setCourses(prev => JSON.stringify(prev) === JSON.stringify(sanitized) ? prev : sanitized);
          }
          if (newData.id === 'brand' && newData.data) {
            setBrandName(newData.data.name);
            setBrandLogo(newData.data.logo);
          }
          if (newData.id === 'progress' && newData.data) {
            setProgress(newData.data);
          }
        })
        .subscribe();

      return () => { client.removeChannel(channel); };
    }
  }, [dbConfig.url, dbConfig.anonKey, myClientId]);

  const handleUpdateCourse = (updatedCourse: Course) => {
    const cleanCourse = sanitizeCourse(updatedCourse);
    setCourses(prev => prev.map(c => c.id === cleanCourse.id ? cleanCourse : c));
  };

  const handleAddCourse = (newCourse: Course) => {
    const cleanCourse = sanitizeCourse(newCourse);
    setCourses(prev => [...prev, cleanCourse]);
  };

  const handleDeleteCourse = (id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
  };

  const handleToggleProgress = (id: string) => {
    setProgress(prev => ({
      completedLessons: prev.completedLessons.includes(id) 
        ? prev.completedLessons.filter(l => l !== id) 
        : [...prev.completedLessons, id]
    }));
  };

  if (!session) return <Login onLogin={(u) => { setSession(u); localStorage.setItem(AUTH_KEY, JSON.stringify(u)); }} />;

  return (
    <div className="min-h-screen bg-white">
      {isInitialSyncing && (
        <div className="fixed top-0 left-0 w-full h-1 bg-violet-100 z-[200]">
          <div className="h-full bg-violet-600 animate-pulse" style={{width: '100%'}}></div>
        </div>
      )}

      {view === 'dashboard' && (
        <Dashboard 
          courses={courses}
          user={session}
          onLogout={() => { setSession(null); localStorage.removeItem(AUTH_KEY); setView('dashboard'); }}
          onOpenCourse={(c) => { setActiveCourse(c); setActiveLesson(null); setIsSharedMode(false); setView('player'); }}
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
          onSelectCourse={setActiveCourse}
          onLogout={() => { setSession(null); setView('dashboard'); }}
          onOpenAdmin={() => setView('admin')}
          onBackToDashboard={() => { setIsSharedMode(false); setView('dashboard'); }}
          user={session}
          progress={progress}
          toggleLessonComplete={handleToggleProgress}
          onUpdateCourse={handleUpdateCourse}
          brandName={brandName}
          brandLogo={brandLogo}
          onUpdateBrand={(n, l) => { setBrandName(n); setBrandLogo(l); }}
          isSharedMode={isSharedMode}
        />
      )}

      {view === 'admin' && (
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
