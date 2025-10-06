using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ActivitiesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<ActivitiesController> _logger;

    public ActivitiesController(AppDbContext context, ILogger<ActivitiesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ActivityDto>>> GetAll([FromQuery] int? customerId = null)
    {
        var query = _context.Activities.AsQueryable();

        if (customerId.HasValue)
        {
            query = query.Where(a => a.CustomerId == customerId.Value);
        }

        var activities = await query
            .OrderByDescending(a => a.ActivityDate ?? a.CreatedAt)
            .ToListAsync();

        var activityDtos = activities.Select(MapToDto).ToList();
        return Ok(activityDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ActivityDto>> GetById(int id)
    {
        var activity = await _context.Activities.FindAsync(id);

        if (activity == null)
        {
            return NotFound(new { message = $"Activity with ID {id} not found" });
        }

        return Ok(MapToDto(activity));
    }

    [HttpPost]
    public async Task<ActionResult<ActivityDto>> Create([FromBody] CreateActivityDto createDto)
    {
        var customerExists = await _context.Customers.AnyAsync(c => c.Id == createDto.CustomerId);
        if (!customerExists)
        {
            return BadRequest(new { message = $"Customer with ID {createDto.CustomerId} not found" });
        }

        var activity = new Activity
        {
            CustomerId = createDto.CustomerId,
            ActivityType = createDto.ActivityType,
            Subject = createDto.Subject ?? string.Empty,
            Description = createDto.Description,
            ActivityDate = createDto.ActivityDate,
            CreatedAt = DateTime.UtcNow
        };

        _context.Activities.Add(activity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created activity {ActivityType} for customer {CustomerId}: {Subject}", 
            activity.ActivityType, activity.CustomerId, activity.Subject);

        return CreatedAtAction(nameof(GetById), new { id = activity.Id }, MapToDto(activity));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ActivityDto>> Update(int id, [FromBody] UpdateActivityDto updateDto)
    {
        var activity = await _context.Activities.FindAsync(id);

        if (activity == null)
        {
            return NotFound(new { message = $"Activity with ID {id} not found" });
        }

        if (updateDto.ActivityType != null) activity.ActivityType = updateDto.ActivityType;
        if (updateDto.Subject != null) activity.Subject = updateDto.Subject;
        if (updateDto.Description != null) activity.Description = updateDto.Description;
        if (updateDto.ActivityDate.HasValue) activity.ActivityDate = updateDto.ActivityDate.Value;
        
        activity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated activity {Id}: {ActivityType} - {Subject}", 
            activity.Id, activity.ActivityType, activity.Subject);

        return Ok(MapToDto(activity));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var activity = await _context.Activities.FindAsync(id);

        if (activity == null)
        {
            return NotFound(new { message = $"Activity with ID {id} not found" });
        }

        _context.Activities.Remove(activity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted activity {Id}: {ActivityType} - {Subject}", 
            activity.Id, activity.ActivityType, activity.Subject);

        return NoContent();
    }

    private static ActivityDto MapToDto(Activity activity)
    {
        return new ActivityDto
        {
            Id = activity.Id,
            CustomerId = activity.CustomerId,
            ActivityType = activity.ActivityType,
            Subject = activity.Subject,
            Description = activity.Description,
            ActivityDate = activity.ActivityDate,
            CreatedAt = activity.CreatedAt,
            UpdatedAt = activity.UpdatedAt
        };
    }
}
