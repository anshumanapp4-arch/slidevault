'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatDate, timeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SlideDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated, updateUser } = useAuth();
  const [slide, setSlide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    const fetchSlide = async () => {
      try {
        const { data } = await api.get(`/api/slides/${id}`);
        if (data.success) {
          setSlide(data.slide);
        }
      } catch (error) {
        toast.error('Slide not found');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchSlide();
  }, [id, router]);

  useEffect(() => {
    let active = true;
    let localUrl = '';

    const loadPdf = async () => {
      if (!isPreviewing || !slide?.slideUrl) return;
      setIframeLoading(true);

      try {
        const response = await fetch(slide.slideUrl);
        if (!response.ok) throw new Error('Failed to fetch PDF');
        const blob = await response.blob();
        
        // Force MIME type to application/pdf to ensure browser treats it as PDF
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        
        if (active) {
          localUrl = URL.createObjectURL(pdfBlob);
          setPreviewUrl(localUrl);
        }
      } catch (error) {
        console.error('Failed to load PDF via blob, falling back to Google Docs Viewer:', error);
        if (active) {
          // Fallback to Google Docs Viewer if direct fetch fails (e.g. CORS or network)
          const fallback = `https://docs.google.com/viewer?url=${encodeURIComponent(slide.slideUrl)}&embedded=true`;
          setPreviewUrl(fallback);
        }
      }
    };

    loadPdf();

    return () => {
      active = false;
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
    };
  }, [isPreviewing, slide?.slideUrl]);

  const isAuthor = user?.id === slide?.author?._id;
  const isLiked = slide?.likes?.includes(user?.id);

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to like slides');
      return;
    }
    try {
      const { data } = await api.post(`/api/slides/${id}/like`);
      if (data.success) {
        setSlide((prev) => ({
          ...prev,
          likesCount: data.likesCount,
          likes: data.isLiked
            ? [...(prev.likes || []), user.id]
            : (prev.likes || []).filter((uid) => uid !== user.id),
        }));
      }
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to bookmark slides');
      return;
    }
    try {
      const { data } = await api.post(`/api/slides/${id}/bookmark`);
      if (data.success) {
        const currentIds = (user.bookmarks || []).map((b) =>
          typeof b === 'string' ? b : b._id
        );
        const updatedBookmarks = data.isBookmarked
          ? Array.from(new Set([...currentIds, id]))
          : currentIds.filter((bId) => String(bId) !== String(id));
        
        updateUser({ ...user, bookmarks: updatedBookmarks });
        toast.success(data.isBookmarked ? 'Bookmarked!' : 'Bookmark removed');
      }
    } catch (error) {
      toast.error('Failed to update bookmark');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this slide? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const { data } = await api.delete(`/api/slides/${id}`);
      if (data.success) {
        toast.success('Slide deleted successfully');
        router.push('/');
      }
    } catch (error) {
      toast.error('Failed to delete slide');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg mb-6" />
          <div className="aspect-[16/9] bg-slate-200 dark:bg-slate-700 rounded-2xl mb-8" />
          <div className="h-10 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!slide) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fadeIn">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
        <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          Home
        </Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <span className="text-slate-700 dark:text-slate-300 truncate">{slide.title}</span>
      </nav>

      {/* Presentation/PDF Previewer Container */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/10 dark:shadow-black/30 mb-8 border border-slate-200/50 dark:border-slate-700/50 bg-slate-950/5 dark:bg-slate-900/20">
        {!isPreviewing ? (
          <div className="relative group aspect-[16/9] overflow-hidden">
            <img
              src={slide.previewImageUrl}
              alt={slide.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Dark glassmorphic overlay over image with Play button */}
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] transition-all duration-300 group-hover:backdrop-blur-[4px] flex flex-col items-center justify-center">
              <button
                onClick={() => {
                  setIsPreviewing(true);
                  setIframeLoading(true);
                }}
                className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10 text-white shadow-2xl hover:bg-white/20 dark:hover:bg-black/30 hover:scale-105 active:scale-95 transition-all duration-300 group/btn cursor-pointer"
                id="launch-preview-btn"
              >
                <div className="w-16 h-16 rounded-full bg-indigo-600/90 dark:bg-indigo-500/90 flex items-center justify-center shadow-lg group-hover/btn:bg-indigo-500 group-hover/btn:shadow-indigo-500/50 transition-all">
                  <svg className="w-8 h-8 text-white ml-1 translate-x-[1px]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <span className="font-semibold text-lg tracking-wide drop-shadow-sm">Launch Presentation Preview</span>
              </button>
            </div>
            
            {/* View Full PDF at bottom-left */}
            <div className="absolute bottom-6 left-6">
              <a
                href={slide.slideUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-800 font-semibold rounded-xl hover:bg-slate-100 shadow-xl transition-all active:scale-95 text-sm"
                id="view-pdf-btn"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                View Full PDF
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col bg-slate-900 text-white">
            {/* Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold tracking-wide truncate max-w-[200px] sm:max-w-xs">{slide.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={slide.slideUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-all active:scale-95"
                  title="Open PDF in a new window"
                  id="preview-open-tab"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  Open in New Tab
                </a>
                <a
                  href={slide.slideUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-all active:scale-95"
                  title="Download PDF"
                  id="preview-download"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Download
                </a>
                <button
                  onClick={() => setIsPreviewing(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                  id="preview-close-btn"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Close Preview
                </button>
              </div>
            </div>

            {/* Presentation View Area */}
            <div className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[650px] bg-slate-950">
              {iframeLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/90 z-10 animate-pulse">
                  <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-indigo-500 animate-spin" />
                  <p className="text-sm font-medium text-slate-400">Loading presentation slides...</p>
                </div>
              )}
              {previewUrl && (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title={slide.title}
                  onLoad={() => setIframeLoading(false)}
                  allow="fullscreen"
                />
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Tags */}
          {slide.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {slide.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/?tags=${tag}`}
                  className="px-3 py-1 text-sm font-medium bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight" id="slide-title">
            {slide.title}
          </h1>

          {/* Description */}
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap mb-8">
            {slide.description}
          </p>

          {/* Actions bar */}
          <div className="flex items-center gap-3 pb-6 border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                isLiked
                  ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-700'
              }`}
              id="detail-like-btn"
            >
              <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              {slide.likesCount || 0} Like{slide.likesCount !== 1 ? 's' : ''}
            </button>

            <button
              onClick={handleBookmark}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 transition-all"
              id="detail-bookmark-btn"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
              Bookmark
            </button>

            {isAuthor && (
              <>
                <Link
                  href={`/edit/${id}`}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-950/30 transition-all ml-auto"
                  id="edit-btn"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.89 1.12l-2.685.8.8-2.685a4.5 4.5 0 011.12-1.89l12.685-12.685z" />
                  </svg>
                  Edit
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-950/30 disabled:opacity-50 transition-all"
                  id="delete-btn"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Author card */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
                Uploaded by
              </p>
              <div className="flex items-center gap-3">
                <img
                  src={slide.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(slide.author?.name || 'U')}&background=6366f1&color=fff&size=48`}
                  alt={slide.author?.name}
                  className="w-12 h-12 rounded-full ring-2 ring-indigo-500/20"
                />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{slide.author?.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{slide.author?.email}</p>
                </div>
              </div>
            </div>

            {/* Details card */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
                Details
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Uploaded</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(slide.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Time ago</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{timeAgo(slide.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Likes</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{slide.likesCount || 0}</span>
                </div>
              </div>
            </div>

            {/* Download button */}
            <a
              href={slide.slideUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold rounded-2xl hover:from-indigo-600 hover:to-violet-700 shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
              id="download-btn"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Open PDF
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
