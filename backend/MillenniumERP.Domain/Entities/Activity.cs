namespace MillenniumERP.Domain.Entities;

public class Activity
{
    public int Id { get; set; }
    public string ActivityType { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? ActivityDate { get; set; }
    public DateTime? DueDate { get; set; }
    public string Status { get; set; } = "Pending";
    public string Priority { get; set; } = "Medium";
    
    public int? CustomerId { get; set; }
    public int? AssignedToUserId { get; set; }
    public int? CreatedByUserId { get; set; }
    
    public bool IsCompleted { get; set; } = false;
    public DateTime? CompletedDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    public Customer? Customer { get; set; }
    public User? AssignedToUser { get; set; }
    public User? CreatedByUser { get; set; }
}
