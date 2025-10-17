using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LookupsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<LookupsController> _logger;

    public LookupsController(AppDbContext context, ILogger<LookupsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/lookups/accounts/search?term=millennium
    [HttpGet("accounts/search")]
    public async Task<ActionResult<List<LookupOption>>> SearchAccounts([FromQuery] string term = "")
    {
        var query = _context.Accounts.AsQueryable();

        if (!string.IsNullOrWhiteSpace(term))
        {
            var searchTerm = term.ToLower();
            query = query.Where(a =>
                (a.Name != null && a.Name.ToLower().Contains(searchTerm)) ||
                (a.AccountNumber != null && a.AccountNumber.ToLower().Contains(searchTerm)) ||
                (a.EmailAddress1 != null && a.EmailAddress1.ToLower().Contains(searchTerm))
            );
        }

        // Apply limit only when search term is provided
        if (!string.IsNullOrWhiteSpace(term))
        {
            query = query.Take(100);
        }

        var accounts = await query
            .OrderBy(a => a.Name)
            .Select(a => new
            {
                a.Id,
                Name = a.Name ?? "",
                AccountNumber = a.AccountNumber,
                Email = a.EmailAddress1
            })
            .ToListAsync();

        // Apply relevance scoring if search term is provided
        if (!string.IsNullOrWhiteSpace(term))
        {
            var scoredResults = accounts
                .Select(a => new
                {
                    Option = new LookupOption { Id = a.Id, Text = a.Name },
                    Score = CalculateScore(term, a.Name, a.AccountNumber, a.Email)
                })
                .OrderByDescending(x => x.Score)
                .ThenBy(x => x.Option.Text)
                .Select(x => x.Option)
                .ToList();

            return Ok(scoredResults);
        }

        return Ok(accounts.Select(a => new LookupOption { Id = a.Id, Text = a.Name }).ToList());
    }

    // GET: api/lookups/employees/search?term=john
    [HttpGet("employees/search")]
    public async Task<ActionResult<List<LookupOption>>> SearchEmployees([FromQuery] string term = "")
    {
        var query = _context.Employees.AsQueryable();

        if (!string.IsNullOrWhiteSpace(term))
        {
            var searchTerm = term.ToLower();
            query = query.Where(e =>
                (e.Name != null && e.Name.ToLower().Contains(searchTerm)) ||
                (e.Employeeno != null && e.Employeeno.ToLower().Contains(searchTerm)) ||
                (e.NewEmailaddress != null && e.NewEmailaddress.ToLower().Contains(searchTerm))
            );
        }

        // Apply limit only when search term is provided
        if (!string.IsNullOrWhiteSpace(term))
        {
            query = query.Take(100);
        }

        var employees = await query
            .OrderBy(e => e.Name)
            .Select(e => new
            {
                e.Id,
                Name = e.Name ?? "",
                EmployeeNo = e.Employeeno,
                Email = e.NewEmailaddress
            })
            .ToListAsync();

        if (!string.IsNullOrWhiteSpace(term))
        {
            var scoredResults = employees
                .Select(e => new
                {
                    Option = new LookupOption { Id = e.Id, Text = e.Name },
                    Score = CalculateScore(term, e.Name, e.EmployeeNo, e.Email)
                })
                .OrderByDescending(x => x.Score)
                .ThenBy(x => x.Option.Text)
                .Select(x => x.Option)
                .ToList();

            return Ok(scoredResults);
        }

        return Ok(employees.Select(e => new LookupOption { Id = e.Id, Text = e.Name }).ToList());
    }

    // GET: api/lookups/contacts/search?term=smith
    [HttpGet("contacts/search")]
    public async Task<ActionResult<List<LookupOption>>> SearchContacts([FromQuery] string term = "")
    {
        var query = _context.D365Contacts.AsQueryable();

        if (!string.IsNullOrWhiteSpace(term))
        {
            var searchTerm = term.ToLower();
            query = query.Where(c =>
                (c.FullName != null && c.FullName.ToLower().Contains(searchTerm)) ||
                (c.FirstName != null && c.FirstName.ToLower().Contains(searchTerm)) ||
                (c.LastName != null && c.LastName.ToLower().Contains(searchTerm)) ||
                (c.EmailAddress1 != null && c.EmailAddress1.ToLower().Contains(searchTerm))
            );
        }

        // Apply limit only when search term is provided
        if (!string.IsNullOrWhiteSpace(term))
        {
            query = query.Take(100);
        }

        var contacts = await query
            .OrderBy(c => c.LastName)
            .ThenBy(c => c.FirstName)
            .Select(c => new
            {
                c.Id,
                FullName = c.FullName ?? "",
                FirstName = c.FirstName,
                LastName = c.LastName,
                Email = c.EmailAddress1
            })
            .ToListAsync();

        if (!string.IsNullOrWhiteSpace(term))
        {
            var scoredResults = contacts
                .Select(c => new
                {
                    Option = new LookupOption { Id = c.Id, Text = c.FullName },
                    Score = CalculateScore(term, c.FullName, c.FirstName, c.LastName, c.Email)
                })
                .OrderByDescending(x => x.Score)
                .ThenBy(x => x.Option.Text)
                .Select(x => x.Option)
                .ToList();

            return Ok(scoredResults);
        }

        return Ok(contacts.Select(c => new LookupOption { Id = c.Id, Text = c.FullName }).ToList());
    }

    // GET: api/lookups/accounts/recent
    [HttpGet("accounts/recent")]
    public async Task<ActionResult<List<LookupOption>>> GetRecentAccounts()
    {
        var accounts = await _context.Accounts
            .OrderByDescending(a => a.ModifiedOn ?? a.CreatedOn)
            .Take(10)
            .Select(a => new LookupOption
            {
                Id = a.Id,
                Text = a.Name ?? ""
            })
            .ToListAsync();

        return Ok(accounts);
    }

    // GET: api/lookups/employees/recent
    [HttpGet("employees/recent")]
    public async Task<ActionResult<List<LookupOption>>> GetRecentEmployees()
    {
        var employees = await _context.Employees
            .OrderByDescending(e => e.ModifiedOn ?? e.CreatedOn)
            .Take(10)
            .Select(e => new LookupOption
            {
                Id = e.Id,
                Text = e.Name ?? ""
            })
            .ToListAsync();

        return Ok(employees);
    }

    // GET: api/lookups/contacts/recent
    [HttpGet("contacts/recent")]
    public async Task<ActionResult<List<LookupOption>>> GetRecentContacts()
    {
        var contacts = await _context.D365Contacts
            .OrderByDescending(c => c.ModifiedOn ?? c.CreatedOn)
            .Take(10)
            .Select(c => new LookupOption
            {
                Id = c.Id,
                Text = c.FullName ?? ""
            })
            .ToListAsync();

        return Ok(contacts);
    }

    /// <summary>
    /// Calculate relevance score across multiple fields:
    /// - Exact match (case-insensitive): score 3
    /// - Starts with search term: score 2
    /// - Contains search term: score 1
    /// Returns the highest score found across all provided fields.
    /// </summary>
    private int CalculateScore(string searchTerm, params string?[] fields)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
            return 0;

        var lowerTerm = searchTerm.ToLower();
        int maxScore = 0;

        foreach (var field in fields)
        {
            if (string.IsNullOrWhiteSpace(field))
                continue;

            int score = 0;
            if (field.Equals(searchTerm, StringComparison.OrdinalIgnoreCase))
                score = 3;
            else if (field.StartsWith(searchTerm, StringComparison.OrdinalIgnoreCase))
                score = 2;
            else if (field.ToLower().Contains(lowerTerm))
                score = 1;

            if (score > maxScore)
                maxScore = score;
        }

        return maxScore;
    }
}

public class LookupOption
{
    public Guid Id { get; set; }
    public string Text { get; set; } = "";
}
