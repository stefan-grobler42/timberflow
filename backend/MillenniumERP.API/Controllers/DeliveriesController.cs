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
    public async Task<ActionResult<IEnumerable<DeliveryDto>>> GetAll([FromQuery] Guid? orderNo = null)
    {
        var query = _context.Deliveries.AsQueryable();

        if (orderNo.HasValue)
        {
            query = query.Where(d => d.Orderno == orderNo.Value);
        }

        var deliveries = await query
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
            Deliveryno = createDto.DeliveryNo,
            Customer = createDto.Customer,
            Orderno = createDto.OrderNo,
            Loadingdate = createDto.LoadingDate,
            Driver = createDto.Driver,
            Helper1 = createDto.Helper1,
            Helper2 = createDto.Helper2,
            Helper3 = createDto.Helper3,
            Helper = createDto.Helper4,
            Helper5 = createDto.Helper5,
            Loadmaster = createDto.LoadMaster,
            Dispatchmanager = createDto.DispatchManager,
            Openkms = createDto.OpenKms,
            Closekms = createDto.CloseKms,
            Arrivaltime = createDto.ArrivalTime,
            Arrivaltimesite = createDto.ArrivalTimeSite,
            Departuretime = createDto.DepartureTime,
            Departuretimesite = createDto.DepartureTimeSite,
            Partload = createDto.PartLoad,
            Actualstart = createDto.ActualStart,
            Actualend = createDto.ActualEnd,
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

        if (updateDto.DeliveryNo != null) delivery.Deliveryno = updateDto.DeliveryNo;
        if (updateDto.Customer.HasValue) delivery.Customer = updateDto.Customer;
        if (updateDto.OrderNo.HasValue) delivery.Orderno = updateDto.OrderNo;
        if (updateDto.LoadingDate.HasValue) delivery.Loadingdate = updateDto.LoadingDate;
        if (updateDto.Driver.HasValue) delivery.Driver = updateDto.Driver;
        if (updateDto.Helper1.HasValue) delivery.Helper1 = updateDto.Helper1;
        if (updateDto.Helper2.HasValue) delivery.Helper2 = updateDto.Helper2;
        if (updateDto.Helper3.HasValue) delivery.Helper3 = updateDto.Helper3;
        if (updateDto.Helper4.HasValue) delivery.Helper = updateDto.Helper4;
        if (updateDto.Helper5.HasValue) delivery.Helper5 = updateDto.Helper5;
        if (updateDto.LoadMaster.HasValue) delivery.Loadmaster = updateDto.LoadMaster;
        if (updateDto.DispatchManager.HasValue) delivery.Dispatchmanager = updateDto.DispatchManager;
        if (updateDto.OpenKms != null) delivery.Openkms = updateDto.OpenKms;
        if (updateDto.CloseKms != null) delivery.Closekms = updateDto.CloseKms;
        if (updateDto.ArrivalTime.HasValue) delivery.Arrivaltime = updateDto.ArrivalTime;
        if (updateDto.ArrivalTimeSite.HasValue) delivery.Arrivaltimesite = updateDto.ArrivalTimeSite;
        if (updateDto.DepartureTime.HasValue) delivery.Departuretime = updateDto.DepartureTime;
        if (updateDto.DepartureTimeSite.HasValue) delivery.Departuretimesite = updateDto.DepartureTimeSite;
        if (updateDto.PartLoad.HasValue) delivery.Partload = updateDto.PartLoad;
        if (updateDto.ActualStart.HasValue) delivery.Actualstart = updateDto.ActualStart;
        if (updateDto.ActualEnd.HasValue) delivery.Actualend = updateDto.ActualEnd;
        
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
            DeliveryNo = delivery.Deliveryno,
            Customer = delivery.Customer,
            OrderNo = delivery.Orderno,
            LoadingDate = delivery.Loadingdate,
            Driver = delivery.Driver,
            Helper1 = delivery.Helper1,
            Helper2 = delivery.Helper2,
            Helper3 = delivery.Helper3,
            Helper4 = delivery.Helper,
            Helper5 = delivery.Helper5,
            LoadMaster = delivery.Loadmaster,
            DispatchManager = delivery.Dispatchmanager,
            OpenKms = delivery.Openkms,
            CloseKms = delivery.Closekms,
            ArrivalTime = delivery.Arrivaltime,
            ArrivalTimeSite = delivery.Arrivaltimesite,
            DepartureTime = delivery.Departuretime,
            DepartureTimeSite = delivery.Departuretimesite,
            PartLoad = delivery.Partload,
            ActualStart = delivery.Actualstart,
            ActualEnd = delivery.Actualend,
            ActualDurationMinutes = delivery.Actualdurationminutes,
            CreatedOn = delivery.CreatedOn,
            CreatedBy = delivery.CreatedBy,
            ModifiedOn = delivery.ModifiedOn,
            ModifiedBy = delivery.ModifiedBy
        };
    }
}
