using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<CustomersController> _logger;

    public CustomersController(AppDbContext context, ILogger<CustomersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CustomerDto>>> GetAll([FromQuery] bool? activeOnly = null)
    {
        var query = _context.Customers
            .Include(c => c.CompanyType)
            .AsQueryable();

        if (activeOnly == true)
        {
            query = query.Where(c => c.IsActive);
        }

        var customers = await query
            .OrderBy(c => c.AccountName)
            .ToListAsync();

        var customerDtos = customers.Select(MapToDto).ToList();
        return Ok(customerDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CustomerDto>> GetById(int id)
    {
        var customer = await _context.Customers
            .Include(c => c.CompanyType)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (customer == null)
        {
            return NotFound(new { message = $"Customer with ID {id} not found" });
        }

        return Ok(MapToDto(customer));
    }

    [HttpPost]
    public async Task<ActionResult<CustomerDto>> Create([FromBody] CreateCustomerDto createDto)
    {
        var customer = new Customer
        {
            AccountNo = createDto.AccountNo,
            AccountName = createDto.AccountName,
            CompanyTypeId = createDto.CompanyTypeId,
            Email = createDto.Email,
            Phone = createDto.Phone,
            Website = createDto.Website,
            VatRegistrationNo = createDto.VatRegistrationNo,
            CompanyRegistrationNo = createDto.CompanyRegistrationNo,
            StreetAddress = createDto.StreetAddress,
            City = createDto.City,
            Province = createDto.Province,
            PostalCode = createDto.PostalCode,
            Country = createDto.Country,
            CustomerStatus = createDto.CustomerStatus,
            IsActive = createDto.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();

        await _context.Entry(customer).Reference(c => c.CompanyType).LoadAsync();

        _logger.LogInformation("Created customer {AccountNo}: {AccountName}", 
            customer.AccountNo, customer.AccountName);

        return CreatedAtAction(nameof(GetById), new { id = customer.Id }, MapToDto(customer));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CustomerDto>> Update(int id, [FromBody] UpdateCustomerDto updateDto)
    {
        var customer = await _context.Customers
            .Include(c => c.CompanyType)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (customer == null)
        {
            return NotFound(new { message = $"Customer with ID {id} not found" });
        }

        if (updateDto.AccountNo != null) customer.AccountNo = updateDto.AccountNo;
        if (updateDto.AccountName != null) customer.AccountName = updateDto.AccountName;
        if (updateDto.CompanyTypeId.HasValue) customer.CompanyTypeId = updateDto.CompanyTypeId;
        if (updateDto.Email != null) customer.Email = updateDto.Email;
        if (updateDto.Phone != null) customer.Phone = updateDto.Phone;
        if (updateDto.Website != null) customer.Website = updateDto.Website;
        if (updateDto.VatRegistrationNo != null) customer.VatRegistrationNo = updateDto.VatRegistrationNo;
        if (updateDto.CompanyRegistrationNo != null) customer.CompanyRegistrationNo = updateDto.CompanyRegistrationNo;
        if (updateDto.StreetAddress != null) customer.StreetAddress = updateDto.StreetAddress;
        if (updateDto.City != null) customer.City = updateDto.City;
        if (updateDto.Province != null) customer.Province = updateDto.Province;
        if (updateDto.PostalCode != null) customer.PostalCode = updateDto.PostalCode;
        if (updateDto.Country != null) customer.Country = updateDto.Country;
        if (updateDto.CustomerStatus != null) customer.CustomerStatus = updateDto.CustomerStatus;
        if (updateDto.IsActive.HasValue) customer.IsActive = updateDto.IsActive.Value;
        
        customer.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Reload CompanyType navigation if it was changed
        if (updateDto.CompanyTypeId.HasValue)
        {
            await _context.Entry(customer).Reference(c => c.CompanyType).LoadAsync();
        }

        _logger.LogInformation("Updated customer {Id}: {AccountNo} - {AccountName}", 
            customer.Id, customer.AccountNo, customer.AccountName);

        return Ok(MapToDto(customer));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var customer = await _context.Customers.FindAsync(id);

        if (customer == null)
        {
            return NotFound(new { message = $"Customer with ID {id} not found" });
        }

        _context.Customers.Remove(customer);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted customer {Id}: {AccountNo} - {AccountName}", 
            customer.Id, customer.AccountNo, customer.AccountName);

        return NoContent();
    }

    private CustomerDto MapToDto(Customer customer)
    {
        return new CustomerDto
        {
            Id = customer.Id,
            AccountNo = customer.AccountNo,
            AccountName = customer.AccountName,
            CompanyTypeId = customer.CompanyTypeId,
            Email = customer.Email,
            Phone = customer.Phone,
            Website = customer.Website,
            VatRegistrationNo = customer.VatRegistrationNo,
            CompanyRegistrationNo = customer.CompanyRegistrationNo,
            StreetAddress = customer.StreetAddress,
            City = customer.City,
            Province = customer.Province,
            PostalCode = customer.PostalCode,
            Country = customer.Country,
            CustomerStatus = customer.CustomerStatus,
            IsActive = customer.IsActive,
            CreatedAt = customer.CreatedAt,
            UpdatedAt = customer.UpdatedAt,
            CompanyType = customer.CompanyType != null ? new CompanyDto
            {
                Id = customer.CompanyType.Id,
                Code = customer.CompanyType.Code,
                Name = customer.CompanyType.Name,
                Description = customer.CompanyType.Description,
                IsActive = customer.CompanyType.IsActive,
                SortOrder = customer.CompanyType.SortOrder,
                CreatedAt = customer.CompanyType.CreatedAt,
                UpdatedAt = customer.CompanyType.UpdatedAt
            } : null
        };
    }
}
