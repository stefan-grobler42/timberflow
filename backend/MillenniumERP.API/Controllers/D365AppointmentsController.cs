using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs.D365;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/d365appointments")]
public class D365AppointmentsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<D365AppointmentsController> _logger;

    public D365AppointmentsController(AppDbContext context, ILogger<D365AppointmentsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<D365AppointmentDto>>> GetAll()
    {
        var appointments = await _context.D365Appointments
            .OrderBy(a => a.ScheduledStart)
            .ToListAsync();

        var appointmentDtos = appointments.Select(MapToDto).ToList();
        return Ok(appointmentDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<D365AppointmentDto>> GetById(Guid id)
    {
        var appointment = await _context.D365Appointments.FindAsync(id);

        if (appointment == null)
        {
            return NotFound(new { message = $"Appointment with ID {id} not found" });
        }

        return Ok(MapToDto(appointment));
    }

    [HttpPost]
    public async Task<ActionResult<D365AppointmentDto>> Create([FromBody] CreateD365AppointmentDto createDto)
    {
        var appointment = new D365Appointment
        {
            Id = Guid.NewGuid(),
            Subject = createDto.Subject,
            Location = createDto.Location,
            ScheduledStart = createDto.ScheduledStart,
            ScheduledEnd = createDto.ScheduledEnd,
            ScheduledDurationMinutes = createDto.ScheduledDurationMinutes,
            Description = createDto.Description,
            RegardingObjectId = createDto.RegardingObjectId,
            OwnerId = createDto.OwnerId,
            CreatedOn = DateTime.UtcNow
        };

        _context.D365Appointments.Add(appointment);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created appointment {Id}: {Subject}", appointment.Id, appointment.Subject);

        return CreatedAtAction(nameof(GetById), new { id = appointment.Id }, MapToDto(appointment));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<D365AppointmentDto>> Update(Guid id, [FromBody] UpdateD365AppointmentDto updateDto)
    {
        var appointment = await _context.D365Appointments.FindAsync(id);

        if (appointment == null)
        {
            return NotFound(new { message = $"Appointment with ID {id} not found" });
        }

        if (updateDto.Subject != null) appointment.Subject = updateDto.Subject;
        if (updateDto.Location != null) appointment.Location = updateDto.Location;
        if (updateDto.ScheduledStart.HasValue) appointment.ScheduledStart = updateDto.ScheduledStart;
        if (updateDto.ScheduledEnd.HasValue) appointment.ScheduledEnd = updateDto.ScheduledEnd;
        if (updateDto.ActualDurationMinutes.HasValue) appointment.ActualDurationMinutes = updateDto.ActualDurationMinutes;
        if (updateDto.ScheduledDurationMinutes.HasValue) appointment.ScheduledDurationMinutes = updateDto.ScheduledDurationMinutes;
        if (updateDto.Description != null) appointment.Description = updateDto.Description;
        if (updateDto.StateCode.HasValue) appointment.StateCode = updateDto.StateCode;
        if (updateDto.StatusCode.HasValue) appointment.StatusCode = updateDto.StatusCode;

        appointment.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated appointment {Id}: {Subject}", appointment.Id, appointment.Subject);

        return Ok(MapToDto(appointment));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var appointment = await _context.D365Appointments.FindAsync(id);

        if (appointment == null)
        {
            return NotFound(new { message = $"Appointment with ID {id} not found" });
        }

        _context.D365Appointments.Remove(appointment);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted appointment {Id}: {Subject}", appointment.Id, appointment.Subject);

        return NoContent();
    }

    private D365AppointmentDto MapToDto(D365Appointment appointment)
    {
        return new D365AppointmentDto
        {
            Id = appointment.Id,
            Subject = appointment.Subject,
            Location = appointment.Location,
            ScheduledStart = appointment.ScheduledStart,
            ScheduledEnd = appointment.ScheduledEnd,
            ActualDurationMinutes = appointment.ActualDurationMinutes,
            ScheduledDurationMinutes = appointment.ScheduledDurationMinutes,
            Description = appointment.Description,
            RegardingObjectId = appointment.RegardingObjectId,
            OwnerId = appointment.OwnerId,
            StateCode = appointment.StateCode,
            StatusCode = appointment.StatusCode,
            CreatedOn = appointment.CreatedOn,
            CreatedBy = appointment.CreatedBy,
            ModifiedOn = appointment.ModifiedOn,
            ModifiedBy = appointment.ModifiedBy
        };
    }
}
