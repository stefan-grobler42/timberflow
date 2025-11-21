namespace MillenniumERP.Application.DTOs;

public class ProductionDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid? Customer { get; set; }
    public Guid? OrderNo { get; set; }
    public string? OrderNumber { get; set; }
    public DateTime? JigStart { get; set; }
    public DateTime? JigEnd { get; set; }
    public Guid? JigLeader { get; set; }
    public Guid? JigHelper1 { get; set; }
    public Guid? JigHelper2 { get; set; }
    public Guid? JigHelper3 { get; set; }
    public Guid? JigHelper4 { get; set; }
    public DateTime? PickStart { get; set; }
    public DateTime? PickEnd { get; set; }
    public Guid? PickingMaster { get; set; }
    public Guid? PickingHelper1 { get; set; }
    public Guid? PickingHelper2 { get; set; }
    public Guid? PickingHelper3 { get; set; }
    public DateTime? SawStart { get; set; }
    public DateTime? SawEnd { get; set; }
    public Guid? SawOperator { get; set; }
    public Guid? SawHelper1 { get; set; }
    public Guid? SawHelper2 { get; set; }
    public bool? ProductionComplete { get; set; }
    public DateTime? ProductionPlannedDate { get; set; }
    public int? TotalCuts { get; set; }
    public decimal? TotalTimberCubes { get; set; }
    public decimal? TrussCost { get; set; }
    public int? TrussSelling { get; set; }
    public decimal? WorkUnitsEfinks { get; set; }
    public decimal? NewEstimateDefinks { get; set; }
    public DateTime? CreatedOn { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public Guid? ModifiedBy { get; set; }
}

public class CreateProductionDto
{
    public string Name { get; set; } = string.Empty;
    public Guid? Customer { get; set; }
    public Guid? OrderNo { get; set; }
    public DateTime? JigStart { get; set; }
    public DateTime? JigEnd { get; set; }
    public Guid? JigLeader { get; set; }
    public Guid? JigHelper1 { get; set; }
    public Guid? JigHelper2 { get; set; }
    public Guid? JigHelper3 { get; set; }
    public Guid? JigHelper4 { get; set; }
    public DateTime? PickStart { get; set; }
    public DateTime? PickEnd { get; set; }
    public Guid? PickingMaster { get; set; }
    public Guid? PickingHelper1 { get; set; }
    public Guid? PickingHelper2 { get; set; }
    public Guid? PickingHelper3 { get; set; }
    public DateTime? SawStart { get; set; }
    public DateTime? SawEnd { get; set; }
    public Guid? SawOperator { get; set; }
    public Guid? SawHelper1 { get; set; }
    public Guid? SawHelper2 { get; set; }
    public bool? ProductionComplete { get; set; }
    public DateTime? ProductionPlannedDate { get; set; }
    public int? TotalCuts { get; set; }
    public decimal? TotalTimberCubes { get; set; }
    public decimal? TrussCost { get; set; }
    public int? TrussSelling { get; set; }
    public decimal? WorkUnitsEfinks { get; set; }
    public decimal? NewEstimateDefinks { get; set; }
}

public class UpdateProductionDto
{
    public string? Name { get; set; }
    public Guid? Customer { get; set; }
    public Guid? OrderNo { get; set; }
    public DateTime? JigStart { get; set; }
    public DateTime? JigEnd { get; set; }
    public Guid? JigLeader { get; set; }
    public Guid? JigHelper1 { get; set; }
    public Guid? JigHelper2 { get; set; }
    public Guid? JigHelper3 { get; set; }
    public Guid? JigHelper4 { get; set; }
    public DateTime? PickStart { get; set; }
    public DateTime? PickEnd { get; set; }
    public Guid? PickingMaster { get; set; }
    public Guid? PickingHelper1 { get; set; }
    public Guid? PickingHelper2 { get; set; }
    public Guid? PickingHelper3 { get; set; }
    public DateTime? SawStart { get; set; }
    public DateTime? SawEnd { get; set; }
    public Guid? SawOperator { get; set; }
    public Guid? SawHelper1 { get; set; }
    public Guid? SawHelper2 { get; set; }
    public bool? ProductionComplete { get; set; }
    public DateTime? ProductionPlannedDate { get; set; }
    public int? TotalCuts { get; set; }
    public decimal? TotalTimberCubes { get; set; }
    public decimal? TrussCost { get; set; }
    public int? TrussSelling { get; set; }
    public decimal? WorkUnitsEfinks { get; set; }
    public decimal? NewEstimateDefinks { get; set; }
}
