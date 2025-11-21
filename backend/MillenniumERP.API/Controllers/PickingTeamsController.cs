using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PickingTeamsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<PickingTeamsController> _logger;

    public PickingTeamsController(AppDbContext context, ILogger<PickingTeamsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PickingTeamDto>>> GetAll()
    {
        var pickingTeams = await _context.PickingTeams
            .OrderBy(p => p.Name)
            .ToListAsync();

        var dtos = pickingTeams.Select(MapToDto).ToList();
        return Ok(dtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PickingTeamDto>> GetById(Guid id)
    {
        var pickingTeam = await _context.PickingTeams.FindAsync(id);

        if (pickingTeam == null)
        {
            return NotFound(new { message = $"Picking Team with ID {id} not found" });
        }

        return Ok(MapToDto(pickingTeam));
    }

    [HttpPost]
    public async Task<ActionResult<PickingTeamDto>> Create([FromBody] CreatePickingTeamDto createDto)
    {
        var pickingTeam = new PickingTeam
        {
            Id = Guid.NewGuid(),
            Name = createDto.Name,
            Description = createDto.Description,
            TeamLeaderId = createDto.TeamLeaderId,
            AverageTimePerM3 = createDto.AverageTimePerM3,
            CreatedOn = DateTime.UtcNow
        };

        _context.PickingTeams.Add(pickingTeam);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created picking team {Id}: {Name}", pickingTeam.Id, pickingTeam.Name);

        return CreatedAtAction(nameof(GetById), new { id = pickingTeam.Id }, MapToDto(pickingTeam));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<PickingTeamDto>> Update(Guid id, [FromBody] UpdatePickingTeamDto updateDto)
    {
        var pickingTeam = await _context.PickingTeams.FindAsync(id);

        if (pickingTeam == null)
        {
            return NotFound(new { message = $"Picking Team with ID {id} not found" });
        }

        if (updateDto.Name != null) pickingTeam.Name = updateDto.Name;
        if (updateDto.Description != null) pickingTeam.Description = updateDto.Description;
        if (updateDto.TeamLeaderId.HasValue) pickingTeam.TeamLeaderId = updateDto.TeamLeaderId;
        if (updateDto.AverageTimePerM3.HasValue) pickingTeam.AverageTimePerM3 = updateDto.AverageTimePerM3;

        pickingTeam.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated picking team {Id}: {Name}", pickingTeam.Id, pickingTeam.Name);

        return Ok(MapToDto(pickingTeam));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var pickingTeam = await _context.PickingTeams.FindAsync(id);

        if (pickingTeam == null)
        {
            return NotFound(new { message = $"Picking Team with ID {id} not found" });
        }

        _context.PickingTeams.Remove(pickingTeam);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted picking team {Id}: {Name}", pickingTeam.Id, pickingTeam.Name);

        return NoContent();
    }

    private static PickingTeamDto MapToDto(PickingTeam pickingTeam)
    {
        return new PickingTeamDto
        {
            Id = pickingTeam.Id,
            Name = pickingTeam.Name,
            Description = pickingTeam.Description,
            TeamLeaderId = pickingTeam.TeamLeaderId,
            AverageTimePerM3 = pickingTeam.AverageTimePerM3,
            CreatedOn = pickingTeam.CreatedOn,
            CreatedBy = pickingTeam.CreatedBy,
            ModifiedOn = pickingTeam.ModifiedOn,
            ModifiedBy = pickingTeam.ModifiedBy
        };
    }
}
