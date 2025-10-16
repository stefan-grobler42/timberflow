namespace MillenniumERP.Application.DTOs.D365;

public class AccountDto
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? AccountNumber { get; set; }
    public string? Telephone1 { get; set; }
    public string? EmailAddress1 { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? Address1Line1 { get; set; }
    public string? Address1City { get; set; }
    public string? Address1StateOrProvince { get; set; }
    public string? Address1PostalCode { get; set; }
    public string? Address1Country { get; set; }
    public decimal? Revenue { get; set; }
    public int? NumberOfEmployees { get; set; }
    public int? IndustryCode { get; set; }
    public Guid? OwnerId { get; set; }
    public DateTime CreatedOn { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }
}

public class CreateAccountDto
{
    public Guid? Id { get; set; }  // Allow migration to preserve D365 GUIDs
    public string? Name { get; set; }
    public string? AccountNumber { get; set; }
    public string? Telephone1 { get; set; }
    public string? EmailAddress1 { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? Address1Line1 { get; set; }
    public string? Address1City { get; set; }
    public string? Address1StateOrProvince { get; set; }
    public string? Address1PostalCode { get; set; }
    public string? Address1Country { get; set; }
    public decimal? Revenue { get; set; }
    public int? NumberOfEmployees { get; set; }
    public int? IndustryCode { get; set; }
    public Guid? OwnerId { get; set; }
}

public class UpdateAccountDto
{
    public string? Name { get; set; }
    public string? AccountNumber { get; set; }
    public string? Telephone1 { get; set; }
    public string? EmailAddress1 { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? Address1Line1 { get; set; }
    public string? Address1City { get; set; }
    public string? Address1StateOrProvince { get; set; }
    public string? Address1PostalCode { get; set; }
    public string? Address1Country { get; set; }
    public decimal? Revenue { get; set; }
    public int? NumberOfEmployees { get; set; }
    public int? IndustryCode { get; set; }
    public Guid? OwnerId { get; set; }
}
