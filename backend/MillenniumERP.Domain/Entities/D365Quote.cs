using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities;

[Table("d365_quotes")]
public class D365Quote
{
    [Key]
    [Column("quoteid")]
    public Guid Id { get; set; }

    [Column("quotenumber")]
    [MaxLength(100)]
    public string? QuoteNumber { get; set; }

    [Column("name")]
    [MaxLength(300)]
    public string? Name { get; set; }

    [Column("customerid")]
    public Guid? CustomerId { get; set; }

    [Column("effectivefrom")]
    public DateTime? EffectiveFrom { get; set; }

    [Column("effectiveto")]
    public DateTime? EffectiveTo { get; set; }

    [Column("totalamount")]
    public decimal? TotalAmount { get; set; }

    [Column("totaldiscountamount")]
    public decimal? TotalDiscountAmount { get; set; }

    [Column("totallineitemamount")]
    public decimal? TotalLineItemAmount { get; set; }

    [Column("statecode")]
    public int? StateCode { get; set; }

    [Column("statuscode")]
    public int? StatusCode { get; set; }

    [Column("description")]
    public string? Description { get; set; }

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

    // Navigation property
    [ForeignKey("CustomerId")]
    public Account? Customer { get; set; }
}
