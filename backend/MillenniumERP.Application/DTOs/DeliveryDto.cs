namespace MillenniumERP.Application.DTOs;

public class DeliveryDto
{
    public Guid Id { get; set; }
    public string? Deliveryno { get; set; }
    public Guid? Customer { get; set; }
    public Guid? Orderno { get; set; }
    public DateTime? Loadingdate { get; set; }
    public Guid? Driver { get; set; }
    public Guid? Helper1 { get; set; }
    public Guid? Helper2 { get; set; }
    public Guid? Helper3 { get; set; }
    public Guid? Helper4 { get; set; }
    public Guid? Helper5 { get; set; }
    public Guid? Loadmaster { get; set; }
    public Guid? Dispatchmanager { get; set; }
    public string? Openkms { get; set; }
    public string? Closekms { get; set; }
    public DateTime? Arrivaltime { get; set; }
    public DateTime? Arrivaltimesite { get; set; }
    public DateTime? Departuretime { get; set; }
    public DateTime? Departuretimesite { get; set; }
    public bool? Partload { get; set; }
    public DateTime? Actualstart { get; set; }
    public DateTime? Actualend { get; set; }
    public int? Actualdurationminutes { get; set; }
    public DateTime? CreatedOn { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public Guid? ModifiedBy { get; set; }
}

public class CreateDeliveryDto
{
    public string? Deliveryno { get; set; }
    public Guid? Customer { get; set; }
    public Guid? Orderno { get; set; }
    public DateTime? Loadingdate { get; set; }
    public Guid? Driver { get; set; }
    public Guid? Helper1 { get; set; }
    public Guid? Helper2 { get; set; }
    public Guid? Helper3 { get; set; }
    public Guid? Helper4 { get; set; }
    public Guid? Helper5 { get; set; }
    public Guid? Loadmaster { get; set; }
    public Guid? Dispatchmanager { get; set; }
    public string? Openkms { get; set; }
    public string? Closekms { get; set; }
    public DateTime? Arrivaltime { get; set; }
    public DateTime? Arrivaltimesite { get; set; }
    public DateTime? Departuretime { get; set; }
    public DateTime? Departuretimesite { get; set; }
    public bool? Partload { get; set; }
    public DateTime? Actualstart { get; set; }
    public DateTime? Actualend { get; set; }
}

public class UpdateDeliveryDto
{
    public string? Deliveryno { get; set; }
    public Guid? Customer { get; set; }
    public Guid? Orderno { get; set; }
    public DateTime? Loadingdate { get; set; }
    public Guid? Driver { get; set; }
    public Guid? Helper1 { get; set; }
    public Guid? Helper2 { get; set; }
    public Guid? Helper3 { get; set; }
    public Guid? Helper4 { get; set; }
    public Guid? Helper5 { get; set; }
    public Guid? Loadmaster { get; set; }
    public Guid? Dispatchmanager { get; set; }
    public string? Openkms { get; set; }
    public string? Closekms { get; set; }
    public DateTime? Arrivaltime { get; set; }
    public DateTime? Arrivaltimesite { get; set; }
    public DateTime? Departuretime { get; set; }
    public DateTime? Departuretimesite { get; set; }
    public bool? Partload { get; set; }
    public DateTime? Actualstart { get; set; }
    public DateTime? Actualend { get; set; }
}
