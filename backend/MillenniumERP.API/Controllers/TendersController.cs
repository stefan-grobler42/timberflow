using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TendersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<TendersController> _logger;

    public TendersController(AppDbContext context, ILogger<TendersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TenderDto>>> GetAll([FromQuery] int? status = null)
    {
        var query = _context.Tenders.AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(t => t.NewTenderstatus == status);
        }

        var tenders = await query
            .OrderBy(t => t.Name)
            .ToListAsync();

        var tenderDtos = tenders.Select(MapToDto).ToList();
        return Ok(tenderDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TenderDto>> GetById(Guid id)
    {
        var tender = await _context.Tenders.FindAsync(id);

        if (tender == null)
        {
            return NotFound(new { message = $"Tender with ID {id} not found" });
        }

        return Ok(MapToDto(tender));
    }

    [HttpPost]
    public async Task<ActionResult<TenderDto>> Create([FromBody] CreateTenderDto createDto)
    {
        var tender = new Tender
        {
            Id = Guid.NewGuid(),
            Name = createDto.Name,
            Description = createDto.Description,
            Filelink = createDto.FileLink,
            Streetaddress = createDto.StreetAddress,
            Closingdate = createDto.ClosingDate,
            Distancetosite = createDto.DistanceToSite,
            Contact = createDto.Contact,
            Customer = createDto.Customer,
            Quoteno = createDto.QuoteNo,
            Roofcoveringsheeting = createDto.RoofCoveringSheeting,
            Roofcoveringtiles = createDto.RoofCoveringTiles,
            Timberstructure = createDto.TimberStructure,
            Totalvalueexcl = createDto.TotalValueExcl,
            NewDesigner = createDto.NewDesigner,
            NewNotes = createDto.NewNotes,
            NewPricingsubmitted = createDto.NewPricingSubmitted,
            NewSubmissiondate = createDto.NewSubmissionDate,
            NewTenderstatus = createDto.NewTenderStatus,
            CreatedOn = DateTime.UtcNow
        };

        _context.Tenders.Add(tender);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created tender {Id}: {Name}", tender.Id, tender.Name);

        return CreatedAtAction(nameof(GetById), new { id = tender.Id }, MapToDto(tender));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TenderDto>> Update(Guid id, [FromBody] UpdateTenderDto updateDto)
    {
        var tender = await _context.Tenders.FindAsync(id);

        if (tender == null)
        {
            return NotFound(new { message = $"Tender with ID {id} not found" });
        }

        if (updateDto.Name != null) tender.Name = updateDto.Name;
        if (updateDto.Description != null) tender.Description = updateDto.Description;
        if (updateDto.FileLink != null) tender.Filelink = updateDto.FileLink;
        if (updateDto.StreetAddress != null) tender.Streetaddress = updateDto.StreetAddress;
        if (updateDto.ClosingDate.HasValue) tender.Closingdate = updateDto.ClosingDate;
        if (updateDto.DistanceToSite.HasValue) tender.Distancetosite = updateDto.DistanceToSite;
        if (updateDto.Contact.HasValue) tender.Contact = updateDto.Contact;
        if (updateDto.Customer.HasValue) tender.Customer = updateDto.Customer;
        if (updateDto.QuoteNo.HasValue) tender.Quoteno = updateDto.QuoteNo;
        if (updateDto.RoofCoveringSheeting.HasValue) tender.Roofcoveringsheeting = updateDto.RoofCoveringSheeting;
        if (updateDto.RoofCoveringTiles.HasValue) tender.Roofcoveringtiles = updateDto.RoofCoveringTiles;
        if (updateDto.TimberStructure.HasValue) tender.Timberstructure = updateDto.TimberStructure;
        if (updateDto.TotalValueExcl.HasValue) tender.Totalvalueexcl = updateDto.TotalValueExcl;
        if (updateDto.NewDesigner.HasValue) tender.NewDesigner = updateDto.NewDesigner;
        if (updateDto.NewNotes != null) tender.NewNotes = updateDto.NewNotes;
        if (updateDto.NewPricingSubmitted.HasValue) tender.NewPricingsubmitted = updateDto.NewPricingSubmitted;
        if (updateDto.NewSubmissionDate.HasValue) tender.NewSubmissiondate = updateDto.NewSubmissionDate;
        if (updateDto.NewTenderStatus.HasValue) tender.NewTenderstatus = updateDto.NewTenderStatus;
        
        tender.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated tender {Id}: {Name}", tender.Id, tender.Name);

        return Ok(MapToDto(tender));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var tender = await _context.Tenders.FindAsync(id);

        if (tender == null)
        {
            return NotFound(new { message = $"Tender with ID {id} not found" });
        }

        _context.Tenders.Remove(tender);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted tender {Id}: {Name}", tender.Id, tender.Name);

        return NoContent();
    }

    private TenderDto MapToDto(Tender tender)
    {
        return new TenderDto
        {
            Id = tender.Id,
            Name = tender.Name,
            Description = tender.Description,
            FileLink = tender.Filelink,
            StreetAddress = tender.Streetaddress,
            ClosingDate = tender.Closingdate,
            DistanceToSite = tender.Distancetosite,
            Contact = tender.Contact,
            Customer = tender.Customer,
            QuoteNo = tender.Quoteno,
            RoofCoveringSheeting = tender.Roofcoveringsheeting,
            RoofCoveringTiles = tender.Roofcoveringtiles,
            TimberStructure = tender.Timberstructure,
            TotalValueExcl = tender.Totalvalueexcl,
            TotalValueExclBase = tender.TotalvalueexclBase,
            ExchangeRate = tender.Exchangerate,
            NewDesigner = tender.NewDesigner,
            NewNotes = tender.NewNotes,
            NewPricingSubmitted = tender.NewPricingsubmitted,
            NewSubmissionDate = tender.NewSubmissiondate,
            NewTenderStatus = tender.NewTenderstatus,
            TransactionCurrencyId = tender.Transactioncurrencyid,
            CreatedOn = tender.CreatedOn,
            CreatedBy = tender.CreatedBy,
            ModifiedOn = tender.ModifiedOn,
            ModifiedBy = tender.ModifiedBy
        };
    }
}
