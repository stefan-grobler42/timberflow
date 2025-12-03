namespace MillenniumERP.Application.DTOs;

public class ScheduleBlockDto
{
    public Guid Id { get; set; }
    public string BlockType { get; set; } = string.Empty;
    public string DateStr { get; set; } = string.Empty;
    public Guid? TeamId { get; set; }
    public string? TeamName { get; set; }
    public int StartTimeMinutes { get; set; }
    public int EndTimeMinutes { get; set; }
    public string? Description { get; set; }
    public Guid? RelatedProductionId { get; set; }
    public string? RelatedProductionName { get; set; }
    public DateTime? CreatedOn { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public Guid? ModifiedBy { get; set; }
}

public class CreateScheduleBlockDto
{
    public string BlockType { get; set; } = string.Empty;
    public string DateStr { get; set; } = string.Empty;
    public Guid? TeamId { get; set; }
    public int StartTimeMinutes { get; set; }
    public int EndTimeMinutes { get; set; }
    public string? Description { get; set; }
    public Guid? RelatedProductionId { get; set; }
}

public class UpdateScheduleBlockDto
{
    public string? BlockType { get; set; }
    public string? DateStr { get; set; }
    public Guid? TeamId { get; set; }
    public int? StartTimeMinutes { get; set; }
    public int? EndTimeMinutes { get; set; }
    public string? Description { get; set; }
    public Guid? RelatedProductionId { get; set; }
}
