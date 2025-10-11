using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs.D365;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/d365contacts")]
public class D365ContactsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<D365ContactsController> _logger;

    public D365ContactsController(AppDbContext context, ILogger<D365ContactsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<D365ContactDto>>> GetAll()
    {
        var contacts = await _context.D365Contacts
            .OrderBy(c => c.LastName)
            .ThenBy(c => c.FirstName)
            .ToListAsync();

        var contactDtos = contacts.Select(MapToDto).ToList();
        return Ok(contactDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<D365ContactDto>> GetById(Guid id)
    {
        var contact = await _context.D365Contacts.FindAsync(id);

        if (contact == null)
        {
            return NotFound(new { message = $"Contact with ID {id} not found" });
        }

        return Ok(MapToDto(contact));
    }

    [HttpPost]
    public async Task<ActionResult<D365ContactDto>> Create([FromBody] CreateD365ContactDto createDto)
    {
        var contact = new D365Contact
        {
            Id = Guid.NewGuid(),
            FirstName = createDto.FirstName,
            LastName = createDto.LastName,
            FullName = $"{createDto.FirstName} {createDto.LastName}".Trim(),
            EmailAddress1 = createDto.EmailAddress1,
            Telephone1 = createDto.Telephone1,
            MobilePhone = createDto.MobilePhone,
            JobTitle = createDto.JobTitle,
            ParentCustomerId = createDto.ParentCustomerId,
            Address1Line1 = createDto.Address1Line1,
            Address1City = createDto.Address1City,
            Address1StateOrProvince = createDto.Address1StateOrProvince,
            Address1PostalCode = createDto.Address1PostalCode,
            Address1Country = createDto.Address1Country,
            CreatedOn = DateTime.UtcNow
        };

        _context.D365Contacts.Add(contact);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created contact {Id}: {FullName}", contact.Id, contact.FullName);

        return CreatedAtAction(nameof(GetById), new { id = contact.Id }, MapToDto(contact));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<D365ContactDto>> Update(Guid id, [FromBody] UpdateD365ContactDto updateDto)
    {
        var contact = await _context.D365Contacts.FindAsync(id);

        if (contact == null)
        {
            return NotFound(new { message = $"Contact with ID {id} not found" });
        }

        if (updateDto.FirstName != null) contact.FirstName = updateDto.FirstName;
        if (updateDto.LastName != null) contact.LastName = updateDto.LastName;
        if (updateDto.FirstName != null || updateDto.LastName != null)
        {
            contact.FullName = $"{contact.FirstName} {contact.LastName}".Trim();
        }
        if (updateDto.EmailAddress1 != null) contact.EmailAddress1 = updateDto.EmailAddress1;
        if (updateDto.Telephone1 != null) contact.Telephone1 = updateDto.Telephone1;
        if (updateDto.MobilePhone != null) contact.MobilePhone = updateDto.MobilePhone;
        if (updateDto.JobTitle != null) contact.JobTitle = updateDto.JobTitle;
        if (updateDto.ParentCustomerId.HasValue) contact.ParentCustomerId = updateDto.ParentCustomerId;
        if (updateDto.Address1Line1 != null) contact.Address1Line1 = updateDto.Address1Line1;
        if (updateDto.Address1City != null) contact.Address1City = updateDto.Address1City;
        if (updateDto.Address1StateOrProvince != null) contact.Address1StateOrProvince = updateDto.Address1StateOrProvince;
        if (updateDto.Address1PostalCode != null) contact.Address1PostalCode = updateDto.Address1PostalCode;
        if (updateDto.Address1Country != null) contact.Address1Country = updateDto.Address1Country;

        contact.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated contact {Id}: {FullName}", contact.Id, contact.FullName);

        return Ok(MapToDto(contact));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var contact = await _context.D365Contacts.FindAsync(id);

        if (contact == null)
        {
            return NotFound(new { message = $"Contact with ID {id} not found" });
        }

        _context.D365Contacts.Remove(contact);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted contact {Id}: {FullName}", contact.Id, contact.FullName);

        return NoContent();
    }

    private D365ContactDto MapToDto(D365Contact contact)
    {
        return new D365ContactDto
        {
            Id = contact.Id,
            FirstName = contact.FirstName,
            LastName = contact.LastName,
            FullName = contact.FullName,
            EmailAddress1 = contact.EmailAddress1,
            Telephone1 = contact.Telephone1,
            MobilePhone = contact.MobilePhone,
            JobTitle = contact.JobTitle,
            ParentCustomerId = contact.ParentCustomerId,
            Address1Line1 = contact.Address1Line1,
            Address1City = contact.Address1City,
            Address1StateOrProvince = contact.Address1StateOrProvince,
            Address1PostalCode = contact.Address1PostalCode,
            Address1Country = contact.Address1Country,
            CreatedOn = contact.CreatedOn,
            CreatedBy = contact.CreatedBy,
            ModifiedOn = contact.ModifiedOn,
            ModifiedBy = contact.ModifiedBy
        };
    }
}
