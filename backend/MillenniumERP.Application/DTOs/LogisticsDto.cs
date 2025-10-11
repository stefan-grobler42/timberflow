namespace MillenniumERP.Application.DTOs;

public class LogisticsDto
{
    public Guid Id { get; set; }
    public string? DeliveryNo { get; set; }
    public string? Description { get; set; }
    public Guid? DispatchManager { get; set; }
    public Guid? Driver { get; set; }
    public Guid? Helper1 { get; set; }
    public Guid? Helper2 { get; set; }
    public Guid? Helper3 { get; set; }
    public Guid? Helper4 { get; set; }
    public Guid? Helper5 { get; set; }
    public Guid? LoadMaster { get; set; }
    public Guid? Security { get; set; }
    public Guid? Trailer { get; set; }
    public Guid? Vehicle { get; set; }
    public DateTime? PlannedLoadDate { get; set; }
    public int? NewKmsTravelled { get; set; }
    public DateTime? NewKmsTravelledDate { get; set; }
    public int? NewKmsTravelledState { get; set; }
    public bool? NewLoadCompleted { get; set; }
    public int? NewLoadDuration { get; set; }
    public DateTime? NewLoadDurationDate { get; set; }
    public int? NewLoadDurationState { get; set; }
    public DateTime? CreatedOn { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public Guid? ModifiedBy { get; set; }
}

public class CreateLogisticsDto
{
    public string? DeliveryNo { get; set; }
    public string? Description { get; set; }
    public Guid? DispatchManager { get; set; }
    public Guid? Driver { get; set; }
    public Guid? Helper1 { get; set; }
    public Guid? Helper2 { get; set; }
    public Guid? Helper3 { get; set; }
    public Guid? Helper4 { get; set; }
    public Guid? Helper5 { get; set; }
    public Guid? LoadMaster { get; set; }
    public Guid? Security { get; set; }
    public Guid? Trailer { get; set; }
    public Guid? Vehicle { get; set; }
    public DateTime? PlannedLoadDate { get; set; }
    public int? NewKmsTravelled { get; set; }
    public bool? NewLoadCompleted { get; set; }
    public int? NewLoadDuration { get; set; }
}

public class UpdateLogisticsDto
{
    public string? DeliveryNo { get; set; }
    public string? Description { get; set; }
    public Guid? DispatchManager { get; set; }
    public Guid? Driver { get; set; }
    public Guid? Helper1 { get; set; }
    public Guid? Helper2 { get; set; }
    public Guid? Helper3 { get; set; }
    public Guid? Helper4 { get; set; }
    public Guid? Helper5 { get; set; }
    public Guid? LoadMaster { get; set; }
    public Guid? Security { get; set; }
    public Guid? Trailer { get; set; }
    public Guid? Vehicle { get; set; }
    public DateTime? PlannedLoadDate { get; set; }
    public int? NewKmsTravelled { get; set; }
    public bool? NewLoadCompleted { get; set; }
    public int? NewLoadDuration { get; set; }
}
