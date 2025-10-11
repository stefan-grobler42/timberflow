namespace MillenniumERP.Application.DTOs;

public class VehiclesDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Make { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Registrationnumber { get; set; } = string.Empty;
    public string Yearmodel { get; set; } = string.Empty;
    public Guid? Approveddriver { get; set; }
    public bool? Cofinorder { get; set; }
    public DateTime? Licenserenewaldate { get; set; }
    public DateTime? CreatedOn { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public Guid? ModifiedBy { get; set; }
}

public class CreateVehiclesDto
{
    public string Name { get; set; } = string.Empty;
    public string Make { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Registrationnumber { get; set; } = string.Empty;
    public string Yearmodel { get; set; } = string.Empty;
    public Guid? Approveddriver { get; set; }
    public bool? Cofinorder { get; set; }
    public DateTime? Licenserenewaldate { get; set; }
}

public class UpdateVehiclesDto
{
    public string? Name { get; set; }
    public string? Make { get; set; }
    public string? Model { get; set; }
    public string? Registrationnumber { get; set; }
    public string? Yearmodel { get; set; }
    public Guid? Approveddriver { get; set; }
    public bool? Cofinorder { get; set; }
    public DateTime? Licenserenewaldate { get; set; }
}
