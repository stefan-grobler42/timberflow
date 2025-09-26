using Microsoft.AspNetCore.Mvc;
using MillenniumERP.Models;
using Npgsql;

namespace MillenniumERP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LookupsApiController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public LookupsApiController(IConfiguration configuration)
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

        [HttpGet("company-types")]
        public ActionResult<IEnumerable<LookupItem>> GetCompanyTypes()
        {
            var items = new List<LookupItem>();

            try
            {
                using var connection = new NpgsqlConnection(GetConnectionString());
                connection.Open();

                var query = @"
                    SELECT id, code, name, description, is_active, sort_order 
                    FROM company_types 
                    WHERE is_active = true 
                    ORDER BY sort_order, name";

                using var command = new NpgsqlCommand(query, connection);
                using var reader = command.ExecuteReader();

                while (reader.Read())
                {
                    items.Add(new LookupItem
                    {
                        Id = reader.GetInt32(0), // id
                        Code = reader.GetString(1), // code  
                        Name = reader.GetString(2), // name
                        Description = reader["description"] as string,
                        IsActive = reader.GetBoolean(4), // is_active
                        SortOrder = reader["sort_order"] as int? ?? 0
                    });
                }
            }
            catch (Exception ex)
            {
                // Log the actual error for debugging (not shown to client)
                Console.WriteLine($"Database error in Lookups: {ex.Message}");
                return StatusCode(500, "Database connection error");
            }

            return Ok(items);
        }

        [HttpGet("account-types")]
        public ActionResult<IEnumerable<LookupItem>> GetAccountTypes()
        {
            var items = new List<LookupItem>();

            try
            {
                using var connection = new NpgsqlConnection(GetConnectionString());
                connection.Open();

                var query = @"
                    SELECT id, code, name, description, is_active, sort_order 
                    FROM account_types 
                    WHERE is_active = true 
                    ORDER BY sort_order, name";

                using var command = new NpgsqlCommand(query, connection);
                using var reader = command.ExecuteReader();

                while (reader.Read())
                {
                    items.Add(new LookupItem
                    {
                        Id = reader.GetInt32(0), // id
                        Code = reader.GetString(1), // code  
                        Name = reader.GetString(2), // name
                        Description = reader["description"] as string,
                        IsActive = reader.GetBoolean(4), // is_active
                        SortOrder = reader["sort_order"] as int? ?? 0
                    });
                }
            }
            catch (Exception ex)
            {
                // Log the actual error for debugging (not shown to client)
                Console.WriteLine($"Database error in Lookups: {ex.Message}");
                return StatusCode(500, "Database connection error");
            }

            return Ok(items);
        }

        // CRUD operations for Company Types
        [HttpPost("company-types")]
        public ActionResult<LookupItem> CreateCompanyType(LookupItem companyType)
        {
            try
            {
                using var connection = new NpgsqlConnection(GetConnectionString());
                connection.Open();

                var query = @"
                    INSERT INTO company_types (code, name, description, is_active, sort_order, created_at)
                    VALUES (@code, @name, @description, @is_active, @sort_order, @created_at)
                    RETURNING id";

                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("@code", companyType.Code);
                command.Parameters.AddWithValue("@name", companyType.Name);
                command.Parameters.AddWithValue("@description", companyType.Description ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@is_active", companyType.IsActive);
                command.Parameters.AddWithValue("@sort_order", companyType.SortOrder);
                command.Parameters.AddWithValue("@created_at", DateTime.Now);

                var newId = (int)command.ExecuteScalar();
                companyType.Id = newId;

                return CreatedAtAction(nameof(GetCompanyTypes), companyType);
            }
            catch (Exception ex)
            {
                // Log the actual error for debugging (not shown to client)
                Console.WriteLine($"Database error in Lookups: {ex.Message}");
                return StatusCode(500, "Database connection error");
            }
        }

        [HttpPut("company-types/{id}")]
        public IActionResult UpdateCompanyType(int id, LookupItem companyType)
        {
            try
            {
                using var connection = new NpgsqlConnection(GetConnectionString());
                connection.Open();

                var query = @"
                    UPDATE company_types 
                    SET code = @code, name = @name, description = @description, 
                        is_active = @is_active, sort_order = @sort_order, updated_at = @updated_at
                    WHERE id = @id";

                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("@id", id);
                command.Parameters.AddWithValue("@code", companyType.Code);
                command.Parameters.AddWithValue("@name", companyType.Name);
                command.Parameters.AddWithValue("@description", companyType.Description ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@is_active", companyType.IsActive);
                command.Parameters.AddWithValue("@sort_order", companyType.SortOrder);
                command.Parameters.AddWithValue("@updated_at", DateTime.Now);

                var rowsAffected = command.ExecuteNonQuery();
                if (rowsAffected == 0)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                // Log the actual error for debugging (not shown to client)
                Console.WriteLine($"Database error in Lookups: {ex.Message}");
                return StatusCode(500, "Database connection error");
            }
        }

        [HttpDelete("company-types/{id}")]
        public IActionResult DeleteCompanyType(int id)
        {
            try
            {
                using var connection = new NpgsqlConnection(GetConnectionString());
                connection.Open();

                var query = "UPDATE company_types SET is_active = false, updated_at = @updated_at WHERE id = @id";

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
                Console.WriteLine($"Database error in Lookups: {ex.Message}");
                return StatusCode(500, "Database connection error");
            }
        }

        // CRUD operations for Account Types
        [HttpPost("account-types")]
        public ActionResult<LookupItem> CreateAccountType(LookupItem accountType)
        {
            try
            {
                using var connection = new NpgsqlConnection(GetConnectionString());
                connection.Open();

                var query = @"
                    INSERT INTO account_types (code, name, description, is_active, sort_order, created_at)
                    VALUES (@code, @name, @description, @is_active, @sort_order, @created_at)
                    RETURNING id";

                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("@code", accountType.Code);
                command.Parameters.AddWithValue("@name", accountType.Name);
                command.Parameters.AddWithValue("@description", accountType.Description ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@is_active", accountType.IsActive);
                command.Parameters.AddWithValue("@sort_order", accountType.SortOrder);
                command.Parameters.AddWithValue("@created_at", DateTime.Now);

                var newId = (int)command.ExecuteScalar();
                accountType.Id = newId;

                return CreatedAtAction(nameof(GetAccountTypes), accountType);
            }
            catch (Exception ex)
            {
                // Log the actual error for debugging (not shown to client)
                Console.WriteLine($"Database error in Lookups: {ex.Message}");
                return StatusCode(500, "Database connection error");
            }
        }

        [HttpPut("account-types/{id}")]
        public IActionResult UpdateAccountType(int id, LookupItem accountType)
        {
            try
            {
                using var connection = new NpgsqlConnection(GetConnectionString());
                connection.Open();

                var query = @"
                    UPDATE account_types 
                    SET code = @code, name = @name, description = @description, 
                        is_active = @is_active, sort_order = @sort_order, updated_at = @updated_at
                    WHERE id = @id";

                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("@id", id);
                command.Parameters.AddWithValue("@code", accountType.Code);
                command.Parameters.AddWithValue("@name", accountType.Name);
                command.Parameters.AddWithValue("@description", accountType.Description ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@is_active", accountType.IsActive);
                command.Parameters.AddWithValue("@sort_order", accountType.SortOrder);
                command.Parameters.AddWithValue("@updated_at", DateTime.Now);

                var rowsAffected = command.ExecuteNonQuery();
                if (rowsAffected == 0)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                // Log the actual error for debugging (not shown to client)
                Console.WriteLine($"Database error in Lookups: {ex.Message}");
                return StatusCode(500, "Database connection error");
            }
        }

        [HttpDelete("account-types/{id}")]
        public IActionResult DeleteAccountType(int id)
        {
            try
            {
                using var connection = new NpgsqlConnection(GetConnectionString());
                connection.Open();

                var query = "UPDATE account_types SET is_active = false, updated_at = @updated_at WHERE id = @id";

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
                Console.WriteLine($"Database error in Lookups: {ex.Message}");
                return StatusCode(500, "Database connection error");
            }
        }
    }
}