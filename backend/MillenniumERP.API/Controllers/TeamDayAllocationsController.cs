using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TeamDayAllocationsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<TeamDayAllocationsController> _logger;

    public TeamDayAllocationsController(AppDbContext context, ILogger<TeamDayAllocationsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TeamDayAllocationDto>>> GetAll([FromQuery] Guid? teamDayId, [FromQuery] Guid? productionId)
    {
        var query = _context.TeamDayAllocations
            .Include(a => a.Production)
                .ThenInclude(p => p!.Order)
            .Include(a => a.Production)
                .ThenInclude(p => p!.CustomerAccount)
            .AsQueryable();

        if (teamDayId.HasValue)
        {
            query = query.Where(a => a.TeamDayId == teamDayId.Value);
        }

        if (productionId.HasValue)
        {
            query = query.Where(a => a.ProductionId == productionId.Value);
        }

        var allocations = await query
            .OrderBy(a => a.Sequence)
            .ToListAsync();

        var dtos = allocations.Select(MapToDto).ToList();
        return Ok(dtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TeamDayAllocationDto>> GetById(Guid id)
    {
        var allocation = await _context.TeamDayAllocations
            .Include(a => a.Production)
                .ThenInclude(p => p!.Order)
            .Include(a => a.Production)
                .ThenInclude(p => p!.CustomerAccount)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (allocation == null)
        {
            return NotFound(new { message = $"Allocation with ID {id} not found" });
        }

        return Ok(MapToDto(allocation));
    }

    [HttpGet("production/{productionId}")]
    public async Task<ActionResult<IEnumerable<TeamDayAllocationDto>>> GetByProduction(Guid productionId)
    {
        var allocations = await _context.TeamDayAllocations
            .Include(a => a.TeamDay)
            .Include(a => a.Production)
                .ThenInclude(p => p!.Order)
            .Include(a => a.Production)
                .ThenInclude(p => p!.CustomerAccount)
            .Where(a => a.ProductionId == productionId)
            .OrderBy(a => a.TeamDay!.WorkDate)
            .ThenBy(a => a.Sequence)
            .ToListAsync();

        var dtos = allocations.Select(MapToDto).ToList();
        return Ok(dtos);
    }

    [HttpPost]
    public async Task<ActionResult<TeamDayAllocationDto>> Create([FromBody] CreateAllocationDto createDto)
    {
        var teamDay = await _context.TeamDays.FindAsync(createDto.TeamDayId);
        if (teamDay == null)
        {
            return BadRequest(new { message = $"TeamDay with ID {createDto.TeamDayId} not found" });
        }

        if (teamDay.IsLocked)
        {
            return BadRequest(new { message = "Cannot add allocations to a locked TeamDay." });
        }

        var production = await _context.Productions.FindAsync(createDto.ProductionId);
        if (production == null)
        {
            return BadRequest(new { message = $"Production with ID {createDto.ProductionId} not found" });
        }

        var allocation = new TeamDayAllocation
        {
            Id = Guid.NewGuid(),
            TeamDayId = createDto.TeamDayId,
            ProductionId = createDto.ProductionId,
            Sequence = createDto.Sequence,
            AllocatedMinutes = createDto.AllocatedMinutes,
            StartMinutes = createDto.StartMinutes,
            OverflowFromAllocationId = createDto.OverflowFromAllocationId,
            Status = createDto.Status,
            IsRollover = createDto.IsRollover,
            CreatedOn = DateTime.UtcNow
        };

        _context.TeamDayAllocations.Add(allocation);

        teamDay.TotalAllocatedMinutes += allocation.AllocatedMinutes;
        teamDay.ModifiedOn = DateTime.UtcNow;

        production.JigId = teamDay.TeamId;
        production.Productionplanneddate = teamDay.WorkDate;
        production.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Created allocation {Id} for production {ProductionId} on TeamDay {TeamDayId}", 
            allocation.Id, allocation.ProductionId, allocation.TeamDayId);

        var result = await _context.TeamDayAllocations
            .Include(a => a.Production)
                .ThenInclude(p => p!.Order)
            .Include(a => a.Production)
                .ThenInclude(p => p!.CustomerAccount)
            .FirstAsync(a => a.Id == allocation.Id);

        return CreatedAtAction(nameof(GetById), new { id = allocation.Id }, MapToDto(result));
    }

    [HttpPost("bulk")]
    public async Task<ActionResult<TeamDayDto>> BulkAllocate([FromBody] BulkAllocateDto bulkDto)
    {
        var normalizedDate = bulkDto.WorkDate.Date;

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var teamDay = await _context.TeamDays
                .Include(td => td.Allocations)
                .FirstOrDefaultAsync(td => td.TeamId == bulkDto.TeamId && td.WorkDate.Date == normalizedDate);

            if (teamDay == null)
            {
                teamDay = new TeamDay
                {
                    Id = Guid.NewGuid(),
                    TeamId = bulkDto.TeamId,
                    WorkDate = normalizedDate,
                    BaseMinutes = 480,
                    OvertimeMinutes = 0,
                    TotalAllocatedMinutes = 0,
                    IsLocked = false,
                    OvertimeEnabled = bulkDto.OvertimeEnabled,
                    OvertimeCloseTime = bulkDto.OvertimeCloseTime,
                    CreatedOn = DateTime.UtcNow
                };
                _context.TeamDays.Add(teamDay);
            }
            else if (teamDay.IsLocked)
            {
                return BadRequest(new { message = "Cannot modify allocations for a locked TeamDay." });
            }

            if (teamDay.Allocations != null && teamDay.Allocations.Any())
            {
                _context.TeamDayAllocations.RemoveRange(teamDay.Allocations);
            }

            var newAllocations = new List<TeamDayAllocation>();
            int totalAllocated = 0;

            foreach (var item in bulkDto.Allocations)
            {
                var allocation = new TeamDayAllocation
                {
                    Id = Guid.NewGuid(),
                    TeamDayId = teamDay.Id,
                    ProductionId = item.ProductionId,
                    Sequence = item.Sequence,
                    AllocatedMinutes = item.AllocatedMinutes,
                    StartMinutes = item.StartMinutes,
                    Status = item.Status,
                    IsRollover = item.IsRollover,
                    CreatedOn = DateTime.UtcNow
                };
                newAllocations.Add(allocation);
                totalAllocated += item.AllocatedMinutes;

                var production = await _context.Productions.FindAsync(item.ProductionId);
                if (production != null)
                {
                    production.JigId = bulkDto.TeamId;
                    production.Productionplanneddate = normalizedDate;
                    production.ModifiedOn = DateTime.UtcNow;
                }
            }

            _context.TeamDayAllocations.AddRange(newAllocations);
            
            teamDay.TotalAllocatedMinutes = totalAllocated;
            teamDay.OvertimeEnabled = bulkDto.OvertimeEnabled;
            teamDay.OvertimeCloseTime = bulkDto.OvertimeCloseTime;
            teamDay.ModifiedOn = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation("Bulk allocated {Count} jobs for team {TeamId} on {Date}", 
                newAllocations.Count, bulkDto.TeamId, bulkDto.WorkDate);

            var result = await _context.TeamDays
                .Include(td => td.Team)
                .Include(td => td.Allocations!)
                    .ThenInclude(a => a.Production)
                        .ThenInclude(p => p!.Order)
                .Include(td => td.Allocations!)
                    .ThenInclude(a => a.Production)
                        .ThenInclude(p => p!.CustomerAccount)
                .FirstAsync(td => td.Id == teamDay.Id);

            return Ok(MapTeamDayToDto(result));
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Failed to bulk allocate jobs for team {TeamId} on {Date}", bulkDto.TeamId, bulkDto.WorkDate);
            throw;
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TeamDayAllocationDto>> Update(Guid id, [FromBody] UpdateAllocationDto updateDto)
    {
        var allocation = await _context.TeamDayAllocations
            .Include(a => a.TeamDay)
            .Include(a => a.Production)
                .ThenInclude(p => p!.Order)
            .Include(a => a.Production)
                .ThenInclude(p => p!.CustomerAccount)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (allocation == null)
        {
            return NotFound(new { message = $"Allocation with ID {id} not found" });
        }

        if (allocation.TeamDay!.IsLocked)
        {
            return BadRequest(new { message = "Cannot modify allocation on a locked TeamDay." });
        }

        var oldMinutes = allocation.AllocatedMinutes;

        if (updateDto.Sequence.HasValue) allocation.Sequence = updateDto.Sequence.Value;
        if (updateDto.AllocatedMinutes.HasValue) allocation.AllocatedMinutes = updateDto.AllocatedMinutes.Value;
        if (updateDto.StartMinutes.HasValue) allocation.StartMinutes = updateDto.StartMinutes.Value;
        if (updateDto.OverflowToAllocationId.HasValue) allocation.OverflowToAllocationId = updateDto.OverflowToAllocationId;
        if (updateDto.Status != null) allocation.Status = updateDto.Status;

        allocation.ModifiedOn = DateTime.UtcNow;

        if (updateDto.AllocatedMinutes.HasValue && updateDto.AllocatedMinutes.Value != oldMinutes)
        {
            allocation.TeamDay.TotalAllocatedMinutes += (updateDto.AllocatedMinutes.Value - oldMinutes);
            allocation.TeamDay.ModifiedOn = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated allocation {Id}", id);

        return Ok(MapToDto(allocation));
    }

    [HttpPut("reorder")]
    public async Task<ActionResult> ReorderAllocations([FromBody] List<ReorderAllocationDto> reorderDtos)
    {
        foreach (var item in reorderDtos)
        {
            var allocation = await _context.TeamDayAllocations
                .Include(a => a.TeamDay)
                .FirstOrDefaultAsync(a => a.Id == item.AllocationId);

            if (allocation == null) continue;
            if (allocation.TeamDay!.IsLocked)
            {
                return BadRequest(new { message = $"Cannot reorder allocation {item.AllocationId} - TeamDay is locked." });
            }

            allocation.Sequence = item.Sequence;
            allocation.StartMinutes = item.StartMinutes;
            allocation.ModifiedOn = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Reordered {Count} allocations", reorderDtos.Count);

        return Ok(new { message = $"Reordered {reorderDtos.Count} allocations" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var allocation = await _context.TeamDayAllocations
            .Include(a => a.TeamDay)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (allocation == null)
        {
            return NotFound(new { message = $"Allocation with ID {id} not found" });
        }

        if (allocation.TeamDay!.IsLocked)
        {
            return BadRequest(new { message = "Cannot delete allocation from a locked TeamDay." });
        }

        allocation.TeamDay.TotalAllocatedMinutes -= allocation.AllocatedMinutes;
        allocation.TeamDay.ModifiedOn = DateTime.UtcNow;

        _context.TeamDayAllocations.Remove(allocation);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted allocation {Id}", id);

        return NoContent();
    }

    [HttpDelete("team-day/{teamDayId}")]
    public async Task<IActionResult> DeleteByTeamDay(Guid teamDayId)
    {
        var teamDay = await _context.TeamDays
            .Include(td => td.Allocations)
            .FirstOrDefaultAsync(td => td.Id == teamDayId);

        if (teamDay == null)
        {
            return NotFound(new { message = $"TeamDay with ID {teamDayId} not found" });
        }

        if (teamDay.IsLocked)
        {
            return BadRequest(new { message = "Cannot delete allocations from a locked TeamDay." });
        }

        if (teamDay.Allocations != null && teamDay.Allocations.Any())
        {
            _context.TeamDayAllocations.RemoveRange(teamDay.Allocations);
            teamDay.TotalAllocatedMinutes = 0;
            teamDay.ModifiedOn = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        _logger.LogInformation("Deleted all allocations for TeamDay {Id}", teamDayId);

        return NoContent();
    }

    [HttpDelete("production/{productionId}")]
    public async Task<IActionResult> DeleteByProduction(Guid productionId)
    {
        var allocations = await _context.TeamDayAllocations
            .Include(a => a.TeamDay)
            .Where(a => a.ProductionId == productionId)
            .ToListAsync();

        if (!allocations.Any())
        {
            return NoContent();
        }

        foreach (var allocation in allocations)
        {
            if (allocation.TeamDay != null && !allocation.TeamDay.IsLocked)
            {
                allocation.TeamDay.TotalAllocatedMinutes -= allocation.AllocatedMinutes;
                allocation.TeamDay.ModifiedOn = DateTime.UtcNow;
            }
        }

        _context.TeamDayAllocations.RemoveRange(allocations);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted {Count} allocations for production {ProductionId}", allocations.Count, productionId);

        return NoContent();
    }

    private TeamDayAllocationDto MapToDto(TeamDayAllocation allocation)
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

    private TeamDayDto MapTeamDayToDto(TeamDay teamDay)
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
            Allocations = teamDay.Allocations?.Select(MapToDto).ToList()
        };
    }
}

public class ReorderAllocationDto
{
    public Guid AllocationId { get; set; }
    public int Sequence { get; set; }
    public int StartMinutes { get; set; }
}
