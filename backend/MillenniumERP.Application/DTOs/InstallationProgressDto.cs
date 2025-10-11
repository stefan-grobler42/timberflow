namespace MillenniumERP.Application.DTOs;

public class InstallationProgressDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NewInstallationorderno { get; set; }
    public decimal? NewPercentagecomplete { get; set; }
    public DateTime? CreatedOn { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public Guid? ModifiedBy { get; set; }
}

public class CreateInstallationProgressDto
{
    public string Name { get; set; } = string.Empty;
    public string? NewInstallationorderno { get; set; }
    public decimal? NewPercentagecomplete { get; set; }
}

public class UpdateInstallationProgressDto
{
    public string? Name { get; set; }
    public string? NewInstallationorderno { get; set; }
    public decimal? NewPercentagecomplete { get; set; }
}
