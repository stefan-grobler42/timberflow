namespace MillenniumERP.Domain.Entities;

public class Contact
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public string? Designation { get; set; }
    public string? Department { get; set; }
    public bool IsPrimary { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    public string FullName => $"{FirstName} {LastName}".Trim();
    
    public Customer Customer { get; set; } = null!;
}
