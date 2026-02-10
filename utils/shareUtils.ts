// Utility untuk generate dan manage share links
export interface ShareToken {
  courseId: string;
  lessonId?: string;
  token: string;
  createdAt: number;
  expiresAt?: number;
}

export const generateShareToken = (courseId: string, lessonId?: string): ShareToken => {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 15);
  const token = `${courseId}-${lessonId || 'course'}-${randomPart}-${timestamp}`;
  
  return {
    courseId,
    lessonId,
    token,
    createdAt: timestamp,
    expiresAt: timestamp + (30 * 24 * 60 * 60 * 1000), // 30 hari
  };
};

export const validateShareToken = (token: string, savedTokens: ShareToken[]): ShareToken | null => {
  const found = savedTokens.find(t => t.token === token);
  
  if (!found) return null;
  
  // Jika ada expiry time dan sudah expired
  if (found.expiresAt && Date.now() > found.expiresAt) {
    return null;
  }
  
  return found;
};

export const generateShareLink = (token: string, baseUrl: string = window.location.origin): string => {
  return `${baseUrl}?share=${token}`;
};

export const getShareTokenFromUrl = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get('share');
};

export const isPublicShare = (): boolean => {
  return !!getShareTokenFromUrl();
};

export const getPublicCourseParams = (): { courseId?: string; lessonId?: string } | null => {
  const params = new URLSearchParams(window.location.search);
  const courseId = params.get('publicCourse');
  const lessonId = params.get('publicLesson');
  
  if (!courseId) return null;
  return { courseId, lessonId: lessonId || undefined };
};

export const isPublicPreview = (): boolean => {
  return !!getPublicCourseParams();
};
