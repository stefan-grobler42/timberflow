namespace MillenniumERP.Application.DTOs.D365;

public class D365EmailDto
{
    public Guid Id { get; set; }
    public string? Subject { get; set; }
    public string? From { get; set; }
    public string? To { get; set; }
    public string? Cc { get; set; }
    public string? Bcc { get; set; }
    public string? Description { get; set; }
    public bool? DirectionCode { get; set; }
    public Guid? RegardingObjectId { get; set; }
    public Guid? OwnerId { get; set; }
    public int? StateCode { get; set; }
    public int? StatusCode { get; set; }
    public DateTime CreatedOn { get; set; }
    public DateTime? ModifiedOn { get; set; }
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }
}

public class CreateD365EmailDto
{
    public string? Subject { get; set; }
    public string? From { get; set; }
    public string? To { get; set; }
    public string? Cc { get; set; }
    public string? Bcc { get; set; }
    public string? Description { get; set; }
    public bool? DirectionCode { get; set; }
    public Guid? RegardingObjectId { get; set; }
    public Guid? OwnerId { get; set; }
}

public class UpdateD365EmailDto
{
    public string? Subject { get; set; }
    public string? From { get; set; }
    public string? To { get; set; }
    public string? Cc { get; set; }
    public string? Bcc { get; set; }
    public string? Description { get; set; }
    public int? StateCode { get; set; }
    public int? StatusCode { get; set; }
}
