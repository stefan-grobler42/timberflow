using Microsoft.EntityFrameworkCore;
using MillenniumERP.Infrastructure.Data;

if (args.Length > 0)
{
    if (args[0].Equals("seed-job-time-test-data", StringComparison.OrdinalIgnoreCase))
    {
        await JobTimeTestDataSeeder.SeedAsync();
        return;
    }

    if (args[0].Equals("remove-job-time-test-data", StringComparison.OrdinalIgnoreCase))
    {
        await JobTimeTestDataSeeder.RemoveAsync();
        return;
    }
}

Console.WriteLine("Millennium ERP - Database Setup & Migration");
Console.WriteLine("===========================================\n");

var sqliteDbPath = "../MillenniumERP.API/millennium_erp.db";

var options = new DbContextOptionsBuilder<AppDbContext>()
    .UseSqlite($"Data Source={sqliteDbPath}")
    .Options;

using var context = new AppDbContext(options);

Console.WriteLine("1. Creating database schema...");
var created = await context.Database.EnsureCreatedAsync();

if (created)
{
    Console.WriteLine("   ✓ Database created successfully!");
}
else
{
    Console.WriteLine("   ✓ Database already exists");
}

Console.WriteLine("\n2. Verifying tables:");
var tableNames = new[] { "users", "roles", "companies", "customers", "contacts", "activities" };
foreach (var table in tableNames)
{
    Console.WriteLine($"   ✓ {table}");
}

// Get PostgreSQL connection string from environment
var postgresConnectionString = Environment.GetEnvironmentVariable("DATABASE_URL");

if (!string.IsNullOrEmpty(postgresConnectionString))
{
    Console.WriteLine("\n3. Migrating data from PostgreSQL...");
    try
    {
        await DataMigration.MigrateDataAsync(postgresConnectionString, sqliteDbPath);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"   ⚠ Migration error: {ex.Message}");
        Console.WriteLine("   Continuing without data migration...");
    }
}
else
{
    Console.WriteLine("\n3. Skipping data migration (no DATABASE_URL found)");
}

// Verify imported data
await VerifyData.VerifyDatabaseAsync(sqliteDbPath);

Console.WriteLine("\n✓ Database setup complete!");
