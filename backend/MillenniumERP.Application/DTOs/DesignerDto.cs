namespace MillenniumERP.Application.DTOs;

public class DesignerDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Cellnumber { get; set; }
    public string? Emailaddress { get; set; }
    public string? Employeeno { get; set; }
    public string? NewDisplaynamecalculated { get; set; }
    public Guid? NewEmployeefile { get; set; }
    public DateTime? CreatedOn { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public Guid? ModifiedBy { get; set; }
}

public class CreateDesignerDto
{
    public string Name { get; set; } = string.Empty;
    public string? Cellnumber { get; set; }
    public string? Emailaddress { get; set; }
    public string? Employeeno { get; set; }
}

public class UpdateDesignerDto
{
    public string? Name { get; set; }
    public string? Cellnumber { get; set; }
    public string? Emailaddress { get; set; }
    public string? Employeeno { get; set; }
}
