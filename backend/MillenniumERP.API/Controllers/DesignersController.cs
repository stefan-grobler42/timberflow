using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DesignersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<DesignersController> _logger;

    public DesignersController(AppDbContext context, ILogger<DesignersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<DesignerDto>>> GetAll()
    {
        var designers = await _context.Designers
            .OrderBy(d => d.Name)
            .ToListAsync();

        var designerDtos = designers.Select(MapToDto).ToList();
        return Ok(designerDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DesignerDto>> GetById(Guid id)
    {
        var designer = await _context.Designers.FindAsync(id);

        if (designer == null)
        {
            return NotFound(new { message = $"Designer with ID {id} not found" });
        }

        return Ok(MapToDto(designer));
    }

    [HttpPost]
    public async Task<ActionResult<DesignerDto>> Create([FromBody] CreateDesignerDto createDto)
    {
        var designer = new Designer
        {
            Id = Guid.NewGuid(),
            Name = createDto.Name,
            Cellnumber = createDto.CellNumber,
            Emailaddress = createDto.EmailAddress,
            Employeeno = createDto.EmployeeNo,
            CreatedOn = DateTime.UtcNow
        };

        _context.Designers.Add(designer);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created designer {Id}: {Name}", designer.Id, designer.Name);

        return CreatedAtAction(nameof(GetById), new { id = designer.Id }, MapToDto(designer));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<DesignerDto>> Update(Guid id, [FromBody] UpdateDesignerDto updateDto)
    {
        var designer = await _context.Designers.FindAsync(id);

        if (designer == null)
        {
            return NotFound(new { message = $"Designer with ID {id} not found" });
        }

        if (updateDto.Name != null) designer.Name = updateDto.Name;
        if (updateDto.CellNumber != null) designer.Cellnumber = updateDto.CellNumber;
        if (updateDto.EmailAddress != null) designer.Emailaddress = updateDto.EmailAddress;
        if (updateDto.EmployeeNo != null) designer.Employeeno = updateDto.EmployeeNo;
        
        designer.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated designer {Id}: {Name}", designer.Id, designer.Name);

        return Ok(MapToDto(designer));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var designer = await _context.Designers.FindAsync(id);

        if (designer == null)
        {
            return NotFound(new { message = $"Designer with ID {id} not found" });
        }

        _context.Designers.Remove(designer);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted designer {Id}: {Name}", designer.Id, designer.Name);

        return NoContent();
    }

    private DesignerDto MapToDto(Designer designer)
    {
        return new DesignerDto
        {
            Id = designer.Id,
            Name = designer.Name,
            CellNumber = designer.Cellnumber,
            EmailAddress = designer.Emailaddress,
            EmployeeNo = designer.Employeeno,
            NewDisplayNameCalculated = designer.NewDisplaynamecalculated,
            NewEmployeeFile = designer.NewEmployeefile,
            CreatedOn = designer.CreatedOn,
            CreatedBy = designer.CreatedBy,
            ModifiedOn = designer.ModifiedOn,
            ModifiedBy = designer.ModifiedBy
        };
    }
}
