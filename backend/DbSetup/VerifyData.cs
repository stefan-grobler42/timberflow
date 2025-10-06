using Microsoft.EntityFrameworkCore;
using MillenniumERP.Infrastructure.Data;

public static class VerifyData
{
    public static async Task VerifyDatabaseAsync(string sqliteDbPath)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite($"Data Source={sqliteDbPath}")
            .Options;

        using var context = new AppDbContext(options);

        Console.WriteLine("\n=== Database Verification ===\n");

        var userCount = await context.Users.CountAsync();
        Console.WriteLine($"Users: {userCount}");
        if (userCount > 0)
        {
            var sampleUser = await context.Users.FirstAsync();
            Console.WriteLine($"  Sample: {sampleUser.FirstName} {sampleUser.LastName} ({sampleUser.Email})");
        }

        var companyCount = await context.Companies.CountAsync();
        Console.WriteLine($"\nCompanies: {companyCount}");
        if (companyCount > 0)
        {
            var sampleCompany = await context.Companies.FirstAsync();
            Console.WriteLine($"  Sample: {sampleCompany.Code} - {sampleCompany.Name}");
        }

        var customerCount = await context.Customers.CountAsync();
        Console.WriteLine($"\nCustomers: {customerCount}");
        if (customerCount > 0)
        {
            var sampleCustomer = await context.Customers.FirstAsync();
            Console.WriteLine($"  Sample: {sampleCustomer.AccountNo} - {sampleCustomer.AccountName}");
        }

        Console.WriteLine("\n✓ Verification complete!");
    }
}
