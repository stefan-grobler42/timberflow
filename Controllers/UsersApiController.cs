using Microsoft.AspNetCore.Mvc;
using MillenniumERP.Models;
using Npgsql;

namespace MillenniumERP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersApiController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public UsersApiController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        private string GetConnectionString()
        {
            var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
            if (string.IsNullOrEmpty(databaseUrl))
            {
                throw new InvalidOperationException("DATABASE_URL environment variable not found");
            }

            // Convert PostgreSQL URI to Npgsql connection string
            if (databaseUrl.StartsWith("postgresql://") || databaseUrl.StartsWith("postgres://"))
            {
                var uri = new Uri(databaseUrl);
                var builder = new NpgsqlConnectionStringBuilder
                {
                    Host = uri.Host,
                    Port = uri.Port == -1 ? 5432 : uri.Port,
                    Database = uri.AbsolutePath.TrimStart('/'),
                    SslMode = SslMode.Require
                };

                if (!string.IsNullOrEmpty(uri.UserInfo))
                {
                    var userInfo = uri.UserInfo.Split(':');
                    builder.Username = Uri.UnescapeDataString(userInfo[0]);
                    if (userInfo.Length > 1)
                    {
                        builder.Password = Uri.UnescapeDataString(userInfo[1]);
                    }
                }

                return builder.ConnectionString;
            }

            return databaseUrl;
        }

        [HttpGet]
        public ActionResult<IEnumerable<UserModel>> GetUsers()
        {
            var users = new List<UserModel>();

            try
            {
                using var connection = new NpgsqlConnection(GetConnectionString());
                connection.Open();

                var query = @"
                    SELECT id, employee_code, first_name, last_name, email, phone, 
                           department, position, role, is_active, hire_date, address, 
                           emergency_contact, emergency_phone, created_at, updated_at
                    FROM employees 
                    WHERE is_active = true 
                    ORDER BY first_name, last_name";

                using var command = new NpgsqlCommand(query, connection);
                using var reader = command.ExecuteReader();

                while (reader.Read())
                {
                    users.Add(new UserModel
                    {
                        Id = reader.GetInt32(0), // id
                        UserCode = reader["employee_code"] as string ?? "",
                        FirstName = reader["first_name"] as string ?? "",
                        LastName = reader["last_name"] as string ?? "",
                        Email = reader["email"] as string ?? "",
                        Phone = reader["phone"] as string,
                        Department = reader["department"] as string,
                        Position = reader["position"] as string,
                        Role = reader["role"] as string ?? "user",
                        IsActive = reader["is_active"] as bool? ?? true,
                        HireDate = reader["hire_date"] as DateTime?,
                        Address = reader["address"] as string,
                        EmergencyContact = reader["emergency_contact"] as string,
                        EmergencyPhone = reader["emergency_phone"] as string,
                        CreatedAt = reader["created_at"] as DateTime? ?? DateTime.Now,
                        UpdatedAt = reader["updated_at"] as DateTime?
                    });
                }
            }
            catch (Exception ex)
            {
                // Log the actual error for debugging (not shown to client)
                Console.WriteLine($"Database error in GetUsers: {ex.Message}");
                return StatusCode(500, "Database connection error");
            }

            return Ok(users);
        }

        [HttpGet("sales-representatives")]
        public ActionResult<IEnumerable<UserModel>> GetSalesRepresentatives()
        {
            var salesReps = new List<UserModel>();

            try
            {
                using var connection = new NpgsqlConnection(GetConnectionString());
                connection.Open();

                var query = @"
                    SELECT id, employee_code, first_name, last_name, email, phone, 
                           department, position, role, is_active, hire_date, address, 
                           emergency_contact, emergency_phone, created_at, updated_at
                    FROM employees 
                    WHERE is_active = true 
                      AND (role = 'sales' OR role = 'manager' OR department = 'Sales')
                    ORDER BY first_name, last_name";

                using var command = new NpgsqlCommand(query, connection);
                using var reader = command.ExecuteReader();

                while (reader.Read())
                {
                    salesReps.Add(new UserModel
                    {
                        Id = reader.GetInt32(0), // id
                        UserCode = reader["employee_code"] as string ?? "",
                        FirstName = reader["first_name"] as string ?? "",
                        LastName = reader["last_name"] as string ?? "",
                        Email = reader["email"] as string ?? "",
                        Phone = reader["phone"] as string,
                        Department = reader["department"] as string,
                        Position = reader["position"] as string,
                        Role = reader["role"] as string ?? "user",
                        IsActive = reader["is_active"] as bool? ?? true,
                        HireDate = reader["hire_date"] as DateTime?,
                        Address = reader["address"] as string,
                        EmergencyContact = reader["emergency_contact"] as string,
                        EmergencyPhone = reader["emergency_phone"] as string,
                        CreatedAt = reader["created_at"] as DateTime? ?? DateTime.Now,
                        UpdatedAt = reader["updated_at"] as DateTime?
                    });
                }
            }
            catch (Exception ex)
            {
                // Log the actual error for debugging (not shown to client)
                Console.WriteLine($"Database error in GetUsers: {ex.Message}");
                return StatusCode(500, "Database connection error");
            }

            return Ok(salesReps);
        }

        [HttpGet("{id}")]
        public ActionResult<UserModel> GetUser(int id)
        {
            try
            {
                using var connection = new NpgsqlConnection(GetConnectionString());
                connection.Open();

                var query = @"
                    SELECT id, employee_code, first_name, last_name, email, phone, 
                           department, position, role, is_active, hire_date, address, 
                           emergency_contact, emergency_phone, created_at, updated_at
                    FROM employees 
                    WHERE id = @id";

                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("@id", id);
                using var reader = command.ExecuteReader();

                if (reader.Read())
                {
                    var user = new UserModel
                    {
                        Id = reader.GetInt32(0), // id
                        UserCode = reader["employee_code"] as string ?? "",
                        FirstName = reader["first_name"] as string ?? "",
                        LastName = reader["last_name"] as string ?? "",
                        Email = reader["email"] as string ?? "",
                        Phone = reader["phone"] as string,
                        Department = reader["department"] as string,
                        Position = reader["position"] as string,
                        Role = reader["role"] as string ?? "user",
                        IsActive = reader["is_active"] as bool? ?? true,
                        HireDate = reader["hire_date"] as DateTime?,
                        Address = reader["address"] as string,
                        EmergencyContact = reader["emergency_contact"] as string,
                        EmergencyPhone = reader["emergency_phone"] as string,
                        CreatedAt = reader["created_at"] as DateTime? ?? DateTime.Now,
                        UpdatedAt = reader["updated_at"] as DateTime?
                    };
                    return Ok(user);
                }
                else
                {
                    return NotFound();
                }
            }
            catch (Exception ex)
            {
                // Log the actual error for debugging (not shown to client)
                Console.WriteLine($"Database error in GetUsers: {ex.Message}");
                return StatusCode(500, "Database connection error");
            }
        }

        [HttpPost]
        public ActionResult<UserModel> CreateUser(UserModel user)
        {
            try
            {
                using var connection = new NpgsqlConnection(GetConnectionString());
                connection.Open();

                // Generate employee code
                var codeQuery = "SELECT COALESCE(MAX(CAST(SUBSTRING(employee_code, 4) AS INTEGER)), 0) + 1 FROM employees WHERE employee_code ~ '^EMP[0-9]+$'";
                using var codeCommand = new NpgsqlCommand(codeQuery, connection);
                var nextNumber = (int)(codeCommand.ExecuteScalar() ?? 1);
                user.UserCode = $"EMP{nextNumber:D3}";

                var query = @"
                    INSERT INTO employees (employee_code, first_name, last_name, email, phone, 
                                         department, position, role, is_active, hire_date, address, 
                                         emergency_contact, emergency_phone, created_at)
                    VALUES (@employee_code, @first_name, @last_name, @email, @phone, 
                            @department, @position, @role, @is_active, @hire_date, @address, 
                            @emergency_contact, @emergency_phone, @created_at)
                    RETURNING id";

                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("@employee_code", user.UserCode);
                command.Parameters.AddWithValue("@first_name", user.FirstName);
                command.Parameters.AddWithValue("@last_name", user.LastName);
                command.Parameters.AddWithValue("@email", user.Email ?? "");
                command.Parameters.AddWithValue("@phone", user.Phone ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@department", user.Department ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@position", user.Position ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@role", user.Role);
                command.Parameters.AddWithValue("@is_active", user.IsActive);
                command.Parameters.AddWithValue("@hire_date", user.HireDate ?? DateTime.Now);
                command.Parameters.AddWithValue("@address", user.Address ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@emergency_contact", user.EmergencyContact ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@emergency_phone", user.EmergencyPhone ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@created_at", DateTime.Now);

                var newId = (int)command.ExecuteScalar();
                user.Id = newId;
                user.CreatedAt = DateTime.Now;

                return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
            }
            catch (Exception ex)
            {
                // Log the actual error for debugging (not shown to client)
                Console.WriteLine($"Database error in GetUsers: {ex.Message}");
                return StatusCode(500, "Database connection error");
            }
        }

        [HttpPut("{id}")]
        public IActionResult UpdateUser(int id, UserModel user)
        {
            try
            {
                using var connection = new NpgsqlConnection(GetConnectionString());
                connection.Open();

                var query = @"
                    UPDATE employees 
                    SET first_name = @first_name, last_name = @last_name, email = @email, 
                        phone = @phone, department = @department, position = @position, 
                        role = @role, is_active = @is_active, address = @address, 
                        emergency_contact = @emergency_contact, emergency_phone = @emergency_phone, 
                        updated_at = @updated_at
                    WHERE id = @id";

                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("@id", id);
                command.Parameters.AddWithValue("@first_name", user.FirstName);
                command.Parameters.AddWithValue("@last_name", user.LastName);
                command.Parameters.AddWithValue("@email", user.Email ?? "");
                command.Parameters.AddWithValue("@phone", user.Phone ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@department", user.Department ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@position", user.Position ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@role", user.Role);
                command.Parameters.AddWithValue("@is_active", user.IsActive);
                command.Parameters.AddWithValue("@address", user.Address ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@emergency_contact", user.EmergencyContact ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@emergency_phone", user.EmergencyPhone ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@updated_at", DateTime.Now);

                var rowsAffected = command.ExecuteNonQuery();
                if (rowsAffected == 0)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                // Log the actual error for debugging (not shown to client)
                Console.WriteLine($"Database error in GetUsers: {ex.Message}");
                return StatusCode(500, "Database connection error");
            }
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteUser(int id)
        {
            try
            {
                using var connection = new NpgsqlConnection(GetConnectionString());
                connection.Open();

                var query = "UPDATE employees SET is_active = false, updated_at = @updated_at WHERE id = @id";

                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("@id", id);
                command.Parameters.AddWithValue("@updated_at", DateTime.Now);

                var rowsAffected = command.ExecuteNonQuery();
                if (rowsAffected == 0)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                // Log the actual error for debugging (not shown to client)
                Console.WriteLine($"Database error in GetUsers: {ex.Message}");
                return StatusCode(500, "Database connection error");
            }
        }
    }
}