
import { Course, Author } from './types';

export const DEFAULT_AUTHOR: Author = {
  name: 'Admin Arunika',
  role: 'Senior Instructor',
  avatar: 'https://i.pravatar.cc/150?u=admin',
  bio: 'Expert educator focused on providing the best learning experience for the community.',
  rating: '5.0',
  whatsapp: '62812345678',
  instagram: '@arunika_lms',
  linkedin: '#',
  tiktok: '#',
  website: 'https://arunika.com'
};

export const INITIAL_COURSES: Course[] = [
  {
    id: 'course-1',
    title: 'Figma from A to Z',
    category: 'UI / UX Design',
    description: 'Unlock the power of Figma, the leading collaborative design tool, with our comprehensive online course. Whether you\'re a novice or looking to enhance your skills, this course will guide you through Figma\'s robust features and workflows.',
    thumbnail: 'https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?auto=format&fit=crop&q=80&w=1000',
    reviews: 126,
    author: {
      name: 'Crystal Lucas',
      role: 'UI/UX Specialist',
      avatar: 'https://i.pravatar.cc/150?u=crystal',
      bio: 'Crystal is a seasoned UI/UX designer with over 10 years of experience in product design. She has worked with global tech giants and startups alike to build intuitive interfaces. In this course, she shares her best-kept secrets on mastering Figma components and design systems.',
      rating: '4.8',
      whatsapp: '62812345678',
      instagram: '@crystallucas',
      linkedin: 'https://linkedin.com/in/crystallucas',
      tiktok: '@crystallucas_design',
      website: 'https://crystallucas.design'
    },
    lessons: [
      {
        id: 'lesson-1',
        title: 'Introduction',
        description: 'Materi pembuka tentang ekosistem Figma.',
        youtubeUrl: 'https://www.youtube.com/watch?v=R9itLlh9H8U',
        duration: '2min',
        content: 'Setting up the environment and understanding the basics.',
        assets: [
          { id: 'a1', name: 'Starter Kit.zip', url: '#', type: 'file' }
        ]
      },
      {
        id: 'lesson-2',
        title: 'What is Figma?',
        description: 'Penjelasan detail tentang tools Figma.',
        youtubeUrl: 'https://www.youtube.com/watch?v=0pTHXp8Fjsc',
        duration: '5min',
        content: 'Deep dive into Figma features.',
        assets: []
      }
    ]
  }
];
