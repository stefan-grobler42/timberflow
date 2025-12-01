using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities
{
    [Table("team_days")]
    public class TeamDay
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Column("team_id")]
        [Required]
        public Guid TeamId { get; set; }

        [Column("work_date")]
        [Required]
        public DateTime WorkDate { get; set; }

        [Column("base_minutes")]
        public int BaseMinutes { get; set; }

        [Column("overtime_minutes")]
        public int OvertimeMinutes { get; set; }

        [Column("total_allocated_minutes")]
        public int TotalAllocatedMinutes { get; set; }

        [Column("is_locked")]
        public bool IsLocked { get; set; }

        [Column("overtime_enabled")]
        public bool OvertimeEnabled { get; set; }

        [Column("overtime_close_time")]
        public string? OvertimeCloseTime { get; set; }

        [Column("created_on")]
        public DateTime CreatedOn { get; set; }

        [Column("created_by")]
        public Guid? CreatedBy { get; set; }

        [Column("modified_on")]
        public DateTime? ModifiedOn { get; set; }

        [Column("modified_by")]
        public Guid? ModifiedBy { get; set; }

        [ForeignKey("TeamId")]
        public Jig? Team { get; set; }

        public ICollection<TeamDayAllocation>? Allocations { get; set; }
    }
}
