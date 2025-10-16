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
            Id = createDto.Id ?? Guid.NewGuid(),  // Use provided ID (for migration) or generate new one
            Name = createDto.Name,
            Employeeno = createDto.EmployeeNo,
            Idno = createDto.IdNo,
            Jobdescription = createDto.JobDescription,
            Driverslicenseno = createDto.DriversLicenseNo,
            Pdpno = createDto.PdpNo,
            Pdpexpirydate = createDto.PdpExpiryDate,
            Pdp = createDto.Pdp,
            Allowdriving = createDto.AllowDriving,
            Hourlyrate = createDto.HourlyRate,
            NewCellno = createDto.NewCellNo,
            NewEmailaddress = createDto.NewEmailAddress,
            NewIncometaxnumber = createDto.NewIncomeTaxNumber,
            NewActiveemployee = createDto.NewActiveEmployee,
            NewCommissionpayable = createDto.NewCommissionPayable,
            NewContractonfile = createDto.NewContractOnFile,
            NewStartdate = createDto.NewStartDate,
            NewUnionmember = createDto.NewUnionMember,
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
        if (updateDto.EmployeeNo != null) employee.Employeeno = updateDto.EmployeeNo;
        if (updateDto.IdNo != null) employee.Idno = updateDto.IdNo;
        if (updateDto.JobDescription != null) employee.Jobdescription = updateDto.JobDescription;
        if (updateDto.DriversLicenseNo != null) employee.Driverslicenseno = updateDto.DriversLicenseNo;
        if (updateDto.PdpNo != null) employee.Pdpno = updateDto.PdpNo;
        if (updateDto.PdpExpiryDate.HasValue) employee.Pdpexpirydate = updateDto.PdpExpiryDate;
        if (updateDto.Pdp.HasValue) employee.Pdp = updateDto.Pdp;
        if (updateDto.AllowDriving.HasValue) employee.Allowdriving = updateDto.AllowDriving;
        if (updateDto.HourlyRate.HasValue) employee.Hourlyrate = updateDto.HourlyRate;
        if (updateDto.NewCellNo != null) employee.NewCellno = updateDto.NewCellNo;
        if (updateDto.NewEmailAddress != null) employee.NewEmailaddress = updateDto.NewEmailAddress;
        if (updateDto.NewIncomeTaxNumber != null) employee.NewIncometaxnumber = updateDto.NewIncomeTaxNumber;
        if (updateDto.NewActiveEmployee.HasValue) employee.NewActiveemployee = updateDto.NewActiveEmployee;
        if (updateDto.NewCommissionPayable.HasValue) employee.NewCommissionpayable = updateDto.NewCommissionPayable;
        if (updateDto.NewContractOnFile.HasValue) employee.NewContractonfile = updateDto.NewContractOnFile;
        if (updateDto.NewStartDate.HasValue) employee.NewStartdate = updateDto.NewStartDate;
        if (updateDto.NewUnionMember.HasValue) employee.NewUnionmember = updateDto.NewUnionMember;
        
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
            EmployeeNo = employee.Employeeno,
            IdNo = employee.Idno,
            JobDescription = employee.Jobdescription,
            DriversLicenseNo = employee.Driverslicenseno,
            PdpNo = employee.Pdpno,
            PdpExpiryDate = employee.Pdpexpirydate,
            Pdp = employee.Pdp,
            AllowDriving = employee.Allowdriving,
            HourlyRate = employee.Hourlyrate,
            NewCellNo = employee.NewCellno,
            NewEmailAddress = employee.NewEmailaddress,
            NewIncomeTaxNumber = employee.NewIncometaxnumber,
            NewActiveEmployee = employee.NewActiveemployee,
            NewCommissionPayable = employee.NewCommissionpayable,
            NewContractOnFile = employee.NewContractonfile,
            NewStartDate = employee.NewStartdate,
            NewUnionMember = employee.NewUnionmember,
            NewDisplayNameCalculated = employee.NewDisplaynamecalculated,
            CreatedOn = employee.CreatedOn,
            CreatedBy = employee.CreatedBy,
            ModifiedOn = employee.ModifiedOn,
            ModifiedBy = employee.ModifiedBy
        };
    }
}
