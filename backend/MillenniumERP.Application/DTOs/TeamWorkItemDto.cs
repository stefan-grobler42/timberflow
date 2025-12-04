using System.Text.Json.Serialization;

namespace MillenniumERP.Application.DTOs;

public class TeamWorkItemDto
{
    [JsonPropertyName("id")]
    public Guid Id { get; set; }

    [JsonPropertyName("productionId")]
    public Guid ProductionId { get; set; }

    [JsonPropertyName("teamId")]
    public Guid TeamId { get; set; }

    [JsonPropertyName("workDate")]
    public DateTime WorkDate { get; set; }

    [JsonPropertyName("sequence")]
    public int Sequence { get; set; }

    [JsonPropertyName("plannedStartMinutes")]
    public int PlannedStartMinutes { get; set; }

    [JsonPropertyName("plannedEndMinutes")]
    public int PlannedEndMinutes { get; set; }

    [JsonPropertyName("plannedDurationMinutes")]
    public int PlannedDurationMinutes { get; set; }

    [JsonPropertyName("breakAdjustmentMinutes")]
    public int BreakAdjustmentMinutes { get; set; }

    [JsonPropertyName("actualStartTime")]
    public DateTime? ActualStartTime { get; set; }

    [JsonPropertyName("actualEndTime")]
    public DateTime? ActualEndTime { get; set; }

    [JsonPropertyName("actualDurationMinutes")]
    public int? ActualDurationMinutes { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "scheduled";

    [JsonPropertyName("parentWipId")]
    public Guid? ParentWipId { get; set; }

    [JsonPropertyName("rolloverSequence")]
    public int RolloverSequence { get; set; }

    [JsonPropertyName("spilloverMinutes")]
    public int? SpilloverMinutes { get; set; }

    [JsonPropertyName("overtimeEnabled")]
    public bool OvertimeEnabled { get; set; }

    [JsonPropertyName("earlyOvertimeEnabled")]
    public bool EarlyOvertimeEnabled { get; set; }

    [JsonPropertyName("timberCubes")]
    public decimal? TimberCubes { get; set; }

    [JsonPropertyName("totalCuts")]
    public int? TotalCuts { get; set; }

    [JsonPropertyName("actualEfinks")]
    public decimal? ActualEfinks { get; set; }

    [JsonPropertyName("pickingComplete")]
    public bool PickingComplete { get; set; }

    [JsonPropertyName("sawingComplete")]
    public bool SawingComplete { get; set; }

    [JsonPropertyName("jiggingComplete")]
    public bool JiggingComplete { get; set; }

    [JsonPropertyName("needsVerification")]
    public bool NeedsVerification { get; set; }

    [JsonPropertyName("dayStartMinutes")]
    public int? DayStartMinutes { get; set; }

    [JsonPropertyName("dayEndMinutes")]
    public int? DayEndMinutes { get; set; }

    [JsonPropertyName("breakDefinitions")]
    public string? BreakDefinitions { get; set; }

    [JsonPropertyName("createdOn")]
    public DateTime CreatedOn { get; set; }

    [JsonPropertyName("createdBy")]
    public Guid? CreatedBy { get; set; }

    [JsonPropertyName("modifiedOn")]
    public DateTime? ModifiedOn { get; set; }

    [JsonPropertyName("modifiedBy")]
    public Guid? ModifiedBy { get; set; }

    [JsonPropertyName("productionName")]
    public string? ProductionName { get; set; }

    [JsonPropertyName("teamName")]
    public string? TeamName { get; set; }

    [JsonPropertyName("customerName")]
    public string? CustomerName { get; set; }

    [JsonPropertyName("orderNumber")]
    public string? OrderNumber { get; set; }

    [JsonPropertyName("estimatedEfinks")]
    public decimal? EstimatedEfinks { get; set; }
}

public class CreateTeamWorkItemDto
{
    [JsonPropertyName("productionId")]
    public Guid ProductionId { get; set; }

    [JsonPropertyName("teamId")]
    public Guid TeamId { get; set; }

    [JsonPropertyName("workDate")]
    public DateTime WorkDate { get; set; }

    [JsonPropertyName("sequence")]
    public int Sequence { get; set; }

    [JsonPropertyName("plannedStartMinutes")]
    public int PlannedStartMinutes { get; set; }

    [JsonPropertyName("plannedEndMinutes")]
    public int PlannedEndMinutes { get; set; }

    [JsonPropertyName("plannedDurationMinutes")]
    public int PlannedDurationMinutes { get; set; }

    [JsonPropertyName("breakAdjustmentMinutes")]
    public int BreakAdjustmentMinutes { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "scheduled";

    [JsonPropertyName("parentWipId")]
    public Guid? ParentWipId { get; set; }

    [JsonPropertyName("rolloverSequence")]
    public int RolloverSequence { get; set; }

    [JsonPropertyName("spilloverMinutes")]
    public int? SpilloverMinutes { get; set; }

    [JsonPropertyName("overtimeEnabled")]
    public bool OvertimeEnabled { get; set; }

    [JsonPropertyName("earlyOvertimeEnabled")]
    public bool EarlyOvertimeEnabled { get; set; }

    [JsonPropertyName("timberCubes")]
    public decimal? TimberCubes { get; set; }

    [JsonPropertyName("totalCuts")]
    public int? TotalCuts { get; set; }

    [JsonPropertyName("dayStartMinutes")]
    public int? DayStartMinutes { get; set; }

    [JsonPropertyName("dayEndMinutes")]
    public int? DayEndMinutes { get; set; }

    [JsonPropertyName("breakDefinitions")]
    public string? BreakDefinitions { get; set; }
}

public class UpdateTeamWorkItemDto
{
    [JsonPropertyName("teamId")]
    public Guid? TeamId { get; set; }

    [JsonPropertyName("workDate")]
    public DateTime? WorkDate { get; set; }

    [JsonPropertyName("sequence")]
    public int? Sequence { get; set; }

    [JsonPropertyName("plannedStartMinutes")]
    public int? PlannedStartMinutes { get; set; }

    [JsonPropertyName("plannedEndMinutes")]
    public int? PlannedEndMinutes { get; set; }

    [JsonPropertyName("plannedDurationMinutes")]
    public int? PlannedDurationMinutes { get; set; }

    [JsonPropertyName("breakAdjustmentMinutes")]
    public int? BreakAdjustmentMinutes { get; set; }

    [JsonPropertyName("actualStartTime")]
    public DateTime? ActualStartTime { get; set; }

    [JsonPropertyName("actualEndTime")]
    public DateTime? ActualEndTime { get; set; }

    [JsonPropertyName("actualDurationMinutes")]
    public int? ActualDurationMinutes { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("parentWipId")]
    public Guid? ParentWipId { get; set; }

    [JsonPropertyName("rolloverSequence")]
    public int? RolloverSequence { get; set; }

    [JsonPropertyName("spilloverMinutes")]
    public int? SpilloverMinutes { get; set; }

    [JsonPropertyName("overtimeEnabled")]
    public bool? OvertimeEnabled { get; set; }

    [JsonPropertyName("earlyOvertimeEnabled")]
    public bool? EarlyOvertimeEnabled { get; set; }

    [JsonPropertyName("timberCubes")]
    public decimal? TimberCubes { get; set; }

    [JsonPropertyName("totalCuts")]
    public int? TotalCuts { get; set; }

    [JsonPropertyName("actualEfinks")]
    public decimal? ActualEfinks { get; set; }

    [JsonPropertyName("pickingComplete")]
    public bool? PickingComplete { get; set; }

    [JsonPropertyName("sawingComplete")]
    public bool? SawingComplete { get; set; }

    [JsonPropertyName("jiggingComplete")]
    public bool? JiggingComplete { get; set; }

    [JsonPropertyName("needsVerification")]
    public bool? NeedsVerification { get; set; }

    [JsonPropertyName("dayStartMinutes")]
    public int? DayStartMinutes { get; set; }

    [JsonPropertyName("dayEndMinutes")]
    public int? DayEndMinutes { get; set; }

    [JsonPropertyName("breakDefinitions")]
    public string? BreakDefinitions { get; set; }
}

public class CompleteTeamWorkItemDto
{
    [JsonPropertyName("actualStartTime")]
    public DateTime? ActualStartTime { get; set; }

    [JsonPropertyName("actualEndTime")]
    public DateTime? ActualEndTime { get; set; }

    [JsonPropertyName("actualDurationMinutes")]
    public int? ActualDurationMinutes { get; set; }

    [JsonPropertyName("actualEfinks")]
    public decimal? ActualEfinks { get; set; }

    [JsonPropertyName("timberCubes")]
    public decimal? TimberCubes { get; set; }

    [JsonPropertyName("totalCuts")]
    public int? TotalCuts { get; set; }

    [JsonPropertyName("needsVerification")]
    public bool NeedsVerification { get; set; }
}
