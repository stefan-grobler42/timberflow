using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class JobAllocationsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<JobAllocationsController> _logger;

    public JobAllocationsController(AppDbContext context, ILogger<JobAllocationsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<JobAllocationDto>>> GetAll(
        [FromQuery] Guid? teamId = null,
        [FromQuery] string? dateFrom = null,
        [FromQuery] string? dateTo = null,
        [FromQuery] string? status = null,
        [FromQuery] int? skip = null,
        [FromQuery] int? take = null)
    {
        var query = _context.JobAllocations
            .Include(a => a.Production)
            .Include(a => a.Team)
            .AsQueryable();

        if (teamId.HasValue)
        {
            query = query.Where(a => a.TeamId == teamId.Value);
        }

        if (!string.IsNullOrEmpty(dateFrom) && DateTime.TryParse(dateFrom, out var fromDate))
        {
            query = query.Where(a => a.SpanStartDate >= fromDate.Date || 
                (a.SpanEndDate.HasValue && a.SpanEndDate.Value >= fromDate.Date));
        }

        if (!string.IsNullOrEmpty(dateTo) && DateTime.TryParse(dateTo, out var toDate))
        {
            query = query.Where(a => a.SpanStartDate <= toDate.Date.AddDays(1));
        }

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(a => a.Status == status);
        }

        query = query.OrderBy(a => a.TeamId)
            .ThenBy(a => a.QueuePosition)
            .ThenBy(a => a.SpanStartDate);

        if (skip.HasValue)
        {
            query = query.Skip(skip.Value);
        }

        if (take.HasValue)
        {
            query = query.Take(take.Value);
        }

        var items = await query.ToListAsync();
        var dtos = items.Select(MapToDto).ToList();

        _logger.LogInformation("GetAll returned {Count} job allocations", dtos.Count);
        return Ok(dtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<JobAllocationDto>> GetById(Guid id)
    {
        var item = await _context.JobAllocations
            .Include(a => a.Production)
            .Include(a => a.Team)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (item == null)
        {
            return NotFound(new { message = $"JobAllocation with ID {id} not found" });
        }

        return Ok(MapToDto(item));
    }

    [HttpPost]
    public async Task<ActionResult<JobAllocationDto>> Create([FromBody] CreateJobAllocationDto createDto)
    {
        Production? production = null;
        string? orderNumber = createDto.OrderNumber;
        string? customerName = createDto.CustomerName;
        string? productionName = createDto.ProductionName;
        decimal estimatedEfinks = createDto.EstimatedEfinks;
        Guid? salesOrderId = createDto.SalesOrderId;

        if (createDto.ProductionId.HasValue)
        {
            production = await _context.Productions
                .Include(p => p.CustomerAccount)
                .Include(p => p.Order)
                .FirstOrDefaultAsync(p => p.Id == createDto.ProductionId.Value);

            if (production == null)
            {
                return BadRequest(new { message = $"Production with ID {createDto.ProductionId} not found" });
            }

            orderNumber ??= production.Order?.OrderNumber;
            customerName ??= production.CustomerAccount?.Name;
            productionName ??= production.Name;
            estimatedEfinks = createDto.EstimatedEfinks > 0 ? createDto.EstimatedEfinks : (production.NewEstimatedefinks ?? 0);
            salesOrderId ??= production.Orderno;
        }

        var team = await _context.Jigs.FindAsync(createDto.TeamId);
        if (team == null)
        {
            return BadRequest(new { message = $"Team (Jig) with ID {createDto.TeamId} not found" });
        }

        var allocation = new JobAllocation
        {
            Id = Guid.NewGuid(),
            ProductionId = createDto.ProductionId,
            TeamId = createDto.TeamId,
            OrderNumber = orderNumber,
            CustomerName = customerName,
            ProductionName = productionName,
            SiteAddress = createDto.SiteAddress,
            EstimatedEfinks = estimatedEfinks,
            EstimatedDurationMinutes = createDto.EstimatedDurationMinutes,
            SpanStartDate = createDto.SpanStartDate,
            SpanStartMinutes = createDto.SpanStartMinutes,
            SpanEndDate = createDto.SpanEndDate,
            SpanEndMinutes = createDto.SpanEndMinutes,
            QueuePosition = createDto.QueuePosition,
            Status = createDto.Status ?? "scheduled",
            SalesOrderId = salesOrderId,
            CreatedOn = DateTime.UtcNow
        };

        _context.JobAllocations.Add(allocation);

        if (production != null)
        {
            production.IsInWip = true;
            production.ModifiedOn = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Created JobAllocation {Id} for Production {ProductionId} on Team {TeamId}",
            allocation.Id, allocation.ProductionId, allocation.TeamId);

        var result = await _context.JobAllocations
            .Include(a => a.Production)
            .Include(a => a.Team)
            .FirstOrDefaultAsync(a => a.Id == allocation.Id);

        return CreatedAtAction(nameof(GetById), new { id = allocation.Id }, MapToDto(result!));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<JobAllocationDto>> Update(Guid id, [FromBody] UpdateJobAllocationDto updateDto)
    {
        var item = await _context.JobAllocations.FindAsync(id);

        if (item == null)
        {
            return NotFound(new { message = $"JobAllocation with ID {id} not found" });
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

        if (updateDto.OrderNumber != null) item.OrderNumber = updateDto.OrderNumber;
        if (updateDto.CustomerName != null) item.CustomerName = updateDto.CustomerName;
        if (updateDto.ProductionName != null) item.ProductionName = updateDto.ProductionName;
        if (updateDto.SiteAddress != null) item.SiteAddress = updateDto.SiteAddress;
        if (updateDto.EstimatedEfinks.HasValue) item.EstimatedEfinks = updateDto.EstimatedEfinks.Value;
        if (updateDto.EstimatedDurationMinutes.HasValue) item.EstimatedDurationMinutes = updateDto.EstimatedDurationMinutes.Value;
        if (updateDto.SpanStartDate.HasValue) item.SpanStartDate = updateDto.SpanStartDate.Value;
        if (updateDto.SpanStartMinutes.HasValue) item.SpanStartMinutes = updateDto.SpanStartMinutes.Value;
        if (updateDto.SpanEndDate.HasValue) item.SpanEndDate = updateDto.SpanEndDate;
        if (updateDto.SpanEndMinutes.HasValue) item.SpanEndMinutes = updateDto.SpanEndMinutes;
        if (updateDto.QueuePosition.HasValue) item.QueuePosition = updateDto.QueuePosition.Value;
        if (updateDto.Status != null) item.Status = updateDto.Status;
        if (updateDto.ActualEfinks.HasValue) item.ActualEfinks = updateDto.ActualEfinks;
        if (updateDto.ActualDurationMinutes.HasValue) item.ActualDurationMinutes = updateDto.ActualDurationMinutes;

        item.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated JobAllocation {Id}", id);

        var result = await _context.JobAllocations
            .Include(a => a.Production)
            .Include(a => a.Team)
            .FirstOrDefaultAsync(a => a.Id == id);

        return Ok(MapToDto(result!));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var item = await _context.JobAllocations
            .Include(a => a.Production)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (item == null)
        {
            return NotFound(new { message = $"JobAllocation with ID {id} not found" });
        }

        if (item.Production != null)
        {
            var otherAllocations = await _context.JobAllocations
                .Where(a => a.ProductionId == item.ProductionId && a.Id != id)
                .AnyAsync();

            if (!otherAllocations)
            {
                item.Production.IsInWip = false;
                item.Production.ModifiedOn = DateTime.UtcNow;
            }
        }

        var workLogs = await _context.JobWorkLogs
            .Where(l => l.AllocationId == id)
            .ToListAsync();
        _context.JobWorkLogs.RemoveRange(workLogs);

        _context.JobAllocations.Remove(item);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted JobAllocation {Id} and {LogCount} associated work logs", id, workLogs.Count);

        return NoContent();
    }

    [HttpPut("{id}/complete")]
    public async Task<ActionResult<JobAllocationDto>> Complete(Guid id, [FromBody] CompleteJobAllocationDto completeDto)
    {
        var item = await _context.JobAllocations
            .Include(a => a.Production)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (item == null)
        {
            return NotFound(new { message = $"JobAllocation with ID {id} not found" });
        }

        item.IsComplete = true;
        item.CompletedOn = DateTime.UtcNow;
        item.Status = "completed";
        item.ModifiedOn = DateTime.UtcNow;

        if (completeDto.ActualEfinks.HasValue)
        {
            item.ActualEfinks = completeDto.ActualEfinks;
        }

        if (completeDto.ActualDurationMinutes.HasValue)
        {
            item.ActualDurationMinutes = completeDto.ActualDurationMinutes;
        }

        if (item.Production != null)
        {
            item.Production.Productioncomplete = true;
            item.Production.ModifiedOn = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Completed JobAllocation {Id}", id);

        var result = await _context.JobAllocations
            .Include(a => a.Production)
            .Include(a => a.Team)
            .FirstOrDefaultAsync(a => a.Id == id);

        return Ok(MapToDto(result!));
    }

    [HttpPost("cascade")]
    public async Task<ActionResult<IEnumerable<JobAllocationDto>>> CascadeReschedule([FromBody] CascadeRescheduleDto cascadeDto)
    {
        var allocations = await _context.JobAllocations
            .Where(a => a.TeamId == cascadeDto.TeamId && a.QueuePosition > cascadeDto.AfterPosition)
            .OrderBy(a => a.QueuePosition)
            .ToListAsync();

        if (!allocations.Any())
        {
            return Ok(new List<JobAllocationDto>());
        }

        var currentDate = cascadeDto.StartDate;
        var currentMinutes = cascadeDto.StartMinutes;

        foreach (var allocation in allocations)
        {
            allocation.SpanStartDate = currentDate;
            allocation.SpanStartMinutes = currentMinutes;

            var endMinutes = currentMinutes + allocation.EstimatedDurationMinutes;
            var daysToAdd = endMinutes / (24 * 60);
            var remainingMinutes = endMinutes % (24 * 60);

            allocation.SpanEndDate = currentDate.AddDays(daysToAdd);
            allocation.SpanEndMinutes = remainingMinutes;
            allocation.ModifiedOn = DateTime.UtcNow;

            currentDate = allocation.SpanEndDate.Value;
            currentMinutes = allocation.SpanEndMinutes.Value;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Cascaded reschedule for {Count} allocations on team {TeamId} after position {AfterPosition}",
            allocations.Count, cascadeDto.TeamId, cascadeDto.AfterPosition);

        var results = await _context.JobAllocations
            .Include(a => a.Production)
            .Include(a => a.Team)
            .Where(a => a.TeamId == cascadeDto.TeamId && a.QueuePosition > cascadeDto.AfterPosition)
            .OrderBy(a => a.QueuePosition)
            .ToListAsync();

        return Ok(results.Select(MapToDto).ToList());
    }

    private static JobAllocationDto MapToDto(JobAllocation allocation)
    {
        return new JobAllocationDto
        {
            Id = allocation.Id,
            ProductionId = allocation.ProductionId,
            TeamId = allocation.TeamId,
            OrderNumber = allocation.OrderNumber,
            CustomerName = allocation.CustomerName,
            ProductionName = allocation.ProductionName,
            SiteAddress = allocation.SiteAddress,
            EstimatedEfinks = allocation.EstimatedEfinks,
            EstimatedDurationMinutes = allocation.EstimatedDurationMinutes,
            SpanStartDate = allocation.SpanStartDate,
            SpanStartMinutes = allocation.SpanStartMinutes,
            SpanEndDate = allocation.SpanEndDate,
            SpanEndMinutes = allocation.SpanEndMinutes,
            QueuePosition = allocation.QueuePosition,
            Status = allocation.Status,
            ActualEfinks = allocation.ActualEfinks,
            ActualDurationMinutes = allocation.ActualDurationMinutes,
            IsComplete = allocation.IsComplete,
            CompletedOn = allocation.CompletedOn,
            SalesOrderId = allocation.SalesOrderId,
            CreatedOn = allocation.CreatedOn,
            CreatedBy = allocation.CreatedBy,
            ModifiedOn = allocation.ModifiedOn,
            ModifiedBy = allocation.ModifiedBy,
            TeamName = allocation.Team?.Name
        };
    }
}
