using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Infrastructure.Data;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlannerConfigController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<PlannerConfigController> _logger;

    public PlannerConfigController(AppDbContext context, ILogger<PlannerConfigController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<PlannerConfigDto>> GetConfig()
    {
        try
        {
            var settings = await _context.SystemSettings.ToListAsync();
            var teams = await _context.Jigs
                .OrderBy(j => j.DisplayOrder)
                .ThenBy(j => j.Name)
                .ToListAsync();

            var workingHoursJson = settings.FirstOrDefault(s => s.SettingKey == "WorkingHours.FactoryStaff")?.SettingValue;
            var breakTimesJson = settings.FirstOrDefault(s => s.SettingKey == "BreakTimes.Settings")?.SettingValue;
            var generalSchedulingJson = settings.FirstOrDefault(s => s.SettingKey == "ProductionScheduling.General")?.SettingValue;
            var overtimeDefaultsJson = settings.FirstOrDefault(s => s.SettingKey == "ProductionScheduling.OvertimeDefaults")?.SettingValue;
            var uiDisplayJson = settings.FirstOrDefault(s => s.SettingKey == "ProductionScheduling.UiDisplay")?.SettingValue;

            var dto = new PlannerConfigDto
            {
                WorkingHours = ParseWorkingHours(workingHoursJson),
                Breaks = ParseBreaks(breakTimesJson),
                Scheduling = ParseScheduling(generalSchedulingJson),
                Overtime = ParseOvertime(overtimeDefaultsJson),
                Ui = ParseUiConfig(uiDisplayJson),
                Teams = teams.Select(t => new TeamConfigDto
                {
                    Id = t.Id.ToString(),
                    Name = t.Name,
                    DisplayOrder = t.DisplayOrder,
                    Colour = t.Colour ?? "#4299e1",
                    AverageEfinks = t.AverageEfinks
                }).ToList()
            };

            return Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving planner configuration");
            return StatusCode(500, "Error retrieving planner configuration");
        }
    }

    private static int TimeStringToMinutes(string? timeStr, int defaultValue)
    {
        if (string.IsNullOrEmpty(timeStr))
            return defaultValue;

        var parts = timeStr.Split(':');
        if (parts.Length >= 2 && int.TryParse(parts[0], out int hours) && int.TryParse(parts[1], out int minutes))
        {
            return hours * 60 + minutes;
        }

        return defaultValue;
    }

    private static WorkingHoursConfigDto ParseWorkingHours(string? json)
    {
        var defaults = new WorkingHoursConfigDto
        {
            StandardStartMinutes = 420,
            StandardEndMinutes = 1020,
            EarlyStartMinutes = 360,
            LateEndMinutes = 1140
        };

        if (string.IsNullOrEmpty(json))
            return defaults;

        try
        {
            var parsed = JsonSerializer.Deserialize<FactoryWorkingHoursJson>(json);
            if (parsed == null)
                return defaults;

            var mondayHours = parsed.Monday ?? "07:00-17:00";
            var parts = mondayHours.Split('-');
            if (parts.Length == 2)
            {
                defaults.StandardStartMinutes = TimeStringToMinutes(parts[0], 420);
                defaults.StandardEndMinutes = TimeStringToMinutes(parts[1], 1020);
            }

            return defaults;
        }
        catch
        {
            return defaults;
        }
    }

    private static BreaksConfigDto ParseBreaks(string? json)
    {
        var defaults = new BreaksConfigDto
        {
            Breaks = new List<BreakItemDto>
            {
                new() { Name = "Morning Tea", StartMinutes = 540, EndMinutes = 555, Duration = 15, IsOvertimeOnly = false },
                new() { Name = "Lunch", StartMinutes = 720, EndMinutes = 750, Duration = 30, IsOvertimeOnly = false },
                new() { Name = "Afternoon Tea", StartMinutes = 870, EndMinutes = 885, Duration = 15, IsOvertimeOnly = false },
                new() { Name = "Dinner", StartMinutes = 1020, EndMinutes = 1050, Duration = 30, IsOvertimeOnly = true }
            }
        };

        if (string.IsNullOrEmpty(json))
            return defaults;

        try
        {
            var parsed = JsonSerializer.Deserialize<BreakTimesJson>(json);
            if (parsed == null)
                return defaults;

            var breaks = new List<BreakItemDto>();

            if (parsed.Weekday != null)
            {
                var teaStart = TimeStringToMinutes(parsed.Weekday.TeaStart, 540);
                var teaEnd = TimeStringToMinutes(parsed.Weekday.TeaEnd, 555);
                breaks.Add(new BreakItemDto
                {
                    Name = "Morning Tea",
                    StartMinutes = teaStart,
                    EndMinutes = teaEnd,
                    Duration = teaEnd - teaStart,
                    IsOvertimeOnly = false
                });

                var lunchStart = TimeStringToMinutes(parsed.Weekday.LunchStart, 720);
                var lunchEnd = TimeStringToMinutes(parsed.Weekday.LunchEnd, 750);
                breaks.Add(new BreakItemDto
                {
                    Name = "Lunch",
                    StartMinutes = lunchStart,
                    EndMinutes = lunchEnd,
                    Duration = lunchEnd - lunchStart,
                    IsOvertimeOnly = false
                });

                breaks.Add(new BreakItemDto
                {
                    Name = "Afternoon Tea",
                    StartMinutes = 870,
                    EndMinutes = 885,
                    Duration = 15,
                    IsOvertimeOnly = false
                });
            }

            if (parsed.WeekdayOvertime != null)
            {
                var dinnerStart = TimeStringToMinutes(parsed.WeekdayOvertime.DinnerStart, 1020);
                var dinnerEnd = TimeStringToMinutes(parsed.WeekdayOvertime.DinnerEnd, 1050);
                breaks.Add(new BreakItemDto
                {
                    Name = "Dinner",
                    StartMinutes = dinnerStart,
                    EndMinutes = dinnerEnd,
                    Duration = dinnerEnd - dinnerStart,
                    IsOvertimeOnly = true
                });
            }

            if (breaks.Count > 0)
            {
                defaults.Breaks = breaks;
            }

            return defaults;
        }
        catch
        {
            return defaults;
        }
    }

    private static SchedulingConfigDto ParseScheduling(string? json)
    {
        var defaults = new SchedulingConfigDto
        {
            BufferMinutes = 30,
            MinJobDuration = 15,
            DurationRoundingIncrement = 15,
            EFinkMultiplier = 6.5625m
        };

        if (string.IsNullOrEmpty(json))
            return defaults;

        try
        {
            var parsed = JsonSerializer.Deserialize<GeneralSchedulingJson>(json);
            if (parsed == null)
                return defaults;

            return new SchedulingConfigDto
            {
                BufferMinutes = parsed.BufferMinutes ?? 30,
                MinJobDuration = parsed.MinJobDuration ?? 15,
                DurationRoundingIncrement = parsed.DurationRoundingIncrement ?? 15,
                EFinkMultiplier = parsed.EFinkMultiplier ?? 6.5625m
            };
        }
        catch
        {
            return defaults;
        }
    }

    private static OvertimeConfigDto ParseOvertime(string? json)
    {
        var defaults = new OvertimeConfigDto
        {
            DefaultOvertimeEnabled = false,
            DefaultLateOtEndMinutes = 1140,
            AllowEarlyStartOt = false,
            DefaultEarlyStartMinutes = 360
        };

        if (string.IsNullOrEmpty(json))
            return defaults;

        try
        {
            var parsed = JsonSerializer.Deserialize<OvertimeDefaultsJson>(json);
            if (parsed == null)
                return defaults;

            return new OvertimeConfigDto
            {
                DefaultOvertimeEnabled = parsed.DefaultOvertimeEnabled ?? false,
                DefaultLateOtEndMinutes = TimeStringToMinutes(parsed.DefaultLateOtEndTime, 1140),
                AllowEarlyStartOt = parsed.AllowEarlyStartOt ?? false,
                DefaultEarlyStartMinutes = TimeStringToMinutes(parsed.DefaultEarlyStartTime, 360)
            };
        }
        catch
        {
            return defaults;
        }
    }

    private static UiConfigDto ParseUiConfig(string? json)
    {
        var defaults = new UiConfigDto
        {
            PixelsPerMinute = 1.5m,
            VisibleHoursBeforeShift = 1,
            VisibleHoursAfterShift = 1,
            DayHeaderHeight = 40
        };

        if (string.IsNullOrEmpty(json))
            return defaults;

        try
        {
            var parsed = JsonSerializer.Deserialize<UiDisplayJson>(json);
            if (parsed == null)
                return defaults;

            return new UiConfigDto
            {
                PixelsPerMinute = parsed.PixelsPerMinute ?? 1.5m,
                VisibleHoursBeforeShift = parsed.VisibleHoursBeforeShift ?? 1,
                VisibleHoursAfterShift = parsed.VisibleHoursAfterShift ?? 1,
                DayHeaderHeight = parsed.DayHeaderHeight ?? 40
            };
        }
        catch
        {
            return defaults;
        }
    }
}

public class PlannerConfigDto
{
    [JsonPropertyName("workingHours")]
    public WorkingHoursConfigDto WorkingHours { get; set; } = new();

    [JsonPropertyName("breaks")]
    public BreaksConfigDto Breaks { get; set; } = new();

    [JsonPropertyName("scheduling")]
    public SchedulingConfigDto Scheduling { get; set; } = new();

    [JsonPropertyName("overtime")]
    public OvertimeConfigDto Overtime { get; set; } = new();

    [JsonPropertyName("ui")]
    public UiConfigDto Ui { get; set; } = new();

    [JsonPropertyName("teams")]
    public List<TeamConfigDto> Teams { get; set; } = new();
}

public class WorkingHoursConfigDto
{
    [JsonPropertyName("standardStartMinutes")]
    public int StandardStartMinutes { get; set; } = 420;

    [JsonPropertyName("standardEndMinutes")]
    public int StandardEndMinutes { get; set; } = 1020;

    [JsonPropertyName("earlyStartMinutes")]
    public int EarlyStartMinutes { get; set; } = 360;

    [JsonPropertyName("lateEndMinutes")]
    public int LateEndMinutes { get; set; } = 1140;
}

public class BreaksConfigDto
{
    [JsonPropertyName("breaks")]
    public List<BreakItemDto> Breaks { get; set; } = new();
}

public class BreakItemDto
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("startMinutes")]
    public int StartMinutes { get; set; }

    [JsonPropertyName("endMinutes")]
    public int EndMinutes { get; set; }

    [JsonPropertyName("duration")]
    public int Duration { get; set; }

    [JsonPropertyName("isOvertimeOnly")]
    public bool IsOvertimeOnly { get; set; }
}

public class SchedulingConfigDto
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

public class OvertimeConfigDto
{
    [JsonPropertyName("defaultOvertimeEnabled")]
    public bool DefaultOvertimeEnabled { get; set; }

    [JsonPropertyName("defaultLateOtEndMinutes")]
    public int DefaultLateOtEndMinutes { get; set; } = 1140;

    [JsonPropertyName("allowEarlyStartOt")]
    public bool AllowEarlyStartOt { get; set; }

    [JsonPropertyName("defaultEarlyStartMinutes")]
    public int DefaultEarlyStartMinutes { get; set; } = 360;
}

public class UiConfigDto
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

public class TeamConfigDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("displayOrder")]
    public int DisplayOrder { get; set; }

    [JsonPropertyName("colour")]
    public string Colour { get; set; } = "#4299e1";

    [JsonPropertyName("averageEfinks")]
    public decimal AverageEfinks { get; set; } = 80;
}

internal class FactoryWorkingHoursJson
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
}

internal class BreakTimesJson
{
    [JsonPropertyName("weekday")]
    public WeekdayBreaksJson? Weekday { get; set; }

    [JsonPropertyName("weekdayOvertime")]
    public WeekdayOvertimeJson? WeekdayOvertime { get; set; }
}

internal class WeekdayBreaksJson
{
    [JsonPropertyName("teaStart")]
    public string? TeaStart { get; set; }

    [JsonPropertyName("teaEnd")]
    public string? TeaEnd { get; set; }

    [JsonPropertyName("lunchStart")]
    public string? LunchStart { get; set; }

    [JsonPropertyName("lunchEnd")]
    public string? LunchEnd { get; set; }
}

internal class WeekdayOvertimeJson
{
    [JsonPropertyName("dinnerStart")]
    public string? DinnerStart { get; set; }

    [JsonPropertyName("dinnerEnd")]
    public string? DinnerEnd { get; set; }
}

internal class GeneralSchedulingJson
{
    [JsonPropertyName("bufferMinutes")]
    public int? BufferMinutes { get; set; }

    [JsonPropertyName("minJobDuration")]
    public int? MinJobDuration { get; set; }

    [JsonPropertyName("durationRoundingIncrement")]
    public int? DurationRoundingIncrement { get; set; }

    [JsonPropertyName("eFinkMultiplier")]
    public decimal? EFinkMultiplier { get; set; }
}

internal class OvertimeDefaultsJson
{
    [JsonPropertyName("defaultOvertimeEnabled")]
    public bool? DefaultOvertimeEnabled { get; set; }

    [JsonPropertyName("defaultLateOtEndTime")]
    public string? DefaultLateOtEndTime { get; set; }

    [JsonPropertyName("allowEarlyStartOt")]
    public bool? AllowEarlyStartOt { get; set; }

    [JsonPropertyName("defaultEarlyStartTime")]
    public string? DefaultEarlyStartTime { get; set; }
}

internal class UiDisplayJson
{
    [JsonPropertyName("pixelsPerMinute")]
    public decimal? PixelsPerMinute { get; set; }

    [JsonPropertyName("visibleHoursBeforeShift")]
    public int? VisibleHoursBeforeShift { get; set; }

    [JsonPropertyName("visibleHoursAfterShift")]
    public int? VisibleHoursAfterShift { get; set; }

    [JsonPropertyName("dayHeaderHeight")]
    public int? DayHeaderHeight { get; set; }
}
