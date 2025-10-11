namespace MillenniumERP.Application.DTOs.D365;

public class D365AppointmentDto
{
    public Guid Id { get; set; }
    public string? Subject { get; set; }
    public string? Location { get; set; }
    public DateTime? ScheduledStart { get; set; }
    public DateTime? ScheduledEnd { get; set; }
    public int? ActualDurationMinutes { get; set; }
    public int? ScheduledDurationMinutes { get; set; }
    public string? Description { get; set; }
    public Guid? RegardingObjectId { get; set; }
    public Guid? OwnerId { get; set; }
    public int? StateCode { get; set; }
    public int? StatusCode { get; set; }
    public DateTime CreatedOn { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }
}

public class CreateD365AppointmentDto
{
    public string? Subject { get; set; }
    public string? Location { get; set; }
    public DateTime? ScheduledStart { get; set; }
    public DateTime? ScheduledEnd { get; set; }
    public int? ScheduledDurationMinutes { get; set; }
    public string? Description { get; set; }
    public Guid? RegardingObjectId { get; set; }
    public Guid? OwnerId { get; set; }
}

public class UpdateD365AppointmentDto
{
    public string? Subject { get; set; }
    public string? Location { get; set; }
    public DateTime? ScheduledStart { get; set; }
    public DateTime? ScheduledEnd { get; set; }
    public int? ActualDurationMinutes { get; set; }
    public int? ScheduledDurationMinutes { get; set; }
    public string? Description { get; set; }
    public int? StateCode { get; set; }
    public int? StatusCode { get; set; }
}
