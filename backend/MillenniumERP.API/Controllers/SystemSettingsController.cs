using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.API.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;
using System.Text.Json;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SystemSettingsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<SystemSettingsController> _logger;

    public SystemSettingsController(AppDbContext context, ILogger<SystemSettingsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<SystemSettingsDto>> GetSettings()
    {
        try
        {
            var settings = await _context.SystemSettings.ToListAsync();
            
            var dto = new SystemSettingsDto
            {
                FinancialYear = GetFinancialYearSettings(settings),
                WorkingHours = GetWorkingHoursSettings(settings),
                Timezone = GetTimezoneSettings(settings),
                BreakTimes = GetBreakTimesSettings(settings),
                ProductionScheduling = GetProductionSchedulingSettings(settings)
            };

            return Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving system settings");
            return StatusCode(500, "Error retrieving system settings");
        }
    }

    [HttpPut]
    public async Task<ActionResult> UpdateSettings([FromBody] SystemSettingsDto dto)
    {
        try
        {
            await SaveFinancialYearSettings(dto.FinancialYear);
            await SaveWorkingHoursSettings(dto.WorkingHours);
            await SaveTimezoneSettings(dto.Timezone);
            await SaveBreakTimesSettings(dto.BreakTimes);
            await SaveProductionSchedulingSettings(dto.ProductionScheduling);
            
            await _context.SaveChangesAsync();

            return Ok(new { message = "Settings updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating system settings");
            return StatusCode(500, "Error updating system settings");
        }
    }

    private FinancialYearSettingsDto GetFinancialYearSettings(List<SystemSetting> settings)
    {
        var startMonth = settings.FirstOrDefault(s => s.SettingKey == "FinancialYear.StartMonth");
        var startDay = settings.FirstOrDefault(s => s.SettingKey == "FinancialYear.StartDay");

        return new FinancialYearSettingsDto
        {
            StartMonth = startMonth != null && int.TryParse(startMonth.SettingValue, out int month) ? month : 3,
            StartDay = startDay != null && int.TryParse(startDay.SettingValue, out int day) ? day : 1
        };
    }

    private WorkingHoursSettingsDto GetWorkingHoursSettings(List<SystemSetting> settings)
    {
        var officeStaff = settings.FirstOrDefault(s => s.SettingKey == "WorkingHours.OfficeStaff");
        var factoryStaff = settings.FirstOrDefault(s => s.SettingKey == "WorkingHours.FactoryStaff");

        var defaultOffice = new StaffWorkingHoursDto
        {
            Monday = "08:00-16:00",
            Tuesday = "08:00-16:00",
            Wednesday = "08:00-16:00",
            Thursday = "08:00-16:00",
            Friday = "08:00-16:00",
            Saturday = null,
            Sunday = null
        };

        var defaultFactory = new StaffWorkingHoursDto
        {
            Monday = "07:00-17:00",
            Tuesday = "07:00-17:00",
            Wednesday = "07:00-17:00",
            Thursday = "07:00-17:00",
            Friday = "07:00-16:00",
            Saturday = null,
            Sunday = null
        };

        return new WorkingHoursSettingsDto
        {
            OfficeStaff = officeStaff != null ? 
                JsonSerializer.Deserialize<StaffWorkingHoursDto>(officeStaff.SettingValue ?? "{}") ?? defaultOffice : 
                defaultOffice,
            FactoryStaff = factoryStaff != null ? 
                JsonSerializer.Deserialize<StaffWorkingHoursDto>(factoryStaff.SettingValue ?? "{}") ?? defaultFactory : 
                defaultFactory
        };
    }

    private async Task SaveFinancialYearSettings(FinancialYearSettingsDto? dto)
    {
        if (dto == null) return;

        await UpsertSetting("FinancialYear.StartMonth", dto.StartMonth.ToString(), "Financial Year", "Financial year start month (1-12)");
        await UpsertSetting("FinancialYear.StartDay", dto.StartDay.ToString(), "Financial Year", "Financial year start day (1-31)");
    }

    private async Task SaveWorkingHoursSettings(WorkingHoursSettingsDto? dto)
    {
        if (dto == null) return;

        if (dto.OfficeStaff != null)
        {
            var json = JsonSerializer.Serialize(dto.OfficeStaff);
            await UpsertSetting("WorkingHours.OfficeStaff", json, "Working Hours", "Office staff working hours");
        }

        if (dto.FactoryStaff != null)
        {
            var json = JsonSerializer.Serialize(dto.FactoryStaff);
            await UpsertSetting("WorkingHours.FactoryStaff", json, "Working Hours", "Factory staff working hours");
        }
    }

    private TimezoneSettingsDto GetTimezoneSettings(List<SystemSetting> settings)
    {
        var timezone = settings.FirstOrDefault(s => s.SettingKey == "Timezone.Settings");

        var defaultTimezone = new TimezoneSettingsDto
        {
            TimeZoneId = "South Africa Standard Time",
            DisplayName = "South Africa (GMT+02:00)",
            UtcOffset = "+02:00"
        };

        return timezone != null ? 
            JsonSerializer.Deserialize<TimezoneSettingsDto>(timezone.SettingValue ?? "{}") ?? defaultTimezone : 
            defaultTimezone;
    }

    private async Task SaveTimezoneSettings(TimezoneSettingsDto? dto)
    {
        if (dto == null) return;

        var json = JsonSerializer.Serialize(dto);
        await UpsertSetting("Timezone.Settings", json, "Timezone", "System timezone configuration");
    }

    private BreakTimesSettingsDto GetBreakTimesSettings(List<SystemSetting> settings)
    {
        var breakTimes = settings.FirstOrDefault(s => s.SettingKey == "BreakTimes.Settings");

        var defaultBreakTimes = new BreakTimesSettingsDto
        {
            Weekday = new WeekdayBreaksDto
            {
                TeaStart = "09:00",
                TeaEnd = "09:30",
                LunchStart = "12:00",
                LunchEnd = "12:45"
            },
            WeekdayOvertime = new OvertimeBreaksDto
            {
                DinnerStart = "18:00",
                DinnerEnd = "18:30"
            },
            WeekendOvertime = new WeekendOvertimeDto
            {
                WorkingHoursStart = "07:00",
                WorkingHoursEnd = "15:00",
                LunchStart = "10:00",
                LunchEnd = "11:00"
            }
        };

        return breakTimes != null ? 
            JsonSerializer.Deserialize<BreakTimesSettingsDto>(breakTimes.SettingValue ?? "{}") ?? defaultBreakTimes : 
            defaultBreakTimes;
    }

    private async Task SaveBreakTimesSettings(BreakTimesSettingsDto? dto)
    {
        if (dto == null) return;

        var json = JsonSerializer.Serialize(dto);
        await UpsertSetting("BreakTimes.Settings", json, "Break Times", "Tea, lunch, and overtime break schedules");
    }

    private ProductionSchedulingSettingsDto GetProductionSchedulingSettings(List<SystemSetting> settings)
    {
        var generalSetting = settings.FirstOrDefault(s => s.SettingKey == "ProductionScheduling.General");
        var overtimeDefaultsSetting = settings.FirstOrDefault(s => s.SettingKey == "ProductionScheduling.OvertimeDefaults");
        var uiDisplaySetting = settings.FirstOrDefault(s => s.SettingKey == "ProductionScheduling.UiDisplay");

        var defaultGeneral = new GeneralSchedulingDto
        {
            BufferMinutes = 30,
            MinJobDuration = 15,
            DurationRoundingIncrement = 15,
            EFinkMultiplier = 6.5625m
        };

        var defaultOvertimeDefaults = new OvertimeDefaultsDto
        {
            DefaultOvertimeEnabled = false,
            DefaultLateOtEndTime = "19:00",
            AllowEarlyStartOt = false,
            DefaultEarlyStartTime = "06:00"
        };

        var defaultUiDisplay = new UiDisplayDto
        {
            PixelsPerMinute = 1.5m,
            VisibleHoursBeforeShift = 1,
            VisibleHoursAfterShift = 1,
            DayHeaderHeight = 40
        };

        return new ProductionSchedulingSettingsDto
        {
            General = generalSetting != null ?
                JsonSerializer.Deserialize<GeneralSchedulingDto>(generalSetting.SettingValue ?? "{}") ?? defaultGeneral :
                defaultGeneral,
            OvertimeDefaults = overtimeDefaultsSetting != null ?
                JsonSerializer.Deserialize<OvertimeDefaultsDto>(overtimeDefaultsSetting.SettingValue ?? "{}") ?? defaultOvertimeDefaults :
                defaultOvertimeDefaults,
            UiDisplay = uiDisplaySetting != null ?
                JsonSerializer.Deserialize<UiDisplayDto>(uiDisplaySetting.SettingValue ?? "{}") ?? defaultUiDisplay :
                defaultUiDisplay
        };
    }

    private async Task SaveProductionSchedulingSettings(ProductionSchedulingSettingsDto? dto)
    {
        if (dto == null) return;

        if (dto.General != null)
        {
            var json = JsonSerializer.Serialize(dto.General);
            await UpsertSetting("ProductionScheduling.General", json, "Production Scheduling", "General scheduling configuration");
        }

        if (dto.OvertimeDefaults != null)
        {
            var json = JsonSerializer.Serialize(dto.OvertimeDefaults);
            await UpsertSetting("ProductionScheduling.OvertimeDefaults", json, "Production Scheduling", "Overtime defaults configuration");
        }

        if (dto.UiDisplay != null)
        {
            var json = JsonSerializer.Serialize(dto.UiDisplay);
            await UpsertSetting("ProductionScheduling.UiDisplay", json, "Production Scheduling", "UI display configuration");
        }
    }

    private async Task UpsertSetting(string key, string value, string category, string description)
    {
        var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.SettingKey == key);

        if (setting == null)
        {
            setting = new SystemSetting
            {
                SettingKey = key,
                SettingValue = value,
                Category = category,
                Description = description,
                CreatedOn = DateTime.UtcNow,
                ModifiedOn = DateTime.UtcNow
            };
            _context.SystemSettings.Add(setting);
        }
        else
        {
            setting.SettingValue = value;
            setting.ModifiedOn = DateTime.UtcNow;
            _context.SystemSettings.Update(setting);
        }
    }
}
