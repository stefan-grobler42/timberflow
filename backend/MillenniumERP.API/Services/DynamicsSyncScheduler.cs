using System;
using System.Diagnostics;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Services;

public class DynamicsSyncScheduler : BackgroundService
{
    private readonly ILogger<DynamicsSyncScheduler> _logger;
    private readonly IServiceProvider _serviceProvider;
    private static readonly TimeSpan SastOffset = TimeSpan.FromHours(2);

    public DynamicsSyncScheduler(
        ILogger<DynamicsSyncScheduler> logger,
        IServiceProvider serviceProvider)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("D365 Sync Scheduler started. Waiting for next midnight SAST...");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var nextMidnight = GetNextMidnightSast();
                var delay = nextMidnight - DateTime.UtcNow;
                
                if (delay > TimeSpan.Zero)
                {
                    var nextMidnightSast = nextMidnight.Add(SastOffset);
                    _logger.LogInformation(
                        "Next D365 sync scheduled for {NextSync:yyyy-MM-dd HH:mm:ss} SAST (in {Hours}h {Minutes}m)",
                        nextMidnightSast,
                        (int)delay.TotalHours,
                        delay.Minutes);
                    
                    await Task.Delay(delay, stoppingToken);
                }

                if (!stoppingToken.IsCancellationRequested)
                {
                    await ExecuteScheduledSync(stoppingToken);
                }
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("D365 Sync Scheduler is stopping...");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in D365 sync scheduler. Will retry in 5 minutes.");
                try
                {
                    await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }
        
        _logger.LogInformation("D365 Sync Scheduler stopped.");
    }

    private DateTime GetNextMidnightSast()
    {
        var nowUtc = DateTime.UtcNow;
        var nowSast = nowUtc.Add(SastOffset);
        
        var tomorrowMidnightSast = nowSast.Date.AddDays(1);
        var nextMidnightUtc = tomorrowMidnightSast.Subtract(SastOffset);
        
        var timeUntilMidnight = nextMidnightUtc - nowUtc;
        if (timeUntilMidnight < TimeSpan.FromMinutes(1))
        {
            tomorrowMidnightSast = tomorrowMidnightSast.AddDays(1);
            nextMidnightUtc = tomorrowMidnightSast.Subtract(SastOffset);
        }
        
        return nextMidnightUtc;
    }

    private async Task ExecuteScheduledSync(CancellationToken stoppingToken)
    {
        var nowSast = DateTime.UtcNow.Add(SastOffset);
        _logger.LogInformation("Starting scheduled D365 sync at {Time:yyyy-MM-dd HH:mm:ss} SAST", nowSast);
        
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        
        var entities = new[] { "salesorder", "cr694_production" };
        var totalRecordsImported = 0;
        var successCount = 0;
        var failCount = 0;
        
        foreach (var entity in entities)
        {
            if (stoppingToken.IsCancellationRequested) break;
            
            var result = await RunEntitySync(context, entity, stoppingToken);
            if (result.Success)
            {
                successCount++;
                totalRecordsImported += result.RecordsImported;
            }
            else
            {
                failCount++;
            }
        }
        
        _logger.LogInformation(
            "Scheduled D365 sync completed. Entities: {Success} succeeded, {Failed} failed. Total records imported: {Records}",
            successCount, failCount, totalRecordsImported);
    }

    private async Task<SyncResult> RunEntitySync(AppDbContext context, string entity, CancellationToken ct)
    {
        var syncHistory = new SyncHistory
        {
            EntityName = entity,
            LastAttemptUtc = DateTime.UtcNow,
            LastAttemptStatus = "InProgress",
            CreatedOn = DateTime.UtcNow
        };

        context.SyncHistories.Add(syncHistory);
        await context.SaveChangesAsync(ct);

        var stopwatch = Stopwatch.StartNew();
        var result = new SyncResult();

        try
        {
            var scriptPath = FindSyncScript();
            
            if (string.IsNullOrEmpty(scriptPath))
            {
                throw new FileNotFoundException("Could not find incremental_sync.py script");
            }

            _logger.LogInformation("Running scheduled sync script: python {ScriptPath} --entity {Entity} --quiet", scriptPath, entity);

            var startInfo = new ProcessStartInfo
            {
                FileName = "python",
                Arguments = $"\"{scriptPath}\" --entity {entity} --quiet",
                WorkingDirectory = Path.GetDirectoryName(scriptPath) ?? Directory.GetCurrentDirectory(),
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = startInfo };
            process.Start();

            var output = await process.StandardOutput.ReadToEndAsync();
            var error = await process.StandardError.ReadToEndAsync();

            await process.WaitForExitAsync(ct);

            stopwatch.Stop();

            if (process.ExitCode != 0)
            {
                throw new Exception($"Python script exited with code {process.ExitCode}. Error: {error}");
            }

            result = ParseSyncOutput(output);

            syncHistory.LastAttemptStatus = result.Success ? "Success" : "Failed";
            syncHistory.LastSuccessfulSyncUtc = result.Success ? DateTime.UtcNow : null;
            syncHistory.RecordsImported = result.RecordsImported;
            syncHistory.DurationSeconds = stopwatch.Elapsed.TotalSeconds;
            syncHistory.ErrorMessage = result.Success ? null : string.Join("; ", result.Errors);

            await context.SaveChangesAsync(ct);

            _logger.LogInformation("Scheduled sync completed for {Entity}: {RecordsImported} records imported in {Duration:F2}s", 
                entity, result.RecordsImported, stopwatch.Elapsed.TotalSeconds);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            syncHistory.LastAttemptStatus = "Failed";
            syncHistory.DurationSeconds = stopwatch.Elapsed.TotalSeconds;
            syncHistory.ErrorMessage = ex.Message;

            await context.SaveChangesAsync(ct);

            _logger.LogError(ex, "Scheduled sync failed for entity {Entity}", entity);
            
            result.Success = false;
            result.Errors.Add(ex.Message);
        }

        return result;
    }

    private string? FindSyncScript()
    {
        var workingDirectory = Directory.GetCurrentDirectory();
        var projectRoot = Path.GetFullPath(Path.Combine(workingDirectory, "..", ".."));
        
        var searchPaths = new[]
        {
            Path.Combine(projectRoot, "dynamics365_integration", "incremental_sync.py"),
            Path.Combine(workingDirectory, "..", "..", "dynamics365_integration", "incremental_sync.py"),
            Path.Combine(workingDirectory, "dynamics365_integration", "incremental_sync.py"),
            Path.Combine(Directory.GetParent(workingDirectory)?.FullName ?? "", "dynamics365_integration", "incremental_sync.py"),
            "/home/runner/workspace/dynamics365_integration/incremental_sync.py"
        };

        foreach (var path in searchPaths)
        {
            if (File.Exists(path))
            {
                return Path.GetFullPath(path);
            }
        }

        return null;
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
