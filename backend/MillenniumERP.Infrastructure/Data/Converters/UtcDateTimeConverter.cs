using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Runtime.InteropServices;

namespace MillenniumERP.Infrastructure.Data.Converters
{
    public class UtcDateTimeConverter : ValueConverter<DateTime, DateTime>
    {
        private static readonly TimeZoneInfo SouthAfricaTimeZone = GetSouthAfricaTimeZone();

        private static TimeZoneInfo GetSouthAfricaTimeZone()
        {
            // Try multiple timezone identifiers
            string[] tzIds = RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                ? new[] { "South Africa Standard Time" }
                : new[] { "Africa/Johannesburg", "Etc/GMT-2" };

            foreach (var tzId in tzIds)
            {
                try
                {
                    return TimeZoneInfo.FindSystemTimeZoneById(tzId);
                }
                catch (TimeZoneNotFoundException)
                {
                    continue;
                }
            }

            // Fallback: Create a custom timezone for SAST (UTC+2, no daylight saving)
            return TimeZoneInfo.CreateCustomTimeZone(
                "SAST",
                TimeSpan.FromHours(2),
                "South Africa Standard Time",
                "South Africa Standard Time"
            );
        }

        public UtcDateTimeConverter()
            : base(
                v => v.Kind == DateTimeKind.Utc 
                    ? v 
                    : TimeZoneInfo.ConvertTimeToUtc(
                        DateTime.SpecifyKind(v, DateTimeKind.Unspecified), 
                        SouthAfricaTimeZone),
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc))
        {
        }
    }

    public class NullableUtcDateTimeConverter : ValueConverter<DateTime?, DateTime?>
    {
        private static readonly TimeZoneInfo SouthAfricaTimeZone = GetSouthAfricaTimeZone();

        private static TimeZoneInfo GetSouthAfricaTimeZone()
        {
            // Try multiple timezone identifiers
            string[] tzIds = RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                ? new[] { "South Africa Standard Time" }
                : new[] { "Africa/Johannesburg", "Etc/GMT-2" };

            foreach (var tzId in tzIds)
            {
                try
                {
                    return TimeZoneInfo.FindSystemTimeZoneById(tzId);
                }
                catch (TimeZoneNotFoundException)
                {
                    continue;
                }
            }

            // Fallback: Create a custom timezone for SAST (UTC+2, no daylight saving)
            return TimeZoneInfo.CreateCustomTimeZone(
                "SAST",
                TimeSpan.FromHours(2),
                "South Africa Standard Time",
                "South Africa Standard Time"
            );
        }

        public NullableUtcDateTimeConverter()
            : base(
                v => !v.HasValue 
                    ? null 
                    : v.Value.Kind == DateTimeKind.Utc 
                        ? v.Value 
                        : TimeZoneInfo.ConvertTimeToUtc(
                            DateTime.SpecifyKind(v.Value, DateTimeKind.Unspecified), 
                            SouthAfricaTimeZone),
                v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : null)
        {
        }
    }
}
