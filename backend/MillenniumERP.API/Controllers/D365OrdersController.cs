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

    [HttpGet("ids")]
    public async Task<ActionResult<IEnumerable<Guid>>> GetAllIds()
    {
        var ids = await _context.D365Orders
            .AsNoTracking()
            .Select(o => o.Id)
            .ToListAsync();
        return Ok(ids);
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

    [HttpGet("planner")]
    public async Task<ActionResult<IEnumerable<object>>> GetForPlanner()
    {
        // Only return orders that need production and aren't yet completed
        // Slimmed DTO with only essential fields for the planner
        var plannerOrders = await _context.D365Orders
            .AsNoTracking()
            .Where(o => o.ProductionRequired == true)
            .Select(o => new 
            {
                o.Id,
                o.OrderNumber,
                o.Name,
                CustomerName = _context.Accounts
                    .Where(a => a.Id == o.CustomerId)
                    .Select(a => a.Name)
                    .FirstOrDefault(),
                o.ProductionRequired,
                EstimatedEFinks = (decimal?)null // Placeholder - add if field exists
            })
            .OrderBy(o => o.Name)
            .ToListAsync();

        _logger.LogInformation("Planner orders endpoint returned {Count} orders", plannerOrders.Count);
        return Ok(plannerOrders);
    }

    [HttpGet("unallocated")]
    public async Task<ActionResult<IEnumerable<object>>> GetUnallocated()
    {
        // Find sales orders with production_required = true that have NO production record
        // This comparison is done at the database level for accuracy
        var unallocatedOrders = await _context.D365Orders
            .AsNoTracking()
            .Where(o => o.ProductionRequired == true)
            .Where(o => !_context.Productions.Any(p => p.Orderno == o.Id))
            // Exclude old J23- prefixed orders
            .Where(o => o.OrderNumber == null || !o.OrderNumber.StartsWith("J23"))
            .Select(o => new 
            {
                o.Id,
                o.OrderNumber,
                o.Name,
                CustomerName = _context.Accounts
                    .Where(a => a.Id == o.CustomerId)
                    .Select(a => a.Name)
                    .FirstOrDefault(),
                o.ProductionRequired,
                EstimatedEFinks = (decimal?)null
            })
            .OrderBy(o => o.Name)
            .ToListAsync();

        _logger.LogInformation("Unallocated orders endpoint returned {Count} orders", unallocatedOrders.Count);
        return Ok(unallocatedOrders);
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
        if (updateDto.ProductionRequired.HasValue) order.ProductionRequired = updateDto.ProductionRequired;

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

    [HttpPost("bulk")]
    public async Task<ActionResult<object>> BulkImport([FromBody] List<D365OrderImportDto> orders)
    {
        var imported = 0;
        var skippedById = 0;
        var skippedByOrderNumber = 0;
        var errors = new List<string>();

        var existingOrderNumbers = await _context.D365Orders
            .Where(o => o.OrderNumber != null)
            .Select(o => o.OrderNumber!)
            .ToListAsync();
        var existingOrderNumberSet = new HashSet<string>(existingOrderNumbers, StringComparer.OrdinalIgnoreCase);

        var existingIds = await _context.D365Orders
            .Select(o => o.Id)
            .ToListAsync();
        var existingIdSet = new HashSet<Guid>(existingIds);

        foreach (var order in orders)
        {
            try
            {
                if (existingIdSet.Contains(order.Id))
                {
                    _logger.LogDebug("Skipping order {OrderNumber} - ID {Id} already exists", order.OrderNumber, order.Id);
                    skippedById++;
                    continue;
                }

                if (!string.IsNullOrEmpty(order.OrderNumber) && existingOrderNumberSet.Contains(order.OrderNumber))
                {
                    _logger.LogDebug("Skipping order {OrderNumber} - Order number already exists in database", order.OrderNumber);
                    skippedByOrderNumber++;
                    continue;
                }

                var entity = new D365Order
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
                    ProductionRequired = order.ProductionRequired,
                    CreatedOn = order.CreatedOn ?? DateTime.UtcNow,
                    ModifiedOn = order.ModifiedOn,
                    CreatedBy = order.CreatedBy,
                    ModifiedBy = order.ModifiedBy
                };

                _context.D365Orders.Add(entity);
                existingIdSet.Add(order.Id);
                if (!string.IsNullOrEmpty(order.OrderNumber))
                {
                    existingOrderNumberSet.Add(order.OrderNumber);
                }
                imported++;
            }
            catch (Exception ex)
            {
                errors.Add($"{order.OrderNumber ?? order.Id.ToString()}: {ex.Message}");
                _logger.LogError(ex, "Error importing order {OrderNumber} ({Id})", order.OrderNumber, order.Id);
            }
        }

        await _context.SaveChangesAsync();

        var skipped = skippedById + skippedByOrderNumber;
        _logger.LogInformation("Bulk import completed: {Imported} imported, {Skipped} skipped ({SkippedById} by ID, {SkippedByOrderNumber} by order number), {Errors} errors", 
            imported, skipped, skippedById, skippedByOrderNumber, errors.Count);

        return Ok(new { 
            imported, 
            skipped,
            skippedById,
            skippedByOrderNumber, 
            errors = errors.Count, 
            errorDetails = errors 
        });
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
            ProductionRequired = order.ProductionRequired,
            CreatedOn = order.CreatedOn,
            CreatedBy = order.CreatedBy,
            ModifiedOn = order.ModifiedOn,
            ModifiedBy = order.ModifiedBy
        };
    }
}
