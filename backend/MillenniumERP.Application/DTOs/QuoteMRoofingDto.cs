namespace MillenniumERP.Application.DTOs;

public class QuoteMRoofingDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid? Account { get; set; }
    public DateTime? CreatedOn { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public Guid? ModifiedBy { get; set; }
}

public class CreateQuoteMRoofingDto
{
    public string Name { get; set; } = string.Empty;
    public Guid? Account { get; set; }
}

public class UpdateQuoteMRoofingDto
{
    public string? Name { get; set; }
    public Guid? Account { get; set; }
}
