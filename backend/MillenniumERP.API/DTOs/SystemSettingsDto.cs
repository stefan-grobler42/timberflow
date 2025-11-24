namespace MillenniumERP.API.DTOs;

public class SystemSettingsDto
{
    public FinancialYearSettingsDto? FinancialYear { get; set; }
    public WorkingHoursSettingsDto? WorkingHours { get; set; }
}

public class FinancialYearSettingsDto
{
    public int StartMonth { get; set; } = 3; // March
    public int StartDay { get; set; } = 1;
}

public class WorkingHoursSettingsDto
{
    public StaffWorkingHoursDto? OfficeStaff { get; set; }
    public StaffWorkingHoursDto? FactoryStaff { get; set; }
}

public class StaffWorkingHoursDto
{
    public string? Monday { get; set; }
    public string? Tuesday { get; set; }
    public string? Wednesday { get; set; }
    public string? Thursday { get; set; }
    public string? Friday { get; set; }
    public string? Saturday { get; set; }
    public string? Sunday { get; set; }
}
