using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities;

[Table("sync_history")]
public class SyncHistory
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("entity_name")]
    [MaxLength(100)]
    [Required]
    public string EntityName { get; set; } = string.Empty;

    [Column("last_successful_sync_utc")]
    public DateTime? LastSuccessfulSyncUtc { get; set; }

    [Column("last_attempt_utc")]
    [Required]
    public DateTime LastAttemptUtc { get; set; }

    [Column("last_attempt_status")]
    [MaxLength(50)]
    [Required]
    public string LastAttemptStatus { get; set; } = "Success";

    [Column("records_imported")]
    public int RecordsImported { get; set; }

    [Column("duration_seconds")]
    public double DurationSeconds { get; set; }

    [Column("error_message")]
    public string? ErrorMessage { get; set; }

    [Column("created_on")]
    public DateTime CreatedOn { get; set; }
}
