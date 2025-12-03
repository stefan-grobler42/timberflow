using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities
{
    [Table("schedule_blocks")]
    public class ScheduleBlock
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Column("block_type")]
        [Required]
        [MaxLength(50)]
        public string BlockType { get; set; } = string.Empty;

        [Column("date_str")]
        [Required]
        [MaxLength(10)]
        public string DateStr { get; set; } = string.Empty;

        [Column("team_id")]
        public Guid? TeamId { get; set; }

        [Column("start_time_minutes")]
        public int StartTimeMinutes { get; set; }

        [Column("end_time_minutes")]
        public int EndTimeMinutes { get; set; }

        [Column("description")]
        public string? Description { get; set; }

        [Column("related_production_id")]
        public Guid? RelatedProductionId { get; set; }

        [Column("created_on")]
        public DateTime? CreatedOn { get; set; }

        [Column("created_by")]
        public Guid? CreatedBy { get; set; }

        [Column("modified_on")]
        public DateTime? ModifiedOn { get; set; }

        [Column("modified_by")]
        public Guid? ModifiedBy { get; set; }

        [ForeignKey("TeamId")]
        public Jig? Team { get; set; }

        [ForeignKey("RelatedProductionId")]
        public Production? RelatedProduction { get; set; }
    }
}
