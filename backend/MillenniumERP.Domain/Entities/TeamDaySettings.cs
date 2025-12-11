using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities
{
    [Table("team_day_settings")]
    public class TeamDaySettings
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

        [Column("early_ot_enabled")]
        public bool EarlyOtEnabled { get; set; } = false;

        [Column("early_ot_start_minutes")]
        public int? EarlyOtStartMinutes { get; set; }

        [Column("late_ot_enabled")]
        public bool LateOtEnabled { get; set; } = false;

        [Column("late_ot_end_minutes")]
        public int? LateOtEndMinutes { get; set; }

        [Column("is_working_day")]
        public bool IsWorkingDay { get; set; } = true;

        [Column("created_on")]
        public DateTime CreatedOn { get; set; }

        [Column("modified_on")]
        public DateTime? ModifiedOn { get; set; }

        [ForeignKey("TeamId")]
        public Jig? Team { get; set; }
    }
}
