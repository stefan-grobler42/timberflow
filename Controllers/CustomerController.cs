using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MillenniumERP.Controllers
{
    public class CustomerController : Controller
    {
        // MVC Actions
        public IActionResult Index()
        {
            return View();
        }
    }
    
    [ApiController]
    [Route("api/[controller]")]
    public class CustomerApiController : ControllerBase
    {
        private static List<Customer> _customers = new List<Customer>
        {
            new Customer 
            { 
                Id = 1,
                AccountNo = "PROS001",
                AccountName = "Millennium Construction Ltd",
                CompanyType = "Private Company",
                CompanyRegistrationNo = "2018/123456/07",
                VatRegistrationNo = "4123456789",
                Phone = "+27 11 234 5678",
                Email = "info@millennium.co.za",
                Website = "https://www.millennium.co.za",
                AccountType = "Prospect",
                CustomerStatus = "Prospect",
                ApprovalStatus = "Pending",
                SalesRepresentative = "John Smith",
                PrimaryContact = "Mike Johnson",
                Address = "123 Construction Ave, Johannesburg, 2001",
                DateCreated = new DateTime(2025, 8, 1),
                QuotesRequested = 3,
                TotalQuoteValue = 250000,
                OrdersPlaced = 0,
                IsActive = true
            },
            new Customer 
            { 
                Id = 2,
                AccountNo = "CUST002",
                AccountName = "Cape Town Developers",
                CompanyType = "Close Corporation",
                CompanyRegistrationNo = "2019/234567/23",
                VatRegistrationNo = "4234567890",
                Phone = "+27 21 345 6789",
                Email = "orders@ctdev.co.za",
                Website = "https://www.ctdev.co.za",
                AccountType = "Customer",
                CustomerStatus = "Confirmed Customer",
                ApprovalStatus = "Approved",
                SalesRepresentative = "Sarah Johnson",
                PrimaryContact = "Peter Brown",
                Address = "456 Beach Road, Cape Town, 8001",
                DateCreated = new DateTime(2025, 7, 15),
                QuotesRequested = 8,
                TotalQuoteValue = 850000,
                OrdersPlaced = 5,
                IsActive = true
            },
            new Customer 
            { 
                Id = 3,
                AccountNo = "CUST003",
                AccountName = "Durban Roofing Solutions",
                CompanyType = "Partnership",
                CompanyRegistrationNo = "2020/345678/12",
                VatRegistrationNo = "4345678901",
                Phone = "+27 31 456 7890",
                Email = "info@durbanroofing.co.za",
                AccountType = "Customer",
                CustomerStatus = "Account Under Review",
                ApprovalStatus = "Credit App Required",
                SalesRepresentative = "Mike Brown",
                PrimaryContact = "Jane Wilson",
                Address = "789 Industrial Park, Durban, 4001",
                DateCreated = new DateTime(2025, 6, 20),
                QuotesRequested = 12,
                TotalQuoteValue = 1200000,
                OrdersPlaced = 8,
                IsActive = true
            }
        };

        [HttpGet]
        public ActionResult<IEnumerable<Customer>> GetCustomers(
            [FromQuery] string search = null,
            [FromQuery] string status = null,
            [FromQuery] string type = null)
        {
            var customers = _customers.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                search = search.ToLower();
                customers = customers.Where(c => 
                    c.AccountName.ToLower().Contains(search) ||
                    c.AccountNo.ToLower().Contains(search) ||
                    c.Email.ToLower().Contains(search) ||
                    c.Phone.Contains(search));
            }

            if (!string.IsNullOrEmpty(status))
            {
                customers = customers.Where(c => c.CustomerStatus == status);
            }

            if (!string.IsNullOrEmpty(type))
            {
                customers = customers.Where(c => c.CompanyType == type);
            }

            return Ok(customers.OrderBy(c => c.AccountName));
        }

        [HttpGet("{id}")]
        public ActionResult<Customer> GetCustomer(int id)
        {
            var customer = _customers.FirstOrDefault(c => c.Id == id);
            if (customer == null)
            {
                return NotFound();
            }
            return Ok(customer);
        }

        [HttpPost]
        public ActionResult<Customer> CreateCustomer(Customer customer)
        {
            customer.Id = _customers.Count > 0 ? _customers.Max(c => c.Id) + 1 : 1;
            customer.DateCreated = DateTime.Now;
            customer.AccountNo = GenerateAccountNumber(customer.AccountType);
            _customers.Add(customer);
            return CreatedAtAction(nameof(GetCustomer), new { id = customer.Id }, customer);
        }

        [HttpPut("{id}")]
        public IActionResult UpdateCustomer(int id, Customer customer)
        {
            var existingCustomer = _customers.FirstOrDefault(c => c.Id == id);
            if (existingCustomer == null)
            {
                return NotFound();
            }

            // Update properties
            existingCustomer.AccountName = customer.AccountName;
            existingCustomer.CompanyType = customer.CompanyType;
            existingCustomer.CompanyRegistrationNo = customer.CompanyRegistrationNo;
            existingCustomer.VatRegistrationNo = customer.VatRegistrationNo;
            existingCustomer.Phone = customer.Phone;
            existingCustomer.Email = customer.Email;
            existingCustomer.Website = customer.Website;
            existingCustomer.AccountType = customer.AccountType;
            existingCustomer.CustomerStatus = customer.CustomerStatus;
            existingCustomer.ApprovalStatus = customer.ApprovalStatus;
            existingCustomer.SalesRepresentative = customer.SalesRepresentative;
            existingCustomer.PrimaryContact = customer.PrimaryContact;
            existingCustomer.Address = customer.Address;
            existingCustomer.IsActive = customer.IsActive;

            return NoContent();
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteCustomer(int id)
        {
            var customer = _customers.FirstOrDefault(c => c.Id == id);
            if (customer == null)
            {
                return NotFound();
            }
            _customers.Remove(customer);
            return NoContent();
        }

        [HttpPost("bulk-delete")]
        public IActionResult BulkDelete([FromBody] int[] ids)
        {
            _customers.RemoveAll(c => ids.Contains(c.Id));
            return NoContent();
        }

        [HttpGet("export")]
        public IActionResult ExportToExcel()
        {
            // In a real implementation, you would generate an Excel file here
            // For now, return CSV data
            var csv = "AccountNo,AccountName,CompanyType,Phone,Email,Status\n";
            foreach (var customer in _customers)
            {
                csv += $"{customer.AccountNo},{customer.AccountName},{customer.CompanyType},{customer.Phone},{customer.Email},{customer.CustomerStatus}\n";
            }
            
            var bytes = System.Text.Encoding.UTF8.GetBytes(csv);
            return File(bytes, "text/csv", "customers.csv");
        }

        private string GenerateAccountNumber(string accountType)
        {
            var prefix = accountType switch
            {
                "Customer" => "CUST",
                "Supplier" => "SUPP",
                "Partner" => "PART",
                _ => "PROS"
            };
            var nextNumber = _customers.Count(c => c.AccountType == accountType) + 1;
            return $"{prefix}{nextNumber:000}";
        }
    }

    public class Customer
    {
        public int Id { get; set; }
        public string AccountNo { get; set; }
        public string AccountName { get; set; }
        public string CompanyType { get; set; }
        public string CompanyRegistrationNo { get; set; }
        public string VatRegistrationNo { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
        public string Website { get; set; }
        public string ParentAccount { get; set; }
        public string AccountType { get; set; }
        public string CustomerStatus { get; set; }
        public string ApprovalStatus { get; set; }
        public string SalesRepresentative { get; set; }
        public string RelationshipType { get; set; }
        public string PrimaryContact { get; set; }
        public string Address { get; set; }
        public DateTime DateCreated { get; set; }
        public int QuotesRequested { get; set; }
        public decimal TotalQuoteValue { get; set; }
        public int OrdersPlaced { get; set; }
        public bool IsActive { get; set; }
    }
}