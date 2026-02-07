
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
        const { data } = await client.from('lms_storage').select('*');
        if (data) {
          const cloudCourses = data.find(i => i.id === 'courses')?.data;
          const cloudBrand = data.find(i => i.id === 'brand')?.data;
          const cloudProgress = data.find(i => i.id === 'progress')?.data;

          if (cloudCourses) setCourses(cloudCourses);
          if (cloudBrand) {
            setBrandName(cloudBrand.name);
            setBrandLogo(cloudBrand.logo);
          }
          if (cloudProgress) setProgress(cloudProgress);
        }
      };
      initializeData();

      const channel = client.channel('lms_realtime_v3')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'lms_storage' }, (payload) => {
          const newData = payload.new as any;
          if (!newData || newData.client_id === myClientId) return;

          if (newData.id === 'courses') {
            setCourses(newData.data);
            localStorage.setItem(COURSE_KEY, JSON.stringify(newData.data));
            // Sync active states with cloud data
            if (activeCourse) {
              const updated = newData.data.find((c: Course) => c.id === activeCourse.id);
              if (updated) {
                setActiveCourse(updated);
                if (activeLesson) {
                   const updatedL = updated.lessons.find((l: Lesson) => l.id === activeLesson.id);
                   if (updatedL) setActiveLesson(updatedL);
                }
              }
            }
          }
          if (newData.id === 'brand') {
            setBrandName(newData.data.name);
            setBrandLogo(newData.data.logo);
            localStorage.setItem(BRAND_KEY, newData.data.name);
            localStorage.setItem(LOGO_KEY, newData.data.logo);
          }
          if (newData.id === 'progress') {
            setProgress(newData.data);
            localStorage.setItem(PROGRESS_KEY, JSON.stringify(newData.data));
          }
        })
        .subscribe();

      return () => { client.removeChannel(channel); };
    }
  }, [dbConfig.url, dbConfig.anonKey, myClientId, activeCourse?.id, activeLesson?.id]);

  const handleUpdateCourse = (updatedCourse: Course) => {
    setCourses(prev => {
      const next = prev.map(c => c.id === updatedCourse.id ? updatedCourse : c);
      localStorage.setItem(COURSE_KEY, JSON.stringify(next));
      syncToCloud('courses', next);
      return next;
    });
    
    // CRITICAL: Refresh active pointers to point to the new data objects
    if (activeCourse?.id === updatedCourse.id) {
      setActiveCourse(updatedCourse);
      if (activeLesson) {
        const matchingLesson = updatedCourse.lessons.find(l => l.id === activeLesson.id);
        if (matchingLesson) {
          setActiveLesson(matchingLesson);
        }
      }
    }
  };

  const handleAddCourse = (newCourse: Course) => {
    setCourses(prev => {
      const next = [...prev, newCourse];
      localStorage.setItem(COURSE_KEY, JSON.stringify(next));
      syncToCloud('courses', next);
      return next;
    });
  };

  const handleDeleteCourse = (id: string) => {
    setCourses(prev => {
      const next = prev.filter(c => c.id !== id);
      localStorage.setItem(COURSE_KEY, JSON.stringify(next));
      syncToCloud('courses', next);
      return next;
    });
  };

  const handleUpdateBrand = (name: string, logo: string) => {
    setBrandName(name);
    setBrandLogo(logo);
    localStorage.setItem(BRAND_KEY, name);
    localStorage.setItem(LOGO_KEY, logo);
    syncToCloud('brand', { name, logo });
  };

  const handleToggleProgress = (id: string) => {
    setProgress(prev => {
      const next = { 
        completedLessons: prev.completedLessons.includes(id) 
          ? prev.completedLessons.filter(l => l !== id) 
          : [...prev.completedLessons, id] 
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
      syncToCloud('progress', next);
      return next;
    });
  };

  if (!session) return <Login onLogin={(user) => { setSession(user); localStorage.setItem(AUTH_KEY, JSON.stringify(user)); }} />;

  return (
    <div className="min-h-screen bg-white">
      {view === 'dashboard' && (
        <Dashboard 
          courses={courses}
          user={session}
          onLogout={() => { setSession(null); localStorage.removeItem(AUTH_KEY); setView('dashboard'); }}
          onOpenCourse={(c) => { setActiveCourse(c); setActiveLesson(null); setView('player'); }}
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
          onBackToDashboard={() => setView('dashboard')}
          user={session}
          progress={progress}
          toggleLessonComplete={handleToggleProgress}
          onUpdateCourse={handleUpdateCourse}
          brandName={brandName}
          setBrandName={(val) => handleUpdateBrand(val, brandLogo)}
          brandLogo={brandLogo}
          setBrandLogo={(val) => handleUpdateBrand(brandName, val)}
        />
      )}

      {view === 'admin' && (
        <AdminPanel 
          courses={courses}
          setCourses={(val) => {
            const next = typeof val === 'function' ? val(courses) : val;
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
