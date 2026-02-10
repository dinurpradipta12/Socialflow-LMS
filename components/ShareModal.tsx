import React, { useState } from 'react';
import { Course, Lesson } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  activeLesson: Lesson | null;
  brandName: string;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  course,
  activeLesson,
  brandName,
}) => {
  const [copySuccess, setCopySuccess] = useState(false);

  // Generate public preview link
  const publicLink = activeLesson
    ? `${window.location.origin}${window.location.pathname}?publicCourse=${course.id}&publicLesson=${activeLesson.id}`
    : `${window.location.origin}${window.location.pathname}?publicCourse=${course.id}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-white overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">Bagikan Pembelajaran</h2>
              <p className="text-sm text-slate-600">
                {activeLesson ? `Bagikan "${activeLesson.title}"` : `Bagikan kursus "${course.title}"`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                Link Preview Publik
              </p>
              <p className="text-sm text-slate-600 mb-4">
                Bagikan link ini kepada publik untuk memberi akses preview read-only. Pengunjung dapat menonton video dan membaca konten tanpa perlu login.
              </p>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 hover:border-violet-300 transition-colors">
                <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <input
                  readOnly
                  value={publicLink}
                  className="flex-1 bg-transparent border-none text-xs font-mono text-slate-700 focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(publicLink)}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-colors flex-shrink-0"
                >
                  {copySuccess ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-xs text-blue-800 leading-relaxed">
                <span className="font-bold">ℹ️ Info:</span> Link ini membuka halaman preview yang mirip dengan CoursePlayer tetapi hanya dalam mode baca (read-only). Pengunjung tidak dapat mengedit atau menghapus konten.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-bold text-sm transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
