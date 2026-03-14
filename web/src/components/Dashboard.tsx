import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { VideoUpload } from './VideoUpload';
import { Layout } from './Layout';

interface Video {
  id: string;
  title: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

export function Dashboard() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchVideos();
    }
  }, [user]);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('id, title, status, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (err) {
      console.error('Error fetching videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Video['status']) => {
    switch (status) {
      case 'uploaded':
        return 'bg-vista-blue/10 text-vista-blue border border-vista-blue/20';
      case 'processing':
        return 'bg-purple/10 text-purple border border-purple/20';
      case 'completed':
        return 'bg-pinky/10 text-pinky border border-pinky/20';
      case 'failed':
        return 'bg-big-red/10 text-big-red border border-big-red/20';
      default:
        return 'bg-white/5 text-white/45 border border-white/10';
    }
  };

  return (
    <Layout pageTitle="Upload">
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-section font-space font-bold text-white mb-2">Upload Video</h2>
          <p className="text-white/45 font-inter">
            Upload your long-form video to get started with AI-powered content distribution
          </p>
        </div>

        <VideoUpload />

        <div className="mt-12">
          <h2 className="text-2xl font-space font-bold text-white mb-4">Your Videos</h2>
          {loading ? (
            <p className="text-white/45 font-inter">Loading videos...</p>
          ) : videos.length === 0 ? (
            <p className="text-white/45 font-inter">No videos uploaded yet. Upload your first video above!</p>
          ) : (
            <div className="bg-dark-navy border border-white/6 rounded-card shadow-card-dark overflow-hidden">
              <ul className="divide-y divide-white/6">
                {videos.map((video) => (
                  <li key={video.id} className="p-4 hover:bg-white/5 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-space font-semibold text-white">{video.title}</h3>
                        <p className="text-sm text-white/45 font-inter">
                          {new Date(video.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium font-mono uppercase tracking-mono-label ${getStatusColor(
                            video.status
                          )}`}
                        >
                          {video.status}
                        </span>
                        {video.status === 'processing' && (
                          <Link
                            to={`/pipeline/${video.id}`}
                            className="px-3 py-1 text-xs font-medium text-vista-blue hover:text-white hover:bg-vista-blue/10 rounded transition-colors font-space"
                          >
                            View Pipeline
                          </Link>
                        )}
                        {video.status === 'completed' && (
                          <Link
                            to={`/review/${video.id}`}
                            className="px-3 py-1 text-xs font-medium text-purple hover:text-white hover:bg-purple/10 rounded transition-colors font-space"
                          >
                            Review Content
                          </Link>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
