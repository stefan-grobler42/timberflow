using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MillenniumERP.Application.DTOs;
using MillenniumERP.Domain.Entities;
using MillenniumERP.Infrastructure.Data;

namespace MillenniumERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<EmployeesController> _logger;

    public EmployeesController(AppDbContext context, ILogger<EmployeesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetAll([FromQuery] bool? activeOnly = null)
    {
        var query = _context.Employees.AsQueryable();

        if (activeOnly == true)
        {
            query = query.Where(e => e.NewActiveemployee == true);
        }

        var employees = await query
            .OrderBy(e => e.Name)
            .ToListAsync();

        var employeeDtos = employees.Select(MapToDto).ToList();
        return Ok(employeeDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<EmployeeDto>> GetById(Guid id)
    {
        var employee = await _context.Employees.FindAsync(id);

        if (employee == null)
        {
            return NotFound(new { message = $"Employee with ID {id} not found" });
        }

        return Ok(MapToDto(employee));
    }

    [HttpPost]
    public async Task<ActionResult<EmployeeDto>> Create([FromBody] CreateEmployeeDto createDto)
    {
        var employee = new Employee
        {
            Id = Guid.NewGuid(),
            Name = createDto.Name,
            Employeeno = createDto.Employeeno,
            Idno = createDto.Idno,
            Jobdescription = createDto.Jobdescription,
            Driverslicenseno = createDto.Driverslicenseno,
            Pdpno = createDto.Pdpno,
            Pdpexpirydate = createDto.Pdpexpirydate,
            Pdp = createDto.Pdp,
            Allowdriving = createDto.Allowdriving,
            Hourlyrate = createDto.Hourlyrate,
            NewCellno = createDto.NewCellno,
            NewEmailaddress = createDto.NewEmailaddress,
            NewIncometaxnumber = createDto.NewIncometaxnumber,
            NewActiveemployee = createDto.NewActiveemployee,
            NewCommissionpayable = createDto.NewCommissionpayable,
            NewContractonfile = createDto.NewContractonfile,
            NewStartdate = createDto.NewStartdate,
            NewUnionmember = createDto.NewUnionmember,
            CreatedOn = DateTime.UtcNow
        };

        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created employee {Id}: {Name}", employee.Id, employee.Name);

        return CreatedAtAction(nameof(GetById), new { id = employee.Id }, MapToDto(employee));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<EmployeeDto>> Update(Guid id, [FromBody] UpdateEmployeeDto updateDto)
    {
        var employee = await _context.Employees.FindAsync(id);

        if (employee == null)
        {
            return NotFound(new { message = $"Employee with ID {id} not found" });
        }

        if (updateDto.Name != null) employee.Name = updateDto.Name;
        if (updateDto.Employeeno != null) employee.Employeeno = updateDto.Employeeno;
        if (updateDto.Idno != null) employee.Idno = updateDto.Idno;
        if (updateDto.Jobdescription != null) employee.Jobdescription = updateDto.Jobdescription;
        if (updateDto.Driverslicenseno != null) employee.Driverslicenseno = updateDto.Driverslicenseno;
        if (updateDto.Pdpno != null) employee.Pdpno = updateDto.Pdpno;
        if (updateDto.Pdpexpirydate.HasValue) employee.Pdpexpirydate = updateDto.Pdpexpirydate;
        if (updateDto.Pdp.HasValue) employee.Pdp = updateDto.Pdp;
        if (updateDto.Allowdriving.HasValue) employee.Allowdriving = updateDto.Allowdriving;
        if (updateDto.Hourlyrate.HasValue) employee.Hourlyrate = updateDto.Hourlyrate;
        if (updateDto.NewCellno != null) employee.NewCellno = updateDto.NewCellno;
        if (updateDto.NewEmailaddress != null) employee.NewEmailaddress = updateDto.NewEmailaddress;
        if (updateDto.NewIncometaxnumber != null) employee.NewIncometaxnumber = updateDto.NewIncometaxnumber;
        if (updateDto.NewActiveemployee.HasValue) employee.NewActiveemployee = updateDto.NewActiveemployee;
        if (updateDto.NewCommissionpayable.HasValue) employee.NewCommissionpayable = updateDto.NewCommissionpayable;
        if (updateDto.NewContractonfile.HasValue) employee.NewContractonfile = updateDto.NewContractonfile;
        if (updateDto.NewStartdate.HasValue) employee.NewStartdate = updateDto.NewStartdate;
        if (updateDto.NewUnionmember.HasValue) employee.NewUnionmember = updateDto.NewUnionmember;
        
        employee.ModifiedOn = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated employee {Id}: {Name}", employee.Id, employee.Name);

        return Ok(MapToDto(employee));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var employee = await _context.Employees.FindAsync(id);

        if (employee == null)
        {
            return NotFound(new { message = $"Employee with ID {id} not found" });
        }

        _context.Employees.Remove(employee);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted employee {Id}: {Name}", employee.Id, employee.Name);

        return NoContent();
    }

    private EmployeeDto MapToDto(Employee employee)
    {
        return new EmployeeDto
        {
            Id = employee.Id,
            Name = employee.Name,
            Employeeno = employee.Employeeno,
            Idno = employee.Idno,
            Jobdescription = employee.Jobdescription,
            Driverslicenseno = employee.Driverslicenseno,
            Pdpno = employee.Pdpno,
            Pdpexpirydate = employee.Pdpexpirydate,
            Pdp = employee.Pdp,
            Allowdriving = employee.Allowdriving,
            Hourlyrate = employee.Hourlyrate,
            NewCellno = employee.NewCellno,
            NewEmailaddress = employee.NewEmailaddress,
            NewIncometaxnumber = employee.NewIncometaxnumber,
            NewActiveemployee = employee.NewActiveemployee,
            NewCommissionpayable = employee.NewCommissionpayable,
            NewContractonfile = employee.NewContractonfile,
            NewStartdate = employee.NewStartdate,
            NewUnionmember = employee.NewUnionmember,
            NewDisplaynamecalculated = employee.NewDisplaynamecalculated,
            CreatedOn = employee.CreatedOn,
            CreatedBy = employee.CreatedBy,
            ModifiedOn = employee.ModifiedOn,
            ModifiedBy = employee.ModifiedBy
        };
    }
}
