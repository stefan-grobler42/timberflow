using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities
{
    [Table("saws")]
    public class Saw
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

        /// <summary>Operator (Employee Lookup)</summary>
        [Column("operator_id")]
        public Guid? OperatorId { get; set; }

        /// <summary>Average Time per Cut</summary>
        [Column("average_time_per_cut")]
        public decimal? AverageTimePerCut { get; set; }

        [Column("last_service_date")]
        public DateTime? LastServiceDate { get; set; }

        [Column("serial_number")]
        [MaxLength(100)]
        public string? SerialNumber { get; set; }

        [Column("asset_number")]
        [MaxLength(100)]
        public string? AssetNumber { get; set; }

        [Column("last_blade_change")]
        public DateTime? LastBladeChange { get; set; }

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
