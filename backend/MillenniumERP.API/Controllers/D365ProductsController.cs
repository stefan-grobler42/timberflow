using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs.D365;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/d365products")]
public class D365ProductsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<D365ProductsController> _logger;

    public D365ProductsController(AppDbContext context, ILogger<D365ProductsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<D365ProductDto>>> GetAll()
    {
        var products = await _context.D365Products
            .OrderBy(p => p.Name)
            .ToListAsync();

        var productDtos = products.Select(MapToDto).ToList();
        return Ok(productDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<D365ProductDto>> GetById(Guid id)
    {
        var product = await _context.D365Products.FindAsync(id);

        if (product == null)
        {
            return NotFound(new { message = $"Product with ID {id} not found" });
        }

        return Ok(MapToDto(product));
    }

    [HttpPost]
    public async Task<ActionResult<D365ProductDto>> Create([FromBody] CreateD365ProductDto createDto)
    {
        var product = new D365Product
        {
            Id = Guid.NewGuid(),
            ProductNumber = createDto.ProductNumber,
            Name = createDto.Name,
            Description = createDto.Description,
            ProductStructure = createDto.ProductStructure,
            ProductTypeCode = createDto.ProductTypeCode,
            QuantityOnHand = createDto.QuantityOnHand,
            Price = createDto.Price,
            CurrentCost = createDto.CurrentCost,
            StandardCost = createDto.StandardCost,
            VendorId = createDto.VendorId,
            VendorName = createDto.VendorName,
            CreatedOn = DateTime.UtcNow
        };

        _context.D365Products.Add(product);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created product {Id}: {Name}", product.Id, product.Name);

        return CreatedAtAction(nameof(GetById), new { id = product.Id }, MapToDto(product));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<D365ProductDto>> Update(Guid id, [FromBody] UpdateD365ProductDto updateDto)
    {
        var product = await _context.D365Products.FindAsync(id);

        if (product == null)
        {
            return NotFound(new { message = $"Product with ID {id} not found" });
        }

        if (updateDto.ProductNumber != null) product.ProductNumber = updateDto.ProductNumber;
        if (updateDto.Name != null) product.Name = updateDto.Name;
        if (updateDto.Description != null) product.Description = updateDto.Description;
        if (updateDto.ProductStructure.HasValue) product.ProductStructure = updateDto.ProductStructure;
        if (updateDto.ProductTypeCode.HasValue) product.ProductTypeCode = updateDto.ProductTypeCode;
        if (updateDto.QuantityOnHand.HasValue) product.QuantityOnHand = updateDto.QuantityOnHand;
        if (updateDto.Price.HasValue) product.Price = updateDto.Price;
        if (updateDto.CurrentCost.HasValue) product.CurrentCost = updateDto.CurrentCost;
        if (updateDto.StandardCost.HasValue) product.StandardCost = updateDto.StandardCost;
        if (updateDto.VendorId != null) product.VendorId = updateDto.VendorId;
        if (updateDto.VendorName != null) product.VendorName = updateDto.VendorName;

        product.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated product {Id}: {Name}", product.Id, product.Name);

        return Ok(MapToDto(product));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var product = await _context.D365Products.FindAsync(id);

        if (product == null)
        {
            return NotFound(new { message = $"Product with ID {id} not found" });
        }

        _context.D365Products.Remove(product);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted product {Id}: {Name}", product.Id, product.Name);

        return NoContent();
    }

    private D365ProductDto MapToDto(D365Product product)
    {
        return new D365ProductDto
        {
            Id = product.Id,
            ProductNumber = product.ProductNumber,
            Name = product.Name,
            Description = product.Description,
            ProductStructure = product.ProductStructure,
            ProductTypeCode = product.ProductTypeCode,
            QuantityOnHand = product.QuantityOnHand,
            QuantityDecimal = product.QuantityDecimal,
            StockWeight = product.StockWeight,
            StockVolume = product.StockVolume,
            Price = product.Price,
            CurrentCost = product.CurrentCost,
            StandardCost = product.StandardCost,
            VendorId = product.VendorId,
            VendorName = product.VendorName,
            CreatedOn = product.CreatedOn,
            CreatedBy = product.CreatedBy,
            ModifiedOn = product.ModifiedOn,
            ModifiedBy = product.ModifiedBy
        };
    }
}
