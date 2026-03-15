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

const PLATFORMS: Platform[] = ['youtube', 'tiktok', 'instagram'];

const platformConfig: Record<Platform, { label: string; color: string; activeBorder: string }> = {
  youtube: { label: 'YouTube', color: '#FF1635', activeBorder: '#FF1635' },
  tiktok: { label: 'TikTok', color: '#8599FF', activeBorder: '#8599FF' },
  instagram: { label: 'Instagram', color: '#FF1673', activeBorder: '#FF1673' },
};

const emptyContent = (platform: Platform): PlatformContent => ({
  platform, title: '', description: '', hashtags: [], thumbnailUrl: '', scheduledTime: '', status: 'pending',
});

export function Review() {
  const { jobId } = useParams<{ jobId: string }>();
  const [activePlatform, setActivePlatform] = useState<Platform>('youtube');
  const [contentByPlatform, setContentByPlatform] = useState<Record<Platform, PlatformContent>>({
    youtube: emptyContent('youtube'),
    tiktok: emptyContent('tiktok'),
    instagram: emptyContent('instagram'),
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!jobId) return;
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase.from('generated_content').select('*').eq('job_id', jobId);
        if (error) throw error;
        if (data && data.length > 0) {
          const map = { ...contentByPlatform };
          data.forEach((item: any) => {
            if (item.platform in map) {
              map[item.platform as Platform] = {
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
          setContentByPlatform(map);
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

  const handleApprove = async () => {
    try {
      await supabase.from('generated_content').update({ status: 'approved' })
        .eq('job_id', jobId).eq('platform', activePlatform);
      setContentByPlatform((prev) => ({ ...prev, [activePlatform]: { ...prev[activePlatform], status: 'approved' } }));
      showToast(`${platformConfig[activePlatform].label} content approved.`);
    } catch {
      showToast('Failed to approve content.', 'error');
    }
  };

  const handleReject = async () => {
    try {
      await supabase.from('generated_content').update({ status: 'rejected' })
        .eq('job_id', jobId).eq('platform', activePlatform);
      setContentByPlatform((prev) => ({ ...prev, [activePlatform]: { ...prev[activePlatform], status: 'rejected' } }));
      showToast(`${platformConfig[activePlatform].label} content rejected.`);
    } catch {
      showToast('Failed to reject content.', 'error');
    }
  };

  const handleSaveEdit = async () => {
    try {
      await supabase.from('generated_content').update({
        title: activeContent.title,
        description: activeContent.description,
        hashtags: activeContent.hashtags,
        status: 'edited',
      }).eq('job_id', jobId).eq('platform', activePlatform);
      setContentByPlatform((prev) => ({ ...prev, [activePlatform]: { ...prev[activePlatform], status: 'edited' } }));
      setIsEditing(false);
      showToast('Changes saved.');
    } catch {
      showToast('Failed to save changes.', 'error');
    }
  };

  if (loading) {
    return (
      <Layout pageTitle="Review Content">
        <div className="flex items-center justify-center h-64 gap-3 text-white/40 text-sm">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading content...
        </div>
      </Layout>
    );
  }

  const inputStyle = {
    background: 'rgba(0,6,35,0.8)',
    border: '1px solid rgba(255,255,255,0.10)',
    fontFamily: '"Inter", sans-serif',
  };

  return (
    <Layout pageTitle="Review Content">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-5 right-5 z-50 px-5 py-3 rounded-lg text-sm font-medium shadow-xl transition-[opacity,transform] duration-300 motion-reduce:transition-none"
          style={{
            background: toast.type === 'success' ? 'rgba(0,9,71,0.95)' : 'rgba(255,22,53,0.15)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(133,153,255,0.3)' : 'rgba(255,22,53,0.3)'}`,
            color: toast.type === 'success' ? '#8599FF' : '#FF1635',
            backdropFilter: 'blur(12px)',
          }}
        >
          {toast.message}
        </div>
      )}

      <div className="p-8 max-w-5xl">
        {/* Job ID */}
        <p
          className="text-white/30 text-xs uppercase mb-6"
          style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.10em' }}
        >
          Job · {jobId}
        </p>

        {/* Platform tabs */}
        <div className="flex gap-1 mb-8 p-1 rounded-lg w-fit" style={{ background: 'rgba(0,9,71,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {PLATFORMS.map((platform) => {
            const cfg = platformConfig[platform];
            const isActive = activePlatform === platform;
            const content = contentByPlatform[platform];
            return (
              <button
                key={platform}
                onClick={() => { setActivePlatform(platform); setIsEditing(false); }}
                className="px-4 py-2 rounded-md text-sm font-space font-semibold transition-[background-color,color,border-color] duration-200 motion-reduce:transition-none flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF1673] focus-visible:outline-offset-2"
                style={{
                  background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                  color: isActive ? cfg.color : 'rgba(255,255,255,0.40)',
                  borderBottom: isActive ? `2px solid ${cfg.activeBorder}` : '2px solid transparent',
                }}
              >
                {cfg.label}
                {content.status === 'approved' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-vista-blue inline-block" />
                )}
                {content.status === 'rejected' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-big-red inline-block" />
                )}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Content panel */}
          <div className="lg:col-span-2 space-y-5">
            {/* Thumbnail */}
            <div className="p-5" style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, background: 'rgba(0,9,71,0.3)', overflow: 'hidden' }}>
              <p
                className="text-white/35 text-xs uppercase mb-3"
                style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.10em' }}
              >
                Thumbnail
              </p>
              <div
                className="aspect-video rounded-lg flex items-center justify-center overflow-hidden"
                style={{ background: 'rgba(0,6,35,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {activeContent.thumbnailUrl ? (
                  <img src={activeContent.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <p className="text-white/25 text-sm">No thumbnail available</p>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-5" style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, background: 'rgba(0,9,71,0.3)', overflow: 'hidden' }}>
              <p
                className="text-white/35 text-xs uppercase mb-4"
                style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.10em' }}
              >
                Content
              </p>

              <div className="space-y-5">
                <div>
                  <label
                    className="block text-xs text-white/40 mb-2 uppercase"
                    style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.08em' }}
                  >
                    Title
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={activeContent.title}
                      onChange={(e) => setContentByPlatform((p) => ({ ...p, [activePlatform]: { ...p[activePlatform], title: e.target.value } }))}
                      className="w-full px-4 py-2.5 rounded-lg text-white text-sm focus:outline-none transition-colors duration-200"
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,22,115,0.5)')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)')}
                    />
                  ) : (
                    <p className="text-white text-sm leading-relaxed">{activeContent.title || <span className="text-white/25">No title generated</span>}</p>
                  )}
                </div>

                <div>
                  <label
                    className="block text-xs text-white/40 mb-2 uppercase"
                    style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.08em' }}
                  >
                    Description
                  </label>
                  {isEditing ? (
                    <textarea
                      value={activeContent.description}
                      onChange={(e) => setContentByPlatform((p) => ({ ...p, [activePlatform]: { ...p[activePlatform], description: e.target.value } }))}
                      rows={6}
                      className="w-full px-4 py-2.5 rounded-lg text-white text-sm focus:outline-none transition-colors duration-200 resize-none"
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,22,115,0.5)')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)')}
                    />
                  ) : (
                    <p className="text-white/75 text-sm whitespace-pre-wrap leading-relaxed">{activeContent.description || <span className="text-white/25">No description generated</span>}</p>
                  )}
                </div>

                <div>
                  <label
                    className="block text-xs text-white/40 mb-2 uppercase"
                    style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.08em' }}
                  >
                    Hashtags
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="text"
                        value={activeContent.hashtags.join(' ')}
                        onChange={(e) => {
                          const tags = e.target.value
                            .split(/[\s,]+/)
                            .map((t) => t.replace(/^#/, '').trim())
                            .filter((t) => t.length > 0);
                          setContentByPlatform((p) => ({ ...p, [activePlatform]: { ...p[activePlatform], hashtags: tags } }));
                        }}
                        className="w-full px-4 py-2.5 rounded-lg text-white text-sm focus:outline-none transition-colors duration-200"
                        style={inputStyle}
                        placeholder="tag1 tag2 tag3"
                        onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,22,115,0.5)')}
                        onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)')}
                      />
                      <p className="text-white/25 text-xs mt-1.5" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                        Space or comma separated, # optional
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {activeContent.hashtags.length > 0 ? (
                        activeContent.hashtags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-full text-xs"
                            style={{ background: 'rgba(133,153,255,0.10)', border: '1px solid rgba(133,153,255,0.2)', color: '#8599FF', fontFamily: '"JetBrains Mono", monospace' }}
                          >
                            #{tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-white/25 text-sm">No hashtags generated</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI Disclosure */}
            <div
              className="rounded-lg px-4 py-3 flex items-start gap-3"
              style={{ background: 'rgba(133,153,255,0.05)', border: '1px solid rgba(133,153,255,0.12)' }}
            >
              <svg className="w-4 h-4 text-vista-blue mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-white/50 leading-relaxed">
                AI-generated content. Review carefully before approving.
              </p>
            </div>
          </div>

          {/* Actions panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 p-5" style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, background: 'rgba(0,9,71,0.3)', overflow: 'visible' }}>
              <p
                className="text-white/35 text-xs uppercase mb-4"
                style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.10em' }}
              >
                Actions
              </p>

              {/* Status badge */}
              <div className="mb-5">
                <span
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium capitalize"
                  style={{
                    background: activeContent.status === 'approved'
                      ? 'rgba(255,22,115,0.1)' : activeContent.status === 'rejected'
                      ? 'rgba(255,22,53,0.1)' : activeContent.status === 'edited'
                      ? 'rgba(133,153,255,0.1)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${activeContent.status === 'approved'
                      ? 'rgba(255,22,115,0.25)' : activeContent.status === 'rejected'
                      ? 'rgba(255,22,53,0.25)' : activeContent.status === 'edited'
                      ? 'rgba(133,153,255,0.25)' : 'rgba(255,255,255,0.08)'}`,
                    color: activeContent.status === 'approved'
                      ? '#FF1673' : activeContent.status === 'rejected'
                      ? '#FF1635' : activeContent.status === 'edited'
                      ? '#8599FF' : 'rgba(255,255,255,0.35)',
                    fontFamily: '"JetBrains Mono", monospace',
                  }}
                >
                  {activeContent.status}
                </span>
              </div>

              {activeContent.scheduledTime && (
                <div className="mb-5 px-3 py-2.5 rounded-lg" style={{ background: 'rgba(133,153,255,0.06)', border: '1px solid rgba(133,153,255,0.12)' }}>
                  <p className="text-xs text-white/35 mb-1 uppercase" style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.08em' }}>Scheduled</p>
                  <p className="text-xs text-vista-blue">{new Date(activeContent.scheduledTime).toLocaleString()}</p>
                </div>
              )}

              <div className="space-y-2.5">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="w-full py-3 text-white text-sm font-space font-semibold rounded-lg transition-[background-color,box-shadow] duration-200 motion-reduce:transition-none active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF1673] focus-visible:outline-offset-2"
                      style={{ background: '#8599FF', boxShadow: '0 4px 16px rgba(133,153,255,0.25)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#7080f0'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(133,153,255,0.35)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#8599FF'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(133,153,255,0.25)'; }}
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="w-full py-3 text-sm font-space font-medium rounded-lg transition-[color,background-color,border-color] duration-200 motion-reduce:transition-none active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF1673] focus-visible:outline-offset-2"
                      style={{ color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.10)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleApprove}
                      disabled={activeContent.status === 'approved'}
                      className="w-full py-3 text-white text-sm font-space font-semibold rounded-lg transition-[background-color,box-shadow] duration-200 motion-reduce:transition-none active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF1673] focus-visible:outline-offset-2"
                      style={{ background: '#FF1635', boxShadow: '0 4px 16px rgba(255,22,53,0.3)' }}
                      onMouseEnter={(e) => { if (activeContent.status !== 'approved') { e.currentTarget.style.background = '#e01030'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,22,53,0.45)'; } }}
                      onMouseLeave={(e) => { if (activeContent.status !== 'approved') { e.currentTarget.style.background = '#FF1635'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,22,53,0.3)'; } }}
                    >
                      {activeContent.status === 'approved' ? 'Approved ✓' : 'Approve'}
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full py-3 text-sm font-space font-semibold rounded-lg transition-[color,background-color,border-color] duration-200 motion-reduce:transition-none active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF1673] focus-visible:outline-offset-2"
                      style={{ color: 'rgba(255,255,255,0.70)', border: '1px solid rgba(255,255,255,0.12)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.70)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                    >
                      Edit Content
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={activeContent.status === 'rejected'}
                      className="w-full py-3 text-sm font-space font-medium rounded-lg transition-[color,background-color,border-color] duration-200 motion-reduce:transition-none active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF1673] focus-visible:outline-offset-2"
                      style={{ color: 'rgba(255,22,53,0.7)', border: '1px solid rgba(255,22,53,0.15)' }}
                      onMouseEnter={(e) => { if (activeContent.status !== 'rejected') { e.currentTarget.style.color = '#FF1635'; e.currentTarget.style.background = 'rgba(255,22,53,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,22,53,0.3)'; } }}
                      onMouseLeave={(e) => { if (activeContent.status !== 'rejected') { e.currentTarget.style.color = 'rgba(255,22,53,0.7)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,22,53,0.15)'; } }}
                    >
                      {activeContent.status === 'rejected' ? 'Rejected ✕' : 'Reject'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
