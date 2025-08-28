using Microsoft.AspNetCore.Mvc;
using MillenniumERP.Models;

namespace MillenniumERP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LookupsApiController : ControllerBase
    {
        // Company Types lookup data
        private static List<LookupItem> _companyTypes = new List<LookupItem>
        {
            new LookupItem { Id = 1, Code = "SP", Name = "Sole Proprietor", IsActive = true, SortOrder = 1 },
            new LookupItem { Id = 2, Code = "PTC", Name = "Private Company", IsActive = true, SortOrder = 2 },
            new LookupItem { Id = 3, Code = "PBC", Name = "Public Company", IsActive = true, SortOrder = 3 },
            new LookupItem { Id = 4, Code = "CC", Name = "Close Corporation", IsActive = true, SortOrder = 4 },
            new LookupItem { Id = 5, Code = "PT", Name = "Partnership", IsActive = true, SortOrder = 5 },
            new LookupItem { Id = 6, Code = "TR", Name = "Trust", IsActive = true, SortOrder = 6 },
            new LookupItem { Id = 7, Code = "IND", Name = "Individual", IsActive = true, SortOrder = 7 }
        };

        // Account Types lookup data
        private static List<LookupItem> _accountTypes = new List<LookupItem>
        {
            new LookupItem { Id = 1, Code = "PROS", Name = "Prospect", IsActive = true, SortOrder = 1 },
            new LookupItem { Id = 2, Code = "CUST", Name = "Customer", IsActive = true, SortOrder = 2 },
            new LookupItem { Id = 3, Code = "SUPP", Name = "Supplier", IsActive = true, SortOrder = 3 },
            new LookupItem { Id = 4, Code = "PART", Name = "Partner", IsActive = true, SortOrder = 4 },
            new LookupItem { Id = 5, Code = "COMP", Name = "Competitor", IsActive = true, SortOrder = 5 }
        };

        // Customer Status lookup data (locked field)
        private static List<CustomerStatusItem> _customerStatuses = new List<CustomerStatusItem>
        {
            new CustomerStatusItem { Id = 1, Code = "PROS", Name = "Prospect", IsActive = true, SortOrder = 1, RequiresApproval = false, AllowedRoles = new[] { "User", "Sales", "Manager", "Director", "Accountant" } },
            new CustomerStatusItem { Id = 2, Code = "PEND", Name = "Pending Approval", IsActive = true, SortOrder = 2, RequiresApproval = true, AllowedRoles = new[] { "Manager", "Director", "Accountant" } },
            new CustomerStatusItem { Id = 3, Code = "CONF", Name = "Confirmed Customer", IsActive = true, SortOrder = 3, RequiresApproval = true, AllowedRoles = new[] { "Manager", "Director", "Accountant" } },
            new CustomerStatusItem { Id = 4, Code = "REV", Name = "Account Under Review", IsActive = true, SortOrder = 4, RequiresApproval = true, AllowedRoles = new[] { "Director", "Accountant" } },
            new CustomerStatusItem { Id = 5, Code = "APPR", Name = "Credit Approved", IsActive = true, SortOrder = 5, RequiresApproval = true, AllowedRoles = new[] { "Director", "Accountant" } },
            new CustomerStatusItem { Id = 6, Code = "CLOS", Name = "Account Closed", IsActive = true, SortOrder = 6, RequiresApproval = true, AllowedRoles = new[] { "Director", "Accountant" } }
        };

        // Approval Status lookup data
        private static List<LookupItem> _approvalStatuses = new List<LookupItem>
        {
            new LookupItem { Id = 1, Code = "PEND", Name = "Pending", IsActive = true, SortOrder = 1 },
            new LookupItem { Id = 2, Code = "CREQ", Name = "Credit App Required", IsActive = true, SortOrder = 2 },
            new LookupItem { Id = 3, Code = "RCHK", Name = "References Check", IsActive = true, SortOrder = 3 },
            new LookupItem { Id = 4, Code = "PHREV", Name = "Payment History Review", IsActive = true, SortOrder = 4 },
            new LookupItem { Id = 5, Code = "APPR", Name = "Approved", IsActive = true, SortOrder = 5 },
            new LookupItem { Id = 6, Code = "REJ", Name = "Rejected", IsActive = true, SortOrder = 6 }
        };

        // Relationship Types lookup data
        private static List<LookupItem> _relationshipTypes = new List<LookupItem>
        {
            new LookupItem { Id = 1, Code = "CUST", Name = "Customer", IsActive = true, SortOrder = 1 },
            new LookupItem { Id = 2, Code = "SUB", Name = "Subsidiary", IsActive = true, SortOrder = 2 },
            new LookupItem { Id = 3, Code = "PAR", Name = "Parent Company", IsActive = true, SortOrder = 3 },
            new LookupItem { Id = 4, Code = "JV", Name = "Joint Venture", IsActive = true, SortOrder = 4 },
            new LookupItem { Id = 5, Code = "SUPP", Name = "Supplier", IsActive = true, SortOrder = 5 },
            new LookupItem { Id = 6, Code = "PART", Name = "Partner", IsActive = true, SortOrder = 6 }
        };

        [HttpGet("company-types")]
        public ActionResult<IEnumerable<LookupItem>> GetCompanyTypes()
        {
            return Ok(_companyTypes.Where(ct => ct.IsActive).OrderBy(ct => ct.SortOrder));
        }

        [HttpGet("account-types")]
        public ActionResult<IEnumerable<LookupItem>> GetAccountTypes()
        {
            return Ok(_accountTypes.Where(at => at.IsActive).OrderBy(at => at.SortOrder));
        }

        [HttpGet("customer-statuses")]
        public ActionResult<IEnumerable<CustomerStatusItem>> GetCustomerStatuses()
        {
            return Ok(_customerStatuses.Where(cs => cs.IsActive).OrderBy(cs => cs.SortOrder));
        }

        [HttpGet("approval-statuses")]
        public ActionResult<IEnumerable<LookupItem>> GetApprovalStatuses()
        {
            return Ok(_approvalStatuses.Where(ap => ap.IsActive).OrderBy(ap => ap.SortOrder));
        }

        [HttpGet("relationship-types")]
        public ActionResult<IEnumerable<LookupItem>> GetRelationshipTypes()
        {
            return Ok(_relationshipTypes.Where(rt => rt.IsActive).OrderBy(rt => rt.SortOrder));
        }

        // CRUD operations for Company Types
        [HttpPost("company-types")]
        public ActionResult<LookupItem> CreateCompanyType(LookupItem companyType)
        {
            companyType.Id = _companyTypes.Max(ct => ct.Id) + 1;
            companyType.IsActive = true;
            _companyTypes.Add(companyType);
            return CreatedAtAction(nameof(GetCompanyTypes), companyType);
        }

        [HttpPut("company-types/{id}")]
        public IActionResult UpdateCompanyType(int id, LookupItem companyType)
        {
            var existing = _companyTypes.FirstOrDefault(ct => ct.Id == id);
            if (existing == null)
                return NotFound();

            existing.Code = companyType.Code;
            existing.Name = companyType.Name;
            existing.Description = companyType.Description;
            existing.SortOrder = companyType.SortOrder;
            existing.IsActive = companyType.IsActive;

            return NoContent();
        }

        [HttpDelete("company-types/{id}")]
        public IActionResult DeleteCompanyType(int id)
        {
            var companyType = _companyTypes.FirstOrDefault(ct => ct.Id == id);
            if (companyType == null)
                return NotFound();

            companyType.IsActive = false;
            return NoContent();
        }

        // Similar CRUD operations for other lookup types can be added as needed
    }
}