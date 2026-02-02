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
    public async Task<ActionResult<IEnumerable<ProductionDto>>> GetAll(
        [FromQuery] bool? completeOnly = null, 
        [FromQuery] Guid? orderNo = null,
        [FromQuery] string? dateFrom = null,
        [FromQuery] string? dateTo = null,
        [FromQuery] bool? plannerView = null)
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

        if (!string.IsNullOrEmpty(dateFrom) && DateTime.TryParse(dateFrom, out var fromDate))
        {
            query = query.Where(p => p.Productionplanneddate >= fromDate);
        }

        if (!string.IsNullOrEmpty(dateTo) && DateTime.TryParse(dateTo, out var toDate))
        {
            query = query.Where(p => p.Productionplanneddate <= toDate);
        }

        if (plannerView == true)
        {
            query = query.Where(p => p.Productioncomplete != true || 
                (p.JigId != null && p.Productionplanneddate != null));
        }

        var productions = await query.ToListAsync();

        var productionDtos = productions.Select(p => MapToDto(p, p.Order?.OrderNumber, p.CustomerAccount?.Name)).ToList();
        return Ok(productionDtos);
    }

    [HttpGet("planner")]
    public async Task<ActionResult<IEnumerable<ProductionPlannerDto>>> GetForPlanner(
        [FromQuery] string? dateFrom = null,
        [FromQuery] string? dateTo = null,
        [FromQuery] bool? excludeInWip = null)
    {
        // Default date range: 12 months back, 3 months forward
        var fromDate = DateTime.UtcNow.AddMonths(-12);
        var toDate = DateTime.UtcNow.AddMonths(3);

        if (!string.IsNullOrEmpty(dateFrom) && DateTime.TryParse(dateFrom, out var parsedFromDate))
        {
            fromDate = parsedFromDate;
        }

        if (!string.IsNullOrEmpty(dateTo) && DateTime.TryParse(dateTo, out var parsedToDate))
        {
            toDate = parsedToDate;
        }

        // Get productions with planned dates in range OR any incomplete productions (for scheduling)
        var query = _context.Productions
            .AsNoTracking()
            .Include(p => p.Order)
            .Include(p => p.CustomerAccount)
            .Where(p => 
                (p.Productionplanneddate >= fromDate && p.Productionplanneddate <= toDate) ||
                (p.Productioncomplete != true));

        // Filter out productions that are already in WIP (allocated)
        if (excludeInWip == true)
        {
            query = query.Where(p => !p.IsInWip);
        }

        var plannerData = await query
            .Select(p => new ProductionPlannerDto
            {
                Id = p.Id,
                Name = p.Name ?? string.Empty,
                CustomerName = p.CustomerAccount != null ? p.CustomerAccount.Name : null,
                OrderNo = p.Orderno,
                OrderNumber = p.Order != null ? p.Order.OrderNumber : null,
                ProductionComplete = p.Productioncomplete,
                ProductionPlannedDate = p.Productionplanneddate,
                NewEstimateDefinks = p.NewEstimatedefinks,
                CustomDurationMinutes = p.CustomDurationMinutes,
                ParentProductionId = p.ParentProductionId,
                RolloverSequence = p.RolloverSequence,
                JigId = p.JigId,
                PlannedStartTime = p.PlannedStartTime,
                PlannedEndTime = p.PlannedEndTime,
                PlannedDurationMinutes = p.PlannedDurationMinutes,
                BreakAdjustmentMinutes = p.BreakAdjustmentMinutes,
                IsInWip = p.IsInWip,
                CreatedOn = p.CreatedOn
            })
            .ToListAsync();

        _logger.LogInformation("Planner endpoint returned {Count} productions", plannerData.Count);
        return Ok(plannerData);
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

    /// <summary>
    /// Updates the Production Planned Date for a production record.
    /// Send null to clear the date (move to unallocated sidebar).
    /// Accepts date-only string (YYYY-MM-DD) which is stored as UTC midnight.
    /// </summary>
    [HttpPatch("{id}/planned-date")]
    public async Task<ActionResult> UpdatePlannedDate(Guid id, [FromBody] UpdatePlannedDateDto? updateDto)
    {
        if (updateDto == null)
        {
            return BadRequest(new { message = "Request body is required" });
        }

        var production = await _context.Productions.FindAsync(id);

        if (production == null)
        {
            return NotFound(new { message = $"Production with ID {id} not found" });
        }

        // Normalize to UTC midnight if date is provided (date-only storage)
        DateTime? normalizedDate = null;
        if (updateDto.PlannedDate.HasValue)
        {
            var date = updateDto.PlannedDate.Value;
            normalizedDate = new DateTime(date.Year, date.Month, date.Day, 0, 0, 0, DateTimeKind.Utc);
        }

        production.Productionplanneddate = normalizedDate;
        production.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated production {Id} planned date to: {PlannedDate}", 
            production.Id, normalizedDate?.ToString("yyyy-MM-dd") ?? "null");

        return Ok(new { id = production.Id, plannedDate = production.Productionplanneddate });
    }

    [HttpPost("bulk")]
    public async Task<ActionResult<object>> BulkImport([FromBody] List<ProductionImportDto> productions)
    {
        var imported = 0;
        var skippedById = 0;
        var skippedByName = 0;
        var errors = new List<string>();

        var existingNames = await _context.Productions
            .Where(p => p.Name != null)
            .Select(p => p.Name!)
            .ToListAsync();
        var existingNameSet = new HashSet<string>(existingNames, StringComparer.OrdinalIgnoreCase);

        var existingIds = await _context.Productions
            .Select(p => p.Id)
            .ToListAsync();
        var existingIdSet = new HashSet<Guid>(existingIds);

        foreach (var prod in productions)
        {
            try
            {
                if (existingIdSet.Contains(prod.Id))
                {
                    _logger.LogDebug("Skipping production {Name} - ID {Id} already exists", prod.Name, prod.Id);
                    skippedById++;
                    continue;
                }

                if (!string.IsNullOrEmpty(prod.Name) && existingNameSet.Contains(prod.Name))
                {
                    _logger.LogDebug("Skipping production {Name} - Name already exists in database", prod.Name);
                    skippedByName++;
                    continue;
                }

                var entity = new Production
                {
                    Id = prod.Id,
                    Name = prod.Name,
                    Customer = prod.Customer,
                    Orderno = prod.Orderno,
                    Jigstart = prod.Jigstart,
                    Jigend = prod.Jigend,
                    Jigleader = prod.Jigleader,
                    Jighelper1 = prod.Jighelper1,
                    Jighelper2 = prod.Jighelper2,
                    Jighelper3 = prod.Jighelper3,
                    Jighelper4 = prod.Jighelper4,
                    Pickstart = prod.Pickstart,
                    Pickend = prod.Pickend,
                    Pickingmaster = prod.Pickingmaster,
                    Pickinghelper1 = prod.Pickinghelper1,
                    Pickinghelper2 = prod.Pickinghelper2,
                    Pickinghelper3 = prod.Pickinghelper3,
                    Sawstart = prod.Sawstart,
                    Sawend = prod.Sawend,
                    Sawoperator = prod.Sawoperator,
                    Sawhelper1 = prod.Sawhelper1,
                    Sawhelper2 = prod.Sawhelper2,
                    Productioncomplete = prod.Productioncomplete,
                    Productionplanneddate = prod.Productionplanneddate,
                    Totalcuts = prod.Totalcuts,
                    Totaltimbercubes = prod.Totaltimbercubes,
                    Trusscost = prod.Trusscost,
                    Trussselling = prod.Trussselling,
                    Workunitsefinks = prod.Workunitsefinks,
                    NewEstimatedefinks = prod.Newestimatedefinks,
                    CreatedOn = prod.CreatedOn ?? DateTime.UtcNow,
                    CreatedBy = prod.CreatedBy,
                    ModifiedOn = prod.ModifiedOn,
                    ModifiedBy = prod.ModifiedBy
                };

                _context.Productions.Add(entity);
                existingIdSet.Add(prod.Id);
                if (!string.IsNullOrEmpty(prod.Name))
                {
                    existingNameSet.Add(prod.Name);
                }
                imported++;
            }
            catch (Exception ex)
            {
                errors.Add($"{prod.Name ?? prod.Id.ToString()}: {ex.Message}");
                _logger.LogError(ex, "Error importing production {Name} ({Id})", prod.Name, prod.Id);
            }
        }

        await _context.SaveChangesAsync();

        var skipped = skippedById + skippedByName;
        _logger.LogInformation("Bulk import completed: {Imported} imported, {Skipped} skipped ({SkippedById} by ID, {SkippedByName} by name), {Errors} errors", 
            imported, skipped, skippedById, skippedByName, errors.Count);

        return Ok(new { 
            imported, 
            skipped,
            skippedById,
            skippedByName, 
            errors = errors.Count, 
            errorDetails = errors 
        });
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
            IsInWip = production.IsInWip,
            CreatedOn = production.CreatedOn,
            CreatedBy = production.CreatedBy,
            ModifiedOn = production.ModifiedOn,
            ModifiedBy = production.ModifiedBy
        };
    }
}
