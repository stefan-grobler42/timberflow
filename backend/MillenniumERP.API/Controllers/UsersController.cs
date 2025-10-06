using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<UsersController> _logger;

    public UsersController(AppDbContext context, ILogger<UsersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAll()
    {
        var users = await _context.Users
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName)
            .ToListAsync();

        var userDtos = users.Select(MapToDto).ToList();
        return Ok(userDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetById(int id)
    {
        var user = await _context.Users.FindAsync(id);

        if (user == null)
        {
            return NotFound(new { message = $"User with ID {id} not found" });
        }

        return Ok(MapToDto(user));
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> Create([FromBody] CreateUserDto createDto)
    {
        var user = new User
        {
            UserCode = createDto.UserCode,
            FirstName = createDto.FirstName,
            LastName = createDto.LastName,
            Email = createDto.Email,
            Phone = createDto.Phone,
            Department = createDto.Department,
            Position = createDto.Position,
            Role = createDto.Role,
            IsActive = createDto.IsActive,
            HireDate = createDto.HireDate,
            Address = createDto.Address,
            EmergencyContact = createDto.EmergencyContact,
            EmergencyPhone = createDto.EmergencyPhone,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created user {UserCode}: {FirstName} {LastName}", 
            user.UserCode, user.FirstName, user.LastName);

        return CreatedAtAction(nameof(GetById), new { id = user.Id }, MapToDto(user));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<UserDto>> Update(int id, [FromBody] UpdateUserDto updateDto)
    {
        var user = await _context.Users.FindAsync(id);

        if (user == null)
        {
            return NotFound(new { message = $"User with ID {id} not found" });
        }

        if (updateDto.UserCode != null) user.UserCode = updateDto.UserCode;
        if (updateDto.FirstName != null) user.FirstName = updateDto.FirstName;
        if (updateDto.LastName != null) user.LastName = updateDto.LastName;
        if (updateDto.Email != null) user.Email = updateDto.Email;
        if (updateDto.Phone != null) user.Phone = updateDto.Phone;
        if (updateDto.Department != null) user.Department = updateDto.Department;
        if (updateDto.Position != null) user.Position = updateDto.Position;
        if (updateDto.Role != null) user.Role = updateDto.Role;
        if (updateDto.IsActive.HasValue) user.IsActive = updateDto.IsActive.Value;
        if (updateDto.HireDate.HasValue) user.HireDate = updateDto.HireDate;
        if (updateDto.Address != null) user.Address = updateDto.Address;
        if (updateDto.EmergencyContact != null) user.EmergencyContact = updateDto.EmergencyContact;
        if (updateDto.EmergencyPhone != null) user.EmergencyPhone = updateDto.EmergencyPhone;
        
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated user {Id}: {FirstName} {LastName}", 
            user.Id, user.FirstName, user.LastName);

        return Ok(MapToDto(user));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var user = await _context.Users.FindAsync(id);

        if (user == null)
        {
            return NotFound(new { message = $"User with ID {id} not found" });
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted user {Id}: {FirstName} {LastName}", 
            user.Id, user.FirstName, user.LastName);

        return NoContent();
    }

    private static UserDto MapToDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            UserCode = user.UserCode,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            Phone = user.Phone,
            Department = user.Department,
            Position = user.Position,
            Role = user.Role,
            IsActive = user.IsActive,
            HireDate = user.HireDate,
            Address = user.Address,
            EmergencyContact = user.EmergencyContact,
            EmergencyPhone = user.EmergencyPhone,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
    }
}
