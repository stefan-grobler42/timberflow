using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductionsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<ProductionsController> _logger;

    public ProductionsController(AppDbContext context, ILogger<ProductionsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductionDto>>> GetAll([FromQuery] bool? completeOnly = null)
    {
        var query = _context.Productions.AsQueryable();

        if (completeOnly == true)
        {
            query = query.Where(p => p.Productioncomplete == true);
        }

        var productions = await query
            .OrderBy(p => p.Name)
            .ToListAsync();

        var productionDtos = productions.Select(MapToDto).ToList();
        return Ok(productionDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductionDto>> GetById(Guid id)
    {
        var production = await _context.Productions.FindAsync(id);

        if (production == null)
        {
            return NotFound(new { message = $"Production with ID {id} not found" });
        }

        return Ok(MapToDto(production));
    }

    [HttpPost]
    public async Task<ActionResult<ProductionDto>> Create([FromBody] CreateProductionDto createDto)
    {
        var production = new Production
        {
            Id = Guid.NewGuid(),
            Name = createDto.Name,
            Customer = createDto.Customer,
            Orderno = createDto.Orderno,
            Jigstart = createDto.Jigstart,
            Jigend = createDto.Jigend,
            Jigleader = createDto.Jigleader,
            Jighelper1 = createDto.Jighelper1,
            Jighelper2 = createDto.Jighelper2,
            Jighelper3 = createDto.Jighelper3,
            Jighelper4 = createDto.Jighelper4,
            Pickstart = createDto.Pickstart,
            Pickend = createDto.Pickend,
            Pickingmaster = createDto.Pickingmaster,
            Pickinghelper1 = createDto.Pickinghelper1,
            Pickinghelper2 = createDto.Pickinghelper2,
            Pickinghelper3 = createDto.Pickinghelper3,
            Sawstart = createDto.Sawstart,
            Sawend = createDto.Sawend,
            Sawoperator = createDto.Sawoperator,
            Sawhelper1 = createDto.Sawhelper1,
            Sawhelper2 = createDto.Sawhelper2,
            Productioncomplete = createDto.Productioncomplete,
            Productionplanneddate = createDto.Productionplanneddate,
            Totalcuts = createDto.Totalcuts,
            Totaltimbercubes = createDto.Totaltimbercubes,
            Trusscost = createDto.Trusscost,
            Trussselling = createDto.Trussselling,
            Workunitsefinks = createDto.Workunitsefinks,
            NewEstimatedefinks = createDto.NewEstimatedefinks,
            CreatedOn = DateTime.UtcNow
        };

        _context.Productions.Add(production);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created production {Id}: {Name}", production.Id, production.Name);

        return CreatedAtAction(nameof(GetById), new { id = production.Id }, MapToDto(production));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ProductionDto>> Update(Guid id, [FromBody] UpdateProductionDto updateDto)
    {
        var production = await _context.Productions.FindAsync(id);

        if (production == null)
        {
            return NotFound(new { message = $"Production with ID {id} not found" });
        }

        if (updateDto.Name != null) production.Name = updateDto.Name;
        if (updateDto.Customer.HasValue) production.Customer = updateDto.Customer;
        if (updateDto.Orderno.HasValue) production.Orderno = updateDto.Orderno;
        if (updateDto.Jigstart.HasValue) production.Jigstart = updateDto.Jigstart;
        if (updateDto.Jigend.HasValue) production.Jigend = updateDto.Jigend;
        if (updateDto.Jigleader.HasValue) production.Jigleader = updateDto.Jigleader;
        if (updateDto.Jighelper1.HasValue) production.Jighelper1 = updateDto.Jighelper1;
        if (updateDto.Jighelper2.HasValue) production.Jighelper2 = updateDto.Jighelper2;
        if (updateDto.Jighelper3.HasValue) production.Jighelper3 = updateDto.Jighelper3;
        if (updateDto.Jighelper4.HasValue) production.Jighelper4 = updateDto.Jighelper4;
        if (updateDto.Pickstart.HasValue) production.Pickstart = updateDto.Pickstart;
        if (updateDto.Pickend.HasValue) production.Pickend = updateDto.Pickend;
        if (updateDto.Pickingmaster.HasValue) production.Pickingmaster = updateDto.Pickingmaster;
        if (updateDto.Pickinghelper1.HasValue) production.Pickinghelper1 = updateDto.Pickinghelper1;
        if (updateDto.Pickinghelper2.HasValue) production.Pickinghelper2 = updateDto.Pickinghelper2;
        if (updateDto.Pickinghelper3.HasValue) production.Pickinghelper3 = updateDto.Pickinghelper3;
        if (updateDto.Sawstart.HasValue) production.Sawstart = updateDto.Sawstart;
        if (updateDto.Sawend.HasValue) production.Sawend = updateDto.Sawend;
        if (updateDto.Sawoperator.HasValue) production.Sawoperator = updateDto.Sawoperator;
        if (updateDto.Sawhelper1.HasValue) production.Sawhelper1 = updateDto.Sawhelper1;
        if (updateDto.Sawhelper2.HasValue) production.Sawhelper2 = updateDto.Sawhelper2;
        if (updateDto.Productioncomplete.HasValue) production.Productioncomplete = updateDto.Productioncomplete;
        if (updateDto.Productionplanneddate.HasValue) production.Productionplanneddate = updateDto.Productionplanneddate;
        if (updateDto.Totalcuts.HasValue) production.Totalcuts = updateDto.Totalcuts;
        if (updateDto.Totaltimbercubes.HasValue) production.Totaltimbercubes = updateDto.Totaltimbercubes;
        if (updateDto.Trusscost.HasValue) production.Trusscost = updateDto.Trusscost;
        if (updateDto.Trussselling.HasValue) production.Trussselling = updateDto.Trussselling;
        if (updateDto.Workunitsefinks.HasValue) production.Workunitsefinks = updateDto.Workunitsefinks;
        if (updateDto.NewEstimatedefinks.HasValue) production.NewEstimatedefinks = updateDto.NewEstimatedefinks;
        
        production.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated production {Id}: {Name}", production.Id, production.Name);

        return Ok(MapToDto(production));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var production = await _context.Productions.FindAsync(id);

        if (production == null)
        {
            return NotFound(new { message = $"Production with ID {id} not found" });
        }

        _context.Productions.Remove(production);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted production {Id}: {Name}", production.Id, production.Name);

        return NoContent();
    }

    private ProductionDto MapToDto(Production production)
    {
        return new ProductionDto
        {
            Id = production.Id,
            Name = production.Name,
            Customer = production.Customer,
            Orderno = production.Orderno,
            Jigstart = production.Jigstart,
            Jigend = production.Jigend,
            Jigleader = production.Jigleader,
            Jighelper1 = production.Jighelper1,
            Jighelper2 = production.Jighelper2,
            Jighelper3 = production.Jighelper3,
            Jighelper4 = production.Jighelper4,
            Pickstart = production.Pickstart,
            Pickend = production.Pickend,
            Pickingmaster = production.Pickingmaster,
            Pickinghelper1 = production.Pickinghelper1,
            Pickinghelper2 = production.Pickinghelper2,
            Pickinghelper3 = production.Pickinghelper3,
            Sawstart = production.Sawstart,
            Sawend = production.Sawend,
            Sawoperator = production.Sawoperator,
            Sawhelper1 = production.Sawhelper1,
            Sawhelper2 = production.Sawhelper2,
            Productioncomplete = production.Productioncomplete,
            Productionplanneddate = production.Productionplanneddate,
            Totalcuts = production.Totalcuts,
            Totaltimbercubes = production.Totaltimbercubes,
            Trusscost = production.Trusscost,
            Trussselling = production.Trussselling,
            Workunitsefinks = production.Workunitsefinks,
            NewEstimatedefinks = production.NewEstimatedefinks,
            CreatedOn = production.CreatedOn,
            CreatedBy = production.CreatedBy,
            ModifiedOn = production.ModifiedOn,
            ModifiedBy = production.ModifiedBy
        };
    }
}
