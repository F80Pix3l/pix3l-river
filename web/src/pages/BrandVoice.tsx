import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';

interface BrandVoiceProfile {
  tone: string;
  writing_rules: string;
  example_content: string;
  avoid_phrases: string;
}

const empty: BrandVoiceProfile = {
  tone: '',
  writing_rules: '',
  example_content: '',
  avoid_phrases: '',
};

export function BrandVoice() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<BrandVoiceProfile>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('brand_voice_profiles')
          .select('tone, writing_rules, example_content, avoid_phrases')
          .eq('user_id', user.id)
          .single();

        if (data) {
          setProfile({
            tone: data.tone ?? '',
            writing_rules: data.writing_rules ?? '',
            example_content: data.example_content ?? '',
            avoid_phrases: (data.avoid_phrases ?? []).join(', '),
          });
        }
      } catch {
        // no profile yet — empty form is fine
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const avoidArray = profile.avoid_phrases
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const { error } = await supabase
        .from('brand_voice_profiles')
        .upsert(
          {
            user_id: user.id,
            tone: profile.tone || null,
            writing_rules: profile.writing_rules || null,
            example_content: profile.example_content || null,
            avoid_phrases: avoidArray,
          },
          { onConflict: 'user_id' }
        );

      if (error) throw error;
      showToast('Brand voice saved.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    background: 'rgba(0,6,35,0.8)',
    border: '1px solid rgba(255,255,255,0.10)',
    fontFamily: '"Inter", sans-serif',
  };

  const labelStyle = {
    fontFamily: '"JetBrains Mono", monospace',
    letterSpacing: '0.10em',
  };

  if (loading) {
    return (
      <Layout pageTitle="Brand Voice">
        <div className="flex items-center justify-center h-64 gap-3 text-white/40 text-sm">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading profile...
        </div>
      </Layout>
    );
  }

  return (
    <Layout pageTitle="Brand Voice">
      {toast && (
        <div
          className="fixed top-5 right-5 z-50 px-5 py-3 rounded-lg text-sm font-medium shadow-xl"
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

      <div className="p-8 max-w-2xl">
        <p className="text-white/55 text-sm mb-8 leading-relaxed">
          Define your brand voice once. RIVER uses it to rewrite all generated content to sound like you.
        </p>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Tone */}
          <div>
            <label className="block text-xs text-white/50 mb-2 uppercase" style={labelStyle}>
              Tone
            </label>
            <input
              type="text"
              value={profile.tone}
              onChange={(e) => setProfile((p) => ({ ...p, tone: e.target.value }))}
              placeholder="e.g. Bold, direct, and educational. Never salesy."
              className="w-full px-4 py-3 rounded-lg text-white text-sm placeholder-white/20 focus:outline-none transition-[border-color] duration-200"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,22,115,0.55)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)')}
            />
            <p className="mt-1.5 text-xs text-white/30" style={labelStyle}>
              Describe the feeling and personality of your content in a sentence.
            </p>
          </div>

          {/* Writing Rules */}
          <div>
            <label className="block text-xs text-white/50 mb-2 uppercase" style={labelStyle}>
              Writing Rules
            </label>
            <textarea
              value={profile.writing_rules}
              onChange={(e) => setProfile((p) => ({ ...p, writing_rules: e.target.value }))}
              placeholder={'e.g.\nAlways open with a question.\nUse short, punchy sentences.\nNever use exclamation marks.\nSpeak to the reader as "you".'}
              rows={5}
              className="w-full px-4 py-3 rounded-lg text-white text-sm placeholder-white/20 focus:outline-none transition-[border-color] duration-200 resize-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,22,115,0.55)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)')}
            />
            <p className="mt-1.5 text-xs text-white/30" style={labelStyle}>
              One rule per line. Be specific.
            </p>
          </div>

          {/* Example Content */}
          <div>
            <label className="block text-xs text-white/50 mb-2 uppercase" style={labelStyle}>
              Example Writing
            </label>
            <textarea
              value={profile.example_content}
              onChange={(e) => setProfile((p) => ({ ...p, example_content: e.target.value }))}
              placeholder="Paste a sample caption, post, or script that represents your voice at its best."
              rows={6}
              className="w-full px-4 py-3 rounded-lg text-white text-sm placeholder-white/20 focus:outline-none transition-[border-color] duration-200 resize-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,22,115,0.55)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)')}
            />
            <p className="mt-1.5 text-xs text-white/30" style={labelStyle}>
              RIVER uses this as a style reference. The closer this is to your best work, the better.
            </p>
          </div>

          {/* Avoid Phrases */}
          <div>
            <label className="block text-xs text-white/50 mb-2 uppercase" style={labelStyle}>
              Words to Avoid
            </label>
            <input
              type="text"
              value={profile.avoid_phrases}
              onChange={(e) => setProfile((p) => ({ ...p, avoid_phrases: e.target.value }))}
              placeholder="e.g. game-changer, synergy, leverage, epic"
              className="w-full px-4 py-3 rounded-lg text-white text-sm placeholder-white/20 focus:outline-none transition-[border-color] duration-200"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,22,115,0.55)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)')}
            />
            <p className="mt-1.5 text-xs text-white/30" style={labelStyle}>
              Comma-separated words or phrases RIVER will never write.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 text-white text-sm font-space font-semibold rounded-lg transition-[background-color,box-shadow] duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF1673] focus-visible:outline-offset-2"
            style={{
              background: '#FF1635',
              boxShadow: '0 4px 20px rgba(255,22,53,0.35)',
            }}
            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = '#e01030'; }}
            onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = '#FF1635'; }}
          >
            {saving ? 'Saving...' : 'Save Brand Voice'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
