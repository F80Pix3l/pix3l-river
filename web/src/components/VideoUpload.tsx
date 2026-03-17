import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { GlowCard } from './GlowCard';

const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
const MAX_FILE_SIZE = 500 * 1024 * 1024;

type Platform = 'youtube' | 'tiktok' | 'instagram';

const platformConfig: Record<Platform, { label: string; color: string; activeBg: string; activeBorder: string }> = {
  youtube: { label: 'YouTube', color: '#FF1635', activeBg: 'rgba(255,22,53,0.08)', activeBorder: 'rgba(255,22,53,0.35)' },
  tiktok: { label: 'TikTok', color: '#8599FF', activeBg: 'rgba(133,153,255,0.08)', activeBorder: 'rgba(133,153,255,0.35)' },
  instagram: { label: 'Instagram', color: '#FF1673', activeBg: 'rgba(255,22,115,0.08)', activeBorder: 'rgba(255,22,115,0.35)' },
};

export function VideoUpload({ onUploadComplete }: { onUploadComplete?: (videoId: string) => void }) {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['youtube', 'tiktok', 'instagram']);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) return 'Invalid file type. Upload MP4, MOV, or AVI files.';
    if (file.size > MAX_FILE_SIZE) return 'File exceeds 500MB limit.';
    return null;
  };

  const uploadVideo = async (file: File) => {
    if (!user) { setError('You must be signed in to upload videos'); return; }
    const validationError = validateFile(file);
    if (validationError) { setError(validationError); return; }

    setUploading(true);
    setError('');
    setProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      setProgress(50);

      const { error: uploadError } = await supabase.storage.from('videos').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { data: videoRow, error: dbError } = await supabase.from('videos').insert({
        user_id: user.id,
        title: file.name.replace(/\.[^/.]+$/, ''),
        status: 'uploaded',
        storage_path: fileName,
        platforms: selectedPlatforms,
      }).select('id').single();
      if (dbError) throw dbError;

      setProgress(100);
      onUploadComplete?.(videoRow.id);
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
        setSelectedFile(null);
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
      const err = validateFile(file);
      if (err) setError(err);
      else { setSelectedFile(file); setError(''); }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const err = validateFile(file);
      if (err) setError(err);
      else { setSelectedFile(file); setError(''); }
    }
  };

  return (
    <div>
      {/* Drop Zone */}
      <GlowCard
        bg={isDragging ? '#000d4a' : '#000947'}
        innerClassName="p-12 text-center"
        innerStyle={{
          border: isDragging ? '2px dashed rgba(133,153,255,0.7)' : '2px dashed rgba(133,153,255,0.25)',
          transition: 'border-color 0.3s ease, background-color 0.3s ease',
        }}
        onDrop={handleDrop}
        onDragOver={(e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        style={{
          opacity: uploading ? 0.6 : 1,
          pointerEvents: uploading ? 'none' : 'auto',
        }}
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
          <div className="space-y-5">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
              style={{ background: 'rgba(255,22,53,0.1)', border: '1px solid rgba(255,22,53,0.2)' }}
            >
              <svg className="w-6 h-6 text-big-red animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <div>
              <p className="font-space font-semibold text-white text-lg mb-1">Uploading...</p>
              <p className="text-white/45 text-sm" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                {progress}%
              </p>
            </div>
            <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-1.5 rounded-full transition-[width] duration-300 motion-reduce:transition-none"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #FF1635, #A100FF)' }}
              />
            </div>
          </div>
        ) : (
          <>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(133,153,255,0.10)', border: '1px solid rgba(133,153,255,0.15)' }}
            >
              <svg className="w-8 h-8" fill="none" stroke="#8599FF" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>

            {selectedFile ? (
              <div className="mb-4">
                <p className="text-white font-space font-semibold text-lg mb-1">{selectedFile.name}</p>
                <p className="text-white/45 text-sm">
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-white font-space font-semibold text-lg mb-1">Drop your video here</p>
                <p className="text-white/45 text-sm">or click to browse files</p>
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2.5 text-white text-sm font-space font-semibold rounded-full transition-[background-color,box-shadow,color,border-color] duration-200 motion-reduce:transition-none active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF1673] focus-visible:outline-offset-4"
              style={{
                background: selectedFile ? 'rgba(133,153,255,0.12)' : '#FF1635',
                border: selectedFile ? '1px solid rgba(133,153,255,0.3)' : 'none',
                boxShadow: selectedFile ? 'none' : '0 4px 16px rgba(255,22,53,0.3)',
                color: selectedFile ? '#8599FF' : '#fff',
              }}
            >
              {selectedFile ? 'Change file' : 'Choose file'}
            </button>

            <p
              className="text-white/25 text-xs mt-4"
              style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.08em' }}
            >
              MP4 · MOV · AVI · up to 500MB
            </p>
          </>
        )}
      </GlowCard>

      {error && (
        <div
          className="mt-4 px-4 py-3 rounded-lg text-sm text-big-red"
          style={{ background: 'rgba(255,22,53,0.08)', border: '1px solid rgba(255,22,53,0.2)' }}
        >
          {error}
        </div>
      )}

      {/* Platform Toggles */}
      {!uploading && selectedFile && (
        <div className="mt-8">
          <p
            className="text-white/40 text-xs uppercase mb-4"
            style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.12em' }}
          >
            Platforms
          </p>
          <div className="flex gap-3">
            {(Object.keys(platformConfig) as Platform[]).map((platform) => {
              const cfg = platformConfig[platform];
              const active = selectedPlatforms.includes(platform);
              return (
                <button
                  key={platform}
                  onClick={() => togglePlatform(platform)}
                  className="flex-1 px-4 py-3 rounded-lg transition-[background-color,border-color,color] duration-200 motion-reduce:transition-none active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF1673] focus-visible:outline-offset-2"
                  style={{
                    background: active ? cfg.activeBg : 'rgba(0,9,71,0.4)',
                    border: `1px solid ${active ? cfg.activeBorder : 'rgba(255,255,255,0.08)'}`,
                    color: active ? cfg.color : 'rgba(255,255,255,0.35)',
                  }}
                >
                  <div className="font-space font-semibold text-sm">{cfg.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      {!uploading && selectedFile && selectedPlatforms.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => uploadVideo(selectedFile)}
            className="w-full py-4 text-white rounded-lg font-space font-bold text-base transition-[box-shadow,opacity] duration-200 motion-reduce:transition-none active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF1673] focus-visible:outline-offset-4"
            style={{
              background: 'linear-gradient(135deg, #FF1635 0%, #A100FF 100%)',
              boxShadow: '0 4px 24px rgba(255,22,53,0.35)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 32px rgba(255,22,53,0.45)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 4px 24px rgba(255,22,53,0.35)')}
          >
            Start Pipeline
          </button>
        </div>
      )}
    </div>
  );
}
