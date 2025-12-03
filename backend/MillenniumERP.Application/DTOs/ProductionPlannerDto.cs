namespace MillenniumERP.Application.DTOs;

public class ProductionPlannerDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? CustomerName { get; set; }
    public Guid? OrderNo { get; set; }
    public string? OrderNumber { get; set; }
    public bool? ProductionComplete { get; set; }
    public DateTime? ProductionPlannedDate { get; set; }
    public decimal? NewEstimateDefinks { get; set; }
    public int? CustomDurationMinutes { get; set; }
    public Guid? ParentProductionId { get; set; }
    public int? RolloverSequence { get; set; }
    public Guid? JigId { get; set; }
    public int? PlannedStartTime { get; set; }
    public int? PlannedEndTime { get; set; }
    public int? PlannedDurationMinutes { get; set; }
    public int? BreakAdjustmentMinutes { get; set; }
    public DateTime? CreatedOn { get; set; }
}
