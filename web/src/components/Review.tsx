import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Layout } from './Layout';

type Platform = 'youtube' | 'tiktok' | 'instagram';

interface PlatformContent {
  platform: Platform;
  title: string;
  description: string;
  hashtags: string[];
  thumbnailUrl: string;
  scheduledTime: string;
  status: 'pending' | 'approved' | 'rejected' | 'edited';
}

const PLATFORM_LABELS: Record<Platform, string> = {
  youtube: 'YouTube',
  tiktok: 'TikTok',
  instagram: 'Instagram',
};

export function Review() {
  const { jobId } = useParams<{ jobId: string }>();
  const [activePlatform, setActivePlatform] = useState<Platform>('youtube');
  const [contentByPlatform, setContentByPlatform] = useState<Record<Platform, PlatformContent>>({
    youtube: {
      platform: 'youtube',
      title: '',
      description: '',
      hashtags: [],
      thumbnailUrl: '',
      scheduledTime: '',
      status: 'pending',
    },
    tiktok: {
      platform: 'tiktok',
      title: '',
      description: '',
      hashtags: [],
      thumbnailUrl: '',
      scheduledTime: '',
      status: 'pending',
    },
    instagram: {
      platform: 'instagram',
      title: '',
      description: '',
      hashtags: [],
      thumbnailUrl: '',
      scheduledTime: '',
      status: 'pending',
    },
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    const fetchContent = async () => {
      try {
        const { data, error } = await supabase
          .from('generated_content')
          .select('*')
          .eq('job_id', jobId);

        if (error) throw error;

        if (data && data.length > 0) {
          const contentMap = { ...contentByPlatform };
          data.forEach((item: any) => {
            if (item.platform in contentMap) {
              contentMap[item.platform as Platform] = {
                platform: item.platform,
                title: item.title || '',
                description: item.description || '',
                hashtags: item.hashtags || [],
                thumbnailUrl: item.thumbnail_url || '',
                scheduledTime: item.scheduled_time || '',
                status: item.status || 'pending',
              };
            }
          });
          setContentByPlatform(contentMap);
        }
      } catch (err) {
        console.error('Error fetching content:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [jobId]);

  const activeContent = contentByPlatform[activePlatform];

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleReject = async () => {
    try {
      await supabase
        .from('generated_content')
        .update({ status: 'rejected' })
        .eq('job_id', jobId)
        .eq('platform', activePlatform);

      setContentByPlatform((prev) => ({
        ...prev,
        [activePlatform]: {
          ...prev[activePlatform],
          status: 'rejected',
        },
      }));

      alert(`${PLATFORM_LABELS[activePlatform]} content rejected`);
    } catch (err) {
      console.error('Error rejecting content:', err);
      alert('Failed to reject content');
    }
  };

  const handleApprove = async () => {
    try {
      await supabase
        .from('generated_content')
        .update({ status: 'approved' })
        .eq('job_id', jobId)
        .eq('platform', activePlatform);

      setContentByPlatform((prev) => ({
        ...prev,
        [activePlatform]: {
          ...prev[activePlatform],
          status: 'approved',
        },
      }));

      alert(`${PLATFORM_LABELS[activePlatform]} content approved and scheduled!`);
    } catch (err) {
      console.error('Error approving content:', err);
      alert('Failed to approve content');
    }
  };

  const handleSaveEdit = async () => {
    try {
      await supabase
        .from('generated_content')
        .update({
          title: activeContent.title,
          description: activeContent.description,
          hashtags: activeContent.hashtags,
          status: 'edited',
        })
        .eq('job_id', jobId)
        .eq('platform', activePlatform);

      setContentByPlatform((prev) => ({
        ...prev,
        [activePlatform]: {
          ...prev[activePlatform],
          status: 'edited',
        },
      }));

      setIsEditing(false);
      alert('Changes saved');
    } catch (err) {
      console.error('Error saving edits:', err);
      alert('Failed to save changes');
    }
  };

  if (loading) {
    return (
      <Layout pageTitle="Review Content">
        <div className="flex items-center justify-center h-full">
          <div className="text-white text-xl">Loading content...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout pageTitle="Review Content">
      <div className="p-6">
        <div className="mb-6">
          <p className="text-white/55 text-sm font-mono">Job ID: {jobId}</p>
        </div>

        {/* Platform Tabs */}
        <div className="mb-6">
          <div className="border-b border-white/6">
            <nav className="-mb-px flex space-x-8">
              {(['youtube', 'tiktok', 'instagram'] as Platform[]).map((platform) => (
                <button
                  key={platform}
                  onClick={() => setActivePlatform(platform)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      activePlatform === platform
                        ? 'border-vista-blue text-vista-blue'
                        : 'border-transparent text-white/55 hover:text-white hover:border-white/30'
                    }
                  `}
                >
                  {PLATFORM_LABELS[platform]}
                  {contentByPlatform[platform].status === 'approved' && (
                    <span className="ml-2 text-vista-blue">✓</span>
                  )}
                  {contentByPlatform[platform].status === 'rejected' && (
                    <span className="ml-2 text-big-red">✕</span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Content Preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thumbnail Preview */}
            <div className="bg-dark-navy rounded-lg border border-white/6 p-6">
              <h2 className="text-sm font-mono uppercase tracking-mono-label text-muted-slate mb-4">Thumbnail Preview</h2>
              <div className="aspect-video bg-deep-navy rounded-lg flex items-center justify-center overflow-hidden border border-white/6">
                {activeContent.thumbnailUrl ? (
                  <img
                    src={activeContent.thumbnailUrl}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white/45">No thumbnail available</span>
                )}
              </div>
            </div>

            {/* Title and Description */}
            <div className="bg-dark-navy rounded-lg border border-white/6 p-6">
              <h2 className="text-sm font-mono uppercase tracking-mono-label text-muted-slate mb-4">Content</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-mono uppercase tracking-mono-label text-muted-slate mb-2">Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={activeContent.title}
                      onChange={(e) =>
                        setContentByPlatform((prev) => ({
                          ...prev,
                          [activePlatform]: {
                            ...prev[activePlatform],
                            title: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 bg-deep-navy border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-vista-blue focus:border-transparent"
                    />
                  ) : (
                    <p className="text-white">{activeContent.title || 'No title generated'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-mono uppercase tracking-mono-label text-muted-slate mb-2">Description</label>
                  {isEditing ? (
                    <textarea
                      value={activeContent.description}
                      onChange={(e) =>
                        setContentByPlatform((prev) => ({
                          ...prev,
                          [activePlatform]: {
                            ...prev[activePlatform],
                            description: e.target.value,
                          },
                        }))
                      }
                      rows={6}
                      className="w-full px-3 py-2 bg-deep-navy border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-vista-blue focus:border-transparent"
                    />
                  ) : (
                    <p className="text-white whitespace-pre-wrap">
                      {activeContent.description || 'No description generated'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-mono uppercase tracking-mono-label text-muted-slate mb-2">Hashtags</label>
                  <div className="flex flex-wrap gap-2">
                    {activeContent.hashtags.length > 0 ? (
                      activeContent.hashtags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-vista-blue/20 text-vista-blue rounded-full text-sm"
                        >
                          #{tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-white/45">No hashtags generated</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Disclosure */}
            <div className="bg-vista-blue/10 border border-vista-blue/20 rounded-lg p-4 flex items-start gap-3">
              <svg
                className="w-5 h-5 text-vista-blue mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <div>
                <p className="text-sm text-white font-medium">AI-Generated Content</p>
                <p className="text-sm text-white/70 mt-1">
                  This content was generated by AI. Please review carefully before approving.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Actions Panel */}
          <div className="lg:col-span-1">
            <div className="bg-dark-navy rounded-lg border border-white/6 p-6 sticky top-8">
              <h2 className="text-sm font-mono uppercase tracking-mono-label text-muted-slate mb-4">Schedule & Actions</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-mono uppercase tracking-mono-label text-muted-slate mb-2">
                    Scheduled Time
                  </label>
                  <div className="px-3 py-2 bg-vista-blue/20 text-vista-blue rounded-lg text-sm">
                    {activeContent.scheduledTime
                      ? new Date(activeContent.scheduledTime).toLocaleString()
                      : 'Not scheduled'}
                  </div>
                </div>

                <div className="border-t border-white/6 pt-4 space-y-3">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSaveEdit}
                        className="w-full px-4 py-3 bg-vista-blue text-white rounded-lg font-medium hover:bg-vista-blue/90 transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="w-full px-4 py-3 border border-white/20 text-white rounded-lg font-medium hover:bg-white/5 transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleApprove}
                        className="w-full px-4 py-3 bg-big-red text-white rounded-lg font-medium hover:bg-big-red/90 transition-colors shadow-sm"
                        disabled={activeContent.status === 'approved'}
                      >
                        {activeContent.status === 'approved' ? 'Approved ✓' : 'Approve & Schedule'}
                      </button>
                      <button
                        onClick={handleEdit}
                        className="w-full px-4 py-3 border-2 border-white/20 text-white rounded-lg font-medium hover:bg-white/5 transition-colors"
                      >
                        Edit Content
                      </button>
                      <button
                        onClick={handleReject}
                        className="w-full px-4 py-3 border-2 border-white/20 text-white rounded-lg font-medium hover:bg-white/5 transition-colors"
                        disabled={activeContent.status === 'rejected'}
                      >
                        {activeContent.status === 'rejected' ? 'Rejected ✕' : 'Reject'}
                      </button>
                    </>
                  )}
                </div>

                <div className="border-t border-white/6 pt-4">
                  <p className="text-xs text-white/55">
                    Status:{' '}
                    <span className="font-medium capitalize">
                      {activeContent.status.replace('_', ' ')}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
