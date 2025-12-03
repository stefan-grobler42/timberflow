using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities
{
    [Table("jigs")]
    public class Jig
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

        /// <summary>Leader (Employee Lookup)</summary>
        [Column("leader_id")]
        public Guid? LeaderId { get; set; }

        /// <summary>Proficiency (List/Text)</summary>
        [Column("proficiency")]
        public string? Proficiency { get; set; }

        /// <summary>Reliability Score</summary>
        [Column("reliability_score")]
        public decimal? ReliabilityScore { get; set; }

        [Column("strengths")]
        public string? Strengths { get; set; }

        /// <summary>Average E-Finks capacity per day for this team (default: 80)</summary>
        [Column("average_efinks")]
        public decimal AverageEfinks { get; set; } = 80;

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
