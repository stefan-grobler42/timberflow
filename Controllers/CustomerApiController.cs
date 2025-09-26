using Microsoft.AspNetCore.Mvc;
using MillenniumERP.Models;
using Npgsql;

namespace MillenniumERP.Controllers
{
    [ApiController]
    [Route("api/customer")]
    public class CustomerApiController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public CustomerApiController(IConfiguration configuration)
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
        public ActionResult<IEnumerable<CustomerModel>> GetCustomers()
        {
            var customers = new List<CustomerModel>();

            try
            {
                using var connection = new NpgsqlConnection(GetConnectionString());
                connection.Open();

                var query = @"
                    SELECT c.id, c.customer_code, c.name, c.company_name, c.email, c.phone, 
                           c.address, c.city, c.province, c.postal_code, c.country, 
                           c.status, c.gps_coordinates, c.notes, c.created_at, c.updated_at,
                           ct.name as company_type_name
                    FROM customers c
                    LEFT JOIN company_types ct ON c.customer_type_id = ct.id
                    ORDER BY c.name";

                using var command = new NpgsqlCommand(query, connection);
                using var reader = command.ExecuteReader();

                while (reader.Read())
                {
                    customers.Add(new CustomerModel
                    {
                        Id = reader.GetInt32(0), // id
                        AccountNo = reader["customer_code"] as string ?? "",
                        AccountName = reader["name"] as string ?? "",
                        CompanyType = reader["company_type_name"] as string ?? "",
                        Phone = reader["phone"] as string ?? "",
                        Email = reader["email"] as string ?? "",
                        CustomerStatus = reader["status"] as string ?? "Active",
                        StreetAddress = reader["address"] as string ?? "",
                        City = reader["city"] as string ?? "",
                        Province = reader["province"] as string ?? "",
                        PostalCode = reader["postal_code"] as string ?? "",
                        Country = reader["country"] as string ?? "",
                        IsActive = true,
                        CreatedDate = reader["created_at"] as DateTime? ?? DateTime.Now
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Database error in GetCustomers: {ex.Message}");
                return StatusCode(500, "Database connection error");
            }

            return Ok(customers);
        }

        [HttpGet("{id}")]
        public ActionResult<CustomerModel> GetCustomer(int id)
        {
            try
            {
                using var connection = new NpgsqlConnection(GetConnectionString());
                connection.Open();

                var query = @"
                    SELECT c.id, c.customer_code, c.name, c.company_name, c.email, c.phone, 
                           c.address, c.city, c.province, c.postal_code, c.country, 
                           c.status, c.gps_coordinates, c.notes, c.created_at, c.updated_at,
                           ct.name as company_type_name
                    FROM customers c
                    LEFT JOIN company_types ct ON c.customer_type_id = ct.id
                    WHERE c.id = @id";

                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("@id", id);
                using var reader = command.ExecuteReader();

                if (reader.Read())
                {
                    var customer = new CustomerModel
                    {
                        Id = reader.GetInt32(0), // id
                        AccountNo = reader["customer_code"] as string ?? "",
                        AccountName = reader["name"] as string ?? "",
                        CompanyType = reader["company_type_name"] as string ?? "",
                        Phone = reader["phone"] as string ?? "",
                        Email = reader["email"] as string ?? "",
                        CustomerStatus = reader["status"] as string ?? "Active",
                        StreetAddress = reader["address"] as string ?? "",
                        City = reader["city"] as string ?? "",
                        Province = reader["province"] as string ?? "",
                        PostalCode = reader["postal_code"] as string ?? "",
                        Country = reader["country"] as string ?? "",
                        IsActive = true,
                        CreatedDate = reader["created_at"] as DateTime? ?? DateTime.Now
                    };
                    return Ok(customer);
                }
                else
                {
                    return NotFound();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Database error in GetCustomer: {ex.Message}");
                return StatusCode(500, "Database connection error");
            }
        }

        [HttpPost]
        public ActionResult<CustomerModel> CreateCustomer(CustomerModel customer)
        {
            try
            {
                using var connection = new NpgsqlConnection(GetConnectionString());
                connection.Open();

                // Generate customer code
                var codeQuery = "SELECT COALESCE(MAX(CAST(SUBSTRING(customer_code, 4) AS INTEGER)), 0) + 1 FROM customers WHERE customer_code ~ '^CUS[0-9]+$'";
                using var codeCommand = new NpgsqlCommand(codeQuery, connection);
                var nextNumber = (int)(codeCommand.ExecuteScalar() ?? 1);
                customer.AccountNo = $"CUS{nextNumber:D3}";

                var query = @"
                    INSERT INTO customers (customer_code, name, company_name, email, phone, 
                                         address, city, province, postal_code, country, 
                                         status, created_at)
                    VALUES (@customer_code, @name, @company_name, @email, @phone, 
                            @address, @city, @province, @postal_code, @country, 
                            @status, @created_at)
                    RETURNING id";

                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("@customer_code", customer.AccountNo);
                command.Parameters.AddWithValue("@name", customer.AccountName ?? "");
                command.Parameters.AddWithValue("@company_name", customer.AccountName ?? "");
                command.Parameters.AddWithValue("@email", customer.Email ?? "");
                command.Parameters.AddWithValue("@phone", customer.Phone ?? "");
                command.Parameters.AddWithValue("@address", customer.StreetAddress ?? "");
                command.Parameters.AddWithValue("@city", customer.City ?? "");
                command.Parameters.AddWithValue("@province", customer.Province ?? "");
                command.Parameters.AddWithValue("@postal_code", customer.PostalCode ?? "");
                command.Parameters.AddWithValue("@country", customer.Country ?? "");
                command.Parameters.AddWithValue("@status", customer.CustomerStatus ?? "Active");
                command.Parameters.AddWithValue("@created_at", DateTime.Now);

                var newId = (int)command.ExecuteScalar();
                customer.Id = newId;
                customer.CreatedDate = DateTime.Now;

                return CreatedAtAction(nameof(GetCustomer), new { id = customer.Id }, customer);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Database error in CreateCustomer: {ex.Message}");
                return StatusCode(500, "Database connection error");
            }
        }

        [HttpPut("{id}")]
        public IActionResult UpdateCustomer(int id, CustomerModel customer)
        {
            try
            {
                using var connection = new NpgsqlConnection(GetConnectionString());
                connection.Open();

                var query = @"
                    UPDATE customers 
                    SET name = @name, company_name = @company_name, email = @email, 
                        phone = @phone, address = @address, city = @city, 
                        province = @province, postal_code = @postal_code, country = @country, 
                        status = @status, updated_at = @updated_at
                    WHERE id = @id";

                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("@id", id);
                command.Parameters.AddWithValue("@name", customer.AccountName ?? "");
                command.Parameters.AddWithValue("@company_name", customer.AccountName ?? "");
                command.Parameters.AddWithValue("@email", customer.Email ?? "");
                command.Parameters.AddWithValue("@phone", customer.Phone ?? "");
                command.Parameters.AddWithValue("@address", customer.StreetAddress ?? "");
                command.Parameters.AddWithValue("@city", customer.City ?? "");
                command.Parameters.AddWithValue("@province", customer.Province ?? "");
                command.Parameters.AddWithValue("@postal_code", customer.PostalCode ?? "");
                command.Parameters.AddWithValue("@country", customer.Country ?? "");
                command.Parameters.AddWithValue("@status", customer.CustomerStatus ?? "Active");
                command.Parameters.AddWithValue("@updated_at", DateTime.Now);

                var rowsAffected = command.ExecuteNonQuery();
                if (rowsAffected == 0)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Database error in UpdateCustomer: {ex.Message}");
                return StatusCode(500, "Database connection error");
            }
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteCustomer(int id)
        {
            try
            {
                using var connection = new NpgsqlConnection(GetConnectionString());
                connection.Open();

                var query = "DELETE FROM customers WHERE id = @id";

                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("@id", id);

                var rowsAffected = command.ExecuteNonQuery();
                if (rowsAffected == 0)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Database error in DeleteCustomer: {ex.Message}");
                return StatusCode(500, "Database connection error");
            }
        }
    }
}