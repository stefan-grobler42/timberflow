using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InstallationProgressController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<InstallationProgressController> _logger;

    public InstallationProgressController(AppDbContext context, ILogger<InstallationProgressController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InstallationProgressDto>>> GetAll()
    {
        var progressRecords = await _context.InstallationProgresses
            .OrderBy(i => i.Name)
            .ToListAsync();

        var progressDtos = progressRecords.Select(MapToDto).ToList();
        return Ok(progressDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<InstallationProgressDto>> GetById(Guid id)
    {
        var progress = await _context.InstallationProgresses.FindAsync(id);

        if (progress == null)
        {
            return NotFound(new { message = $"Installation Progress with ID {id} not found" });
        }

        return Ok(MapToDto(progress));
    }

    [HttpPost]
    public async Task<ActionResult<InstallationProgressDto>> Create([FromBody] CreateInstallationProgressDto createDto)
    {
        var progress = new InstallationProgress
        {
            Id = Guid.NewGuid(),
            Name = createDto.Name,
            NewInstallationorderno = createDto.NewInstallationorderno,
            NewPercentagecomplete = createDto.NewPercentagecomplete,
            CreatedOn = DateTime.UtcNow
        };

        _context.InstallationProgresses.Add(progress);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created installation progress {Id}: {Name}", progress.Id, progress.Name);

        return CreatedAtAction(nameof(GetById), new { id = progress.Id }, MapToDto(progress));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<InstallationProgressDto>> Update(Guid id, [FromBody] UpdateInstallationProgressDto updateDto)
    {
        var progress = await _context.InstallationProgresses.FindAsync(id);

        if (progress == null)
        {
            return NotFound(new { message = $"Installation Progress with ID {id} not found" });
        }

        if (updateDto.Name != null) progress.Name = updateDto.Name;
        if (updateDto.NewInstallationorderno != null) progress.NewInstallationorderno = updateDto.NewInstallationorderno;
        if (updateDto.NewPercentagecomplete.HasValue) progress.NewPercentagecomplete = updateDto.NewPercentagecomplete;
        
        progress.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated installation progress {Id}: {Name}", progress.Id, progress.Name);

        return Ok(MapToDto(progress));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var progress = await _context.InstallationProgresses.FindAsync(id);

        if (progress == null)
        {
            return NotFound(new { message = $"Installation Progress with ID {id} not found" });
        }

        _context.InstallationProgresses.Remove(progress);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted installation progress {Id}: {Name}", progress.Id, progress.Name);

        return NoContent();
    }

    private InstallationProgressDto MapToDto(InstallationProgress progress)
    {
        return new InstallationProgressDto
        {
            Id = progress.Id,
            Name = progress.Name,
            NewInstallationorderno = progress.NewInstallationorderno,
            NewPercentagecomplete = progress.NewPercentagecomplete,
            CreatedOn = progress.CreatedOn,
            CreatedBy = progress.CreatedBy,
            ModifiedOn = progress.ModifiedOn,
            ModifiedBy = progress.ModifiedBy
        };
    }
}
