using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Infrastructure.Data;
using System.Reflection;
using System.Text.RegularExpressions;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DuplicatesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<DuplicatesController> _logger;

    public DuplicatesController(AppDbContext context, ILogger<DuplicatesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpPost("find")]
    public async Task<ActionResult<DuplicateDetectionResponse>> FindDuplicates([FromBody] DuplicateDetectionRequest request)
    {
        try
        {
            var entityType = GetEntityType(request.EntityType);
            if (entityType == null)
            {
                return BadRequest(new { message = $"Unknown entity type: {request.EntityType}" });
            }

            var duplicateGroups = new List<DuplicateGroup>();
            var hasFuzzyRules = request.MatchRules.Any(r => r.MatchType.ToLower() == "fuzzy");

            if (!hasFuzzyRules && request.MatchRules.Count == 1)
            {
                duplicateGroups = await FindDuplicatesUsingDatabase(entityType, request);
            }
            else
            {
                duplicateGroups = await FindDuplicatesUsingHybridApproach(entityType, request);
            }

            var response = new DuplicateDetectionResponse
            {
                DuplicateGroups = duplicateGroups,
                TotalDuplicates = duplicateGroups.Sum(g => g.DuplicateRecords.Count)
            };

            _logger.LogInformation("Found {GroupCount} duplicate groups with {TotalDuplicates} total duplicates for {EntityType}",
                duplicateGroups.Count, response.TotalDuplicates, request.EntityType);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding duplicates for {EntityType}", request.EntityType);
            return StatusCode(500, new { message = "Error finding duplicates", error = ex.Message });
        }
    }

    private async Task<List<DuplicateGroup>> FindDuplicatesUsingDatabase(Type entityType, DuplicateDetectionRequest request)
    {
        var duplicateGroups = new List<DuplicateGroup>();
        var rule = request.MatchRules[0];
        var fieldName = rule.FieldName.ToLower();
        var isCaseInsensitive = rule.MatchType.ToLower() == "caseinsensitive";

        // Database-side grouping using typed queries - NO full-table ToListAsync
        List<List<object>> groups;

        if (entityType == typeof(Domain.Entities.Account))
        {
            groups = await FindAccountDuplicates(fieldName, isCaseInsensitive);
        }
        else if (entityType == typeof(Domain.Entities.Contact))
        {
            groups = await FindContactDuplicates(fieldName, isCaseInsensitive);
        }
        else if (entityType == typeof(Domain.Entities.D365Contact))
        {
            groups = await FindD365ContactDuplicates(fieldName, isCaseInsensitive);
        }
        else if (entityType == typeof(Domain.Entities.Customer))
        {
            groups = await FindCustomerDuplicates(fieldName, isCaseInsensitive);
        }
        else if (entityType == typeof(Domain.Entities.Employee))
        {
            groups = await FindEmployeeDuplicates(fieldName, isCaseInsensitive);
        }
        else
        {
            return duplicateGroups;
        }

        foreach (var group in groups)
        {
            if (group.Count < 2)
                continue;

            var master = group[0];
            var duplicates = new List<DuplicateRecordInfo>();

            for (int i = 1; i < group.Count; i++)
            {
                duplicates.Add(new DuplicateRecordInfo
                {
                    Id = GetRecordId(group[i]),
                    Fields = GetRecordFields(group[i], request.MatchRules),
                    MatchScore = 100
                });
            }

            duplicateGroups.Add(new DuplicateGroup
            {
                MasterRecord = new DuplicateRecordInfo
                {
                    Id = GetRecordId(master),
                    Fields = GetRecordFields(master, request.MatchRules),
                    MatchScore = 100
                },
                DuplicateRecords = duplicates
            });
        }

        return duplicateGroups;
    }

    private async Task<List<List<object>>> FindAccountDuplicates(string fieldName, bool caseInsensitive)
    {
        if (fieldName == "name")
        {
            // Step 1: Find keys that have duplicates (pure aggregation - EF CAN translate)
            var duplicateKeys = caseInsensitive
                ? await _context.Accounts
                    .Where(a => a.Name != null)
                    .GroupBy(a => a.Name.ToLower())
                    .Where(g => g.Count() > 1)
                    .Select(g => g.Key)
                    .ToListAsync()
                : await _context.Accounts
                    .Where(a => a.Name != null)
                    .GroupBy(a => a.Name)
                    .Where(g => g.Count() > 1)
                    .Select(g => g.Key)
                    .ToListAsync();

            // Step 2: Join back to get actual records
            var duplicateRecords = caseInsensitive
                ? await _context.Accounts
                    .Where(a => a.Name != null && duplicateKeys.Contains(a.Name.ToLower()))
                    .ToListAsync()
                : await _context.Accounts
                    .Where(a => a.Name != null && duplicateKeys.Contains(a.Name))
                    .ToListAsync();

            // Step 3: Group in memory (small dataset - only duplicates)
            var groups = caseInsensitive
                ? duplicateRecords
                    .GroupBy(a => a.Name.ToLower())
                    .Select(g => g.Cast<object>().ToList())
                    .ToList()
                : duplicateRecords
                    .GroupBy(a => a.Name)
                    .Select(g => g.Cast<object>().ToList())
                    .ToList();

            return groups;
        }
        return new List<List<object>>();
    }

    private async Task<List<List<object>>> FindContactDuplicates(string fieldName, bool caseInsensitive)
    {
        if (fieldName == "firstname" || fieldName == "name")
        {
            // Step 1: Find keys that have duplicates (pure aggregation - EF CAN translate)
            var duplicateKeys = caseInsensitive
                ? await _context.Contacts
                    .Where(c => c.FirstName != null)
                    .GroupBy(c => c.FirstName.ToLower())
                    .Where(g => g.Count() > 1)
                    .Select(g => g.Key)
                    .ToListAsync()
                : await _context.Contacts
                    .Where(c => c.FirstName != null)
                    .GroupBy(c => c.FirstName)
                    .Where(g => g.Count() > 1)
                    .Select(g => g.Key)
                    .ToListAsync();

            // Step 2: Join back to get actual records
            var duplicateRecords = caseInsensitive
                ? await _context.Contacts
                    .Where(c => c.FirstName != null && duplicateKeys.Contains(c.FirstName.ToLower()))
                    .ToListAsync()
                : await _context.Contacts
                    .Where(c => c.FirstName != null && duplicateKeys.Contains(c.FirstName))
                    .ToListAsync();

            // Step 3: Group in memory (small dataset - only duplicates)
            var groups = caseInsensitive
                ? duplicateRecords
                    .GroupBy(c => c.FirstName.ToLower())
                    .Select(g => g.Cast<object>().ToList())
                    .ToList()
                : duplicateRecords
                    .GroupBy(c => c.FirstName)
                    .Select(g => g.Cast<object>().ToList())
                    .ToList();

            return groups;
        }
        else if (fieldName == "email")
        {
            // Step 1: Find keys that have duplicates (pure aggregation - EF CAN translate)
            var duplicateKeys = await _context.Contacts
                .Where(c => c.Email != null)
                .GroupBy(c => c.Email.ToLower())
                .Where(g => g.Count() > 1)
                .Select(g => g.Key)
                .ToListAsync();

            // Step 2: Join back to get actual records
            var duplicateRecords = await _context.Contacts
                .Where(c => c.Email != null && duplicateKeys.Contains(c.Email.ToLower()))
                .ToListAsync();

            // Step 3: Group in memory (small dataset - only duplicates)
            var groups = duplicateRecords
                .GroupBy(c => c.Email.ToLower())
                .Select(g => g.Cast<object>().ToList())
                .ToList();

            return groups;
        }
        return new List<List<object>>();
    }

    private async Task<List<List<object>>> FindD365ContactDuplicates(string fieldName, bool caseInsensitive)
    {
        if (fieldName == "firstname" || fieldName == "name")
        {
            // Step 1: Find keys that have duplicates (pure aggregation - EF CAN translate)
            var duplicateKeys = caseInsensitive
                ? await _context.D365Contacts
                    .Where(c => c.FirstName != null)
                    .GroupBy(c => c.FirstName.ToLower())
                    .Where(g => g.Count() > 1)
                    .Select(g => g.Key)
                    .ToListAsync()
                : await _context.D365Contacts
                    .Where(c => c.FirstName != null)
                    .GroupBy(c => c.FirstName)
                    .Where(g => g.Count() > 1)
                    .Select(g => g.Key)
                    .ToListAsync();

            // Step 2: Join back to get actual records
            var duplicateRecords = caseInsensitive
                ? await _context.D365Contacts
                    .Where(c => c.FirstName != null && duplicateKeys.Contains(c.FirstName.ToLower()))
                    .ToListAsync()
                : await _context.D365Contacts
                    .Where(c => c.FirstName != null && duplicateKeys.Contains(c.FirstName))
                    .ToListAsync();

            // Step 3: Group in memory (small dataset - only duplicates)
            var groups = caseInsensitive
                ? duplicateRecords
                    .GroupBy(c => c.FirstName.ToLower())
                    .Select(g => g.Cast<object>().ToList())
                    .ToList()
                : duplicateRecords
                    .GroupBy(c => c.FirstName)
                    .Select(g => g.Cast<object>().ToList())
                    .ToList();

            return groups;
        }
        else if (fieldName == "emailaddress1" || fieldName == "email")
        {
            // Step 1: Find keys that have duplicates (pure aggregation - EF CAN translate)
            var duplicateKeys = await _context.D365Contacts
                .Where(c => c.EmailAddress1 != null)
                .GroupBy(c => c.EmailAddress1.ToLower())
                .Where(g => g.Count() > 1)
                .Select(g => g.Key)
                .ToListAsync();

            // Step 2: Join back to get actual records
            var duplicateRecords = await _context.D365Contacts
                .Where(c => c.EmailAddress1 != null && duplicateKeys.Contains(c.EmailAddress1.ToLower()))
                .ToListAsync();

            // Step 3: Group in memory (small dataset - only duplicates)
            var groups = duplicateRecords
                .GroupBy(c => c.EmailAddress1.ToLower())
                .Select(g => g.Cast<object>().ToList())
                .ToList();

            return groups;
        }
        return new List<List<object>>();
    }

    private async Task<List<List<object>>> FindCustomerDuplicates(string fieldName, bool caseInsensitive)
    {
        if (fieldName == "name" || fieldName == "accountname")
        {
            // Step 1: Find keys that have duplicates (pure aggregation - EF CAN translate)
            var duplicateKeys = caseInsensitive
                ? await _context.Customers
                    .Where(c => c.AccountName != null)
                    .GroupBy(c => c.AccountName.ToLower())
                    .Where(g => g.Count() > 1)
                    .Select(g => g.Key)
                    .ToListAsync()
                : await _context.Customers
                    .Where(c => c.AccountName != null)
                    .GroupBy(c => c.AccountName)
                    .Where(g => g.Count() > 1)
                    .Select(g => g.Key)
                    .ToListAsync();

            // Step 2: Join back to get actual records
            var duplicateRecords = caseInsensitive
                ? await _context.Customers
                    .Where(c => c.AccountName != null && duplicateKeys.Contains(c.AccountName.ToLower()))
                    .ToListAsync()
                : await _context.Customers
                    .Where(c => c.AccountName != null && duplicateKeys.Contains(c.AccountName))
                    .ToListAsync();

            // Step 3: Group in memory (small dataset - only duplicates)
            var groups = caseInsensitive
                ? duplicateRecords
                    .GroupBy(c => c.AccountName.ToLower())
                    .Select(g => g.Cast<object>().ToList())
                    .ToList()
                : duplicateRecords
                    .GroupBy(c => c.AccountName)
                    .Select(g => g.Cast<object>().ToList())
                    .ToList();

            return groups;
        }
        return new List<List<object>>();
    }

    private async Task<List<List<object>>> FindEmployeeDuplicates(string fieldName, bool caseInsensitive)
    {
        if (fieldName == "name")
        {
            // Step 1: Find keys that have duplicates (pure aggregation - EF CAN translate)
            var duplicateKeys = caseInsensitive
                ? await _context.Employees
                    .Where(e => e.Name != null)
                    .GroupBy(e => e.Name.ToLower())
                    .Where(g => g.Count() > 1)
                    .Select(g => g.Key)
                    .ToListAsync()
                : await _context.Employees
                    .Where(e => e.Name != null)
                    .GroupBy(e => e.Name)
                    .Where(g => g.Count() > 1)
                    .Select(g => g.Key)
                    .ToListAsync();

            // Step 2: Join back to get actual records
            var duplicateRecords = caseInsensitive
                ? await _context.Employees
                    .Where(e => e.Name != null && duplicateKeys.Contains(e.Name.ToLower()))
                    .ToListAsync()
                : await _context.Employees
                    .Where(e => e.Name != null && duplicateKeys.Contains(e.Name))
                    .ToListAsync();

            // Step 3: Group in memory (small dataset - only duplicates)
            var groups = caseInsensitive
                ? duplicateRecords
                    .GroupBy(e => e.Name.ToLower())
                    .Select(g => g.Cast<object>().ToList())
                    .ToList()
                : duplicateRecords
                    .GroupBy(e => e.Name)
                    .Select(g => g.Cast<object>().ToList())
                    .ToList();

            return groups;
        }
        return new List<List<object>>();
    }

    private async Task<List<DuplicateGroup>> FindDuplicatesUsingHybridApproach(Type entityType, DuplicateDetectionRequest request)
    {
        var duplicateGroups = new List<DuplicateGroup>();
        var processedIds = new HashSet<string>();

        var primaryRule = request.MatchRules
            .OrderByDescending(r => r.Weight)
            .FirstOrDefault(r => r.MatchType.ToLower() != "fuzzy");

        List<object> candidates;
        
        if (primaryRule != null)
        {
            candidates = await GetCandidatesByPrimaryRule(entityType, primaryRule);
        }
        else
        {
            var fuzzyRule = request.MatchRules.FirstOrDefault(r => r.MatchType.ToLower() == "fuzzy");
            candidates = await GetCandidatesForFuzzyMatch(entityType, fuzzyRule);
        }

        for (int i = 0; i < candidates.Count; i++)
        {
            var record = candidates[i];
            var recordId = GetRecordId(record);

            if (processedIds.Contains(recordId))
                continue;

            var duplicates = new List<DuplicateRecordInfo>();

            for (int j = i + 1; j < candidates.Count; j++)
            {
                var compareRecord = candidates[j];
                var compareId = GetRecordId(compareRecord);

                if (processedIds.Contains(compareId))
                    continue;

                var score = CalculateMatchScore(record, compareRecord, request.MatchRules);

                if (score >= request.MinimumScore)
                {
                    duplicates.Add(new DuplicateRecordInfo
                    {
                        Id = compareId,
                        Fields = GetRecordFields(compareRecord, request.MatchRules),
                        MatchScore = score
                    });
                    processedIds.Add(compareId);
                }
            }

            if (duplicates.Count > 0)
            {
                processedIds.Add(recordId);
                duplicateGroups.Add(new DuplicateGroup
                {
                    MasterRecord = new DuplicateRecordInfo
                    {
                        Id = recordId,
                        Fields = GetRecordFields(record, request.MatchRules),
                        MatchScore = 100
                    },
                    DuplicateRecords = duplicates.OrderByDescending(d => d.MatchScore).ToList()
                });
            }
        }

        return duplicateGroups;
    }

    private async Task<List<object>> GetCandidatesByPrimaryRule(Type entityType, DuplicateMatchRule rule)
    {
        var fieldName = rule.FieldName.ToLower();
        var isCaseInsensitive = rule.MatchType.ToLower() == "caseinsensitive";

        // Database-side grouping with SelectMany - NO full-table ToListAsync
        if (entityType == typeof(Domain.Entities.Account))
        {
            return await GetAccountCandidates(fieldName, isCaseInsensitive);
        }
        else if (entityType == typeof(Domain.Entities.Contact))
        {
            return await GetContactCandidates(fieldName, isCaseInsensitive);
        }
        else if (entityType == typeof(Domain.Entities.D365Contact))
        {
            return await GetD365ContactCandidates(fieldName, isCaseInsensitive);
        }
        else if (entityType == typeof(Domain.Entities.Customer))
        {
            return await GetCustomerCandidates(fieldName, isCaseInsensitive);
        }
        else if (entityType == typeof(Domain.Entities.Employee))
        {
            return await GetEmployeeCandidates(fieldName, isCaseInsensitive);
        }

        return new List<object>();
    }

    private async Task<List<object>> GetAccountCandidates(string fieldName, bool caseInsensitive)
    {
        if (fieldName == "name")
        {
            // Step 1: Find keys that have duplicates (pure aggregation - EF CAN translate)
            var duplicateKeys = caseInsensitive
                ? await _context.Accounts
                    .Where(a => a.Name != null && a.Name != "")
                    .GroupBy(a => a.Name.ToLower())
                    .Where(g => g.Count() > 1)
                    .Select(g => g.Key)
                    .ToListAsync()
                : await _context.Accounts
                    .Where(a => a.Name != null && a.Name != "")
                    .GroupBy(a => a.Name)
                    .Where(g => g.Count() > 1)
                    .Select(g => g.Key)
                    .ToListAsync();

            // Step 2: Join back to get actual records
            var candidates = caseInsensitive
                ? await _context.Accounts
                    .Where(a => a.Name != null && a.Name != "" && duplicateKeys.Contains(a.Name.ToLower()))
                    .ToListAsync()
                : await _context.Accounts
                    .Where(a => a.Name != null && a.Name != "" && duplicateKeys.Contains(a.Name))
                    .ToListAsync();

            return candidates.Cast<object>().ToList();
        }
        return new List<object>();
    }

    private async Task<List<object>> GetContactCandidates(string fieldName, bool caseInsensitive)
    {
        if (fieldName == "firstname" || fieldName == "name")
        {
            // Step 1: Find keys that have duplicates (pure aggregation - EF CAN translate)
            var duplicateKeys = caseInsensitive
                ? await _context.Contacts
                    .Where(c => c.FirstName != null && c.FirstName != "")
                    .GroupBy(c => c.FirstName.ToLower())
                    .Where(g => g.Count() > 1)
                    .Select(g => g.Key)
                    .ToListAsync()
                : await _context.Contacts
                    .Where(c => c.FirstName != null && c.FirstName != "")
                    .GroupBy(c => c.FirstName)
                    .Where(g => g.Count() > 1)
                    .Select(g => g.Key)
                    .ToListAsync();

            // Step 2: Join back to get actual records
            var candidates = caseInsensitive
                ? await _context.Contacts
                    .Where(c => c.FirstName != null && c.FirstName != "" && duplicateKeys.Contains(c.FirstName.ToLower()))
                    .ToListAsync()
                : await _context.Contacts
                    .Where(c => c.FirstName != null && c.FirstName != "" && duplicateKeys.Contains(c.FirstName))
                    .ToListAsync();

            return candidates.Cast<object>().ToList();
        }
        else if (fieldName == "email")
        {
            // Step 1: Find keys that have duplicates (pure aggregation - EF CAN translate)
            var duplicateKeys = await _context.Contacts
                .Where(c => c.Email != null && c.Email != "")
                .GroupBy(c => c.Email.ToLower())
                .Where(g => g.Count() > 1)
                .Select(g => g.Key)
                .ToListAsync();

            // Step 2: Join back to get actual records
            var candidates = await _context.Contacts
                .Where(c => c.Email != null && c.Email != "" && duplicateKeys.Contains(c.Email.ToLower()))
                .ToListAsync();

            return candidates.Cast<object>().ToList();
        }
        return new List<object>();
    }

    private async Task<List<object>> GetD365ContactCandidates(string fieldName, bool caseInsensitive)
    {
        if (fieldName == "firstname" || fieldName == "name")
        {
            // Step 1: Find keys that have duplicates (pure aggregation - EF CAN translate)
            var duplicateKeys = caseInsensitive
                ? await _context.D365Contacts
                    .Where(c => c.FirstName != null && c.FirstName != "")
                    .GroupBy(c => c.FirstName.ToLower())
                    .Where(g => g.Count() > 1)
                    .Select(g => g.Key)
                    .ToListAsync()
                : await _context.D365Contacts
                    .Where(c => c.FirstName != null && c.FirstName != "")
                    .GroupBy(c => c.FirstName)
                    .Where(g => g.Count() > 1)
                    .Select(g => g.Key)
                    .ToListAsync();

            // Step 2: Join back to get actual records
            var candidates = caseInsensitive
                ? await _context.D365Contacts
                    .Where(c => c.FirstName != null && c.FirstName != "" && duplicateKeys.Contains(c.FirstName.ToLower()))
                    .ToListAsync()
                : await _context.D365Contacts
                    .Where(c => c.FirstName != null && c.FirstName != "" && duplicateKeys.Contains(c.FirstName))
                    .ToListAsync();

            return candidates.Cast<object>().ToList();
        }
        else if (fieldName == "emailaddress1" || fieldName == "email")
        {
            // Step 1: Find keys that have duplicates (pure aggregation - EF CAN translate)
            var duplicateKeys = await _context.D365Contacts
                .Where(c => c.EmailAddress1 != null && c.EmailAddress1 != "")
                .GroupBy(c => c.EmailAddress1.ToLower())
                .Where(g => g.Count() > 1)
                .Select(g => g.Key)
                .ToListAsync();

            // Step 2: Join back to get actual records
            var candidates = await _context.D365Contacts
                .Where(c => c.EmailAddress1 != null && c.EmailAddress1 != "" && duplicateKeys.Contains(c.EmailAddress1.ToLower()))
                .ToListAsync();

            return candidates.Cast<object>().ToList();
        }
        return new List<object>();
    }

    private async Task<List<object>> GetCustomerCandidates(string fieldName, bool caseInsensitive)
    {
        if (fieldName == "name" || fieldName == "accountname")
        {
            // Step 1: Find keys that have duplicates (pure aggregation - EF CAN translate)
            var duplicateKeys = caseInsensitive
                ? await _context.Customers
                    .Where(c => c.AccountName != null && c.AccountName != "")
                    .GroupBy(c => c.AccountName.ToLower())
                    .Where(g => g.Count() > 1)
                    .Select(g => g.Key)
                    .ToListAsync()
                : await _context.Customers
                    .Where(c => c.AccountName != null && c.AccountName != "")
                    .GroupBy(c => c.AccountName)
                    .Where(g => g.Count() > 1)
                    .Select(g => g.Key)
                    .ToListAsync();

            // Step 2: Join back to get actual records
            var candidates = caseInsensitive
                ? await _context.Customers
                    .Where(c => c.AccountName != null && c.AccountName != "" && duplicateKeys.Contains(c.AccountName.ToLower()))
                    .ToListAsync()
                : await _context.Customers
                    .Where(c => c.AccountName != null && c.AccountName != "" && duplicateKeys.Contains(c.AccountName))
                    .ToListAsync();

            return candidates.Cast<object>().ToList();
        }
        return new List<object>();
    }

    private async Task<List<object>> GetEmployeeCandidates(string fieldName, bool caseInsensitive)
    {
        if (fieldName == "name")
        {
            // Step 1: Find keys that have duplicates (pure aggregation - EF CAN translate)
            var duplicateKeys = caseInsensitive
                ? await _context.Employees
                    .Where(e => e.Name != null && e.Name != "")
                    .GroupBy(e => e.Name.ToLower())
                    .Where(g => g.Count() > 1)
                    .Select(g => g.Key)
                    .ToListAsync()
                : await _context.Employees
                    .Where(e => e.Name != null && e.Name != "")
                    .GroupBy(e => e.Name)
                    .Where(g => g.Count() > 1)
                    .Select(g => g.Key)
                    .ToListAsync();

            // Step 2: Join back to get actual records
            var candidates = caseInsensitive
                ? await _context.Employees
                    .Where(e => e.Name != null && e.Name != "" && duplicateKeys.Contains(e.Name.ToLower()))
                    .ToListAsync()
                : await _context.Employees
                    .Where(e => e.Name != null && e.Name != "" && duplicateKeys.Contains(e.Name))
                    .ToListAsync();

            return candidates.Cast<object>().ToList();
        }
        return new List<object>();
    }

    private async Task<List<object>> GetCandidatesForFuzzyMatch(Type entityType, DuplicateMatchRule? rule)
    {
        if (rule == null)
            return new List<object>();

        var fieldName = rule.FieldName.ToLower();

        // Database-side narrowing for fuzzy match - NO full-table ToListAsync
        if (entityType == typeof(Domain.Entities.Account))
        {
            return await GetAccountFuzzyCandidates(fieldName);
        }
        else if (entityType == typeof(Domain.Entities.Contact))
        {
            return await GetContactFuzzyCandidates(fieldName);
        }
        else if (entityType == typeof(Domain.Entities.D365Contact))
        {
            return await GetD365ContactFuzzyCandidates(fieldName);
        }
        else if (entityType == typeof(Domain.Entities.Customer))
        {
            return await GetCustomerFuzzyCandidates(fieldName);
        }
        else if (entityType == typeof(Domain.Entities.Employee))
        {
            return await GetEmployeeFuzzyCandidates(fieldName);
        }

        return new List<object>();
    }

    private async Task<List<object>> GetAccountFuzzyCandidates(string fieldName)
    {
        if (fieldName == "name")
        {
            // Database-side narrowing: group by first 3 chars + length bucket
            var candidates = await _context.Accounts
                .Where(a => a.Name != null && a.Name.Length >= 3)
                .GroupBy(a => new { 
                    Prefix = a.Name.Substring(0, 3).ToLower(),
                    LengthBucket = a.Name.Length / 5
                })
                .Where(g => g.Count() > 1)
                .SelectMany(g => g)
                .ToListAsync();
            return candidates.Cast<object>().ToList();
        }
        return new List<object>();
    }

    private async Task<List<object>> GetContactFuzzyCandidates(string fieldName)
    {
        if (fieldName == "firstname" || fieldName == "name")
        {
            var candidates = await _context.Contacts
                .Where(c => c.FirstName != null && c.FirstName.Length >= 3)
                .GroupBy(c => new { 
                    Prefix = c.FirstName.Substring(0, 3).ToLower(),
                    LengthBucket = c.FirstName.Length / 5
                })
                .Where(g => g.Count() > 1)
                .SelectMany(g => g)
                .ToListAsync();
            return candidates.Cast<object>().ToList();
        }
        return new List<object>();
    }

    private async Task<List<object>> GetD365ContactFuzzyCandidates(string fieldName)
    {
        if (fieldName == "firstname" || fieldName == "name")
        {
            var candidates = await _context.D365Contacts
                .Where(c => c.FirstName != null && c.FirstName.Length >= 3)
                .GroupBy(c => new { 
                    Prefix = c.FirstName.Substring(0, 3).ToLower(),
                    LengthBucket = c.FirstName.Length / 5
                })
                .Where(g => g.Count() > 1)
                .SelectMany(g => g)
                .ToListAsync();
            return candidates.Cast<object>().ToList();
        }
        return new List<object>();
    }

    private async Task<List<object>> GetCustomerFuzzyCandidates(string fieldName)
    {
        if (fieldName == "name" || fieldName == "accountname")
        {
            var candidates = await _context.Customers
                .Where(c => c.AccountName != null && c.AccountName.Length >= 3)
                .GroupBy(c => new { 
                    Prefix = c.AccountName.Substring(0, 3).ToLower(),
                    LengthBucket = c.AccountName.Length / 5
                })
                .Where(g => g.Count() > 1)
                .SelectMany(g => g)
                .ToListAsync();
            return candidates.Cast<object>().ToList();
        }
        return new List<object>();
    }

    private async Task<List<object>> GetEmployeeFuzzyCandidates(string fieldName)
    {
        if (fieldName == "name")
        {
            var candidates = await _context.Employees
                .Where(e => e.Name != null && e.Name.Length >= 3)
                .GroupBy(e => new { 
                    Prefix = e.Name.Substring(0, 3).ToLower(),
                    LengthBucket = e.Name.Length / 5
                })
                .Where(g => g.Count() > 1)
                .SelectMany(g => g)
                .ToListAsync();
            return candidates.Cast<object>().ToList();
        }
        return new List<object>();
    }

    [HttpPost("merge")]
    public async Task<ActionResult<DuplicateMergeResponse>> MergeDuplicates([FromBody] DuplicateMergeRequest request)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var entityType = GetEntityType(request.EntityType);
            if (entityType == null)
            {
                return BadRequest(new { message = $"Unknown entity type: {request.EntityType}" });
            }

            var messages = new List<string>();
            var masterRecord = await GetRecordById(entityType, request.MasterRecordId);
            
            if (masterRecord == null)
            {
                return NotFound(new { message = $"Master record {request.MasterRecordId} not found" });
            }

            var duplicateRecords = new List<object>();
            foreach (var duplicateId in request.DuplicateRecordIds)
            {
                var record = await GetRecordById(entityType, duplicateId);
                if (record != null)
                {
                    duplicateRecords.Add(record);
                }
            }

            ApplyFieldSelections(masterRecord, request.FieldSelections);
            
            var relinkedCount = 0;
            
            if (request.EntityType.ToLower() == "accounts")
            {
                relinkedCount = await RelinkAccountRecords(request.MasterRecordId, request.DuplicateRecordIds);
            }
            else if (request.EntityType.ToLower() == "contacts" || request.EntityType.ToLower() == "d365contacts")
            {
                relinkedCount = await RelinkContactRecords(request.MasterRecordId, request.DuplicateRecordIds);
            }

            foreach (var duplicateRecord in duplicateRecords)
            {
                _context.Remove(duplicateRecord);
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            messages.Add($"Merged {duplicateRecords.Count} duplicate records into master record {request.MasterRecordId}");
            messages.Add($"Relinked {relinkedCount} related records");
            messages.Add($"Deleted {duplicateRecords.Count} duplicate records");

            var response = new DuplicateMergeResponse
            {
                MergedRecordId = request.MasterRecordId,
                DeletedRecordCount = duplicateRecords.Count,
                RelinkedRecordCount = relinkedCount,
                Messages = messages
            };

            _logger.LogInformation("Merged {Count} duplicates into {MasterId} for {EntityType}",
                duplicateRecords.Count, request.MasterRecordId, request.EntityType);

            return Ok(response);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error merging duplicates for {EntityType}", request.EntityType);
            return StatusCode(500, new { message = "Error merging duplicates", error = ex.Message });
        }
    }

    private Type? GetEntityType(string entityName)
    {
        var entityTypes = new Dictionary<string, Type>(StringComparer.OrdinalIgnoreCase)
        {
            { "accounts", typeof(Domain.Entities.Account) },
            { "contacts", typeof(Domain.Entities.Contact) },
            { "d365contacts", typeof(Domain.Entities.D365Contact) },
            { "customers", typeof(Domain.Entities.Customer) },
            { "employees", typeof(Domain.Entities.Employee) }
        };

        return entityTypes.TryGetValue(entityName, out var type) ? type : null;
    }


    private async Task<object?> GetRecordById(Type entityType, string id)
    {
        if (!Guid.TryParse(id, out var guid))
            return null;

        var dbSetProperty = _context.GetType().GetProperties()
            .FirstOrDefault(p => p.PropertyType.IsGenericType &&
                               p.PropertyType.GetGenericTypeDefinition() == typeof(DbSet<>) &&
                               p.PropertyType.GetGenericArguments()[0] == entityType);

        if (dbSetProperty == null)
            return null;

        var dbSet = dbSetProperty.GetValue(_context);
        var findMethod = dbSetProperty.PropertyType.GetMethod("FindAsync", new[] { typeof(object[]) });
        
        if (findMethod != null)
        {
            var task = (Task)findMethod.Invoke(dbSet, new object[] { new object[] { guid } })!;
            await task.ConfigureAwait(false);
            var resultProperty = task.GetType().GetProperty("Result");
            return resultProperty?.GetValue(task);
        }

        return null;
    }

    private string GetRecordId(object record)
    {
        var idProperty = record.GetType().GetProperty("Id") ?? 
                        record.GetType().GetProperty("AccountId") ??
                        record.GetType().GetProperty("Contactid");
        
        var idValue = idProperty?.GetValue(record);
        return idValue?.ToString() ?? string.Empty;
    }

    private Dictionary<string, object?> GetRecordFields(object record, List<DuplicateMatchRule> matchRules)
    {
        var fields = new Dictionary<string, object?>();
        var recordType = record.GetType();

        fields["id"] = GetRecordId(record);

        foreach (var rule in matchRules)
        {
            var property = recordType.GetProperty(rule.FieldName, 
                BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
            
            if (property != null)
            {
                fields[rule.FieldName.ToLower()] = property.GetValue(record);
            }
        }

        var nameProperty = recordType.GetProperty("Name") ?? 
                          recordType.GetProperty("AccountName") ?? 
                          recordType.GetProperty("FirstName");
        if (nameProperty != null && !fields.ContainsKey("name"))
        {
            fields["name"] = nameProperty.GetValue(record);
        }

        return fields;
    }

    private int CalculateMatchScore(object record1, object record2, List<DuplicateMatchRule> matchRules)
    {
        var totalWeight = matchRules.Sum(r => r.Weight);
        var matchedWeight = 0;

        foreach (var rule in matchRules)
        {
            var property = record1.GetType().GetProperty(rule.FieldName, 
                BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
            
            if (property == null)
                continue;

            var value1 = property.GetValue(record1)?.ToString();
            var value2 = property.GetValue(record2)?.ToString();

            if (string.IsNullOrWhiteSpace(value1) || string.IsNullOrWhiteSpace(value2))
                continue;

            bool isMatch = rule.MatchType.ToLower() switch
            {
                "exact" => value1 == value2,
                "caseinsensitive" => value1.Equals(value2, StringComparison.OrdinalIgnoreCase),
                "fuzzy" => CalculateSimilarity(value1, value2) >= 0.8,
                "phone" => NormalizePhone(value1) == NormalizePhone(value2),
                "email" => value1.Equals(value2, StringComparison.OrdinalIgnoreCase),
                _ => value1.Equals(value2, StringComparison.OrdinalIgnoreCase)
            };

            if (isMatch)
            {
                matchedWeight += rule.Weight;
            }
        }

        return totalWeight > 0 ? (matchedWeight * 100) / totalWeight : 0;
    }

    private double CalculateSimilarity(string str1, string str2)
    {
        var longer = str1.Length > str2.Length ? str1 : str2;
        var shorter = str1.Length > str2.Length ? str2 : str1;

        if (longer.Length == 0)
            return 1.0;

        var editDistance = LevenshteinDistance(longer.ToLower(), shorter.ToLower());
        return (longer.Length - editDistance) / (double)longer.Length;
    }

    private int LevenshteinDistance(string str1, string str2)
    {
        var matrix = new int[str1.Length + 1, str2.Length + 1];

        for (int i = 0; i <= str1.Length; i++)
            matrix[i, 0] = i;

        for (int j = 0; j <= str2.Length; j++)
            matrix[0, j] = j;

        for (int i = 1; i <= str1.Length; i++)
        {
            for (int j = 1; j <= str2.Length; j++)
            {
                var cost = str1[i - 1] == str2[j - 1] ? 0 : 1;
                matrix[i, j] = Math.Min(
                    Math.Min(matrix[i - 1, j] + 1, matrix[i, j - 1] + 1),
                    matrix[i - 1, j - 1] + cost
                );
            }
        }

        return matrix[str1.Length, str2.Length];
    }

    private string NormalizePhone(string phone)
    {
        return Regex.Replace(phone, @"[^0-9]", "");
    }

    private void ApplyFieldSelections(object masterRecord, Dictionary<string, string> fieldSelections)
    {
        var recordType = masterRecord.GetType();

        foreach (var selection in fieldSelections)
        {
            var property = recordType.GetProperty(selection.Key, 
                BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
            
            if (property != null && property.CanWrite)
            {
                try
                {
                    object? value;
                    var targetType = Nullable.GetUnderlyingType(property.PropertyType) ?? property.PropertyType;

                    if (targetType == typeof(Guid))
                    {
                        value = Guid.Parse(selection.Value);
                    }
                    else if (targetType == typeof(DateTime))
                    {
                        value = DateTime.Parse(selection.Value);
                    }
                    else
                    {
                        value = Convert.ChangeType(selection.Value, targetType);
                    }

                    property.SetValue(masterRecord, value);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to set property {PropertyName} to {Value}", selection.Key, selection.Value);
                }
            }
        }
    }

    private async Task<int> RelinkAccountRecords(string masterAccountId, List<string> duplicateAccountIds)
    {
        var count = 0;
        var masterGuid = Guid.Parse(masterAccountId);
        var duplicateGuids = duplicateAccountIds.Select(Guid.Parse).ToList();

        var contacts = await _context.D365Contacts
            .Where(c => c.ParentCustomerId != null && duplicateGuids.Contains(c.ParentCustomerId.Value))
            .ToListAsync();
        
        foreach (var contact in contacts)
        {
            contact.ParentCustomerId = masterGuid;
            count++;
        }

        var quotes = await _context.D365Quotes
            .Where(q => q.CustomerId != null && duplicateGuids.Contains(q.CustomerId.Value))
            .ToListAsync();
        
        foreach (var quote in quotes)
        {
            quote.CustomerId = masterGuid;
            count++;
        }

        var orders = await _context.D365Orders
            .Where(o => o.CustomerId != null && duplicateGuids.Contains(o.CustomerId.Value))
            .ToListAsync();
        
        foreach (var order in orders)
        {
            order.CustomerId = masterGuid;
            count++;
        }

        var tenders = await _context.Tenders
            .Where(t => t.Customer != null && duplicateGuids.Contains(t.Customer.Value))
            .ToListAsync();
        
        foreach (var tender in tenders)
        {
            tender.Customer = masterGuid;
            count++;
        }

        return count;
    }

    private async Task<int> RelinkContactRecords(string masterContactId, List<string> duplicateContactIds)
    {
        var count = 0;
        var masterGuid = Guid.Parse(masterContactId);
        var duplicateGuids = duplicateContactIds.Select(Guid.Parse).ToList();

        var accounts = await _context.Accounts
            .Where(a => a.PrimaryContactIdValue != null && duplicateGuids.Contains(a.PrimaryContactIdValue.Value))
            .ToListAsync();
        
        foreach (var account in accounts)
        {
            account.PrimaryContactIdValue = masterGuid;
            count++;
        }

        return count;
    }
}
