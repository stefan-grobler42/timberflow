using Microsoft.EntityFrameworkCore;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data.Converters;

namespace MillenniumERP.Infrastructure.Data;

public class AppDbContext : DbContext
{
    static AppDbContext()
    {
        AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", false);
    }

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
    
    // System configuration
    public DbSet<SystemSetting> SystemSettings { get; set; }
    
    // D365 Sync tracking
    public DbSet<SyncHistory> SyncHistories { get; set; }
    
    // Production Planner allocation tables
    public DbSet<TeamDay> TeamDays { get; set; }
    public DbSet<TeamDayAllocation> TeamDayAllocations { get; set; }
    
    // Production audit trail
    public DbSet<ProductionAudit> ProductionAudits { get; set; }
    
    // Schedule blocks for non-job time blocks
    public DbSet<ScheduleBlock> ScheduleBlocks { get; set; }
    
    // Team Work Items (WIP) for active job scheduling
    public DbSet<TeamWorkItem> TeamWorkItems { get; set; }
    
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

        // Production relationships
        modelBuilder.Entity<Production>(entity =>
        {
            entity.HasOne(p => p.Order)
                  .WithMany(o => o.Productions)
                  .HasForeignKey(p => p.Orderno)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(p => p.CustomerAccount)
                  .WithMany(a => a.Productions)
                  .HasForeignKey(p => p.Customer)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(p => p.PickingTeam)
                  .WithMany()
                  .HasForeignKey(p => p.PickingTeamId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(p => p.SawTeam)
                  .WithMany()
                  .HasForeignKey(p => p.SawId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(p => p.JigTeam)
                  .WithMany()
                  .HasForeignKey(p => p.JigId)
                  .OnDelete(DeleteBehavior.SetNull);

            // Employee relationships with explicit navigation names
            entity.HasOne(p => p.PickingMasterEmployee)
                  .WithMany()
                  .HasForeignKey(p => p.Pickingmaster)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(p => p.PickingHelper1Employee)
                  .WithMany()
                  .HasForeignKey(p => p.Pickinghelper1)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(p => p.PickingHelper2Employee)
                  .WithMany()
                  .HasForeignKey(p => p.Pickinghelper2)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(p => p.PickingHelper3Employee)
                  .WithMany()
                  .HasForeignKey(p => p.Pickinghelper3)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(p => p.SawOperatorEmployee)
                  .WithMany()
                  .HasForeignKey(p => p.Sawoperator)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(p => p.SawHelper1Employee)
                  .WithMany()
                  .HasForeignKey(p => p.Sawhelper1)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(p => p.SawHelper2Employee)
                  .WithMany()
                  .HasForeignKey(p => p.Sawhelper2)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(p => p.JigLeaderEmployee)
                  .WithMany()
                  .HasForeignKey(p => p.Jigleader)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(p => p.JigHelper1Employee)
                  .WithMany()
                  .HasForeignKey(p => p.Jighelper1)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(p => p.JigHelper2Employee)
                  .WithMany()
                  .HasForeignKey(p => p.Jighelper2)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(p => p.JigHelper3Employee)
                  .WithMany()
                  .HasForeignKey(p => p.Jighelper3)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(p => p.JigHelper4Employee)
                  .WithMany()
                  .HasForeignKey(p => p.Jighelper4)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // D365Order relationships
        modelBuilder.Entity<D365Order>(entity =>
        {
            entity.HasOne(o => o.Customer)
                  .WithMany(a => a.Orders)
                  .HasForeignKey(o => o.CustomerId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(o => o.Quote)
                  .WithMany(q => q.Orders)
                  .HasForeignKey(o => o.QuoteId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Delivery relationships
        modelBuilder.Entity<Delivery>(entity =>
        {
            entity.HasOne(d => d.OrderByOrderno)
                  .WithMany()
                  .HasForeignKey(d => d.Orderno)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(d => d.OrderBySalesorder)
                  .WithMany(o => o.Deliveries)
                  .HasForeignKey(d => d.Salesorder)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(d => d.CustomerAccount)
                  .WithMany(a => a.Deliveries)
                  .HasForeignKey(d => d.Customer)
                  .OnDelete(DeleteBehavior.SetNull);

            // Employee relationships
            entity.HasOne(d => d.DriverEmployee)
                  .WithMany()
                  .HasForeignKey(d => d.Driver)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(d => d.Helper1Employee)
                  .WithMany()
                  .HasForeignKey(d => d.Helper1)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(d => d.Helper2Employee)
                  .WithMany()
                  .HasForeignKey(d => d.Helper2)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(d => d.Helper3Employee)
                  .WithMany()
                  .HasForeignKey(d => d.Helper3)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(d => d.Helper4Employee)
                  .WithMany()
                  .HasForeignKey(d => d.Helper)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(d => d.Helper5Employee)
                  .WithMany()
                  .HasForeignKey(d => d.Helper5)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(d => d.LoadmasterEmployee)
                  .WithMany()
                  .HasForeignKey(d => d.Loadmaster)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(d => d.DispatchManagerEmployee)
                  .WithMany()
                  .HasForeignKey(d => d.Dispatchmanager)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(d => d.SecurityEmployee)
                  .WithMany()
                  .HasForeignKey(d => d.Security)
                  .OnDelete(DeleteBehavior.SetNull);

            // Vehicle relationships
            entity.HasOne(d => d.VehicleInfo)
                  .WithMany()
                  .HasForeignKey(d => d.Vehicle)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(d => d.TrailerInfo)
                  .WithMany()
                  .HasForeignKey(d => d.Trailer)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Logistics relationships
        modelBuilder.Entity<Logistics>(entity =>
        {
            entity.HasOne(l => l.DriverEmployee)
                  .WithMany()
                  .HasForeignKey(l => l.Driver)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(l => l.Helper1Employee)
                  .WithMany()
                  .HasForeignKey(l => l.Helper1)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(l => l.Helper2Employee)
                  .WithMany()
                  .HasForeignKey(l => l.Helper2)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(l => l.Helper3Employee)
                  .WithMany()
                  .HasForeignKey(l => l.Helper3)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(l => l.Helper4Employee)
                  .WithMany()
                  .HasForeignKey(l => l.Helper4)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(l => l.Helper5Employee)
                  .WithMany()
                  .HasForeignKey(l => l.Helper5)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(l => l.LoadmasterEmployee)
                  .WithMany()
                  .HasForeignKey(l => l.Loadmaster)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(l => l.DispatchManagerEmployee)
                  .WithMany()
                  .HasForeignKey(l => l.Dispatchmanager)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(l => l.SecurityEmployee)
                  .WithMany()
                  .HasForeignKey(l => l.Security)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(l => l.VehicleInfo)
                  .WithMany()
                  .HasForeignKey(l => l.Vehicle)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(l => l.TrailerInfo)
                  .WithMany()
                  .HasForeignKey(l => l.Trailer)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Tender relationships
        modelBuilder.Entity<Tender>(entity =>
        {
            entity.HasOne(t => t.CustomerAccount)
                  .WithMany(a => a.Tenders)
                  .HasForeignKey(t => t.Customer)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(t => t.ContactPerson)
                  .WithMany()
                  .HasForeignKey(t => t.Contact)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(t => t.Quote)
                  .WithMany(q => q.Tenders)
                  .HasForeignKey(t => t.Quoteno)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(t => t.DesignerPerson)
                  .WithMany()
                  .HasForeignKey(t => t.NewDesigner)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Account relationships
        modelBuilder.Entity<Account>(entity =>
        {
            // PrimaryContactIdValue links to D365Contact (not legacy Contact)
            entity.HasOne(a => a.PrimaryContact)
                  .WithMany()
                  .HasForeignKey(a => a.PrimaryContactIdValue)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(a => a.ParentAccount)
                  .WithMany(a => a.ChildAccounts)
                  .HasForeignKey(a => a.ParentAccountIdValue)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(a => a.SalesRep)
                  .WithMany()
                  .HasForeignKey(a => a.Cr694SalesRepresentativeValue)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // D365Quote relationships
        modelBuilder.Entity<D365Quote>(entity =>
        {
            entity.HasOne(q => q.Customer)
                  .WithMany(a => a.Quotes)
                  .HasForeignKey(q => q.CustomerId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // D365Contact relationships
        modelBuilder.Entity<D365Contact>(entity =>
        {
            entity.HasOne(c => c.ParentAccount)
                  .WithMany(a => a.Contacts)
                  .HasForeignKey(c => c.ParentCustomerId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // TeamDay configuration
        modelBuilder.Entity<TeamDay>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TeamId, e.WorkDate }).IsUnique();
            
            entity.HasOne(e => e.Team)
                  .WithMany()
                  .HasForeignKey(e => e.TeamId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.Allocations)
                  .WithOne(a => a.TeamDay)
                  .HasForeignKey(a => a.TeamDayId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // TeamDayAllocation configuration
        modelBuilder.Entity<TeamDayAllocation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TeamDayId, e.Sequence });
            entity.HasIndex(e => e.ProductionId);

            entity.HasOne(e => e.TeamDay)
                  .WithMany(td => td.Allocations)
                  .HasForeignKey(e => e.TeamDayId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Production)
                  .WithMany()
                  .HasForeignKey(e => e.ProductionId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.OverflowToAllocation)
                  .WithMany()
                  .HasForeignKey(e => e.OverflowToAllocationId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.OverflowFromAllocation)
                  .WithMany()
                  .HasForeignKey(e => e.OverflowFromAllocationId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // ProductionAudit configuration
        modelBuilder.Entity<ProductionAudit>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ProductionId);
            entity.HasIndex(e => e.BatchId);
            entity.HasIndex(e => e.ChangedOn);

            entity.HasOne(e => e.Production)
                  .WithMany()
                  .HasForeignKey(e => e.ProductionId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.OldJig)
                  .WithMany()
                  .HasForeignKey(e => e.OldJigId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.NewJig)
                  .WithMany()
                  .HasForeignKey(e => e.NewJigId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // ScheduleBlock configuration
        modelBuilder.Entity<ScheduleBlock>(entity =>
        {
            entity.ToTable("schedule_blocks");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.DateStr);

            entity.HasOne(e => e.Team)
                  .WithMany()
                  .HasForeignKey(e => e.TeamId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.RelatedProduction)
                  .WithMany()
                  .HasForeignKey(e => e.RelatedProductionId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // TeamWorkItem configuration
        modelBuilder.Entity<TeamWorkItem>(entity =>
        {
            entity.ToTable("team_work_items");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TeamId, e.WorkDate });
            entity.HasIndex(e => e.ProductionId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.WorkDate);

            entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue("scheduled");
            entity.Property(e => e.TimberCubes).HasPrecision(18, 4);
            entity.Property(e => e.ActualEfinks).HasPrecision(18, 4);

            entity.HasOne(e => e.Production)
                  .WithMany()
                  .HasForeignKey(e => e.ProductionId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Team)
                  .WithMany()
                  .HasForeignKey(e => e.TeamId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.ParentWip)
                  .WithMany()
                  .HasForeignKey(e => e.ParentWipId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // SyncHistory configuration
        modelBuilder.Entity<SyncHistory>(entity =>
        {
            entity.ToTable("sync_history");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.EntityName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.LastAttemptStatus).HasMaxLength(50).IsRequired();
            entity.HasIndex(e => e.EntityName);
        });

        // Apply UTC DateTime converter to all DateTime and DateTime? properties
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime))
                {
                    property.SetValueConverter(new UtcDateTimeConverter());
                }
                else if (property.ClrType == typeof(DateTime?))
                {
                    property.SetValueConverter(new NullableUtcDateTimeConverter());
                }
            }
        }
    }
}
