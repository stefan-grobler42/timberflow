using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities;

[Table("d365_quotedetails")]
public class D365QuoteDetail
{
    [Key]
    [Column("quotedetailid")]
    public Guid Id { get; set; }

    [Column("quoteid")]
    public Guid QuoteId { get; set; }

    [Column("productid")]
    public Guid? ProductId { get; set; }

    [Column("productname")]
    [MaxLength(200)]
    public string? ProductName { get; set; }

    [Column("description")]
    public string? Description { get; set; }

    [Column("quantity")]
    public decimal? Quantity { get; set; }

    [Column("priceperunit")]
    public decimal? PricePerUnit { get; set; }

    [Column("manualdiscountamount")]
    public decimal? ManualDiscountAmount { get; set; }

    [Column("tax")]
    public decimal? Tax { get; set; }

    [Column("baseamount")]
    public decimal? BaseAmount { get; set; }

    [Column("extendedamount")]
    public decimal? ExtendedAmount { get; set; }

    [Column("lineitemnumber")]
    public int? LineItemNumber { get; set; }

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
    [ForeignKey("QuoteId")]
    public D365Quote? Quote { get; set; }
}
