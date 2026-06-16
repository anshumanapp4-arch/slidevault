'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import SlideCard from '@/components/SlideCard';
import SkeletonCard from '@/components/SkeletonCard';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

export default function ProfilePage() {
  const { user, isAuthenticated, loading: authLoading, logout, updateUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('slides');
  const [mySlides, setMySlides] = useState([]);
  const [bookmarkedSlides, setBookmarkedSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch user's slides
  const fetchMySlides = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.get('/api/slides?limit=50');
      if (data.success) {
        // Filter to only show current user's slides
        const filtered = data.slides.filter(
          (s) => s.author?._id === user.id
        );
        setMySlides(filtered);
      }
    } catch (error) {
      toast.error('Failed to load your slides');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch bookmarked slides
  const fetchBookmarked = useCallback(async () => {
    if (!user?.bookmarks || user.bookmarks.length === 0) {
      setBookmarkedSlides([]);
      return;
    }
    setLoading(true);
    try {
      // Fetch each bookmarked slide
      const promises = user.bookmarks.map(async (bookmark) => {
        const id = typeof bookmark === 'string' ? bookmark : bookmark._id;
        try {
          const { data } = await api.get(`/api/slides/${id}`);
          return data.success ? data.slide : null;
        } catch {
          return null;
        }
      });
      const results = await Promise.all(promises);
      setBookmarkedSlides(results.filter(Boolean));
    } catch (error) {
      toast.error('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'slides') {
      fetchMySlides();
    } else {
      fetchBookmarked();
    }
  }, [activeTab, fetchMySlides, fetchBookmarked]);

  const handleLike = async (slideId) => {
    try {
      const { data } = await api.post(`/api/slides/${slideId}/like`);
      if (data.success) {
        const updateSlides = (prev) =>
          prev.map((s) =>
            s._id === slideId
              ? { ...s, likesCount: data.likesCount, likes: data.isLiked ? [...(s.likes || []), user.id] : (s.likes || []).filter((id) => id !== user.id) }
              : s
          );
        setMySlides(updateSlides);
        setBookmarkedSlides(updateSlides);
      }
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  const handleBookmark = async (slideId) => {
    try {
      const { data } = await api.post(`/api/slides/${slideId}/bookmark`);
      if (data.success) {
        const currentIds = (user.bookmarks || []).map((b) =>
          typeof b === 'string' ? b : b._id
        );
        const updatedBookmarks = data.isBookmarked
          ? Array.from(new Set([...currentIds, slideId]))
          : currentIds.filter((bId) => String(bId) !== String(slideId));
        
        updateUser({ ...user, bookmarks: updatedBookmarks });

        if (!data.isBookmarked) {
          // Instantly remove from bookmarkedSlides state so it disappears from the tab
          setBookmarkedSlides((prev) => prev.filter((s) => s._id !== slideId));
        } else {
          // If they somehow re-bookmark it while on the page (e.g. from My Slides)
          // We don't automatically fetch it unless they switch tabs, which is fine
        }
        
        // Also update `isBookmarked` property if we want it to reflect in My Slides tab
        setMySlides((prev) =>
          prev.map((s) =>
            s._id === slideId ? { ...s, isBookmarked: data.isBookmarked } : s
          )
        );

        toast.success(data.isBookmarked ? 'Bookmarked!' : 'Bookmark removed');
      }
    } catch (error) {
      toast.error('Failed to update bookmark');
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentSlides = activeTab === 'slides' ? mySlides : bookmarkedSlides;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 animate-fadeIn">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-12">
        <img
          src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=6366f1&color=fff&size=96`}
          alt={user?.name}
          className="w-24 h-24 rounded-3xl ring-4 ring-indigo-500/20 shadow-xl"
        />
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">{user?.name}</h1>
          <p className="text-slate-500 dark:text-slate-400">{user?.email}</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Member since {user?.createdAt ? formatDate(user.createdAt) : 'recently'}
          </p>
        </div>
        <div className="sm:ml-auto flex gap-3">
          <button
            onClick={() => router.push('/upload')}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-violet-700 shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
          >
            Upload Slides
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/50 text-center">
          <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{mySlides.length}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Slides Uploaded</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/50 text-center">
          <p className="text-3xl font-black text-rose-500 dark:text-rose-400">
            {mySlides.reduce((acc, s) => acc + (s.likesCount || 0), 0)}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Total Likes</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/50 text-center col-span-2 sm:col-span-1">
          <p className="text-3xl font-black text-amber-500 dark:text-amber-400">{user?.bookmarks?.length || 0}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Bookmarks</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-8 bg-slate-100 dark:bg-slate-800/50 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('slides')}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'slides'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
          id="tab-my-slides"
        >
          My Slides
        </button>
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'bookmarks'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
          id="tab-bookmarks"
        >
          Bookmarked
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : currentSlides.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentSlides.map((slide) => (
            <SlideCard
              key={slide._id}
              slide={{
                ...slide,
                // On Profile page, anything in Bookmarked tab is obviously bookmarked, 
                // and in My Slides tab we check the user.bookmarks array
                isBookmarked: activeTab === 'bookmarks' 
                  ? true 
                  : (user?.bookmarks || []).some(b => {
                      const bId = typeof b === 'string' ? b : b._id;
                      return String(bId) === String(slide._id);
                    })
              }}
              onLike={handleLike}
              onBookmark={handleBookmark}
              isAuthenticated={isAuthenticated}
              currentUserId={user?.id}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <svg className="w-10 h-10 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m3-3H9.75m-2.25 3h.008v.008H7.5v-.008zm0-3h.008v.008H7.5v-.008zM10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            {activeTab === 'slides' ? 'No slides uploaded yet' : 'No bookmarks yet'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            {activeTab === 'slides'
              ? 'Upload your first case competition slides!'
              : 'Bookmark slides you like to find them later.'}
          </p>
          {activeTab === 'slides' && (
            <button
              onClick={() => router.push('/upload')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
            >
              Upload Slides
            </button>
          )}
        </div>
      )}
    </div>
  );
}
