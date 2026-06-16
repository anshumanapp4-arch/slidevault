'use client';

export default function TagFilter({ tags, selectedTag, onSelectTag }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide" id="tag-filter">
      {/* "All" chip */}
      <button
        onClick={() => onSelectTag?.('')}
        className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
          !selectedTag
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
        id="tag-all"
      >
        All
      </button>

      {tags.map((tag) => (
        <button
          key={tag.name}
          onClick={() => onSelectTag?.(tag.name)}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            selectedTag === tag.name
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
          id={`tag-${tag.name}`}
        >
          {tag.name}
          <span className={`ml-1.5 text-xs ${
            selectedTag === tag.name ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'
          }`}>
            {tag.count}
          </span>
        </button>
      ))}
    </div>
  );
}
