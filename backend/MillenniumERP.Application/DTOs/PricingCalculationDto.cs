namespace MillenniumERP.Application.DTOs;

public class PricingCalculationDto
{
    public Guid Id { get; set; }
    public string? ProductName { get; set; }
    public string? Test { get; set; }
    public decimal? Discount { get; set; }
    public decimal? InstalledCost { get; set; }
    public decimal? InstalledCostBase { get; set; }
    public int? Quantity { get; set; }
    public decimal? TotalPrice { get; set; }
    public decimal? TotalPriceBase { get; set; }
    public decimal? UnitPrice { get; set; }
    public decimal? UnitPriceBase { get; set; }
    public decimal? ExchangeRate { get; set; }
    public Guid? TransactionCurrencyId { get; set; }
    public DateTime? CreatedOn { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public Guid? ModifiedBy { get; set; }
}

public class CreatePricingCalculationDto
{
    public string? ProductName { get; set; }
    public string? Test { get; set; }
    public decimal? Discount { get; set; }
    public decimal? InstalledCost { get; set; }
    public int? Quantity { get; set; }
    public decimal? TotalPrice { get; set; }
    public decimal? UnitPrice { get; set; }
}

public class UpdatePricingCalculationDto
{
    public string? ProductName { get; set; }
    public string? Test { get; set; }
    public decimal? Discount { get; set; }
    public decimal? InstalledCost { get; set; }
    public int? Quantity { get; set; }
    public decimal? TotalPrice { get; set; }
    public decimal? UnitPrice { get; set; }
}
