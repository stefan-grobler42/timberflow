using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<ContactsController> _logger;

    public ContactsController(AppDbContext context, ILogger<ContactsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ContactDto>>> GetAll([FromQuery] int? customerId = null)
    {
        var query = _context.Contacts.AsQueryable();

        if (customerId.HasValue)
        {
            query = query.Where(c => c.CustomerId == customerId.Value);
        }

        var contacts = await query
            .OrderByDescending(c => c.IsPrimary)
            .ThenBy(c => c.LastName)
            .ThenBy(c => c.FirstName)
            .ToListAsync();

        var contactDtos = contacts.Select(MapToDto).ToList();
        return Ok(contactDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ContactDto>> GetById(int id)
    {
        var contact = await _context.Contacts.FindAsync(id);

        if (contact == null)
        {
            return NotFound(new { message = $"Contact with ID {id} not found" });
        }

        return Ok(MapToDto(contact));
    }

    [HttpPost]
    public async Task<ActionResult<ContactDto>> Create([FromBody] CreateContactDto createDto)
    {
        var customerExists = await _context.Customers.AnyAsync(c => c.Id == createDto.CustomerId);
        if (!customerExists)
        {
            return BadRequest(new { message = $"Customer with ID {createDto.CustomerId} not found" });
        }

        var contact = new Contact
        {
            CustomerId = createDto.CustomerId,
            FirstName = createDto.FirstName,
            LastName = createDto.LastName,
            Email = createDto.Email,
            Phone = createDto.Phone,
            Designation = createDto.Designation,
            IsPrimary = createDto.IsPrimary,
            CreatedAt = DateTime.UtcNow
        };

        _context.Contacts.Add(contact);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created contact {FirstName} {LastName} for customer {CustomerId}", 
            contact.FirstName, contact.LastName, contact.CustomerId);

        return CreatedAtAction(nameof(GetById), new { id = contact.Id }, MapToDto(contact));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ContactDto>> Update(int id, [FromBody] UpdateContactDto updateDto)
    {
        var contact = await _context.Contacts.FindAsync(id);

        if (contact == null)
        {
            return NotFound(new { message = $"Contact with ID {id} not found" });
        }

        if (updateDto.FirstName != null) contact.FirstName = updateDto.FirstName;
        if (updateDto.LastName != null) contact.LastName = updateDto.LastName;
        if (updateDto.Email != null) contact.Email = updateDto.Email;
        if (updateDto.Phone != null) contact.Phone = updateDto.Phone;
        if (updateDto.Designation != null) contact.Designation = updateDto.Designation;
        if (updateDto.IsPrimary.HasValue) contact.IsPrimary = updateDto.IsPrimary.Value;
        
        contact.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated contact {Id}: {FirstName} {LastName}", 
            contact.Id, contact.FirstName, contact.LastName);

        return Ok(MapToDto(contact));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var contact = await _context.Contacts.FindAsync(id);

        if (contact == null)
        {
            return NotFound(new { message = $"Contact with ID {id} not found" });
        }

        _context.Contacts.Remove(contact);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted contact {Id}: {FirstName} {LastName}", 
            contact.Id, contact.FirstName, contact.LastName);

        return NoContent();
    }

    private static ContactDto MapToDto(Contact contact)
    {
        return new ContactDto
        {
            Id = contact.Id,
            CustomerId = contact.CustomerId,
            FirstName = contact.FirstName,
            LastName = contact.LastName,
            Email = contact.Email,
            Phone = contact.Phone,
            Designation = contact.Designation,
            IsPrimary = contact.IsPrimary,
            CreatedAt = contact.CreatedAt,
            UpdatedAt = contact.UpdatedAt
        };
    }
}
