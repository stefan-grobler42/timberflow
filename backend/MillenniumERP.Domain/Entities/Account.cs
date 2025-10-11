using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities;

[Table("accounts")]
public class Account
{
    [Key]
    [Column("accountid")]
    public Guid Id { get; set; }

    [Column("name")]
    [MaxLength(160)]
    public string? Name { get; set; }

    [Column("accountnumber")]
    [MaxLength(20)]
    public string? AccountNumber { get; set; }

    [Column("telephone1")]
    [MaxLength(50)]
    public string? Telephone1 { get; set; }

    [Column("emailaddress1")]
    [MaxLength(100)]
    public string? EmailAddress1 { get; set; }

    [Column("websiteurl")]
    [MaxLength(200)]
    public string? WebsiteUrl { get; set; }

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

    [Column("revenue")]
    public decimal? Revenue { get; set; }

    [Column("numberofemployees")]
    public int? NumberOfEmployees { get; set; }

    [Column("industrycode")]
    public int? IndustryCode { get; set; }

    [Column("ownerid")]
    public Guid? OwnerId { get; set; }

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
}
