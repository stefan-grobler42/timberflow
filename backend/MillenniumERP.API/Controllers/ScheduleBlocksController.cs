using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ScheduleBlocksController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<ScheduleBlocksController> _logger;

    public ScheduleBlocksController(AppDbContext context, ILogger<ScheduleBlocksController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ScheduleBlockDto>>> GetAll(
        [FromQuery] string? dateFrom = null,
        [FromQuery] string? dateTo = null)
    {
        var query = _context.ScheduleBlocks
            .Include(sb => sb.Team)
            .Include(sb => sb.RelatedProduction)
            .AsQueryable();

        if (!string.IsNullOrEmpty(dateFrom))
        {
            query = query.Where(sb => string.Compare(sb.DateStr, dateFrom) >= 0);
        }

        if (!string.IsNullOrEmpty(dateTo))
        {
            query = query.Where(sb => string.Compare(sb.DateStr, dateTo) <= 0);
        }

        var scheduleBlocks = await query
            .OrderBy(sb => sb.DateStr)
            .ThenBy(sb => sb.StartTimeMinutes)
            .ToListAsync();

        var dtos = scheduleBlocks.Select(MapToDto).ToList();
        return Ok(dtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ScheduleBlockDto>> GetById(Guid id)
    {
        var scheduleBlock = await _context.ScheduleBlocks
            .Include(sb => sb.Team)
            .Include(sb => sb.RelatedProduction)
            .FirstOrDefaultAsync(sb => sb.Id == id);

        if (scheduleBlock == null)
        {
            return NotFound(new { message = $"ScheduleBlock with ID {id} not found" });
        }

        return Ok(MapToDto(scheduleBlock));
    }

    [HttpPost]
    public async Task<ActionResult<ScheduleBlockDto>> Create([FromBody] CreateScheduleBlockDto createDto)
    {
        var scheduleBlock = new ScheduleBlock
        {
            Id = Guid.NewGuid(),
            BlockType = createDto.BlockType,
            DateStr = createDto.DateStr,
            TeamId = createDto.TeamId,
            StartTimeMinutes = createDto.StartTimeMinutes,
            EndTimeMinutes = createDto.EndTimeMinutes,
            Description = createDto.Description,
            RelatedProductionId = createDto.RelatedProductionId,
            CreatedOn = DateTime.UtcNow
        };

        _context.ScheduleBlocks.Add(scheduleBlock);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created schedule block {Id}: {BlockType} on {DateStr}", 
            scheduleBlock.Id, scheduleBlock.BlockType, scheduleBlock.DateStr);

        var created = await _context.ScheduleBlocks
            .Include(sb => sb.Team)
            .Include(sb => sb.RelatedProduction)
            .FirstOrDefaultAsync(sb => sb.Id == scheduleBlock.Id);

        return CreatedAtAction(nameof(GetById), new { id = scheduleBlock.Id }, MapToDto(created!));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ScheduleBlockDto>> Update(Guid id, [FromBody] UpdateScheduleBlockDto updateDto)
    {
        var scheduleBlock = await _context.ScheduleBlocks.FindAsync(id);

        if (scheduleBlock == null)
        {
            return NotFound(new { message = $"ScheduleBlock with ID {id} not found" });
        }

        if (updateDto.BlockType != null) scheduleBlock.BlockType = updateDto.BlockType;
        if (updateDto.DateStr != null) scheduleBlock.DateStr = updateDto.DateStr;
        if (updateDto.TeamId.HasValue) scheduleBlock.TeamId = updateDto.TeamId;
        if (updateDto.StartTimeMinutes.HasValue) scheduleBlock.StartTimeMinutes = updateDto.StartTimeMinutes.Value;
        if (updateDto.EndTimeMinutes.HasValue) scheduleBlock.EndTimeMinutes = updateDto.EndTimeMinutes.Value;
        if (updateDto.Description != null) scheduleBlock.Description = updateDto.Description;
        if (updateDto.RelatedProductionId.HasValue) scheduleBlock.RelatedProductionId = updateDto.RelatedProductionId;

        scheduleBlock.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated schedule block {Id}: {BlockType} on {DateStr}", 
            scheduleBlock.Id, scheduleBlock.BlockType, scheduleBlock.DateStr);

        var updated = await _context.ScheduleBlocks
            .Include(sb => sb.Team)
            .Include(sb => sb.RelatedProduction)
            .FirstOrDefaultAsync(sb => sb.Id == id);

        return Ok(MapToDto(updated!));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var scheduleBlock = await _context.ScheduleBlocks.FindAsync(id);

        if (scheduleBlock == null)
        {
            return NotFound(new { message = $"ScheduleBlock with ID {id} not found" });
        }

        _context.ScheduleBlocks.Remove(scheduleBlock);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted schedule block {Id}: {BlockType} on {DateStr}", 
            scheduleBlock.Id, scheduleBlock.BlockType, scheduleBlock.DateStr);

        return NoContent();
    }

    private static ScheduleBlockDto MapToDto(ScheduleBlock scheduleBlock)
    {
        return new ScheduleBlockDto
        {
            Id = scheduleBlock.Id,
            BlockType = scheduleBlock.BlockType,
            DateStr = scheduleBlock.DateStr,
            TeamId = scheduleBlock.TeamId,
            TeamName = scheduleBlock.Team?.Name,
            StartTimeMinutes = scheduleBlock.StartTimeMinutes,
            EndTimeMinutes = scheduleBlock.EndTimeMinutes,
            Description = scheduleBlock.Description,
            RelatedProductionId = scheduleBlock.RelatedProductionId,
            RelatedProductionName = scheduleBlock.RelatedProduction?.Name,
            CreatedOn = scheduleBlock.CreatedOn,
            CreatedBy = scheduleBlock.CreatedBy,
            ModifiedOn = scheduleBlock.ModifiedOn,
            ModifiedBy = scheduleBlock.ModifiedBy
        };
    }
}
