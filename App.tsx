
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const [dbConfig, setDbConfig] = useState<SupabaseConfig>(() => {
    const stored = localStorage.getItem(SUPABASE_KEY);
    return stored ? JSON.parse(stored) : { url: '', anonKey: '', isConnected: false };
  });

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [brandName, setBrandName] = useState(() => localStorage.getItem(BRAND_KEY) || 'Arunika');
  const [brandLogo, setBrandLogo] = useState(() => localStorage.getItem(LOGO_KEY) || '');
  const [courses, setCourses] = useState<Course[]>(() => {
    const stored = localStorage.getItem(COURSE_KEY);
    return stored ? JSON.parse(stored) : INITIAL_COURSES;
  });
  const [progress, setProgress] = useState<ProgressState>(() => {
    const stored = localStorage.getItem(PROGRESS_KEY);
    return stored ? JSON.parse(stored) : { completedLessons: [] };
  });

  const [view, setView] = useState<ViewType>('dashboard');
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  // Initialize Supabase Client
  useEffect(() => {
    if (dbConfig.url && dbConfig.anonKey) {
      const client = createClient(dbConfig.url, dbConfig.anonKey);
      setSupabase(client);
      
      // Initial Fetch from Cloud
      const fetchData = async () => {
        const { data } = await client.from('lms_storage').select('*');
        if (data) {
          data.forEach(item => {
            if (item.id === 'courses') setCourses(item.data);
            if (item.id === 'brand') {
              setBrandName(item.data.name);
              setBrandLogo(item.data.logo);
            }
            if (item.id === 'progress') setProgress(item.data);
          });
        }
      };
      fetchData();

      // Setup Realtime Listener
      const channel = client.channel('realtime_lms')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lms_storage' }, (payload) => {
          const updated = payload.new;
          if (updated.id === 'courses') setCourses(updated.data);
          if (updated.id === 'brand') {
            setBrandName(updated.data.name);
            setBrandLogo(updated.data.logo);
          }
          if (updated.id === 'progress') setProgress(updated.data);
        })
        .subscribe();

      return () => { client.removeChannel(channel); };
    }
  }, [dbConfig.url, dbConfig.anonKey]);

  // Sync to Cloud function
  const syncToCloud = useCallback(async (id: string, data: any) => {
    if (supabase) {
      await supabase.from('lms_storage').upsert({ id, data, updated_at: new Date() });
    }
  }, [supabase]);

  // Save Local & Sync Cloud
  useEffect(() => {
    localStorage.setItem(COURSE_KEY, JSON.stringify(courses));
    syncToCloud('courses', courses);
  }, [courses, syncToCloud]);

  useEffect(() => {
    localStorage.setItem(BRAND_KEY, brandName);
    localStorage.setItem(LOGO_KEY, brandLogo);
    syncToCloud('brand', { name: brandName, logo: brandLogo });
  }, [brandName, brandLogo, syncToCloud]);

  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    syncToCloud('progress', progress);
  }, [progress, syncToCloud]);

  const handleUpdateCourse = (updatedCourse: Course) => {
    setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
    if (activeCourse?.id === updatedCourse.id) setActiveCourse(updatedCourse);
  };

  if (!session) return <Login onLogin={(user) => { setSession(user); localStorage.setItem(AUTH_KEY, JSON.stringify(user)); }} />;

  return (
    <div className="min-h-screen bg-white">
      {view === 'dashboard' && (
        <Dashboard 
          courses={courses}
          user={session}
          onLogout={() => { setSession(null); localStorage.removeItem(AUTH_KEY); setView('dashboard'); }}
          onOpenCourse={(c) => { setActiveCourse(c); setView('player'); }}
          onOpenAdmin={() => setView('admin')}
          onUpdateCourse={handleUpdateCourse}
          onAddCourse={(c) => setCourses(prev => [...prev, c])}
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
          setActiveLesson={setActiveLesson}
          onSelectCourse={setActiveCourse}
          onLogout={() => { setSession(null); setView('dashboard'); }}
          onOpenAdmin={() => setView('admin')}
          onBackToDashboard={() => setView('dashboard')}
          user={session}
          progress={progress}
          toggleLessonComplete={(id) => setProgress(prev => ({ completedLessons: prev.completedLessons.includes(id) ? prev.completedLessons.filter(l => l !== id) : [...prev.completedLessons, id] }))}
          onUpdateCourse={handleUpdateCourse}
          brandName={brandName}
          setBrandName={setBrandName}
          brandLogo={brandLogo}
          setBrandLogo={setBrandLogo}
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
