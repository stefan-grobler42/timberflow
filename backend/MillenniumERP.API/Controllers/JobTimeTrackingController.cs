using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Application.Services;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;
using System.Security.Claims;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class JobTimeTrackingController : ControllerBase
{
    private const string InProgressStatus = "in_progress";
    private const string CompletedStatus = "completed";
    private const string OverallStage = "overall";
    private const string PickingStage = "picking";
    private const string SawingStage = "sawing";
    private const string ProductionStage = "production";
    private readonly AppDbContext _context;
    private readonly ILogger<JobTimeTrackingController> _logger;

    public JobTimeTrackingController(AppDbContext context, ILogger<JobTimeTrackingController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("today")]
    public async Task<ActionResult<IEnumerable<MobileJobDto>>> GetTodayJobs(
        [FromQuery] Guid? teamId = null,
        [FromQuery] string? workDate = null)
    {
        var resolvedTeamId = ResolveTeamId(teamId);
        if (!resolvedTeamId.HasValue)
        {
            return BadRequest(new { message = "teamId is required until mobile authentication is configured." });
        }

        var today = DateTime.TryParse(workDate, out var parsedWorkDate)
            ? parsedWorkDate.Date
            : DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var jobs = await _context.TeamWorkItems
            .AsNoTracking()
            .Include(w => w.Team)
            .Where(w => w.TeamId == resolvedTeamId.Value)
            .Where(w => w.ProductionId != null)
            .Where(w => w.WorkDate >= today && w.WorkDate < tomorrow)
            .Where(w => w.Status != "cancelled")
            .OrderBy(w => w.Sequence)
            .ThenBy(w => w.PlannedStartMinutes)
            .ToListAsync();

        var jobIds = jobs.Select(j => j.Id).ToList();
        var entries = await _context.JobTimeEntries
            .AsNoTracking()
            .Where(e => jobIds.Contains(e.JobId))
            .OrderByDescending(e => e.StartedAt)
            .ToListAsync();

        var entriesByJob = entries
            .GroupBy(e => e.JobId)
            .ToDictionary(g => g.Key, g => g.ToList());

        return Ok(jobs.Select(job => MapToMobileJob(job, entriesByJob.GetValueOrDefault(job.Id))));
    }

    [HttpPost("{jobId}/start")]
    public async Task<ActionResult<MobileJobDto>> StartJob(Guid jobId, [FromBody] JobTimeActionDto? actionDto = null)
    {
        var job = await _context.TeamWorkItems
            .Include(w => w.Team)
            .FirstOrDefaultAsync(w => w.Id == jobId);

        if (job == null)
        {
            return NotFound(new { message = $"Job with ID {jobId} not found" });
        }

        var hasActiveEntry = await _context.JobTimeEntries.AnyAsync(e =>
            e.JobId == job.Id &&
            e.TeamId == job.TeamId &&
            e.StageType == OverallStage &&
            e.EndedAt == null &&
            e.Status == InProgressStatus);

        if (hasActiveEntry)
        {
            return Conflict(new { message = "This job is already in progress for this team." });
        }

        var now = DateTime.UtcNow;
        var actor = ResolveActor();
        var entry = new JobTimeEntry
        {
            Id = Guid.NewGuid(),
            JobId = job.Id,
            TeamId = job.TeamId,
            StageType = OverallStage,
            StartedAt = now,
            Status = InProgressStatus,
            StartedBy = actor,
            Notes = actionDto?.Notes,
            CreatedOn = now
        };

        _context.JobTimeEntries.Add(entry);

        job.ActualStartTime ??= now;
        job.ActualEndTime = null;
        job.Status = InProgressStatus;
        job.PickingComplete = false;
        job.SawingComplete = false;
        job.JiggingComplete = false;
        job.ModifiedOn = now;

        if (job.ProductionId.HasValue)
        {
            var production = await _context.Productions.FindAsync(job.ProductionId.Value);
            if (production != null)
            {
                production.Jigend = null;
                production.Productioncomplete = false;
                production.ModifiedOn = now;
            }
            else
            {
                var batchedJob = await _context.BatchedJobs.FindAsync(job.ProductionId.Value);
                if (batchedJob != null)
                {
                    batchedJob.ProductionComplete = false;
                    batchedJob.ModifiedOn = now;
                }
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Started or continued job {JobId} for team {TeamId}", job.Id, job.TeamId);

        var entries = await _context.JobTimeEntries
            .AsNoTracking()
            .Where(e => e.JobId == job.Id)
            .OrderByDescending(e => e.StartedAt)
            .ToListAsync();

        return Ok(MapToMobileJob(job, entries));
    }

    [HttpPost("{jobId}/end")]
    public async Task<ActionResult<MobileJobDto>> EndJob(Guid jobId, [FromBody] JobTimeActionDto? actionDto = null)
    {
        var job = await _context.TeamWorkItems
            .Include(w => w.Team)
            .FirstOrDefaultAsync(w => w.Id == jobId);

        if (job == null)
        {
            return NotFound(new { message = $"Job with ID {jobId} not found" });
        }

        var activeEntry = await _context.JobTimeEntries
            .Where(e => e.JobId == job.Id && e.TeamId == job.TeamId && e.StageType == OverallStage && e.EndedAt == null && e.Status == InProgressStatus)
            .OrderByDescending(e => e.StartedAt)
            .FirstOrDefaultAsync();

        if (activeEntry == null)
        {
            return BadRequest(new { message = "This job cannot be ended because it has not been started." });
        }

        var now = DateTime.UtcNow;
        var durationMinutes = Math.Max(0, (int)Math.Round((now - activeEntry.StartedAt).TotalMinutes));

        activeEntry.EndedAt = now;
        activeEntry.ActualDurationMinutes = durationMinutes;
        activeEntry.Status = CompletedStatus;
        activeEntry.EndedBy = ResolveActor();
        activeEntry.ModifiedOn = now;
        var endNotes = actionDto?.Notes;
        if (!string.IsNullOrWhiteSpace(endNotes))
        {
            activeEntry.Notes = string.IsNullOrWhiteSpace(activeEntry.Notes)
                ? endNotes
                : $"{activeEntry.Notes}\n{endNotes}";
        }

        var completedEntries = await _context.JobTimeEntries
            .Where(e => e.JobId == job.Id && e.TeamId == job.TeamId && e.StageType == OverallStage && e.Id != activeEntry.Id && e.ActualDurationMinutes.HasValue)
            .ToListAsync();

        var totalActualMinutes = completedEntries.Sum(e => e.ActualDurationMinutes ?? 0) + durationMinutes;
        var hasActiveStages = await _context.JobTimeEntries.AnyAsync(e =>
            e.JobId == job.Id &&
            e.TeamId == job.TeamId &&
            e.StageType != OverallStage &&
            e.EndedAt == null &&
            e.Status == InProgressStatus);

        job.ActualStartTime ??= activeEntry.StartedAt;
        job.ActualEndTime = now;
        job.ActualDurationMinutes = totalActualMinutes;
        job.Status = hasActiveStages ? InProgressStatus : CompletedStatus;
        if (!hasActiveStages)
        {
            job.PickingComplete = true;
            job.SawingComplete = true;
            job.JiggingComplete = true;
        }
        job.ModifiedOn = now;

        if (job.ProductionId.HasValue)
        {
            var production = await _context.Productions.FindAsync(job.ProductionId.Value);
            if (production != null)
            {
                production.Jigstart ??= job.ActualStartTime;
                production.Jigend = now;
                production.JigId ??= job.TeamId;
                production.Productionplanneddate ??= job.WorkDate;
                production.PlannedStartTime ??= job.PlannedStartMinutes;
                production.PlannedEndTime ??= job.PlannedEndMinutes;
                production.PlannedDurationMinutes ??= job.PlannedDurationMinutes;
                production.BreakAdjustmentMinutes ??= job.BreakAdjustmentMinutes;
                production.Productioncomplete = true;
                production.ModifiedOn = now;
            }
            else
            {
                var batchedJob = await _context.BatchedJobs.FindAsync(job.ProductionId.Value);
                if (batchedJob != null)
                {
                    batchedJob.ProductionComplete = true;
                    batchedJob.ModifiedOn = now;
                }
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Ended job {JobId} for team {TeamId}; actual duration {DurationMinutes} minutes",
            job.Id, job.TeamId, totalActualMinutes);

        var entries = await _context.JobTimeEntries
            .AsNoTracking()
            .Where(e => e.JobId == job.Id)
            .OrderByDescending(e => e.StartedAt)
            .ToListAsync();

        return Ok(MapToMobileJob(job, entries));
    }

    [HttpPost("{jobId}/stages/{stageType}/start")]
    public async Task<ActionResult<MobileJobDto>> StartStage(Guid jobId, string stageType, [FromBody] JobTimeActionDto? actionDto = null)
    {
        var normalizedStage = NormalizeStageType(stageType);
        if (normalizedStage == null)
        {
            return BadRequest(new { message = "Stage must be Picking, Sawing, or Production." });
        }

        var job = await _context.TeamWorkItems
            .Include(w => w.Team)
            .FirstOrDefaultAsync(w => w.Id == jobId);

        if (job == null)
        {
            return NotFound(new { message = $"Job with ID {jobId} not found" });
        }

        var hasActiveStage = await _context.JobTimeEntries.AnyAsync(e =>
            e.JobId == job.Id &&
            e.TeamId == job.TeamId &&
            e.StageType == normalizedStage &&
            e.EndedAt == null &&
            e.Status == InProgressStatus);

        if (hasActiveStage)
        {
            return Conflict(new { message = $"{ToStageLabel(normalizedStage)} is already in progress for this job." });
        }

        var now = DateTime.UtcNow;
        var entry = new JobTimeEntry
        {
            Id = Guid.NewGuid(),
            JobId = job.Id,
            TeamId = job.TeamId,
            StageType = normalizedStage,
            StartedAt = now,
            Status = InProgressStatus,
            StartedBy = ResolveActor(),
            Notes = actionDto?.Notes,
            CreatedOn = now
        };

        _context.JobTimeEntries.Add(entry);

        job.ActualStartTime ??= now;
        job.ActualEndTime = null;
        job.Status = InProgressStatus;
        SetStageComplete(job, normalizedStage, false);
        job.ModifiedOn = now;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Started {StageType} stage for job {JobId} team {TeamId}", normalizedStage, job.Id, job.TeamId);

        var entries = await _context.JobTimeEntries
            .AsNoTracking()
            .Where(e => e.JobId == job.Id)
            .OrderByDescending(e => e.StartedAt)
            .ToListAsync();

        return Ok(MapToMobileJob(job, entries));
    }

    [HttpPost("{jobId}/stages/{stageType}/stop")]
    public async Task<ActionResult<MobileJobDto>> StopStage(Guid jobId, string stageType, [FromBody] JobTimeActionDto? actionDto = null)
    {
        var normalizedStage = NormalizeStageType(stageType);
        if (normalizedStage == null)
        {
            return BadRequest(new { message = "Stage must be Picking, Sawing, or Production." });
        }

        var job = await _context.TeamWorkItems
            .Include(w => w.Team)
            .FirstOrDefaultAsync(w => w.Id == jobId);

        if (job == null)
        {
            return NotFound(new { message = $"Job with ID {jobId} not found" });
        }

        var activeEntry = await _context.JobTimeEntries
            .Where(e => e.JobId == job.Id &&
                        e.TeamId == job.TeamId &&
                        e.StageType == normalizedStage &&
                        e.EndedAt == null &&
                        e.Status == InProgressStatus)
            .OrderByDescending(e => e.StartedAt)
            .FirstOrDefaultAsync();

        if (activeEntry == null)
        {
            return BadRequest(new { message = $"{ToStageLabel(normalizedStage)} cannot be stopped because it is not running." });
        }

        var now = DateTime.UtcNow;
        var durationMinutes = Math.Max(0, (int)Math.Round((now - activeEntry.StartedAt).TotalMinutes));

        activeEntry.EndedAt = now;
        activeEntry.ActualDurationMinutes = durationMinutes;
        activeEntry.Status = CompletedStatus;
        activeEntry.EndedBy = ResolveActor();
        activeEntry.ModifiedOn = now;

        var endNotes = actionDto?.Notes;
        if (!string.IsNullOrWhiteSpace(endNotes))
        {
            activeEntry.Notes = string.IsNullOrWhiteSpace(activeEntry.Notes)
                ? endNotes
                : $"{activeEntry.Notes}\n{endNotes}";
        }

        SetStageComplete(job, normalizedStage, true);

        var anyOtherActiveEntry = await _context.JobTimeEntries.AnyAsync(e =>
            e.JobId == job.Id &&
            e.TeamId == job.TeamId &&
            e.Id != activeEntry.Id &&
            e.EndedAt == null &&
            e.Status == InProgressStatus);

        if (!anyOtherActiveEntry && job.Status == InProgressStatus)
        {
            job.Status = job.ActualEndTime.HasValue ? CompletedStatus : "scheduled";
        }

        job.ModifiedOn = now;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Stopped {StageType} stage for job {JobId} team {TeamId}; duration {DurationMinutes} minutes",
            normalizedStage, job.Id, job.TeamId, durationMinutes);

        var entries = await _context.JobTimeEntries
            .AsNoTracking()
            .Where(e => e.JobId == job.Id)
            .OrderByDescending(e => e.StartedAt)
            .ToListAsync();

        return Ok(MapToMobileJob(job, entries));
    }

    [HttpGet("{jobId}/history")]
    public async Task<ActionResult<IEnumerable<JobTimeEntryDto>>> GetHistory(Guid jobId)
    {
        var jobExists = await _context.TeamWorkItems.AnyAsync(w => w.Id == jobId);
        if (!jobExists)
        {
            return NotFound(new { message = $"Job with ID {jobId} not found" });
        }

        var entries = await _context.JobTimeEntries
            .AsNoTracking()
            .Where(e => e.JobId == jobId)
            .OrderByDescending(e => e.StartedAt)
            .ToListAsync();

        return Ok(entries.Select(MapToDto));
    }

    private Guid? ResolveTeamId(Guid? teamId)
    {
        if (teamId.HasValue)
        {
            return teamId;
        }

        if (Request.Headers.TryGetValue("X-Team-Id", out var headerValue) &&
            Guid.TryParse(headerValue.FirstOrDefault(), out var headerTeamId))
        {
            return headerTeamId;
        }

        var teamClaim = User.FindFirst("team_id")?.Value ?? User.FindFirst("teamId")?.Value;
        return Guid.TryParse(teamClaim, out var claimTeamId) ? claimTeamId : null;
    }

    private string? ResolveActor()
    {
        if (Request.Headers.TryGetValue("X-User-Id", out var userHeader) && !string.IsNullOrWhiteSpace(userHeader.FirstOrDefault()))
        {
            return userHeader.FirstOrDefault();
        }

        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
               User.FindFirst("sub")?.Value ??
               User.Identity?.Name;
    }

    private static MobileJobDto MapToMobileJob(TeamWorkItem job, List<JobTimeEntry>? entries)
    {
        var summary = JobTimeSummaryBuilder.Build(entries, DateTime.UtcNow);
        var hasActiveStage = summary.Stages.Any(s => s.Status == InProgressStatus);
        var status = summary.ActiveEntry != null || hasActiveStage
            ? "in_progress"
            : summary.LatestEntry?.Status == CompletedStatus || job.Status == CompletedStatus
                ? "completed"
                : "not_started";

        return new MobileJobDto
        {
            JobId = job.Id,
            ProductionId = job.ProductionId,
            TeamId = job.TeamId,
            TeamName = job.Team?.Name,
            WorkDate = job.WorkDate,
            JobNumber = job.OrderNumber ?? job.ProductionName,
            CustomerName = job.CustomerName,
            SiteAddress = job.SiteAddress,
            PlannedStartMinutes = job.PlannedStartMinutes,
            PlannedEndMinutes = job.PlannedEndMinutes,
            PlannedDurationMinutes = job.PlannedDurationMinutes,
            ActualDurationMinutes = summary.ActualDurationMinutes,
            Status = status,
            ActiveEntry = summary.ActiveEntry,
            LatestEntry = summary.LatestEntry,
            TimingSummary = summary,
            Stages = summary.Stages
        };
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

    private static string? NormalizeStageType(string? stageType)
    {
        return stageType?.Trim().ToLowerInvariant() switch
        {
            PickingStage => PickingStage,
            SawingStage => SawingStage,
            ProductionStage => ProductionStage,
            _ => null
        };
    }

    private static string ToStageLabel(string stageType)
    {
        return stageType switch
        {
            PickingStage => "Picking",
            SawingStage => "Sawing",
            ProductionStage => "Production",
            _ => "Stage"
        };
    }

    private static void SetStageComplete(TeamWorkItem job, string stageType, bool isComplete)
    {
        switch (stageType)
        {
            case PickingStage:
                job.PickingComplete = isComplete;
                break;
            case SawingStage:
                job.SawingComplete = isComplete;
                break;
            case ProductionStage:
                job.JiggingComplete = isComplete;
                break;
        }
    }
}
