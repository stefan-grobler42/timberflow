using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class JobWorkLogsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<JobWorkLogsController> _logger;

    public JobWorkLogsController(AppDbContext context, ILogger<JobWorkLogsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("allocation/{allocationId}")]
    public async Task<ActionResult<IEnumerable<JobWorkLogDto>>> GetByAllocation(Guid allocationId)
    {
        var allocation = await _context.JobAllocations.FindAsync(allocationId);
        if (allocation == null)
        {
            return NotFound(new { message = $"JobAllocation with ID {allocationId} not found" });
        }

        var logs = await _context.JobWorkLogs
            .Include(l => l.Allocation)
            .Include(l => l.Leader)
            .Include(l => l.Helper1)
            .Include(l => l.Helper2)
            .Include(l => l.Helper3)
            .Include(l => l.Helper4)
            .Where(l => l.AllocationId == allocationId)
            .OrderBy(l => l.WorkDate)
            .ThenBy(l => l.PlannedStartMinutes)
            .ToListAsync();

        var dtos = logs.Select(MapToDto).ToList();

        _logger.LogInformation("GetByAllocation returned {Count} work logs for allocation {AllocationId}", dtos.Count, allocationId);
        return Ok(dtos);
    }

    [HttpGet("date/{dateStr}")]
    public async Task<ActionResult<IEnumerable<JobWorkLogDto>>> GetByDate(string dateStr)
    {
        if (!DateTime.TryParse(dateStr, out var workDate))
        {
            return BadRequest(new { message = "Invalid date format. Use yyyy-MM-dd" });
        }

        var startOfDay = workDate.Date;
        var endOfDay = startOfDay.AddDays(1);

        var logs = await _context.JobWorkLogs
            .Include(l => l.Allocation)
            .Include(l => l.Leader)
            .Include(l => l.Helper1)
            .Include(l => l.Helper2)
            .Include(l => l.Helper3)
            .Include(l => l.Helper4)
            .Where(l => l.WorkDate >= startOfDay && l.WorkDate < endOfDay)
            .OrderBy(l => l.PlannedStartMinutes)
            .ToListAsync();

        var dtos = logs.Select(MapToDto).ToList();

        _logger.LogInformation("GetByDate returned {Count} work logs for date {Date}", dtos.Count, dateStr);
        return Ok(dtos);
    }

    [HttpPost]
    public async Task<ActionResult<JobWorkLogDto>> Create([FromBody] CreateJobWorkLogDto createDto)
    {
        var allocation = await _context.JobAllocations.FindAsync(createDto.AllocationId);
        if (allocation == null)
        {
            return BadRequest(new { message = $"JobAllocation with ID {createDto.AllocationId} not found" });
        }

        if (createDto.LeaderId.HasValue)
        {
            var leader = await _context.Employees.FindAsync(createDto.LeaderId.Value);
            if (leader == null)
            {
                return BadRequest(new { message = $"Leader Employee with ID {createDto.LeaderId} not found" });
            }
        }

        var log = new JobWorkLog
        {
            Id = Guid.NewGuid(),
            AllocationId = createDto.AllocationId,
            WorkDate = createDto.WorkDate,
            PlannedStartMinutes = createDto.PlannedStartMinutes,
            PlannedEndMinutes = createDto.PlannedEndMinutes,
            PlannedDurationMinutes = createDto.PlannedDurationMinutes,
            BreakAdjustmentMinutes = createDto.BreakAdjustmentMinutes,
            ActualStartMinutes = createDto.ActualStartMinutes,
            ActualEndMinutes = createDto.ActualEndMinutes,
            ActualDurationMinutes = createDto.ActualDurationMinutes,
            EfinksCompleted = createDto.EfinksCompleted,
            LeaderId = createDto.LeaderId,
            Helper1Id = createDto.Helper1Id,
            Helper2Id = createDto.Helper2Id,
            Helper3Id = createDto.Helper3Id,
            Helper4Id = createDto.Helper4Id,
            Notes = createDto.Notes,
            OvertimeType = createDto.OvertimeType,
            IsOvertime = createDto.IsOvertime,
            CreatedOn = DateTime.UtcNow
        };

        _context.JobWorkLogs.Add(log);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created JobWorkLog {Id} for allocation {AllocationId} on {WorkDate}",
            log.Id, log.AllocationId, log.WorkDate);

        var result = await _context.JobWorkLogs
            .Include(l => l.Allocation)
            .Include(l => l.Leader)
            .Include(l => l.Helper1)
            .Include(l => l.Helper2)
            .Include(l => l.Helper3)
            .Include(l => l.Helper4)
            .FirstOrDefaultAsync(l => l.Id == log.Id);

        return CreatedAtAction(nameof(GetByAllocation), new { allocationId = log.AllocationId }, MapToDto(result!));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<JobWorkLogDto>> Update(Guid id, [FromBody] UpdateJobWorkLogDto updateDto)
    {
        var item = await _context.JobWorkLogs.FindAsync(id);

        if (item == null)
        {
            return NotFound(new { message = $"JobWorkLog with ID {id} not found" });
        }

        if (updateDto.PlannedStartMinutes.HasValue) item.PlannedStartMinutes = updateDto.PlannedStartMinutes.Value;
        if (updateDto.PlannedEndMinutes.HasValue) item.PlannedEndMinutes = updateDto.PlannedEndMinutes.Value;
        if (updateDto.PlannedDurationMinutes.HasValue) item.PlannedDurationMinutes = updateDto.PlannedDurationMinutes.Value;
        if (updateDto.BreakAdjustmentMinutes.HasValue) item.BreakAdjustmentMinutes = updateDto.BreakAdjustmentMinutes.Value;
        if (updateDto.ActualStartMinutes.HasValue) item.ActualStartMinutes = updateDto.ActualStartMinutes;
        if (updateDto.ActualEndMinutes.HasValue) item.ActualEndMinutes = updateDto.ActualEndMinutes;
        if (updateDto.ActualDurationMinutes.HasValue) item.ActualDurationMinutes = updateDto.ActualDurationMinutes;
        if (updateDto.EfinksCompleted.HasValue) item.EfinksCompleted = updateDto.EfinksCompleted;
        if (updateDto.LeaderId.HasValue) item.LeaderId = updateDto.LeaderId;
        if (updateDto.Helper1Id.HasValue) item.Helper1Id = updateDto.Helper1Id;
        if (updateDto.Helper2Id.HasValue) item.Helper2Id = updateDto.Helper2Id;
        if (updateDto.Helper3Id.HasValue) item.Helper3Id = updateDto.Helper3Id;
        if (updateDto.Helper4Id.HasValue) item.Helper4Id = updateDto.Helper4Id;
        if (updateDto.Notes != null) item.Notes = updateDto.Notes;
        if (updateDto.OvertimeType != null) item.OvertimeType = updateDto.OvertimeType;
        if (updateDto.IsOvertime.HasValue) item.IsOvertime = updateDto.IsOvertime.Value;

        item.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated JobWorkLog {Id}", id);

        var result = await _context.JobWorkLogs
            .Include(l => l.Allocation)
            .Include(l => l.Leader)
            .Include(l => l.Helper1)
            .Include(l => l.Helper2)
            .Include(l => l.Helper3)
            .Include(l => l.Helper4)
            .FirstOrDefaultAsync(l => l.Id == id);

        return Ok(MapToDto(result!));
    }

    [HttpGet("report/team-efficiency")]
    public async Task<ActionResult<object>> GetTeamEfficiencyReport(
        [FromQuery] string? dateFrom = null,
        [FromQuery] string? dateTo = null)
    {
        var fromDate = DateTime.TryParse(dateFrom, out var from) ? from : DateTime.UtcNow.AddMonths(-3);
        var toDate = DateTime.TryParse(dateTo, out var to) ? to : DateTime.UtcNow;

        var logs = await _context.JobWorkLogs
            .Include(l => l.Allocation)
            .ThenInclude(a => a!.Team)
            .Where(l => l.WorkDate >= fromDate && l.WorkDate <= toDate)
            .Where(l => l.EfinksCompleted.HasValue && l.ActualDurationMinutes.HasValue)
            .ToListAsync();

        var teamStats = logs
            .Where(l => l.Allocation?.Team != null)
            .GroupBy(l => new { TeamId = l.Allocation!.TeamId, TeamName = l.Allocation!.Team!.Name })
            .Select(g => new
            {
                teamId = g.Key.TeamId,
                teamName = g.Key.TeamName,
                totalJobsLogged = g.Count(),
                totalEfinksCompleted = g.Sum(l => l.EfinksCompleted ?? 0),
                totalActualMinutes = g.Sum(l => l.ActualDurationMinutes ?? 0),
                averageEfinksPerHour = g.Sum(l => l.ActualDurationMinutes ?? 0) > 0
                    ? Math.Round((double)(g.Sum(l => l.EfinksCompleted ?? 0) / (g.Sum(l => l.ActualDurationMinutes ?? 0) / 60.0m)), 2)
                    : 0,
                suggestedAverageEfinks = g.Sum(l => l.ActualDurationMinutes ?? 0) > 0
                    ? Math.Round((double)(g.Sum(l => l.EfinksCompleted ?? 0) / (g.Sum(l => l.ActualDurationMinutes ?? 0) / 480.0m)), 0)
                    : 80
            })
            .OrderByDescending(t => t.averageEfinksPerHour)
            .ToList();

        var summary = new
        {
            dateFrom = fromDate.ToString("yyyy-MM-dd"),
            dateTo = toDate.ToString("yyyy-MM-dd"),
            totalLogsAnalyzed = logs.Count,
            teamEfficiency = teamStats
        };

        _logger.LogInformation("Team efficiency report generated for {DateFrom} to {DateTo} with {Count} teams",
            fromDate.ToString("yyyy-MM-dd"), toDate.ToString("yyyy-MM-dd"), teamStats.Count);

        return Ok(summary);
    }

    [HttpGet("report/accuracy-analysis")]
    public async Task<ActionResult<object>> GetAccuracyAnalysis(
        [FromQuery] string? dateFrom = null,
        [FromQuery] string? dateTo = null)
    {
        var fromDate = DateTime.TryParse(dateFrom, out var from) ? from : DateTime.UtcNow.AddMonths(-3);
        var toDate = DateTime.TryParse(dateTo, out var to) ? to : DateTime.UtcNow;

        var allocationsWithLogs = await _context.JobAllocations
            .Include(a => a.Team)
            .Include(a => a.WorkLogs)
            .Where(a => a.SpanStartDate >= fromDate && a.SpanStartDate <= toDate)
            .Where(a => a.WorkLogs.Any(l => l.EfinksCompleted.HasValue))
            .ToListAsync();

        var analysisData = allocationsWithLogs.Select(a => 
        {
            var totalActualEfinks = a.WorkLogs.Sum(l => l.EfinksCompleted ?? 0);
            var totalActualMinutes = a.WorkLogs.Sum(l => l.ActualDurationMinutes ?? 0);
            var estimatedEfinks = a.EstimatedEfinks;
            var estimatedMinutes = a.EstimatedDurationMinutes;

            return new
            {
                allocationId = a.Id,
                orderNumber = a.OrderNumber,
                teamName = a.Team?.Name,
                estimatedEfinks = estimatedEfinks,
                actualEfinks = totalActualEfinks,
                eFinksVariance = totalActualEfinks - estimatedEfinks,
                eFinksAccuracyPercent = estimatedEfinks > 0 
                    ? Math.Round((double)(totalActualEfinks / estimatedEfinks * 100), 1)
                    : 0,
                estimatedMinutes = estimatedMinutes,
                actualMinutes = totalActualMinutes,
                minutesVariance = totalActualMinutes - estimatedMinutes
            };
        })
        .OrderBy(a => a.eFinksAccuracyPercent)
        .ToList();

        var overEstimated = analysisData.Count(a => a.eFinksAccuracyPercent < 90);
        var accurate = analysisData.Count(a => a.eFinksAccuracyPercent >= 90 && a.eFinksAccuracyPercent <= 110);
        var underEstimated = analysisData.Count(a => a.eFinksAccuracyPercent > 110);

        var summary = new
        {
            dateFrom = fromDate.ToString("yyyy-MM-dd"),
            dateTo = toDate.ToString("yyyy-MM-dd"),
            totalJobsAnalyzed = analysisData.Count,
            overEstimatedJobs = overEstimated,
            accurateJobs = accurate,
            underEstimatedJobs = underEstimated,
            averageAccuracyPercent = analysisData.Count > 0
                ? Math.Round(analysisData.Average(a => a.eFinksAccuracyPercent), 1)
                : 0,
            jobs = analysisData.Take(100).ToList()
        };

        _logger.LogInformation("Accuracy analysis report generated for {DateFrom} to {DateTo} with {Count} jobs",
            fromDate.ToString("yyyy-MM-dd"), toDate.ToString("yyyy-MM-dd"), analysisData.Count);

        return Ok(summary);
    }

    private static JobWorkLogDto MapToDto(JobWorkLog log)
    {
        return new JobWorkLogDto
        {
            Id = log.Id,
            AllocationId = log.AllocationId,
            WorkDate = log.WorkDate,
            PlannedStartMinutes = log.PlannedStartMinutes,
            PlannedEndMinutes = log.PlannedEndMinutes,
            PlannedDurationMinutes = log.PlannedDurationMinutes,
            BreakAdjustmentMinutes = log.BreakAdjustmentMinutes,
            ActualStartMinutes = log.ActualStartMinutes,
            ActualEndMinutes = log.ActualEndMinutes,
            ActualDurationMinutes = log.ActualDurationMinutes,
            EfinksCompleted = log.EfinksCompleted,
            LeaderId = log.LeaderId,
            Helper1Id = log.Helper1Id,
            Helper2Id = log.Helper2Id,
            Helper3Id = log.Helper3Id,
            Helper4Id = log.Helper4Id,
            Notes = log.Notes,
            OvertimeType = log.OvertimeType,
            IsOvertime = log.IsOvertime,
            CreatedOn = log.CreatedOn,
            ModifiedOn = log.ModifiedOn,
            LeaderName = log.Leader?.Name,
            Helper1Name = log.Helper1?.Name,
            Helper2Name = log.Helper2?.Name,
            Helper3Name = log.Helper3?.Name,
            Helper4Name = log.Helper4?.Name,
            OrderNumber = log.Allocation?.OrderNumber,
            CustomerName = log.Allocation?.CustomerName
        };
    }
}
