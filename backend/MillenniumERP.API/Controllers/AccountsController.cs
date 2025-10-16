using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs.D365;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/accounts")]
public class AccountsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<AccountsController> _logger;

    public AccountsController(AppDbContext context, ILogger<AccountsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AccountDto>>> GetAll()
    {
        var accounts = await _context.Accounts
            .OrderBy(a => a.Name)
            .ToListAsync();

        var accountDtos = accounts.Select(MapToDto).ToList();
        return Ok(accountDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AccountDto>> GetById(Guid id)
    {
        var account = await _context.Accounts.FindAsync(id);

        if (account == null)
        {
            return NotFound(new { message = $"Account with ID {id} not found" });
        }

        return Ok(MapToDto(account));
    }

    [HttpPost]
    public async Task<ActionResult<AccountDto>> Create([FromBody] CreateAccountDto createDto)
    {
        var account = new Account
        {
            Id = createDto.Id ?? Guid.NewGuid(),  // Use provided ID (for migration) or generate new one
            Name = createDto.Name,
            AccountNumber = createDto.AccountNumber,
            
            // D365 Custom Fields
            Cr694CompanyType = createDto.Cr694CompanyType,
            Cr694CompanyRegistrationNumber = createDto.Cr694CompanyRegistrationNumber,
            Cr694VatRegistrationNo = createDto.Cr694VatRegistrationNo,
            Cr694AccountType = createDto.Cr694AccountType,
            Cr694SalesRepresentative = createDto.Cr694SalesRepresentative,
            
            // Contact Information
            Telephone1 = createDto.Telephone1,
            Telephone2 = createDto.Telephone2,
            Telephone3 = createDto.Telephone3,
            Fax = createDto.Fax,
            EmailAddress1 = createDto.EmailAddress1,
            EmailAddress2 = createDto.EmailAddress2,
            EmailAddress3 = createDto.EmailAddress3,
            WebsiteUrl = createDto.WebsiteUrl,
            
            // Address Information
            Address1Name = createDto.Address1Name,
            Address1Line1 = createDto.Address1Line1,
            Address1Line2 = createDto.Address1Line2,
            Address1Line3 = createDto.Address1Line3,
            Address1City = createDto.Address1City,
            Address1StateOrProvince = createDto.Address1StateOrProvince,
            Address1PostalCode = createDto.Address1PostalCode,
            Address1Country = createDto.Address1Country,
            Address1County = createDto.Address1County,
            Address1Latitude = createDto.Address1Latitude,
            Address1Longitude = createDto.Address1Longitude,
            
            // Relationships
            ParentAccountId = createDto.ParentAccountId,
            PrimaryContactId = createDto.PrimaryContactId,
            
            // Financial
            Revenue = createDto.Revenue,
            CreditLimit = createDto.CreditLimit,
            PaymentTermsCode = createDto.PaymentTermsCode,
            
            // Other
            NumberOfEmployees = createDto.NumberOfEmployees,
            IndustryCode = createDto.IndustryCode,
            RelationshipTypeCode = createDto.RelationshipTypeCode,
            OwnerId = createDto.OwnerId,
            CreatedOn = DateTime.UtcNow
        };

        _context.Accounts.Add(account);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created account {Id}: {Name}", account.Id, account.Name);

        return CreatedAtAction(nameof(GetById), new { id = account.Id }, MapToDto(account));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<AccountDto>> Update(Guid id, [FromBody] UpdateAccountDto updateDto)
    {
        var account = await _context.Accounts.FindAsync(id);

        if (account == null)
        {
            return NotFound(new { message = $"Account with ID {id} not found" });
        }

        if (updateDto.Name != null) account.Name = updateDto.Name;
        if (updateDto.AccountNumber != null) account.AccountNumber = updateDto.AccountNumber;
        
        // D365 Custom Fields
        if (updateDto.Cr694CompanyType.HasValue) account.Cr694CompanyType = updateDto.Cr694CompanyType;
        if (updateDto.Cr694CompanyRegistrationNumber != null) account.Cr694CompanyRegistrationNumber = updateDto.Cr694CompanyRegistrationNumber;
        if (updateDto.Cr694VatRegistrationNo != null) account.Cr694VatRegistrationNo = updateDto.Cr694VatRegistrationNo;
        if (updateDto.Cr694AccountType.HasValue) account.Cr694AccountType = updateDto.Cr694AccountType;
        if (updateDto.Cr694SalesRepresentative.HasValue) account.Cr694SalesRepresentative = updateDto.Cr694SalesRepresentative;
        
        // Contact Information
        if (updateDto.Telephone1 != null) account.Telephone1 = updateDto.Telephone1;
        if (updateDto.Telephone2 != null) account.Telephone2 = updateDto.Telephone2;
        if (updateDto.Telephone3 != null) account.Telephone3 = updateDto.Telephone3;
        if (updateDto.Fax != null) account.Fax = updateDto.Fax;
        if (updateDto.EmailAddress1 != null) account.EmailAddress1 = updateDto.EmailAddress1;
        if (updateDto.EmailAddress2 != null) account.EmailAddress2 = updateDto.EmailAddress2;
        if (updateDto.EmailAddress3 != null) account.EmailAddress3 = updateDto.EmailAddress3;
        if (updateDto.WebsiteUrl != null) account.WebsiteUrl = updateDto.WebsiteUrl;
        
        // Address Information
        if (updateDto.Address1Name != null) account.Address1Name = updateDto.Address1Name;
        if (updateDto.Address1Line1 != null) account.Address1Line1 = updateDto.Address1Line1;
        if (updateDto.Address1Line2 != null) account.Address1Line2 = updateDto.Address1Line2;
        if (updateDto.Address1Line3 != null) account.Address1Line3 = updateDto.Address1Line3;
        if (updateDto.Address1City != null) account.Address1City = updateDto.Address1City;
        if (updateDto.Address1StateOrProvince != null) account.Address1StateOrProvince = updateDto.Address1StateOrProvince;
        if (updateDto.Address1PostalCode != null) account.Address1PostalCode = updateDto.Address1PostalCode;
        if (updateDto.Address1Country != null) account.Address1Country = updateDto.Address1Country;
        if (updateDto.Address1County != null) account.Address1County = updateDto.Address1County;
        if (updateDto.Address1Latitude.HasValue) account.Address1Latitude = updateDto.Address1Latitude;
        if (updateDto.Address1Longitude.HasValue) account.Address1Longitude = updateDto.Address1Longitude;
        
        // Relationships
        if (updateDto.ParentAccountId.HasValue) account.ParentAccountId = updateDto.ParentAccountId;
        if (updateDto.PrimaryContactId.HasValue) account.PrimaryContactId = updateDto.PrimaryContactId;
        
        // Financial
        if (updateDto.Revenue.HasValue) account.Revenue = updateDto.Revenue;
        if (updateDto.CreditLimit.HasValue) account.CreditLimit = updateDto.CreditLimit;
        if (updateDto.PaymentTermsCode.HasValue) account.PaymentTermsCode = updateDto.PaymentTermsCode;
        
        // Other
        if (updateDto.NumberOfEmployees.HasValue) account.NumberOfEmployees = updateDto.NumberOfEmployees;
        if (updateDto.IndustryCode.HasValue) account.IndustryCode = updateDto.IndustryCode;
        if (updateDto.RelationshipTypeCode.HasValue) account.RelationshipTypeCode = updateDto.RelationshipTypeCode;
        if (updateDto.OwnerId.HasValue) account.OwnerId = updateDto.OwnerId;

        account.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated account {Id}: {Name}", account.Id, account.Name);

        return Ok(MapToDto(account));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var account = await _context.Accounts.FindAsync(id);

        if (account == null)
        {
            return NotFound(new { message = $"Account with ID {id} not found" });
        }

        _context.Accounts.Remove(account);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted account {Id}: {Name}", account.Id, account.Name);

        return NoContent();
    }

    private AccountDto MapToDto(Account account)
    {
        return new AccountDto
        {
            Id = account.Id,
            Name = account.Name,
            AccountNumber = account.AccountNumber,
            
            // D365 Custom Fields
            Cr694CompanyType = account.Cr694CompanyType,
            Cr694CompanyRegistrationNumber = account.Cr694CompanyRegistrationNumber,
            Cr694VatRegistrationNo = account.Cr694VatRegistrationNo,
            Cr694AccountType = account.Cr694AccountType,
            Cr694SalesRepresentative = account.Cr694SalesRepresentative,
            
            // Contact Information
            Telephone1 = account.Telephone1,
            Telephone2 = account.Telephone2,
            Telephone3 = account.Telephone3,
            Fax = account.Fax,
            EmailAddress1 = account.EmailAddress1,
            EmailAddress2 = account.EmailAddress2,
            EmailAddress3 = account.EmailAddress3,
            WebsiteUrl = account.WebsiteUrl,
            
            // Address Information
            Address1Name = account.Address1Name,
            Address1Line1 = account.Address1Line1,
            Address1Line2 = account.Address1Line2,
            Address1Line3 = account.Address1Line3,
            Address1City = account.Address1City,
            Address1StateOrProvince = account.Address1StateOrProvince,
            Address1PostalCode = account.Address1PostalCode,
            Address1Country = account.Address1Country,
            Address1County = account.Address1County,
            Address1Latitude = account.Address1Latitude,
            Address1Longitude = account.Address1Longitude,
            
            // Relationships
            ParentAccountId = account.ParentAccountId,
            PrimaryContactId = account.PrimaryContactId,
            
            // Financial
            Revenue = account.Revenue,
            CreditLimit = account.CreditLimit,
            PaymentTermsCode = account.PaymentTermsCode,
            
            // Other
            NumberOfEmployees = account.NumberOfEmployees,
            IndustryCode = account.IndustryCode,
            RelationshipTypeCode = account.RelationshipTypeCode,
            OwnerId = account.OwnerId,
            CreatedOn = account.CreatedOn,
            CreatedBy = account.CreatedBy,
            ModifiedOn = account.ModifiedOn,
            ModifiedBy = account.ModifiedBy
        };
    }
}
