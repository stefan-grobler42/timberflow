namespace MillenniumERP.Application.DTOs;

public class EmployeeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Employeeno { get; set; }
    public string? Idno { get; set; }
    public string? Jobdescription { get; set; }
    public string? Driverslicenseno { get; set; }
    public string? Pdpno { get; set; }
    public DateTime? Pdpexpirydate { get; set; }
    public bool? Pdp { get; set; }
    public bool? Allowdriving { get; set; }
    public decimal? Hourlyrate { get; set; }
    public string? NewCellno { get; set; }
    public string? NewEmailaddress { get; set; }
    public string? NewIncometaxnumber { get; set; }
    public bool? NewActiveemployee { get; set; }
    public bool? NewCommissionpayable { get; set; }
    public bool? NewContractonfile { get; set; }
    public DateTime? NewStartdate { get; set; }
    public bool? NewUnionmember { get; set; }
    public string? NewDisplaynamecalculated { get; set; }
    public DateTime? CreatedOn { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public Guid? ModifiedBy { get; set; }
}

public class CreateEmployeeDto
{
    public string Name { get; set; } = string.Empty;
    public string? Employeeno { get; set; }
    public string? Idno { get; set; }
    public string? Jobdescription { get; set; }
    public string? Driverslicenseno { get; set; }
    public string? Pdpno { get; set; }
    public DateTime? Pdpexpirydate { get; set; }
    public bool? Pdp { get; set; }
    public bool? Allowdriving { get; set; }
    public decimal? Hourlyrate { get; set; }
    public string? NewCellno { get; set; }
    public string? NewEmailaddress { get; set; }
    public string? NewIncometaxnumber { get; set; }
    public bool? NewActiveemployee { get; set; }
    public bool? NewCommissionpayable { get; set; }
    public bool? NewContractonfile { get; set; }
    public DateTime? NewStartdate { get; set; }
    public bool? NewUnionmember { get; set; }
}

public class UpdateEmployeeDto
{
    public string? Name { get; set; }
    public string? Employeeno { get; set; }
    public string? Idno { get; set; }
    public string? Jobdescription { get; set; }
    public string? Driverslicenseno { get; set; }
    public string? Pdpno { get; set; }
    public DateTime? Pdpexpirydate { get; set; }
    public bool? Pdp { get; set; }
    public bool? Allowdriving { get; set; }
    public decimal? Hourlyrate { get; set; }
    public string? NewCellno { get; set; }
    public string? NewEmailaddress { get; set; }
    public string? NewIncometaxnumber { get; set; }
    public bool? NewActiveemployee { get; set; }
    public bool? NewCommissionpayable { get; set; }
    public bool? NewContractonfile { get; set; }
    public DateTime? NewStartdate { get; set; }
    public bool? NewUnionmember { get; set; }
}
