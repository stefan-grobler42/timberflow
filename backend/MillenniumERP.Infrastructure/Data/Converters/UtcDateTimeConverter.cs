using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace MillenniumERP.Infrastructure.Data.Converters
{
    public class UtcDateTimeConverter : ValueConverter<DateTime, DateTime>
    {
        private static readonly TimeZoneInfo SouthAfricaTimeZone = 
            TimeZoneInfo.FindSystemTimeZoneById("South Africa Standard Time");

        public UtcDateTimeConverter()
            : base(
                // To database: Convert SAST to UTC if not already UTC
                v => v.Kind == DateTimeKind.Utc 
                    ? v 
                    : TimeZoneInfo.ConvertTimeToUtc(
                        DateTime.SpecifyKind(v, DateTimeKind.Unspecified), 
                        SouthAfricaTimeZone),
                // From database: Ensure UTC kind flag is set
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc))
        {
        }
    }

    public class NullableUtcDateTimeConverter : ValueConverter<DateTime?, DateTime?>
    {
        private static readonly TimeZoneInfo SouthAfricaTimeZone = 
            TimeZoneInfo.FindSystemTimeZoneById("South Africa Standard Time");

        public NullableUtcDateTimeConverter()
            : base(
                // To database: Convert SAST to UTC if not already UTC
                v => !v.HasValue 
                    ? null 
                    : v.Value.Kind == DateTimeKind.Utc 
                        ? v.Value 
                        : TimeZoneInfo.ConvertTimeToUtc(
                            DateTime.SpecifyKind(v.Value, DateTimeKind.Unspecified), 
                            SouthAfricaTimeZone),
                // From database: Ensure UTC kind flag is set
                v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : null)
        {
        }
    }
}
