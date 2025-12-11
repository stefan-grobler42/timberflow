using System.Text.Json.Serialization;

namespace MillenniumERP.Application.DTOs;

public class JobWorkLogDto
{
    [JsonPropertyName("id")]
    public Guid Id { get; set; }

    [JsonPropertyName("allocationId")]
    public Guid AllocationId { get; set; }

    [JsonPropertyName("workDate")]
    public DateTime WorkDate { get; set; }

    [JsonPropertyName("plannedStartMinutes")]
    public int PlannedStartMinutes { get; set; }

    [JsonPropertyName("plannedEndMinutes")]
    public int PlannedEndMinutes { get; set; }

    [JsonPropertyName("plannedDurationMinutes")]
    public int PlannedDurationMinutes { get; set; }

    [JsonPropertyName("breakAdjustmentMinutes")]
    public int BreakAdjustmentMinutes { get; set; }

    [JsonPropertyName("actualStartMinutes")]
    public int? ActualStartMinutes { get; set; }

    [JsonPropertyName("actualEndMinutes")]
    public int? ActualEndMinutes { get; set; }

    [JsonPropertyName("actualDurationMinutes")]
    public int? ActualDurationMinutes { get; set; }

    [JsonPropertyName("efinksCompleted")]
    public decimal? EfinksCompleted { get; set; }

    [JsonPropertyName("leaderId")]
    public Guid? LeaderId { get; set; }

    [JsonPropertyName("helper1Id")]
    public Guid? Helper1Id { get; set; }

    [JsonPropertyName("helper2Id")]
    public Guid? Helper2Id { get; set; }

    [JsonPropertyName("helper3Id")]
    public Guid? Helper3Id { get; set; }

    [JsonPropertyName("helper4Id")]
    public Guid? Helper4Id { get; set; }

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }

    [JsonPropertyName("overtimeType")]
    public string? OvertimeType { get; set; }

    [JsonPropertyName("isOvertime")]
    public bool IsOvertime { get; set; }

    [JsonPropertyName("createdOn")]
    public DateTime CreatedOn { get; set; }

    [JsonPropertyName("modifiedOn")]
    public DateTime? ModifiedOn { get; set; }

    [JsonPropertyName("leaderName")]
    public string? LeaderName { get; set; }

    [JsonPropertyName("helper1Name")]
    public string? Helper1Name { get; set; }

    [JsonPropertyName("helper2Name")]
    public string? Helper2Name { get; set; }

    [JsonPropertyName("helper3Name")]
    public string? Helper3Name { get; set; }

    [JsonPropertyName("helper4Name")]
    public string? Helper4Name { get; set; }

    [JsonPropertyName("orderNumber")]
    public string? OrderNumber { get; set; }

    [JsonPropertyName("customerName")]
    public string? CustomerName { get; set; }
}

public class CreateJobWorkLogDto
{
    [JsonPropertyName("allocationId")]
    public Guid AllocationId { get; set; }

    [JsonPropertyName("workDate")]
    public DateTime WorkDate { get; set; }

    [JsonPropertyName("plannedStartMinutes")]
    public int PlannedStartMinutes { get; set; }

    [JsonPropertyName("plannedEndMinutes")]
    public int PlannedEndMinutes { get; set; }

    [JsonPropertyName("plannedDurationMinutes")]
    public int PlannedDurationMinutes { get; set; }

    [JsonPropertyName("breakAdjustmentMinutes")]
    public int BreakAdjustmentMinutes { get; set; }

    [JsonPropertyName("actualStartMinutes")]
    public int? ActualStartMinutes { get; set; }

    [JsonPropertyName("actualEndMinutes")]
    public int? ActualEndMinutes { get; set; }

    [JsonPropertyName("actualDurationMinutes")]
    public int? ActualDurationMinutes { get; set; }

    [JsonPropertyName("efinksCompleted")]
    public decimal? EfinksCompleted { get; set; }

    [JsonPropertyName("leaderId")]
    public Guid? LeaderId { get; set; }

    [JsonPropertyName("helper1Id")]
    public Guid? Helper1Id { get; set; }

    [JsonPropertyName("helper2Id")]
    public Guid? Helper2Id { get; set; }

    [JsonPropertyName("helper3Id")]
    public Guid? Helper3Id { get; set; }

    [JsonPropertyName("helper4Id")]
    public Guid? Helper4Id { get; set; }

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }

    [JsonPropertyName("overtimeType")]
    public string? OvertimeType { get; set; }

    [JsonPropertyName("isOvertime")]
    public bool IsOvertime { get; set; }
}

public class UpdateJobWorkLogDto
{
    [JsonPropertyName("plannedStartMinutes")]
    public int? PlannedStartMinutes { get; set; }

    [JsonPropertyName("plannedEndMinutes")]
    public int? PlannedEndMinutes { get; set; }

    [JsonPropertyName("plannedDurationMinutes")]
    public int? PlannedDurationMinutes { get; set; }

    [JsonPropertyName("breakAdjustmentMinutes")]
    public int? BreakAdjustmentMinutes { get; set; }

    [JsonPropertyName("actualStartMinutes")]
    public int? ActualStartMinutes { get; set; }

    [JsonPropertyName("actualEndMinutes")]
    public int? ActualEndMinutes { get; set; }

    [JsonPropertyName("actualDurationMinutes")]
    public int? ActualDurationMinutes { get; set; }

    [JsonPropertyName("efinksCompleted")]
    public decimal? EfinksCompleted { get; set; }

    [JsonPropertyName("leaderId")]
    public Guid? LeaderId { get; set; }

    [JsonPropertyName("helper1Id")]
    public Guid? Helper1Id { get; set; }

    [JsonPropertyName("helper2Id")]
    public Guid? Helper2Id { get; set; }

    [JsonPropertyName("helper3Id")]
    public Guid? Helper3Id { get; set; }

    [JsonPropertyName("helper4Id")]
    public Guid? Helper4Id { get; set; }

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }

    [JsonPropertyName("overtimeType")]
    public string? OvertimeType { get; set; }

    [JsonPropertyName("isOvertime")]
    public bool? IsOvertime { get; set; }
}
