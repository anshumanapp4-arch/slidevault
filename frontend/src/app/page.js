'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import SlideCard from '@/components/SlideCard';
import SkeletonCard from '@/components/SkeletonCard';
import SearchBar from '@/components/SearchBar';
import TagFilter from '@/components/TagFilter';
import Pagination from '@/components/Pagination';
import toast from 'react-hot-toast';

export default function HomePage() {
  const { user, isAuthenticated, updateUser } = useAuth();
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSlides, setTotalSlides] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  // Fetch slides
  const fetchSlides = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', '12');
      if (search) params.set('search', search);
      if (selectedTag) params.set('tags', selectedTag);
      if (sortBy) params.set('sort', sortBy);

      const { data } = await api.get(`/api/slides?${params.toString()}`);
      if (data.success) {
        setSlides(data.slides);
        setTotalPages(data.totalPages);
        setTotalSlides(data.totalSlides);
      }
    } catch (error) {
      toast.error('Failed to load slides');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedTag, sortBy]);

  // Fetch tags
  const fetchTags = useCallback(async () => {
    try {
      const { data } = await api.get('/api/slides/tags');
      if (data.success) {
        setTags(data.tags);
      }
    } catch (error) {
      // Tags are non-critical, fail silently
    }
  }, []);

  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Track bookmarks from user data
  useEffect(() => {
    if (user?.bookmarks) {
      setBookmarkedIds(user.bookmarks.map((b) => (typeof b === 'string' ? b : b._id)));
    }
  }, [user]);

  // Handle search
  const handleSearch = (term) => {
    setSearch(term);
    setPage(1);
  };

  // Handle tag filter
  const handleTagSelect = (tag) => {
    setSelectedTag(tag);
    setPage(1);
  };

  // Handle sort
  const handleSort = (sort) => {
    setSortBy(sort);
    setPage(1);
  };

  // Handle like
  const handleLike = async (slideId) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to like slides');
      return;
    }
    try {
      const { data } = await api.post(`/api/slides/${slideId}/like`);
      if (data.success) {
        setSlides((prev) =>
          prev.map((s) =>
            s._id === slideId
              ? {
                  ...s,
                  likesCount: data.likesCount,
                  likes: data.isLiked
                    ? [...(s.likes || []), user.id]
                    : (s.likes || []).filter((id) => id !== user.id),
                }
              : s
          )
        );
      }
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  // Handle bookmark
  const handleBookmark = async (slideId) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to bookmark slides');
      return;
    }
    try {
      const { data } = await api.post(`/api/slides/${slideId}/bookmark`);
      if (data.success) {
        const currentIds = (user.bookmarks || []).map((b) =>
          typeof b === 'string' ? b : b._id
        );
        const updatedBookmarks = data.isBookmarked
          ? Array.from(new Set([...currentIds, slideId]))
          : currentIds.filter((id) => String(id) !== String(slideId));
        
        updateUser({ ...user, bookmarks: updatedBookmarks });

        setBookmarkedIds((prev) =>
          data.isBookmarked
            ? [...prev, slideId]
            : prev.filter((id) => id !== slideId)
        );
        toast.success(data.isBookmarked ? 'Bookmarked!' : 'Bookmark removed');
      }
    } catch (error) {
      toast.error('Failed to update bookmark');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 dark:from-indigo-950 dark:via-violet-950 dark:to-slate-900">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl animate-float delay-300" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center animate-slideUp">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight">
              Case Competition
              <span className="block bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
                Slides Showcase
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-indigo-100/80 max-w-2xl mx-auto mb-8">
              Discover winning presentation decks from top business competitions. 
              Learn, get inspired, and share your own.
            </p>

            {/* Search + Upload */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
              <SearchBar onSearch={handleSearch} />
              <Link
                href="/upload"
                className="flex-shrink-0 flex items-center gap-2 px-6 py-3.5 bg-white text-indigo-600 font-semibold rounded-2xl hover:bg-indigo-50 shadow-xl shadow-black/10 transition-all active:scale-95"
                id="hero-upload-btn"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Upload Slides
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 animate-fadeIn">
          {/* Tag filters */}
          <div className="w-full sm:w-auto flex-1 overflow-hidden">
            {tags.length > 0 && (
              <TagFilter
                tags={tags}
                selectedTag={selectedTag}
                onSelectTag={handleTagSelect}
              />
            )}
          </div>

          {/* Sort + Count */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {totalSlides} slide{totalSlides !== 1 ? 's' : ''}
            </span>
            <select
              value={sortBy}
              onChange={(e) => handleSort(e.target.value)}
              className="px-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
              id="sort-select"
            >
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Slides Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : slides.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {slides.map((slide, idx) => (
                <div key={slide._id} className="animate-slideUp" style={{ animationDelay: `${idx * 50}ms` }}>
                  <SlideCard
                    slide={{ ...slide, isBookmarked: bookmarkedIds.includes(slide._id) }}
                    onLike={handleLike}
                    onBookmark={handleBookmark}
                    isAuthenticated={isAuthenticated}
                    currentUserId={user?.id}
                  />
                </div>
              ))}
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-20 animate-fadeIn">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <svg className="w-12 h-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m3-3H9.75m-2.25 3h.008v.008H7.5v-.008zm0-3h.008v.008H7.5v-.008zM10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {search || selectedTag ? 'No slides found' : 'No slides yet'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
              {search || selectedTag
                ? 'Try adjusting your search or filter criteria.'
                : 'Be the first to upload case competition slides!'}
            </p>
            {!search && !selectedTag && (
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold rounded-2xl hover:from-indigo-600 hover:to-violet-700 shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Upload Your First Slide
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
