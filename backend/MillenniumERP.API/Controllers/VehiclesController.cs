using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VehiclesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<VehiclesController> _logger;

    public VehiclesController(AppDbContext context, ILogger<VehiclesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<VehiclesDto>>> GetAll()
    {
        var vehicles = await _context.Vehicles
            .OrderBy(v => v.Name)
            .ToListAsync();

        var vehicleDtos = vehicles.Select(MapToDto).ToList();
        return Ok(vehicleDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<VehiclesDto>> GetById(Guid id)
    {
        var vehicle = await _context.Vehicles.FindAsync(id);

        if (vehicle == null)
        {
            return NotFound(new { message = $"Vehicle with ID {id} not found" });
        }

        return Ok(MapToDto(vehicle));
    }

    [HttpPost]
    public async Task<ActionResult<VehiclesDto>> Create([FromBody] CreateVehiclesDto createDto)
    {
        var vehicle = new Vehicles
        {
            Id = Guid.NewGuid(),
            Name = createDto.Name,
            Make = createDto.Make,
            Model = createDto.Model,
            Registrationnumber = createDto.RegistrationNumber,
            Yearmodel = createDto.YearModel,
            Approveddriver = createDto.ApprovedDriver,
            Cofinorder = createDto.CofInOrder,
            Licenserenewaldate = createDto.LicenseRenewalDate,
            CreatedOn = DateTime.UtcNow
        };

        _context.Vehicles.Add(vehicle);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created vehicle {Id}: {Name}", vehicle.Id, vehicle.Name);

        return CreatedAtAction(nameof(GetById), new { id = vehicle.Id }, MapToDto(vehicle));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<VehiclesDto>> Update(Guid id, [FromBody] UpdateVehiclesDto updateDto)
    {
        var vehicle = await _context.Vehicles.FindAsync(id);

        if (vehicle == null)
        {
            return NotFound(new { message = $"Vehicle with ID {id} not found" });
        }

        if (updateDto.Name != null) vehicle.Name = updateDto.Name;
        if (updateDto.Make != null) vehicle.Make = updateDto.Make;
        if (updateDto.Model != null) vehicle.Model = updateDto.Model;
        if (updateDto.RegistrationNumber != null) vehicle.Registrationnumber = updateDto.RegistrationNumber;
        if (updateDto.YearModel != null) vehicle.Yearmodel = updateDto.YearModel;
        if (updateDto.ApprovedDriver.HasValue) vehicle.Approveddriver = updateDto.ApprovedDriver;
        if (updateDto.CofInOrder.HasValue) vehicle.Cofinorder = updateDto.CofInOrder;
        if (updateDto.LicenseRenewalDate.HasValue) vehicle.Licenserenewaldate = updateDto.LicenseRenewalDate;
        
        vehicle.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated vehicle {Id}: {Name}", vehicle.Id, vehicle.Name);

        return Ok(MapToDto(vehicle));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var vehicle = await _context.Vehicles.FindAsync(id);

        if (vehicle == null)
        {
            return NotFound(new { message = $"Vehicle with ID {id} not found" });
        }

        _context.Vehicles.Remove(vehicle);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted vehicle {Id}: {Name}", vehicle.Id, vehicle.Name);

        return NoContent();
    }

    private VehiclesDto MapToDto(Vehicles vehicle)
    {
        return new VehiclesDto
        {
            Id = vehicle.Id,
            Name = vehicle.Name,
            Make = vehicle.Make,
            Model = vehicle.Model,
            RegistrationNumber = vehicle.Registrationnumber,
            YearModel = vehicle.Yearmodel,
            ApprovedDriver = vehicle.Approveddriver,
            CofInOrder = vehicle.Cofinorder,
            LicenseRenewalDate = vehicle.Licenserenewaldate,
            CreatedOn = vehicle.CreatedOn,
            CreatedBy = vehicle.CreatedBy,
            ModifiedOn = vehicle.ModifiedOn,
            ModifiedBy = vehicle.ModifiedBy
        };
    }
}
