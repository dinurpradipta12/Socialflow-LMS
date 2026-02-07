
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { UserSession, Course, Lesson, ProgressState } from './types';
import { INITIAL_COURSES } from './constants';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CoursePlayer from './components/CoursePlayer';
import AdminPanel from './components/AdminPanel';

type ViewType = 'dashboard' | 'player' | 'admin';

// Initialize Supabase with provided credentials
const SUPABASE_URL = 'https://utlsdvhvnxpqfnksayou.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_H-PdMn1m9buPq3RsAVhugw_lLBDJ0Kb';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const App: React.FC = () => {
  const AUTH_KEY = 'arunika_lms_session';
  const COURSE_KEY = 'arunika_lms_courses';
  const PROGRESS_KEY = 'arunika_lms_progress';
  const BRAND_KEY = 'arunika_lms_brand';
  const LOGO_KEY = 'arunika_lms_logo';
  const VIEW_KEY = 'arunika_lms_view';
  const ACTIVE_COURSE_ID_KEY = 'arunika_lms_active_course_id';
  const ACTIVE_LESSON_ID_KEY = 'arunika_lms_active_lesson_id';

  const [session, setSession] = useState<UserSession | null>(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  });

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

  const [view, setView] = useState<ViewType>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('share')) return 'player';
    return (localStorage.getItem(VIEW_KEY) as ViewType) || 'dashboard';
  });

  const [activeCourse, setActiveCourse] = useState<Course | null>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedId = urlParams.get('share');
    const storedId = localStorage.getItem(ACTIVE_COURSE_ID_KEY);
    const targetId = sharedId || storedId;
    return courses.find((c: Course) => c.id === targetId) || null;
  });

  const [activeLesson, setActiveLesson] = useState<Lesson | null>(() => {
    const storedLessonId = localStorage.getItem(ACTIVE_LESSON_ID_KEY);
    if (!storedLessonId || !activeCourse) return null;
    return activeCourse.lessons.find(l => l.id === storedLessonId) || null;
  });

  const [isSharedMode, setIsSharedMode] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return !!urlParams.get('share');
  });

  // --- SUPABASE SYNC LOGIC ---

  // Initial Fetch from Supabase
  useEffect(() => {
    const fetchCloudData = async () => {
      try {
        const { data, error } = await supabase.from('lms_storage').select('*');
        if (error) throw error;

        data.forEach(item => {
          if (item.id === 'course_data') setCourses(item.data);
          if (item.id === 'brand_settings') {
            setBrandName(item.data.name);
            setBrandLogo(item.data.logo);
          }
          if (item.id === 'user_progress') setProgress(item.data);
        });
      } catch (err) {
        console.warn('Supabase Fetch Error (using Local):', err);
      }
    };

    fetchCloudData();

    // Subscribe to Real-time Changes
    const subscription = supabase
      .channel('lms_realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lms_storage' }, (payload) => {
        const updated = payload.new;
        if (updated.id === 'course_data') setCourses(updated.data);
        if (updated.id === 'brand_settings') {
          setBrandName(updated.data.name);
          setBrandLogo(updated.data.logo);
        }
        if (updated.id === 'user_progress') setProgress(updated.data);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Sync to Supabase helper
  const syncToCloud = async (id: string, data: any) => {
    try {
      await supabase.from('lms_storage').upsert({ id, data, updated_at: new Date() });
    } catch (err) {
      console.error('Supabase Sync Failed:', err);
    }
  };

  // State Persistence Hooks
  useEffect(() => {
    if (!isSharedMode) {
      localStorage.setItem(COURSE_KEY, JSON.stringify(courses));
      syncToCloud('course_data', courses);
    }
  }, [courses, isSharedMode]);

  useEffect(() => {
    localStorage.setItem(BRAND_KEY, brandName);
    localStorage.setItem(LOGO_KEY, brandLogo);
    syncToCloud('brand_settings', { name: brandName, logo: brandLogo });
  }, [brandName, brandLogo]);

  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    syncToCloud('user_progress', progress);
  }, [progress]);

  useEffect(() => {
    if (!isSharedMode) {
      localStorage.setItem(VIEW_KEY, view);
      if (activeCourse) localStorage.setItem(ACTIVE_COURSE_ID_KEY, activeCourse.id);
      if (activeLesson) localStorage.setItem(ACTIVE_LESSON_ID_KEY, activeLesson.id);
    }
  }, [view, activeCourse, activeLesson, isSharedMode]);

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
    localStorage.removeItem(VIEW_KEY);
    localStorage.removeItem(ACTIVE_COURSE_ID_KEY);
    localStorage.removeItem(ACTIVE_LESSON_ID_KEY);
    setView('dashboard');
    setActiveCourse(null);
    setActiveLesson(null);
  };

  const handleUpdateCourse = (updatedCourse: Course) => {
    if (isSharedMode) return;
    setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
    if (activeCourse?.id === updatedCourse.id) setActiveCourse(updatedCourse);
  };

  const handleAddCourse = (newCourse: Course) => {
    if (isSharedMode) return;
    setCourses(prev => [...prev, newCourse]);
  };

  const handleDeleteCourse = (id: string) => {
    if (isSharedMode) return;
    setCourses(prev => prev.filter(c => c.id !== id));
    if (activeCourse?.id === id) {
      setActiveCourse(null);
      setActiveLesson(null);
      setView('dashboard');
    }
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
    <div className="min-h-screen bg-white">
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
          onBackToDashboard={() => {
            setActiveCourse(null);
            setActiveLesson(null);
            setView('dashboard');
          }}
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
