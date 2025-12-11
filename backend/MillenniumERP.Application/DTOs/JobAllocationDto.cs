using System.Text.Json.Serialization;

namespace MillenniumERP.Application.DTOs;

public class JobAllocationDto
{
    [JsonPropertyName("id")]
    public Guid Id { get; set; }

    [JsonPropertyName("productionId")]
    public Guid? ProductionId { get; set; }

    [JsonPropertyName("teamId")]
    public Guid TeamId { get; set; }

    [JsonPropertyName("orderNumber")]
    public string? OrderNumber { get; set; }

    [JsonPropertyName("customerName")]
    public string? CustomerName { get; set; }

    [JsonPropertyName("productionName")]
    public string? ProductionName { get; set; }

    [JsonPropertyName("siteAddress")]
    public string? SiteAddress { get; set; }

    [JsonPropertyName("estimatedEfinks")]
    public decimal EstimatedEfinks { get; set; }

    [JsonPropertyName("estimatedDurationMinutes")]
    public int EstimatedDurationMinutes { get; set; }

    [JsonPropertyName("spanStartDate")]
    public DateTime SpanStartDate { get; set; }

    [JsonPropertyName("spanStartMinutes")]
    public int SpanStartMinutes { get; set; }

    [JsonPropertyName("spanEndDate")]
    public DateTime? SpanEndDate { get; set; }

    [JsonPropertyName("spanEndMinutes")]
    public int? SpanEndMinutes { get; set; }

    [JsonPropertyName("queuePosition")]
    public int QueuePosition { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "scheduled";

    [JsonPropertyName("actualEfinks")]
    public decimal? ActualEfinks { get; set; }

    [JsonPropertyName("actualDurationMinutes")]
    public int? ActualDurationMinutes { get; set; }

    [JsonPropertyName("isComplete")]
    public bool IsComplete { get; set; }

    [JsonPropertyName("completedOn")]
    public DateTime? CompletedOn { get; set; }

    [JsonPropertyName("salesOrderId")]
    public Guid? SalesOrderId { get; set; }

    [JsonPropertyName("createdOn")]
    public DateTime CreatedOn { get; set; }

    [JsonPropertyName("createdBy")]
    public Guid? CreatedBy { get; set; }

    [JsonPropertyName("modifiedOn")]
    public DateTime? ModifiedOn { get; set; }

    [JsonPropertyName("modifiedBy")]
    public Guid? ModifiedBy { get; set; }

    [JsonPropertyName("teamName")]
    public string? TeamName { get; set; }
}

public class CreateJobAllocationDto
{
    [JsonPropertyName("productionId")]
    public Guid? ProductionId { get; set; }

    [JsonPropertyName("teamId")]
    public Guid TeamId { get; set; }

    [JsonPropertyName("orderNumber")]
    public string? OrderNumber { get; set; }

    [JsonPropertyName("customerName")]
    public string? CustomerName { get; set; }

    [JsonPropertyName("productionName")]
    public string? ProductionName { get; set; }

    [JsonPropertyName("siteAddress")]
    public string? SiteAddress { get; set; }

    [JsonPropertyName("estimatedEfinks")]
    public decimal EstimatedEfinks { get; set; }

    [JsonPropertyName("estimatedDurationMinutes")]
    public int EstimatedDurationMinutes { get; set; }

    [JsonPropertyName("spanStartDate")]
    public DateTime SpanStartDate { get; set; }

    [JsonPropertyName("spanStartMinutes")]
    public int SpanStartMinutes { get; set; }

    [JsonPropertyName("spanEndDate")]
    public DateTime? SpanEndDate { get; set; }

    [JsonPropertyName("spanEndMinutes")]
    public int? SpanEndMinutes { get; set; }

    [JsonPropertyName("queuePosition")]
    public int QueuePosition { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "scheduled";

    [JsonPropertyName("salesOrderId")]
    public Guid? SalesOrderId { get; set; }
}

public class UpdateJobAllocationDto
{
    [JsonPropertyName("teamId")]
    public Guid? TeamId { get; set; }

    [JsonPropertyName("orderNumber")]
    public string? OrderNumber { get; set; }

    [JsonPropertyName("customerName")]
    public string? CustomerName { get; set; }

    [JsonPropertyName("productionName")]
    public string? ProductionName { get; set; }

    [JsonPropertyName("siteAddress")]
    public string? SiteAddress { get; set; }

    [JsonPropertyName("estimatedEfinks")]
    public decimal? EstimatedEfinks { get; set; }

    [JsonPropertyName("estimatedDurationMinutes")]
    public int? EstimatedDurationMinutes { get; set; }

    [JsonPropertyName("spanStartDate")]
    public DateTime? SpanStartDate { get; set; }

    [JsonPropertyName("spanStartMinutes")]
    public int? SpanStartMinutes { get; set; }

    [JsonPropertyName("spanEndDate")]
    public DateTime? SpanEndDate { get; set; }

    [JsonPropertyName("spanEndMinutes")]
    public int? SpanEndMinutes { get; set; }

    [JsonPropertyName("queuePosition")]
    public int? QueuePosition { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("actualEfinks")]
    public decimal? ActualEfinks { get; set; }

    [JsonPropertyName("actualDurationMinutes")]
    public int? ActualDurationMinutes { get; set; }
}

public class CompleteJobAllocationDto
{
    [JsonPropertyName("actualEfinks")]
    public decimal? ActualEfinks { get; set; }

    [JsonPropertyName("actualDurationMinutes")]
    public int? ActualDurationMinutes { get; set; }
}

public class CascadeRescheduleDto
{
    [JsonPropertyName("teamId")]
    public Guid TeamId { get; set; }

    [JsonPropertyName("afterPosition")]
    public int AfterPosition { get; set; }

    [JsonPropertyName("startDate")]
    public DateTime StartDate { get; set; }

    [JsonPropertyName("startMinutes")]
    public int StartMinutes { get; set; }
}
