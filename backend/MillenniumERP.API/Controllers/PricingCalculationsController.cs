using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PricingCalculationsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<PricingCalculationsController> _logger;

    public PricingCalculationsController(AppDbContext context, ILogger<PricingCalculationsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PricingCalculationDto>>> GetAll()
    {
        var calculations = await _context.PricingCalculations
            .OrderBy(p => p.Productname)
            .ToListAsync();

        var calculationDtos = calculations.Select(MapToDto).ToList();
        return Ok(calculationDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PricingCalculationDto>> GetById(Guid id)
    {
        var calculation = await _context.PricingCalculations.FindAsync(id);

        if (calculation == null)
        {
            return NotFound(new { message = $"Pricing Calculation with ID {id} not found" });
        }

        return Ok(MapToDto(calculation));
    }

    [HttpPost]
    public async Task<ActionResult<PricingCalculationDto>> Create([FromBody] CreatePricingCalculationDto createDto)
    {
        var calculation = new PricingCalculation
        {
            Id = Guid.NewGuid(),
            Productname = createDto.Productname,
            Test = createDto.Test,
            Discount = createDto.Discount,
            Installedcost = createDto.Installedcost,
            Quantity = createDto.Quantity,
            Totalprice = createDto.Totalprice,
            Unitprice = createDto.Unitprice,
            CreatedOn = DateTime.UtcNow
        };

        _context.PricingCalculations.Add(calculation);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created pricing calculation {Id}", calculation.Id);

        return CreatedAtAction(nameof(GetById), new { id = calculation.Id }, MapToDto(calculation));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<PricingCalculationDto>> Update(Guid id, [FromBody] UpdatePricingCalculationDto updateDto)
    {
        var calculation = await _context.PricingCalculations.FindAsync(id);

        if (calculation == null)
        {
            return NotFound(new { message = $"Pricing Calculation with ID {id} not found" });
        }

        if (updateDto.Productname != null) calculation.Productname = updateDto.Productname;
        if (updateDto.Test != null) calculation.Test = updateDto.Test;
        if (updateDto.Discount.HasValue) calculation.Discount = updateDto.Discount;
        if (updateDto.Installedcost.HasValue) calculation.Installedcost = updateDto.Installedcost;
        if (updateDto.Quantity.HasValue) calculation.Quantity = updateDto.Quantity;
        if (updateDto.Totalprice.HasValue) calculation.Totalprice = updateDto.Totalprice;
        if (updateDto.Unitprice.HasValue) calculation.Unitprice = updateDto.Unitprice;
        
        calculation.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated pricing calculation {Id}", calculation.Id);

        return Ok(MapToDto(calculation));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var calculation = await _context.PricingCalculations.FindAsync(id);

        if (calculation == null)
        {
            return NotFound(new { message = $"Pricing Calculation with ID {id} not found" });
        }

        _context.PricingCalculations.Remove(calculation);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted pricing calculation {Id}", calculation.Id);

        return NoContent();
    }

    private PricingCalculationDto MapToDto(PricingCalculation calculation)
    {
        return new PricingCalculationDto
        {
            Id = calculation.Id,
            Productname = calculation.Productname,
            Test = calculation.Test,
            Discount = calculation.Discount,
            Installedcost = calculation.Installedcost,
            InstalledcostBase = calculation.InstalledcostBase,
            Quantity = calculation.Quantity,
            Totalprice = calculation.Totalprice,
            TotalpriceBase = calculation.TotalpriceBase,
            Unitprice = calculation.Unitprice,
            UnitpriceBase = calculation.UnitpriceBase,
            Exchangerate = calculation.Exchangerate,
            Transactioncurrencyid = calculation.Transactioncurrencyid,
            CreatedOn = calculation.CreatedOn,
            CreatedBy = calculation.CreatedBy,
            ModifiedOn = calculation.ModifiedOn,
            ModifiedBy = calculation.ModifiedBy
        };
    }
}
