using Microsoft.EntityFrameworkCore;
using MillenniumERP.Domain.Entities;

namespace MillenniumERP.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }
    
    public DbSet<User> Users { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<Company> Companies { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<Contact> Contacts { get; set; }
    public DbSet<Activity> Activities { get; set; }
    
    // Millennium Roofing custom entities from Dynamics 365
    public DbSet<Designer> Designers { get; set; }
    public DbSet<SaleRepresentative> SaleRepresentatives { get; set; }
    public DbSet<Vehicles> Vehicles { get; set; }
    public DbSet<Employee> Employees { get; set; }
    public DbSet<QuoteMRoofing> QuotesMRoofing { get; set; }
    public DbSet<Tender> Tenders { get; set; }
    public DbSet<PricingCalculation> PricingCalculations { get; set; }
    public DbSet<InstallationProgress> InstallationProgresses { get; set; }
    public DbSet<Production> Productions { get; set; }
    public DbSet<Logistics> Logistics { get; set; }
    public DbSet<Delivery> Deliveries { get; set; }
    
    // Production lookup tables
    public DbSet<PickingTeam> PickingTeams { get; set; }
    public DbSet<Saw> Saws { get; set; }
    public DbSet<Jig> Jigs { get; set; }
    
    // Dynamics 365 standard entities
    public DbSet<Account> Accounts { get; set; }
    public DbSet<D365Contact> D365Contacts { get; set; }
    public DbSet<D365Quote> D365Quotes { get; set; }
    public DbSet<D365QuoteDetail> D365QuoteDetails { get; set; }
    public DbSet<D365Order> D365Orders { get; set; }
    public DbSet<D365Product> D365Products { get; set; }
    public DbSet<D365Appointment> D365Appointments { get; set; }
    public DbSet<D365Email> D365Emails { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserCode).HasMaxLength(50).IsRequired();
            entity.Property(e => e.FirstName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.LastName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Role).HasMaxLength(50).IsRequired();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.UserCode).IsUnique();
        });
        
        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("roles");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.HasIndex(e => e.Code).IsUnique();
        });
        
        modelBuilder.Entity<Company>(entity =>
        {
            entity.ToTable("companies");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.HasIndex(e => e.Code).IsUnique();
        });
        
        modelBuilder.Entity<Customer>(entity =>
        {
            entity.ToTable("customers");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.AccountNo).HasMaxLength(50).IsRequired();
            entity.Property(e => e.AccountName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.CreditLimit).HasPrecision(18, 2);
            entity.Property(e => e.Discount).HasPrecision(5, 2);
            entity.Property(e => e.CurrentBalance).HasPrecision(18, 2);
            entity.HasIndex(e => e.AccountNo).IsUnique();
            
            entity.HasOne(e => e.CompanyType)
                  .WithMany()
                  .HasForeignKey(e => e.CompanyTypeId)
                  .OnDelete(DeleteBehavior.SetNull);
                  
            entity.HasOne(e => e.SalesRepresentative)
                  .WithMany()
                  .HasForeignKey(e => e.SalesRepresentativeId)
                  .OnDelete(DeleteBehavior.SetNull);
                  
            entity.HasOne(e => e.PrimaryContact)
                  .WithMany()
                  .HasForeignKey(e => e.PrimaryContactId)
                  .OnDelete(DeleteBehavior.SetNull);
        });
        
        modelBuilder.Entity<Contact>(entity =>
        {
            entity.ToTable("contacts");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FirstName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.LastName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(255);
            
            entity.HasOne(e => e.Customer)
                  .WithMany(c => c.Contacts)
                  .HasForeignKey(e => e.CustomerId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
        
        modelBuilder.Entity<Activity>(entity =>
        {
            entity.ToTable("activities");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ActivityType).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Subject).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Priority).HasMaxLength(50).IsRequired();
            
            entity.HasOne(e => e.Customer)
                  .WithMany(c => c.Activities)
                  .HasForeignKey(e => e.CustomerId)
                  .OnDelete(DeleteBehavior.SetNull);
                  
            entity.HasOne(e => e.AssignedToUser)
                  .WithMany()
                  .HasForeignKey(e => e.AssignedToUserId)
                  .OnDelete(DeleteBehavior.SetNull);
                  
            entity.HasOne(e => e.CreatedByUser)
                  .WithMany()
                  .HasForeignKey(e => e.CreatedByUserId)
                  .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
