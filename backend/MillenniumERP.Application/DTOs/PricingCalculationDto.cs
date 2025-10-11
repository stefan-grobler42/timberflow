namespace MillenniumERP.Application.DTOs;

public class PricingCalculationDto
{
    public Guid Id { get; set; }
    public string? Productname { get; set; }
    public string? Test { get; set; }
    public decimal? Discount { get; set; }
    public decimal? Installedcost { get; set; }
    public decimal? InstalledcostBase { get; set; }
    public int? Quantity { get; set; }
    public decimal? Totalprice { get; set; }
    public decimal? TotalpriceBase { get; set; }
    public decimal? Unitprice { get; set; }
    public decimal? UnitpriceBase { get; set; }
    public decimal? Exchangerate { get; set; }
    public Guid? Transactioncurrencyid { get; set; }
    public DateTime? CreatedOn { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public Guid? ModifiedBy { get; set; }
}

public class CreatePricingCalculationDto
{
    public string? Productname { get; set; }
    public string? Test { get; set; }
    public decimal? Discount { get; set; }
    public decimal? Installedcost { get; set; }
    public int? Quantity { get; set; }
    public decimal? Totalprice { get; set; }
    public decimal? Unitprice { get; set; }
}

public class UpdatePricingCalculationDto
{
    public string? Productname { get; set; }
    public string? Test { get; set; }
    public decimal? Discount { get; set; }
    public decimal? Installedcost { get; set; }
    public int? Quantity { get; set; }
    public decimal? Totalprice { get; set; }
    public decimal? Unitprice { get; set; }
}
