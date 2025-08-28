using Microsoft.AspNetCore.Mvc;
using MillenniumERP.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MillenniumERP.Controllers
{
    [ApiController]
    [Route("api/customer")]
    public class CustomerApiController : ControllerBase
    {
        private static List<CustomerModel> _customers = new List<CustomerModel>
        {
            new CustomerModel 
            { 
                Id = 1,
                AccountNo = "ACC001",
                AccountName = "ABC Construction (Pty) Ltd",
                CompanyType = "Private Company",
                CompanyRegistrationNo = "2020/123456/07",
                VatRegistrationNo = "4123456789",
                Phone = "+27 11 234 5678",
                Mobile = "+27 82 345 6789",
                Email = "accounts@abcconstruction.co.za",
                Website = "https://www.abcconstruction.co.za",
                CustomerStatus = "Confirmed Customer",
                SalesRepresentative = "John Smith",
                PrimaryContact = "Mike Johnson",
                StreetAddress = "123 Main Road, Sandton",
                City = "Johannesburg",
                Province = "Gauteng",
                PostalCode = "2196",
                Country = "South Africa",
                Latitude = -26.1076,
                Longitude = 28.0567,
                CreditLimit = 500000,
                PaymentTerms = "30 Days",
                Discount = 5,
                TaxExempt = false,
                CurrentBalance = 125000,
                IsActive = true,
                CreatedDate = DateTime.Now.AddMonths(-6)
            },
            new CustomerModel 
            { 
                Id = 2,
                AccountNo = "ACC002",
                AccountName = "XYZ Developers CC",
                CompanyType = "Close Corporation",
                CompanyRegistrationNo = "2019/234567/23",
                VatRegistrationNo = "4234567890",
                Phone = "+27 21 456 7890",
                Mobile = "+27 83 456 7890",
                Email = "info@xyzdev.co.za",
                Website = "https://www.xyzdev.co.za",
                CustomerStatus = "Credit Approved",
                SalesRepresentative = "Sarah Johnson",
                PrimaryContact = "Peter Brown",
                StreetAddress = "456 Beach Road, Sea Point",
                City = "Cape Town",
                Province = "Western Cape",
                PostalCode = "8005",
                Country = "South Africa",
                Latitude = -33.9249,
                Longitude = 18.4241,
                CreditLimit = 750000,
                PaymentTerms = "45 Days",
                Discount = 7.5m,
                TaxExempt = false,
                CurrentBalance = 325000,
                IsActive = true,
                CreatedDate = DateTime.Now.AddMonths(-12)
            },
            new CustomerModel 
            { 
                Id = 3,
                AccountNo = "ACC003",
                AccountName = "Premium Roofing Solutions",
                CompanyType = "Partnership",
                CompanyRegistrationNo = "2021/345678/08",
                VatRegistrationNo = "4345678901",
                Phone = "+27 31 567 8901",
                Mobile = "+27 84 567 8901",
                Email = "sales@premiumroofing.co.za",
                Website = "",
                CustomerStatus = "Prospect",
                SalesRepresentative = "Mike Brown",
                PrimaryContact = "Jane Wilson",
                StreetAddress = "789 Industrial Avenue, Pinetown",
                City = "Durban",
                Province = "KwaZulu-Natal",
                PostalCode = "3610",
                Country = "South Africa",
                Latitude = -29.8587,
                Longitude = 31.0218,
                CreditLimit = 250000,
                PaymentTerms = "COD",
                Discount = 0,
                TaxExempt = false,
                CurrentBalance = 0,
                IsActive = true,
                CreatedDate = DateTime.Now.AddMonths(-2)
            },
            new CustomerModel 
            { 
                Id = 4,
                AccountNo = "ACC004",
                AccountName = "Green Building Contractors",
                CompanyType = "Private Company",
                CompanyRegistrationNo = "2018/456789/07",
                VatRegistrationNo = "4456789012",
                Phone = "+27 12 678 9012",
                Mobile = "+27 85 678 9012",
                Email = "projects@greenbuilding.co.za",
                Website = "https://www.greenbuilding.co.za",
                CustomerStatus = "Account Under Review",
                SalesRepresentative = "Lisa Davis",
                PrimaryContact = "Tom Anderson",
                StreetAddress = "321 Church Street, Arcadia",
                City = "Pretoria",
                Province = "Gauteng",
                PostalCode = "0083",
                Country = "South Africa",
                Latitude = -25.7461,
                Longitude = 28.2382,
                CreditLimit = 1000000,
                PaymentTerms = "60 Days",
                Discount = 10,
                TaxExempt = true,
                CurrentBalance = 450000,
                IsActive = true,
                CreatedDate = DateTime.Now.AddMonths(-18)
            },
            new CustomerModel 
            { 
                Id = 5,
                AccountNo = "ACC005",
                AccountName = "Coastal Properties Trust",
                CompanyType = "Trust",
                CompanyRegistrationNo = "IT2022/001",
                VatRegistrationNo = "4567890123",
                Phone = "+27 41 789 0123",
                Mobile = "+27 86 789 0123",
                Email = "admin@coastalproperties.co.za",
                Website = "",
                CustomerStatus = "Account Closed",
                SalesRepresentative = "John Smith",
                PrimaryContact = "Mary Thompson",
                StreetAddress = "654 Marine Drive, Summerstrand",
                City = "Port Elizabeth",
                Province = "Eastern Cape",
                PostalCode = "6001",
                Country = "South Africa",
                Latitude = -33.9608,
                Longitude = 25.6022,
                CreditLimit = 0,
                PaymentTerms = "30 Days",
                Discount = 0,
                TaxExempt = false,
                CurrentBalance = 0,
                IsActive = false,
                CreatedDate = DateTime.Now.AddMonths(-24)
            }
        };

        [HttpGet]
        public ActionResult<IEnumerable<CustomerModel>> GetCustomers()
        {
            return Ok(_customers.Where(c => c.IsActive));
        }

        [HttpGet("{id}")]
        public ActionResult<CustomerModel> GetCustomer(int id)
        {
            var customer = _customers.FirstOrDefault(c => c.Id == id);
            if (customer == null)
                return NotFound();
            return Ok(customer);
        }

        [HttpPost]
        public ActionResult<CustomerModel> CreateCustomer(CustomerModel customer)
        {
            customer.Id = _customers.Max(c => c.Id) + 1;
            customer.AccountNo = $"ACC{customer.Id:D3}";
            customer.CreatedDate = DateTime.Now;
            customer.IsActive = true;
            _customers.Add(customer);
            return CreatedAtAction(nameof(GetCustomer), new { id = customer.Id }, customer);
        }

        [HttpPut("{id}")]
        public IActionResult UpdateCustomer(int id, CustomerModel customer)
        {
            var existing = _customers.FirstOrDefault(c => c.Id == id);
            if (existing == null)
                return NotFound();

            // Update properties
            existing.AccountName = customer.AccountName;
            existing.CompanyType = customer.CompanyType;
            existing.CompanyRegistrationNo = customer.CompanyRegistrationNo;
            existing.VatRegistrationNo = customer.VatRegistrationNo;
            existing.Phone = customer.Phone;
            existing.Mobile = customer.Mobile;
            existing.Email = customer.Email;
            existing.Website = customer.Website;
            existing.CustomerStatus = customer.CustomerStatus;
            existing.SalesRepresentative = customer.SalesRepresentative;
            existing.PrimaryContact = customer.PrimaryContact;
            existing.StreetAddress = customer.StreetAddress;
            existing.City = customer.City;
            existing.Province = customer.Province;
            existing.PostalCode = customer.PostalCode;
            existing.Country = customer.Country;
            existing.Latitude = customer.Latitude;
            existing.Longitude = customer.Longitude;
            existing.CreditLimit = customer.CreditLimit;
            existing.PaymentTerms = customer.PaymentTerms;
            existing.Discount = customer.Discount;
            existing.TaxExempt = customer.TaxExempt;
            existing.ModifiedDate = DateTime.Now;

            return NoContent();
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteCustomer(int id)
        {
            var customer = _customers.FirstOrDefault(c => c.Id == id);
            if (customer == null)
                return NotFound();

            customer.IsActive = false;
            return NoContent();
        }
    }
}