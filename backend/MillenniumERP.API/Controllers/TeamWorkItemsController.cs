using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TeamWorkItemsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<TeamWorkItemsController> _logger;

    public TeamWorkItemsController(AppDbContext context, ILogger<TeamWorkItemsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TeamWorkItemDto>>> GetAll(
        [FromQuery] Guid? teamId = null,
        [FromQuery] string? workDate = null,
        [FromQuery] string? status = null,
        [FromQuery] string? dateFrom = null,
        [FromQuery] string? dateTo = null)
    {
        var query = _context.TeamWorkItems
            .Include(w => w.Production)
                .ThenInclude(p => p!.CustomerAccount)
            .Include(w => w.Production)
                .ThenInclude(p => p!.Order)
            .Include(w => w.Team)
            .AsQueryable();

        if (teamId.HasValue)
        {
            query = query.Where(w => w.TeamId == teamId.Value);
        }

        if (!string.IsNullOrEmpty(workDate) && DateTime.TryParse(workDate, out var parsedWorkDate))
        {
            var startOfDay = parsedWorkDate.Date;
            var endOfDay = startOfDay.AddDays(1);
            query = query.Where(w => w.WorkDate >= startOfDay && w.WorkDate < endOfDay);
        }

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(w => w.Status == status);
        }

        if (!string.IsNullOrEmpty(dateFrom) && DateTime.TryParse(dateFrom, out var fromDate))
        {
            query = query.Where(w => w.WorkDate >= fromDate.Date);
        }

        if (!string.IsNullOrEmpty(dateTo) && DateTime.TryParse(dateTo, out var toDate))
        {
            query = query.Where(w => w.WorkDate < toDate.Date.AddDays(1));
        }

        var items = await query
            .OrderBy(w => w.WorkDate)
            .ThenBy(w => w.TeamId)
            .ThenBy(w => w.Sequence)
            .ToListAsync();

        var dtos = items.Select(MapToDto).ToList();
        return Ok(dtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TeamWorkItemDto>> GetById(Guid id)
    {
        var item = await _context.TeamWorkItems
            .Include(w => w.Production)
                .ThenInclude(p => p!.CustomerAccount)
            .Include(w => w.Production)
                .ThenInclude(p => p!.Order)
            .Include(w => w.Team)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (item == null)
        {
            return NotFound(new { message = $"TeamWorkItem with ID {id} not found" });
        }

        return Ok(MapToDto(item));
    }

    [HttpGet("team/{teamId}/date/{dateStr}")]
    public async Task<ActionResult<IEnumerable<TeamWorkItemDto>>> GetByTeamAndDate(Guid teamId, string dateStr)
    {
        if (!DateTime.TryParse(dateStr, out var workDate))
        {
            return BadRequest(new { message = "Invalid date format. Use yyyy-MM-dd" });
        }

        var startOfDay = workDate.Date;
        var endOfDay = startOfDay.AddDays(1);

        var items = await _context.TeamWorkItems
            .Include(w => w.Production)
                .ThenInclude(p => p!.CustomerAccount)
            .Include(w => w.Production)
                .ThenInclude(p => p!.Order)
            .Include(w => w.Team)
            .Where(w => w.TeamId == teamId && w.WorkDate >= startOfDay && w.WorkDate < endOfDay)
            .OrderBy(w => w.Sequence)
            .ToListAsync();

        var dtos = items.Select(MapToDto).ToList();
        return Ok(dtos);
    }

    [HttpGet("unallocated")]
    public async Task<ActionResult<IEnumerable<ProductionPlannerDto>>> GetUnallocated(
        [FromQuery] string? dateFrom = null,
        [FromQuery] string? dateTo = null)
    {
        var allocatedProductionIds = await _context.TeamWorkItems
            .Select(w => w.ProductionId)
            .Distinct()
            .ToListAsync();

        var query = _context.Productions
            .AsNoTracking()
            .Include(p => p.Order)
            .Include(p => p.CustomerAccount)
            .Where(p => !allocatedProductionIds.Contains(p.Id))
            .Where(p => p.Productioncomplete != true);

        if (!string.IsNullOrEmpty(dateFrom) && DateTime.TryParse(dateFrom, out var fromDate))
        {
            query = query.Where(p => p.Productionplanneddate == null || p.Productionplanneddate >= fromDate);
        }

        if (!string.IsNullOrEmpty(dateTo) && DateTime.TryParse(dateTo, out var toDate))
        {
            query = query.Where(p => p.Productionplanneddate == null || p.Productionplanneddate <= toDate);
        }

        var productions = await query
            .Select(p => new ProductionPlannerDto
            {
                Id = p.Id,
                Name = p.Name ?? string.Empty,
                CustomerName = p.CustomerAccount != null ? p.CustomerAccount.Name : null,
                OrderNo = p.Orderno,
                OrderNumber = p.Order != null ? p.Order.OrderNumber : null,
                ProductionComplete = p.Productioncomplete,
                ProductionPlannedDate = p.Productionplanneddate,
                NewEstimateDefinks = p.NewEstimatedefinks,
                CustomDurationMinutes = p.CustomDurationMinutes,
                ParentProductionId = p.ParentProductionId,
                RolloverSequence = p.RolloverSequence,
                JigId = p.JigId,
                PlannedStartTime = p.PlannedStartTime,
                PlannedEndTime = p.PlannedEndTime,
                PlannedDurationMinutes = p.PlannedDurationMinutes,
                BreakAdjustmentMinutes = p.BreakAdjustmentMinutes,
                CreatedOn = p.CreatedOn
            })
            .ToListAsync();

        _logger.LogInformation("Unallocated endpoint returned {Count} productions", productions.Count);
        return Ok(productions);
    }

    [HttpPost]
    public async Task<ActionResult<TeamWorkItemDto>> Create([FromBody] CreateTeamWorkItemDto createDto)
    {
        var production = await _context.Productions.FindAsync(createDto.ProductionId);
        if (production == null)
        {
            return BadRequest(new { message = $"Production with ID {createDto.ProductionId} not found" });
        }

        var team = await _context.Jigs.FindAsync(createDto.TeamId);
        if (team == null)
        {
            return BadRequest(new { message = $"Team (Jig) with ID {createDto.TeamId} not found" });
        }

        var item = new TeamWorkItem
        {
            Id = Guid.NewGuid(),
            ProductionId = createDto.ProductionId,
            TeamId = createDto.TeamId,
            WorkDate = createDto.WorkDate,
            Sequence = createDto.Sequence,
            PlannedStartMinutes = createDto.PlannedStartMinutes,
            PlannedEndMinutes = createDto.PlannedEndMinutes,
            PlannedDurationMinutes = createDto.PlannedDurationMinutes,
            BreakAdjustmentMinutes = createDto.BreakAdjustmentMinutes,
            Status = createDto.Status ?? "scheduled",
            ParentWipId = createDto.ParentWipId,
            RolloverSequence = createDto.RolloverSequence,
            SpilloverMinutes = createDto.SpilloverMinutes,
            OvertimeEnabled = createDto.OvertimeEnabled,
            EarlyOvertimeEnabled = createDto.EarlyOvertimeEnabled,
            TimberCubes = createDto.TimberCubes,
            TotalCuts = createDto.TotalCuts,
            CreatedOn = DateTime.UtcNow
        };

        _context.TeamWorkItems.Add(item);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created TeamWorkItem {Id} for Production {ProductionId} on Team {TeamId}", 
            item.Id, item.ProductionId, item.TeamId);

        var result = await _context.TeamWorkItems
            .Include(w => w.Production)
                .ThenInclude(p => p!.CustomerAccount)
            .Include(w => w.Production)
                .ThenInclude(p => p!.Order)
            .Include(w => w.Team)
            .FirstOrDefaultAsync(w => w.Id == item.Id);

        return CreatedAtAction(nameof(GetById), new { id = item.Id }, MapToDto(result!));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TeamWorkItemDto>> Update(Guid id, [FromBody] UpdateTeamWorkItemDto updateDto)
    {
        var item = await _context.TeamWorkItems.FindAsync(id);

        if (item == null)
        {
            return NotFound(new { message = $"TeamWorkItem with ID {id} not found" });
        }

        if (updateDto.TeamId.HasValue)
        {
            var team = await _context.Jigs.FindAsync(updateDto.TeamId.Value);
            if (team == null)
            {
                return BadRequest(new { message = $"Team (Jig) with ID {updateDto.TeamId.Value} not found" });
            }
            item.TeamId = updateDto.TeamId.Value;
        }

        if (updateDto.WorkDate.HasValue) item.WorkDate = updateDto.WorkDate.Value;
        if (updateDto.Sequence.HasValue) item.Sequence = updateDto.Sequence.Value;
        if (updateDto.PlannedStartMinutes.HasValue) item.PlannedStartMinutes = updateDto.PlannedStartMinutes.Value;
        if (updateDto.PlannedEndMinutes.HasValue) item.PlannedEndMinutes = updateDto.PlannedEndMinutes.Value;
        if (updateDto.PlannedDurationMinutes.HasValue) item.PlannedDurationMinutes = updateDto.PlannedDurationMinutes.Value;
        if (updateDto.BreakAdjustmentMinutes.HasValue) item.BreakAdjustmentMinutes = updateDto.BreakAdjustmentMinutes.Value;
        if (updateDto.ActualStartTime.HasValue) item.ActualStartTime = updateDto.ActualStartTime;
        if (updateDto.ActualEndTime.HasValue) item.ActualEndTime = updateDto.ActualEndTime;
        if (updateDto.ActualDurationMinutes.HasValue) item.ActualDurationMinutes = updateDto.ActualDurationMinutes;
        if (updateDto.Status != null) item.Status = updateDto.Status;
        if (updateDto.ParentWipId.HasValue) item.ParentWipId = updateDto.ParentWipId;
        if (updateDto.RolloverSequence.HasValue) item.RolloverSequence = updateDto.RolloverSequence.Value;
        if (updateDto.SpilloverMinutes.HasValue) item.SpilloverMinutes = updateDto.SpilloverMinutes;
        if (updateDto.OvertimeEnabled.HasValue) item.OvertimeEnabled = updateDto.OvertimeEnabled.Value;
        if (updateDto.EarlyOvertimeEnabled.HasValue) item.EarlyOvertimeEnabled = updateDto.EarlyOvertimeEnabled.Value;
        if (updateDto.TimberCubes.HasValue) item.TimberCubes = updateDto.TimberCubes;
        if (updateDto.TotalCuts.HasValue) item.TotalCuts = updateDto.TotalCuts;
        if (updateDto.ActualEfinks.HasValue) item.ActualEfinks = updateDto.ActualEfinks;
        if (updateDto.PickingComplete.HasValue) item.PickingComplete = updateDto.PickingComplete.Value;
        if (updateDto.SawingComplete.HasValue) item.SawingComplete = updateDto.SawingComplete.Value;
        if (updateDto.JiggingComplete.HasValue) item.JiggingComplete = updateDto.JiggingComplete.Value;
        if (updateDto.NeedsVerification.HasValue) item.NeedsVerification = updateDto.NeedsVerification.Value;

        item.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated TeamWorkItem {Id}", item.Id);

        var result = await _context.TeamWorkItems
            .Include(w => w.Production)
                .ThenInclude(p => p!.CustomerAccount)
            .Include(w => w.Production)
                .ThenInclude(p => p!.Order)
            .Include(w => w.Team)
            .FirstOrDefaultAsync(w => w.Id == item.Id);

        return Ok(MapToDto(result!));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await _context.TeamWorkItems.FindAsync(id);

        if (item == null)
        {
            return NotFound(new { message = $"TeamWorkItem with ID {id} not found" });
        }

        _context.TeamWorkItems.Remove(item);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted TeamWorkItem {Id} (Production {ProductionId} returned to unallocated pool)", 
            id, item.ProductionId);

        return NoContent();
    }

    [HttpPost("{id}/complete")]
    public async Task<ActionResult<TeamWorkItemDto>> Complete(Guid id, [FromBody] CompleteTeamWorkItemDto completeDto)
    {
        var item = await _context.TeamWorkItems
            .Include(w => w.Production)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (item == null)
        {
            return NotFound(new { message = $"TeamWorkItem with ID {id} not found" });
        }

        item.Status = completeDto.NeedsVerification ? "needs_verification" : "completed";
        item.ActualStartTime = completeDto.ActualStartTime;
        item.ActualEndTime = completeDto.ActualEndTime;
        item.ActualDurationMinutes = completeDto.ActualDurationMinutes;
        item.ActualEfinks = completeDto.ActualEfinks;
        item.TimberCubes = completeDto.TimberCubes;
        item.TotalCuts = completeDto.TotalCuts;
        item.NeedsVerification = completeDto.NeedsVerification;
        item.PickingComplete = true;
        item.SawingComplete = true;
        item.JiggingComplete = true;
        item.ModifiedOn = DateTime.UtcNow;

        if (item.Production != null)
        {
            if (completeDto.ActualStartTime.HasValue)
                item.Production.Jigstart = completeDto.ActualStartTime;
            if (completeDto.ActualEndTime.HasValue)
                item.Production.Jigend = completeDto.ActualEndTime;
            if (completeDto.TimberCubes.HasValue)
                item.Production.Totaltimbercubes = completeDto.TimberCubes;
            if (completeDto.TotalCuts.HasValue)
                item.Production.Totalcuts = completeDto.TotalCuts;
            if (completeDto.ActualEfinks.HasValue)
                item.Production.Workunitsefinks = completeDto.ActualEfinks;
            
            if (!completeDto.NeedsVerification)
            {
                item.Production.Productioncomplete = true;
            }
            
            item.Production.ModifiedOn = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Completed TeamWorkItem {Id} (Status: {Status})", 
            id, item.Status);

        var result = await _context.TeamWorkItems
            .Include(w => w.Production)
                .ThenInclude(p => p!.CustomerAccount)
            .Include(w => w.Production)
                .ThenInclude(p => p!.Order)
            .Include(w => w.Team)
            .FirstOrDefaultAsync(w => w.Id == item.Id);

        return Ok(MapToDto(result!));
    }

    private static TeamWorkItemDto MapToDto(TeamWorkItem item)
    {
        return new TeamWorkItemDto
        {
            Id = item.Id,
            ProductionId = item.ProductionId,
            TeamId = item.TeamId,
            WorkDate = item.WorkDate,
            Sequence = item.Sequence,
            PlannedStartMinutes = item.PlannedStartMinutes,
            PlannedEndMinutes = item.PlannedEndMinutes,
            PlannedDurationMinutes = item.PlannedDurationMinutes,
            BreakAdjustmentMinutes = item.BreakAdjustmentMinutes,
            ActualStartTime = item.ActualStartTime,
            ActualEndTime = item.ActualEndTime,
            ActualDurationMinutes = item.ActualDurationMinutes,
            Status = item.Status,
            ParentWipId = item.ParentWipId,
            RolloverSequence = item.RolloverSequence,
            SpilloverMinutes = item.SpilloverMinutes,
            OvertimeEnabled = item.OvertimeEnabled,
            EarlyOvertimeEnabled = item.EarlyOvertimeEnabled,
            TimberCubes = item.TimberCubes,
            TotalCuts = item.TotalCuts,
            ActualEfinks = item.ActualEfinks,
            PickingComplete = item.PickingComplete,
            SawingComplete = item.SawingComplete,
            JiggingComplete = item.JiggingComplete,
            NeedsVerification = item.NeedsVerification,
            CreatedOn = item.CreatedOn,
            CreatedBy = item.CreatedBy,
            ModifiedOn = item.ModifiedOn,
            ModifiedBy = item.ModifiedBy,
            ProductionName = item.Production?.Name,
            TeamName = item.Team?.Name,
            CustomerName = item.Production?.CustomerAccount?.Name,
            OrderNumber = item.Production?.Order?.OrderNumber,
            EstimatedEfinks = item.Production?.NewEstimatedefinks
        };
    }
}
