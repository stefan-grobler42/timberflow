namespace MillenniumERP.Application.DTOs.D365;

public class AccountDto
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? AccountNumber { get; set; }
    
    // D365 Custom Fields
    public int? Cr694CompanyType { get; set; }
    public string? Cr694CompanyRegistrationNumber { get; set; }
    public string? Cr694VatRegistrationNo { get; set; }
    public int? Cr694AccountType { get; set; }
    public Guid? Cr694SalesRepresentative { get; set; }
    
    // Contact Information
    public string? Telephone1 { get; set; }
    public string? Telephone2 { get; set; }
    public string? Telephone3 { get; set; }
    public string? Fax { get; set; }
    public string? EmailAddress1 { get; set; }
    public string? EmailAddress2 { get; set; }
    public string? EmailAddress3 { get; set; }
    public string? WebsiteUrl { get; set; }
    
    // Address Information
    public string? Address1Name { get; set; }
    public string? Address1Line1 { get; set; }
    public string? Address1Line2 { get; set; }
    public string? Address1Line3 { get; set; }
    public string? Address1City { get; set; }
    public string? Address1StateOrProvince { get; set; }
    public string? Address1PostalCode { get; set; }
    public string? Address1Country { get; set; }
    public string? Address1County { get; set; }
    public double? Address1Latitude { get; set; }
    public double? Address1Longitude { get; set; }
    
    // Relationships
    public Guid? ParentAccountId { get; set; }
    public Guid? PrimaryContactId { get; set; }
    
    // Financial
    public decimal? Revenue { get; set; }
    public decimal? CreditLimit { get; set; }
    public int? PaymentTermsCode { get; set; }
    
    // Other
    public int? NumberOfEmployees { get; set; }
    public int? IndustryCode { get; set; }
    public int? RelationshipTypeCode { get; set; }
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
    
    // D365 Custom Fields
    public int? Cr694CompanyType { get; set; }
    public string? Cr694CompanyRegistrationNumber { get; set; }
    public string? Cr694VatRegistrationNo { get; set; }
    public int? Cr694AccountType { get; set; }
    public Guid? Cr694SalesRepresentative { get; set; }
    
    // Contact Information
    public string? Telephone1 { get; set; }
    public string? Telephone2 { get; set; }
    public string? Telephone3 { get; set; }
    public string? Fax { get; set; }
    public string? EmailAddress1 { get; set; }
    public string? EmailAddress2 { get; set; }
    public string? EmailAddress3 { get; set; }
    public string? WebsiteUrl { get; set; }
    
    // Address Information
    public string? Address1Name { get; set; }
    public string? Address1Line1 { get; set; }
    public string? Address1Line2 { get; set; }
    public string? Address1Line3 { get; set; }
    public string? Address1City { get; set; }
    public string? Address1StateOrProvince { get; set; }
    public string? Address1PostalCode { get; set; }
    public string? Address1Country { get; set; }
    public string? Address1County { get; set; }
    public double? Address1Latitude { get; set; }
    public double? Address1Longitude { get; set; }
    
    // Relationships
    public Guid? ParentAccountId { get; set; }
    public Guid? PrimaryContactId { get; set; }
    
    // Financial
    public decimal? Revenue { get; set; }
    public decimal? CreditLimit { get; set; }
    public int? PaymentTermsCode { get; set; }
    
    // Other
    public int? NumberOfEmployees { get; set; }
    public int? IndustryCode { get; set; }
    public int? RelationshipTypeCode { get; set; }
    public Guid? OwnerId { get; set; }
}

public class UpdateAccountDto
{
    public string? Name { get; set; }
    public string? AccountNumber { get; set; }
    
    // D365 Custom Fields
    public int? Cr694CompanyType { get; set; }
    public string? Cr694CompanyRegistrationNumber { get; set; }
    public string? Cr694VatRegistrationNo { get; set; }
    public int? Cr694AccountType { get; set; }
    public Guid? Cr694SalesRepresentative { get; set; }
    
    // Contact Information
    public string? Telephone1 { get; set; }
    public string? Telephone2 { get; set; }
    public string? Telephone3 { get; set; }
    public string? Fax { get; set; }
    public string? EmailAddress1 { get; set; }
    public string? EmailAddress2 { get; set; }
    public string? EmailAddress3 { get; set; }
    public string? WebsiteUrl { get; set; }
    
    // Address Information
    public string? Address1Name { get; set; }
    public string? Address1Line1 { get; set; }
    public string? Address1Line2 { get; set; }
    public string? Address1Line3 { get; set; }
    public string? Address1City { get; set; }
    public string? Address1StateOrProvince { get; set; }
    public string? Address1PostalCode { get; set; }
    public string? Address1Country { get; set; }
    public string? Address1County { get; set; }
    public double? Address1Latitude { get; set; }
    public double? Address1Longitude { get; set; }
    
    // Relationships
    public Guid? ParentAccountId { get; set; }
    public Guid? PrimaryContactId { get; set; }
    
    // Financial
    public decimal? Revenue { get; set; }
    public decimal? CreditLimit { get; set; }
    public int? PaymentTermsCode { get; set; }
    
    // Other
    public int? NumberOfEmployees { get; set; }
    public int? IndustryCode { get; set; }
    public int? RelationshipTypeCode { get; set; }
    public Guid? OwnerId { get; set; }
}
