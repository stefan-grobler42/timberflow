using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BatchedJobsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<BatchedJobsController> _logger;
    private const decimal BATCH_EFFICIENCY_FACTOR = 0.70m;

    public BatchedJobsController(AppDbContext context, ILogger<BatchedJobsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        var batched = await _context.BatchedJobs
            .AsNoTracking()
            .ToListAsync();
        return Ok(batched.Select(MapToResponse));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> GetById(Guid id)
    {
        var job = await _context.BatchedJobs
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == id);
        if (job == null)
            return NotFound(new { message = $"Batched job {id} not found" });
        return Ok(MapToResponse(job));
    }

    [HttpGet("{id}/details")]
    public async Task<ActionResult> GetDetails(Guid id)
    {
        var job = await _context.BatchedJobs
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == id);
        if (job == null)
            return NotFound(new { message = $"Batched job {id} not found" });

        var sourceIds = job.SourceProductionIds?
            .Split(',')
            .Where(s => !string.IsNullOrEmpty(s.Trim()))
            .Select(s => Guid.Parse(s.Trim()))
            .ToList() ?? new List<Guid>();

        var sourceProductions = await _context.Productions
            .AsNoTracking()
            .Include(p => p.Order)
            .Where(p => sourceIds.Contains(p.Id))
            .ToListAsync();

        var productionDetails = sourceProductions.Select(p => new
        {
            Id = p.Id,
            OrderNumber = p.Order?.OrderNumber ?? p.Order?.Name,
            Name = p.Name,
            EstimatedEfinks = p.NewEstimatedefinks
        }).ToList();

        return Ok(new
        {
            job.Id,
            job.Name,
            job.CustomerName,
            job.OrderNumbers,
            job.EstimatedEfinks,
            job.CustomDurationMinutes,
            job.ProductionPlannedDate,
            job.IsInWip,
            job.SourceProductionIds,
            SourceProductions = productionDetails
        });
    }

    [HttpPost("combine")]
    public async Task<ActionResult<BatchedJob>> CombineJobs([FromBody] CombineJobsRequest dto)
    {
        var jobA = await _context.Productions
            .Include(p => p.CustomerAccount)
            .Include(p => p.Order)
            .FirstOrDefaultAsync(p => p.Id == dto.JobAId);

        var jobB = await _context.Productions
            .Include(p => p.CustomerAccount)
            .Include(p => p.Order)
            .FirstOrDefaultAsync(p => p.Id == dto.JobBId);

        if (jobA == null)
            return NotFound(new { message = $"Job {dto.JobAId} not found" });
        if (jobB == null)
            return NotFound(new { message = $"Job {dto.JobBId} not found" });

        if (jobA.Customer != jobB.Customer)
            return BadRequest(new { message = "Jobs must have the same customer to be combined" });

        if (jobA.IsBatched || jobB.IsBatched)
            return BadRequest(new { message = "One or both jobs are already batched" });

        var nameA = jobA.Name ?? "";
        var nameB = jobB.Name ?? "";
        var orderA = jobA.Order?.OrderNumber ?? jobA.Order?.Name ?? "";
        var orderB = jobB.Order?.OrderNumber ?? jobB.Order?.Name ?? "";

        var combinedName = CombineFields(nameA, nameB);
        var combinedOrderNumbers = CombineFields(orderA, orderB);

        var efinksA = jobA.NewEstimatedefinks ?? 0;
        var efinksB = jobB.NewEstimatedefinks ?? 0;
        var totalEfinks = efinksA + efinksB;

        var batchedJob = new BatchedJob
        {
            Id = Guid.NewGuid(),
            Name = combinedName,
            CustomerId = jobA.Customer,
            CustomerName = jobA.CustomerAccount?.Name ?? "Unknown",
            OrderNumbers = combinedOrderNumbers,
            OrderId = jobA.Orderno,
            EstimatedEfinks = totalEfinks,
            CustomDurationMinutes = CalculateBatchedDuration(efinksA, efinksB),
            ProductionPlannedDate = jobA.Productionplanneddate ?? jobB.Productionplanneddate,
            JigId = jobA.JigId ?? jobB.JigId,
            ProductionComplete = false,
            IsInWip = false,
            SourceProductionIds = $"{jobA.Id},{jobB.Id}",
            BatchEfficiencyFactor = BATCH_EFFICIENCY_FACTOR,
            CreatedOn = DateTime.UtcNow,
            ModifiedOn = DateTime.UtcNow
        };

        _context.BatchedJobs.Add(batchedJob);

        jobA.IsBatched = true;
        jobA.ModifiedOn = DateTime.UtcNow;
        jobB.IsBatched = true;
        jobB.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Combined jobs {JobAId} and {JobBId} into batched job {BatchedJobId}",
            dto.JobAId, dto.JobBId, batchedJob.Id);

        return Ok(MapToResponse(batchedJob));
    }

    [HttpPost("{batchedJobId}/add")]
    public async Task<ActionResult<BatchedJob>> AddToBatchedJob(Guid batchedJobId, [FromBody] AddToBatchRequest dto)
    {
        var batchedJob = await _context.BatchedJobs.FindAsync(batchedJobId);
        if (batchedJob == null)
            return NotFound(new { message = $"Batched job {batchedJobId} not found" });

        var production = await _context.Productions
            .Include(p => p.CustomerAccount)
            .Include(p => p.Order)
            .FirstOrDefaultAsync(p => p.Id == dto.ProductionId);

        if (production == null)
            return NotFound(new { message = $"Production {dto.ProductionId} not found" });

        if (production.Customer != batchedJob.CustomerId)
            return BadRequest(new { message = "Job must have the same customer as the batch" });

        if (production.IsBatched)
            return BadRequest(new { message = "Job is already batched" });

        var prodName = production.Name ?? "";
        var prodOrder = production.Order?.OrderNumber ?? production.Order?.Name ?? "";

        batchedJob.Name = CombineFields(batchedJob.Name, prodName);
        batchedJob.OrderNumbers = CombineFields(batchedJob.OrderNumbers ?? "", prodOrder);

        var existingEfinks = batchedJob.EstimatedEfinks ?? 0;
        var newEfinks = production.NewEstimatedefinks ?? 0;
        batchedJob.EstimatedEfinks = existingEfinks + newEfinks;

        batchedJob.SourceProductionIds = $"{batchedJob.SourceProductionIds},{production.Id}";
        batchedJob.CustomDurationMinutes = RecalculateBatchDuration(batchedJob);
        batchedJob.ModifiedOn = DateTime.UtcNow;

        production.IsBatched = true;
        production.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Added production {ProductionId} to batched job {BatchedJobId}",
            dto.ProductionId, batchedJobId);

        return Ok(MapToResponse(batchedJob));
    }

    [HttpPost("{batchedJobId}/remove")]
    public async Task<ActionResult> RemoveFromBatchedJob(Guid batchedJobId, [FromBody] RemoveFromBatchRequest dto)
    {
        var batchedJob = await _context.BatchedJobs.FindAsync(batchedJobId);
        if (batchedJob == null)
            return NotFound(new { message = $"Batched job {batchedJobId} not found" });

        var sourceIds = batchedJob.SourceProductionIds.Split(',')
            .Where(s => !string.IsNullOrEmpty(s))
            .Select(s => Guid.Parse(s.Trim()))
            .ToList();

        if (!sourceIds.Contains(dto.ProductionId))
            return BadRequest(new { message = "Production is not in this batch" });

        var production = await _context.Productions.FindAsync(dto.ProductionId);
        if (production != null)
        {
            production.IsBatched = false;
            production.ModifiedOn = DateTime.UtcNow;
        }

        sourceIds.Remove(dto.ProductionId);

        if (sourceIds.Count <= 1)
        {
            foreach (var remainingId in sourceIds)
            {
                var remaining = await _context.Productions.FindAsync(remainingId);
                if (remaining != null)
                {
                    remaining.IsBatched = false;
                    remaining.ModifiedOn = DateTime.UtcNow;
                }
            }

            await DeleteWipForBatchedJob(batchedJobId);
            _context.BatchedJobs.Remove(batchedJob);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Dissolved batched job {BatchedJobId} - less than 2 jobs remaining", batchedJobId);
            return Ok(new { message = "Batch dissolved - all source jobs restored", dissolved = true });
        }

        batchedJob.SourceProductionIds = string.Join(",", sourceIds);

        var remainingProductions = await _context.Productions
            .Include(p => p.Order)
            .Include(p => p.CustomerAccount)
            .Where(p => sourceIds.Contains(p.Id))
            .ToListAsync();

        batchedJob.Name = string.Join(" & ", remainingProductions.Select(p => p.Name ?? "").Where(n => !string.IsNullOrEmpty(n)));
        batchedJob.OrderNumbers = string.Join(" & ", remainingProductions.Select(p => p.Order?.OrderNumber ?? p.Order?.Name ?? "").Where(n => !string.IsNullOrEmpty(n)));
        batchedJob.EstimatedEfinks = remainingProductions.Sum(p => p.NewEstimatedefinks ?? 0);
        batchedJob.CustomDurationMinutes = RecalculateBatchDuration(batchedJob);
        batchedJob.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Removed production {ProductionId} from batched job {BatchedJobId}", dto.ProductionId, batchedJobId);
        return Ok(new { message = "Production removed from batch", dissolved = false, batchedJob = MapToResponse(batchedJob) });
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteBatchedJob(Guid id)
    {
        var batchedJob = await _context.BatchedJobs.FindAsync(id);
        if (batchedJob == null)
            return NotFound(new { message = $"Batched job {id} not found" });

        var sourceIds = batchedJob.SourceProductionIds.Split(',')
            .Where(s => !string.IsNullOrEmpty(s))
            .Select(s => Guid.Parse(s.Trim()))
            .ToList();

        foreach (var sourceId in sourceIds)
        {
            var production = await _context.Productions.FindAsync(sourceId);
            if (production != null)
            {
                production.IsBatched = false;
                production.ModifiedOn = DateTime.UtcNow;
            }
        }

        await DeleteWipForBatchedJob(id);
        _context.BatchedJobs.Remove(batchedJob);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted batched job {BatchedJobId} and restored all source productions", id);
        return Ok(new { message = "Batched job deleted and all source productions restored" });
    }

    [HttpPatch("{id}")]
    public async Task<ActionResult<BatchedJob>> UpdateBatchedJob(Guid id, [FromBody] UpdateBatchedJobRequest dto)
    {
        var batchedJob = await _context.BatchedJobs.FindAsync(id);
        if (batchedJob == null)
            return NotFound(new { message = $"Batched job {id} not found" });

        if (dto.JigId.HasValue) batchedJob.JigId = dto.JigId;
        if (dto.ProductionPlannedDate.HasValue) batchedJob.ProductionPlannedDate = dto.ProductionPlannedDate;
        if (dto.PlannedStartTime.HasValue) batchedJob.PlannedStartTime = dto.PlannedStartTime;
        if (dto.PlannedEndTime.HasValue) batchedJob.PlannedEndTime = dto.PlannedEndTime;
        if (dto.PlannedDurationMinutes.HasValue) batchedJob.PlannedDurationMinutes = dto.PlannedDurationMinutes;
        if (dto.BreakAdjustmentMinutes.HasValue) batchedJob.BreakAdjustmentMinutes = dto.BreakAdjustmentMinutes;
        if (dto.CustomDurationMinutes.HasValue) batchedJob.CustomDurationMinutes = dto.CustomDurationMinutes;
        if (dto.ProductionComplete.HasValue) batchedJob.ProductionComplete = dto.ProductionComplete;
        batchedJob.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(MapToResponse(batchedJob));
    }

    private static object MapToResponse(BatchedJob b) => new
    {
        b.Id,
        b.Name,
        b.CustomerId,
        b.CustomerName,
        b.OrderNumbers,
        b.OrderId,
        b.EstimatedEfinks,
        b.CustomDurationMinutes,
        b.ProductionPlannedDate,
        b.JigId,
        b.ProductionComplete,
        b.PlannedStartTime,
        b.PlannedEndTime,
        b.PlannedDurationMinutes,
        b.BreakAdjustmentMinutes,
        b.IsInWip,
        b.SourceProductionIds,
        b.BatchEfficiencyFactor,
        b.CreatedOn,
        b.ModifiedOn
    };

    private async Task DeleteWipForBatchedJob(Guid batchedJobId)
    {
        var wipItems = await _context.TeamWorkItems
            .Where(w => w.ProductionId == batchedJobId)
            .ToListAsync();
        if (wipItems.Any())
        {
            _context.TeamWorkItems.RemoveRange(wipItems);
        }
    }

    private string CombineFields(string fieldA, string fieldB)
    {
        if (string.IsNullOrEmpty(fieldA)) return fieldB;
        if (string.IsNullOrEmpty(fieldB)) return fieldA;
        if (fieldA == fieldB) return fieldA;
        return $"{fieldA} & {fieldB}";
    }

    private int CalculateBatchedDuration(decimal efinksA, decimal efinksB)
    {
        var durationA = efinksA * 6.5625m;
        var durationB = efinksB * BATCH_EFFICIENCY_FACTOR * 6.5625m;
        return (int)Math.Ceiling(durationA + durationB);
    }

    private int RecalculateBatchDuration(BatchedJob batchedJob)
    {
        var sourceIds = batchedJob.SourceProductionIds.Split(',')
            .Where(s => !string.IsNullOrEmpty(s))
            .ToList();

        var productions = _context.Productions
            .Where(p => sourceIds.Select(s => Guid.Parse(s.Trim())).Contains(p.Id))
            .OrderBy(p => p.CreatedOn)
            .ToList();

        if (productions.Count == 0) return 0;

        decimal totalMinutes = 0;
        for (int i = 0; i < productions.Count; i++)
        {
            var efinks = productions[i].NewEstimatedefinks ?? 0;
            var baseDuration = efinks * 6.5625m;

            if (i == 0)
                totalMinutes += baseDuration;
            else
                totalMinutes += baseDuration * BATCH_EFFICIENCY_FACTOR;
        }

        return (int)Math.Ceiling(totalMinutes);
    }
}

public class CombineJobsRequest
{
    public Guid JobAId { get; set; }
    public Guid JobBId { get; set; }
}

public class AddToBatchRequest
{
    public Guid ProductionId { get; set; }
}

public class RemoveFromBatchRequest
{
    public Guid ProductionId { get; set; }
}

public class UpdateBatchedJobRequest
{
    public Guid? JigId { get; set; }
    public DateTime? ProductionPlannedDate { get; set; }
    public int? PlannedStartTime { get; set; }
    public int? PlannedEndTime { get; set; }
    public int? PlannedDurationMinutes { get; set; }
    public int? BreakAdjustmentMinutes { get; set; }
    public int? CustomDurationMinutes { get; set; }
    public bool? ProductionComplete { get; set; }
}
