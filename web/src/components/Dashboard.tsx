import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { VideoUpload } from './VideoUpload';
import { Layout } from './Layout';

interface Video {
  id: string;
  title: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  created_at: string;
  storage_path: string;
}

const statusConfig: Record<Video['status'], { label: string; bg: string; border: string; color: string }> = {
  uploaded: { label: 'Queued', bg: 'rgba(133,153,255,0.08)', border: 'rgba(133,153,255,0.2)', color: '#8599FF' },
  processing: { label: 'Processing', bg: 'rgba(161,0,255,0.08)', border: 'rgba(161,0,255,0.25)', color: '#A100FF' },
  completed: { label: 'Completed', bg: 'rgba(255,22,115,0.08)', border: 'rgba(255,22,115,0.25)', color: '#FF1673' },
  failed: { label: 'Failed', bg: 'rgba(255,22,53,0.08)', border: 'rgba(255,22,53,0.2)', color: '#FF1635' },
};

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchVideos();
  }, [user]);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('id, title, status, created_at, storage_path')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setVideos(data || []);
    } catch (err) {
      console.error('Error fetching videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteVideo = async (video: Video) => {
    setDeletingId(video.id);
    try {
      // Delete DB row first — cascades to pipeline_status, transcripts, generated_content
      const { error } = await supabase.from('videos').delete().eq('id', video.id);
      if (error) throw error;

      // Remove video file from storage
      if (video.storage_path) {
        await supabase.storage.from('videos').remove([video.storage_path]);
      }

      // Remove thumbnail files (thumbnails/{videoId}/{platform}.jpg)
      const thumbnailPaths = ['youtube', 'tiktok', 'instagram'].map(
        (p) => `thumbnails/${video.id}/${p}.jpg`
      );
      await supabase.storage.from('videos').remove(thumbnailPaths);

      setVideos((prev) => prev.filter((v) => v.id !== video.id));
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <Layout pageTitle="Upload">
      <div className="p-8 max-w-5xl">
        {/* Section header */}
        <div className="mb-8">
          <h2 className="text-3xl font-space font-bold text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
            New upload
          </h2>
          <p className="text-white/45 text-sm" style={{ fontFamily: '"Inter", sans-serif' }}>
            Upload a long-form video and River will generate content for every platform.
          </p>
        </div>

        <VideoUpload onUploadComplete={(videoId) => navigate(`/pipeline/${videoId}`)} />

        {/* Videos list */}
        <div className="mt-14">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-space font-semibold text-white" style={{ letterSpacing: '-0.01em' }}>
              Your videos
            </h3>
            {!loading && videos.length > 0 && (
              <span
                className="text-xs text-white/35 uppercase"
                style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.10em' }}
              >
                {videos.length} total
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center gap-3 py-8 text-white/35 text-sm">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading...
            </div>
          ) : videos.length === 0 ? (
            <div className="py-12 text-center" style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, background: 'rgba(0,9,71,0.3)', overflow: 'hidden' }}>
              <p className="text-white/35 text-sm" style={{ fontFamily: '"Inter", sans-serif' }}>
                No videos yet. Upload your first video above.
              </p>
            </div>
          ) : (
            <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, background: 'rgba(0,9,71,0.3)', overflow: 'hidden' }}>
              <ul className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {videos.map((video) => {
                  const cfg = statusConfig[video.status];
                  const isConfirming = confirmDeleteId === video.id;
                  const isDeleting = deletingId === video.id;

                  return (
                    <li
                      key={video.id}
                      className="group px-5 py-4 flex items-center justify-between transition-colors duration-150 motion-reduce:transition-none"
                      style={{ background: isConfirming ? 'rgba(255,22,53,0.04)' : 'transparent' }}
                      onMouseEnter={(e) => { if (!isConfirming) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                      onMouseLeave={(e) => { if (!isConfirming) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-space font-semibold text-white truncate mb-0.5">
                          {video.title}
                        </h4>
                        <p
                          className="text-xs text-white/35"
                          style={{ fontFamily: '"JetBrains Mono", monospace' }}
                        >
                          {new Date(video.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{
                            background: cfg.bg,
                            border: `1px solid ${cfg.border}`,
                            color: cfg.color,
                            fontFamily: '"JetBrains Mono", monospace',
                            letterSpacing: '0.06em',
                          }}
                        >
                          {cfg.label}
                        </span>

                        {video.status === 'processing' && (
                          <Link
                            to={`/pipeline/${video.id}`}
                            className="px-3 py-1.5 text-xs font-space font-semibold text-vista-blue rounded-lg transition-[color,background-color,border-color,opacity] duration-150 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF1673] focus-visible:outline-offset-4"
                            style={{ background: 'rgba(133,153,255,0.08)', border: '1px solid rgba(133,153,255,0.2)' }}
                          >
                            View Pipeline →
                          </Link>
                        )}
                        {video.status === 'completed' && (
                          <Link
                            to={`/review/${video.id}`}
                            className="px-3 py-1.5 text-xs font-space font-semibold text-white rounded-lg transition-[background-color,box-shadow,opacity] duration-150 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF1673] focus-visible:outline-offset-4"
                            style={{ background: '#FF1635', boxShadow: '0 2px 10px rgba(255,22,53,0.3)' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#e01030')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#FF1635')}
                          >
                            Review →
                          </Link>
                        )}

                        {/* Delete controls */}
                        {isConfirming ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/50 mr-1" style={{ fontFamily: '"Inter", sans-serif' }}>
                              Delete?
                            </span>
                            <button
                              onClick={() => deleteVideo(video)}
                              disabled={isDeleting}
                              className="px-3 py-1.5 text-xs font-space font-semibold text-white rounded-lg transition-[background-color,opacity] duration-150 motion-reduce:transition-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF1673] focus-visible:outline-offset-4"
                              style={{ background: '#FF1635' }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#e01030')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = '#FF1635')}
                            >
                              {isDeleting ? 'Deleting...' : 'Yes, delete'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={isDeleting}
                              className="px-3 py-1.5 text-xs font-space font-semibold rounded-lg transition-[color,background-color,border-color,opacity] duration-150 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF1673] focus-visible:outline-offset-4"
                              style={{ color: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.10)' }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.50)'; e.currentTarget.style.background = 'transparent'; }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(video.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg transition-[color,background-color,opacity] duration-150 motion-reduce:transition-none opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF1673] focus-visible:outline-offset-2"
                            style={{ color: 'rgba(255,255,255,0.25)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#FF1635'; e.currentTarget.style.background = 'rgba(255,22,53,0.08)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'transparent'; }}
                            title="Delete video"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
