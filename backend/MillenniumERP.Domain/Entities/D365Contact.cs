using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities;

/// <summary>
/// D365 Contact entity (different from the legacy ERP Contact)
/// </summary>
[Table("d365_contacts")]
public class D365Contact
{
    [Key]
    [Column("contactid")]
    public Guid Id { get; set; }

    [Column("firstname")]
    [MaxLength(50)]
    public string? FirstName { get; set; }

    [Column("lastname")]
    [MaxLength(50)]
    public string? LastName { get; set; }

    [Column("middlename")]
    [MaxLength(50)]
    public string? MiddleName { get; set; }

    [Column("fullname")]
    [MaxLength(160)]
    public string? FullName { get; set; }

    [Column("salutation")]
    [MaxLength(20)]
    public string? Salutation { get; set; }

    [Column("emailaddress1")]
    [MaxLength(100)]
    public string? EmailAddress1 { get; set; }

    [Column("telephone1")]
    [MaxLength(50)]
    public string? Telephone1 { get; set; }

    [Column("telephone2")]
    [MaxLength(50)]
    public string? Telephone2 { get; set; }

    [Column("telephone3")]
    [MaxLength(50)]
    public string? Telephone3 { get; set; }

    [Column("mobilephone")]
    [MaxLength(50)]
    public string? MobilePhone { get; set; }

    [Column("fax")]
    [MaxLength(50)]
    public string? Fax { get; set; }

    [Column("jobtitle")]
    [MaxLength(100)]
    public string? JobTitle { get; set; }

    [Column("parentcustomerid")]
    public Guid? ParentCustomerId { get; set; }

    // Address Information
    [Column("address1_addresstypecode")]
    public int? Address1AddressTypeCode { get; set; }

    [Column("address1_name")]
    [MaxLength(200)]
    public string? Address1Name { get; set; }

    [Column("address1_line1")]
    [MaxLength(250)]
    public string? Address1Line1 { get; set; }

    [Column("address1_line2")]
    [MaxLength(250)]
    public string? Address1Line2 { get; set; }

    [Column("address1_line3")]
    [MaxLength(250)]
    public string? Address1Line3 { get; set; }

    [Column("address1_city")]
    [MaxLength(80)]
    public string? Address1City { get; set; }

    [Column("address1_stateorprovince")]
    [MaxLength(50)]
    public string? Address1StateOrProvince { get; set; }

    [Column("address1_postalcode")]
    [MaxLength(20)]
    public string? Address1PostalCode { get; set; }

    [Column("address1_country")]
    [MaxLength(80)]
    public string? Address1Country { get; set; }

    [Column("address1_telephone1")]
    [MaxLength(50)]
    public string? Address1Telephone1 { get; set; }

    [Column("description")]
    public string? Description { get; set; }

    // Professional Information
    [Column("department")]
    [MaxLength(100)]
    public string? Department { get; set; }

    [Column("managername")]
    [MaxLength(100)]
    public string? ManagerName { get; set; }

    [Column("managerphone")]
    [MaxLength(50)]
    public string? ManagerPhone { get; set; }

    [Column("role")]
    [MaxLength(100)]
    public string? Role { get; set; }

    [Column("assistantname")]
    [MaxLength(100)]
    public string? AssistantName { get; set; }

    [Column("assistantphone")]
    [MaxLength(50)]
    public string? AssistantPhone { get; set; }

    // Personal Information
    [Column("gendercode")]
    public int? GenderCode { get; set; }

    [Column("familystatuscode")]
    public int? FamilyStatusCode { get; set; }

    [Column("spousespartner")]
    [MaxLength(100)]
    public string? SpousesPartner { get; set; }

    [Column("birthdate")]
    public DateTime? BirthDate { get; set; }

    [Column("anniversary")]
    public DateTime? Anniversary { get; set; }

    [Column("createdon")]
    public DateTime CreatedOn { get; set; }

    [Column("modifiedon")]
    public DateTime? ModifiedOn { get; set; }

    [Column("CreatedBy")]
    [MaxLength(100)]
    public string? CreatedBy { get; set; }

    [Column("ModifiedBy")]
    [MaxLength(100)]
    public string? ModifiedBy { get; set; }

    // Navigation property
    [ForeignKey("ParentCustomerId")]
    public Account? ParentAccount { get; set; }
}
