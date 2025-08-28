using System;
using System.ComponentModel.DataAnnotations;

namespace MillenniumERP.Models
{
    public class CustomerViewModel
    {
        public int Id { get; set; }
        
        [Required]
        [Display(Name = "Account Name")]
        public string AccountName { get; set; }
        
        [Display(Name = "Account Number")]
        public string AccountNo { get; set; }
        
        [Display(Name = "Company Type")]
        public string CompanyType { get; set; }
        
        [Display(Name = "Company Registration No")]
        public string CompanyRegistrationNo { get; set; }
        
        [Display(Name = "VAT Registration No")]
        public string VatRegistrationNo { get; set; }
        
        [Phone]
        public string Phone { get; set; }
        
        public string Mobile { get; set; }
        
        [EmailAddress]
        public string Email { get; set; }
        
        [Url]
        public string Website { get; set; }
        
        [Display(Name = "Customer Status")]
        public string CustomerStatus { get; set; }
        
        [Display(Name = "Sales Representative")]
        public string SalesRepresentative { get; set; }
        
        [Display(Name = "Primary Contact")]
        public string PrimaryContact { get; set; }
        
        // Address
        [Display(Name = "Street Address")]
        public string StreetAddress { get; set; }
        
        public string City { get; set; }
        
        public string Province { get; set; }
        
        [Display(Name = "Postal Code")]
        public string PostalCode { get; set; }
        
        public string Country { get; set; } = "South Africa";
        
        // Financial
        [Display(Name = "Credit Limit")]
        [DataType(DataType.Currency)]
        public decimal? CreditLimit { get; set; }
        
        [Display(Name = "Payment Terms")]
        public string PaymentTerms { get; set; } = "30 Days";
        
        [Range(0, 100)]
        public decimal? Discount { get; set; }
        
        [Display(Name = "Tax Exempt")]
        public bool TaxExempt { get; set; }
        
        [Display(Name = "Active")]
        public bool IsActive { get; set; } = true;
        
        [Display(Name = "Created Date")]
        [DataType(DataType.Date)]
        public DateTime CreatedDate { get; set; } = DateTime.Now;
        
        [Display(Name = "Modified Date")]
        [DataType(DataType.Date)]
        public DateTime? ModifiedDate { get; set; }
    }
}