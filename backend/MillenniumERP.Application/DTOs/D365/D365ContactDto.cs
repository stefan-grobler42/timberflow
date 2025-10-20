namespace MillenniumERP.Application.DTOs.D365;

public class D365ContactDto
{
    public Guid Id { get; set; }
    public string? Salutation { get; set; }
    public string? FirstName { get; set; }
    public string? MiddleName { get; set; }
    public string? LastName { get; set; }
    public string? FullName { get; set; }
    public string? EmailAddress1 { get; set; }
    public string? Telephone1 { get; set; }
    public string? Telephone2 { get; set; }
    public string? Telephone3 { get; set; }
    public string? MobilePhone { get; set; }
    public string? Fax { get; set; }
    public string? JobTitle { get; set; }
    public Guid? ParentCustomerId { get; set; }
    
    // Address Information
    public int? Address1AddressTypeCode { get; set; }
    public string? Address1Name { get; set; }
    public string? Address1Line1 { get; set; }
    public string? Address1Line2 { get; set; }
    public string? Address1Line3 { get; set; }
    public string? Address1City { get; set; }
    public string? Address1StateOrProvince { get; set; }
    public string? Address1PostalCode { get; set; }
    public string? Address1Country { get; set; }
    public string? Address1Telephone1 { get; set; }
    public string? Description { get; set; }
    
    // Professional Information
    public string? Department { get; set; }
    public string? ManagerName { get; set; }
    public string? ManagerPhone { get; set; }
    public string? Role { get; set; }
    public string? AssistantName { get; set; }
    public string? AssistantPhone { get; set; }
    
    // Personal Information
    public int? GenderCode { get; set; }
    public int? FamilyStatusCode { get; set; }
    public string? SpousesPartner { get; set; }
    public DateTime? BirthDate { get; set; }
    public DateTime? Anniversary { get; set; }
    
    public DateTime CreatedOn { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }
}

public class CreateD365ContactDto
{
    public string? Salutation { get; set; }
    public string? FirstName { get; set; }
    public string? MiddleName { get; set; }
    public string? LastName { get; set; }
    public string? EmailAddress1 { get; set; }
    public string? Telephone1 { get; set; }
    public string? Telephone2 { get; set; }
    public string? Telephone3 { get; set; }
    public string? MobilePhone { get; set; }
    public string? Fax { get; set; }
    public string? JobTitle { get; set; }
    public Guid? ParentCustomerId { get; set; }
    
    // Address Information
    public int? Address1AddressTypeCode { get; set; }
    public string? Address1Name { get; set; }
    public string? Address1Line1 { get; set; }
    public string? Address1Line2 { get; set; }
    public string? Address1Line3 { get; set; }
    public string? Address1City { get; set; }
    public string? Address1StateOrProvince { get; set; }
    public string? Address1PostalCode { get; set; }
    public string? Address1Country { get; set; }
    public string? Address1Telephone1 { get; set; }
    public string? Description { get; set; }
    
    // Professional Information
    public string? Department { get; set; }
    public string? ManagerName { get; set; }
    public string? ManagerPhone { get; set; }
    public string? Role { get; set; }
    public string? AssistantName { get; set; }
    public string? AssistantPhone { get; set; }
    
    // Personal Information
    public int? GenderCode { get; set; }
    public int? FamilyStatusCode { get; set; }
    public string? SpousesPartner { get; set; }
    public DateTime? BirthDate { get; set; }
    public DateTime? Anniversary { get; set; }
}

public class UpdateD365ContactDto
{
    public string? Salutation { get; set; }
    public string? FirstName { get; set; }
    public string? MiddleName { get; set; }
    public string? LastName { get; set; }
    public string? EmailAddress1 { get; set; }
    public string? Telephone1 { get; set; }
    public string? Telephone2 { get; set; }
    public string? Telephone3 { get; set; }
    public string? MobilePhone { get; set; }
    public string? Fax { get; set; }
    public string? JobTitle { get; set; }
    public Guid? ParentCustomerId { get; set; }
    
    // Address Information
    public int? Address1AddressTypeCode { get; set; }
    public string? Address1Name { get; set; }
    public string? Address1Line1 { get; set; }
    public string? Address1Line2 { get; set; }
    public string? Address1Line3 { get; set; }
    public string? Address1City { get; set; }
    public string? Address1StateOrProvince { get; set; }
    public string? Address1PostalCode { get; set; }
    public string? Address1Country { get; set; }
    public string? Address1Telephone1 { get; set; }
    public string? Description { get; set; }
    
    // Professional Information
    public string? Department { get; set; }
    public string? ManagerName { get; set; }
    public string? ManagerPhone { get; set; }
    public string? Role { get; set; }
    public string? AssistantName { get; set; }
    public string? AssistantPhone { get; set; }
    
    // Personal Information
    public int? GenderCode { get; set; }
    public int? FamilyStatusCode { get; set; }
    public string? SpousesPartner { get; set; }
    public DateTime? BirthDate { get; set; }
    public DateTime? Anniversary { get; set; }
}
