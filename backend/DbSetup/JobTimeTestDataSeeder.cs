using Npgsql;

internal static class JobTimeTestDataSeeder
{
    private const string SeedMarker = "DEV ONLY TEST DATA - Job time tracking";
    private const string TimeZoneId = "Africa/Johannesburg";
    private const string OverallStage = "overall";
    private const string PickingStage = "picking";
    private const string SawingStage = "sawing";
    private const string ProductionStage = "production";

    private static readonly Guid Team1Id = Guid.Parse("11111111-1111-4111-8111-111111111111");
    private static readonly Guid Team2Id = Guid.Parse("22222222-2222-4222-8222-222222222222");
    private static readonly Guid Team3Id = Guid.Parse("33333333-3333-4333-8333-333333333333");

    private static readonly Guid PlannerProductionTeam1Id = Guid.Parse("93000000-0000-4000-8000-000000000001");
    private static readonly Guid PlannerProductionTeam2Id = Guid.Parse("93000000-0000-4000-8000-000000000002");
    private static readonly Guid PlannerProductionTeam3Id = Guid.Parse("93000000-0000-4000-8000-000000000003");

    private static readonly Guid JobNotStartedTeam1Id = Guid.Parse("90000000-0000-4000-8000-000000000001");
    private static readonly Guid JobInProgressTeam1Id = Guid.Parse("90000000-0000-4000-8000-000000000002");
    private static readonly Guid JobSlowerTeam2Id = Guid.Parse("90000000-0000-4000-8000-000000000003");
    private static readonly Guid JobFasterTeam2Id = Guid.Parse("90000000-0000-4000-8000-000000000004");
    private static readonly Guid JobNotStartedTeam3Id = Guid.Parse("90000000-0000-4000-8000-000000000005");
    private static readonly Guid JobMultipleEntriesTeam3Id = Guid.Parse("90000000-0000-4000-8000-000000000006");
    private static readonly Guid JobInProgressTeam3Id = Guid.Parse("90000000-0000-4000-8000-000000000007");

    private static readonly Guid EntryInProgressTeam1Id = Guid.Parse("91000000-0000-4000-8000-000000000001");
    private static readonly Guid EntrySlowerTeam2Id = Guid.Parse("91000000-0000-4000-8000-000000000002");
    private static readonly Guid EntryFasterTeam2Id = Guid.Parse("91000000-0000-4000-8000-000000000003");
    private static readonly Guid EntryMultipleTeam3MorningId = Guid.Parse("91000000-0000-4000-8000-000000000004");
    private static readonly Guid EntryMultipleTeam3AfternoonId = Guid.Parse("91000000-0000-4000-8000-000000000005");
    private static readonly Guid EntryInProgressTeam3Id = Guid.Parse("91000000-0000-4000-8000-000000000006");

    private static readonly Guid StagePickingOnlyTeam1Id = Guid.Parse("92000000-0000-4000-8000-000000000001");
    private static readonly Guid StagePickingActiveTeam1Id = Guid.Parse("92000000-0000-4000-8000-000000000002");
    private static readonly Guid StageSawingActiveTeam1Id = Guid.Parse("92000000-0000-4000-8000-000000000003");
    private static readonly Guid StageSlowerPickingTeam2Id = Guid.Parse("92000000-0000-4000-8000-000000000004");
    private static readonly Guid StageSlowerSawingTeam2Id = Guid.Parse("92000000-0000-4000-8000-000000000005");
    private static readonly Guid StageSlowerProductionTeam2Id = Guid.Parse("92000000-0000-4000-8000-000000000006");
    private static readonly Guid StageFasterPickingTeam2Id = Guid.Parse("92000000-0000-4000-8000-000000000007");
    private static readonly Guid StageFasterSawingTeam2Id = Guid.Parse("92000000-0000-4000-8000-000000000008");
    private static readonly Guid StageFasterProductionTeam2Id = Guid.Parse("92000000-0000-4000-8000-000000000009");
    private static readonly Guid StageMultiplePickingTeam3Id = Guid.Parse("92000000-0000-4000-8000-000000000010");
    private static readonly Guid StageMultipleSawingTeam3Id = Guid.Parse("92000000-0000-4000-8000-000000000011");
    private static readonly Guid StageMultipleProductionMorningTeam3Id = Guid.Parse("92000000-0000-4000-8000-000000000012");
    private static readonly Guid StageMultipleProductionAfternoonTeam3Id = Guid.Parse("92000000-0000-4000-8000-000000000013");
    private static readonly Guid StageProductionActiveTeam3Id = Guid.Parse("92000000-0000-4000-8000-000000000014");

    private static readonly Guid[] SeedJobIds =
    [
        JobNotStartedTeam1Id,
        JobInProgressTeam1Id,
        JobSlowerTeam2Id,
        JobFasterTeam2Id,
        JobNotStartedTeam3Id,
        JobMultipleEntriesTeam3Id,
        JobInProgressTeam3Id
    ];

    private static readonly Guid[] SeedProductionIds =
    [
        PlannerProductionTeam1Id,
        PlannerProductionTeam2Id,
        PlannerProductionTeam3Id
    ];

    public static async Task SeedAsync()
    {
        var connectionString = BuildConnectionString();
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();

        await EnsureSafeTargetAsync(connection);

        await using var tx = await connection.BeginTransactionAsync();
        await EnsureJobTimeEntriesTableAsync(connection);

        var team1Id = await EnsureTeamAsync(connection, "Team 1", Team1Id, 1, "#2563eb");
        var team2Id = await EnsureTeamAsync(connection, "Team 2", Team2Id, 2, "#16a34a");
        var team3Id = await EnsureTeamAsync(connection, "Team 3", Team3Id, 3, "#f97316");

        await ClearSeedEntriesAsync(connection);
        await ClearSeedPlannerRowsAsync(connection);

        await UpsertProductionAsync(connection, PlannerProductionTeam1Id, team1Id, "TEST-J260344", "DEV ONLY Planner Linked Job - Team 1", 72, 480, 1005, 525, false);
        await UpsertProductionAsync(connection, PlannerProductionTeam2Id, team2Id, "TEST-J260013", "DEV ONLY Planner Linked Job - Team 2", 84, 540, 1065, 525, false);
        await UpsertProductionAsync(connection, PlannerProductionTeam3Id, team3Id, "TEST-J260387", "DEV ONLY Planner Linked Job - Team 3", 96, 450, 975, 525, true);

        await UpsertJobAsync(connection, JobNotStartedTeam1Id, PlannerProductionTeam1Id, team1Id, "TEST-J260344", "DEV ONLY Planner Linked Job - Team 1", "TEST Customer Alpha - DEV ONLY", "12 Test Yard Road", 1, 480, 1005, 525, "scheduled", null, null, null, false, false, false);
        await UpsertJobAsync(connection, JobSlowerTeam2Id, PlannerProductionTeam2Id, team2Id, "TEST-J260013", "DEV ONLY Planner Linked Job - Team 2", "TEST Customer Bravo - DEV ONLY", "45 Demo Street", 1, 540, 1065, 525, "in_progress", null, null, null, true, false, false);
        await UpsertJobAsync(connection, JobMultipleEntriesTeam3Id, PlannerProductionTeam3Id, team3Id, "TEST-J260387", "DEV ONLY Planner Linked Job - Team 3", "TEST Customer Cape - DEV ONLY", "78 Sample Avenue", 1, 450, 975, 525, "completed", "((now() at time zone 'Africa/Johannesburg')::date + time '07:30') AT TIME ZONE 'Africa/Johannesburg'", "((now() at time zone 'Africa/Johannesburg')::date + time '15:45') AT TIME ZONE 'Africa/Johannesburg'", 495, true, true, true);

        await InsertTimeEntryAsync(connection, StageSlowerPickingTeam2Id, JobSlowerTeam2Id, team2Id, PickingStage, "((now() at time zone 'Africa/Johannesburg')::date + time '09:00') AT TIME ZONE 'Africa/Johannesburg'", "((now() at time zone 'Africa/Johannesburg')::date + time '10:20') AT TIME ZONE 'Africa/Johannesburg'", 80, "completed", "DEV Team 2 picker", "DEV Team 2 picker", "Planner-linked stage example: Picking completed.");
        await InsertTimeEntryAsync(connection, StageSlowerSawingTeam2Id, JobSlowerTeam2Id, team2Id, SawingStage, "((now() at time zone 'Africa/Johannesburg')::date + time '10:30') AT TIME ZONE 'Africa/Johannesburg'", null, null, "in_progress", "DEV Team 2 sawyer", null, "Planner-linked stage example: Sawing in progress.");

        await InsertTimeEntryAsync(connection, EntryMultipleTeam3MorningId, JobMultipleEntriesTeam3Id, team3Id, OverallStage, "((now() at time zone 'Africa/Johannesburg')::date + time '07:30') AT TIME ZONE 'Africa/Johannesburg'", "((now() at time zone 'Africa/Johannesburg')::date + time '15:45') AT TIME ZONE 'Africa/Johannesburg'", 495, "completed", "DEV Team 3 worker", "DEV Team 3 worker", "Planner-linked overall completed job time.");
        await InsertTimeEntryAsync(connection, StageMultiplePickingTeam3Id, JobMultipleEntriesTeam3Id, team3Id, PickingStage, "((now() at time zone 'Africa/Johannesburg')::date + time '07:30') AT TIME ZONE 'Africa/Johannesburg'", "((now() at time zone 'Africa/Johannesburg')::date + time '08:40') AT TIME ZONE 'Africa/Johannesburg'", 70, "completed", "DEV Team 3 picker", "DEV Team 3 picker", "Planner-linked stage example: Picking completed.");
        await InsertTimeEntryAsync(connection, StageMultipleSawingTeam3Id, JobMultipleEntriesTeam3Id, team3Id, SawingStage, "((now() at time zone 'Africa/Johannesburg')::date + time '08:15') AT TIME ZONE 'Africa/Johannesburg'", "((now() at time zone 'Africa/Johannesburg')::date + time '10:45') AT TIME ZONE 'Africa/Johannesburg'", 150, "completed", "DEV Team 3 sawyer", "DEV Team 3 sawyer", "Planner-linked stage example: Sawing completed with overlap.");
        await InsertTimeEntryAsync(connection, StageMultipleProductionMorningTeam3Id, JobMultipleEntriesTeam3Id, team3Id, ProductionStage, "((now() at time zone 'Africa/Johannesburg')::date + time '10:00') AT TIME ZONE 'Africa/Johannesburg'", "((now() at time zone 'Africa/Johannesburg')::date + time '15:45') AT TIME ZONE 'Africa/Johannesburg'", 345, "completed", "DEV Team 3 production", "DEV Team 3 production", "Planner-linked stage example: Production completed.");

        await tx.CommitAsync();

        Console.WriteLine("Seeded DEV ONLY planner-linked job time tracking test data.");
        Console.WriteLine($"Database: {connection.Database}");
        Console.WriteLine("Teams: Team 1, Team 2, Team 3");
        Console.WriteLine("Planner jobs: TEST-J260344, TEST-J260013, TEST-J260387");
    }

    public static async Task RemoveAsync()
    {
        var connectionString = BuildConnectionString();
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();

        await EnsureSafeTargetAsync(connection);

        await using var tx = await connection.BeginTransactionAsync();
        await ClearSeedEntriesAsync(connection);
        await ClearSeedPlannerRowsAsync(connection);

        await tx.CommitAsync();

        Console.WriteLine("Removed DEV ONLY planner-linked job time tracking test data.");
        Console.WriteLine("Teams are left in place so existing Team 1/2/3 references are not disturbed.");
    }

    private static string BuildConnectionString()
    {
        var host = Environment.GetEnvironmentVariable("PGHOST") ?? "127.0.0.1";
        var port = int.TryParse(Environment.GetEnvironmentVariable("PGPORT"), out var parsedPort) ? parsedPort : 5432;
        var username = Environment.GetEnvironmentVariable("PGUSER") ?? "timbertracker";
        var password = Environment.GetEnvironmentVariable("PGPASSWORD") ?? "timbertracker";
        var database = Environment.GetEnvironmentVariable("PGDATABASE") ?? "timberflow_dev";

        return new NpgsqlConnectionStringBuilder
        {
            Host = host,
            Port = port,
            Username = username,
            Password = password,
            Database = database,
            SslMode = SslMode.Disable,
            Timeout = 30,
            CommandTimeout = 60
        }.ConnectionString;
    }

    private static async Task EnsureSafeTargetAsync(NpgsqlConnection connection)
    {
        var host = connection.Host ?? string.Empty;
        var database = connection.Database ?? string.Empty;
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");

        var isLocalHost = host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase)
            || host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
            || host.Equals("::1", StringComparison.OrdinalIgnoreCase);
        var looksProduction = database.Contains("prod", StringComparison.OrdinalIgnoreCase)
            || database.Contains("production", StringComparison.OrdinalIgnoreCase)
            || string.Equals(environment, "Production", StringComparison.OrdinalIgnoreCase);

        if (!isLocalHost || looksProduction)
        {
            throw new InvalidOperationException(
                $"Refusing to seed job-time test data against host '{host}', database '{database}', environment '{environment ?? "(unset)"}'. This command is local-dev only.");
        }

        await using var command = new NpgsqlCommand("SELECT current_database();", connection);
        await command.ExecuteScalarAsync();
    }

    private static async Task EnsureJobTimeEntriesTableAsync(NpgsqlConnection connection)
    {
        await ExecuteAsync(connection, """
            CREATE TABLE IF NOT EXISTS job_time_entries (
                id uuid PRIMARY KEY,
                job_id uuid NOT NULL REFERENCES team_work_items(id) ON DELETE CASCADE,
                team_id uuid NOT NULL REFERENCES jigs(id) ON DELETE CASCADE,
                stage_type varchar(50) NOT NULL DEFAULT 'overall',
                started_at timestamp with time zone NOT NULL,
                ended_at timestamp with time zone NULL,
                actual_duration_minutes integer NULL,
                status varchar(50) NOT NULL DEFAULT 'in_progress',
                started_by varchar(200) NULL,
                ended_by varchar(200) NULL,
                notes varchar(2000) NULL,
                created_on timestamp with time zone NOT NULL,
                modified_on timestamp with time zone NULL
            );

            ALTER TABLE job_time_entries
            ADD COLUMN IF NOT EXISTS stage_type varchar(50) NOT NULL DEFAULT 'overall';

            CREATE INDEX IF NOT EXISTS ix_job_time_entries_job_team
            ON job_time_entries (job_id, team_id);

            CREATE INDEX IF NOT EXISTS ix_job_time_entries_job_team_stage
            ON job_time_entries (job_id, team_id, stage_type);

            CREATE INDEX IF NOT EXISTS ix_job_time_entries_status
            ON job_time_entries (status);

            CREATE INDEX IF NOT EXISTS ix_job_time_entries_started_at
            ON job_time_entries (started_at);

            DROP INDEX IF EXISTS ix_job_time_entries_active_job_team;

            CREATE UNIQUE INDEX IF NOT EXISTS ix_job_time_entries_active_job_team_stage
            ON job_time_entries (job_id, team_id, stage_type)
            WHERE ended_at IS NULL AND status = 'in_progress';
            """);
    }

    private static async Task<Guid> EnsureTeamAsync(NpgsqlConnection connection, string name, Guid fallbackId, int displayOrder, string colour)
    {
        await using (var find = new NpgsqlCommand("SELECT id FROM jigs WHERE name = @name ORDER BY display_order, created_on NULLS LAST LIMIT 1;", connection))
        {
            find.Parameters.AddWithValue("name", name);
            var existing = await find.ExecuteScalarAsync();
            if (existing is Guid existingId)
            {
                return existingId;
            }
        }

        await using var insert = new NpgsqlCommand("""
            INSERT INTO jigs (id, name, description, average_efinks, display_order, colour, created_on)
            VALUES (@id, @name, @description, 80, @display_order, @colour, now())
            ON CONFLICT (id) DO UPDATE
            SET name = EXCLUDED.name,
                description = EXCLUDED.description,
                display_order = EXCLUDED.display_order,
                colour = EXCLUDED.colour,
                modified_on = now();
            """, connection);
        insert.Parameters.AddWithValue("id", fallbackId);
        insert.Parameters.AddWithValue("name", name);
        insert.Parameters.AddWithValue("description", SeedMarker);
        insert.Parameters.AddWithValue("display_order", displayOrder);
        insert.Parameters.AddWithValue("colour", colour);
        await insert.ExecuteNonQueryAsync();
        return fallbackId;
    }

    private static async Task UpsertJobAsync(
        NpgsqlConnection connection,
        Guid id,
        Guid productionId,
        Guid teamId,
        string orderNumber,
        string productionName,
        string customerName,
        string siteAddress,
        int sequence,
        int plannedStartMinutes,
        int plannedEndMinutes,
        int plannedDurationMinutes,
        string status,
        string? actualStartSql,
        string? actualEndSql,
        int? actualDurationMinutes,
        bool pickingComplete,
        bool sawingComplete,
        bool jiggingComplete)
    {
        var actualStartExpression = actualStartSql ?? "NULL";
        var actualEndExpression = actualEndSql ?? "NULL";
        var actualDurationExpression = actualDurationMinutes.HasValue ? actualDurationMinutes.Value.ToString() : "NULL";

        await using var command = new NpgsqlCommand($"""
            INSERT INTO team_work_items (
                id, production_id, order_number, customer_name, production_name, site_address,
                estimated_efinks, custom_duration_minutes, is_rollover_only, team_id, work_date,
                sequence, planned_start_minutes, planned_end_minutes, planned_duration_minutes,
                break_adjustment_minutes, actual_start_time, actual_end_time, actual_duration_minutes,
                status, rollover_sequence, overtime_enabled, early_overtime_enabled,
                picking_complete, sawing_complete, jigging_complete, needs_verification,
                created_on, modified_on
            )
            VALUES (
                @id, @production_id, @order_number, @customer_name, @production_name, @site_address,
                72, @planned_duration_minutes, FALSE, @team_id,
                (now() at time zone '{TimeZoneId}')::date,
                @sequence, @planned_start_minutes, @planned_end_minutes, @planned_duration_minutes,
                0, {actualStartExpression}, {actualEndExpression}, {actualDurationExpression},
                @status, 0, FALSE, FALSE,
                @picking_complete, @sawing_complete, @jigging_complete, FALSE,
                now(), now()
            )
            ON CONFLICT (id) DO UPDATE
            SET order_number = EXCLUDED.order_number,
                customer_name = EXCLUDED.customer_name,
                production_name = EXCLUDED.production_name,
                site_address = EXCLUDED.site_address,
                estimated_efinks = EXCLUDED.estimated_efinks,
                custom_duration_minutes = EXCLUDED.custom_duration_minutes,
                is_rollover_only = FALSE,
                team_id = EXCLUDED.team_id,
                work_date = EXCLUDED.work_date,
                sequence = EXCLUDED.sequence,
                planned_start_minutes = EXCLUDED.planned_start_minutes,
                planned_end_minutes = EXCLUDED.planned_end_minutes,
                planned_duration_minutes = EXCLUDED.planned_duration_minutes,
                break_adjustment_minutes = EXCLUDED.break_adjustment_minutes,
                actual_start_time = EXCLUDED.actual_start_time,
                actual_end_time = EXCLUDED.actual_end_time,
                actual_duration_minutes = EXCLUDED.actual_duration_minutes,
                status = EXCLUDED.status,
                rollover_sequence = EXCLUDED.rollover_sequence,
                overtime_enabled = EXCLUDED.overtime_enabled,
                early_overtime_enabled = EXCLUDED.early_overtime_enabled,
                picking_complete = EXCLUDED.picking_complete,
                sawing_complete = EXCLUDED.sawing_complete,
                jigging_complete = EXCLUDED.jigging_complete,
                needs_verification = EXCLUDED.needs_verification,
                modified_on = now();
            """, connection);

        command.Parameters.AddWithValue("id", id);
        command.Parameters.AddWithValue("production_id", productionId);
        command.Parameters.AddWithValue("order_number", orderNumber);
        command.Parameters.AddWithValue("customer_name", customerName);
        command.Parameters.AddWithValue("production_name", productionName);
        command.Parameters.AddWithValue("site_address", siteAddress);
        command.Parameters.AddWithValue("team_id", teamId);
        command.Parameters.AddWithValue("sequence", sequence);
        command.Parameters.AddWithValue("planned_start_minutes", plannedStartMinutes);
        command.Parameters.AddWithValue("planned_end_minutes", plannedEndMinutes);
        command.Parameters.AddWithValue("planned_duration_minutes", plannedDurationMinutes);
        command.Parameters.AddWithValue("status", status);
        command.Parameters.AddWithValue("picking_complete", pickingComplete);
        command.Parameters.AddWithValue("sawing_complete", sawingComplete);
        command.Parameters.AddWithValue("jigging_complete", jiggingComplete);
        await command.ExecuteNonQueryAsync();
    }

    private static async Task UpsertProductionAsync(
        NpgsqlConnection connection,
        Guid id,
        Guid teamId,
        string plannerJobNumber,
        string name,
        decimal estimatedEfinks,
        int plannedStartMinutes,
        int plannedEndMinutes,
        int plannedDurationMinutes,
        bool productionComplete)
    {
        await using var command = new NpgsqlCommand($"""
            INSERT INTO cr694_production (
                cr694_productionid, cr694_name, cr694_productioncomplete, cr694_productionplanneddate,
                new_estimatedefinks, custom_duration_minutes, jig_id, planned_start_date,
                planned_start_time, planned_end_time, planned_duration_minutes,
                break_adjustment_minutes, is_in_wip, is_batched
            )
            VALUES (
                @id, @name, @production_complete,
                (now() at time zone '{TimeZoneId}')::date,
                @estimated_efinks, @planned_duration_minutes, @team_id,
                (now() at time zone '{TimeZoneId}')::date,
                @planned_start_minutes, @planned_end_minutes, @planned_duration_minutes,
                0, TRUE, FALSE
            )
            ON CONFLICT (cr694_productionid) DO UPDATE
            SET cr694_name = EXCLUDED.cr694_name,
                cr694_productioncomplete = EXCLUDED.cr694_productioncomplete,
                cr694_productionplanneddate = EXCLUDED.cr694_productionplanneddate,
                new_estimatedefinks = EXCLUDED.new_estimatedefinks,
                custom_duration_minutes = EXCLUDED.custom_duration_minutes,
                jig_id = EXCLUDED.jig_id,
                planned_start_date = EXCLUDED.planned_start_date,
                planned_start_time = EXCLUDED.planned_start_time,
                planned_end_time = EXCLUDED.planned_end_time,
                planned_duration_minutes = EXCLUDED.planned_duration_minutes,
                break_adjustment_minutes = EXCLUDED.break_adjustment_minutes,
                is_in_wip = TRUE,
                is_batched = FALSE;
            """, connection);

        command.Parameters.AddWithValue("id", id);
        command.Parameters.AddWithValue("name", $"{plannerJobNumber} - {name}");
        command.Parameters.AddWithValue("production_complete", productionComplete);
        command.Parameters.AddWithValue("estimated_efinks", estimatedEfinks);
        command.Parameters.AddWithValue("planned_duration_minutes", plannedDurationMinutes);
        command.Parameters.AddWithValue("team_id", teamId);
        command.Parameters.AddWithValue("planned_start_minutes", plannedStartMinutes);
        command.Parameters.AddWithValue("planned_end_minutes", plannedEndMinutes);
        await command.ExecuteNonQueryAsync();
    }

    private static async Task InsertTimeEntryAsync(
        NpgsqlConnection connection,
        Guid id,
        Guid jobId,
        Guid teamId,
        string stageType,
        string startedAtSql,
        string? endedAtSql,
        int? durationMinutes,
        string status,
        string? startedBy,
        string? endedBy,
        string notes)
    {
        var endedAtExpression = endedAtSql ?? "NULL";
        var durationExpression = durationMinutes.HasValue ? durationMinutes.Value.ToString() : "NULL";

        await using var command = new NpgsqlCommand($"""
            INSERT INTO job_time_entries (
                id, job_id, team_id, stage_type, started_at, ended_at, actual_duration_minutes,
                status, started_by, ended_by, notes, created_on, modified_on
            )
            VALUES (
                @id, @job_id, @team_id, @stage_type, {startedAtSql}, {endedAtExpression}, {durationExpression},
                @status, @started_by, @ended_by, @notes, now(), now()
            );
            """, connection);

        command.Parameters.AddWithValue("id", id);
        command.Parameters.AddWithValue("job_id", jobId);
        command.Parameters.AddWithValue("team_id", teamId);
        command.Parameters.AddWithValue("stage_type", stageType);
        command.Parameters.AddWithValue("status", status);
        command.Parameters.AddWithValue("started_by", (object?)startedBy ?? DBNull.Value);
        command.Parameters.AddWithValue("ended_by", (object?)endedBy ?? DBNull.Value);
        command.Parameters.AddWithValue("notes", $"{SeedMarker}. {notes}");
        await command.ExecuteNonQueryAsync();
    }

    private static async Task ClearSeedEntriesAsync(NpgsqlConnection connection)
    {
        await using var delete = new NpgsqlCommand("""
            DELETE FROM job_time_entries
            WHERE job_id = ANY(@job_ids)
               OR notes LIKE @notes
               OR job_id IN (
                    SELECT id
                    FROM team_work_items
                    WHERE production_id = ANY(@production_ids)
                       OR order_number LIKE 'TEST-JT-%'
                       OR order_number LIKE 'TEST-J260%'
                       OR production_name LIKE 'TEST-J260% - DEV ONLY%'
                       OR production_name LIKE 'DEV ONLY Planner Linked Job%'
               );
            """, connection);
        delete.Parameters.AddWithValue("job_ids", SeedJobIds);
        delete.Parameters.AddWithValue("production_ids", SeedProductionIds);
        delete.Parameters.AddWithValue("notes", $"{SeedMarker}%");
        await delete.ExecuteNonQueryAsync();
    }

    private static async Task ClearSeedPlannerRowsAsync(NpgsqlConnection connection)
    {
        await using (var deleteJobs = new NpgsqlCommand("""
            DELETE FROM team_work_items
            WHERE id = ANY(@job_ids)
               OR production_id = ANY(@production_ids)
               OR order_number LIKE 'TEST-JT-%'
               OR order_number LIKE 'TEST-J260%'
               OR production_name LIKE 'TEST-J260% - DEV ONLY%'
               OR production_name LIKE 'DEV ONLY Planner Linked Job%';
            """, connection))
        {
            deleteJobs.Parameters.AddWithValue("job_ids", SeedJobIds);
            deleteJobs.Parameters.AddWithValue("production_ids", SeedProductionIds);
            await deleteJobs.ExecuteNonQueryAsync();
        }

        await using var deleteProductions = new NpgsqlCommand("""
            DELETE FROM cr694_production
            WHERE cr694_productionid = ANY(@production_ids)
               OR cr694_name LIKE 'TEST-J260% - DEV ONLY%';
            """, connection);
        deleteProductions.Parameters.AddWithValue("production_ids", SeedProductionIds);
        await deleteProductions.ExecuteNonQueryAsync();
    }

    private static async Task ExecuteAsync(NpgsqlConnection connection, string sql)
    {
        await using var command = new NpgsqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync();
    }
}
