namespace MillenniumERP.Infrastructure.Services
{
    public interface ITimezoneService
    {
        DateTime ConvertSastToUtc(DateTime sastDateTime);
        DateTime? ConvertSastToUtc(DateTime? sastDateTime);
        DateTime ConvertUtcToSast(DateTime utcDateTime);
        DateTime? ConvertUtcToSast(DateTime? utcDateTime);
    }

    public class TimezoneService : ITimezoneService
    {
        private static readonly TimeZoneInfo SouthAfricaTimeZone = 
            TimeZoneInfo.FindSystemTimeZoneById("South Africa Standard Time");

        public DateTime ConvertSastToUtc(DateTime sastDateTime)
        {
            if (sastDateTime.Kind == DateTimeKind.Utc)
                return sastDateTime;

            var sastTime = DateTime.SpecifyKind(sastDateTime, DateTimeKind.Unspecified);
            return TimeZoneInfo.ConvertTimeToUtc(sastTime, SouthAfricaTimeZone);
        }

        public DateTime? ConvertSastToUtc(DateTime? sastDateTime)
        {
            return sastDateTime.HasValue ? ConvertSastToUtc(sastDateTime.Value) : null;
        }

        public DateTime ConvertUtcToSast(DateTime utcDateTime)
        {
            if (utcDateTime.Kind != DateTimeKind.Utc)
                utcDateTime = DateTime.SpecifyKind(utcDateTime, DateTimeKind.Utc);

            return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, SouthAfricaTimeZone);
        }

        public DateTime? ConvertUtcToSast(DateTime? utcDateTime)
        {
            return utcDateTime.HasValue ? ConvertUtcToSast(utcDateTime.Value) : null;
        }
    }
}
