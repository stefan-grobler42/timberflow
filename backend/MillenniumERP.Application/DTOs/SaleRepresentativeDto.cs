namespace MillenniumERP.Application.DTOs;

public class SaleRepresentativeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? CellNumber { get; set; }
    public string? EmailAddress { get; set; }
    public string? EmployeeNo { get; set; }
    public Guid? NewEmployeeFile { get; set; }
    public DateTime? CreatedOn { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public Guid? ModifiedBy { get; set; }
}

public class CreateSaleRepresentativeDto
{
    public string Name { get; set; } = string.Empty;
    public string? CellNumber { get; set; }
    public string? EmailAddress { get; set; }
    public string? EmployeeNo { get; set; }
}

public class UpdateSaleRepresentativeDto
{
    public string? Name { get; set; }
    public string? CellNumber { get; set; }
    public string? EmailAddress { get; set; }
    public string? EmployeeNo { get; set; }
}
