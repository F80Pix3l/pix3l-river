import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Layout } from './Layout';
import { GlowCard } from './GlowCard';

interface AgentStatus {
  agentId: number;
  status: 'pending' | 'running' | 'done' | 'failed';
  progress: number;
  log: string[];
  errorMessage?: string;
}

const AGENTS = [
  { id: 1, name: 'Transcription', description: 'Converts audio to text using Whisper AI' },
  { id: 2, name: 'Copywriting', description: 'Generates platform-specific captions and descriptions' },
  { id: 3, name: 'Brand Voice', description: 'Aligns content with your brand tone' },
  { id: 4, name: 'Clip Selection', description: 'Identifies top moments for short-form content' },
  { id: 5, name: 'Thumbnail', description: 'Creates thumbnails for maximum engagement' },
  { id: 6, name: 'Scheduling', description: 'Determines optimal posting times' },
  { id: 7, name: 'Publishing', description: 'Distributes to YouTube, TikTok, and Instagram' },
  { id: 8, name: 'Feedback', description: 'Analyzes performance and optimizes future content' },
];

export function Pipeline() {
  const { jobId } = useParams<{ jobId: string }>();
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    const initial: AgentStatus[] = AGENTS.map((a) => ({
      agentId: a.id, status: 'pending', progress: 0, log: [],
    }));
    setAgentStatuses(initial);

    const fetchStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('pipeline_status')
          .select('*')
          .eq('job_id', jobId);
        if (error) throw error;

        if (data && data.length > 0) {
          const updated = initial.map((s) => {
            const d = data.find((x: any) => x.agent_id === s.agentId);
            if (!d) return s;

            // Normalize log: handle object { error: message } or array of strings
            let log: string[] = [];
            let errorMessage: string | undefined;
            if (Array.isArray(d.log)) {
              log = d.log;
            } else if (d.log && typeof d.log === 'object' && 'error' in d.log) {
              errorMessage = String(d.log.error);
              log = [errorMessage];
            }

            // Detect stale running jobs (no completion after 10 minutes)
            const STALE_TIMEOUT_MS = 10 * 60 * 1000;
            const isStale = d.status === 'running' && d.started_at &&
              Date.now() - new Date(d.started_at).getTime() > STALE_TIMEOUT_MS;

            if (isStale && !errorMessage) {
              errorMessage = 'Worker timed out after 10 minutes. The job may have crashed.';
              log = [errorMessage];
            }

            // Treat 'done' with progress=0 and error as 'failed' (legacy workers)
            const status = isStale || d.status === 'failed' || (d.status === 'done' && d.progress === 0 && errorMessage)
              ? 'failed'
              : d.status;

            return { ...s, status, progress: d.progress || 0, log, errorMessage };
          });
          setAgentStatuses(updated);

          const running = updated.find((s) => s.status === 'running');
          if (running) setActiveAgentId(running.agentId);
          else {
            const failed = updated.find((s) => s.status === 'failed');
            if (failed) setActiveAgentId(failed.agentId);
          }

          const doneCount = updated.filter((s) => s.status === 'done').length;
          setAllDone(doneCount >= 2);
        }
      } catch (err) {
        console.error('Error fetching pipeline status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [jobId]);

  const activeAgent = AGENTS.find((a) => a.id === activeAgentId);
  const activeStatus = agentStatuses.find((s) => s.agentId === activeAgentId);

  const completedCount = agentStatuses.filter((s) => s.status === 'done').length;
  const runningAgent = agentStatuses.find((s) => s.status === 'running');
  const failedAgent = agentStatuses.find((s) => s.status === 'failed');

  if (loading) {
    return (
      <Layout pageTitle="Pipeline">
        <div className="flex items-center justify-center h-64 gap-3 text-white/40 text-sm">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading pipeline...
        </div>
      </Layout>
    );
  }

  return (
    <Layout pageTitle="Pipeline">
      <div className="p-8 max-w-5xl">
        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p
              className="text-white/35 text-xs uppercase mb-1"
              style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.10em' }}
            >
              Job ID
            </p>
            <p className="text-white/55 text-sm font-mono">{jobId}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p
                className="text-white/35 text-xs uppercase mb-1"
                style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.10em' }}
              >
                Progress
              </p>
              <p className="text-white font-space font-bold text-lg">
                {completedCount}<span className="text-white/35 font-normal text-sm"> / {AGENTS.length}</span>
              </p>
            </div>
            {allDone && (
              <Link
                to={`/review/${jobId}`}
                className="px-4 py-2 text-sm font-space font-semibold text-white rounded-lg transition-all duration-200"
                style={{ background: '#FF1635', boxShadow: '0 4px 16px rgba(255,22,53,0.3)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#e01030')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#FF1635')}
              >
                Review Content →
              </Link>
            )}
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="mb-8">
          <div className="w-full h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-1 rounded-full transition-all duration-500"
              style={{
                width: `${(completedCount / AGENTS.length) * 100}%`,
                background: 'linear-gradient(90deg, #FF1635, #A100FF)',
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent list */}
          <div className="lg:col-span-1">
            <GlowCard>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <p
                  className="text-white/40 text-xs uppercase"
                  style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.10em' }}
                >
                  Agents
                </p>
              </div>
              <ul className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {AGENTS.map((agent) => {
                  const status = agentStatuses.find((s) => s.agentId === agent.id);
                  const isActive = activeAgentId === agent.id;
                  const isRunning = status?.status === 'running';
                  const isDone = status?.status === 'done';
                  const isFailed = status?.status === 'failed';

                  return (
                    <li
                      key={agent.id}
                      onClick={() => setActiveAgentId(agent.id)}
                      className="px-4 py-3 cursor-pointer transition-all duration-150 flex items-center gap-3"
                      style={{
                        background: isActive
                          ? isFailed ? 'rgba(255,22,53,0.08)' : 'rgba(255,22,53,0.06)'
                          : 'transparent',
                        borderLeft: isActive ? '2px solid #FF1635' : '2px solid transparent',
                      }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {/* Status indicator */}
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold font-space"
                        style={{
                          background: isDone
                            ? 'rgba(133,153,255,0.12)'
                            : isRunning
                            ? 'rgba(255,22,53,0.15)'
                            : isFailed
                            ? 'rgba(255,22,53,0.20)'
                            : 'rgba(255,255,255,0.04)',
                          color: isDone ? '#8599FF' : isRunning ? '#FF1635' : isFailed ? '#FF1635' : 'rgba(255,255,255,0.25)',
                        }}
                      >
                        {isDone ? '✓' : isRunning ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-big-red" style={{ animation: 'pulse 1s infinite' }} />
                        ) : isFailed ? '✕' : agent.id}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: isDone ? 'rgba(255,255,255,0.7)' : isRunning ? '#fff' : isFailed ? '#FF1635' : 'rgba(255,255,255,0.40)', fontFamily: '"Inter", sans-serif' }}
                        >
                          {agent.name}
                        </p>
                      </div>

                      {isRunning && (
                        <div
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(255,22,53,0.15)', color: '#FF1635', fontFamily: '"JetBrains Mono", monospace', fontSize: '10px' }}
                        >
                          LIVE
                        </div>
                      )}
                      {isFailed && (
                        <div
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(255,22,53,0.15)', color: '#FF1635', fontFamily: '"JetBrains Mono", monospace', fontSize: '10px' }}
                        >
                          ERR
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </GlowCard>
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-2">
            <GlowCard className="h-full" innerClassName="p-6 h-full">
              {activeAgent && (
                <>
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-space font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
                        {activeAgent.name}
                      </h2>
                      {activeStatus?.status === 'running' && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,22,53,0.15)', color: '#FF1635', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.08em' }}
                        >
                          RUNNING
                        </span>
                      )}
                      {activeStatus?.status === 'done' && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(133,153,255,0.12)', color: '#8599FF', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.08em' }}
                        >
                          DONE
                        </span>
                      )}
                      {activeStatus?.status === 'failed' && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,22,53,0.15)', color: '#FF1635', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.08em' }}
                        >
                          FAILED
                        </span>
                      )}
                    </div>
                    <p className="text-white/45 text-sm">{activeAgent.description}</p>
                  </div>

                  {activeStatus && (
                    <>
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-white/40" style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.08em' }}>
                            PROGRESS
                          </span>
                          <span className="text-xs text-white/60 font-mono">{activeStatus.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div
                            className="h-1.5 rounded-full transition-all duration-500"
                            style={{
                              width: `${activeStatus.progress}%`,
                              background: activeStatus.status === 'done'
                                ? 'linear-gradient(90deg, #8599FF, #A100FF)'
                                : 'linear-gradient(90deg, #FF1635, #FF1673)',
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <p
                          className="text-white/40 text-xs uppercase mb-3"
                          style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.10em' }}
                        >
                          Activity Log
                        </p>
                        {activeStatus.status === 'failed' && activeStatus.errorMessage ? (
                          <div
                            className="rounded-lg p-4"
                            style={{ background: 'rgba(255,22,53,0.06)', border: '1px solid rgba(255,22,53,0.2)' }}
                          >
                            <p className="text-xs text-big-red font-mono leading-relaxed">{activeStatus.errorMessage}</p>
                          </div>
                        ) : activeStatus.log.length > 0 ? (
                          <div
                            className="rounded-lg p-4 max-h-80 overflow-y-auto"
                            style={{ background: 'rgba(0,6,35,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}
                          >
                            <ul className="space-y-1.5">
                              {activeStatus.log.map((entry: string, i: number) => (
                                <li key={i} className="text-xs text-white/60 font-mono">{entry}</li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <div
                            className="rounded-lg p-6 text-center"
                            style={{ background: 'rgba(0,6,35,0.4)', border: '1px solid rgba(255,255,255,0.04)' }}
                          >
                            <p className="text-white/25 text-sm">
                              {activeStatus.status === 'pending' ? 'Waiting to start...' : 'No activity yet'}
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </GlowCard>
          </div>
        </div>

        {/* Running agent callout */}
        {runningAgent && (
          <div
            className="mt-6 px-5 py-4 rounded-card flex items-center gap-4"
            style={{
              background: 'rgba(255,22,53,0.06)',
              border: '1px solid rgba(255,22,53,0.15)',
            }}
          >
            <div className="w-2 h-2 rounded-full bg-big-red flex-shrink-0" style={{ animation: 'pulse 1s infinite' }} />
            <p className="text-sm text-white/70">
              <span className="text-white font-semibold">
                {AGENTS.find((a) => a.id === runningAgent.agentId)?.name}
              </span>{' '}
              is running
            </p>
          </div>
        )}

        {/* Failed agent callout */}
        {failedAgent && !runningAgent && (
          <div
            className="mt-6 px-5 py-4 rounded-card flex items-center gap-4"
            style={{
              background: 'rgba(255,22,53,0.06)',
              border: '1px solid rgba(255,22,53,0.25)',
            }}
          >
            <svg className="w-4 h-4 text-big-red flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-white/70">
              <span className="text-big-red font-semibold">
                {AGENTS.find((a) => a.id === failedAgent.agentId)?.name}
              </span>{' '}
              failed.{' '}
              {failedAgent.errorMessage && (
                <span className="text-white/45">{failedAgent.errorMessage}</span>
              )}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
