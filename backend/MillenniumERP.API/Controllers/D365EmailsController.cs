using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs.D365;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/d365emails")]
public class D365EmailsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<D365EmailsController> _logger;

    public D365EmailsController(AppDbContext context, ILogger<D365EmailsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<D365EmailDto>>> GetAll()
    {
        var emails = await _context.D365Emails
            .OrderByDescending(e => e.CreatedOn)
            .ToListAsync();

        var emailDtos = emails.Select(MapToDto).ToList();
        return Ok(emailDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<D365EmailDto>> GetById(Guid id)
    {
        var email = await _context.D365Emails.FindAsync(id);

        if (email == null)
        {
            return NotFound(new { message = $"Email with ID {id} not found" });
        }

        return Ok(MapToDto(email));
    }

    [HttpPost]
    public async Task<ActionResult<D365EmailDto>> Create([FromBody] CreateD365EmailDto createDto)
    {
        var email = new D365Email
        {
            Id = Guid.NewGuid(),
            Subject = createDto.Subject,
            From = createDto.From,
            To = createDto.To,
            Cc = createDto.Cc,
            Bcc = createDto.Bcc,
            Description = createDto.Description,
            DirectionCode = createDto.DirectionCode,
            RegardingObjectId = createDto.RegardingObjectId,
            OwnerId = createDto.OwnerId,
            CreatedOn = DateTime.UtcNow
        };

        _context.D365Emails.Add(email);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created email {Id}: {Subject}", email.Id, email.Subject);

        return CreatedAtAction(nameof(GetById), new { id = email.Id }, MapToDto(email));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<D365EmailDto>> Update(Guid id, [FromBody] UpdateD365EmailDto updateDto)
    {
        var email = await _context.D365Emails.FindAsync(id);

        if (email == null)
        {
            return NotFound(new { message = $"Email with ID {id} not found" });
        }

        if (updateDto.Subject != null) email.Subject = updateDto.Subject;
        if (updateDto.From != null) email.From = updateDto.From;
        if (updateDto.To != null) email.To = updateDto.To;
        if (updateDto.Cc != null) email.Cc = updateDto.Cc;
        if (updateDto.Bcc != null) email.Bcc = updateDto.Bcc;
        if (updateDto.Description != null) email.Description = updateDto.Description;
        if (updateDto.StateCode.HasValue) email.StateCode = updateDto.StateCode;
        if (updateDto.StatusCode.HasValue) email.StatusCode = updateDto.StatusCode;

        email.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated email {Id}: {Subject}", email.Id, email.Subject);

        return Ok(MapToDto(email));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var email = await _context.D365Emails.FindAsync(id);

        if (email == null)
        {
            return NotFound(new { message = $"Email with ID {id} not found" });
        }

        _context.D365Emails.Remove(email);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted email {Id}: {Subject}", email.Id, email.Subject);

        return NoContent();
    }

    private D365EmailDto MapToDto(D365Email email)
    {
        return new D365EmailDto
        {
            Id = email.Id,
            Subject = email.Subject,
            From = email.From,
            To = email.To,
            Cc = email.Cc,
            Bcc = email.Bcc,
            Description = email.Description,
            DirectionCode = email.DirectionCode,
            RegardingObjectId = email.RegardingObjectId,
            OwnerId = email.OwnerId,
            StateCode = email.StateCode,
            StatusCode = email.StatusCode,
            CreatedOn = email.CreatedOn,
            CreatedBy = email.CreatedBy,
            ModifiedOn = email.ModifiedOn,
            ModifiedBy = email.ModifiedBy
        };
    }
}
