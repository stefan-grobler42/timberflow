using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SaleRepresentativesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<SaleRepresentativesController> _logger;

    public SaleRepresentativesController(AppDbContext context, ILogger<SaleRepresentativesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SaleRepresentativeDto>>> GetAll()
    {
        var saleReps = await _context.SaleRepresentatives
            .OrderBy(s => s.Name)
            .ToListAsync();

        var saleRepDtos = saleReps.Select(MapToDto).ToList();
        return Ok(saleRepDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SaleRepresentativeDto>> GetById(Guid id)
    {
        var saleRep = await _context.SaleRepresentatives.FindAsync(id);

        if (saleRep == null)
        {
            return NotFound(new { message = $"Sale Representative with ID {id} not found" });
        }

        return Ok(MapToDto(saleRep));
    }

    [HttpPost]
    public async Task<ActionResult<SaleRepresentativeDto>> Create([FromBody] CreateSaleRepresentativeDto createDto)
    {
        var saleRep = new SaleRepresentative
        {
            Id = Guid.NewGuid(),
            Name = createDto.Name,
            Cellnumber = createDto.Cellnumber,
            Emailaddress = createDto.Emailaddress,
            Employeeno = createDto.Employeeno,
            CreatedOn = DateTime.UtcNow
        };

        _context.SaleRepresentatives.Add(saleRep);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created sale representative {Id}: {Name}", saleRep.Id, saleRep.Name);

        return CreatedAtAction(nameof(GetById), new { id = saleRep.Id }, MapToDto(saleRep));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SaleRepresentativeDto>> Update(Guid id, [FromBody] UpdateSaleRepresentativeDto updateDto)
    {
        var saleRep = await _context.SaleRepresentatives.FindAsync(id);

        if (saleRep == null)
        {
            return NotFound(new { message = $"Sale Representative with ID {id} not found" });
        }

        if (updateDto.Name != null) saleRep.Name = updateDto.Name;
        if (updateDto.Cellnumber != null) saleRep.Cellnumber = updateDto.Cellnumber;
        if (updateDto.Emailaddress != null) saleRep.Emailaddress = updateDto.Emailaddress;
        if (updateDto.Employeeno != null) saleRep.Employeeno = updateDto.Employeeno;
        
        saleRep.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated sale representative {Id}: {Name}", saleRep.Id, saleRep.Name);

        return Ok(MapToDto(saleRep));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var saleRep = await _context.SaleRepresentatives.FindAsync(id);

        if (saleRep == null)
        {
            return NotFound(new { message = $"Sale Representative with ID {id} not found" });
        }

        _context.SaleRepresentatives.Remove(saleRep);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted sale representative {Id}: {Name}", saleRep.Id, saleRep.Name);

        return NoContent();
    }

    private SaleRepresentativeDto MapToDto(SaleRepresentative saleRep)
    {
        return new SaleRepresentativeDto
        {
            Id = saleRep.Id,
            Name = saleRep.Name,
            Cellnumber = saleRep.Cellnumber,
            Emailaddress = saleRep.Emailaddress,
            Employeeno = saleRep.Employeeno,
            NewEmployeefile = saleRep.NewEmployeefile,
            CreatedOn = saleRep.CreatedOn,
            CreatedBy = saleRep.CreatedBy,
            ModifiedOn = saleRep.ModifiedOn,
            ModifiedBy = saleRep.ModifiedBy
        };
    }
}
