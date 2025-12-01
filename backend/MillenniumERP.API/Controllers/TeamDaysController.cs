using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TeamDaysController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<TeamDaysController> _logger;

    public TeamDaysController(AppDbContext context, ILogger<TeamDaysController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TeamDayDto>>> GetAll([FromQuery] Guid? teamId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var query = _context.TeamDays
            .Include(td => td.Team)
            .Include(td => td.Allocations!)
                .ThenInclude(a => a.Production)
            .AsQueryable();

        if (teamId.HasValue)
        {
            query = query.Where(td => td.TeamId == teamId.Value);
        }

        if (startDate.HasValue)
        {
            query = query.Where(td => td.WorkDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(td => td.WorkDate <= endDate.Value);
        }

        var teamDays = await query
            .OrderBy(td => td.TeamId)
            .ThenBy(td => td.WorkDate)
            .ToListAsync();

        var dtos = teamDays.Select(MapToDto).ToList();
        return Ok(dtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TeamDayDto>> GetById(Guid id)
    {
        var teamDay = await _context.TeamDays
            .Include(td => td.Team)
            .Include(td => td.Allocations!)
                .ThenInclude(a => a.Production)
            .FirstOrDefaultAsync(td => td.Id == id);

        if (teamDay == null)
        {
            return NotFound(new { message = $"TeamDay with ID {id} not found" });
        }

        return Ok(MapToDto(teamDay));
    }

    [HttpGet("team/{teamId}/date/{date}")]
    public async Task<ActionResult<TeamDayDto>> GetByTeamAndDate(Guid teamId, DateTime date)
    {
        var normalizedDate = date.Date;
        var teamDay = await _context.TeamDays
            .Include(td => td.Team)
            .Include(td => td.Allocations!)
                .ThenInclude(a => a.Production)
            .FirstOrDefaultAsync(td => td.TeamId == teamId && td.WorkDate.Date == normalizedDate);

        if (teamDay == null)
        {
            return NotFound(new { message = $"No TeamDay found for team {teamId} on {date:yyyy-MM-dd}" });
        }

        return Ok(MapToDto(teamDay));
    }

    [HttpPost]
    public async Task<ActionResult<TeamDayDto>> Create([FromBody] CreateTeamDayDto createDto)
    {
        var normalizedDate = createDto.WorkDate.Date;
        
        var existing = await _context.TeamDays
            .FirstOrDefaultAsync(td => td.TeamId == createDto.TeamId && td.WorkDate.Date == normalizedDate);

        if (existing != null)
        {
            return Conflict(new { message = $"TeamDay already exists for team {createDto.TeamId} on {createDto.WorkDate:yyyy-MM-dd}" });
        }

        var teamDay = new TeamDay
        {
            Id = Guid.NewGuid(),
            TeamId = createDto.TeamId,
            WorkDate = normalizedDate,
            BaseMinutes = createDto.BaseMinutes,
            OvertimeMinutes = createDto.OvertimeMinutes,
            TotalAllocatedMinutes = 0,
            IsLocked = false,
            OvertimeEnabled = createDto.OvertimeEnabled,
            OvertimeCloseTime = createDto.OvertimeCloseTime,
            CreatedOn = DateTime.UtcNow
        };

        _context.TeamDays.Add(teamDay);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created TeamDay {Id} for team {TeamId} on {Date}", teamDay.Id, teamDay.TeamId, teamDay.WorkDate);

        return CreatedAtAction(nameof(GetById), new { id = teamDay.Id }, MapToDto(teamDay));
    }

    [HttpPost("ensure")]
    public async Task<ActionResult<TeamDayDto>> EnsureTeamDay([FromBody] CreateTeamDayDto createDto)
    {
        var normalizedDate = createDto.WorkDate.Date;
        
        var existing = await _context.TeamDays
            .Include(td => td.Team)
            .Include(td => td.Allocations!)
                .ThenInclude(a => a.Production)
            .FirstOrDefaultAsync(td => td.TeamId == createDto.TeamId && td.WorkDate.Date == normalizedDate);

        if (existing != null)
        {
            return Ok(MapToDto(existing));
        }

        var teamDay = new TeamDay
        {
            Id = Guid.NewGuid(),
            TeamId = createDto.TeamId,
            WorkDate = normalizedDate,
            BaseMinutes = createDto.BaseMinutes,
            OvertimeMinutes = createDto.OvertimeMinutes,
            TotalAllocatedMinutes = 0,
            IsLocked = false,
            OvertimeEnabled = createDto.OvertimeEnabled,
            OvertimeCloseTime = createDto.OvertimeCloseTime,
            CreatedOn = DateTime.UtcNow
        };

        _context.TeamDays.Add(teamDay);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Ensured TeamDay {Id} for team {TeamId} on {Date}", teamDay.Id, teamDay.TeamId, teamDay.WorkDate);

        return CreatedAtAction(nameof(GetById), new { id = teamDay.Id }, MapToDto(teamDay));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TeamDayDto>> Update(Guid id, [FromBody] UpdateTeamDayDto updateDto)
    {
        var teamDay = await _context.TeamDays
            .Include(td => td.Team)
            .Include(td => td.Allocations!)
                .ThenInclude(a => a.Production)
            .FirstOrDefaultAsync(td => td.Id == id);

        if (teamDay == null)
        {
            return NotFound(new { message = $"TeamDay with ID {id} not found" });
        }

        if (teamDay.IsLocked && !(updateDto.IsLocked == false))
        {
            return BadRequest(new { message = "Cannot modify a locked TeamDay. Unlock it first." });
        }

        if (updateDto.BaseMinutes.HasValue) teamDay.BaseMinutes = updateDto.BaseMinutes.Value;
        if (updateDto.OvertimeMinutes.HasValue) teamDay.OvertimeMinutes = updateDto.OvertimeMinutes.Value;
        if (updateDto.IsLocked.HasValue) teamDay.IsLocked = updateDto.IsLocked.Value;
        if (updateDto.OvertimeEnabled.HasValue) teamDay.OvertimeEnabled = updateDto.OvertimeEnabled.Value;
        if (updateDto.OvertimeCloseTime != null) teamDay.OvertimeCloseTime = updateDto.OvertimeCloseTime;

        teamDay.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated TeamDay {Id}: OvertimeEnabled={Overtime}, OvertimeMinutes={Minutes}", 
            teamDay.Id, teamDay.OvertimeEnabled, teamDay.OvertimeMinutes);

        return Ok(MapToDto(teamDay));
    }

    [HttpPut("{id}/overtime")]
    public async Task<ActionResult<TeamDayDto>> UpdateOvertime(Guid id, [FromBody] UpdateTeamDayDto updateDto)
    {
        var teamDay = await _context.TeamDays
            .Include(td => td.Team)
            .Include(td => td.Allocations!)
                .ThenInclude(a => a.Production)
            .FirstOrDefaultAsync(td => td.Id == id);

        if (teamDay == null)
        {
            return NotFound(new { message = $"TeamDay with ID {id} not found" });
        }

        if (teamDay.IsLocked)
        {
            return BadRequest(new { message = "Cannot modify overtime for a locked TeamDay." });
        }

        if (updateDto.OvertimeEnabled.HasValue) teamDay.OvertimeEnabled = updateDto.OvertimeEnabled.Value;
        if (updateDto.OvertimeMinutes.HasValue) teamDay.OvertimeMinutes = updateDto.OvertimeMinutes.Value;
        if (updateDto.OvertimeCloseTime != null) teamDay.OvertimeCloseTime = updateDto.OvertimeCloseTime;

        teamDay.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated TeamDay overtime {Id}: OvertimeEnabled={Overtime}, OvertimeMinutes={Minutes}, CloseTime={CloseTime}", 
            teamDay.Id, teamDay.OvertimeEnabled, teamDay.OvertimeMinutes, teamDay.OvertimeCloseTime);

        return Ok(MapToDto(teamDay));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var teamDay = await _context.TeamDays.FindAsync(id);

        if (teamDay == null)
        {
            return NotFound(new { message = $"TeamDay with ID {id} not found" });
        }

        if (teamDay.IsLocked)
        {
            return BadRequest(new { message = "Cannot delete a locked TeamDay." });
        }

        _context.TeamDays.Remove(teamDay);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted TeamDay {Id}", id);

        return NoContent();
    }

    private TeamDayDto MapToDto(TeamDay teamDay)
    {
        return new TeamDayDto
        {
            Id = teamDay.Id,
            TeamId = teamDay.TeamId,
            TeamName = teamDay.Team?.Name,
            WorkDate = teamDay.WorkDate,
            BaseMinutes = teamDay.BaseMinutes,
            OvertimeMinutes = teamDay.OvertimeMinutes,
            TotalAllocatedMinutes = teamDay.TotalAllocatedMinutes,
            IsLocked = teamDay.IsLocked,
            OvertimeEnabled = teamDay.OvertimeEnabled,
            OvertimeCloseTime = teamDay.OvertimeCloseTime,
            CreatedOn = teamDay.CreatedOn,
            CreatedBy = teamDay.CreatedBy,
            ModifiedOn = teamDay.ModifiedOn,
            ModifiedBy = teamDay.ModifiedBy,
            Allocations = teamDay.Allocations?.Select(MapAllocationToDto).ToList()
        };
    }

    private TeamDayAllocationDto MapAllocationToDto(TeamDayAllocation allocation)
    {
        return new TeamDayAllocationDto
        {
            Id = allocation.Id,
            TeamDayId = allocation.TeamDayId,
            ProductionId = allocation.ProductionId,
            ProductionName = allocation.Production?.Name,
            OrderNumber = allocation.Production?.Order?.OrderNumber,
            CustomerName = allocation.Production?.CustomerAccount?.Name,
            Sequence = allocation.Sequence,
            AllocatedMinutes = allocation.AllocatedMinutes,
            StartMinutes = allocation.StartMinutes,
            OverflowToAllocationId = allocation.OverflowToAllocationId,
            OverflowFromAllocationId = allocation.OverflowFromAllocationId,
            Status = allocation.Status,
            IsRollover = allocation.IsRollover,
            CreatedOn = allocation.CreatedOn,
            CreatedBy = allocation.CreatedBy,
            ModifiedOn = allocation.ModifiedOn,
            ModifiedBy = allocation.ModifiedBy
        };
    }
}
