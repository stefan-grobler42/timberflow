using Microsoft.EntityFrameworkCore;
using MillenniumERP.Infrastructure.Data;

var options = new DbContextOptionsBuilder<AppDbContext>()
    .UseSqlite("Data Source=millennium_erp.db")
    .Options;

using var context = new AppDbContext(options);

Console.WriteLine("Creating database...");
DbInitializer.Initialize(context);
Console.WriteLine("Database created successfully!");

Console.WriteLine("\nDatabase tables:");
var tables = new[] { "users", "roles", "companies", "customers", "contacts", "activities" };
foreach (var table in tables)
{
    Console.WriteLine($"  - {table}");
}
