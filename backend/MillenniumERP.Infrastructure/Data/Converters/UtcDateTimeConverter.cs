using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Runtime.InteropServices;

namespace MillenniumERP.Infrastructure.Data.Converters
{
    public class UtcDateTimeConverter : ValueConverter<DateTime, DateTime>
    {
        private static readonly TimeZoneInfo SouthAfricaTimeZone = GetSouthAfricaTimeZone();

        private static TimeZoneInfo GetSouthAfricaTimeZone()
        {
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                return TimeZoneInfo.FindSystemTimeZoneById("South Africa Standard Time");
            }
            else
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Africa/Johannesburg");
            }
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
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                return TimeZoneInfo.FindSystemTimeZoneById("South Africa Standard Time");
            }
            else
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Africa/Johannesburg");
            }
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
