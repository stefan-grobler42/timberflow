namespace MillenniumERP.Domain.Entities;

public class Customer
{
    public int Id { get; set; }
    public string AccountNo { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public int? CompanyTypeId { get; set; }
    public string? CompanyRegistrationNo { get; set; }
    public string? VatRegistrationNo { get; set; }
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string CustomerStatus { get; set; } = "Prospect";
    public int? SalesRepresentativeId { get; set; }
    public int? PrimaryContactId { get; set; }
    
    public string? StreetAddress { get; set; }
    public string? City { get; set; }
    public string? Province { get; set; }
    public string? PostalCode { get; set; }
    public string Country { get; set; } = "South Africa";
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    
    public decimal CreditLimit { get; set; } = 0;
    public string PaymentTerms { get; set; } = "30 Days";
    public decimal Discount { get; set; } = 0;
    public bool TaxExempt { get; set; } = false;
    public decimal CurrentBalance { get; set; } = 0;
    
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    public Company? CompanyType { get; set; }
    public User? SalesRepresentative { get; set; }
    public Contact? PrimaryContact { get; set; }
    public ICollection<Contact> Contacts { get; set; } = new List<Contact>();
    public ICollection<Activity> Activities { get; set; } = new List<Activity>();
}
