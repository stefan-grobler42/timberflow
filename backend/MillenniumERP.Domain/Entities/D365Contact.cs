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

    [Column("fullname")]
    [MaxLength(160)]
    public string? FullName { get; set; }

    [Column("emailaddress1")]
    [MaxLength(100)]
    public string? EmailAddress1 { get; set; }

    [Column("telephone1")]
    [MaxLength(50)]
    public string? Telephone1 { get; set; }

    [Column("mobilephone")]
    [MaxLength(50)]
    public string? MobilePhone { get; set; }

    [Column("jobtitle")]
    [MaxLength(100)]
    public string? JobTitle { get; set; }

    [Column("parentcustomerid")]
    public Guid? ParentCustomerId { get; set; }

    [Column("address1_line1")]
    [MaxLength(250)]
    public string? Address1Line1 { get; set; }

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
