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
        var quote = await _context.D365Quotes
            .FirstOrDefaultAsync(q => q.Id == id);

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
            CreatedOn = DateTime.UtcNow,
            
            // Billing Address
            BillTo_Name = createDto.BillTo_Name,
            BillTo_Line1 = createDto.BillTo_Line1,
            BillTo_City = createDto.BillTo_City,
            BillTo_StateOrProvince = createDto.BillTo_StateOrProvince,
            BillTo_PostalCode = createDto.BillTo_PostalCode,
            BillTo_Country = createDto.BillTo_Country,
            BillTo_Telephone = createDto.BillTo_Telephone,
            BillTo_Latitude = createDto.BillTo_Latitude,
            BillTo_Longitude = createDto.BillTo_Longitude,
            
            // Shipping Address
            ShipTo_Name = createDto.ShipTo_Name,
            ShipTo_Line1 = createDto.ShipTo_Line1,
            ShipTo_City = createDto.ShipTo_City,
            ShipTo_StateOrProvince = createDto.ShipTo_StateOrProvince,
            ShipTo_PostalCode = createDto.ShipTo_PostalCode,
            ShipTo_Country = createDto.ShipTo_Country,
            ShipTo_Telephone = createDto.ShipTo_Telephone,
            ShipTo_Latitude = createDto.ShipTo_Latitude,
            ShipTo_Longitude = createDto.ShipTo_Longitude,
            
            // Financial Fields
            TotalTax = createDto.TotalTax,
            TotalAmountLessFreight = createDto.TotalAmountLessFreight,
            FreightAmount = createDto.FreightAmount,
            DiscountPercentage = createDto.DiscountPercentage,
            
            // Date Fields
            ExpiresOn = createDto.ExpiresOn,
            ClosedOn = createDto.ClosedOn,
            RequestDeliveryBy = createDto.RequestDeliveryBy,
            
            // Reference Fields
            OpportunityId = createDto.OpportunityId,
            PriceLevelId = createDto.PriceLevelId,
            TransactionCurrencyId = createDto.TransactionCurrencyId,
            
            // Contact Information
            ContactName = createDto.ContactName,
            ContactTelephone = createDto.ContactTelephone,
            ContactEmail = createDto.ContactEmail
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

        // Billing Address
        if (updateDto.BillTo_Name != null) quote.BillTo_Name = updateDto.BillTo_Name;
        if (updateDto.BillTo_Line1 != null) quote.BillTo_Line1 = updateDto.BillTo_Line1;
        if (updateDto.BillTo_City != null) quote.BillTo_City = updateDto.BillTo_City;
        if (updateDto.BillTo_StateOrProvince != null) quote.BillTo_StateOrProvince = updateDto.BillTo_StateOrProvince;
        if (updateDto.BillTo_PostalCode != null) quote.BillTo_PostalCode = updateDto.BillTo_PostalCode;
        if (updateDto.BillTo_Country != null) quote.BillTo_Country = updateDto.BillTo_Country;
        if (updateDto.BillTo_Telephone != null) quote.BillTo_Telephone = updateDto.BillTo_Telephone;
        if (updateDto.BillTo_Latitude.HasValue) quote.BillTo_Latitude = updateDto.BillTo_Latitude;
        if (updateDto.BillTo_Longitude.HasValue) quote.BillTo_Longitude = updateDto.BillTo_Longitude;

        // Shipping Address
        if (updateDto.ShipTo_Name != null) quote.ShipTo_Name = updateDto.ShipTo_Name;
        if (updateDto.ShipTo_Line1 != null) quote.ShipTo_Line1 = updateDto.ShipTo_Line1;
        if (updateDto.ShipTo_City != null) quote.ShipTo_City = updateDto.ShipTo_City;
        if (updateDto.ShipTo_StateOrProvince != null) quote.ShipTo_StateOrProvince = updateDto.ShipTo_StateOrProvince;
        if (updateDto.ShipTo_PostalCode != null) quote.ShipTo_PostalCode = updateDto.ShipTo_PostalCode;
        if (updateDto.ShipTo_Country != null) quote.ShipTo_Country = updateDto.ShipTo_Country;
        if (updateDto.ShipTo_Telephone != null) quote.ShipTo_Telephone = updateDto.ShipTo_Telephone;
        if (updateDto.ShipTo_Latitude.HasValue) quote.ShipTo_Latitude = updateDto.ShipTo_Latitude;
        if (updateDto.ShipTo_Longitude.HasValue) quote.ShipTo_Longitude = updateDto.ShipTo_Longitude;

        // Financial Fields
        if (updateDto.TotalTax.HasValue) quote.TotalTax = updateDto.TotalTax;
        if (updateDto.TotalAmountLessFreight.HasValue) quote.TotalAmountLessFreight = updateDto.TotalAmountLessFreight;
        if (updateDto.FreightAmount.HasValue) quote.FreightAmount = updateDto.FreightAmount;
        if (updateDto.DiscountPercentage.HasValue) quote.DiscountPercentage = updateDto.DiscountPercentage;

        // Date Fields
        if (updateDto.ExpiresOn.HasValue) quote.ExpiresOn = updateDto.ExpiresOn;
        if (updateDto.ClosedOn.HasValue) quote.ClosedOn = updateDto.ClosedOn;
        if (updateDto.RequestDeliveryBy.HasValue) quote.RequestDeliveryBy = updateDto.RequestDeliveryBy;

        // Reference Fields
        if (updateDto.OpportunityId.HasValue) quote.OpportunityId = updateDto.OpportunityId;
        if (updateDto.PriceLevelId.HasValue) quote.PriceLevelId = updateDto.PriceLevelId;
        if (updateDto.TransactionCurrencyId.HasValue) quote.TransactionCurrencyId = updateDto.TransactionCurrencyId;

        // Contact Information
        if (updateDto.ContactName != null) quote.ContactName = updateDto.ContactName;
        if (updateDto.ContactTelephone != null) quote.ContactTelephone = updateDto.ContactTelephone;
        if (updateDto.ContactEmail != null) quote.ContactEmail = updateDto.ContactEmail;

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
            ModifiedBy = quote.ModifiedBy,
            
            // Billing Address
            BillTo_Name = quote.BillTo_Name,
            BillTo_Line1 = quote.BillTo_Line1,
            BillTo_City = quote.BillTo_City,
            BillTo_StateOrProvince = quote.BillTo_StateOrProvince,
            BillTo_PostalCode = quote.BillTo_PostalCode,
            BillTo_Country = quote.BillTo_Country,
            BillTo_Telephone = quote.BillTo_Telephone,
            BillTo_Latitude = quote.BillTo_Latitude,
            BillTo_Longitude = quote.BillTo_Longitude,
            
            // Shipping Address
            ShipTo_Name = quote.ShipTo_Name,
            ShipTo_Line1 = quote.ShipTo_Line1,
            ShipTo_City = quote.ShipTo_City,
            ShipTo_StateOrProvince = quote.ShipTo_StateOrProvince,
            ShipTo_PostalCode = quote.ShipTo_PostalCode,
            ShipTo_Country = quote.ShipTo_Country,
            ShipTo_Telephone = quote.ShipTo_Telephone,
            ShipTo_Latitude = quote.ShipTo_Latitude,
            ShipTo_Longitude = quote.ShipTo_Longitude,
            
            // Financial Fields
            TotalTax = quote.TotalTax,
            TotalAmountLessFreight = quote.TotalAmountLessFreight,
            FreightAmount = quote.FreightAmount,
            DiscountPercentage = quote.DiscountPercentage,
            
            // Date Fields
            ExpiresOn = quote.ExpiresOn,
            ClosedOn = quote.ClosedOn,
            RequestDeliveryBy = quote.RequestDeliveryBy,
            
            // Reference Fields
            OpportunityId = quote.OpportunityId,
            PriceLevelId = quote.PriceLevelId,
            TransactionCurrencyId = quote.TransactionCurrencyId,
            
            // Contact Information
            ContactName = quote.ContactName,
            ContactTelephone = quote.ContactTelephone,
            ContactEmail = quote.ContactEmail
        };
    }
}
