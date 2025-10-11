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
            Id = Guid.NewGuid(),
            Name = createDto.Name,
            AccountNumber = createDto.AccountNumber,
            Telephone1 = createDto.Telephone1,
            EmailAddress1 = createDto.EmailAddress1,
            WebsiteUrl = createDto.WebsiteUrl,
            Address1Line1 = createDto.Address1Line1,
            Address1City = createDto.Address1City,
            Address1StateOrProvince = createDto.Address1StateOrProvince,
            Address1PostalCode = createDto.Address1PostalCode,
            Address1Country = createDto.Address1Country,
            Revenue = createDto.Revenue,
            NumberOfEmployees = createDto.NumberOfEmployees,
            IndustryCode = createDto.IndustryCode,
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
        if (updateDto.Telephone1 != null) account.Telephone1 = updateDto.Telephone1;
        if (updateDto.EmailAddress1 != null) account.EmailAddress1 = updateDto.EmailAddress1;
        if (updateDto.WebsiteUrl != null) account.WebsiteUrl = updateDto.WebsiteUrl;
        if (updateDto.Address1Line1 != null) account.Address1Line1 = updateDto.Address1Line1;
        if (updateDto.Address1City != null) account.Address1City = updateDto.Address1City;
        if (updateDto.Address1StateOrProvince != null) account.Address1StateOrProvince = updateDto.Address1StateOrProvince;
        if (updateDto.Address1PostalCode != null) account.Address1PostalCode = updateDto.Address1PostalCode;
        if (updateDto.Address1Country != null) account.Address1Country = updateDto.Address1Country;
        if (updateDto.Revenue.HasValue) account.Revenue = updateDto.Revenue;
        if (updateDto.NumberOfEmployees.HasValue) account.NumberOfEmployees = updateDto.NumberOfEmployees;
        if (updateDto.IndustryCode.HasValue) account.IndustryCode = updateDto.IndustryCode;
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
            Telephone1 = account.Telephone1,
            EmailAddress1 = account.EmailAddress1,
            WebsiteUrl = account.WebsiteUrl,
            Address1Line1 = account.Address1Line1,
            Address1City = account.Address1City,
            Address1StateOrProvince = account.Address1StateOrProvince,
            Address1PostalCode = account.Address1PostalCode,
            Address1Country = account.Address1Country,
            Revenue = account.Revenue,
            NumberOfEmployees = account.NumberOfEmployees,
            IndustryCode = account.IndustryCode,
            OwnerId = account.OwnerId,
            CreatedOn = account.CreatedOn,
            CreatedBy = account.CreatedBy,
            ModifiedOn = account.ModifiedOn,
            ModifiedBy = account.ModifiedBy
        };
    }
}
