namespace MillenniumERP.Application.DTOs.D365;

public class D365QuoteDetailDto
{
    public Guid Id { get; set; }
    public Guid QuoteId { get; set; }
    public Guid? ProductId { get; set; }
    public string? ProductName { get; set; }
    public string? Description { get; set; }
    public decimal? Quantity { get; set; }
    public decimal? PricePerUnit { get; set; }
    public decimal? ManualDiscountAmount { get; set; }
    public decimal? Tax { get; set; }
    public decimal? BaseAmount { get; set; }
    public decimal? ExtendedAmount { get; set; }
    public int? LineItemNumber { get; set; }
    public DateTime CreatedOn { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }
}

public class CreateD365QuoteDetailDto
{
    public Guid QuoteId { get; set; }
    public Guid? ProductId { get; set; }
    public string? ProductName { get; set; }
    public string? Description { get; set; }
    public decimal? Quantity { get; set; }
    public decimal? PricePerUnit { get; set; }
    public decimal? ManualDiscountAmount { get; set; }
    public decimal? Tax { get; set; }
    public decimal? BaseAmount { get; set; }
    public decimal? ExtendedAmount { get; set; }
    public int? LineItemNumber { get; set; }
}

public class UpdateD365QuoteDetailDto
{
    public Guid? ProductId { get; set; }
    public string? ProductName { get; set; }
    public string? Description { get; set; }
    public decimal? Quantity { get; set; }
    public decimal? PricePerUnit { get; set; }
    public decimal? ManualDiscountAmount { get; set; }
    public decimal? Tax { get; set; }
    public decimal? BaseAmount { get; set; }
    public decimal? ExtendedAmount { get; set; }
    public int? LineItemNumber { get; set; }
}
