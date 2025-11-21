namespace MillenniumERP.Application.DTOs;

public class SawDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? OperatorId { get; set; }
    public decimal? AverageTimePerCut { get; set; }
    public DateTime? LastServiceDate { get; set; }
    public string? SerialNumber { get; set; }
    public string? AssetNumber { get; set; }
    public DateTime? LastBladeChange { get; set; }
    public DateTime? CreatedOn { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public Guid? ModifiedBy { get; set; }
}

public class CreateSawDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? OperatorId { get; set; }
    public decimal? AverageTimePerCut { get; set; }
    public DateTime? LastServiceDate { get; set; }
    public string? SerialNumber { get; set; }
    public string? AssetNumber { get; set; }
    public DateTime? LastBladeChange { get; set; }
}

public class UpdateSawDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public Guid? OperatorId { get; set; }
    public decimal? AverageTimePerCut { get; set; }
    public DateTime? LastServiceDate { get; set; }
    public string? SerialNumber { get; set; }
    public string? AssetNumber { get; set; }
    public DateTime? LastBladeChange { get; set; }
}
