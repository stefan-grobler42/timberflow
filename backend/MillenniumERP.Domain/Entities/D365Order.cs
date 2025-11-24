using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities;

[Table("d365_salesorders")]
public class D365Order
{
    [Key]
    [Column("salesorderid")]
    public Guid Id { get; set; }

    [Column("ordernumber")]
    [MaxLength(100)]
    public string? OrderNumber { get; set; }

    [Column("name")]
    [MaxLength(300)]
    public string? Name { get; set; }

    [Column("customerid")]
    public Guid? CustomerId { get; set; }

    [Column("quoteid")]
    public Guid? QuoteId { get; set; }

    [Column("datefulfilled")]
    public DateTime? DateFulfilled { get; set; }

    [Column("requestdeliveryby")]
    public DateTime? RequestDeliveryBy { get; set; }

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

    // Navigation properties
    [ForeignKey("CustomerId")]
    public Account? Customer { get; set; }

    [ForeignKey("QuoteId")]
    public D365Quote? Quote { get; set; }

    // Reverse navigation: Productions linked to this order
    public ICollection<Production> Productions { get; set; } = new List<Production>();

    // Reverse navigation: Deliveries linked to this order
    public ICollection<Delivery> Deliveries { get; set; } = new List<Delivery>();
}
