namespace MillenniumERP.Application.DTOs.D365;

public class D365ContactDto
{
    public Guid Id { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? FullName { get; set; }
    public string? EmailAddress1 { get; set; }
    public string? Telephone1 { get; set; }
    public string? MobilePhone { get; set; }
    public string? JobTitle { get; set; }
    public Guid? ParentCustomerId { get; set; }
    public string? Address1Line1 { get; set; }
    public string? Address1City { get; set; }
    public string? Address1StateOrProvince { get; set; }
    public string? Address1PostalCode { get; set; }
    public string? Address1Country { get; set; }
    public DateTime CreatedOn { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }
}

public class CreateD365ContactDto
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? EmailAddress1 { get; set; }
    public string? Telephone1 { get; set; }
    public string? MobilePhone { get; set; }
    public string? JobTitle { get; set; }
    public Guid? ParentCustomerId { get; set; }
    public string? Address1Line1 { get; set; }
    public string? Address1City { get; set; }
    public string? Address1StateOrProvince { get; set; }
    public string? Address1PostalCode { get; set; }
    public string? Address1Country { get; set; }
}

public class UpdateD365ContactDto
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? EmailAddress1 { get; set; }
    public string? Telephone1 { get; set; }
    public string? MobilePhone { get; set; }
    public string? JobTitle { get; set; }
    public Guid? ParentCustomerId { get; set; }
    public string? Address1Line1 { get; set; }
    public string? Address1City { get; set; }
    public string? Address1StateOrProvince { get; set; }
    public string? Address1PostalCode { get; set; }
    public string? Address1Country { get; set; }
}
