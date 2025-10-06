using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();
builder.Services.AddRazorPages();

// Add Blazor Server services
builder.Services.AddServerSideBlazor();

// Add HttpClient for Blazor components
builder.Services.AddScoped(sp => new HttpClient 
{ 
    BaseAddress = new Uri(sp.GetRequiredService<IHttpContextAccessor>().HttpContext?.Request.Scheme + "://" + sp.GetRequiredService<IHttpContextAccessor>().HttpContext?.Request.Host.ToString() ?? "http://localhost:5000")
});

// Add HttpContextAccessor
builder.Services.AddHttpContextAccessor();

// Add CORS for API access
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Configure JSON options
builder.Services.Configure<JsonOptions>(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = null;
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseStaticFiles();
app.UseRouting();
app.UseCors();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.MapRazorPages();
app.MapBlazorHub();

// Configure to listen on port 5000 and bind to all interfaces
app.Urls.Clear();
app.Urls.Add("http://0.0.0.0:5000");

app.Run();