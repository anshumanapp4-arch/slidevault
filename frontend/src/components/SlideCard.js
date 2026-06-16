'use client';

import Link from 'next/link';
import { truncateText, timeAgo } from '@/lib/utils';

export default function SlideCard({ slide, onLike, onBookmark, isAuthenticated, currentUserId }) {
  const isLiked = slide.likes?.includes(currentUserId);
  const isBookmarked = slide.isBookmarked;

  return (
    <div className="group relative bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-1" id={`slide-card-${slide._id}`}>
      {/* Preview Image */}
      <Link href={`/slides/${slide._id}`} className="block relative overflow-hidden aspect-[4/3]">
        <img
          src={slide.previewImageUrl}
          alt={slide.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* View button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="px-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl text-sm font-semibold text-indigo-600 dark:text-indigo-400 shadow-lg">
            View Slides →
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-5">
        {/* Tags */}
        {slide.tags && slide.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {slide.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 text-xs font-medium bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-100 dark:border-indigo-900/50"
              >
                {tag}
              </span>
            ))}
            {slide.tags.length > 3 && (
              <span className="px-2.5 py-0.5 text-xs font-medium text-slate-400 dark:text-slate-500">
                +{slide.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <Link href={`/slides/${slide._id}`}>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {slide.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
          {truncateText(slide.description, 120)}
        </p>

        {/* Footer: Author + Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-2">
            <img
              src={slide.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(slide.author?.name || 'U')}&background=6366f1&color=fff&size=32`}
              alt={slide.author?.name}
              className="w-6 h-6 rounded-full"
            />
            <div>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{slide.author?.name || 'Unknown'}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">{timeAgo(slide.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Like button */}
            <button
              onClick={() => onLike?.(slide._id)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                isLiked
                  ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/20'
                  : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20'
              }`}
              id={`like-btn-${slide._id}`}
            >
              <svg className="w-3.5 h-3.5" fill={isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              {slide.likesCount > 0 && <span>{slide.likesCount}</span>}
            </button>

            {currentUserId === (slide.author?._id || slide.author) && (
              <Link
                href={`/edit/${slide._id}`}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all"
                title="Edit Slide"
                id={`edit-shortcut-${slide._id}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.89 1.12l-2.685.8.8-2.685a4.5 4.5 0 011.12-1.89l12.685-12.685z" />
                </svg>
              </Link>
            )}

            {/* Bookmark button */}
            <button
              onClick={() => onBookmark?.(slide._id)}
              className={`p-1.5 rounded-lg transition-all ${
                isBookmarked
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/20'
                  : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20'
              }`}
              id={`bookmark-btn-${slide._id}`}
            >
              <svg className="w-3.5 h-3.5" fill={isBookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
