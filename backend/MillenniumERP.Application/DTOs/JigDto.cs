namespace MillenniumERP.Application.DTOs;

public class JigDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? LeaderId { get; set; }
    public string? Proficiency { get; set; }
    public decimal? ReliabilityScore { get; set; }
    public string? Strengths { get; set; }
    public decimal AverageEfinks { get; set; } = 80;
    public DateTime? CreatedOn { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public Guid? ModifiedBy { get; set; }
}

public class CreateJigDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? LeaderId { get; set; }
    public string? Proficiency { get; set; }
    public decimal? ReliabilityScore { get; set; }
    public string? Strengths { get; set; }
    public decimal AverageEfinks { get; set; } = 80;
}

public class UpdateJigDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public Guid? LeaderId { get; set; }
    public string? Proficiency { get; set; }
    public decimal? ReliabilityScore { get; set; }
    public string? Strengths { get; set; }
    public decimal? AverageEfinks { get; set; }
}
