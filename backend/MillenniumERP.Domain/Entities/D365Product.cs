using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities;

[Table("d365_products")]
public class D365Product
{
    [Key]
    [Column("productid")]
    public Guid Id { get; set; }

    [Column("productnumber")]
    [MaxLength(100)]
    public string? ProductNumber { get; set; }

    [Column("name")]
    [MaxLength(100)]
    public string? Name { get; set; }

    [Column("description")]
    public string? Description { get; set; }

    [Column("productstructure")]
    public int? ProductStructure { get; set; }

    [Column("producttypecode")]
    public int? ProductTypeCode { get; set; }

    [Column("quantityonhand")]
    public decimal? QuantityOnHand { get; set; }

    [Column("quantitydecimal")]
    public decimal? QuantityDecimal { get; set; }

    [Column("stockweight")]
    public decimal? StockWeight { get; set; }

    [Column("stockvolume")]
    public decimal? StockVolume { get; set; }

    [Column("price")]
    public decimal? Price { get; set; }

    [Column("currentcost")]
    public decimal? CurrentCost { get; set; }

    [Column("standardcost")]
    public decimal? StandardCost { get; set; }

    [Column("vendorid")]
    [MaxLength(100)]
    public string? VendorId { get; set; }

    [Column("vendorname")]
    [MaxLength(100)]
    public string? VendorName { get; set; }

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
