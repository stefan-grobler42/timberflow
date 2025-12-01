namespace MillenniumERP.Application.DTOs;

public class TeamDayDto
{
    public Guid Id { get; set; }
    public Guid TeamId { get; set; }
    public string? TeamName { get; set; }
    public DateTime WorkDate { get; set; }
    public int BaseMinutes { get; set; }
    public int OvertimeMinutes { get; set; }
    public int TotalAllocatedMinutes { get; set; }
    public int TotalCapacity => BaseMinutes + OvertimeMinutes;
    public int RemainingCapacity => TotalCapacity - TotalAllocatedMinutes;
    public bool IsLocked { get; set; }
    public bool OvertimeEnabled { get; set; }
    public string? OvertimeCloseTime { get; set; }
    public DateTime CreatedOn { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public Guid? ModifiedBy { get; set; }
    public List<TeamDayAllocationDto>? Allocations { get; set; }
}

public class CreateTeamDayDto
{
    public Guid TeamId { get; set; }
    public DateTime WorkDate { get; set; }
    public int BaseMinutes { get; set; } = 480;
    public int OvertimeMinutes { get; set; } = 0;
    public bool OvertimeEnabled { get; set; } = false;
    public string? OvertimeCloseTime { get; set; }
}

public class UpdateTeamDayDto
{
    public int? BaseMinutes { get; set; }
    public int? OvertimeMinutes { get; set; }
    public bool? IsLocked { get; set; }
    public bool? OvertimeEnabled { get; set; }
    public string? OvertimeCloseTime { get; set; }
}
