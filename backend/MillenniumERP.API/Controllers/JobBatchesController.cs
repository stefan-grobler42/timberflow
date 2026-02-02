using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class JobBatchesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<JobBatchesController> _logger;
    private const decimal BATCH_EFFICIENCY_FACTOR = 0.70m;

    public JobBatchesController(AppDbContext context, ILogger<JobBatchesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<JobBatchDto>>> GetAll()
    {
        var batches = await _context.JobBatches
            .Include(b => b.Customer)
            .Include(b => b.Jig)
            .Include(b => b.Productions)
            .ToListAsync();

        return Ok(batches.Select(MapToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<JobBatchDto>> GetById(Guid id)
    {
        var batch = await _context.JobBatches
            .Include(b => b.Customer)
            .Include(b => b.Jig)
            .Include(b => b.Productions)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (batch == null)
            return NotFound(new { message = $"Batch with ID {id} not found" });

        return Ok(MapToDto(batch));
    }

    [HttpGet("by-date-range")]
    public async Task<ActionResult<IEnumerable<JobBatchDto>>> GetByDateRange(
        [FromQuery] DateTime dateFrom, 
        [FromQuery] DateTime dateTo)
    {
        var batches = await _context.JobBatches
            .Include(b => b.Customer)
            .Include(b => b.Jig)
            .Include(b => b.Productions)
            .Where(b => b.BatchDate >= dateFrom && b.BatchDate <= dateTo)
            .ToListAsync();

        return Ok(batches.Select(MapToDto));
    }

    [HttpPost("combine")]
    public async Task<ActionResult<JobBatchDto>> CombineJobs([FromBody] CombineJobsDto dto)
    {
        var primaryJob = await _context.Productions
            .Include(p => p.CustomerAccount)
            .Include(p => p.Order)
            .FirstOrDefaultAsync(p => p.Id == dto.PrimaryJobId);

        var secondaryJob = await _context.Productions
            .Include(p => p.CustomerAccount)
            .Include(p => p.Order)
            .FirstOrDefaultAsync(p => p.Id == dto.SecondaryJobId);

        if (primaryJob == null)
            return NotFound(new { message = $"Primary job {dto.PrimaryJobId} not found" });

        if (secondaryJob == null)
            return NotFound(new { message = $"Secondary job {dto.SecondaryJobId} not found" });

        if (primaryJob.Customer != secondaryJob.Customer)
            return BadRequest(new { message = "Jobs must have the same customer to be combined" });

        if (primaryJob.BatchId.HasValue && secondaryJob.BatchId.HasValue && primaryJob.BatchId == secondaryJob.BatchId)
            return BadRequest(new { message = "Jobs are already in the same batch" });

        JobBatch batch;
        if (primaryJob.BatchId.HasValue)
        {
            batch = await _context.JobBatches
                .Include(b => b.Productions)
                .FirstAsync(b => b.Id == primaryJob.BatchId);
            
            secondaryJob.BatchId = batch.Id;
            secondaryJob.BatchPosition = (batch.Productions?.Count ?? 0);
        }
        else if (secondaryJob.BatchId.HasValue)
        {
            batch = await _context.JobBatches
                .Include(b => b.Productions)
                .FirstAsync(b => b.Id == secondaryJob.BatchId);
            
            primaryJob.BatchId = batch.Id;
            primaryJob.BatchPosition = (batch.Productions?.Count ?? 0);
        }
        else
        {
            batch = new JobBatch
            {
                Id = Guid.NewGuid(),
                CustomerId = primaryJob.Customer,
                JigId = dto.JigId,
                BatchDate = dto.BatchDate,
                PlannedStartTime = dto.PlannedStartTime,
                CreatedOn = DateTime.UtcNow
            };
            _context.JobBatches.Add(batch);

            primaryJob.BatchId = batch.Id;
            primaryJob.BatchPosition = 0;
            
            secondaryJob.BatchId = batch.Id;
            secondaryJob.BatchPosition = 1;
        }

        var allBatchedProductions = await _context.Productions
            .Where(p => p.BatchId == batch.Id || p.Id == dto.PrimaryJobId || p.Id == dto.SecondaryJobId)
            .ToListAsync();

        batch.TotalEfinks = allBatchedProductions.Sum(p => p.NewEstimatedefinks ?? 0);
        batch.CombinedDurationMinutes = CalculateBatchDuration(allBatchedProductions);
        batch.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var updatedBatch = await _context.JobBatches
            .Include(b => b.Customer)
            .Include(b => b.Jig)
            .Include(b => b.Productions)
            .FirstAsync(b => b.Id == batch.Id);

        _logger.LogInformation("Combined jobs {PrimaryId} and {SecondaryId} into batch {BatchId}", 
            dto.PrimaryJobId, dto.SecondaryJobId, batch.Id);

        return Ok(MapToDto(updatedBatch));
    }

    [HttpPost("{batchId}/add")]
    public async Task<ActionResult<JobBatchDto>> AddToBatch(Guid batchId, [FromBody] AddToBatchDto dto)
    {
        var batch = await _context.JobBatches
            .Include(b => b.Productions)
            .FirstOrDefaultAsync(b => b.Id == batchId);

        if (batch == null)
            return NotFound(new { message = $"Batch {batchId} not found" });

        var production = await _context.Productions
            .Include(p => p.CustomerAccount)
            .FirstOrDefaultAsync(p => p.Id == dto.ProductionId);

        if (production == null)
            return NotFound(new { message = $"Production {dto.ProductionId} not found" });

        if (production.Customer != batch.CustomerId)
            return BadRequest(new { message = "Production must have the same customer as the batch" });

        if (production.BatchId == batchId)
            return BadRequest(new { message = "Production is already in this batch" });

        production.BatchId = batchId;
        production.BatchPosition = (batch.Productions?.Count ?? 0);

        var allProductions = await _context.Productions
            .Where(p => p.BatchId == batchId)
            .ToListAsync();
        allProductions.Add(production);

        batch.TotalEfinks = allProductions.Sum(p => p.NewEstimatedefinks ?? 0);
        batch.CombinedDurationMinutes = CalculateBatchDuration(allProductions);
        batch.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var updatedBatch = await _context.JobBatches
            .Include(b => b.Customer)
            .Include(b => b.Jig)
            .Include(b => b.Productions)
            .FirstAsync(b => b.Id == batchId);

        _logger.LogInformation("Added production {ProductionId} to batch {BatchId}", dto.ProductionId, batchId);

        return Ok(MapToDto(updatedBatch));
    }

    [HttpDelete("{batchId}/productions/{productionId}")]
    public async Task<ActionResult> RemoveFromBatch(Guid batchId, Guid productionId)
    {
        var batch = await _context.JobBatches
            .Include(b => b.Productions)
            .FirstOrDefaultAsync(b => b.Id == batchId);

        if (batch == null)
            return NotFound(new { message = $"Batch {batchId} not found" });

        var production = await _context.Productions.FindAsync(productionId);

        if (production == null)
            return NotFound(new { message = $"Production {productionId} not found" });

        if (production.BatchId != batchId)
            return BadRequest(new { message = "Production is not in this batch" });

        production.BatchId = null;
        production.BatchPosition = null;
        production.JigId = null;
        production.Productionplanneddate = null;
        production.PlannedStartTime = null;
        production.PlannedEndTime = null;
        production.ModifiedOn = DateTime.UtcNow;

        var remainingProductions = await _context.Productions
            .Where(p => p.BatchId == batchId && p.Id != productionId)
            .OrderBy(p => p.BatchPosition)
            .ToListAsync();

        if (remainingProductions.Count <= 1)
        {
            foreach (var p in remainingProductions)
            {
                p.BatchId = null;
                p.BatchPosition = null;
            }
            _context.JobBatches.Remove(batch);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Removed production {ProductionId} from batch {BatchId} - batch dissolved", 
                productionId, batchId);

            return Ok(new { message = "Production removed and batch dissolved (less than 2 remaining)", dissolved = true });
        }
        else
        {
            for (int i = 0; i < remainingProductions.Count; i++)
            {
                remainingProductions[i].BatchPosition = i;
            }

            batch.TotalEfinks = remainingProductions.Sum(p => p.NewEstimatedefinks ?? 0);
            batch.CombinedDurationMinutes = CalculateBatchDuration(remainingProductions);
            batch.ModifiedOn = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Removed production {ProductionId} from batch {BatchId}", productionId, batchId);

            return Ok(new { message = "Production removed from batch", dissolved = false });
        }
    }

    [HttpPatch("{batchId}/timing")]
    public async Task<ActionResult<JobBatchDto>> UpdateBatchTiming(Guid batchId, [FromBody] UpdateBatchTimingDto dto)
    {
        var batch = await _context.JobBatches
            .Include(b => b.Productions)
            .FirstOrDefaultAsync(b => b.Id == batchId);

        if (batch == null)
            return NotFound(new { message = $"Batch {batchId} not found" });

        if (dto.JigId.HasValue) batch.JigId = dto.JigId;
        if (dto.BatchDate.HasValue) batch.BatchDate = dto.BatchDate;
        if (dto.PlannedStartTime.HasValue) batch.PlannedStartTime = dto.PlannedStartTime;
        if (dto.PlannedEndTime.HasValue) batch.PlannedEndTime = dto.PlannedEndTime;
        if (dto.CombinedDurationMinutes.HasValue) batch.CombinedDurationMinutes = dto.CombinedDurationMinutes;
        if (dto.BreakAdjustmentMinutes.HasValue) batch.BreakAdjustmentMinutes = dto.BreakAdjustmentMinutes;
        batch.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var updatedBatch = await _context.JobBatches
            .Include(b => b.Customer)
            .Include(b => b.Jig)
            .Include(b => b.Productions)
            .FirstAsync(b => b.Id == batchId);

        return Ok(MapToDto(updatedBatch));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteBatch(Guid id)
    {
        var batch = await _context.JobBatches
            .Include(b => b.Productions)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (batch == null)
            return NotFound(new { message = $"Batch {id} not found" });

        if (batch.Productions != null)
        {
            foreach (var production in batch.Productions)
            {
                production.BatchId = null;
                production.BatchPosition = null;
            }
        }

        _context.JobBatches.Remove(batch);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted batch {BatchId} and released all productions", id);

        return Ok(new { message = "Batch deleted and all productions released" });
    }

    private int CalculateBatchDuration(List<Production> productions)
    {
        if (productions.Count == 0) return 0;

        var sortedProductions = productions.OrderBy(p => p.BatchPosition ?? int.MaxValue).ToList();
        
        decimal totalMinutes = 0;
        for (int i = 0; i < sortedProductions.Count; i++)
        {
            var efinks = sortedProductions[i].NewEstimatedefinks ?? 0;
            var baseDuration = efinks * 6.5625m;
            
            if (i == 0)
            {
                totalMinutes += baseDuration;
            }
            else
            {
                totalMinutes += baseDuration * BATCH_EFFICIENCY_FACTOR;
            }
        }

        return (int)Math.Ceiling(totalMinutes);
    }

    private static JobBatchDto MapToDto(JobBatch batch)
    {
        return new JobBatchDto
        {
            Id = batch.Id,
            JigId = batch.JigId,
            JigName = batch.Jig?.Name,
            BatchDate = batch.BatchDate,
            CustomerId = batch.CustomerId,
            CustomerName = batch.Customer?.Name,
            TotalEfinks = batch.TotalEfinks,
            CombinedDurationMinutes = batch.CombinedDurationMinutes,
            PlannedStartTime = batch.PlannedStartTime,
            PlannedEndTime = batch.PlannedEndTime,
            BreakAdjustmentMinutes = batch.BreakAdjustmentMinutes,
            CreatedOn = batch.CreatedOn,
            ModifiedOn = batch.ModifiedOn,
            Productions = batch.Productions?
                .OrderBy(p => p.BatchPosition)
                .Select(p => new BatchedProductionDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    OrderNumber = p.Order?.Name,
                    EstimatedEfinks = p.NewEstimatedefinks,
                    BatchPosition = p.BatchPosition ?? 0
                })
                .ToList() ?? new List<BatchedProductionDto>()
        };
    }
}
