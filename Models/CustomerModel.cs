using System;

namespace MillenniumERP.Models
{
    public class CustomerModel
    {
        public int Id { get; set; }
        public string AccountNo { get; set; } = "";
        public string AccountName { get; set; } = "";
        public string CompanyType { get; set; } = "";
        public string CompanyRegistrationNo { get; set; } = "";
        public string VatRegistrationNo { get; set; } = "";
        public string Phone { get; set; } = "";
        public string Mobile { get; set; } = "";
        public string Email { get; set; } = "";
        public string Website { get; set; } = "";
        public string CustomerStatus { get; set; } = "Prospect";
        public string SalesRepresentative { get; set; } = "";
        public string PrimaryContact { get; set; } = "";
        
        // Address fields
        public string StreetAddress { get; set; } = "";
        public string City { get; set; } = "";
        public string Province { get; set; } = "";
        public string PostalCode { get; set; } = "";
        public string Country { get; set; } = "South Africa";
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        
        // Financial fields
        public decimal CreditLimit { get; set; } = 0;
        public string PaymentTerms { get; set; } = "30 Days";
        public decimal Discount { get; set; } = 0;
        public bool TaxExempt { get; set; } = false;
        public decimal CurrentBalance { get; set; } = 0;
        
        // System fields
        public bool IsActive { get; set; } = true;
        public DateTime CreatedDate { get; set; } = DateTime.Now;
        public DateTime? ModifiedDate { get; set; }
    }
}