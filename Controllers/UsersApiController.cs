using Microsoft.AspNetCore.Mvc;
using MillenniumERP.Models;

namespace MillenniumERP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersApiController : ControllerBase
    {
        // Mock user data for sales representatives and system users
        private static List<UserModel> _users = new List<UserModel>
        {
            new UserModel 
            { 
                Id = 1,
                UserCode = "USR001",
                FirstName = "John",
                LastName = "Smith",
                Email = "john.smith@millennium.co.za",
                Phone = "+27 11 234 5678",
                Department = "Sales",
                Position = "Senior Sales Representative",
                Role = "Sales",
                IsActive = true,
                HireDate = DateTime.Now.AddYears(-3)
            },
            new UserModel 
            { 
                Id = 2,
                UserCode = "USR002",
                FirstName = "Sarah",
                LastName = "Johnson",
                Email = "sarah.johnson@millennium.co.za",
                Phone = "+27 21 345 6789",
                Department = "Sales",
                Position = "Sales Manager",
                Role = "Manager",
                IsActive = true,
                HireDate = DateTime.Now.AddYears(-5)
            },
            new UserModel 
            { 
                Id = 3,
                UserCode = "USR003",
                FirstName = "Mike",
                LastName = "Brown",
                Email = "mike.brown@millennium.co.za",
                Phone = "+27 31 456 7890",
                Department = "Sales",
                Position = "Sales Representative",
                Role = "Sales",
                IsActive = true,
                HireDate = DateTime.Now.AddYears(-2)
            },
            new UserModel 
            { 
                Id = 4,
                UserCode = "USR004",
                FirstName = "Lisa",
                LastName = "Davis",
                Email = "lisa.davis@millennium.co.za",
                Phone = "+27 41 567 8901",
                Department = "Finance",
                Position = "Senior Accountant",
                Role = "Accountant",
                IsActive = true,
                HireDate = DateTime.Now.AddYears(-4)
            },
            new UserModel 
            { 
                Id = 5,
                UserCode = "USR005",
                FirstName = "David",
                LastName = "Wilson",
                Email = "david.wilson@millennium.co.za",
                Phone = "+27 11 678 9012",
                Department = "Management",
                Position = "Operations Director",
                Role = "Director",
                IsActive = true,
                HireDate = DateTime.Now.AddYears(-8)
            }
        };

        [HttpGet]
        public ActionResult<IEnumerable<UserModel>> GetUsers()
        {
            return Ok(_users.Where(u => u.IsActive));
        }

        [HttpGet("sales-representatives")]
        public ActionResult<IEnumerable<UserModel>> GetSalesRepresentatives()
        {
            return Ok(_users.Where(u => u.IsActive && (u.Role == "Sales" || u.Role == "Manager")).OrderBy(u => u.FirstName));
        }

        [HttpGet("{id}")]
        public ActionResult<UserModel> GetUser(int id)
        {
            var user = _users.FirstOrDefault(u => u.Id == id);
            if (user == null)
                return NotFound();
            return Ok(user);
        }

        [HttpPost]
        public ActionResult<UserModel> CreateUser(UserModel user)
        {
            user.Id = _users.Max(u => u.Id) + 1;
            user.UserCode = $"USR{user.Id:D3}";
            user.IsActive = true;
            user.HireDate = DateTime.Now;
            _users.Add(user);
            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
        }

        [HttpPut("{id}")]
        public IActionResult UpdateUser(int id, UserModel user)
        {
            var existing = _users.FirstOrDefault(u => u.Id == id);
            if (existing == null)
                return NotFound();

            existing.FirstName = user.FirstName;
            existing.LastName = user.LastName;
            existing.Email = user.Email;
            existing.Phone = user.Phone;
            existing.Department = user.Department;
            existing.Position = user.Position;
            existing.Role = user.Role;
            existing.IsActive = user.IsActive;

            return NoContent();
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteUser(int id)
        {
            var user = _users.FirstOrDefault(u => u.Id == id);
            if (user == null)
                return NotFound();

            user.IsActive = false;
            return NoContent();
        }
    }
}