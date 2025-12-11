using System.Text.Json.Serialization;

namespace MillenniumERP.Application.DTOs;

public class TeamDaySettingsDto
{
    [JsonPropertyName("id")]
    public Guid Id { get; set; }

    [JsonPropertyName("teamId")]
    public Guid TeamId { get; set; }

    [JsonPropertyName("workDate")]
    public DateTime WorkDate { get; set; }

    [JsonPropertyName("earlyOtEnabled")]
    public bool EarlyOtEnabled { get; set; }

    [JsonPropertyName("earlyOtStartMinutes")]
    public int? EarlyOtStartMinutes { get; set; }

    [JsonPropertyName("lateOtEnabled")]
    public bool LateOtEnabled { get; set; }

    [JsonPropertyName("lateOtEndMinutes")]
    public int? LateOtEndMinutes { get; set; }

    [JsonPropertyName("isWorkingDay")]
    public bool IsWorkingDay { get; set; }

    [JsonPropertyName("createdOn")]
    public DateTime CreatedOn { get; set; }

    [JsonPropertyName("modifiedOn")]
    public DateTime? ModifiedOn { get; set; }

    [JsonPropertyName("teamName")]
    public string? TeamName { get; set; }
}

public class UpsertTeamDaySettingsDto
{
    [JsonPropertyName("teamId")]
    public Guid TeamId { get; set; }

    [JsonPropertyName("workDate")]
    public DateTime WorkDate { get; set; }

    [JsonPropertyName("earlyOtEnabled")]
    public bool EarlyOtEnabled { get; set; }

    [JsonPropertyName("earlyOtStartMinutes")]
    public int? EarlyOtStartMinutes { get; set; }

    [JsonPropertyName("lateOtEnabled")]
    public bool LateOtEnabled { get; set; }

    [JsonPropertyName("lateOtEndMinutes")]
    public int? LateOtEndMinutes { get; set; }

    [JsonPropertyName("isWorkingDay")]
    public bool IsWorkingDay { get; set; } = true;
}
