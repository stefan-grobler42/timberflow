namespace MillenniumERP.Application.DTOs;

public class ProductionDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid? Customer { get; set; }
    public string? CustomerName { get; set; }
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
    public decimal? TrussSelling { get; set; }
    public decimal? WorkUnitsEfinks { get; set; }
    public decimal? NewEstimateDefinks { get; set; }
    public int? CustomDurationMinutes { get; set; }
    public Guid? ParentProductionId { get; set; }
    public int? RolloverSequence { get; set; }
    public Guid? PickingTeamId { get; set; }
    public Guid? SawId { get; set; }
    public Guid? JigId { get; set; }
    
    // Planned timing fields - calculated by planner when job is allocated
    public DateTime? PlannedStartDate { get; set; }
    public int? PlannedStartTime { get; set; }  // Minutes from midnight (e.g., 480 = 8:00 AM)
    public int? PlannedEndTime { get; set; }    // Minutes from midnight (e.g., 1020 = 5:00 PM)
    public int? PlannedDurationMinutes { get; set; }  // Base duration from EFinks (no breaks)
    public int? BreakAdjustmentMinutes { get; set; }  // Extra time added when job crosses breaks
    public bool IsInWip { get; set; }  // Flag indicating job is allocated to WIP
    
    // Batch fields for combined jobs
    public Guid? BatchId { get; set; }
    public int? BatchPosition { get; set; }
    
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
    public decimal? TrussSelling { get; set; }
    public decimal? WorkUnitsEfinks { get; set; }
    public decimal? NewEstimateDefinks { get; set; }
    public int? CustomDurationMinutes { get; set; }
    public Guid? ParentProductionId { get; set; }
    public int? RolloverSequence { get; set; }
    public Guid? PickingTeamId { get; set; }
    public Guid? SawId { get; set; }
    public Guid? JigId { get; set; }
    
    // Planned timing fields
    public DateTime? PlannedStartDate { get; set; }
    public int? PlannedStartTime { get; set; }
    public int? PlannedEndTime { get; set; }
    public int? PlannedDurationMinutes { get; set; }
    public int? BreakAdjustmentMinutes { get; set; }
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
    public decimal? TrussSelling { get; set; }
    public decimal? WorkUnitsEfinks { get; set; }
    public decimal? NewEstimateDefinks { get; set; }
    public int? CustomDurationMinutes { get; set; }
    public Guid? ParentProductionId { get; set; }
    public int? RolloverSequence { get; set; }
    public Guid? PickingTeamId { get; set; }
    public Guid? SawId { get; set; }
    public Guid? JigId { get; set; }
    
    // Planned timing fields
    public DateTime? PlannedStartDate { get; set; }
    public int? PlannedStartTime { get; set; }
    public int? PlannedEndTime { get; set; }
    public int? PlannedDurationMinutes { get; set; }
    public int? BreakAdjustmentMinutes { get; set; }
}

public class UpdatePlannedDateDto
{
    /// <summary>
    /// The new planned date for the production. Set to null to clear the date.
    /// </summary>
    public DateTime? PlannedDate { get; set; }
}

public class ProductionImportDto
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public Guid? Customer { get; set; }
    public Guid? Orderno { get; set; }
    public DateTime? Jigstart { get; set; }
    public DateTime? Jigend { get; set; }
    public Guid? Jigleader { get; set; }
    public Guid? Jighelper1 { get; set; }
    public Guid? Jighelper2 { get; set; }
    public Guid? Jighelper3 { get; set; }
    public Guid? Jighelper4 { get; set; }
    public DateTime? Pickstart { get; set; }
    public DateTime? Pickend { get; set; }
    public Guid? Pickingmaster { get; set; }
    public Guid? Pickinghelper1 { get; set; }
    public Guid? Pickinghelper2 { get; set; }
    public Guid? Pickinghelper3 { get; set; }
    public DateTime? Sawstart { get; set; }
    public DateTime? Sawend { get; set; }
    public Guid? Sawoperator { get; set; }
    public Guid? Sawhelper1 { get; set; }
    public Guid? Sawhelper2 { get; set; }
    public bool? Productioncomplete { get; set; }
    public DateTime? Productionplanneddate { get; set; }
    public int? Totalcuts { get; set; }
    public decimal? Totaltimbercubes { get; set; }
    public decimal? Trusscost { get; set; }
    public decimal? Trussselling { get; set; }
    public decimal? Workunitsefinks { get; set; }
    public decimal? Newestimatedefinks { get; set; }
    public DateTime? CreatedOn { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public Guid? ModifiedBy { get; set; }
}
