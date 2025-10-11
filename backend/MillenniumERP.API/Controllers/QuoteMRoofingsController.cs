using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QuotesMRoofingController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<QuotesMRoofingController> _logger;

    public QuotesMRoofingController(AppDbContext context, ILogger<QuotesMRoofingController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<QuoteMRoofingDto>>> GetAll()
    {
        var quotes = await _context.QuotesMRoofing
            .OrderBy(q => q.Name)
            .ToListAsync();

        var quoteDtos = quotes.Select(MapToDto).ToList();
        return Ok(quoteDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<QuoteMRoofingDto>> GetById(Guid id)
    {
        var quote = await _context.QuotesMRoofing.FindAsync(id);

        if (quote == null)
        {
            return NotFound(new { message = $"Quote with ID {id} not found" });
        }

        return Ok(MapToDto(quote));
    }

    [HttpPost]
    public async Task<ActionResult<QuoteMRoofingDto>> Create([FromBody] CreateQuoteMRoofingDto createDto)
    {
        var quote = new QuoteMRoofing
        {
            Id = Guid.NewGuid(),
            Name = createDto.Name,
            Account = createDto.Account,
            CreatedOn = DateTime.UtcNow
        };

        _context.QuotesMRoofing.Add(quote);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created quote {Id}: {Name}", quote.Id, quote.Name);

        return CreatedAtAction(nameof(GetById), new { id = quote.Id }, MapToDto(quote));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<QuoteMRoofingDto>> Update(Guid id, [FromBody] UpdateQuoteMRoofingDto updateDto)
    {
        var quote = await _context.QuotesMRoofing.FindAsync(id);

        if (quote == null)
        {
            return NotFound(new { message = $"Quote with ID {id} not found" });
        }

        if (updateDto.Name != null) quote.Name = updateDto.Name;
        if (updateDto.Account.HasValue) quote.Account = updateDto.Account;
        
        quote.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated quote {Id}: {Name}", quote.Id, quote.Name);

        return Ok(MapToDto(quote));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var quote = await _context.QuotesMRoofing.FindAsync(id);

        if (quote == null)
        {
            return NotFound(new { message = $"Quote with ID {id} not found" });
        }

        _context.QuotesMRoofing.Remove(quote);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted quote {Id}: {Name}", quote.Id, quote.Name);

        return NoContent();
    }

    private QuoteMRoofingDto MapToDto(QuoteMRoofing quote)
    {
        return new QuoteMRoofingDto
        {
            Id = quote.Id,
            Name = quote.Name,
            Account = quote.Account,
            CreatedOn = quote.CreatedOn,
            CreatedBy = quote.CreatedBy,
            ModifiedOn = quote.ModifiedOn,
            ModifiedBy = quote.ModifiedBy
        };
    }
}
