namespace MillenniumERP.Application.DTOs;

public class TenderDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Filelink { get; set; }
    public string? Streetaddress { get; set; }
    public DateTime? Closingdate { get; set; }
    public decimal? Distancetosite { get; set; }
    public Guid? Contact { get; set; }
    public Guid? Customer { get; set; }
    public Guid? Quoteno { get; set; }
    public bool? Roofcoveringsheeting { get; set; }
    public bool? Roofcoveringtiles { get; set; }
    public bool? Timberstructure { get; set; }
    public decimal? Totalvalueexcl { get; set; }
    public decimal? TotalvalueexclBase { get; set; }
    public decimal? Exchangerate { get; set; }
    public Guid? NewDesigner { get; set; }
    public string? NewNotes { get; set; }
    public bool? NewPricingsubmitted { get; set; }
    public DateTime? NewSubmissiondate { get; set; }
    public int? NewTenderstatus { get; set; }
    public Guid? Transactioncurrencyid { get; set; }
    public DateTime? CreatedOn { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public Guid? ModifiedBy { get; set; }
}

public class CreateTenderDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Filelink { get; set; }
    public string? Streetaddress { get; set; }
    public DateTime? Closingdate { get; set; }
    public decimal? Distancetosite { get; set; }
    public Guid? Contact { get; set; }
    public Guid? Customer { get; set; }
    public Guid? Quoteno { get; set; }
    public bool? Roofcoveringsheeting { get; set; }
    public bool? Roofcoveringtiles { get; set; }
    public bool? Timberstructure { get; set; }
    public decimal? Totalvalueexcl { get; set; }
    public Guid? NewDesigner { get; set; }
    public string? NewNotes { get; set; }
    public bool? NewPricingsubmitted { get; set; }
    public DateTime? NewSubmissiondate { get; set; }
    public int? NewTenderstatus { get; set; }
}

public class UpdateTenderDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Filelink { get; set; }
    public string? Streetaddress { get; set; }
    public DateTime? Closingdate { get; set; }
    public decimal? Distancetosite { get; set; }
    public Guid? Contact { get; set; }
    public Guid? Customer { get; set; }
    public Guid? Quoteno { get; set; }
    public bool? Roofcoveringsheeting { get; set; }
    public bool? Roofcoveringtiles { get; set; }
    public bool? Timberstructure { get; set; }
    public decimal? Totalvalueexcl { get; set; }
    public Guid? NewDesigner { get; set; }
    public string? NewNotes { get; set; }
    public bool? NewPricingsubmitted { get; set; }
    public DateTime? NewSubmissiondate { get; set; }
    public int? NewTenderstatus { get; set; }
}
