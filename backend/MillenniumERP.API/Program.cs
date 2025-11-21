using Microsoft.EntityFrameworkCore;
using MillenniumERP.Infrastructure.Data;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

// Add DbContext with PostgreSQL - parse DATABASE_URL properly
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
string connectionString;

if (!string.IsNullOrEmpty(databaseUrl))
{
    // Parse the DATABASE_URL (postgresql://user:pass@host:port/dbname?params)
    var uri = new Uri(databaseUrl.Replace("?sslmode", "?sslmode=require")); // Fix malformed parameter
    var userInfo = uri.UserInfo.Split(':');
    var connBuilder = new NpgsqlConnectionStringBuilder
    {
        Host = uri.Host,
        Port = uri.Port > 0 ? uri.Port : 5432,
        Username = Uri.UnescapeDataString(userInfo[0]),
        Password = Uri.UnescapeDataString(userInfo[1]),
        Database = uri.AbsolutePath.TrimStart('/').Split('?')[0], // Remove query params
        SslMode = SslMode.Require
    };
    connectionString = connBuilder.ConnectionString;
}
else
{
    connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
        ?? throw new InvalidOperationException("No database connection string configured");
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.AllowReadingFromString;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddAuthorization();

// Configure Kestrel to bind to port 8000 on IPv4
builder.WebHost.ConfigureKestrel(options =>
{
    options.Listen(System.Net.IPAddress.Any, 8000);
});

// Configure CORS to allow frontend origin
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5000", "http://127.0.0.1:5173", "http://127.0.0.1:5000")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// TODO: Add Authentication when implementing JWT (Task 5)
// builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
//     .AddJwtBearer(options => { /* JWT config */ });

var app = builder.Build();

// Initialize database
// NOTE: Using EnsureCreatedAsync() for development - it creates the database if it doesn't exist
// and preserves data between restarts. However, this does NOT support schema migrations.
// TODO: For production, implement EF Core migrations:
//   1. Install dotnet-ef tools: dotnet tool install --global dotnet-ef
//   2. Create initial migration: dotnet ef migrations add InitialCreate
//   3. Replace EnsureCreatedAsync() with Database.MigrateAsync()
// This will allow automatic schema updates without data loss when entities change.
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await dbContext.Database.EnsureCreatedAsync();
    
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    logger.LogInformation("Database initialized successfully");
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Use CORS before authentication and authorization
app.UseCors("AllowFrontend");

// TODO: Enable authentication middleware after configuring services (Task 5)
// app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
