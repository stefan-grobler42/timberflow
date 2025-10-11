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
            Filelink = createDto.Filelink,
            Streetaddress = createDto.Streetaddress,
            Closingdate = createDto.Closingdate,
            Distancetosite = createDto.Distancetosite,
            Contact = createDto.Contact,
            Customer = createDto.Customer,
            Quoteno = createDto.Quoteno,
            Roofcoveringsheeting = createDto.Roofcoveringsheeting,
            Roofcoveringtiles = createDto.Roofcoveringtiles,
            Timberstructure = createDto.Timberstructure,
            Totalvalueexcl = createDto.Totalvalueexcl,
            NewDesigner = createDto.NewDesigner,
            NewNotes = createDto.NewNotes,
            NewPricingsubmitted = createDto.NewPricingsubmitted,
            NewSubmissiondate = createDto.NewSubmissiondate,
            NewTenderstatus = createDto.NewTenderstatus,
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
        if (updateDto.Filelink != null) tender.Filelink = updateDto.Filelink;
        if (updateDto.Streetaddress != null) tender.Streetaddress = updateDto.Streetaddress;
        if (updateDto.Closingdate.HasValue) tender.Closingdate = updateDto.Closingdate;
        if (updateDto.Distancetosite.HasValue) tender.Distancetosite = updateDto.Distancetosite;
        if (updateDto.Contact.HasValue) tender.Contact = updateDto.Contact;
        if (updateDto.Customer.HasValue) tender.Customer = updateDto.Customer;
        if (updateDto.Quoteno.HasValue) tender.Quoteno = updateDto.Quoteno;
        if (updateDto.Roofcoveringsheeting.HasValue) tender.Roofcoveringsheeting = updateDto.Roofcoveringsheeting;
        if (updateDto.Roofcoveringtiles.HasValue) tender.Roofcoveringtiles = updateDto.Roofcoveringtiles;
        if (updateDto.Timberstructure.HasValue) tender.Timberstructure = updateDto.Timberstructure;
        if (updateDto.Totalvalueexcl.HasValue) tender.Totalvalueexcl = updateDto.Totalvalueexcl;
        if (updateDto.NewDesigner.HasValue) tender.NewDesigner = updateDto.NewDesigner;
        if (updateDto.NewNotes != null) tender.NewNotes = updateDto.NewNotes;
        if (updateDto.NewPricingsubmitted.HasValue) tender.NewPricingsubmitted = updateDto.NewPricingsubmitted;
        if (updateDto.NewSubmissiondate.HasValue) tender.NewSubmissiondate = updateDto.NewSubmissiondate;
        if (updateDto.NewTenderstatus.HasValue) tender.NewTenderstatus = updateDto.NewTenderstatus;
        
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
            Filelink = tender.Filelink,
            Streetaddress = tender.Streetaddress,
            Closingdate = tender.Closingdate,
            Distancetosite = tender.Distancetosite,
            Contact = tender.Contact,
            Customer = tender.Customer,
            Quoteno = tender.Quoteno,
            Roofcoveringsheeting = tender.Roofcoveringsheeting,
            Roofcoveringtiles = tender.Roofcoveringtiles,
            Timberstructure = tender.Timberstructure,
            Totalvalueexcl = tender.Totalvalueexcl,
            TotalvalueexclBase = tender.TotalvalueexclBase,
            Exchangerate = tender.Exchangerate,
            NewDesigner = tender.NewDesigner,
            NewNotes = tender.NewNotes,
            NewPricingsubmitted = tender.NewPricingsubmitted,
            NewSubmissiondate = tender.NewSubmissiondate,
            NewTenderstatus = tender.NewTenderstatus,
            Transactioncurrencyid = tender.Transactioncurrencyid,
            CreatedOn = tender.CreatedOn,
            CreatedBy = tender.CreatedBy,
            ModifiedOn = tender.ModifiedOn,
            ModifiedBy = tender.ModifiedBy
        };
    }
}
