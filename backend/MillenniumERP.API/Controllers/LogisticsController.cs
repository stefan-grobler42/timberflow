using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LogisticsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<LogisticsController> _logger;

    public LogisticsController(AppDbContext context, ILogger<LogisticsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<LogisticsDto>>> GetAll([FromQuery] bool? completedOnly = null)
    {
        var query = _context.Logistics.AsQueryable();

        if (completedOnly == true)
        {
            query = query.Where(l => l.NewLoadcompleted == true);
        }

        var logistics = await query
            .OrderBy(l => l.Deliveryno)
            .ToListAsync();

        var logisticsDtos = logistics.Select(MapToDto).ToList();
        return Ok(logisticsDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<LogisticsDto>> GetById(Guid id)
    {
        var logistic = await _context.Logistics.FindAsync(id);

        if (logistic == null)
        {
            return NotFound(new { message = $"Logistics record with ID {id} not found" });
        }

        return Ok(MapToDto(logistic));
    }

    [HttpPost]
    public async Task<ActionResult<LogisticsDto>> Create([FromBody] CreateLogisticsDto createDto)
    {
        var logistic = new Logistics
        {
            Id = Guid.NewGuid(),
            Deliveryno = createDto.DeliveryNo,
            Description = createDto.Description,
            Dispatchmanager = createDto.DispatchManager,
            Driver = createDto.Driver,
            Helper1 = createDto.Helper1,
            Helper2 = createDto.Helper2,
            Helper3 = createDto.Helper3,
            Helper4 = createDto.Helper4,
            Helper5 = createDto.Helper5,
            Loadmaster = createDto.LoadMaster,
            Security = createDto.Security,
            Trailer = createDto.Trailer,
            Vehicle = createDto.Vehicle,
            Plannedloaddate = createDto.PlannedLoadDate,
            NewKmstravelled = createDto.NewKmsTravelled,
            NewLoadcompleted = createDto.NewLoadCompleted,
            NewLoadduration = createDto.NewLoadDuration,
            CreatedOn = DateTime.UtcNow
        };

        _context.Logistics.Add(logistic);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created logistics record {Id}", logistic.Id);

        return CreatedAtAction(nameof(GetById), new { id = logistic.Id }, MapToDto(logistic));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<LogisticsDto>> Update(Guid id, [FromBody] UpdateLogisticsDto updateDto)
    {
        var logistic = await _context.Logistics.FindAsync(id);

        if (logistic == null)
        {
            return NotFound(new { message = $"Logistics record with ID {id} not found" });
        }

        if (updateDto.DeliveryNo != null) logistic.Deliveryno = updateDto.DeliveryNo;
        if (updateDto.Description != null) logistic.Description = updateDto.Description;
        if (updateDto.DispatchManager.HasValue) logistic.Dispatchmanager = updateDto.DispatchManager;
        if (updateDto.Driver.HasValue) logistic.Driver = updateDto.Driver;
        if (updateDto.Helper1.HasValue) logistic.Helper1 = updateDto.Helper1;
        if (updateDto.Helper2.HasValue) logistic.Helper2 = updateDto.Helper2;
        if (updateDto.Helper3.HasValue) logistic.Helper3 = updateDto.Helper3;
        if (updateDto.Helper4.HasValue) logistic.Helper4 = updateDto.Helper4;
        if (updateDto.Helper5.HasValue) logistic.Helper5 = updateDto.Helper5;
        if (updateDto.LoadMaster.HasValue) logistic.Loadmaster = updateDto.LoadMaster;
        if (updateDto.Security.HasValue) logistic.Security = updateDto.Security;
        if (updateDto.Trailer.HasValue) logistic.Trailer = updateDto.Trailer;
        if (updateDto.Vehicle.HasValue) logistic.Vehicle = updateDto.Vehicle;
        if (updateDto.PlannedLoadDate.HasValue) logistic.Plannedloaddate = updateDto.PlannedLoadDate;
        if (updateDto.NewKmsTravelled.HasValue) logistic.NewKmstravelled = updateDto.NewKmsTravelled;
        if (updateDto.NewLoadCompleted.HasValue) logistic.NewLoadcompleted = updateDto.NewLoadCompleted;
        if (updateDto.NewLoadDuration.HasValue) logistic.NewLoadduration = updateDto.NewLoadDuration;
        
        logistic.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated logistics record {Id}", logistic.Id);

        return Ok(MapToDto(logistic));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var logistic = await _context.Logistics.FindAsync(id);

        if (logistic == null)
        {
            return NotFound(new { message = $"Logistics record with ID {id} not found" });
        }

        _context.Logistics.Remove(logistic);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted logistics record {Id}", logistic.Id);

        return NoContent();
    }

    private LogisticsDto MapToDto(Logistics logistic)
    {
        return new LogisticsDto
        {
            Id = logistic.Id,
            DeliveryNo = logistic.Deliveryno,
            Description = logistic.Description,
            DispatchManager = logistic.Dispatchmanager,
            Driver = logistic.Driver,
            Helper1 = logistic.Helper1,
            Helper2 = logistic.Helper2,
            Helper3 = logistic.Helper3,
            Helper4 = logistic.Helper4,
            Helper5 = logistic.Helper5,
            LoadMaster = logistic.Loadmaster,
            Security = logistic.Security,
            Trailer = logistic.Trailer,
            Vehicle = logistic.Vehicle,
            PlannedLoadDate = logistic.Plannedloaddate,
            NewKmsTravelled = logistic.NewKmstravelled,
            NewKmsTravelledDate = logistic.NewKmstravelledDate,
            NewKmsTravelledState = logistic.NewKmstravelledState,
            NewLoadCompleted = logistic.NewLoadcompleted,
            NewLoadDuration = logistic.NewLoadduration,
            NewLoadDurationDate = logistic.NewLoaddurationDate,
            NewLoadDurationState = logistic.NewLoaddurationState,
            CreatedOn = logistic.CreatedOn,
            CreatedBy = logistic.CreatedBy,
            ModifiedOn = logistic.ModifiedOn,
            ModifiedBy = logistic.ModifiedBy
        };
    }
}
