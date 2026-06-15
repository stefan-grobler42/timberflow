using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;

namespace MillenniumERP.Application.Services;

public static class JobTimeSummaryBuilder
{
    private const string InProgressStatus = "in_progress";
    private const string CompletedStatus = "completed";
    private const string OverallStage = "overall";
    private const string PickingStage = "picking";
    private const string SawingStage = "sawing";
    private const string ProductionStage = "production";
    private static readonly string[] TrackedStages = [PickingStage, SawingStage, ProductionStage];

    public static JobTimingSummaryDto Build(IEnumerable<JobTimeEntry>? entries, DateTime nowUtc, bool forceCompleted = false)
    {
        var allEntries = entries?
            .OrderByDescending(e => e.StartedAt)
            .ToList() ?? [];

        var overallEntries = allEntries
            .Where(e => string.Equals(e.StageType, OverallStage, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(e => e.StartedAt)
            .ToList();

        var activeEntry = forceCompleted ? null : overallEntries.FirstOrDefault(IsActive);
        var latestEntry = overallEntries.FirstOrDefault();
        var completedOverallMinutes = overallEntries
            .Where(e => e.EndedAt.HasValue)
            .Sum(GetCompletedMinutes);
        var activeOverallMinutes = activeEntry == null ? 0 : GetElapsedMinutes(activeEntry, nowUtc);
        var totalOverallMinutes = completedOverallMinutes + activeOverallMinutes;
        var stageSummaries = BuildStageSummaries(allEntries, nowUtc, forceCompleted);
        var stageDurations = new TeamWorkItemStageDurationsDto
        {
            PickingMinutes = stageSummaries.First(s => s.StageType == PickingStage).TotalDurationMinutes,
            SawingMinutes = stageSummaries.First(s => s.StageType == SawingStage).TotalDurationMinutes,
            ProductionMinutes = stageSummaries.First(s => s.StageType == ProductionStage).TotalDurationMinutes
        };

        return new JobTimingSummaryDto
        {
            Status = activeEntry != null
                ? InProgressStatus
                : overallEntries.Any(e => e.EndedAt.HasValue)
                    ? CompletedStatus
                    : "not_started",
            HasOverallTiming = overallEntries.Count > 0,
            HasStageTiming = stageDurations.TotalLabourMinutes > 0 || stageSummaries.Any(s => s.ActiveEntry != null),
            ActualStartTime = overallEntries.Count == 0 ? null : overallEntries.Min(e => e.StartedAt),
            ActualEndTime = activeEntry != null
                ? null
                : overallEntries
                    .Where(e => e.EndedAt.HasValue)
                    .Select(e => e.EndedAt)
                    .OrderByDescending(e => e)
                    .FirstOrDefault(),
            ActualDurationMinutes = overallEntries.Count == 0 ? null : totalOverallMinutes,
            ActiveEntry = activeEntry == null ? null : MapToDto(activeEntry),
            LatestEntry = latestEntry == null ? null : MapToDto(latestEntry),
            StageDurations = stageDurations,
            Stages = stageSummaries
        };
    }

    private static List<JobStageSummaryDto> BuildStageSummaries(List<JobTimeEntry> entries, DateTime nowUtc, bool forceCompleted)
    {
        return TrackedStages.Select(stage =>
        {
            var stageEntries = entries
                .Where(e => string.Equals(e.StageType, stage, StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(e => e.StartedAt)
                .ToList();
            var activeEntry = forceCompleted ? null : stageEntries.FirstOrDefault(IsActive);
            var latestEntry = stageEntries.FirstOrDefault();
            var completedEntries = stageEntries.Where(e => e.EndedAt.HasValue).ToList();
            var totalDurationMinutes = completedEntries.Sum(GetCompletedMinutes) +
                (activeEntry == null ? 0 : GetElapsedMinutes(activeEntry, nowUtc));

            return new JobStageSummaryDto
            {
                StageType = stage,
                Status = activeEntry != null
                    ? InProgressStatus
                    : completedEntries.Count > 0
                        ? CompletedStatus
                        : "not_started",
                TotalDurationMinutes = totalDurationMinutes,
                ActiveEntry = activeEntry == null ? null : MapToDto(activeEntry),
                LatestEntry = latestEntry == null ? null : MapToDto(latestEntry)
            };
        }).ToList();
    }

    private static bool IsActive(JobTimeEntry entry)
    {
        return entry.EndedAt == null;
    }

    private static int GetElapsedMinutes(JobTimeEntry entry, DateTime nowUtc)
    {
        return Math.Max(0, (int)Math.Round((nowUtc - entry.StartedAt).TotalMinutes));
    }

    private static int GetCompletedMinutes(JobTimeEntry entry)
    {
        if (entry.ActualDurationMinutes.HasValue)
        {
            return Math.Max(0, entry.ActualDurationMinutes.Value);
        }

        if (!entry.EndedAt.HasValue)
        {
            return 0;
        }

        return Math.Max(0, (int)Math.Round((entry.EndedAt.Value - entry.StartedAt).TotalMinutes));
    }

    private static JobTimeEntryDto MapToDto(JobTimeEntry entry)
    {
        return new JobTimeEntryDto
        {
            Id = entry.Id,
            JobId = entry.JobId,
            TeamId = entry.TeamId,
            StageType = entry.StageType,
            StartedAt = entry.StartedAt,
            EndedAt = entry.EndedAt,
            ActualDurationMinutes = entry.ActualDurationMinutes,
            Status = entry.Status,
            StartedBy = entry.StartedBy,
            EndedBy = entry.EndedBy,
            Notes = entry.Notes
        };
    }
}
