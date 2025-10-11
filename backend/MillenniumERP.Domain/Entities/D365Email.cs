using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities;

[Table("d365_emails")]
public class D365Email
{
    [Key]
    [Column("activityid")]
    public Guid Id { get; set; }

    [Column("subject")]
    [MaxLength(200)]
    public string? Subject { get; set; }

    [Column("from")]
    public string? From { get; set; }

    [Column("to")]
    public string? To { get; set; }

    [Column("cc")]
    public string? Cc { get; set; }

    [Column("bcc")]
    public string? Bcc { get; set; }

    [Column("description")]
    public string? Description { get; set; }

    [Column("directioncode")]
    public bool? DirectionCode { get; set; }

    [Column("regardingobjectid")]
    public Guid? RegardingObjectId { get; set; }

    [Column("ownerid")]
    public Guid? OwnerId { get; set; }

    [Column("statecode")]
    public int? StateCode { get; set; }

    [Column("statuscode")]
    public int? StatusCode { get; set; }

    [Column("createdon")]
    public DateTime CreatedOn { get; set; }

    [Column("modifiedon")]
    public DateTime? ModifiedOn { get; set; }

    [Column("CreatedBy")]
    [MaxLength(100)]
    public string? CreatedBy { get; set; }

    [Column("ModifiedBy")]
    [MaxLength(100)]
    public string? ModifiedBy { get; set; }
}
