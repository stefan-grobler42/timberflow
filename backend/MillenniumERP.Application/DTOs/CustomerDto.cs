namespace MillenniumERP.Application.DTOs;

public class CustomerDto
{
    public int Id { get; set; }
    public string AccountNo { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public int? CompanyTypeId { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public string? VatRegistrationNo { get; set; }
    public string? CompanyRegistrationNo { get; set; }
    public string? StreetAddress { get; set; }
    public string? City { get; set; }
    public string? Province { get; set; }
    public string? PostalCode { get; set; }
    public string Country { get; set; } = "South Africa";
    public string CustomerStatus { get; set; } = "Prospect";
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    public CompanyDto? CompanyType { get; set; }
}

public class CreateCustomerDto
{
    public string AccountNo { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public int? CompanyTypeId { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public string? VatRegistrationNo { get; set; }
    public string? CompanyRegistrationNo { get; set; }
    public string? StreetAddress { get; set; }
    public string? City { get; set; }
    public string? Province { get; set; }
    public string? PostalCode { get; set; }
    public string Country { get; set; } = "South Africa";
    public string CustomerStatus { get; set; } = "Prospect";
    public bool IsActive { get; set; } = true;
}

public class UpdateCustomerDto
{
    public string? AccountNo { get; set; }
    public string? AccountName { get; set; }
    public int? CompanyTypeId { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public string? VatRegistrationNo { get; set; }
    public string? CompanyRegistrationNo { get; set; }
    public string? StreetAddress { get; set; }
    public string? City { get; set; }
    public string? Province { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public string? CustomerStatus { get; set; }
    public bool? IsActive { get; set; }
}
