'use client';

export default function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-700" />

      <div className="p-5">
        {/* Tags skeleton */}
        <div className="flex gap-1.5 mb-3">
          <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        </div>

        {/* Title skeleton */}
        <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2" />

        {/* Description skeleton */}
        <div className="space-y-1.5 mb-4">
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>

        {/* Footer skeleton */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
          <div className="flex gap-1">
            <div className="w-8 h-6 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
