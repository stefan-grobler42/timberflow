namespace MillenniumERP.Application.DTOs;

public class TeamDayAllocationDto
{
    public Guid Id { get; set; }
    public Guid TeamDayId { get; set; }
    public Guid ProductionId { get; set; }
    public string? ProductionName { get; set; }
    public string? OrderNumber { get; set; }
    public string? CustomerName { get; set; }
    public int Sequence { get; set; }
    public int AllocatedMinutes { get; set; }
    public int StartMinutes { get; set; }
    public Guid? OverflowToAllocationId { get; set; }
    public Guid? OverflowFromAllocationId { get; set; }
    public string Status { get; set; } = "planned";
    public bool IsRollover { get; set; }
    public DateTime CreatedOn { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public Guid? ModifiedBy { get; set; }
}

public class CreateAllocationDto
{
    public Guid TeamDayId { get; set; }
    public Guid ProductionId { get; set; }
    public int Sequence { get; set; }
    public int AllocatedMinutes { get; set; }
    public int StartMinutes { get; set; }
    public Guid? OverflowFromAllocationId { get; set; }
    public string Status { get; set; } = "planned";
    public bool IsRollover { get; set; } = false;
}

public class UpdateAllocationDto
{
    public int? Sequence { get; set; }
    public int? AllocatedMinutes { get; set; }
    public int? StartMinutes { get; set; }
    public Guid? OverflowToAllocationId { get; set; }
    public string? Status { get; set; }
}

public class BulkAllocateDto
{
    public Guid TeamId { get; set; }
    public DateTime WorkDate { get; set; }
    public List<AllocationItemDto> Allocations { get; set; } = new();
    public bool OvertimeEnabled { get; set; } = false;
    public string? OvertimeCloseTime { get; set; }
}

public class AllocationItemDto
{
    public Guid ProductionId { get; set; }
    public int Sequence { get; set; }
    public int AllocatedMinutes { get; set; }
    public int StartMinutes { get; set; }
    public string Status { get; set; } = "planned";
    public bool IsRollover { get; set; } = false;
}

public class TeamDayWithAllocationsDto
{
    public Guid TeamId { get; set; }
    public string? TeamName { get; set; }
    public DateTime WorkDate { get; set; }
    public int BaseMinutes { get; set; }
    public int OvertimeMinutes { get; set; }
    public bool OvertimeEnabled { get; set; }
    public string? OvertimeCloseTime { get; set; }
    public bool IsLocked { get; set; }
    public List<TeamDayAllocationDto> Allocations { get; set; } = new();
}
