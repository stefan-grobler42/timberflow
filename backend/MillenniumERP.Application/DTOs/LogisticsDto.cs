namespace MillenniumERP.Application.DTOs;

public class LogisticsDto
{
    public Guid Id { get; set; }
    public string? Deliveryno { get; set; }
    public string? Description { get; set; }
    public Guid? Dispatchmanager { get; set; }
    public Guid? Driver { get; set; }
    public Guid? Helper1 { get; set; }
    public Guid? Helper2 { get; set; }
    public Guid? Helper3 { get; set; }
    public Guid? Helper4 { get; set; }
    public Guid? Helper5 { get; set; }
    public Guid? Loadmaster { get; set; }
    public Guid? Security { get; set; }
    public Guid? Trailer { get; set; }
    public Guid? Vehicle { get; set; }
    public DateTime? Plannedloaddate { get; set; }
    public int? NewKmstravelled { get; set; }
    public DateTime? NewKmstravelledDate { get; set; }
    public int? NewKmstravelledState { get; set; }
    public bool? NewLoadcompleted { get; set; }
    public int? NewLoadduration { get; set; }
    public DateTime? NewLoaddurationDate { get; set; }
    public int? NewLoaddurationState { get; set; }
    public DateTime? CreatedOn { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public Guid? ModifiedBy { get; set; }
}

public class CreateLogisticsDto
{
    public string? Deliveryno { get; set; }
    public string? Description { get; set; }
    public Guid? Dispatchmanager { get; set; }
    public Guid? Driver { get; set; }
    public Guid? Helper1 { get; set; }
    public Guid? Helper2 { get; set; }
    public Guid? Helper3 { get; set; }
    public Guid? Helper4 { get; set; }
    public Guid? Helper5 { get; set; }
    public Guid? Loadmaster { get; set; }
    public Guid? Security { get; set; }
    public Guid? Trailer { get; set; }
    public Guid? Vehicle { get; set; }
    public DateTime? Plannedloaddate { get; set; }
    public int? NewKmstravelled { get; set; }
    public bool? NewLoadcompleted { get; set; }
    public int? NewLoadduration { get; set; }
}

public class UpdateLogisticsDto
{
    public string? Deliveryno { get; set; }
    public string? Description { get; set; }
    public Guid? Dispatchmanager { get; set; }
    public Guid? Driver { get; set; }
    public Guid? Helper1 { get; set; }
    public Guid? Helper2 { get; set; }
    public Guid? Helper3 { get; set; }
    public Guid? Helper4 { get; set; }
    public Guid? Helper5 { get; set; }
    public Guid? Loadmaster { get; set; }
    public Guid? Security { get; set; }
    public Guid? Trailer { get; set; }
    public Guid? Vehicle { get; set; }
    public DateTime? Plannedloaddate { get; set; }
    public int? NewKmstravelled { get; set; }
    public bool? NewLoadcompleted { get; set; }
    public int? NewLoadduration { get; set; }
}
