using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities
{
    [Table("job_work_logs")]
    public class JobWorkLog
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Column("allocation_id")]
        [Required]
        public Guid AllocationId { get; set; }

        [Column("work_date")]
        [Required]
        public DateTime WorkDate { get; set; }

        [Column("planned_start_minutes")]
        public int PlannedStartMinutes { get; set; }

        [Column("planned_end_minutes")]
        public int PlannedEndMinutes { get; set; }

        [Column("planned_duration_minutes")]
        public int PlannedDurationMinutes { get; set; }

        [Column("break_adjustment_minutes")]
        public int BreakAdjustmentMinutes { get; set; }

        [Column("actual_start_minutes")]
        public int? ActualStartMinutes { get; set; }

        [Column("actual_end_minutes")]
        public int? ActualEndMinutes { get; set; }

        [Column("actual_duration_minutes")]
        public int? ActualDurationMinutes { get; set; }

        [Column("efinks_completed")]
        public decimal? EfinksCompleted { get; set; }

        [Column("leader_id")]
        public Guid? LeaderId { get; set; }

        [Column("helper1_id")]
        public Guid? Helper1Id { get; set; }

        [Column("helper2_id")]
        public Guid? Helper2Id { get; set; }

        [Column("helper3_id")]
        public Guid? Helper3Id { get; set; }

        [Column("helper4_id")]
        public Guid? Helper4Id { get; set; }

        [Column("notes")]
        [MaxLength(2000)]
        public string? Notes { get; set; }

        [Column("overtime_type")]
        [MaxLength(20)]
        public string? OvertimeType { get; set; }

        [Column("is_overtime")]
        public bool IsOvertime { get; set; } = false;

        [Column("created_on")]
        public DateTime CreatedOn { get; set; }

        [Column("modified_on")]
        public DateTime? ModifiedOn { get; set; }

        [ForeignKey("AllocationId")]
        public JobAllocation? Allocation { get; set; }

        [ForeignKey("LeaderId")]
        public Employee? Leader { get; set; }

        [ForeignKey("Helper1Id")]
        public Employee? Helper1 { get; set; }

        [ForeignKey("Helper2Id")]
        public Employee? Helper2 { get; set; }

        [ForeignKey("Helper3Id")]
        public Employee? Helper3 { get; set; }

        [ForeignKey("Helper4Id")]
        public Employee? Helper4 { get; set; }
    }
}
