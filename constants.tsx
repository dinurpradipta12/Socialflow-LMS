
import { Course } from './types';

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
      bio: 'Crystal is a seasoned UI/UX designer with over 10 years of experience in product design.',
      rating: '4.8'
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
