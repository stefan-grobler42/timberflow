import { useEffect, useMemo, useState } from 'react';
import { MessageBar, MessageBarType, Spinner } from '@fluentui/react';
import { jigService } from '../services/millenniumServices';
import type { Jig } from '../types/millennium';
import {
  jobTimeTrackingService,
  type JobStageSummaryDto,
  type JobStageType,
  type MobileJobDto
} from '../services/jobTimeTrackingService';
import { JobStopwatch, formatDurationMinutesAsTime } from '../components/Mobile/JobStopwatch';
import { JobStageTimer } from '../components/Mobile/JobStageTimer';

const SELECTED_TEAM_KEY = 'mobileJobTime.selectedTeamId';

const STAGES: Array<{ type: JobStageType; label: string }> = [
  { type: 'picking', label: 'Picking' },
  { type: 'sawing', label: 'Sawing' },
  { type: 'production', label: 'Production' }
];

const formatMinutes = (minutes?: number | null): string => {
  if (minutes == null) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const formatDuration = (minutes?: number | null): string => {
  if (minutes == null) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

const formatDateTime = (value?: string | null): string => {
  if (!value) return '-';
  return new Date(value).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
};

const getErrorMessage = (error: unknown): string => {
  if (!(error instanceof Error)) return 'Something went wrong';

  try {
    const parsed = JSON.parse(error.message);
    return parsed.message || error.message;
  } catch {
    return error.message;
  }
};

const statusLabel = (status: string): string => {
  switch (status) {
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    default:
      return 'Not Started';
  }
};

const getStageSummary = (job: MobileJobDto, stageType: JobStageType): JobStageSummaryDto => (
  job.stages?.find(stage => stage.stageType === stageType) ?? {
    stageType,
    status: 'not_started',
    totalDurationMinutes: 0,
    activeEntry: null,
    latestEntry: null
  }
);

export const MobileJobTimePage = () => {
  const [teams, setTeams] = useState<Jig[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState(() => localStorage.getItem(SELECTED_TEAM_KEY) || '');
  const [jobs, setJobs] = useState<MobileJobDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingJobId, setSavingJobId] = useState<string | null>(null);
  const [savingStageKey, setSavingStageKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [continueJob, setContinueJob] = useState<MobileJobDto | null>(null);
  const [continueStage, setContinueStage] = useState<{
    job: MobileJobDto;
    stageType: JobStageType;
    stageLabel: string;
    totalDurationMinutes: number;
  } | null>(null);
  const [continueReason, setContinueReason] = useState('');

  const selectedTeam = useMemo(
    () => teams.find(team => team.id === selectedTeamId),
    [teams, selectedTeamId]
  );

  const loadTeams = async () => {
    const allTeams = await jigService.getAll();
    setTeams(allTeams);

    if (!selectedTeamId && allTeams.length > 0) {
      setSelectedTeamId(allTeams[0].id);
      localStorage.setItem(SELECTED_TEAM_KEY, allTeams[0].id);
    }
  };

  const loadJobs = async (teamId = selectedTeamId) => {
    if (!teamId) {
      setJobs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const todayJobs = await jobTimeTrackingService.getTodayJobs(teamId);
      if (import.meta.env.DEV) {
        todayJobs
          .filter(job => (job.jobNumber || '').includes('TEST-J260013'))
          .forEach(job => {
            console.info('[JOB_TIME_DEBUG] mobile summary', {
              allocationId: job.jobId,
              jobId: job.productionId,
              mobileSummary: job.timingSummary ?? {
                status: job.status,
                actualDurationMinutes: job.actualDurationMinutes,
                activeEntry: job.activeEntry,
                latestEntry: job.latestEntry,
                stages: job.stages
              }
            });
          });
      }
      setJobs(todayJobs);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams().catch(err => {
      setError(getErrorMessage(err));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      loadJobs(selectedTeamId);
    }
  }, [selectedTeamId]);

  const handleTeamChange = (teamId: string) => {
    setSelectedTeamId(teamId);
    localStorage.setItem(SELECTED_TEAM_KEY, teamId);
  };

  const updateJob = (updatedJob: MobileJobDto) => {
    setJobs(current => current.map(job => job.jobId === updatedJob.jobId ? updatedJob : job));
  };

  const handleStart = async (jobId: string) => {
    setSavingJobId(jobId);
    setError(null);
    try {
      updateJob(await jobTimeTrackingService.startJob(jobId));
    } catch (err) {
      setError(getErrorMessage(err));
      await loadJobs();
    } finally {
      setSavingJobId(null);
    }
  };

  const handleEnd = async (jobId: string) => {
    setSavingJobId(jobId);
    setError(null);
    try {
      updateJob(await jobTimeTrackingService.endJob(jobId));
    } catch (err) {
      setError(getErrorMessage(err));
      await loadJobs();
    } finally {
      setSavingJobId(null);
    }
  };

  const handleStageStart = async (jobId: string, stageType: JobStageType) => {
    const stageKey = `${jobId}:${stageType}`;
    setSavingStageKey(stageKey);
    setError(null);
    try {
      updateJob(await jobTimeTrackingService.startStage(jobId, stageType));
    } catch (err) {
      setError(getErrorMessage(err));
      await loadJobs();
    } finally {
      setSavingStageKey(null);
    }
  };

  const handleStageStop = async (jobId: string, stageType: JobStageType) => {
    const stageKey = `${jobId}:${stageType}`;
    setSavingStageKey(stageKey);
    setError(null);
    try {
      updateJob(await jobTimeTrackingService.stopStage(jobId, stageType));
    } catch (err) {
      setError(getErrorMessage(err));
      await loadJobs();
    } finally {
      setSavingStageKey(null);
    }
  };

  const openStageContinueDialog = (
    job: MobileJobDto,
    stageType: JobStageType,
    stageLabel: string,
    summary: JobStageSummaryDto
  ) => {
    setContinueStage({
      job,
      stageType,
      stageLabel,
      totalDurationMinutes: summary.totalDurationMinutes
    });
  };

  const closeStageContinueDialog = () => {
    if (continueStage && savingStageKey === `${continueStage.job.jobId}:${continueStage.stageType}`) return;
    setContinueStage(null);
  };

  const handleConfirmStageContinue = async () => {
    if (!continueStage) return;

    const stageKey = `${continueStage.job.jobId}:${continueStage.stageType}`;
    if (savingStageKey === stageKey) return;

    setSavingStageKey(stageKey);
    setError(null);
    try {
      updateJob(await jobTimeTrackingService.startStage(continueStage.job.jobId, continueStage.stageType));
      setContinueStage(null);
    } catch (err) {
      setError(getErrorMessage(err));
      await loadJobs();
    } finally {
      setSavingStageKey(null);
    }
  };

  const openContinueDialog = (job: MobileJobDto) => {
    setContinueJob(job);
    setContinueReason('');
  };

  const closeContinueDialog = () => {
    if (savingJobId) return;
    setContinueJob(null);
    setContinueReason('');
  };

  const handleConfirmContinue = async () => {
    if (!continueJob || savingJobId) return;

    setSavingJobId(continueJob.jobId);
    setError(null);
    try {
      const reason = continueReason.trim();
      updateJob(await jobTimeTrackingService.startJob(continueJob.jobId, reason || undefined));
      setContinueJob(null);
      setContinueReason('');
    } catch (err) {
      setError(getErrorMessage(err));
      await loadJobs();
    } finally {
      setSavingJobId(null);
    }
  };

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#f7f8fa',
      color: '#1f2933',
      fontFamily: '"Segoe UI", system-ui, sans-serif'
    }}>
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #d6dbe1',
        padding: '14px 16px'
      }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Job Time</div>
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <select
            value={selectedTeamId}
            onChange={(event) => handleTeamChange(event.target.value)}
            style={{
              flex: 1,
              minHeight: 44,
              border: '1px solid #c8cfd8',
              borderRadius: 6,
              padding: '0 10px',
              fontSize: 16,
              backgroundColor: '#fff'
            }}
            aria-label="Team"
          >
            <option value="">Select team</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => loadJobs()}
            style={{
              minHeight: 44,
              padding: '0 14px',
              borderRadius: 6,
              border: '1px solid #0078d4',
              backgroundColor: '#ffffff',
              color: '#005a9e',
              fontWeight: 700
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 720, margin: '0 auto' }}>
        {error && (
          <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)} styles={{ root: { marginBottom: 12 } }}>
            {error}
          </MessageBar>
        )}

        {selectedTeam && (
          <div style={{ marginBottom: 12, color: '#52606d', fontSize: 14 }}>
            Today assigned to {selectedTeam.name}
          </div>
        )}

        {loading ? (
          <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}>
            <Spinner label="Loading jobs..." />
          </div>
        ) : jobs.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #d6dbe1',
            borderRadius: 8,
            padding: 20,
            textAlign: 'center',
            color: '#52606d'
          }}>
            No assigned jobs for today.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {jobs.map(job => {
              const isSaving = savingJobId === job.jobId;
              const isActive = job.status === 'in_progress';
              const isComplete = job.status === 'completed';
              const activeStartedAt = job.activeEntry?.startedAt;
              const isOverallActive = Boolean(job.activeEntry);
              const isOverallComplete = !isOverallActive && job.latestEntry?.status === 'completed';
              const overallStatus = isOverallActive ? 'in_progress' : isOverallComplete ? 'completed' : 'not_started';
              const finalDurationMinutes = job.actualDurationMinutes ?? job.latestEntry?.actualDurationMinutes;

              return (
                <section
                  key={job.jobId}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #d6dbe1',
                    borderLeft: `5px solid ${isComplete ? '#107c10' : isActive ? '#ffb900' : '#0078d4'}`,
                    borderRadius: 8,
                    padding: 14,
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{job.jobNumber || 'Job'}</div>
                      <div style={{ marginTop: 2, color: '#52606d' }}>{job.customerName || 'No customer/site'}</div>
                    </div>
                    <div style={{
                      alignSelf: 'start',
                      padding: '4px 8px',
                      borderRadius: 4,
                      backgroundColor: isComplete ? '#dff6dd' : isActive ? '#fff4ce' : '#eff6fc',
                      color: isComplete ? '#0b6a0b' : isActive ? '#8a6100' : '#005a9e',
                      fontSize: 12,
                      fontWeight: 700,
                      whiteSpace: 'nowrap'
                    }}>
                      {statusLabel(job.status)}
                    </div>
                  </div>

                  {job.siteAddress && (
                    <div style={{ marginTop: 8, color: '#52606d', fontSize: 14 }}>{job.siteAddress}</div>
                  )}

                  <div style={{
                    marginTop: 14,
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid #d6dbe1',
                    backgroundColor: '#f7f8fa'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#1f2933' }}>Overall Job</div>
                      <div style={{
                        padding: '3px 7px',
                        borderRadius: 4,
                        backgroundColor: isOverallComplete ? '#dff6dd' : isOverallActive ? '#fff4ce' : '#eff6fc',
                        color: isOverallComplete ? '#0b6a0b' : isOverallActive ? '#8a6100' : '#005a9e',
                        fontSize: 11,
                        fontWeight: 800,
                        whiteSpace: 'nowrap'
                      }}>
                        {statusLabel(overallStatus)}
                      </div>
                    </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: 8,
                    marginTop: 12,
                    fontSize: 13,
                    color: '#52606d'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#323f4b' }}>Planned</div>
                      {formatMinutes(job.plannedStartMinutes)} - {formatMinutes(job.plannedEndMinutes)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#323f4b' }}>Started</div>
                      {formatDateTime(activeStartedAt || job.latestEntry?.startedAt)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#323f4b' }}>Actual</div>
                      {formatDuration(finalDurationMinutes)}
                    </div>
                  </div>

                  {isOverallActive && activeStartedAt && (
                    <>
                      <JobStopwatch startedAt={activeStartedAt} />

                      {finalDurationMinutes != null && finalDurationMinutes > 0 && (
                        <div style={{
                          marginTop: 10,
                          padding: '10px 12px',
                          borderRadius: 8,
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 12
                        }}>
                          <div style={{ color: '#52606d', fontSize: 13, fontWeight: 700 }}>
                            Total so far
                          </div>
                          <div style={{
                            color: '#1f2933',
                            fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
                            fontSize: 18,
                            fontWeight: 800,
                            letterSpacing: 0
                          }}>
                            {formatDurationMinutesAsTime(finalDurationMinutes)}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {isOverallComplete && (
                    <div style={{
                      marginTop: 14,
                      padding: '12px 14px',
                      borderRadius: 8,
                      backgroundColor: '#f1f8f1',
                      border: '1px solid #b7dfb8'
                    }}>
                      <div style={{
                        color: '#0b6a0b',
                        fontSize: 13,
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}>
                        Final Time So Far
                      </div>
                      <div style={{
                        marginTop: 4,
                        color: '#1f2933',
                        fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
                        fontSize: 24,
                        fontWeight: 800,
                        lineHeight: 1.15,
                        letterSpacing: 0
                      }}>
                        {formatDurationMinutesAsTime(finalDurationMinutes)}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 14 }}>
                    {!isOverallActive && !isOverallComplete && (
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleStart(job.jobId)}
                        style={{
                          width: '100%',
                          minHeight: 54,
                          borderRadius: 6,
                          border: 'none',
                          backgroundColor: '#0078d4',
                          color: '#fff',
                          fontSize: 18,
                          fontWeight: 800
                        }}
                      >
                        {isSaving ? 'Starting...' : 'Job Start'}
                      </button>
                    )}

                    {isOverallComplete && (
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => openContinueDialog(job)}
                        style={{
                          width: '100%',
                          minHeight: 54,
                          borderRadius: 6,
                          border: '1px solid #0b6a0b',
                          backgroundColor: '#ffffff',
                          color: '#0b6a0b',
                          fontSize: 18,
                          fontWeight: 800
                        }}
                      >
                        Continue Job
                      </button>
                    )}

                    {isOverallActive && (
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleEnd(job.jobId)}
                        style={{
                          width: '100%',
                          minHeight: 54,
                          borderRadius: 6,
                          border: 'none',
                          backgroundColor: '#a4262c',
                          color: '#fff',
                          fontSize: 18,
                          fontWeight: 800
                        }}
                      >
                        {isSaving ? 'Ending...' : 'Job End'}
                      </button>
                    )}
                  </div>
                  </div>

                  <div style={{
                    marginTop: 14,
                    display: 'grid',
                    gap: 10
                  }}>
                    {STAGES.map(stage => {
                      const summary = getStageSummary(job, stage.type);
                      const stageKey = `${job.jobId}:${stage.type}`;
                      return (
                        <JobStageTimer
                          key={stage.type}
                          label={stage.label}
                          summary={summary}
                          saving={savingStageKey === stageKey}
                          onStart={() => {
                            if (summary.status !== 'in_progress' && summary.totalDurationMinutes > 0) {
                              openStageContinueDialog(job, stage.type, stage.label, summary);
                              return;
                            }

                            handleStageStart(job.jobId, stage.type);
                          }}
                          onStop={() => handleStageStop(job.jobId, stage.type)}
                        />
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {continueJob && (
        <div
          role="presentation"
          onClick={closeContinueDialog}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="continue-job-title"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: '#ffffff',
              borderRadius: 8,
              padding: 18,
              boxShadow: '0 18px 40px rgba(15, 23, 42, 0.28)'
            }}
          >
            <div id="continue-job-title" style={{ fontSize: 20, fontWeight: 800, color: '#1f2933' }}>
              Continue completed job?
            </div>
            <div style={{ marginTop: 8, color: '#52606d', fontSize: 15, lineHeight: 1.45 }}>
              Are you sure you want to continue this completed job?
              <br />
              This will create a new time entry and mark the job as In Progress again.
            </div>

            <div style={{
              marginTop: 14,
              padding: '10px 12px',
              borderRadius: 8,
              backgroundColor: '#f7f8fa',
              border: '1px solid #d6dbe1'
            }}>
              <div style={{ fontSize: 13, color: '#52606d', fontWeight: 700 }}>Job</div>
              <div style={{ marginTop: 2, color: '#1f2933', fontWeight: 800 }}>
                {continueJob.jobNumber || 'Job'}
              </div>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: '#52606d', fontSize: 13, fontWeight: 700 }}>Final actual time so far</span>
                <span style={{
                  color: '#1f2933',
                  fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: 0
                }}>
                  {formatDurationMinutesAsTime(continueJob.actualDurationMinutes ?? continueJob.latestEntry?.actualDurationMinutes)}
                </span>
              </div>
            </div>

            <label style={{ display: 'block', marginTop: 14 }}>
              <span style={{ display: 'block', marginBottom: 6, color: '#323f4b', fontSize: 14, fontWeight: 700 }}>
                Reason for continuing job
              </span>
              <textarea
                value={continueReason}
                onChange={(event) => setContinueReason(event.target.value)}
                disabled={savingJobId === continueJob.jobId}
                rows={3}
                placeholder="Optional"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  border: '1px solid #c8cfd8',
                  borderRadius: 6,
                  padding: 10,
                  fontSize: 16,
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
              <button
                type="button"
                onClick={closeContinueDialog}
                disabled={savingJobId === continueJob.jobId}
                style={{
                  minHeight: 48,
                  borderRadius: 6,
                  border: '1px solid #c8cfd8',
                  backgroundColor: '#ffffff',
                  color: '#1f2933',
                  fontSize: 16,
                  fontWeight: 800
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmContinue}
                disabled={savingJobId === continueJob.jobId}
                style={{
                  minHeight: 48,
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: '#0b6a0b',
                  color: '#ffffff',
                  fontSize: 16,
                  fontWeight: 800
                }}
              >
                {savingJobId === continueJob.jobId ? 'Continuing...' : 'Yes, Continue Job'}
              </button>
            </div>
          </div>
        </div>
      )}

      {continueStage && (
        <div
          role="presentation"
          onClick={closeStageContinueDialog}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="continue-stage-title"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: '#ffffff',
              borderRadius: 8,
              padding: 18,
              boxShadow: '0 18px 40px rgba(15, 23, 42, 0.28)'
            }}
          >
            <div id="continue-stage-title" style={{ fontSize: 20, fontWeight: 800, color: '#1f2933' }}>
              Continue {continueStage.stageLabel}?
            </div>
            <div style={{ marginTop: 8, color: '#52606d', fontSize: 15, lineHeight: 1.45 }}>
              Are you sure you want to continue {continueStage.stageLabel}?
              <br />
              This will create a new time entry for this stage.
            </div>

            <div style={{
              marginTop: 14,
              padding: '10px 12px',
              borderRadius: 8,
              backgroundColor: '#f7f8fa',
              border: '1px solid #d6dbe1'
            }}>
              <div style={{ fontSize: 13, color: '#52606d', fontWeight: 700 }}>Job</div>
              <div style={{ marginTop: 2, color: '#1f2933', fontWeight: 800 }}>
                {continueStage.job.jobNumber || 'Job'}
              </div>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: '#52606d', fontSize: 13, fontWeight: 700 }}>
                  {continueStage.stageLabel} time so far
                </span>
                <span style={{
                  color: '#1f2933',
                  fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: 0
                }}>
                  {formatDurationMinutesAsTime(continueStage.totalDurationMinutes)}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
              <button
                type="button"
                onClick={closeStageContinueDialog}
                disabled={savingStageKey === `${continueStage.job.jobId}:${continueStage.stageType}`}
                style={{
                  minHeight: 48,
                  borderRadius: 6,
                  border: '1px solid #c8cfd8',
                  backgroundColor: '#ffffff',
                  color: '#1f2933',
                  fontSize: 16,
                  fontWeight: 800
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStageContinue}
                disabled={savingStageKey === `${continueStage.job.jobId}:${continueStage.stageType}`}
                style={{
                  minHeight: 48,
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: '#0078d4',
                  color: '#ffffff',
                  fontSize: 16,
                  fontWeight: 800
                }}
              >
                {savingStageKey === `${continueStage.job.jobId}:${continueStage.stageType}`
                  ? `Continuing ${continueStage.stageLabel}...`
                  : `Yes, Continue ${continueStage.stageLabel}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
