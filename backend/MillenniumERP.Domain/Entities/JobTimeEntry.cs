using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities
{
    [Table("job_time_entries")]
    public class JobTimeEntry
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Column("job_id")]
        [Required]
        public Guid JobId { get; set; }

        [Column("team_id")]
        [Required]
        public Guid TeamId { get; set; }

        [Column("stage_type")]
        [MaxLength(50)]
        public string StageType { get; set; } = "overall";

        [Column("started_at")]
        [Required]
        public DateTime StartedAt { get; set; }

        [Column("ended_at")]
        public DateTime? EndedAt { get; set; }

        [Column("actual_duration_minutes")]
        public int? ActualDurationMinutes { get; set; }

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "in_progress";

        [Column("started_by")]
        [MaxLength(200)]
        public string? StartedBy { get; set; }

        [Column("ended_by")]
        [MaxLength(200)]
        public string? EndedBy { get; set; }

        [Column("notes")]
        [MaxLength(2000)]
        public string? Notes { get; set; }

        [Column("created_on")]
        public DateTime CreatedOn { get; set; }

        [Column("modified_on")]
        public DateTime? ModifiedOn { get; set; }

        [ForeignKey("JobId")]
        public TeamWorkItem? Job { get; set; }

        [ForeignKey("TeamId")]
        public Jig? Team { get; set; }
    }
}
