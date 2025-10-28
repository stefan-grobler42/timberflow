using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs.D365;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/d365quotedetails")]
public class D365QuoteDetailsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<D365QuoteDetailsController> _logger;

    public D365QuoteDetailsController(AppDbContext context, ILogger<D365QuoteDetailsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<D365QuoteDetailDto>>> GetAll()
    {
        var details = await _context.D365QuoteDetails
            .OrderBy(d => d.QuoteId)
            .ThenBy(d => d.LineItemNumber)
            .ToListAsync();

        var detailDtos = details.Select(MapToDto).ToList();
        return Ok(detailDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<D365QuoteDetailDto>> GetById(Guid id)
    {
        var detail = await _context.D365QuoteDetails.FindAsync(id);

        if (detail == null)
        {
            return NotFound(new { message = $"Quote detail with ID {id} not found" });
        }

        return Ok(MapToDto(detail));
    }

    [HttpGet("/api/d365quotes/{quoteId}/details")]
    public async Task<ActionResult<IEnumerable<D365QuoteDetailDto>>> GetByQuoteId(Guid quoteId)
    {
        var details = await _context.D365QuoteDetails
            .Where(d => d.QuoteId == quoteId)
            .OrderBy(d => d.LineItemNumber)
            .ToListAsync();

        var detailDtos = details.Select(MapToDto).ToList();
        return Ok(detailDtos);
    }

    [HttpPost]
    public async Task<ActionResult<D365QuoteDetailDto>> Create([FromBody] CreateD365QuoteDetailDto createDto)
    {
        var quote = await _context.D365Quotes.FindAsync(createDto.QuoteId);
        if (quote == null)
        {
            return NotFound(new { message = $"Quote with ID {createDto.QuoteId} not found" });
        }

        var detail = new D365QuoteDetail
        {
            Id = Guid.NewGuid(),
            QuoteId = createDto.QuoteId,
            ProductId = createDto.ProductId,
            ProductName = createDto.ProductName,
            Description = createDto.Description,
            Quantity = createDto.Quantity,
            PricePerUnit = createDto.PricePerUnit,
            ManualDiscountAmount = createDto.ManualDiscountAmount,
            Tax = createDto.Tax,
            BaseAmount = createDto.BaseAmount,
            ExtendedAmount = createDto.ExtendedAmount,
            LineItemNumber = createDto.LineItemNumber,
            CreatedOn = DateTime.UtcNow
        };

        _context.D365QuoteDetails.Add(detail);
        await _context.SaveChangesAsync();

        await RecalculateQuoteTotals(createDto.QuoteId);

        _logger.LogInformation("Created quote detail {Id} for quote {QuoteId}", detail.Id, detail.QuoteId);

        return CreatedAtAction(nameof(GetById), new { id = detail.Id }, MapToDto(detail));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<D365QuoteDetailDto>> Update(Guid id, [FromBody] UpdateD365QuoteDetailDto updateDto)
    {
        var detail = await _context.D365QuoteDetails.FindAsync(id);

        if (detail == null)
        {
            return NotFound(new { message = $"Quote detail with ID {id} not found" });
        }

        if (updateDto.ProductId.HasValue) detail.ProductId = updateDto.ProductId;
        if (updateDto.ProductName != null) detail.ProductName = updateDto.ProductName;
        if (updateDto.Description != null) detail.Description = updateDto.Description;
        if (updateDto.Quantity.HasValue) detail.Quantity = updateDto.Quantity;
        if (updateDto.PricePerUnit.HasValue) detail.PricePerUnit = updateDto.PricePerUnit;
        if (updateDto.ManualDiscountAmount.HasValue) detail.ManualDiscountAmount = updateDto.ManualDiscountAmount;
        if (updateDto.Tax.HasValue) detail.Tax = updateDto.Tax;
        if (updateDto.BaseAmount.HasValue) detail.BaseAmount = updateDto.BaseAmount;
        if (updateDto.ExtendedAmount.HasValue) detail.ExtendedAmount = updateDto.ExtendedAmount;
        if (updateDto.LineItemNumber.HasValue) detail.LineItemNumber = updateDto.LineItemNumber;

        detail.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await RecalculateQuoteTotals(detail.QuoteId);

        _logger.LogInformation("Updated quote detail {Id} for quote {QuoteId}", detail.Id, detail.QuoteId);

        return Ok(MapToDto(detail));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var detail = await _context.D365QuoteDetails.FindAsync(id);

        if (detail == null)
        {
            return NotFound(new { message = $"Quote detail with ID {id} not found" });
        }

        var quoteId = detail.QuoteId;

        _context.D365QuoteDetails.Remove(detail);
        await _context.SaveChangesAsync();

        await RecalculateQuoteTotals(quoteId);

        _logger.LogInformation("Deleted quote detail {Id} from quote {QuoteId}", id, quoteId);

        return NoContent();
    }

    private async Task RecalculateQuoteTotals(Guid quoteId)
    {
        var quote = await _context.D365Quotes
            .Include(q => q.QuoteDetails)
            .FirstOrDefaultAsync(q => q.Id == quoteId);

        if (quote == null) return;

        quote.TotalLineItemAmount = quote.QuoteDetails?.Sum(d => d.ExtendedAmount ?? 0) ?? 0;
        quote.TotalTax = quote.QuoteDetails?.Sum(d => d.Tax ?? 0) ?? 0;
        quote.TotalDiscountAmount = quote.QuoteDetails?.Sum(d => d.ManualDiscountAmount ?? 0) ?? 0;
        
        quote.TotalAmount = quote.TotalLineItemAmount + quote.TotalTax + (quote.FreightAmount ?? 0);

        quote.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Recalculated totals for quote {QuoteId}: Total={Total}, LineItems={LineItems}, Tax={Tax}", 
            quoteId, quote.TotalAmount, quote.TotalLineItemAmount, quote.TotalTax);
    }

    private D365QuoteDetailDto MapToDto(D365QuoteDetail detail)
    {
        return new D365QuoteDetailDto
        {
            Id = detail.Id,
            QuoteId = detail.QuoteId,
            ProductId = detail.ProductId,
            ProductName = detail.ProductName,
            Description = detail.Description,
            Quantity = detail.Quantity,
            PricePerUnit = detail.PricePerUnit,
            ManualDiscountAmount = detail.ManualDiscountAmount,
            Tax = detail.Tax,
            BaseAmount = detail.BaseAmount,
            ExtendedAmount = detail.ExtendedAmount,
            LineItemNumber = detail.LineItemNumber,
            CreatedOn = detail.CreatedOn,
            ModifiedOn = detail.ModifiedOn,
            CreatedBy = detail.CreatedBy,
            ModifiedBy = detail.ModifiedBy
        };
    }
}
