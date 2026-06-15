using System.Text.Json.Serialization;

namespace MillenniumERP.Application.DTOs;

public class JobTimeEntryDto
{
    [JsonPropertyName("id")]
    public Guid Id { get; set; }

    [JsonPropertyName("jobId")]
    public Guid JobId { get; set; }

    [JsonPropertyName("teamId")]
    public Guid TeamId { get; set; }

    [JsonPropertyName("stageType")]
    public string StageType { get; set; } = "overall";

    [JsonPropertyName("startedAt")]
    public DateTime StartedAt { get; set; }

    [JsonPropertyName("endedAt")]
    public DateTime? EndedAt { get; set; }

    [JsonPropertyName("actualDurationMinutes")]
    public int? ActualDurationMinutes { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "in_progress";

    [JsonPropertyName("startedBy")]
    public string? StartedBy { get; set; }

    [JsonPropertyName("endedBy")]
    public string? EndedBy { get; set; }

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }
}

public class MobileJobDto
{
    [JsonPropertyName("jobId")]
    public Guid JobId { get; set; }

    [JsonPropertyName("productionId")]
    public Guid? ProductionId { get; set; }

    [JsonPropertyName("teamId")]
    public Guid TeamId { get; set; }

    [JsonPropertyName("teamName")]
    public string? TeamName { get; set; }

    [JsonPropertyName("workDate")]
    public DateTime WorkDate { get; set; }

    [JsonPropertyName("jobNumber")]
    public string? JobNumber { get; set; }

    [JsonPropertyName("customerName")]
    public string? CustomerName { get; set; }

    [JsonPropertyName("siteAddress")]
    public string? SiteAddress { get; set; }

    [JsonPropertyName("plannedStartMinutes")]
    public int PlannedStartMinutes { get; set; }

    [JsonPropertyName("plannedEndMinutes")]
    public int PlannedEndMinutes { get; set; }

    [JsonPropertyName("plannedDurationMinutes")]
    public int PlannedDurationMinutes { get; set; }

    [JsonPropertyName("actualDurationMinutes")]
    public int? ActualDurationMinutes { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "not_started";

    [JsonPropertyName("activeEntry")]
    public JobTimeEntryDto? ActiveEntry { get; set; }

    [JsonPropertyName("latestEntry")]
    public JobTimeEntryDto? LatestEntry { get; set; }

    [JsonPropertyName("timingSummary")]
    public JobTimingSummaryDto? TimingSummary { get; set; }

    [JsonPropertyName("stages")]
    public List<JobStageSummaryDto> Stages { get; set; } = [];
}

public class JobStageSummaryDto
{
    [JsonPropertyName("stageType")]
    public string StageType { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = "not_started";

    [JsonPropertyName("totalDurationMinutes")]
    public int TotalDurationMinutes { get; set; }

    [JsonPropertyName("activeEntry")]
    public JobTimeEntryDto? ActiveEntry { get; set; }

    [JsonPropertyName("latestEntry")]
    public JobTimeEntryDto? LatestEntry { get; set; }
}

public class JobTimingSummaryDto
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = "not_started";

    [JsonPropertyName("hasOverallTiming")]
    public bool HasOverallTiming { get; set; }

    [JsonPropertyName("hasStageTiming")]
    public bool HasStageTiming { get; set; }

    [JsonPropertyName("actualStartTime")]
    public DateTime? ActualStartTime { get; set; }

    [JsonPropertyName("actualEndTime")]
    public DateTime? ActualEndTime { get; set; }

    [JsonPropertyName("actualDurationMinutes")]
    public int? ActualDurationMinutes { get; set; }

    [JsonPropertyName("activeEntry")]
    public JobTimeEntryDto? ActiveEntry { get; set; }

    [JsonPropertyName("latestEntry")]
    public JobTimeEntryDto? LatestEntry { get; set; }

    [JsonPropertyName("stageDurations")]
    public TeamWorkItemStageDurationsDto StageDurations { get; set; } = new();

    [JsonPropertyName("stages")]
    public List<JobStageSummaryDto> Stages { get; set; } = [];
}

public class JobTimeActionDto
{
    [JsonPropertyName("notes")]
    public string? Notes { get; set; }
}
