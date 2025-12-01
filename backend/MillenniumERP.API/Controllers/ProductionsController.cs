using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductionsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<ProductionsController> _logger;

    public ProductionsController(AppDbContext context, ILogger<ProductionsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductionDto>>> GetAll([FromQuery] bool? completeOnly = null, [FromQuery] Guid? orderNo = null)
    {
        var query = _context.Productions
            .Include(p => p.Order)
            .Include(p => p.CustomerAccount)
            .AsQueryable();

        if (completeOnly == true)
        {
            query = query.Where(p => p.Productioncomplete == true);
        }

        if (orderNo.HasValue)
        {
            query = query.Where(p => p.Orderno == orderNo.Value);
        }

        var productions = await query.ToListAsync();

        var productionDtos = productions.Select(p => MapToDto(p, p.Order?.OrderNumber, p.CustomerAccount?.Name)).ToList();
        return Ok(productionDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductionDto>> GetById(Guid id)
    {
        var production = await _context.Productions
            .Include(p => p.Order)
            .Include(p => p.CustomerAccount)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (production == null)
        {
            return NotFound(new { message = $"Production with ID {id} not found" });
        }

        return Ok(MapToDto(production, production.Order?.OrderNumber, production.CustomerAccount?.Name));
    }

    [HttpPost]
    public async Task<ActionResult<ProductionDto>> Create([FromBody] CreateProductionDto createDto)
    {
        var production = new Production
        {
            Id = Guid.NewGuid(),
            Name = createDto.Name,
            Customer = createDto.Customer,
            Orderno = createDto.OrderNo,
            Jigstart = createDto.JigStart,
            Jigend = createDto.JigEnd,
            Jigleader = createDto.JigLeader,
            Jighelper1 = createDto.JigHelper1,
            Jighelper2 = createDto.JigHelper2,
            Jighelper3 = createDto.JigHelper3,
            Jighelper4 = createDto.JigHelper4,
            Pickstart = createDto.PickStart,
            Pickend = createDto.PickEnd,
            Pickingmaster = createDto.PickingMaster,
            Pickinghelper1 = createDto.PickingHelper1,
            Pickinghelper2 = createDto.PickingHelper2,
            Pickinghelper3 = createDto.PickingHelper3,
            Sawstart = createDto.SawStart,
            Sawend = createDto.SawEnd,
            Sawoperator = createDto.SawOperator,
            Sawhelper1 = createDto.SawHelper1,
            Sawhelper2 = createDto.SawHelper2,
            Productioncomplete = createDto.ProductionComplete,
            Productionplanneddate = createDto.ProductionPlannedDate,
            Totalcuts = createDto.TotalCuts,
            Totaltimbercubes = createDto.TotalTimberCubes,
            Trusscost = createDto.TrussCost,
            Trussselling = createDto.TrussSelling,
            Workunitsefinks = createDto.WorkUnitsEfinks,
            NewEstimatedefinks = createDto.NewEstimateDefinks,
            CustomDurationMinutes = createDto.CustomDurationMinutes,
            ParentProductionId = createDto.ParentProductionId == Guid.Empty ? null : createDto.ParentProductionId,
            RolloverSequence = createDto.RolloverSequence,
            // Treat zero GUIDs as null for lookup fields
            PickingTeamId = createDto.PickingTeamId == Guid.Empty ? null : createDto.PickingTeamId,
            SawId = createDto.SawId == Guid.Empty ? null : createDto.SawId,
            JigId = createDto.JigId == Guid.Empty ? null : createDto.JigId,
            // Planned timing fields
            PlannedStartDate = createDto.PlannedStartDate,
            PlannedStartTime = createDto.PlannedStartTime,
            PlannedEndTime = createDto.PlannedEndTime,
            PlannedDurationMinutes = createDto.PlannedDurationMinutes,
            BreakAdjustmentMinutes = createDto.BreakAdjustmentMinutes,
            CreatedOn = DateTime.UtcNow
        };

        _context.Productions.Add(production);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created production {Id}: {Name}", production.Id, production.Name);

        string? orderNumber = null;
        if (production.Orderno.HasValue)
        {
            var order = await _context.D365Orders.FindAsync(production.Orderno.Value);
            orderNumber = order?.OrderNumber;
        }

        return CreatedAtAction(nameof(GetById), new { id = production.Id }, MapToDto(production, orderNumber));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ProductionDto>> Update(Guid id, [FromBody] UpdateProductionDto updateDto)
    {
        var production = await _context.Productions.FindAsync(id);

        if (production == null)
        {
            return NotFound(new { message = $"Production with ID {id} not found" });
        }

        if (updateDto.Name != null) production.Name = updateDto.Name;
        if (updateDto.Customer.HasValue) production.Customer = updateDto.Customer;
        if (updateDto.OrderNo.HasValue) production.Orderno = updateDto.OrderNo;
        if (updateDto.JigStart.HasValue) production.Jigstart = updateDto.JigStart;
        if (updateDto.JigEnd.HasValue) production.Jigend = updateDto.JigEnd;
        if (updateDto.JigLeader.HasValue) production.Jigleader = updateDto.JigLeader;
        if (updateDto.JigHelper1.HasValue) production.Jighelper1 = updateDto.JigHelper1;
        if (updateDto.JigHelper2.HasValue) production.Jighelper2 = updateDto.JigHelper2;
        if (updateDto.JigHelper3.HasValue) production.Jighelper3 = updateDto.JigHelper3;
        if (updateDto.JigHelper4.HasValue) production.Jighelper4 = updateDto.JigHelper4;
        if (updateDto.PickStart.HasValue) production.Pickstart = updateDto.PickStart;
        if (updateDto.PickEnd.HasValue) production.Pickend = updateDto.PickEnd;
        if (updateDto.PickingMaster.HasValue) production.Pickingmaster = updateDto.PickingMaster;
        if (updateDto.PickingHelper1.HasValue) production.Pickinghelper1 = updateDto.PickingHelper1;
        if (updateDto.PickingHelper2.HasValue) production.Pickinghelper2 = updateDto.PickingHelper2;
        if (updateDto.PickingHelper3.HasValue) production.Pickinghelper3 = updateDto.PickingHelper3;
        if (updateDto.SawStart.HasValue) production.Sawstart = updateDto.SawStart;
        if (updateDto.SawEnd.HasValue) production.Sawend = updateDto.SawEnd;
        if (updateDto.SawOperator.HasValue) production.Sawoperator = updateDto.SawOperator;
        if (updateDto.SawHelper1.HasValue) production.Sawhelper1 = updateDto.SawHelper1;
        if (updateDto.SawHelper2.HasValue) production.Sawhelper2 = updateDto.SawHelper2;
        if (updateDto.ProductionComplete.HasValue) production.Productioncomplete = updateDto.ProductionComplete;
        if (updateDto.ProductionPlannedDate.HasValue) production.Productionplanneddate = updateDto.ProductionPlannedDate;
        if (updateDto.TotalCuts.HasValue) production.Totalcuts = updateDto.TotalCuts;
        if (updateDto.TotalTimberCubes.HasValue) production.Totaltimbercubes = updateDto.TotalTimberCubes;
        if (updateDto.TrussCost.HasValue) production.Trusscost = updateDto.TrussCost;
        if (updateDto.TrussSelling.HasValue) production.Trussselling = updateDto.TrussSelling;
        if (updateDto.WorkUnitsEfinks.HasValue) production.Workunitsefinks = updateDto.WorkUnitsEfinks;
        if (updateDto.NewEstimateDefinks.HasValue) production.NewEstimatedefinks = updateDto.NewEstimateDefinks;
        if (updateDto.CustomDurationMinutes.HasValue) production.CustomDurationMinutes = updateDto.CustomDurationMinutes;
        if (updateDto.ParentProductionId.HasValue) production.ParentProductionId = updateDto.ParentProductionId == Guid.Empty ? null : updateDto.ParentProductionId;
        if (updateDto.RolloverSequence.HasValue) production.RolloverSequence = updateDto.RolloverSequence;
        
        // Always assign lookup fields to allow clearing (treat zero GUIDs as null)
        production.PickingTeamId = updateDto.PickingTeamId == Guid.Empty || updateDto.PickingTeamId == null 
            ? null 
            : updateDto.PickingTeamId;
        production.SawId = updateDto.SawId == Guid.Empty || updateDto.SawId == null 
            ? null 
            : updateDto.SawId;
        production.JigId = updateDto.JigId == Guid.Empty || updateDto.JigId == null 
            ? null 
            : updateDto.JigId;
        
        // Planned timing fields - allow explicit null to clear values
        if (updateDto.PlannedStartDate.HasValue) production.PlannedStartDate = updateDto.PlannedStartDate;
        if (updateDto.PlannedStartTime.HasValue) production.PlannedStartTime = updateDto.PlannedStartTime;
        if (updateDto.PlannedEndTime.HasValue) production.PlannedEndTime = updateDto.PlannedEndTime;
        if (updateDto.PlannedDurationMinutes.HasValue) production.PlannedDurationMinutes = updateDto.PlannedDurationMinutes;
        if (updateDto.BreakAdjustmentMinutes.HasValue) production.BreakAdjustmentMinutes = updateDto.BreakAdjustmentMinutes;
        
        production.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated production {Id}: {Name}", production.Id, production.Name);

        string? orderNumber = null;
        if (production.Orderno.HasValue)
        {
            var order = await _context.D365Orders.FindAsync(production.Orderno.Value);
            orderNumber = order?.OrderNumber;
        }

        return Ok(MapToDto(production, orderNumber));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var production = await _context.Productions.FindAsync(id);

        if (production == null)
        {
            return NotFound(new { message = $"Production with ID {id} not found" });
        }

        _context.Productions.Remove(production);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted production {Id}: {Name}", production.Id, production.Name);

        return NoContent();
    }

    private ProductionDto MapToDto(Production production, string? orderNumber = null, string? customerName = null)
    {
        return new ProductionDto
        {
            Id = production.Id,
            Name = production.Name,
            Customer = production.Customer,
            CustomerName = customerName,
            OrderNo = production.Orderno,
            OrderNumber = orderNumber,
            JigStart = production.Jigstart,
            JigEnd = production.Jigend,
            JigLeader = production.Jigleader,
            JigHelper1 = production.Jighelper1,
            JigHelper2 = production.Jighelper2,
            JigHelper3 = production.Jighelper3,
            JigHelper4 = production.Jighelper4,
            PickStart = production.Pickstart,
            PickEnd = production.Pickend,
            PickingMaster = production.Pickingmaster,
            PickingHelper1 = production.Pickinghelper1,
            PickingHelper2 = production.Pickinghelper2,
            PickingHelper3 = production.Pickinghelper3,
            SawStart = production.Sawstart,
            SawEnd = production.Sawend,
            SawOperator = production.Sawoperator,
            SawHelper1 = production.Sawhelper1,
            SawHelper2 = production.Sawhelper2,
            ProductionComplete = production.Productioncomplete,
            ProductionPlannedDate = production.Productionplanneddate,
            TotalCuts = production.Totalcuts,
            TotalTimberCubes = production.Totaltimbercubes,
            TrussCost = production.Trusscost,
            TrussSelling = production.Trussselling,
            WorkUnitsEfinks = production.Workunitsefinks,
            NewEstimateDefinks = production.NewEstimatedefinks,
            CustomDurationMinutes = production.CustomDurationMinutes,
            ParentProductionId = production.ParentProductionId,
            RolloverSequence = production.RolloverSequence,
            PickingTeamId = production.PickingTeamId,
            SawId = production.SawId,
            JigId = production.JigId,
            PlannedStartDate = production.PlannedStartDate,
            PlannedStartTime = production.PlannedStartTime,
            PlannedEndTime = production.PlannedEndTime,
            PlannedDurationMinutes = production.PlannedDurationMinutes,
            BreakAdjustmentMinutes = production.BreakAdjustmentMinutes,
            CreatedOn = production.CreatedOn,
            CreatedBy = production.CreatedBy,
            ModifiedOn = production.ModifiedOn,
            ModifiedBy = production.ModifiedBy
        };
    }
}
