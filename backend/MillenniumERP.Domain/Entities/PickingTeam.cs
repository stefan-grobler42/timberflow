using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities
{
    [Table("picking_teams")]
    public class PickingTeam
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Column("name")]
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [Column("description")]
        public string? Description { get; set; }

        /// <summary>Team Leader (Employee Lookup)</summary>
        [Column("team_leader_id")]
        public Guid? TeamLeaderId { get; set; }

        /// <summary>Average Time per m³</summary>
        [Column("average_time_per_m3")]
        public decimal? AverageTimePerM3 { get; set; }

        // Audit fields
        [Column("created_on")]
        public DateTime? CreatedOn { get; set; }

        [Column("created_by")]
        public Guid? CreatedBy { get; set; }

        [Column("modified_on")]
        public DateTime? ModifiedOn { get; set; }

        [Column("modified_by")]
        public Guid? ModifiedBy { get; set; }
    }
}
