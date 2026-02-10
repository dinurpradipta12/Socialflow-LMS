import React, { useState, useEffect } from 'react';
import { Course, Lesson } from '../types';
import { generateShareToken, generateShareLink, ShareToken } from '../utils/shareUtils';

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
  const [shareTokens, setShareTokens] = useState<ShareToken[]>(() => {
    try {
      const stored = localStorage.getItem('share_tokens');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [copySuccess, setCopySuccess] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'direct' | 'token'>('direct');

  useEffect(() => {
    localStorage.setItem('share_tokens', JSON.stringify(shareTokens));
  }, [shareTokens]);

  // Direct link (untuk akses langsung tanpa token)
  const directLink = activeLesson
    ? `${window.location.origin}${window.location.pathname}?publicCourse=${course.id}&publicLesson=${activeLesson.id}`
    : `${window.location.origin}${window.location.pathname}?publicCourse=${course.id}`;

  // Generate share link dengan token
  const handleGenerateShareToken = () => {
    const newToken = generateShareToken(course.id, activeLesson?.id);
    setShareTokens([...shareTokens, newToken]);
  };

  // Copy to clipboard
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

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50">
          <button
            onClick={() => setSelectedTab('direct')}
            className={`flex-1 py-4 px-6 font-bold text-sm transition-colors ${
              selectedTab === 'direct'
                ? 'text-violet-600 border-b-2 border-violet-600 bg-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Link Publik Langsung
          </button>
          <button
            onClick={() => setSelectedTab('token')}
            className={`flex-1 py-4 px-6 font-bold text-sm transition-colors ${
              selectedTab === 'token'
                ? 'text-violet-600 border-b-2 border-violet-600 bg-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Link dengan Token
          </button>
        </div>

        {/* Content */}
        <div className="p-8 max-h-96 overflow-y-auto">
          {selectedTab === 'direct' ? (
            // Direct Link Tab
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                  Link Akses Publik Preview
                </p>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 hover:border-violet-300 transition-colors">
                  <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <input
                    readOnly
                    value={directLink}
                    className="flex-1 bg-transparent border-none text-xs font-mono text-slate-700 focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(directLink)}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-colors flex-shrink-0"
                  >
                    {copySuccess ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-xs text-blue-800 leading-relaxed">
                  <span className="font-bold">ℹ️ Info:</span> Link ini mengizinkan akses publik ke preview pembelajaran tanpa perlu login. Pengunjung hanya bisa melihat dan menonton konten (read-only).
                </p>
              </div>
            </div>
          ) : (
            // Token Link Tab
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                  Buat Link Berbasis Token
                </p>
                <button
                  onClick={handleGenerateShareToken}
                  className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl"
                >
                  + Generate Token Baru
                </button>
              </div>

              {shareTokens.filter(
                (t) =>
                  t.courseId === course.id &&
                  (!activeLesson || !t.lessonId || t.lessonId === activeLesson.id)
              ).length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Token yang Tersedia
                  </p>
                  {shareTokens
                    .filter(
                      (t) =>
                        t.courseId === course.id &&
                        (!activeLesson || !t.lessonId || t.lessonId === activeLesson.id)
                    )
                    .map((token) => {
                      const tokenLink = generateShareLink(token.token);
                      return (
                        <div key={token.token} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-xs font-bold text-slate-600">
                                {new Date(token.createdAt).toLocaleDateString('id-ID')}
                              </p>
                              {token.expiresAt && (
                                <p
                                  className={`text-xs mt-1 ${
                                    Date.now() > token.expiresAt
                                      ? 'text-red-600 font-bold'
                                      : 'text-slate-500'
                                  }`}
                                >
                                  Expired: {new Date(token.expiresAt).toLocaleDateString('id-ID')}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                setShareTokens(shareTokens.filter((t) => t.token !== token.token))
                              }
                              className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                            <input
                              readOnly
                              value={tokenLink}
                              className="flex-1 bg-transparent border-none text-xs font-mono text-slate-700 focus:outline-none"
                            />
                            <button
                              onClick={() => copyToClipboard(tokenLink)}
                              className="px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded text-xs font-bold transition-colors flex-shrink-0"
                            >
                              {copySuccess ? '✓' : 'Copy'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <p className="text-xs text-slate-600">Belum ada token yang dibuat</p>
                </div>
              )}

              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-xs text-green-800 leading-relaxed">
                  <span className="font-bold">✓ Keuntungan Token:</span> Lebih aman, dapat dikelola
                  (dibuat/dihapus), dan memiliki waktu kadaluarsa.
                </p>
              </div>
            </div>
          )}
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
