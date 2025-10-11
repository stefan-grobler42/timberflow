namespace MillenniumERP.Application.DTOs;

public class InstallationProgressDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NewInstallationOrderNo { get; set; }
    public decimal? NewPercentageComplete { get; set; }
    public DateTime? CreatedOn { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public Guid? ModifiedBy { get; set; }
}

public class CreateInstallationProgressDto
{
    public string Name { get; set; } = string.Empty;
    public string? NewInstallationOrderNo { get; set; }
    public decimal? NewPercentageComplete { get; set; }
}

public class UpdateInstallationProgressDto
{
    public string? Name { get; set; }
    public string? NewInstallationOrderNo { get; set; }
    public decimal? NewPercentageComplete { get; set; }
}
