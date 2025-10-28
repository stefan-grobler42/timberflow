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

    // Billing Address
    public string? BillTo_Name { get; set; }
    public string? BillTo_Line1 { get; set; }
    public string? BillTo_City { get; set; }
    public string? BillTo_StateOrProvince { get; set; }
    public string? BillTo_PostalCode { get; set; }
    public string? BillTo_Country { get; set; }
    public string? BillTo_Telephone { get; set; }
    public double? BillTo_Latitude { get; set; }
    public double? BillTo_Longitude { get; set; }

    // Shipping Address
    public string? ShipTo_Name { get; set; }
    public string? ShipTo_Line1 { get; set; }
    public string? ShipTo_City { get; set; }
    public string? ShipTo_StateOrProvince { get; set; }
    public string? ShipTo_PostalCode { get; set; }
    public string? ShipTo_Country { get; set; }
    public string? ShipTo_Telephone { get; set; }
    public double? ShipTo_Latitude { get; set; }
    public double? ShipTo_Longitude { get; set; }

    // Financial Fields
    public decimal? TotalTax { get; set; }
    public decimal? TotalAmountLessFreight { get; set; }
    public decimal? FreightAmount { get; set; }
    public decimal? DiscountPercentage { get; set; }

    // Date Fields
    public DateTime? ExpiresOn { get; set; }
    public DateTime? ClosedOn { get; set; }
    public DateTime? RequestDeliveryBy { get; set; }

    // Reference Fields
    public Guid? OpportunityId { get; set; }
    public Guid? PriceLevelId { get; set; }
    public Guid? TransactionCurrencyId { get; set; }

    // Contact Information
    public string? ContactName { get; set; }
    public string? ContactTelephone { get; set; }
    public string? ContactEmail { get; set; }

    // Line Items
    public List<D365QuoteDetailDto>? QuoteDetails { get; set; }
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

    // Billing Address
    public string? BillTo_Name { get; set; }
    public string? BillTo_Line1 { get; set; }
    public string? BillTo_City { get; set; }
    public string? BillTo_StateOrProvince { get; set; }
    public string? BillTo_PostalCode { get; set; }
    public string? BillTo_Country { get; set; }
    public string? BillTo_Telephone { get; set; }
    public double? BillTo_Latitude { get; set; }
    public double? BillTo_Longitude { get; set; }

    // Shipping Address
    public string? ShipTo_Name { get; set; }
    public string? ShipTo_Line1 { get; set; }
    public string? ShipTo_City { get; set; }
    public string? ShipTo_StateOrProvince { get; set; }
    public string? ShipTo_PostalCode { get; set; }
    public string? ShipTo_Country { get; set; }
    public string? ShipTo_Telephone { get; set; }
    public double? ShipTo_Latitude { get; set; }
    public double? ShipTo_Longitude { get; set; }

    // Financial Fields
    public decimal? TotalTax { get; set; }
    public decimal? TotalAmountLessFreight { get; set; }
    public decimal? FreightAmount { get; set; }
    public decimal? DiscountPercentage { get; set; }

    // Date Fields
    public DateTime? ExpiresOn { get; set; }
    public DateTime? ClosedOn { get; set; }
    public DateTime? RequestDeliveryBy { get; set; }

    // Reference Fields
    public Guid? OpportunityId { get; set; }
    public Guid? PriceLevelId { get; set; }
    public Guid? TransactionCurrencyId { get; set; }

    // Contact Information
    public string? ContactName { get; set; }
    public string? ContactTelephone { get; set; }
    public string? ContactEmail { get; set; }
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

    // Billing Address
    public string? BillTo_Name { get; set; }
    public string? BillTo_Line1 { get; set; }
    public string? BillTo_City { get; set; }
    public string? BillTo_StateOrProvince { get; set; }
    public string? BillTo_PostalCode { get; set; }
    public string? BillTo_Country { get; set; }
    public string? BillTo_Telephone { get; set; }
    public double? BillTo_Latitude { get; set; }
    public double? BillTo_Longitude { get; set; }

    // Shipping Address
    public string? ShipTo_Name { get; set; }
    public string? ShipTo_Line1 { get; set; }
    public string? ShipTo_City { get; set; }
    public string? ShipTo_StateOrProvince { get; set; }
    public string? ShipTo_PostalCode { get; set; }
    public string? ShipTo_Country { get; set; }
    public string? ShipTo_Telephone { get; set; }
    public double? ShipTo_Latitude { get; set; }
    public double? ShipTo_Longitude { get; set; }

    // Financial Fields
    public decimal? TotalTax { get; set; }
    public decimal? TotalAmountLessFreight { get; set; }
    public decimal? FreightAmount { get; set; }
    public decimal? DiscountPercentage { get; set; }

    // Date Fields
    public DateTime? ExpiresOn { get; set; }
    public DateTime? ClosedOn { get; set; }
    public DateTime? RequestDeliveryBy { get; set; }

    // Reference Fields
    public Guid? OpportunityId { get; set; }
    public Guid? PriceLevelId { get; set; }
    public Guid? TransactionCurrencyId { get; set; }

    // Contact Information
    public string? ContactName { get; set; }
    public string? ContactTelephone { get; set; }
    public string? ContactEmail { get; set; }
}
