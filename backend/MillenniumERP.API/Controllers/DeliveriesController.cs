using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DeliveriesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<DeliveriesController> _logger;

    public DeliveriesController(AppDbContext context, ILogger<DeliveriesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<DeliveryDto>>> GetAll()
    {
        var deliveries = await _context.Deliveries
            .OrderBy(d => d.Deliveryno)
            .ToListAsync();

        var deliveryDtos = deliveries.Select(MapToDto).ToList();
        return Ok(deliveryDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DeliveryDto>> GetById(Guid id)
    {
        var delivery = await _context.Deliveries.FindAsync(id);

        if (delivery == null)
        {
            return NotFound(new { message = $"Delivery with ID {id} not found" });
        }

        return Ok(MapToDto(delivery));
    }

    [HttpPost]
    public async Task<ActionResult<DeliveryDto>> Create([FromBody] CreateDeliveryDto createDto)
    {
        var delivery = new Delivery
        {
            Id = Guid.NewGuid(),
            Deliveryno = createDto.Deliveryno,
            Customer = createDto.Customer,
            Orderno = createDto.Orderno,
            Loadingdate = createDto.Loadingdate,
            Driver = createDto.Driver,
            Helper1 = createDto.Helper1,
            Helper2 = createDto.Helper2,
            Helper3 = createDto.Helper3,
            Helper = createDto.Helper4,
            Helper5 = createDto.Helper5,
            Loadmaster = createDto.Loadmaster,
            Dispatchmanager = createDto.Dispatchmanager,
            Openkms = createDto.Openkms,
            Closekms = createDto.Closekms,
            Arrivaltime = createDto.Arrivaltime,
            Arrivaltimesite = createDto.Arrivaltimesite,
            Departuretime = createDto.Departuretime,
            Departuretimesite = createDto.Departuretimesite,
            Partload = createDto.Partload,
            Actualstart = createDto.Actualstart,
            Actualend = createDto.Actualend,
            CreatedOn = DateTime.UtcNow
        };

        _context.Deliveries.Add(delivery);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created delivery {Id}: {DeliveryNo}", delivery.Id, delivery.Deliveryno);

        return CreatedAtAction(nameof(GetById), new { id = delivery.Id }, MapToDto(delivery));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<DeliveryDto>> Update(Guid id, [FromBody] UpdateDeliveryDto updateDto)
    {
        var delivery = await _context.Deliveries.FindAsync(id);

        if (delivery == null)
        {
            return NotFound(new { message = $"Delivery with ID {id} not found" });
        }

        if (updateDto.Deliveryno != null) delivery.Deliveryno = updateDto.Deliveryno;
        if (updateDto.Customer.HasValue) delivery.Customer = updateDto.Customer;
        if (updateDto.Orderno.HasValue) delivery.Orderno = updateDto.Orderno;
        if (updateDto.Loadingdate.HasValue) delivery.Loadingdate = updateDto.Loadingdate;
        if (updateDto.Driver.HasValue) delivery.Driver = updateDto.Driver;
        if (updateDto.Helper1.HasValue) delivery.Helper1 = updateDto.Helper1;
        if (updateDto.Helper2.HasValue) delivery.Helper2 = updateDto.Helper2;
        if (updateDto.Helper3.HasValue) delivery.Helper3 = updateDto.Helper3;
        if (updateDto.Helper4.HasValue) delivery.Helper = updateDto.Helper4;
        if (updateDto.Helper5.HasValue) delivery.Helper5 = updateDto.Helper5;
        if (updateDto.Loadmaster.HasValue) delivery.Loadmaster = updateDto.Loadmaster;
        if (updateDto.Dispatchmanager.HasValue) delivery.Dispatchmanager = updateDto.Dispatchmanager;
        if (updateDto.Openkms != null) delivery.Openkms = updateDto.Openkms;
        if (updateDto.Closekms != null) delivery.Closekms = updateDto.Closekms;
        if (updateDto.Arrivaltime.HasValue) delivery.Arrivaltime = updateDto.Arrivaltime;
        if (updateDto.Arrivaltimesite.HasValue) delivery.Arrivaltimesite = updateDto.Arrivaltimesite;
        if (updateDto.Departuretime.HasValue) delivery.Departuretime = updateDto.Departuretime;
        if (updateDto.Departuretimesite.HasValue) delivery.Departuretimesite = updateDto.Departuretimesite;
        if (updateDto.Partload.HasValue) delivery.Partload = updateDto.Partload;
        if (updateDto.Actualstart.HasValue) delivery.Actualstart = updateDto.Actualstart;
        if (updateDto.Actualend.HasValue) delivery.Actualend = updateDto.Actualend;
        
        delivery.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated delivery {Id}: {DeliveryNo}", delivery.Id, delivery.Deliveryno);

        return Ok(MapToDto(delivery));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var delivery = await _context.Deliveries.FindAsync(id);

        if (delivery == null)
        {
            return NotFound(new { message = $"Delivery with ID {id} not found" });
        }

        _context.Deliveries.Remove(delivery);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted delivery {Id}: {DeliveryNo}", delivery.Id, delivery.Deliveryno);

        return NoContent();
    }

    private DeliveryDto MapToDto(Delivery delivery)
    {
        return new DeliveryDto
        {
            Id = delivery.Id,
            Deliveryno = delivery.Deliveryno,
            Customer = delivery.Customer,
            Orderno = delivery.Orderno,
            Loadingdate = delivery.Loadingdate,
            Driver = delivery.Driver,
            Helper1 = delivery.Helper1,
            Helper2 = delivery.Helper2,
            Helper3 = delivery.Helper3,
            Helper4 = delivery.Helper,
            Helper5 = delivery.Helper5,
            Loadmaster = delivery.Loadmaster,
            Dispatchmanager = delivery.Dispatchmanager,
            Openkms = delivery.Openkms,
            Closekms = delivery.Closekms,
            Arrivaltime = delivery.Arrivaltime,
            Arrivaltimesite = delivery.Arrivaltimesite,
            Departuretime = delivery.Departuretime,
            Departuretimesite = delivery.Departuretimesite,
            Partload = delivery.Partload,
            Actualstart = delivery.Actualstart,
            Actualend = delivery.Actualend,
            Actualdurationminutes = delivery.Actualdurationminutes,
            CreatedOn = delivery.CreatedOn,
            CreatedBy = delivery.CreatedBy,
            ModifiedOn = delivery.ModifiedOn,
            ModifiedBy = delivery.ModifiedBy
        };
    }
}
