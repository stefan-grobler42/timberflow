using Microsoft.Data.Sqlite;

class AddMillenniumTables
{
    static void Main()
    {
        var dbPath = "../MillenniumERP.API/millennium_erp.db";
        var connectionString = $"Data Source={dbPath}";
        
        Console.WriteLine("Adding Millennium Roofing tables to database...\n");
        
        using var connection = new SqliteConnection(connectionString);
        connection.Open();
        
        var sql = File.ReadAllText("AddMillenniumTables.sql");
        
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.ExecuteNonQuery();
        
        Console.WriteLine("✓ All tables created successfully!\n");
        
        // Verify tables
        command.CommandText = "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'cr694_%' ORDER BY name";
        using var reader = command.ExecuteReader();
        
        Console.WriteLine("Millennium tables in database:");
        while (reader.Read())
        {
            Console.WriteLine($"  ✓ {reader.GetString(0)}");
        }
        
        Console.WriteLine("\n✓ Database update complete!");
    }
}
