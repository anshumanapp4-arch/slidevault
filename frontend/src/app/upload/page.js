'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import FileDropzone from '@/components/FileDropzone';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function UploadPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [form, setForm] = useState({
    title: '',
    description: '',
    tags: '',
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [slideFile, setSlideFile] = useState(null);
  const [errors, setErrors] = useState({});

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error('Please sign in to upload slides');
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const validateForm = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (!previewImage) newErrors.previewImage = 'Preview image is required';
    if (!slideFile) newErrors.slideFile = 'Slide PDF is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      formData.append('tags', form.tags);
      formData.append('previewImage', previewImage);
      formData.append('slideFile', slideFile);

      const { data } = await api.post('/api/slides', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      });

      if (data.success) {
        toast.success('Slide uploaded successfully!');
        router.push('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
          Upload Slides
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Share your case competition presentation with the community
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => {
              setForm({ ...form, title: e.target.value });
              setErrors({ ...errors, title: '' });
            }}
            placeholder="e.g., McKinsey Case Competition 2024 — Market Entry Strategy"
            className={`w-full px-5 py-3.5 bg-white dark:bg-slate-800/50 border ${
              errors.title ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
            } rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all`}
            maxLength={150}
          />
          {errors.title && <p className="mt-1.5 text-sm text-red-500">{errors.title}</p>}
          <p className="mt-1.5 text-xs text-slate-400 text-right">{form.title.length}/150</p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => {
              setForm({ ...form, description: e.target.value });
              setErrors({ ...errors, description: '' });
            }}
            placeholder="Describe what this presentation covers, the competition context, and key insights..."
            rows={5}
            className={`w-full px-5 py-3.5 bg-white dark:bg-slate-800/50 border ${
              errors.description ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
            } rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none`}
            maxLength={2000}
          />
          {errors.description && <p className="mt-1.5 text-sm text-red-500">{errors.description}</p>}
          <p className="mt-1.5 text-xs text-slate-400 text-right">{form.description.length}/2000</p>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Tags
          </label>
          <input
            id="tags"
            type="text"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="e.g., strategy, consulting, fintech, market-entry"
            className="w-full px-5 py-3.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
          />
          <p className="mt-1.5 text-xs text-slate-400">Separate tags with commas</p>

          {/* Tag preview chips */}
          {form.tags && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {form.tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
                .map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 text-xs font-medium bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-lg"
                  >
                    {tag}
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* File uploads */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Preview Image <span className="text-red-500">*</span>
            </label>
            <FileDropzone
              accept="image/*"
              label="Drop preview image"
              description="JPG, PNG, WebP • Max 5MB"
              preview={true}
              maxSize="5MB"
              onChange={(file) => {
                setPreviewImage(file);
                setErrors({ ...errors, previewImage: '' });
              }}
              id="preview-dropzone"
            />
            {errors.previewImage && <p className="mt-1.5 text-sm text-red-500">{errors.previewImage}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Slide PDF <span className="text-red-500">*</span>
            </label>
            <FileDropzone
              accept=".pdf"
              label="Drop slide PDF"
              description="PDF only • Max 20MB"
              maxSize="20MB"
              onChange={(file) => {
                setSlideFile(file);
                setErrors({ ...errors, slideFile: '' });
              }}
              id="pdf-dropzone"
              icon={
                <svg className="w-7 h-7 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              }
            />
            {errors.slideFile && <p className="mt-1.5 text-sm text-red-500">{errors.slideFile}</p>}
          </div>
        </div>

        {/* Upload progress */}
        {uploading && progress > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Uploading...</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{progress}%</span>
            </div>
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={uploading}
          className="w-full py-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-lg rounded-2xl hover:from-indigo-600 hover:to-violet-700 shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          id="submit-upload"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Uploading...
            </span>
          ) : (
            'Upload Slides'
          )}
        </button>
      </form>
    </div>
  );
}
