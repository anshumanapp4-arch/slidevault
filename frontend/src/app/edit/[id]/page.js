'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import FileDropzone from '@/components/FileDropzone';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function EditSlidePage() {
  const { id } = useParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
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
      toast.error('Please sign in to edit slides');
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch slide data
  useEffect(() => {
    const fetchSlide = async () => {
      try {
        const { data } = await api.get(`/api/slides/${id}`);
        if (data.success) {
          const slide = data.slide;
          // Security Check
          if (slide.author?._id !== user?.id) {
            toast.error('You are not authorized to edit this slide');
            router.push('/');
            return;
          }
          setForm({
            title: slide.title || '',
            description: slide.description || '',
            tags: slide.tags ? slide.tags.join(', ') : '',
          });
        }
      } catch (error) {
        toast.error('Slide not found');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    if (id && user) {
      fetchSlide();
    }
  }, [id, user, router]);

  const validateForm = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setUpdating(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      formData.append('tags', form.tags);
      
      // Only append files if the user selected new ones
      if (previewImage) formData.append('previewImage', previewImage);
      if (slideFile) formData.append('slideFile', slideFile);

      const { data } = await api.put(`/api/slides/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (previewImage || slideFile) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          }
        },
      });

      if (data.success) {
        toast.success('Slide updated successfully!');
        router.push(`/slides/${id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed. Please try again.');
    } finally {
      setUpdating(false);
      setProgress(0);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 animate-fadeIn">
      <div className="text-center mb-10">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.89 1.12l-2.685.8.8-2.685a4.5 4.5 0 011.12-1.89l6.89-6.89z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L22.125 4.5m-5.625 2.625L19.5 9.75" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
          Edit Slide Details
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Update your presentation metadata and optional files
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
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
            className={`w-full px-5 py-3.5 bg-white dark:bg-slate-800/50 border ${
              errors.title ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
            } rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all`}
            maxLength={150}
          />
          {errors.title && <p className="mt-1.5 text-sm text-red-500">{errors.title}</p>}
        </div>

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
            rows={5}
            className={`w-full px-5 py-3.5 bg-white dark:bg-slate-800/50 border ${
              errors.description ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
            } rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none`}
            maxLength={2000}
          />
          {errors.description && <p className="mt-1.5 text-sm text-red-500">{errors.description}</p>}
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Tags
          </label>
          <input
            id="tags"
            type="text"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className="w-full px-5 py-3.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
          />
          <p className="mt-1.5 text-xs text-slate-400">Separate tags with commas</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="col-span-full">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Replace Files (Optional)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Leave these fields empty if you want to keep your existing images and PDF.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              New Preview Image
            </label>
            <FileDropzone
              accept="image/*"
              label="Replace preview image"
              description="Optional • Max 5MB"
              preview={true}
              maxSize="5MB"
              onChange={(file) => setPreviewImage(file)}
              id="preview-dropzone"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              New Slide PDF
            </label>
            <FileDropzone
              accept=".pdf"
              label="Replace slide PDF"
              description="Optional • Max 20MB"
              maxSize="20MB"
              onChange={(file) => setSlideFile(file)}
              id="pdf-dropzone"
              icon={
                <svg className="w-7 h-7 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              }
            />
          </div>
        </div>

        {updating && progress > 0 && (
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

        <button
          type="submit"
          disabled={updating}
          className="w-full py-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-lg rounded-2xl hover:from-indigo-600 hover:to-violet-700 shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          id="submit-update"
        >
          {updating ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving Changes...
            </span>
          ) : (
            'Save Changes'
          )}
        </button>
      </form>
    </div>
  );
}
