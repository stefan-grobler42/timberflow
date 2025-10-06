using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RolesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<RolesController> _logger;

    public RolesController(AppDbContext context, ILogger<RolesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RoleDto>>> GetAll()
    {
        var roles = await _context.Roles
            .OrderBy(r => r.Name)
            .ToListAsync();

        var roleDtos = roles.Select(MapToDto).ToList();
        return Ok(roleDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RoleDto>> GetById(int id)
    {
        var role = await _context.Roles.FindAsync(id);

        if (role == null)
        {
            return NotFound(new { message = $"Role with ID {id} not found" });
        }

        return Ok(MapToDto(role));
    }

    [HttpPost]
    public async Task<ActionResult<RoleDto>> Create([FromBody] CreateRoleDto createDto)
    {
        var role = new Role
        {
            Name = createDto.Name,
            Description = createDto.Description,
            CreatedAt = DateTime.UtcNow
        };

        _context.Roles.Add(role);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created role {Name}", role.Name);

        return CreatedAtAction(nameof(GetById), new { id = role.Id }, MapToDto(role));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<RoleDto>> Update(int id, [FromBody] UpdateRoleDto updateDto)
    {
        var role = await _context.Roles.FindAsync(id);

        if (role == null)
        {
            return NotFound(new { message = $"Role with ID {id} not found" });
        }

        if (updateDto.Name != null) role.Name = updateDto.Name;
        if (updateDto.Description != null) role.Description = updateDto.Description;
        
        role.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated role {Id}: {Name}", role.Id, role.Name);

        return Ok(MapToDto(role));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var role = await _context.Roles.FindAsync(id);

        if (role == null)
        {
            return NotFound(new { message = $"Role with ID {id} not found" });
        }

        _context.Roles.Remove(role);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted role {Id}: {Name}", role.Id, role.Name);

        return NoContent();
    }

    private static RoleDto MapToDto(Role role)
    {
        return new RoleDto
        {
            Id = role.Id,
            Name = role.Name,
            Description = role.Description,
            CreatedAt = role.CreatedAt,
            UpdatedAt = role.UpdatedAt
        };
    }
}
