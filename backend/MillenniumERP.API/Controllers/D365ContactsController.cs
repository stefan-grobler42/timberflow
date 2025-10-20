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
            Salutation = createDto.Salutation,
            FirstName = createDto.FirstName,
            MiddleName = createDto.MiddleName,
            LastName = createDto.LastName,
            FullName = $"{createDto.Salutation ?? ""} {createDto.FirstName} {createDto.MiddleName ?? ""} {createDto.LastName}".Trim().Replace("  ", " "),
            EmailAddress1 = createDto.EmailAddress1,
            Telephone1 = createDto.Telephone1,
            Telephone2 = createDto.Telephone2,
            Telephone3 = createDto.Telephone3,
            MobilePhone = createDto.MobilePhone,
            Fax = createDto.Fax,
            JobTitle = createDto.JobTitle,
            ParentCustomerId = createDto.ParentCustomerId,
            Address1AddressTypeCode = createDto.Address1AddressTypeCode,
            Address1Name = createDto.Address1Name,
            Address1Line1 = createDto.Address1Line1,
            Address1Line2 = createDto.Address1Line2,
            Address1Line3 = createDto.Address1Line3,
            Address1City = createDto.Address1City,
            Address1StateOrProvince = createDto.Address1StateOrProvince,
            Address1PostalCode = createDto.Address1PostalCode,
            Address1Country = createDto.Address1Country,
            Address1Telephone1 = createDto.Address1Telephone1,
            Description = createDto.Description,
            Department = createDto.Department,
            ManagerName = createDto.ManagerName,
            ManagerPhone = createDto.ManagerPhone,
            Role = createDto.Role,
            AssistantName = createDto.AssistantName,
            AssistantPhone = createDto.AssistantPhone,
            GenderCode = createDto.GenderCode,
            FamilyStatusCode = createDto.FamilyStatusCode,
            SpousesPartner = createDto.SpousesPartner,
            BirthDate = createDto.BirthDate,
            Anniversary = createDto.Anniversary,
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

        if (updateDto.Salutation != null) contact.Salutation = updateDto.Salutation;
        if (updateDto.FirstName != null) contact.FirstName = updateDto.FirstName;
        if (updateDto.MiddleName != null) contact.MiddleName = updateDto.MiddleName;
        if (updateDto.LastName != null) contact.LastName = updateDto.LastName;
        if (updateDto.Salutation != null || updateDto.FirstName != null || updateDto.MiddleName != null || updateDto.LastName != null)
        {
            contact.FullName = $"{contact.Salutation ?? ""} {contact.FirstName} {contact.MiddleName ?? ""} {contact.LastName}".Trim().Replace("  ", " ");
        }
        if (updateDto.EmailAddress1 != null) contact.EmailAddress1 = updateDto.EmailAddress1;
        if (updateDto.Telephone1 != null) contact.Telephone1 = updateDto.Telephone1;
        if (updateDto.Telephone2 != null) contact.Telephone2 = updateDto.Telephone2;
        if (updateDto.Telephone3 != null) contact.Telephone3 = updateDto.Telephone3;
        if (updateDto.MobilePhone != null) contact.MobilePhone = updateDto.MobilePhone;
        if (updateDto.Fax != null) contact.Fax = updateDto.Fax;
        if (updateDto.JobTitle != null) contact.JobTitle = updateDto.JobTitle;
        if (updateDto.ParentCustomerId.HasValue) contact.ParentCustomerId = updateDto.ParentCustomerId;
        if (updateDto.Address1AddressTypeCode.HasValue) contact.Address1AddressTypeCode = updateDto.Address1AddressTypeCode;
        if (updateDto.Address1Name != null) contact.Address1Name = updateDto.Address1Name;
        if (updateDto.Address1Line1 != null) contact.Address1Line1 = updateDto.Address1Line1;
        if (updateDto.Address1Line2 != null) contact.Address1Line2 = updateDto.Address1Line2;
        if (updateDto.Address1Line3 != null) contact.Address1Line3 = updateDto.Address1Line3;
        if (updateDto.Address1City != null) contact.Address1City = updateDto.Address1City;
        if (updateDto.Address1StateOrProvince != null) contact.Address1StateOrProvince = updateDto.Address1StateOrProvince;
        if (updateDto.Address1PostalCode != null) contact.Address1PostalCode = updateDto.Address1PostalCode;
        if (updateDto.Address1Country != null) contact.Address1Country = updateDto.Address1Country;
        if (updateDto.Address1Telephone1 != null) contact.Address1Telephone1 = updateDto.Address1Telephone1;
        if (updateDto.Description != null) contact.Description = updateDto.Description;
        if (updateDto.Department != null) contact.Department = updateDto.Department;
        if (updateDto.ManagerName != null) contact.ManagerName = updateDto.ManagerName;
        if (updateDto.ManagerPhone != null) contact.ManagerPhone = updateDto.ManagerPhone;
        if (updateDto.Role != null) contact.Role = updateDto.Role;
        if (updateDto.AssistantName != null) contact.AssistantName = updateDto.AssistantName;
        if (updateDto.AssistantPhone != null) contact.AssistantPhone = updateDto.AssistantPhone;
        if (updateDto.GenderCode.HasValue) contact.GenderCode = updateDto.GenderCode;
        if (updateDto.FamilyStatusCode.HasValue) contact.FamilyStatusCode = updateDto.FamilyStatusCode;
        if (updateDto.SpousesPartner != null) contact.SpousesPartner = updateDto.SpousesPartner;
        if (updateDto.BirthDate.HasValue) contact.BirthDate = updateDto.BirthDate;
        if (updateDto.Anniversary.HasValue) contact.Anniversary = updateDto.Anniversary;

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
            Salutation = contact.Salutation,
            FirstName = contact.FirstName,
            MiddleName = contact.MiddleName,
            LastName = contact.LastName,
            FullName = contact.FullName,
            EmailAddress1 = contact.EmailAddress1,
            Telephone1 = contact.Telephone1,
            Telephone2 = contact.Telephone2,
            Telephone3 = contact.Telephone3,
            MobilePhone = contact.MobilePhone,
            Fax = contact.Fax,
            JobTitle = contact.JobTitle,
            ParentCustomerId = contact.ParentCustomerId,
            Address1AddressTypeCode = contact.Address1AddressTypeCode,
            Address1Name = contact.Address1Name,
            Address1Line1 = contact.Address1Line1,
            Address1Line2 = contact.Address1Line2,
            Address1Line3 = contact.Address1Line3,
            Address1City = contact.Address1City,
            Address1StateOrProvince = contact.Address1StateOrProvince,
            Address1PostalCode = contact.Address1PostalCode,
            Address1Country = contact.Address1Country,
            Address1Telephone1 = contact.Address1Telephone1,
            Description = contact.Description,
            Department = contact.Department,
            ManagerName = contact.ManagerName,
            ManagerPhone = contact.ManagerPhone,
            Role = contact.Role,
            AssistantName = contact.AssistantName,
            AssistantPhone = contact.AssistantPhone,
            GenderCode = contact.GenderCode,
            FamilyStatusCode = contact.FamilyStatusCode,
            SpousesPartner = contact.SpousesPartner,
            BirthDate = contact.BirthDate,
            Anniversary = contact.Anniversary,
            CreatedOn = contact.CreatedOn,
            CreatedBy = contact.CreatedBy,
            ModifiedOn = contact.ModifiedOn,
            ModifiedBy = contact.ModifiedBy
        };
    }
}
