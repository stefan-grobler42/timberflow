using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TeamDaySettingsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<TeamDaySettingsController> _logger;

    public TeamDaySettingsController(AppDbContext context, ILogger<TeamDaySettingsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("{teamId}/{dateStr}")]
    public async Task<ActionResult<TeamDaySettingsDto>> GetByTeamAndDate(Guid teamId, string dateStr)
    {
        if (!DateTime.TryParse(dateStr, out var workDate))
        {
            return BadRequest(new { message = "Invalid date format. Use yyyy-MM-dd" });
        }

        var startOfDay = workDate.Date;
        var endOfDay = startOfDay.AddDays(1);

        var settings = await _context.TeamDaySettings
            .Include(s => s.Team)
            .FirstOrDefaultAsync(s => s.TeamId == teamId && s.WorkDate >= startOfDay && s.WorkDate < endOfDay);

        if (settings == null)
        {
            return Ok(new TeamDaySettingsDto
            {
                Id = Guid.Empty,
                TeamId = teamId,
                WorkDate = workDate.Date,
                EarlyOtEnabled = false,
                EarlyOtStartMinutes = null,
                LateOtEnabled = false,
                LateOtEndMinutes = null,
                IsWorkingDay = true,
                CreatedOn = DateTime.UtcNow,
                ModifiedOn = null,
                TeamName = null
            });
        }

        return Ok(MapToDto(settings));
    }

    [HttpGet("range")]
    public async Task<ActionResult<IEnumerable<TeamDaySettingsDto>>> GetRange(
        [FromQuery] Guid? teamId = null,
        [FromQuery] string? dateFrom = null,
        [FromQuery] string? dateTo = null)
    {
        var query = _context.TeamDaySettings
            .Include(s => s.Team)
            .AsQueryable();

        if (teamId.HasValue)
        {
            query = query.Where(s => s.TeamId == teamId.Value);
        }

        if (!string.IsNullOrEmpty(dateFrom) && DateTime.TryParse(dateFrom, out var fromDate))
        {
            query = query.Where(s => s.WorkDate >= fromDate.Date);
        }

        if (!string.IsNullOrEmpty(dateTo) && DateTime.TryParse(dateTo, out var toDate))
        {
            query = query.Where(s => s.WorkDate < toDate.Date.AddDays(1));
        }

        var settings = await query
            .OrderBy(s => s.TeamId)
            .ThenBy(s => s.WorkDate)
            .ToListAsync();

        var dtos = settings.Select(MapToDto).ToList();

        _logger.LogInformation("GetRange returned {Count} team day settings", dtos.Count);
        return Ok(dtos);
    }

    [HttpPut]
    public async Task<ActionResult<TeamDaySettingsDto>> Upsert([FromBody] UpsertTeamDaySettingsDto upsertDto)
    {
        var team = await _context.Jigs.FindAsync(upsertDto.TeamId);
        if (team == null)
        {
            return BadRequest(new { message = $"Team (Jig) with ID {upsertDto.TeamId} not found" });
        }

        var workDateStart = upsertDto.WorkDate.Date;
        var workDateEnd = workDateStart.AddDays(1);

        var existingSettings = await _context.TeamDaySettings
            .FirstOrDefaultAsync(s => s.TeamId == upsertDto.TeamId && 
                s.WorkDate >= workDateStart && s.WorkDate < workDateEnd);

        if (existingSettings != null)
        {
            existingSettings.EarlyOtEnabled = upsertDto.EarlyOtEnabled;
            existingSettings.EarlyOtStartMinutes = upsertDto.EarlyOtStartMinutes;
            existingSettings.LateOtEnabled = upsertDto.LateOtEnabled;
            existingSettings.LateOtEndMinutes = upsertDto.LateOtEndMinutes;
            existingSettings.IsWorkingDay = upsertDto.IsWorkingDay;
            existingSettings.ModifiedOn = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated TeamDaySettings {Id} for team {TeamId} on {WorkDate}",
                existingSettings.Id, existingSettings.TeamId, existingSettings.WorkDate);

            var updatedResult = await _context.TeamDaySettings
                .Include(s => s.Team)
                .FirstOrDefaultAsync(s => s.Id == existingSettings.Id);

            return Ok(MapToDto(updatedResult!));
        }

        var newSettings = new TeamDaySettings
        {
            Id = Guid.NewGuid(),
            TeamId = upsertDto.TeamId,
            WorkDate = upsertDto.WorkDate.Date,
            EarlyOtEnabled = upsertDto.EarlyOtEnabled,
            EarlyOtStartMinutes = upsertDto.EarlyOtStartMinutes,
            LateOtEnabled = upsertDto.LateOtEnabled,
            LateOtEndMinutes = upsertDto.LateOtEndMinutes,
            IsWorkingDay = upsertDto.IsWorkingDay,
            CreatedOn = DateTime.UtcNow
        };

        try
        {
            _context.TeamDaySettings.Add(newSettings);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created TeamDaySettings {Id} for team {TeamId} on {WorkDate}",
                newSettings.Id, newSettings.TeamId, newSettings.WorkDate);

            var result = await _context.TeamDaySettings
                .Include(s => s.Team)
                .FirstOrDefaultAsync(s => s.Id == newSettings.Id);

            return CreatedAtAction(nameof(GetByTeamAndDate), 
                new { teamId = newSettings.TeamId, dateStr = newSettings.WorkDate.ToString("yyyy-MM-dd") }, 
                MapToDto(result!));
        }
        catch (DbUpdateException ex) when (ex.InnerException is Npgsql.PostgresException pgEx && pgEx.SqlState == "23505")
        {
            _logger.LogInformation("Concurrent insert detected for team {TeamId} on {WorkDate}, retrying as update",
                upsertDto.TeamId, upsertDto.WorkDate);

            _context.Entry(newSettings).State = EntityState.Detached;

            var concurrentSettings = await _context.TeamDaySettings
                .FirstOrDefaultAsync(s => s.TeamId == upsertDto.TeamId && 
                    s.WorkDate >= workDateStart && s.WorkDate < workDateEnd);

            if (concurrentSettings != null)
            {
                concurrentSettings.EarlyOtEnabled = upsertDto.EarlyOtEnabled;
                concurrentSettings.EarlyOtStartMinutes = upsertDto.EarlyOtStartMinutes;
                concurrentSettings.LateOtEnabled = upsertDto.LateOtEnabled;
                concurrentSettings.LateOtEndMinutes = upsertDto.LateOtEndMinutes;
                concurrentSettings.IsWorkingDay = upsertDto.IsWorkingDay;
                concurrentSettings.ModifiedOn = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Updated (after retry) TeamDaySettings {Id} for team {TeamId} on {WorkDate}",
                    concurrentSettings.Id, concurrentSettings.TeamId, concurrentSettings.WorkDate);

                var retryResult = await _context.TeamDaySettings
                    .Include(s => s.Team)
                    .FirstOrDefaultAsync(s => s.Id == concurrentSettings.Id);

                return Ok(MapToDto(retryResult!));
            }

            return StatusCode(500, new { message = "Failed to upsert TeamDaySettings after retry" });
        }
    }

    private static TeamDaySettingsDto MapToDto(TeamDaySettings settings)
    {
        return new TeamDaySettingsDto
        {
            Id = settings.Id,
            TeamId = settings.TeamId,
            WorkDate = settings.WorkDate,
            EarlyOtEnabled = settings.EarlyOtEnabled,
            EarlyOtStartMinutes = settings.EarlyOtStartMinutes,
            LateOtEnabled = settings.LateOtEnabled,
            LateOtEndMinutes = settings.LateOtEndMinutes,
            IsWorkingDay = settings.IsWorkingDay,
            CreatedOn = settings.CreatedOn,
            ModifiedOn = settings.ModifiedOn,
            TeamName = settings.Team?.Name
        };
    }
}
