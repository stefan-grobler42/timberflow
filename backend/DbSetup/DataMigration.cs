using Npgsql;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Infrastructure.Data;
using MillenniumERP.Domain.Entities;

public class DataMigration
{
    public static async Task MigrateDataAsync(string postgresConnectionString, string sqliteDbPath, bool forceReset = false)
    {
        Console.WriteLine("Starting data migration from PostgreSQL to SQLite...\n");
        
        // Convert PostgreSQL URI to Npgsql connection string format
        var npgsqlConnectionString = ConvertPostgresUri(postgresConnectionString);
        
        // Setup SQLite context
        var sqliteOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite($"Data Source={sqliteDbPath}")
            .Options;
        
        using var sqliteContext = new AppDbContext(sqliteOptions);
        
        // Check if data already exists
        var existingUsers = await sqliteContext.Users.CountAsync();
        var existingCompanies = await sqliteContext.Companies.CountAsync();
        var existingCustomers = await sqliteContext.Customers.CountAsync();
        
        if (existingUsers > 0 || existingCompanies > 0 || existingCustomers > 0)
        {
            if (!forceReset)
            {
                Console.WriteLine("⚠ Database already contains data:");
                Console.WriteLine($"   - {existingUsers} users");
                Console.WriteLine($"   - {existingCompanies} companies");
                Console.WriteLine($"   - {existingCustomers} customers");
                Console.WriteLine("   Skipping migration. Delete the database file to re-import.");
                return;
            }
            
            Console.WriteLine("🔄 Resetting existing data...");
            sqliteContext.Users.RemoveRange(sqliteContext.Users);
            sqliteContext.Companies.RemoveRange(sqliteContext.Companies);
            sqliteContext.Customers.RemoveRange(sqliteContext.Customers);
            await sqliteContext.SaveChangesAsync();
            Console.WriteLine("   ✓ Tables cleared");
        }
        
        // Migrate Users (from employees table)
        Console.WriteLine("\nMigrating users...");
        await MigrateUsersAsync(npgsqlConnectionString, sqliteContext);
        
        // Migrate Companies (from company_types table)
        Console.WriteLine("Migrating companies...");
        await MigrateCompaniesAsync(npgsqlConnectionString, sqliteContext);
        
        // Migrate Customers
        Console.WriteLine("Migrating customers...");
        await MigrateCustomersAsync(npgsqlConnectionString, sqliteContext);
        
        Console.WriteLine("\n✓ Data migration complete!");
    }
    
    private static string ConvertPostgresUri(string uri)
    {
        // postgresql://user:password@host:port/database?param=value
        if (!uri.StartsWith("postgresql://") && !uri.StartsWith("postgres://"))
        {
            return uri; // Already in correct format
        }
        
        var parsedUri = new Uri(uri);
        var userInfo = parsedUri.UserInfo.Split(':');
        var username = userInfo[0];
        var password = userInfo.Length > 1 ? userInfo[1] : "";
        var host = parsedUri.Host;
        var port = parsedUri.Port > 0 ? parsedUri.Port : 5432;
        var database = parsedUri.AbsolutePath.TrimStart('/');
        var query = parsedUri.Query.TrimStart('?');
        
        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = host,
            Port = port,
            Database = database,
            Username = username,
            Password = password,
            SslMode = SslMode.Require
        };
        
        // Parse query parameters
        if (!string.IsNullOrEmpty(query))
        {
            foreach (var param in query.Split('&'))
            {
                var parts = param.Split('=');
                if (parts.Length == 2)
                {
                    if (parts[0].Equals("sslmode", StringComparison.OrdinalIgnoreCase))
                    {
                        builder.SslMode = parts[1].ToLower() switch
                        {
                            "require" => SslMode.Require,
                            "prefer" => SslMode.Prefer,
                            "disable" => SslMode.Disable,
                            _ => SslMode.Require
                        };
                    }
                }
            }
        }
        
        return builder.ToString();
    }
    
    private static async Task MigrateUsersAsync(string connectionString, AppDbContext context)
    {
        using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        
        var command = new NpgsqlCommand(@"
            SELECT id, employee_code, first_name, last_name, email, phone, 
                   department, position, role, is_active, hire_date, address, 
                   emergency_contact, emergency_phone, created_at, updated_at
            FROM employees WHERE is_active = true", connection);
        
        using var reader = await command.ExecuteReaderAsync();
        var users = new List<User>();
        
        while (await reader.ReadAsync())
        {
            var user = new User
            {
                Id = reader.GetInt32(0),
                UserCode = reader.GetString(1),
                FirstName = reader.GetString(2),
                LastName = reader.GetString(3),
                Email = reader.GetString(4),
                Phone = reader.IsDBNull(5) ? null : reader.GetString(5),
                Department = reader.IsDBNull(6) ? null : reader.GetString(6),
                Position = reader.IsDBNull(7) ? null : reader.GetString(7),
                Role = reader.GetString(8),
                IsActive = reader.GetBoolean(9),
                HireDate = reader.IsDBNull(10) ? null : reader.GetDateTime(10),
                Address = reader.IsDBNull(11) ? null : reader.GetString(11),
                EmergencyContact = reader.IsDBNull(12) ? null : reader.GetString(12),
                EmergencyPhone = reader.IsDBNull(13) ? null : reader.GetString(13),
                CreatedAt = reader.GetDateTime(14),
                UpdatedAt = reader.IsDBNull(15) ? null : reader.GetDateTime(15)
            };
            users.Add(user);
        }
        
        if (users.Any())
        {
            context.Users.AddRange(users);
            await context.SaveChangesAsync();
            Console.WriteLine($"  ✓ Migrated {users.Count} users");
        }
        else
        {
            Console.WriteLine("  ℹ No users found to migrate");
        }
    }
    
    private static async Task MigrateCompaniesAsync(string connectionString, AppDbContext context)
    {
        using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        
        var command = new NpgsqlCommand(@"
            SELECT id, code, name, description, is_active, sort_order, created_at, updated_at
            FROM company_types WHERE is_active = true", connection);
        
        using var reader = await command.ExecuteReaderAsync();
        var companies = new List<Company>();
        
        while (await reader.ReadAsync())
        {
            var company = new Company
            {
                Id = reader.GetInt32(0),
                Code = reader.GetString(1),
                Name = reader.GetString(2),
                Description = reader.IsDBNull(3) ? null : reader.GetString(3),
                IsActive = reader.GetBoolean(4),
                SortOrder = reader.IsDBNull(5) ? 0 : reader.GetInt32(5),
                CreatedAt = reader.IsDBNull(6) ? DateTime.UtcNow : reader.GetDateTime(6),
                UpdatedAt = reader.IsDBNull(7) ? null : reader.GetDateTime(7)
            };
            companies.Add(company);
        }
        
        if (companies.Any())
        {
            context.Companies.AddRange(companies);
            await context.SaveChangesAsync();
            Console.WriteLine($"  ✓ Migrated {companies.Count} companies");
        }
        else
        {
            Console.WriteLine("  ℹ No companies found to migrate");
        }
    }
    
    private static async Task MigrateCustomersAsync(string connectionString, AppDbContext context)
    {
        using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        
        var command = new NpgsqlCommand(@"
            SELECT id, customer_code as account_no, name as account_name, company_name, 
                   email, phone, address as street_address, city, province, postal_code, country,
                   status as customer_status, customer_type_id, created_at, updated_at
            FROM customers", connection);
        
        using var reader = await command.ExecuteReaderAsync();
        var customers = new List<Customer>();
        
        while (await reader.ReadAsync())
        {
            var customer = new Customer
            {
                Id = reader.GetInt32(0),
                AccountNo = reader.GetString(1),
                AccountName = reader.GetString(2),
                CompanyTypeId = reader.IsDBNull(12) ? null : reader.GetInt32(12),
                Email = reader.IsDBNull(4) ? null : reader.GetString(4),
                Phone = reader.IsDBNull(5) ? null : reader.GetString(5),
                StreetAddress = reader.IsDBNull(6) ? null : reader.GetString(6),
                City = reader.IsDBNull(7) ? null : reader.GetString(7),
                Province = reader.IsDBNull(8) ? null : reader.GetString(8),
                PostalCode = reader.IsDBNull(9) ? null : reader.GetString(9),
                Country = reader.IsDBNull(10) ? "South Africa" : reader.GetString(10),
                CustomerStatus = reader.IsDBNull(11) ? "Prospect" : reader.GetString(11),
                IsActive = true,
                CreatedAt = reader.GetDateTime(13),
                UpdatedAt = reader.IsDBNull(14) ? null : reader.GetDateTime(14)
            };
            customers.Add(customer);
        }
        
        if (customers.Any())
        {
            context.Customers.AddRange(customers);
            await context.SaveChangesAsync();
            Console.WriteLine($"  ✓ Migrated {customers.Count} customers");
        }
        else
        {
            Console.WriteLine("  ℹ No customers found to migrate");
        }
    }
}
