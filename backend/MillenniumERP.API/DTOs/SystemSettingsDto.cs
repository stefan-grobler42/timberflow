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
