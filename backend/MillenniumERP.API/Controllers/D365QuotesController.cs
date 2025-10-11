using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs.D365;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/d365quotes")]
public class D365QuotesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<D365QuotesController> _logger;

    public D365QuotesController(AppDbContext context, ILogger<D365QuotesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<D365QuoteDto>>> GetAll()
    {
        var quotes = await _context.D365Quotes
            .OrderBy(q => q.Name)
            .ToListAsync();

        var quoteDtos = quotes.Select(MapToDto).ToList();
        return Ok(quoteDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<D365QuoteDto>> GetById(Guid id)
    {
        var quote = await _context.D365Quotes.FindAsync(id);

        if (quote == null)
        {
            return NotFound(new { message = $"Quote with ID {id} not found" });
        }

        return Ok(MapToDto(quote));
    }

    [HttpPost]
    public async Task<ActionResult<D365QuoteDto>> Create([FromBody] CreateD365QuoteDto createDto)
    {
        var quote = new D365Quote
        {
            Id = Guid.NewGuid(),
            QuoteNumber = createDto.QuoteNumber,
            Name = createDto.Name,
            CustomerId = createDto.CustomerId,
            EffectiveFrom = createDto.EffectiveFrom,
            EffectiveTo = createDto.EffectiveTo,
            TotalAmount = createDto.TotalAmount,
            Description = createDto.Description,
            OwnerId = createDto.OwnerId,
            CreatedOn = DateTime.UtcNow
        };

        _context.D365Quotes.Add(quote);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created quote {Id}: {Name}", quote.Id, quote.Name);

        return CreatedAtAction(nameof(GetById), new { id = quote.Id }, MapToDto(quote));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<D365QuoteDto>> Update(Guid id, [FromBody] UpdateD365QuoteDto updateDto)
    {
        var quote = await _context.D365Quotes.FindAsync(id);

        if (quote == null)
        {
            return NotFound(new { message = $"Quote with ID {id} not found" });
        }

        if (updateDto.QuoteNumber != null) quote.QuoteNumber = updateDto.QuoteNumber;
        if (updateDto.Name != null) quote.Name = updateDto.Name;
        if (updateDto.CustomerId.HasValue) quote.CustomerId = updateDto.CustomerId;
        if (updateDto.EffectiveFrom.HasValue) quote.EffectiveFrom = updateDto.EffectiveFrom;
        if (updateDto.EffectiveTo.HasValue) quote.EffectiveTo = updateDto.EffectiveTo;
        if (updateDto.TotalAmount.HasValue) quote.TotalAmount = updateDto.TotalAmount;
        if (updateDto.StateCode.HasValue) quote.StateCode = updateDto.StateCode;
        if (updateDto.StatusCode.HasValue) quote.StatusCode = updateDto.StatusCode;
        if (updateDto.Description != null) quote.Description = updateDto.Description;

        quote.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated quote {Id}: {Name}", quote.Id, quote.Name);

        return Ok(MapToDto(quote));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var quote = await _context.D365Quotes.FindAsync(id);

        if (quote == null)
        {
            return NotFound(new { message = $"Quote with ID {id} not found" });
        }

        _context.D365Quotes.Remove(quote);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted quote {Id}: {Name}", quote.Id, quote.Name);

        return NoContent();
    }

    private D365QuoteDto MapToDto(D365Quote quote)
    {
        return new D365QuoteDto
        {
            Id = quote.Id,
            QuoteNumber = quote.QuoteNumber,
            Name = quote.Name,
            CustomerId = quote.CustomerId,
            EffectiveFrom = quote.EffectiveFrom,
            EffectiveTo = quote.EffectiveTo,
            TotalAmount = quote.TotalAmount,
            TotalDiscountAmount = quote.TotalDiscountAmount,
            TotalLineItemAmount = quote.TotalLineItemAmount,
            StateCode = quote.StateCode,
            StatusCode = quote.StatusCode,
            Description = quote.Description,
            OwnerId = quote.OwnerId,
            CreatedOn = quote.CreatedOn,
            CreatedBy = quote.CreatedBy,
            ModifiedOn = quote.ModifiedOn,
            ModifiedBy = quote.ModifiedBy
        };
    }
}
