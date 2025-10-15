namespace MillenniumERP.Application.DTOs;

public class DesignerDto
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? CellNumber { get; set; }
    public string? EmailAddress { get; set; }
    public string? EmployeeNo { get; set; }
    public string? NewDisplayNameCalculated { get; set; }
    public Guid? NewEmployeeFile { get; set; }
    public DateTime? CreatedOn { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public Guid? ModifiedBy { get; set; }
}

public class CreateDesignerDto
{
    public string? Name { get; set; }
    public string? CellNumber { get; set; }
    public string? EmailAddress { get; set; }
    public string? EmployeeNo { get; set; }
}

public class UpdateDesignerDto
{
    public string? Name { get; set; }
    public string? CellNumber { get; set; }
    public string? EmailAddress { get; set; }
    public string? EmployeeNo { get; set; }
}
