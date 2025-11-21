using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs.D365;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/d365orders")]
public class D365OrdersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<D365OrdersController> _logger;

    public D365OrdersController(AppDbContext context, ILogger<D365OrdersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<D365OrderDto>>> GetAll()
    {
        var orders = await _context.D365Orders
            .OrderBy(o => o.Name)
            .ToListAsync();

        var orderDtos = orders.Select(MapToDto).ToList();
        return Ok(orderDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<D365OrderDto>> GetById(Guid id)
    {
        var order = await _context.D365Orders.FindAsync(id);

        if (order == null)
        {
            return NotFound(new { message = $"Order with ID {id} not found" });
        }

        return Ok(MapToDto(order));
    }

    [HttpPost]
    public async Task<ActionResult<D365OrderDto>> Create([FromBody] CreateD365OrderDto createDto)
    {
        var order = new D365Order
        {
            Id = createDto.Id ?? Guid.NewGuid(),
            OrderNumber = createDto.OrderNumber,
            Name = createDto.Name,
            CustomerId = createDto.CustomerId,
            QuoteId = createDto.QuoteId,
            RequestDeliveryBy = createDto.RequestDeliveryBy,
            TotalAmount = createDto.TotalAmount,
            Description = createDto.Description,
            OwnerId = createDto.OwnerId,
            CreatedOn = DateTime.UtcNow
        };

        _context.D365Orders.Add(order);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created order {Id}: {Name}", order.Id, order.Name);

        return CreatedAtAction(nameof(GetById), new { id = order.Id }, MapToDto(order));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<D365OrderDto>> Update(Guid id, [FromBody] UpdateD365OrderDto updateDto)
    {
        var order = await _context.D365Orders.FindAsync(id);

        if (order == null)
        {
            return NotFound(new { message = $"Order with ID {id} not found" });
        }

        if (updateDto.OrderNumber != null) order.OrderNumber = updateDto.OrderNumber;
        if (updateDto.Name != null) order.Name = updateDto.Name;
        if (updateDto.CustomerId.HasValue) order.CustomerId = updateDto.CustomerId;
        if (updateDto.QuoteId.HasValue) order.QuoteId = updateDto.QuoteId;
        if (updateDto.DateFulfilled.HasValue) order.DateFulfilled = updateDto.DateFulfilled;
        if (updateDto.RequestDeliveryBy.HasValue) order.RequestDeliveryBy = updateDto.RequestDeliveryBy;
        if (updateDto.TotalAmount.HasValue) order.TotalAmount = updateDto.TotalAmount;
        if (updateDto.StateCode.HasValue) order.StateCode = updateDto.StateCode;
        if (updateDto.StatusCode.HasValue) order.StatusCode = updateDto.StatusCode;
        if (updateDto.Description != null) order.Description = updateDto.Description;

        order.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated order {Id}: {Name}", order.Id, order.Name);

        return Ok(MapToDto(order));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var order = await _context.D365Orders.FindAsync(id);

        if (order == null)
        {
            return NotFound(new { message = $"Order with ID {id} not found" });
        }

        _context.D365Orders.Remove(order);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted order {Id}: {Name}", order.Id, order.Name);

        return NoContent();
    }

    private D365OrderDto MapToDto(D365Order order)
    {
        return new D365OrderDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            Name = order.Name,
            CustomerId = order.CustomerId,
            QuoteId = order.QuoteId,
            DateFulfilled = order.DateFulfilled,
            RequestDeliveryBy = order.RequestDeliveryBy,
            TotalAmount = order.TotalAmount,
            TotalDiscountAmount = order.TotalDiscountAmount,
            TotalLineItemAmount = order.TotalLineItemAmount,
            StateCode = order.StateCode,
            StatusCode = order.StatusCode,
            Description = order.Description,
            OwnerId = order.OwnerId,
            CreatedOn = order.CreatedOn,
            CreatedBy = order.CreatedBy,
            ModifiedOn = order.ModifiedOn,
            ModifiedBy = order.ModifiedBy
        };
    }
}
