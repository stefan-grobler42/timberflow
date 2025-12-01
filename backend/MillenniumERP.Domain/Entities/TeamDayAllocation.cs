using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities
{
    [Table("team_day_allocations")]
    public class TeamDayAllocation
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Column("team_day_id")]
        [Required]
        public Guid TeamDayId { get; set; }

        [Column("production_id")]
        [Required]
        public Guid ProductionId { get; set; }

        [Column("sequence")]
        public int Sequence { get; set; }

        [Column("allocated_minutes")]
        public int AllocatedMinutes { get; set; }

        [Column("start_minutes")]
        public int StartMinutes { get; set; }

        [Column("overflow_to_allocation_id")]
        public Guid? OverflowToAllocationId { get; set; }

        [Column("overflow_from_allocation_id")]
        public Guid? OverflowFromAllocationId { get; set; }

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "planned";

        [Column("is_rollover")]
        public bool IsRollover { get; set; }

        [Column("created_on")]
        public DateTime CreatedOn { get; set; }

        [Column("created_by")]
        public Guid? CreatedBy { get; set; }

        [Column("modified_on")]
        public DateTime? ModifiedOn { get; set; }

        [Column("modified_by")]
        public Guid? ModifiedBy { get; set; }

        [ForeignKey("TeamDayId")]
        public TeamDay? TeamDay { get; set; }

        [ForeignKey("ProductionId")]
        public Production? Production { get; set; }

        [ForeignKey("OverflowToAllocationId")]
        public TeamDayAllocation? OverflowToAllocation { get; set; }

        [ForeignKey("OverflowFromAllocationId")]
        public TeamDayAllocation? OverflowFromAllocation { get; set; }
    }
}
