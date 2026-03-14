import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

type Platform = 'youtube' | 'tiktok' | 'instagram';

export function VideoUpload() {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['youtube', 'tiktok', 'instagram']);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload MP4, MOV, or AVI files.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 500MB limit.';
    }
    return null;
  };

  const uploadVideo = async (file: File) => {
    if (!user) {
      setError('You must be signed in to upload videos');
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError('');
    setProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      // Note: Supabase storage doesn't support progress callbacks yet
      setProgress(50); // Show intermediate progress
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Create database entry
      const { error: dbError } = await supabase.from('videos').insert({
        user_id: user.id,
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        status: 'uploaded',
        storage_path: fileName,
      });

      if (dbError) throw dbError;

      setProgress(100);
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
      } else {
        setSelectedFile(file);
        setError('');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
      } else {
        setSelectedFile(file);
        setError('');
      }
    }
  };

  const handleStartPipeline = () => {
    if (selectedFile && selectedPlatforms.length > 0) {
      uploadVideo(selectedFile);
    }
  };

  return (
    <div className="max-w-3xl">
      {/* Upload Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-card p-12 text-center transition-all duration-200
          ${isDragging ? 'border-vista-blue bg-vista-blue/5' : 'border-vista-blue/40 hover:border-vista-blue/60 hover:bg-vista-blue/5'}
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp4,.mov,.avi"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {uploading ? (
          <div className="space-y-4">
            <div className="text-lg font-space font-semibold text-white">
              Uploading... {progress}%
            </div>
            <div className="w-full bg-dark-navy rounded-full h-2">
              <div
                className="bg-purple h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Cloud Icon */}
            <svg
              className="mx-auto h-16 w-16 text-vista-blue"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <div className="mt-6">
              <p className="text-lg font-inter text-white/70 mb-4">
                {selectedFile ? selectedFile.name : 'Drop your video here or choose a file'}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-6 py-2 bg-big-red text-white rounded-full font-space font-semibold text-sm hover:bg-big-red/90 transition-all duration-200 active:scale-[0.97]"
              >
                Choose File
              </button>
              <p className="text-sm text-white/45 mt-4 font-inter">
                MP4, MOV, or AVI files up to 500MB
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 bg-big-red/10 border border-big-red/20 text-big-red px-4 py-3 rounded-lg font-inter text-sm">
          {error}
        </div>
      )}

      {/* Platform Toggles */}
      {!uploading && selectedFile && (
        <div className="mt-8">
          <h3 className="text-sm font-mono uppercase tracking-mono-label text-white/55 mb-4">
            Select Platforms
          </h3>
          <div className="flex gap-3">
            <button
              onClick={() => togglePlatform('youtube')}
              className={`
                flex-1 px-4 py-3 rounded-lg border transition-all duration-200
                ${selectedPlatforms.includes('youtube')
                  ? 'bg-vista-blue/10 border-vista-blue/40 text-vista-blue'
                  : 'bg-dark-navy border-white/10 text-white/45 hover:border-white/20'
                }
              `}
            >
              <div className="font-space font-semibold">YouTube</div>
            </button>
            <button
              onClick={() => togglePlatform('tiktok')}
              className={`
                flex-1 px-4 py-3 rounded-lg border transition-all duration-200
                ${selectedPlatforms.includes('tiktok')
                  ? 'bg-vista-blue/10 border-vista-blue/40 text-vista-blue'
                  : 'bg-dark-navy border-white/10 text-white/45 hover:border-white/20'
                }
              `}
            >
              <div className="font-space font-semibold">TikTok</div>
            </button>
            <button
              onClick={() => togglePlatform('instagram')}
              className={`
                flex-1 px-4 py-3 rounded-lg border transition-all duration-200
                ${selectedPlatforms.includes('instagram')
                  ? 'bg-vista-blue/10 border-vista-blue/40 text-vista-blue'
                  : 'bg-dark-navy border-white/10 text-white/45 hover:border-white/20'
                }
              `}
            >
              <div className="font-space font-semibold">Instagram</div>
            </button>
          </div>
        </div>
      )}

      {/* Start Pipeline Button */}
      {!uploading && selectedFile && selectedPlatforms.length > 0 && (
        <div className="mt-8">
          <button
            onClick={handleStartPipeline}
            className="w-full py-4 bg-big-red text-white rounded-lg font-space font-bold text-lg hover:bg-big-red/90 transition-all duration-200 active:scale-[0.97] shadow-card-dark hover:shadow-card-dark-hover"
          >
            Start Pipeline
          </button>
        </div>
      )}
    </div>
  );
}
