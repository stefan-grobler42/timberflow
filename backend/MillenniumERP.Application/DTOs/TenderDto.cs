namespace MillenniumERP.Application.DTOs;

public class TenderDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? FileLink { get; set; }
    public string? StreetAddress { get; set; }
    public DateTime? ClosingDate { get; set; }
    public decimal? DistanceToSite { get; set; }
    public Guid? Contact { get; set; }
    public Guid? Customer { get; set; }
    public Guid? QuoteNo { get; set; }
    public bool? RoofCoveringSheeting { get; set; }
    public bool? RoofCoveringTiles { get; set; }
    public bool? TimberStructure { get; set; }
    public decimal? TotalValueExcl { get; set; }
    public decimal? TotalValueExclBase { get; set; }
    public decimal? ExchangeRate { get; set; }
    public Guid? NewDesigner { get; set; }
    public string? NewNotes { get; set; }
    public bool? NewPricingSubmitted { get; set; }
    public DateTime? NewSubmissionDate { get; set; }
    public int? NewTenderStatus { get; set; }
    public Guid? TransactionCurrencyId { get; set; }
    public DateTime? CreatedOn { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public Guid? ModifiedBy { get; set; }
}

public class CreateTenderDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? FileLink { get; set; }
    public string? StreetAddress { get; set; }
    public DateTime? ClosingDate { get; set; }
    public decimal? DistanceToSite { get; set; }
    public Guid? Contact { get; set; }
    public Guid? Customer { get; set; }
    public Guid? QuoteNo { get; set; }
    public bool? RoofCoveringSheeting { get; set; }
    public bool? RoofCoveringTiles { get; set; }
    public bool? TimberStructure { get; set; }
    public decimal? TotalValueExcl { get; set; }
    public Guid? NewDesigner { get; set; }
    public string? NewNotes { get; set; }
    public bool? NewPricingSubmitted { get; set; }
    public DateTime? NewSubmissionDate { get; set; }
    public int? NewTenderStatus { get; set; }
}

public class UpdateTenderDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? FileLink { get; set; }
    public string? StreetAddress { get; set; }
    public DateTime? ClosingDate { get; set; }
    public decimal? DistanceToSite { get; set; }
    public Guid? Contact { get; set; }
    public Guid? Customer { get; set; }
    public Guid? QuoteNo { get; set; }
    public bool? RoofCoveringSheeting { get; set; }
    public bool? RoofCoveringTiles { get; set; }
    public bool? TimberStructure { get; set; }
    public decimal? TotalValueExcl { get; set; }
    public Guid? NewDesigner { get; set; }
    public string? NewNotes { get; set; }
    public bool? NewPricingSubmitted { get; set; }
    public DateTime? NewSubmissionDate { get; set; }
    public int? NewTenderStatus { get; set; }
}
