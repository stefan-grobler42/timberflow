namespace MillenniumERP.Application.DTOs;

public class PickingTeamDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? TeamLeaderId { get; set; }
    public decimal? AverageTimePerM3 { get; set; }
    public DateTime? CreatedOn { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public Guid? ModifiedBy { get; set; }
}

public class CreatePickingTeamDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? TeamLeaderId { get; set; }
    public decimal? AverageTimePerM3 { get; set; }
}

public class UpdatePickingTeamDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public Guid? TeamLeaderId { get; set; }
    public decimal? AverageTimePerM3 { get; set; }
}
