namespace MillenniumERP.Application.DTOs;

public class JobBatchDto
{
    public Guid Id { get; set; }
    public Guid? JigId { get; set; }
    public string? JigName { get; set; }
    public DateTime? BatchDate { get; set; }
    public Guid? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public decimal TotalEfinks { get; set; }
    public int? CombinedDurationMinutes { get; set; }
    public int? PlannedStartTime { get; set; }
    public int? PlannedEndTime { get; set; }
    public int? BreakAdjustmentMinutes { get; set; }
    public DateTime CreatedOn { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public List<BatchedProductionDto> Productions { get; set; } = new();
}

public class BatchedProductionDto
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? OrderNumber { get; set; }
    public decimal? EstimatedEfinks { get; set; }
    public int BatchPosition { get; set; }
}

public class CombineJobsDto
{
    public Guid PrimaryJobId { get; set; }
    public Guid SecondaryJobId { get; set; }
    public Guid? JigId { get; set; }
    public DateTime? BatchDate { get; set; }
    public int? PlannedStartTime { get; set; }
}

public class AddToBatchDto
{
    public Guid BatchId { get; set; }
    public Guid ProductionId { get; set; }
}

public class UpdateBatchTimingDto
{
    public Guid? JigId { get; set; }
    public DateTime? BatchDate { get; set; }
    public int? PlannedStartTime { get; set; }
    public int? PlannedEndTime { get; set; }
    public int? CombinedDurationMinutes { get; set; }
    public int? BreakAdjustmentMinutes { get; set; }
}
