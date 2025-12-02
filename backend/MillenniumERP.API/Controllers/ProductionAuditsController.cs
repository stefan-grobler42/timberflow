using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductionAuditsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<ProductionAuditsController> _logger;

    public ProductionAuditsController(AppDbContext context, ILogger<ProductionAuditsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductionAuditDto>>> GetAll(
        [FromQuery] Guid? productionId = null,
        [FromQuery] Guid? batchId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] int limit = 100)
    {
        var query = _context.ProductionAudits
            .Include(a => a.OldJig)
            .Include(a => a.NewJig)
            .AsQueryable();

        if (productionId.HasValue)
        {
            query = query.Where(a => a.ProductionId == productionId.Value);
        }

        if (batchId.HasValue)
        {
            query = query.Where(a => a.BatchId == batchId.Value);
        }

        if (fromDate.HasValue)
        {
            query = query.Where(a => a.ChangedOn >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(a => a.ChangedOn <= toDate.Value);
        }

        var audits = await query
            .OrderByDescending(a => a.ChangedOn)
            .Take(limit)
            .ToListAsync();

        return Ok(audits.Select(MapToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductionAuditDto>> GetById(Guid id)
    {
        var audit = await _context.ProductionAudits
            .Include(a => a.OldJig)
            .Include(a => a.NewJig)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (audit == null)
        {
            return NotFound(new { message = $"Audit record with ID {id} not found" });
        }

        return Ok(MapToDto(audit));
    }

    [HttpGet("production/{productionId}")]
    public async Task<ActionResult<IEnumerable<ProductionAuditDto>>> GetByProductionId(Guid productionId)
    {
        var audits = await _context.ProductionAudits
            .Include(a => a.OldJig)
            .Include(a => a.NewJig)
            .Where(a => a.ProductionId == productionId)
            .OrderByDescending(a => a.ChangedOn)
            .ToListAsync();

        return Ok(audits.Select(MapToDto));
    }

    [HttpGet("batch/{batchId}")]
    public async Task<ActionResult<IEnumerable<ProductionAuditDto>>> GetByBatchId(Guid batchId)
    {
        var audits = await _context.ProductionAudits
            .Include(a => a.OldJig)
            .Include(a => a.NewJig)
            .Where(a => a.BatchId == batchId)
            .OrderByDescending(a => a.ChangedOn)
            .ToListAsync();

        return Ok(audits.Select(MapToDto));
    }

    [HttpPost]
    public async Task<ActionResult<ProductionAuditDto>> Create([FromBody] CreateProductionAuditDto createDto)
    {
        var audit = new ProductionAudit
        {
            Id = Guid.NewGuid(),
            ProductionId = createDto.ProductionId,
            ChangeType = createDto.ChangeType,
            FieldName = createDto.FieldName,
            OldValue = createDto.OldValue,
            NewValue = createDto.NewValue,
            OldJigId = createDto.OldJigId,
            NewJigId = createDto.NewJigId,
            OldPlannedDate = createDto.OldPlannedDate,
            NewPlannedDate = createDto.NewPlannedDate,
            OldStartTime = createDto.OldStartTime,
            NewStartTime = createDto.NewStartTime,
            OldEndTime = createDto.OldEndTime,
            NewEndTime = createDto.NewEndTime,
            OldDurationMinutes = createDto.OldDurationMinutes,
            NewDurationMinutes = createDto.NewDurationMinutes,
            BatchId = createDto.BatchId,
            OrderNumber = createDto.OrderNumber,
            CustomerName = createDto.CustomerName,
            ChangedBy = createDto.ChangedBy,
            ChangedOn = DateTime.UtcNow,
            Notes = createDto.Notes
        };

        _context.ProductionAudits.Add(audit);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created audit record {Id} for production {ProductionId}", audit.Id, audit.ProductionId);

        return CreatedAtAction(nameof(GetById), new { id = audit.Id }, MapToDto(audit));
    }

    [HttpPost("batch")]
    public async Task<ActionResult<IEnumerable<ProductionAuditDto>>> CreateBatch([FromBody] List<CreateProductionAuditDto> createDtos)
    {
        var batchId = Guid.NewGuid();
        var audits = new List<ProductionAudit>();

        foreach (var createDto in createDtos)
        {
            var audit = new ProductionAudit
            {
                Id = Guid.NewGuid(),
                ProductionId = createDto.ProductionId,
                ChangeType = createDto.ChangeType,
                FieldName = createDto.FieldName,
                OldValue = createDto.OldValue,
                NewValue = createDto.NewValue,
                OldJigId = createDto.OldJigId,
                NewJigId = createDto.NewJigId,
                OldPlannedDate = createDto.OldPlannedDate,
                NewPlannedDate = createDto.NewPlannedDate,
                OldStartTime = createDto.OldStartTime,
                NewStartTime = createDto.NewStartTime,
                OldEndTime = createDto.OldEndTime,
                NewEndTime = createDto.NewEndTime,
                OldDurationMinutes = createDto.OldDurationMinutes,
                NewDurationMinutes = createDto.NewDurationMinutes,
                BatchId = createDto.BatchId ?? batchId,
                OrderNumber = createDto.OrderNumber,
                CustomerName = createDto.CustomerName,
                ChangedBy = createDto.ChangedBy,
                ChangedOn = DateTime.UtcNow,
                Notes = createDto.Notes
            };

            audits.Add(audit);
        }

        _context.ProductionAudits.AddRange(audits);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created {Count} audit records in batch {BatchId}", audits.Count, batchId);

        return Ok(audits.Select(MapToDto));
    }

    private ProductionAuditDto MapToDto(ProductionAudit audit)
    {
        return new ProductionAuditDto
        {
            Id = audit.Id,
            ProductionId = audit.ProductionId,
            ChangeType = audit.ChangeType,
            FieldName = audit.FieldName,
            OldValue = audit.OldValue,
            NewValue = audit.NewValue,
            OldJigId = audit.OldJigId,
            NewJigId = audit.NewJigId,
            OldJigName = audit.OldJig?.Name,
            NewJigName = audit.NewJig?.Name,
            OldPlannedDate = audit.OldPlannedDate,
            NewPlannedDate = audit.NewPlannedDate,
            OldStartTime = audit.OldStartTime,
            NewStartTime = audit.NewStartTime,
            OldEndTime = audit.OldEndTime,
            NewEndTime = audit.NewEndTime,
            OldDurationMinutes = audit.OldDurationMinutes,
            NewDurationMinutes = audit.NewDurationMinutes,
            BatchId = audit.BatchId,
            OrderNumber = audit.OrderNumber,
            CustomerName = audit.CustomerName,
            ChangedBy = audit.ChangedBy,
            ChangedOn = audit.ChangedOn,
            Notes = audit.Notes
        };
    }
}

public class ProductionAuditDto
{
    public Guid Id { get; set; }
    public Guid ProductionId { get; set; }
    public string ChangeType { get; set; } = string.Empty;
    public string? FieldName { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public Guid? OldJigId { get; set; }
    public Guid? NewJigId { get; set; }
    public string? OldJigName { get; set; }
    public string? NewJigName { get; set; }
    public DateTime? OldPlannedDate { get; set; }
    public DateTime? NewPlannedDate { get; set; }
    public int? OldStartTime { get; set; }
    public int? NewStartTime { get; set; }
    public int? OldEndTime { get; set; }
    public int? NewEndTime { get; set; }
    public int? OldDurationMinutes { get; set; }
    public int? NewDurationMinutes { get; set; }
    public Guid? BatchId { get; set; }
    public string? OrderNumber { get; set; }
    public string? CustomerName { get; set; }
    public string? ChangedBy { get; set; }
    public DateTime ChangedOn { get; set; }
    public string? Notes { get; set; }
}

public class CreateProductionAuditDto
{
    public Guid ProductionId { get; set; }
    public string ChangeType { get; set; } = string.Empty;
    public string? FieldName { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public Guid? OldJigId { get; set; }
    public Guid? NewJigId { get; set; }
    public DateTime? OldPlannedDate { get; set; }
    public DateTime? NewPlannedDate { get; set; }
    public int? OldStartTime { get; set; }
    public int? NewStartTime { get; set; }
    public int? OldEndTime { get; set; }
    public int? NewEndTime { get; set; }
    public int? OldDurationMinutes { get; set; }
    public int? NewDurationMinutes { get; set; }
    public Guid? BatchId { get; set; }
    public string? OrderNumber { get; set; }
    public string? CustomerName { get; set; }
    public string? ChangedBy { get; set; }
    public string? Notes { get; set; }
}
