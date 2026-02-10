
export type UserRole = 'public' | 'developer';

export interface Asset {
  id: string;
  name: string;
  url: string;
  type: 'file' | 'spreadsheet' | 'link';
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  duration: string;
  content: string;
  assets: Asset[];
}

export interface Author {
  name: string;
  role: string;
  avatar: string;
  bio: string;
  rating: string;
  whatsapp?: string;
  instagram?: string;
  linkedin?: string;
  tiktok?: string;
  website?: string;
}

export interface Course {
  id: string;
  title: string;
  category: string;
  description: string;
  lessons: Lesson[];
  thumbnail: string;
  introThumbnail?: string;
  author?: Author;
  reviews?: number;
  isPublic?: boolean; // Field baru untuk kontrol akses publik
}

export interface UserSession {
  username: string;
  role: UserRole;
  isLoggedIn: boolean;
}

export interface ProgressState {
  completedLessons: string[]; // lesson IDs
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}
