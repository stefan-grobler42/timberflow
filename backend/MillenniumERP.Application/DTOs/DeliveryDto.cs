namespace MillenniumERP.Application.DTOs;

public class DeliveryDto
{
    public Guid Id { get; set; }
    public string? DeliveryNo { get; set; }
    public Guid? Customer { get; set; }
    public Guid? OrderNo { get; set; }
    public DateTime? LoadingDate { get; set; }
    public Guid? Driver { get; set; }
    public Guid? Helper1 { get; set; }
    public Guid? Helper2 { get; set; }
    public Guid? Helper3 { get; set; }
    public Guid? Helper4 { get; set; }
    public Guid? Helper5 { get; set; }
    public Guid? LoadMaster { get; set; }
    public Guid? DispatchManager { get; set; }
    public string? OpenKms { get; set; }
    public string? CloseKms { get; set; }
    public DateTime? ArrivalTime { get; set; }
    public DateTime? ArrivalTimeSite { get; set; }
    public DateTime? DepartureTime { get; set; }
    public DateTime? DepartureTimeSite { get; set; }
    public bool? PartLoad { get; set; }
    public DateTime? ActualStart { get; set; }
    public DateTime? ActualEnd { get; set; }
    public int? ActualDurationMinutes { get; set; }
    public DateTime? CreatedOn { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public Guid? ModifiedBy { get; set; }
}

public class CreateDeliveryDto
{
    public string? DeliveryNo { get; set; }
    public Guid? Customer { get; set; }
    public Guid? OrderNo { get; set; }
    public DateTime? LoadingDate { get; set; }
    public Guid? Driver { get; set; }
    public Guid? Helper1 { get; set; }
    public Guid? Helper2 { get; set; }
    public Guid? Helper3 { get; set; }
    public Guid? Helper4 { get; set; }
    public Guid? Helper5 { get; set; }
    public Guid? LoadMaster { get; set; }
    public Guid? DispatchManager { get; set; }
    public string? OpenKms { get; set; }
    public string? CloseKms { get; set; }
    public DateTime? ArrivalTime { get; set; }
    public DateTime? ArrivalTimeSite { get; set; }
    public DateTime? DepartureTime { get; set; }
    public DateTime? DepartureTimeSite { get; set; }
    public bool? PartLoad { get; set; }
    public DateTime? ActualStart { get; set; }
    public DateTime? ActualEnd { get; set; }
}

public class UpdateDeliveryDto
{
    public string? DeliveryNo { get; set; }
    public Guid? Customer { get; set; }
    public Guid? OrderNo { get; set; }
    public DateTime? LoadingDate { get; set; }
    public Guid? Driver { get; set; }
    public Guid? Helper1 { get; set; }
    public Guid? Helper2 { get; set; }
    public Guid? Helper3 { get; set; }
    public Guid? Helper4 { get; set; }
    public Guid? Helper5 { get; set; }
    public Guid? LoadMaster { get; set; }
    public Guid? DispatchManager { get; set; }
    public string? OpenKms { get; set; }
    public string? CloseKms { get; set; }
    public DateTime? ArrivalTime { get; set; }
    public DateTime? ArrivalTimeSite { get; set; }
    public DateTime? DepartureTime { get; set; }
    public DateTime? DepartureTimeSite { get; set; }
    public bool? PartLoad { get; set; }
    public DateTime? ActualStart { get; set; }
    public DateTime? ActualEnd { get; set; }
}
