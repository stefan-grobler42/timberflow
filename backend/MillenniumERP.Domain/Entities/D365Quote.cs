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

    // Billing Address
    [Column("billto_name")]
    [MaxLength(200)]
    public string? BillTo_Name { get; set; }

    [Column("billto_line1")]
    [MaxLength(250)]
    public string? BillTo_Line1 { get; set; }

    [Column("billto_city")]
    [MaxLength(80)]
    public string? BillTo_City { get; set; }

    [Column("billto_stateorprovince")]
    [MaxLength(50)]
    public string? BillTo_StateOrProvince { get; set; }

    [Column("billto_postalcode")]
    [MaxLength(20)]
    public string? BillTo_PostalCode { get; set; }

    [Column("billto_country")]
    [MaxLength(80)]
    public string? BillTo_Country { get; set; }

    [Column("billto_telephone")]
    [MaxLength(50)]
    public string? BillTo_Telephone { get; set; }

    [Column("billto_latitude")]
    public double? BillTo_Latitude { get; set; }

    [Column("billto_longitude")]
    public double? BillTo_Longitude { get; set; }

    // Shipping Address
    [Column("shipto_name")]
    [MaxLength(200)]
    public string? ShipTo_Name { get; set; }

    [Column("shipto_line1")]
    [MaxLength(250)]
    public string? ShipTo_Line1 { get; set; }

    [Column("shipto_city")]
    [MaxLength(80)]
    public string? ShipTo_City { get; set; }

    [Column("shipto_stateorprovince")]
    [MaxLength(50)]
    public string? ShipTo_StateOrProvince { get; set; }

    [Column("shipto_postalcode")]
    [MaxLength(20)]
    public string? ShipTo_PostalCode { get; set; }

    [Column("shipto_country")]
    [MaxLength(80)]
    public string? ShipTo_Country { get; set; }

    [Column("shipto_telephone")]
    [MaxLength(50)]
    public string? ShipTo_Telephone { get; set; }

    [Column("shipto_latitude")]
    public double? ShipTo_Latitude { get; set; }

    [Column("shipto_longitude")]
    public double? ShipTo_Longitude { get; set; }

    // Financial Fields
    [Column("totaltax")]
    public decimal? TotalTax { get; set; }

    [Column("totalamountlessfreight")]
    public decimal? TotalAmountLessFreight { get; set; }

    [Column("freightamount")]
    public decimal? FreightAmount { get; set; }

    [Column("discountpercentage")]
    public decimal? DiscountPercentage { get; set; }

    // Date Fields
    [Column("expireson")]
    public DateTime? ExpiresOn { get; set; }

    [Column("closedon")]
    public DateTime? ClosedOn { get; set; }

    [Column("requestdeliveryby")]
    public DateTime? RequestDeliveryBy { get; set; }

    // Reference Fields (Lookups)
    [Column("opportunityid")]
    public Guid? OpportunityId { get; set; }

    [Column("pricelevelid")]
    public Guid? PriceLevelId { get; set; }

    [Column("transactioncurrencyid")]
    public Guid? TransactionCurrencyId { get; set; }

    // Contact Information
    [Column("contactname")]
    [MaxLength(160)]
    public string? ContactName { get; set; }

    [Column("contacttelephone")]
    [MaxLength(50)]
    public string? ContactTelephone { get; set; }

    [Column("contactemail")]
    [MaxLength(100)]
    public string? ContactEmail { get; set; }

    // Navigation properties
    [ForeignKey("CustomerId")]
    public Account? Customer { get; set; }

    public ICollection<D365QuoteDetail>? QuoteDetails { get; set; }
}
