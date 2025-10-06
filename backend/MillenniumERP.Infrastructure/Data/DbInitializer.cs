using Microsoft.EntityFrameworkCore;

namespace MillenniumERP.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(AppDbContext context)
    {
        await context.Database.EnsureCreatedAsync();
    }
    
    public static void Initialize(AppDbContext context)
    {
        context.Database.EnsureCreated();
    }
}
