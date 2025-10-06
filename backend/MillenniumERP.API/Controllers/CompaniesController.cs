using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CompaniesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<CompaniesController> _logger;

    public CompaniesController(AppDbContext context, ILogger<CompaniesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CompanyDto>>> GetAll([FromQuery] bool? activeOnly = null)
    {
        var query = _context.Companies.AsQueryable();

        if (activeOnly == true)
        {
            query = query.Where(c => c.IsActive);
        }

        var companies = await query
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .ToListAsync();

        var companyDtos = companies.Select(MapToDto).ToList();
        return Ok(companyDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CompanyDto>> GetById(int id)
    {
        var company = await _context.Companies.FindAsync(id);

        if (company == null)
        {
            return NotFound(new { message = $"Company with ID {id} not found" });
        }

        return Ok(MapToDto(company));
    }

    [HttpPost]
    public async Task<ActionResult<CompanyDto>> Create([FromBody] CreateCompanyDto createDto)
    {
        var company = new Company
        {
            Code = createDto.Code,
            Name = createDto.Name,
            Description = createDto.Description,
            IsActive = createDto.IsActive,
            SortOrder = createDto.SortOrder,
            CreatedAt = DateTime.UtcNow
        };

        _context.Companies.Add(company);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created company {Code}: {Name}", company.Code, company.Name);

        return CreatedAtAction(nameof(GetById), new { id = company.Id }, MapToDto(company));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CompanyDto>> Update(int id, [FromBody] UpdateCompanyDto updateDto)
    {
        var company = await _context.Companies.FindAsync(id);

        if (company == null)
        {
            return NotFound(new { message = $"Company with ID {id} not found" });
        }

        if (updateDto.Code != null) company.Code = updateDto.Code;
        if (updateDto.Name != null) company.Name = updateDto.Name;
        if (updateDto.Description != null) company.Description = updateDto.Description;
        if (updateDto.IsActive.HasValue) company.IsActive = updateDto.IsActive.Value;
        if (updateDto.SortOrder.HasValue) company.SortOrder = updateDto.SortOrder.Value;
        
        company.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated company {Id}: {Code} - {Name}", company.Id, company.Code, company.Name);

        return Ok(MapToDto(company));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var company = await _context.Companies.FindAsync(id);

        if (company == null)
        {
            return NotFound(new { message = $"Company with ID {id} not found" });
        }

        _context.Companies.Remove(company);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted company {Id}: {Code} - {Name}", company.Id, company.Code, company.Name);

        return NoContent();
    }

    private static CompanyDto MapToDto(Company company)
    {
        return new CompanyDto
        {
            Id = company.Id,
            Code = company.Code,
            Name = company.Name,
            Description = company.Description,
            IsActive = company.IsActive,
            SortOrder = company.SortOrder,
            CreatedAt = company.CreatedAt,
            UpdatedAt = company.UpdatedAt
        };
    }
}
