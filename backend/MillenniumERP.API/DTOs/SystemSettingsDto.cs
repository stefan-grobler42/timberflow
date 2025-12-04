using System.Text.Json.Serialization;

namespace MillenniumERP.API.DTOs;

public class SystemSettingsDto
{
    [JsonPropertyName("financialYear")]
    public FinancialYearSettingsDto? FinancialYear { get; set; }
    
    [JsonPropertyName("workingHours")]
    public WorkingHoursSettingsDto? WorkingHours { get; set; }
    
    [JsonPropertyName("timezone")]
    public TimezoneSettingsDto? Timezone { get; set; }
    
    [JsonPropertyName("breakTimes")]
    public BreakTimesSettingsDto? BreakTimes { get; set; }
    
    [JsonPropertyName("productionScheduling")]
    public ProductionSchedulingSettingsDto? ProductionScheduling { get; set; }
}

public class FinancialYearSettingsDto
{
    [JsonPropertyName("startMonth")]
    public int StartMonth { get; set; } = 3; // March
    
    [JsonPropertyName("startDay")]
    public int StartDay { get; set; } = 1;
}

public class WorkingHoursSettingsDto
{
    [JsonPropertyName("officeStaff")]
    public StaffWorkingHoursDto? OfficeStaff { get; set; }
    
    [JsonPropertyName("factoryStaff")]
    public StaffWorkingHoursDto? FactoryStaff { get; set; }
}

public class StaffWorkingHoursDto
{
    [JsonPropertyName("monday")]
    public string? Monday { get; set; }
    
    [JsonPropertyName("tuesday")]
    public string? Tuesday { get; set; }
    
    [JsonPropertyName("wednesday")]
    public string? Wednesday { get; set; }
    
    [JsonPropertyName("thursday")]
    public string? Thursday { get; set; }
    
    [JsonPropertyName("friday")]
    public string? Friday { get; set; }
    
    [JsonPropertyName("saturday")]
    public string? Saturday { get; set; }
    
    [JsonPropertyName("sunday")]
    public string? Sunday { get; set; }
}

public class TimezoneSettingsDto
{
    [JsonPropertyName("timeZoneId")]
    public string TimeZoneId { get; set; } = "South Africa Standard Time";
    
    [JsonPropertyName("displayName")]
    public string DisplayName { get; set; } = "South Africa (GMT+02:00)";
    
    [JsonPropertyName("utcOffset")]
    public string UtcOffset { get; set; } = "+02:00";
}

public class BreakTimesSettingsDto
{
    [JsonPropertyName("weekday")]
    public WeekdayBreaksDto? Weekday { get; set; }
    
    [JsonPropertyName("weekdayOvertime")]
    public OvertimeBreaksDto? WeekdayOvertime { get; set; }
    
    [JsonPropertyName("weekendOvertime")]
    public WeekendOvertimeDto? WeekendOvertime { get; set; }
}

public class WeekdayBreaksDto
{
    [JsonPropertyName("teaStart")]
    public string TeaStart { get; set; } = "09:00";
    
    [JsonPropertyName("teaEnd")]
    public string TeaEnd { get; set; } = "09:30";
    
    [JsonPropertyName("lunchStart")]
    public string LunchStart { get; set; } = "12:00";
    
    [JsonPropertyName("lunchEnd")]
    public string LunchEnd { get; set; } = "12:45";
}

public class OvertimeBreaksDto
{
    [JsonPropertyName("dinnerStart")]
    public string DinnerStart { get; set; } = "18:00";
    
    [JsonPropertyName("dinnerEnd")]
    public string DinnerEnd { get; set; } = "18:30";
}

public class WeekendOvertimeDto
{
    [JsonPropertyName("workingHoursStart")]
    public string WorkingHoursStart { get; set; } = "07:00";
    
    [JsonPropertyName("workingHoursEnd")]
    public string WorkingHoursEnd { get; set; } = "15:00";
    
    [JsonPropertyName("lunchStart")]
    public string LunchStart { get; set; } = "10:00";
    
    [JsonPropertyName("lunchEnd")]
    public string LunchEnd { get; set; } = "11:00";
}

public class ProductionSchedulingSettingsDto
{
    [JsonPropertyName("general")]
    public GeneralSchedulingDto? General { get; set; }
    
    [JsonPropertyName("overtimeDefaults")]
    public OvertimeDefaultsDto? OvertimeDefaults { get; set; }
    
    [JsonPropertyName("uiDisplay")]
    public UiDisplayDto? UiDisplay { get; set; }
}

public class GeneralSchedulingDto
{
    [JsonPropertyName("bufferMinutes")]
    public int BufferMinutes { get; set; } = 30;
    
    [JsonPropertyName("minJobDuration")]
    public int MinJobDuration { get; set; } = 15;
    
    [JsonPropertyName("durationRoundingIncrement")]
    public int DurationRoundingIncrement { get; set; } = 15;
    
    [JsonPropertyName("eFinkMultiplier")]
    public decimal EFinkMultiplier { get; set; } = 6.5625m;
}

public class OvertimeDefaultsDto
{
    [JsonPropertyName("defaultOvertimeEnabled")]
    public bool DefaultOvertimeEnabled { get; set; } = false;
    
    [JsonPropertyName("defaultLateOtEndTime")]
    public string DefaultLateOtEndTime { get; set; } = "19:00";
    
    [JsonPropertyName("allowEarlyStartOt")]
    public bool AllowEarlyStartOt { get; set; } = false;
    
    [JsonPropertyName("defaultEarlyStartTime")]
    public string DefaultEarlyStartTime { get; set; } = "06:00";
}

public class UiDisplayDto
{
    [JsonPropertyName("pixelsPerMinute")]
    public decimal PixelsPerMinute { get; set; } = 1.5m;
    
    [JsonPropertyName("visibleHoursBeforeShift")]
    public int VisibleHoursBeforeShift { get; set; } = 1;
    
    [JsonPropertyName("visibleHoursAfterShift")]
    public int VisibleHoursAfterShift { get; set; } = 1;
    
    [JsonPropertyName("dayHeaderHeight")]
    public int DayHeaderHeight { get; set; } = 40;
}
