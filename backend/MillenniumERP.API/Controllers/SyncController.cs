using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Infrastructure.Data;
using MillenniumERP.Domain.Entities;
using System.Diagnostics;
using System.Text.Json;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/sync")]
public class SyncController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<SyncController> _logger;
    private static bool _syncInProgress = false;
    private static readonly object _syncLock = new object();

    public SyncController(AppDbContext context, ILogger<SyncController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("d365/history")]
    public async Task<ActionResult<IEnumerable<object>>> GetSyncHistory()
    {
        var history = await _context.SyncHistories
            .OrderByDescending(h => h.LastAttemptUtc)
            .Take(50)
            .Select(h => new
            {
                h.Id,
                h.EntityName,
                h.LastSuccessfulSyncUtc,
                h.LastAttemptUtc,
                h.LastAttemptStatus,
                h.RecordsImported,
                h.DurationSeconds,
                h.ErrorMessage,
                h.CreatedOn
            })
            .ToListAsync();

        return Ok(history);
    }

    [HttpGet("d365/last-sync/{entity}")]
    public async Task<ActionResult<object>> GetLastSyncTimestamp(string entity)
    {
        var validEntities = new[] { "salesorder", "cr694_production" };
        if (!validEntities.Contains(entity.ToLowerInvariant()))
        {
            return BadRequest(new { message = $"Invalid entity. Supported entities: {string.Join(", ", validEntities)}" });
        }

        var lastSync = await _context.SyncHistories
            .Where(h => h.EntityName == entity.ToLowerInvariant() && h.LastAttemptStatus == "Success")
            .OrderByDescending(h => h.LastSuccessfulSyncUtc)
            .FirstOrDefaultAsync();

        return Ok(new
        {
            entity = entity.ToLowerInvariant(),
            lastSyncTimestamp = lastSync?.LastSuccessfulSyncUtc?.ToString("o"),
            last_sync_timestamp = lastSync?.LastSuccessfulSyncUtc?.ToString("o")
        });
    }

    [HttpPost("d365/trigger")]
    public async Task<ActionResult<object>> TriggerSync()
    {
        lock (_syncLock)
        {
            if (_syncInProgress)
            {
                return Conflict(new { message = "A sync operation is already in progress" });
            }
            _syncInProgress = true;
        }

        try
        {
            var results = new List<object>();
            var entities = new[] { "salesorder", "cr694_production" };

            foreach (var entity in entities)
            {
                var result = await RunSyncForEntity(entity);
                results.Add(result);
            }

            return Ok(new
            {
                success = true,
                message = "Sync completed",
                results
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during sync operation");
            return StatusCode(500, new { message = "Sync failed", error = ex.Message });
        }
        finally
        {
            lock (_syncLock)
            {
                _syncInProgress = false;
            }
        }
    }

    [HttpGet("d365/status")]
    public async Task<ActionResult<object>> GetSyncStatus()
    {
        var entities = new[] { "salesorder", "cr694_production" };
        var lastSyncs = new Dictionary<string, object?>();

        foreach (var entity in entities)
        {
            var lastSync = await _context.SyncHistories
                .Where(h => h.EntityName == entity && h.LastAttemptStatus == "Success")
                .OrderByDescending(h => h.LastSuccessfulSyncUtc)
                .FirstOrDefaultAsync();

            lastSyncs[entity] = lastSync != null
                ? new
                {
                    lastSyncTimestamp = lastSync.LastSuccessfulSyncUtc?.ToString("o"),
                    recordsImported = lastSync.RecordsImported,
                    durationSeconds = lastSync.DurationSeconds
                }
                : null;
        }

        return Ok(new
        {
            in_progress = _syncInProgress,
            inProgress = _syncInProgress,
            lastSync = lastSyncs
        });
    }

    private async Task<object> RunSyncForEntity(string entity)
    {
        var syncHistory = new SyncHistory
        {
            EntityName = entity,
            LastAttemptUtc = DateTime.UtcNow,
            LastAttemptStatus = "InProgress",
            CreatedOn = DateTime.UtcNow
        };

        _context.SyncHistories.Add(syncHistory);
        await _context.SaveChangesAsync();

        var stopwatch = Stopwatch.StartNew();

        try
        {
            var workingDirectory = Directory.GetCurrentDirectory();
            string? scriptPath = null;

            var searchPaths = new[]
            {
                Path.Combine(workingDirectory, "dynamics365_integration", "incremental_sync.py"),
                Path.GetFullPath(Path.Combine(workingDirectory, "..", "..", "dynamics365_integration", "incremental_sync.py")),
                Path.Combine(Directory.GetParent(workingDirectory)?.FullName ?? "", "dynamics365_integration", "incremental_sync.py"),
                "/home/runner/workspace/dynamics365_integration/incremental_sync.py",
                Path.GetFullPath(Path.Combine(workingDirectory, "..", "dynamics365_integration", "incremental_sync.py"))
            };

            foreach (var path in searchPaths)
            {
                _logger.LogInformation("Checking for sync script at: {Path} (exists: {Exists})", path, System.IO.File.Exists(path));
                if (System.IO.File.Exists(path))
                {
                    scriptPath = path;
                    break;
                }
            }

            if (scriptPath == null)
            {
                throw new FileNotFoundException(
                    $"Could not find incremental_sync.py. Working directory: {workingDirectory}. Searched paths: {string.Join(", ", searchPaths)}");
            }

            var isProduction = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Production"
                || Environment.GetEnvironmentVariable("REPLIT_DEPLOYMENT") == "1"
                || Environment.GetEnvironmentVariable("REPL_SLUG") != null;
            var apiPort = isProduction ? 5000 : 8000;
            var apiUrl = $"http://localhost:{apiPort}";

            _logger.LogInformation("Running sync script: python {ScriptPath} --entity {Entity} --api-url {ApiUrl} --quiet", scriptPath, entity, apiUrl);

            var startInfo = new ProcessStartInfo
            {
                FileName = "python",
                Arguments = $"\"{scriptPath}\" --entity {entity} --api-url {apiUrl} --quiet",
                WorkingDirectory = Path.GetDirectoryName(scriptPath) ?? workingDirectory,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = startInfo };
            process.Start();

            var output = await process.StandardOutput.ReadToEndAsync();
            var error = await process.StandardError.ReadToEndAsync();

            await process.WaitForExitAsync();

            stopwatch.Stop();

            if (process.ExitCode != 0)
            {
                throw new Exception($"Python script exited with code {process.ExitCode}. Error: {error}");
            }

            var result = ParseSyncOutput(output);

            syncHistory.LastAttemptStatus = result.Success ? "Success" : "Failed";
            syncHistory.LastSuccessfulSyncUtc = result.Success ? DateTime.UtcNow : null;
            syncHistory.RecordsImported = result.RecordsImported;
            syncHistory.DurationSeconds = stopwatch.Elapsed.TotalSeconds;
            syncHistory.ErrorMessage = result.Success ? null : string.Join("; ", result.Errors);

            await _context.SaveChangesAsync();

            _logger.LogInformation("Sync completed for {Entity}: {RecordsImported} records imported", entity, result.RecordsImported);

            return new
            {
                entity,
                success = result.Success,
                recordsFound = result.RecordsFound,
                recordsImported = result.RecordsImported,
                recordsSkipped = result.RecordsSkipped,
                durationSeconds = stopwatch.Elapsed.TotalSeconds,
                errors = result.Errors
            };
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            syncHistory.LastAttemptStatus = "Failed";
            syncHistory.DurationSeconds = stopwatch.Elapsed.TotalSeconds;
            syncHistory.ErrorMessage = ex.Message;

            await _context.SaveChangesAsync();

            _logger.LogError(ex, "Sync failed for entity {Entity}", entity);

            return new
            {
                entity,
                success = false,
                recordsFound = 0,
                recordsImported = 0,
                recordsSkipped = 0,
                durationSeconds = stopwatch.Elapsed.TotalSeconds,
                errors = new[] { ex.Message }
            };
        }
    }

    private SyncResult ParseSyncOutput(string output)
    {
        var result = new SyncResult();

        if (string.IsNullOrWhiteSpace(output))
        {
            result.Errors.Add("No output from sync script");
            return result;
        }

        try
        {
            var lines = output.Split('\n', StringSplitOptions.RemoveEmptyEntries);
            string? jsonLine = null;
            
            foreach (var line in lines.Reverse())
            {
                var trimmed = line.Trim();
                if (trimmed.StartsWith("{") && trimmed.EndsWith("}"))
                {
                    jsonLine = trimmed;
                    break;
                }
            }

            if (jsonLine != null)
            {
                using var doc = JsonDocument.Parse(jsonLine);
                var root = doc.RootElement;

                result.Success = root.TryGetProperty("success", out var successProp) && successProp.GetBoolean();
                result.RecordsFound = root.TryGetProperty("records_found", out var foundProp) ? foundProp.GetInt32() : 0;
                result.RecordsImported = root.TryGetProperty("records_imported", out var importedProp) ? importedProp.GetInt32() : 0;
                result.RecordsSkipped = root.TryGetProperty("records_skipped", out var skippedProp) ? skippedProp.GetInt32() : 0;

                if (root.TryGetProperty("errors", out var errorsProp) && errorsProp.ValueKind == JsonValueKind.Array)
                {
                    foreach (var error in errorsProp.EnumerateArray())
                    {
                        result.Errors.Add(error.GetString() ?? "Unknown error");
                    }
                }
            }
            else
            {
                result.Errors.Add("Could not find JSON output in script response");
            }
        }
        catch (JsonException ex)
        {
            result.Errors.Add($"Failed to parse sync output: {ex.Message}");
        }

        return result;
    }

    private class SyncResult
    {
        public bool Success { get; set; }
        public int RecordsFound { get; set; }
        public int RecordsImported { get; set; }
        public int RecordsSkipped { get; set; }
        public List<string> Errors { get; set; } = new();
    }
}
