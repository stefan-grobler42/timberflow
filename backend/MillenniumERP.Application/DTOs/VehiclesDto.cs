namespace MillenniumERP.Application.DTOs;

public class VehiclesDto
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? Make { get; set; }
    public string? Model { get; set; }
    public string? RegistrationNumber { get; set; }
    public string? YearModel { get; set; }
    public Guid? ApprovedDriver { get; set; }
    public bool? CofInOrder { get; set; }
    public DateTime? LicenseRenewalDate { get; set; }
    public DateTime? CreatedOn { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public Guid? ModifiedBy { get; set; }
}

public class CreateVehiclesDto
{
    public string? Name { get; set; }
    public string? Make { get; set; }
    public string? Model { get; set; }
    public string? RegistrationNumber { get; set; }
    public string? YearModel { get; set; }
    public Guid? ApprovedDriver { get; set; }
    public bool? CofInOrder { get; set; }
    public DateTime? LicenseRenewalDate { get; set; }
}

public class UpdateVehiclesDto
{
    public string? Name { get; set; }
    public string? Make { get; set; }
    public string? Model { get; set; }
    public string? RegistrationNumber { get; set; }
    public string? YearModel { get; set; }
    public Guid? ApprovedDriver { get; set; }
    public bool? CofInOrder { get; set; }
    public DateTime? LicenseRenewalDate { get; set; }
}
