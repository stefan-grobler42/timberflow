namespace MillenniumERP.Application.DTOs;

public class ActivityDto
{
    public int Id { get; set; }
    public int? CustomerId { get; set; }
    public string ActivityType { get; set; } = string.Empty;
    public string? Subject { get; set; }
    public string? Description { get; set; }
    public DateTime? ActivityDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateActivityDto
{
    public int? CustomerId { get; set; }
    public string ActivityType { get; set; } = string.Empty;
    public string? Subject { get; set; }
    public string? Description { get; set; }
    public DateTime? ActivityDate { get; set; }
}

public class UpdateActivityDto
{
    public string? ActivityType { get; set; }
    public string? Subject { get; set; }
    public string? Description { get; set; }
    public DateTime? ActivityDate { get; set; }
}
