namespace MillenniumERP.Application.DTOs.D365;

public class D365QuoteDto
{
    public Guid Id { get; set; }
    public string? QuoteNumber { get; set; }
    public string? Name { get; set; }
    public Guid? CustomerId { get; set; }
    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public decimal? TotalAmount { get; set; }
    public decimal? TotalDiscountAmount { get; set; }
    public decimal? TotalLineItemAmount { get; set; }
    public int? StateCode { get; set; }
    public int? StatusCode { get; set; }
    public string? Description { get; set; }
    public Guid? OwnerId { get; set; }
    public DateTime CreatedOn { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }
}

public class CreateD365QuoteDto
{
    public string? QuoteNumber { get; set; }
    public string? Name { get; set; }
    public Guid? CustomerId { get; set; }
    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public decimal? TotalAmount { get; set; }
    public string? Description { get; set; }
    public Guid? OwnerId { get; set; }
}

public class UpdateD365QuoteDto
{
    public string? QuoteNumber { get; set; }
    public string? Name { get; set; }
    public Guid? CustomerId { get; set; }
    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public decimal? TotalAmount { get; set; }
    public int? StateCode { get; set; }
    public int? StatusCode { get; set; }
    public string? Description { get; set; }
}
