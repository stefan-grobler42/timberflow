using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities;

[Table("d365_appointments")]
public class D365Appointment
{
    [Key]
    [Column("activityid")]
    public Guid Id { get; set; }

    [Column("subject")]
    [MaxLength(200)]
    public string? Subject { get; set; }

    [Column("location")]
    [MaxLength(200)]
    public string? Location { get; set; }

    [Column("scheduledstart")]
    public DateTime? ScheduledStart { get; set; }

    [Column("scheduledend")]
    public DateTime? ScheduledEnd { get; set; }

    [Column("actualdurationminutes")]
    public int? ActualDurationMinutes { get; set; }

    [Column("scheduleddurationminutes")]
    public int? ScheduledDurationMinutes { get; set; }

    [Column("description")]
    public string? Description { get; set; }

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
