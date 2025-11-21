using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SawsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<SawsController> _logger;

    public SawsController(AppDbContext context, ILogger<SawsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SawDto>>> GetAll()
    {
        var saws = await _context.Saws
            .OrderBy(s => s.Name)
            .ToListAsync();

        var dtos = saws.Select(MapToDto).ToList();
        return Ok(dtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SawDto>> GetById(Guid id)
    {
        var saw = await _context.Saws.FindAsync(id);

        if (saw == null)
        {
            return NotFound(new { message = $"Saw with ID {id} not found" });
        }

        return Ok(MapToDto(saw));
    }

    [HttpPost]
    public async Task<ActionResult<SawDto>> Create([FromBody] CreateSawDto createDto)
    {
        var saw = new Saw
        {
            Id = Guid.NewGuid(),
            Name = createDto.Name,
            Description = createDto.Description,
            OperatorId = createDto.OperatorId,
            AverageTimePerCut = createDto.AverageTimePerCut,
            LastServiceDate = createDto.LastServiceDate,
            SerialNumber = createDto.SerialNumber,
            AssetNumber = createDto.AssetNumber,
            LastBladeChange = createDto.LastBladeChange,
            CreatedOn = DateTime.UtcNow
        };

        _context.Saws.Add(saw);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created saw {Id}: {Name}", saw.Id, saw.Name);

        return CreatedAtAction(nameof(GetById), new { id = saw.Id }, MapToDto(saw));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SawDto>> Update(Guid id, [FromBody] UpdateSawDto updateDto)
    {
        var saw = await _context.Saws.FindAsync(id);

        if (saw == null)
        {
            return NotFound(new { message = $"Saw with ID {id} not found" });
        }

        if (updateDto.Name != null) saw.Name = updateDto.Name;
        if (updateDto.Description != null) saw.Description = updateDto.Description;
        if (updateDto.OperatorId.HasValue) saw.OperatorId = updateDto.OperatorId;
        if (updateDto.AverageTimePerCut.HasValue) saw.AverageTimePerCut = updateDto.AverageTimePerCut;
        if (updateDto.LastServiceDate.HasValue) saw.LastServiceDate = updateDto.LastServiceDate;
        if (updateDto.SerialNumber != null) saw.SerialNumber = updateDto.SerialNumber;
        if (updateDto.AssetNumber != null) saw.AssetNumber = updateDto.AssetNumber;
        if (updateDto.LastBladeChange.HasValue) saw.LastBladeChange = updateDto.LastBladeChange;

        saw.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated saw {Id}: {Name}", saw.Id, saw.Name);

        return Ok(MapToDto(saw));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var saw = await _context.Saws.FindAsync(id);

        if (saw == null)
        {
            return NotFound(new { message = $"Saw with ID {id} not found" });
        }

        _context.Saws.Remove(saw);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted saw {Id}: {Name}", saw.Id, saw.Name);

        return NoContent();
    }

    private static SawDto MapToDto(Saw saw)
    {
        return new SawDto
        {
            Id = saw.Id,
            Name = saw.Name,
            Description = saw.Description,
            OperatorId = saw.OperatorId,
            AverageTimePerCut = saw.AverageTimePerCut,
            LastServiceDate = saw.LastServiceDate,
            SerialNumber = saw.SerialNumber,
            AssetNumber = saw.AssetNumber,
            LastBladeChange = saw.LastBladeChange,
            CreatedOn = saw.CreatedOn,
            CreatedBy = saw.CreatedBy,
            ModifiedOn = saw.ModifiedOn,
            ModifiedBy = saw.ModifiedBy
        };
    }
}
