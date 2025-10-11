namespace MillenniumERP.Application.DTOs.D365;

public class D365ProductDto
{
    public Guid Id { get; set; }
    public string? ProductNumber { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public int? ProductStructure { get; set; }
    public int? ProductTypeCode { get; set; }
    public decimal? QuantityOnHand { get; set; }
    public decimal? QuantityDecimal { get; set; }
    public decimal? StockWeight { get; set; }
    public decimal? StockVolume { get; set; }
    public decimal? Price { get; set; }
    public decimal? CurrentCost { get; set; }
    public decimal? StandardCost { get; set; }
    public string? VendorId { get; set; }
    public string? VendorName { get; set; }
    public DateTime CreatedOn { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }
}

public class CreateD365ProductDto
{
    public string? ProductNumber { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public int? ProductStructure { get; set; }
    public int? ProductTypeCode { get; set; }
    public decimal? QuantityOnHand { get; set; }
    public decimal? Price { get; set; }
    public decimal? CurrentCost { get; set; }
    public decimal? StandardCost { get; set; }
    public string? VendorId { get; set; }
    public string? VendorName { get; set; }
}

public class UpdateD365ProductDto
{
    public string? ProductNumber { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public int? ProductStructure { get; set; }
    public int? ProductTypeCode { get; set; }
    public decimal? QuantityOnHand { get; set; }
    public decimal? Price { get; set; }
    public decimal? CurrentCost { get; set; }
    public decimal? StandardCost { get; set; }
    public string? VendorId { get; set; }
    public string? VendorName { get; set; }
}
