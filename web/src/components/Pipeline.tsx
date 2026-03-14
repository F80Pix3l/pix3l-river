import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Layout } from './Layout';

interface Agent {
  id: number;
  name: string;
  description: string;
}

interface AgentStatus {
  agentId: number;
  status: 'pending' | 'running' | 'done';
  progress: number;
  log: string[];
}

const AGENTS: Agent[] = [
  { id: 1, name: 'Transcription', description: 'Converts video audio to text using AI transcription' },
  { id: 2, name: 'Copywriting', description: 'Generates engaging captions and descriptions for each clip' },
  { id: 3, name: 'Brand Voice', description: 'Ensures content matches your brand tone and messaging' },
  { id: 4, name: 'Clip Selection', description: 'Identifies the best moments for short-form content' },
  { id: 5, name: 'Thumbnail', description: 'Creates eye-catching thumbnails for maximum engagement' },
  { id: 6, name: 'Scheduling', description: 'Determines optimal posting times across platforms' },
  { id: 7, name: 'Publishing', description: 'Distributes content to YouTube, TikTok, and Instagram' },
  { id: 8, name: 'Feedback', description: 'Analyzes performance and provides optimization insights' },
];

export function Pipeline() {
  const { jobId } = useParams<{ jobId: string }>();
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;

    // Initialize agent statuses
    const initialStatuses: AgentStatus[] = AGENTS.map((agent) => ({
      agentId: agent.id,
      status: 'pending',
      progress: 0,
      log: [],
    }));
    setAgentStatuses(initialStatuses);

    // Fetch job status from Supabase
    const fetchJobStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('pipeline_status')
          .select('*')
          .eq('job_id', jobId);

        if (error) throw error;

        if (data && data.length > 0) {
          const updatedStatuses = initialStatuses.map((status) => {
            const agentData = data.find((d: any) => d.agent_id === status.agentId);
            if (agentData) {
              return {
                ...status,
                status: agentData.status,
                progress: agentData.progress || 0,
                log: agentData.log || [],
              };
            }
            return status;
          });
          setAgentStatuses(updatedStatuses);

          // Set active agent to the first running or pending agent
          const runningAgent = updatedStatuses.find((s) => s.status === 'running');
          if (runningAgent) {
            setActiveAgentId(runningAgent.agentId);
          }
        }
      } catch (err) {
        console.error('Error fetching pipeline status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobStatus();

    // Poll for updates every 2 seconds
    const interval = setInterval(fetchJobStatus, 2000);

    return () => clearInterval(interval);
  }, [jobId]);

  const getStatusBadge = (status: AgentStatus['status']) => {
    switch (status) {
      case 'done':
        return <span className="px-2 py-1 text-xs font-medium rounded bg-vista-blue/20 text-vista-blue">Done</span>;
      case 'running':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded bg-big-red/20 text-big-red flex items-center gap-1">
            <span className="animate-pulse">●</span> Running
          </span>
        );
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium rounded bg-muted-slate/20 text-muted-slate">Pending</span>;
    }
  };

  const activeAgent = AGENTS.find((a) => a.id === activeAgentId);
  const activeStatus = agentStatuses.find((s) => s.agentId === activeAgentId);

  if (loading) {
    return (
      <Layout pageTitle="Pipeline Status">
        <div className="flex items-center justify-center h-full">
          <div className="text-white text-xl">Loading pipeline status...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout pageTitle="Pipeline Status">
      <div className="p-6">
        <div className="mb-6">
          <p className="text-white/55 text-sm font-mono">Job ID: {jobId}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Agent List */}
          <div className="lg:col-span-1">
            <div className="bg-dark-navy rounded-lg border border-white/6 overflow-hidden">
              <div className="p-4 border-b border-white/6">
                <h2 className="font-semibold text-white">AI Agents</h2>
              </div>
              <ul className="divide-y divide-white/6">
                {AGENTS.map((agent) => {
                  const status = agentStatuses.find((s) => s.agentId === agent.id);
                  const isRunning = status?.status === 'running';
                  const isActive = activeAgentId === agent.id;

                  return (
                    <li
                      key={agent.id}
                      onClick={() => setActiveAgentId(agent.id)}
                      className={`p-4 cursor-pointer transition-all ${
                        isActive ? 'bg-vista-blue/10' : 'hover:bg-white/5'
                      } ${isRunning ? 'border-l-4 border-big-red bg-big-red/5' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                              isRunning
                                ? 'bg-big-red/20 text-big-red'
                                : status?.status === 'done'
                                ? 'bg-vista-blue/20 text-vista-blue'
                                : 'bg-muted-slate/20 text-muted-slate'
                            }`}
                          >
                            {agent.id}
                          </div>
                          <div>
                            <div className="font-medium text-white">{agent.name}</div>
                          </div>
                        </div>
                        {status && getStatusBadge(status.status)}
                      </div>
                      {isRunning && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="w-2 h-2 bg-big-red rounded-full animate-pulse" />
                          <span className="text-xs text-big-red">Processing...</span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Right Panel: Agent Detail */}
          <div className="lg:col-span-2">
            <div className="bg-dark-navy rounded-lg border border-white/6 p-6">
              {activeAgent && (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">{activeAgent.name}</h2>
                    <p className="text-white/55">{activeAgent.description}</p>
                  </div>

                  {activeStatus && (
                    <>
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white/70">Progress</span>
                          <span className="text-sm font-medium text-white/70">{activeStatus.progress}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-vista-blue h-full rounded-full transition-all duration-500"
                            style={{ width: `${activeStatus.progress}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Activity Log</h3>
                        {activeStatus.log.length > 0 ? (
                          <div className="bg-deep-navy rounded-lg p-4 max-h-96 overflow-y-auto border border-white/6">
                            <ul className="space-y-2">
                              {activeStatus.log.map((entry, index) => (
                                <li key={index} className="text-sm text-white/70 font-mono">
                                  {entry}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <div className="bg-deep-navy rounded-lg p-4 text-center border border-white/6">
                            <p className="text-white/45 text-sm">No activity yet</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
