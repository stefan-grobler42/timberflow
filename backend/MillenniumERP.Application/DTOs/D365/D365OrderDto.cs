namespace MillenniumERP.Application.DTOs.D365;

public class D365OrderDto
{
    public Guid Id { get; set; }
    public string? OrderNumber { get; set; }
    public string? Name { get; set; }
    public Guid? CustomerId { get; set; }
    public Guid? QuoteId { get; set; }
    public DateTime? DateFulfilled { get; set; }
    public DateTime? RequestDeliveryBy { get; set; }
    public decimal? TotalAmount { get; set; }
    public decimal? TotalDiscountAmount { get; set; }
    public decimal? TotalLineItemAmount { get; set; }
    public int? StateCode { get; set; }
    public int? StatusCode { get; set; }
    public string? Description { get; set; }
    public Guid? OwnerId { get; set; }
    public bool? ProductionRequired { get; set; }
    public DateTime CreatedOn { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }
}

public class CreateD365OrderDto
{
    public Guid? Id { get; set; }
    public string? OrderNumber { get; set; }
    public string? Name { get; set; }
    public Guid? CustomerId { get; set; }
    public Guid? QuoteId { get; set; }
    public DateTime? RequestDeliveryBy { get; set; }
    public decimal? TotalAmount { get; set; }
    public string? Description { get; set; }
    public Guid? OwnerId { get; set; }
}

public class UpdateD365OrderDto
{
    public string? OrderNumber { get; set; }
    public string? Name { get; set; }
    public Guid? CustomerId { get; set; }
    public Guid? QuoteId { get; set; }
    public DateTime? DateFulfilled { get; set; }
    public DateTime? RequestDeliveryBy { get; set; }
    public decimal? TotalAmount { get; set; }
    public int? StateCode { get; set; }
    public int? StatusCode { get; set; }
    public string? Description { get; set; }
    public bool? ProductionRequired { get; set; }
}
