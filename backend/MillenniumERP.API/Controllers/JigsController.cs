using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class JigsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<JigsController> _logger;

    public JigsController(AppDbContext context, ILogger<JigsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<JigDto>>> GetAll()
    {
        var jigs = await _context.Jigs
            .OrderBy(j => j.Name)
            .ToListAsync();

        var dtos = jigs.Select(MapToDto).ToList();
        return Ok(dtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<JigDto>> GetById(Guid id)
    {
        var jig = await _context.Jigs.FindAsync(id);

        if (jig == null)
        {
            return NotFound(new { message = $"Jig with ID {id} not found" });
        }

        return Ok(MapToDto(jig));
    }

    [HttpPost]
    public async Task<ActionResult<JigDto>> Create([FromBody] CreateJigDto createDto)
    {
        var jig = new Jig
        {
            Id = Guid.NewGuid(),
            Name = createDto.Name,
            Description = createDto.Description,
            LeaderId = createDto.LeaderId,
            Proficiency = createDto.Proficiency,
            ReliabilityScore = createDto.ReliabilityScore,
            Strengths = createDto.Strengths,
            AverageEfinks = createDto.AverageEfinks,
            CreatedOn = DateTime.UtcNow
        };

        _context.Jigs.Add(jig);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created jig {Id}: {Name}", jig.Id, jig.Name);

        return CreatedAtAction(nameof(GetById), new { id = jig.Id }, MapToDto(jig));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<JigDto>> Update(Guid id, [FromBody] UpdateJigDto updateDto)
    {
        var jig = await _context.Jigs.FindAsync(id);

        if (jig == null)
        {
            return NotFound(new { message = $"Jig with ID {id} not found" });
        }

        if (updateDto.Name != null) jig.Name = updateDto.Name;
        if (updateDto.Description != null) jig.Description = updateDto.Description;
        if (updateDto.LeaderId.HasValue) jig.LeaderId = updateDto.LeaderId;
        if (updateDto.Proficiency != null) jig.Proficiency = updateDto.Proficiency;
        if (updateDto.ReliabilityScore.HasValue) jig.ReliabilityScore = updateDto.ReliabilityScore;
        if (updateDto.Strengths != null) jig.Strengths = updateDto.Strengths;
        if (updateDto.AverageEfinks.HasValue) jig.AverageEfinks = updateDto.AverageEfinks.Value;

        jig.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated jig {Id}: {Name}", jig.Id, jig.Name);

        return Ok(MapToDto(jig));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var jig = await _context.Jigs.FindAsync(id);

        if (jig == null)
        {
            return NotFound(new { message = $"Jig with ID {id} not found" });
        }

        _context.Jigs.Remove(jig);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted jig {Id}: {Name}", jig.Id, jig.Name);

        return NoContent();
    }

    private static JigDto MapToDto(Jig jig)
    {
        return new JigDto
        {
            Id = jig.Id,
            Name = jig.Name,
            Description = jig.Description,
            LeaderId = jig.LeaderId,
            Proficiency = jig.Proficiency,
            ReliabilityScore = jig.ReliabilityScore,
            Strengths = jig.Strengths,
            AverageEfinks = jig.AverageEfinks,
            CreatedOn = jig.CreatedOn,
            CreatedBy = jig.CreatedBy,
            ModifiedOn = jig.ModifiedOn,
            ModifiedBy = jig.ModifiedBy
        };
    }
}
