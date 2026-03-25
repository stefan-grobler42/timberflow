using Microsoft.EntityFrameworkCore;
using MillenniumERP.API.Services;
using MillenniumERP.Infrastructure.Data;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

var isProduction = builder.Environment.IsProduction();

// Add DbContext with PostgreSQL using individual environment variables
var pgHost = Environment.GetEnvironmentVariable("PGHOST");
var pgPort = Environment.GetEnvironmentVariable("PGPORT");
var pgUser = Environment.GetEnvironmentVariable("PGUSER");
var pgPassword = Environment.GetEnvironmentVariable("PGPASSWORD");
var pgDatabase = Environment.GetEnvironmentVariable("PGDATABASE");

string connectionString;

if (!string.IsNullOrEmpty(pgHost) && !string.IsNullOrEmpty(pgUser) && !string.IsNullOrEmpty(pgPassword))
{
    // Use individual PostgreSQL environment variables (more reliable than DATABASE_URL)
    var connBuilder = new NpgsqlConnectionStringBuilder
    {
        Host = pgHost,
        Port = int.TryParse(pgPort, out var port) ? port : 5432,
        Username = pgUser,
        Password = pgPassword,
        Database = pgDatabase ?? "neondb",
        SslMode = SslMode.Disable,
        // Connection pooling and resilience settings for large result sets
        Pooling = true,
        MinPoolSize = 1,
        MaxPoolSize = 20,
        ConnectionIdleLifetime = 300,
        ConnectionPruningInterval = 10,
        // Increase timeouts for large data transfers
        Timeout = 60,
        CommandTimeout = 60,
        // Keep alive to prevent connection termination
        KeepAlive = 30
    };
    connectionString = connBuilder.ConnectionString;
}
else
{
    connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
        ?? throw new InvalidOperationException("No database connection string configured");
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        // Enable retry on transient failures
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorCodesToAdd: null);
        // Increase command timeout for large queries
        npgsqlOptions.CommandTimeout(60);
    }));

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.AllowReadingFromString;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddAuthorization();

// Configure Kestrel - port 5000 for production (Replit), port 8000 for development
builder.WebHost.ConfigureKestrel(options =>
{
    var port = isProduction ? 5000 : 8000;
    options.Listen(System.Net.IPAddress.Any, port);
});

// Configure CORS to allow frontend origin
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        if (isProduction)
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
        else
        {
            policy.WithOrigins("http://localhost:5173", "http://localhost:5000", "http://127.0.0.1:5173", "http://127.0.0.1:5000")
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
    });
});

// TODO: Add Authentication when implementing JWT (Task 5)
// builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
//     .AddJwtBearer(options => { /* JWT config */ });

builder.Services.AddHostedService<DynamicsSyncScheduler>();

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

// Serve React SPA static files from wwwroot - MUST be before routing
var wwwrootPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
app.Logger.LogInformation("Content root path: {Path}", app.Environment.ContentRootPath);
app.Logger.LogInformation("Looking for wwwroot at: {Path}", wwwrootPath);

app.UseDefaultFiles();
app.UseStaticFiles();

// TODO: Enable authentication middleware after configuring services (Task 5)
// app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Fallback to index.html for SPA client-side routing
app.MapFallbackToFile("index.html");

app.Run();
