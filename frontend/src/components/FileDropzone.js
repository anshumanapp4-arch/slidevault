'use client';

import { useState, useRef } from 'react';

export default function FileDropzone({
  accept,
  label,
  description,
  icon,
  onChange,
  preview,
  maxSize = '25MB',
  id,
}) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);

    // Generate preview for images
    if (preview && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    }

    onChange?.(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setFileName('');
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = '';
    onChange?.(null);
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
        dragActive
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
          : fileName
          ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/10'
          : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-800/30'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => !fileName && inputRef.current?.click()}
      id={id}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {/* Content */}
      <div className="p-8 text-center">
        {previewUrl ? (
          <div className="relative inline-block mb-3">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-32 rounded-xl shadow-lg"
            />
            <button
              onClick={(e) => { e.stopPropagation(); handleRemove(); }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : fileName ? (
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{fileName}</p>
              <button
                onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                className="text-xs text-red-500 hover:text-red-600 font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center">
              {icon || (
                <svg className="w-7 h-7 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
              {label || 'Drop your file here'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {description || `or click to browse • Max ${maxSize}`}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
