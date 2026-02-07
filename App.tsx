
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { UserSession, Course, Lesson, ProgressState } from './types';
import { INITIAL_COURSES } from './constants';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CoursePlayer from './components/CoursePlayer';
import AdminPanel from './components/AdminPanel';

type ViewType = 'dashboard' | 'player' | 'admin';

const SUPABASE_URL = 'https://utlsdvhvnxpqfnksayou.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_H-PdMn1m9buPq3RsAVhugw_lLBDJ0Kb';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const App: React.FC = () => {
  const AUTH_KEY = 'arunika_lms_session';
  const COURSE_KEY = 'arunika_lms_courses';
  const PROGRESS_KEY = 'arunika_lms_progress';
  const BRAND_KEY = 'arunika_lms_brand';
  const LOGO_KEY = 'arunika_lms_logo';

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

  const [view, setView] = useState<ViewType>('dashboard');
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  // Sync state to Cloud
  const syncToCloud = async (id: string, data: any) => {
    try {
      await supabase.from('lms_storage').upsert({ id, data, updated_at: new Date() });
    } catch (err) {
      console.error('Sync Error:', err);
    }
  };

  useEffect(() => {
    const fetchCloudData = async () => {
      const { data } = await supabase.from('lms_storage').select('*');
      data?.forEach(item => {
        if (item.id === 'course_data') setCourses(item.data);
        if (item.id === 'brand_settings') {
          setBrandName(item.data.name);
          setBrandLogo(item.data.logo);
        }
        if (item.id === 'user_progress') setProgress(item.data);
      });
    };
    fetchCloudData();

    const channel = supabase.channel('lms_realtime').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lms_storage' }, (p) => {
      const updated = p.new;
      if (updated.id === 'course_data') setCourses(updated.data);
      if (updated.id === 'brand_settings') {
        setBrandName(updated.data.name);
        setBrandLogo(updated.data.logo);
      }
      if (updated.id === 'user_progress') setProgress(updated.data);
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Update cloud whenever local state changes
  useEffect(() => {
    localStorage.setItem(COURSE_KEY, JSON.stringify(courses));
    syncToCloud('course_data', courses);
  }, [courses]);

  useEffect(() => {
    syncToCloud('brand_settings', { name: brandName, logo: brandLogo });
  }, [brandName, brandLogo]);

  useEffect(() => {
    syncToCloud('user_progress', progress);
  }, [progress]);

  const handleLogin = (user: UserSession) => {
    setSession(user);
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem(AUTH_KEY);
    setView('dashboard');
  };

  const handleUpdateCourse = (updated: Course) => {
    setCourses(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleAddCourse = (newCourse: Course) => {
    setCourses(prev => [...prev, newCourse]);
  };

  const handleDeleteCourse = (id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
    if (activeCourse?.id === id) setView('dashboard');
  };

  const toggleLessonComplete = (lessonId: string) => {
    setProgress(prev => {
      const isCompleted = prev.completedLessons.includes(lessonId);
      return { completedLessons: isCompleted ? prev.completedLessons.filter(id => id !== lessonId) : [...prev.completedLessons, lessonId] };
    });
  };

  if (!session) return <Login onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-white">
      {view === 'dashboard' && (
        <Dashboard 
          courses={courses}
          user={session}
          onLogout={handleLogout}
          onOpenCourse={(c) => { setActiveCourse(c); setView('player'); }}
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
          onSelectCourse={(c) => setActiveCourse(c)}
          onLogout={handleLogout}
          onOpenAdmin={() => setView('admin')}
          onBackToDashboard={() => setView('dashboard')}
          user={session}
          progress={progress}
          toggleLessonComplete={toggleLessonComplete}
          onUpdateCourse={handleUpdateCourse}
          brandName={brandName}
          setBrandName={setBrandName}
          brandLogo={brandLogo}
          setBrandLogo={setBrandLogo}
        />
      )}

      {view === 'admin' && session.role === 'admin' && (
        <AdminPanel courses={courses} setCourses={setCourses} onBack={() => setView('dashboard')} />
      )}
    </div>
  );
};

export default App;
