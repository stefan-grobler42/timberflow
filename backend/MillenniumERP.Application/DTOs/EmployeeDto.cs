namespace MillenniumERP.Application.DTOs;

public class EmployeeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? EmployeeNo { get; set; }
    public string? IdNo { get; set; }
    public string? JobDescription { get; set; }
    public string? DriversLicenseNo { get; set; }
    public string? PdpNo { get; set; }
    public DateTime? PdpExpiryDate { get; set; }
    public bool? Pdp { get; set; }
    public bool? AllowDriving { get; set; }
    public decimal? HourlyRate { get; set; }
    public string? NewCellNo { get; set; }
    public string? NewEmailAddress { get; set; }
    public string? NewIncomeTaxNumber { get; set; }
    public bool? NewActiveEmployee { get; set; }
    public bool? NewCommissionPayable { get; set; }
    public bool? NewContractOnFile { get; set; }
    public DateTime? NewStartDate { get; set; }
    public bool? NewUnionMember { get; set; }
    public string? NewDisplayNameCalculated { get; set; }
    public DateTime? CreatedOn { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public Guid? ModifiedBy { get; set; }
}

public class CreateEmployeeDto
{
    public string Name { get; set; } = string.Empty;
    public string? EmployeeNo { get; set; }
    public string? IdNo { get; set; }
    public string? JobDescription { get; set; }
    public string? DriversLicenseNo { get; set; }
    public string? PdpNo { get; set; }
    public DateTime? PdpExpiryDate { get; set; }
    public bool? Pdp { get; set; }
    public bool? AllowDriving { get; set; }
    public decimal? HourlyRate { get; set; }
    public string? NewCellNo { get; set; }
    public string? NewEmailAddress { get; set; }
    public string? NewIncomeTaxNumber { get; set; }
    public bool? NewActiveEmployee { get; set; }
    public bool? NewCommissionPayable { get; set; }
    public bool? NewContractOnFile { get; set; }
    public DateTime? NewStartDate { get; set; }
    public bool? NewUnionMember { get; set; }
}

public class UpdateEmployeeDto
{
    public string? Name { get; set; }
    public string? EmployeeNo { get; set; }
    public string? IdNo { get; set; }
    public string? JobDescription { get; set; }
    public string? DriversLicenseNo { get; set; }
    public string? PdpNo { get; set; }
    public DateTime? PdpExpiryDate { get; set; }
    public bool? Pdp { get; set; }
    public bool? AllowDriving { get; set; }
    public decimal? HourlyRate { get; set; }
    public string? NewCellNo { get; set; }
    public string? NewEmailAddress { get; set; }
    public string? NewIncomeTaxNumber { get; set; }
    public bool? NewActiveEmployee { get; set; }
    public bool? NewCommissionPayable { get; set; }
    public bool? NewContractOnFile { get; set; }
    public DateTime? NewStartDate { get; set; }
    public bool? NewUnionMember { get; set; }
}
