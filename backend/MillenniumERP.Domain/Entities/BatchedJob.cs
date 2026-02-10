using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities
{
    [Table("batched_jobs")]
    public class BatchedJob
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Column("customer_id")]
        public Guid? CustomerId { get; set; }

        [Column("customer_name")]
        public string? CustomerName { get; set; }

        [Column("order_numbers")]
        public string? OrderNumbers { get; set; }

        [Column("order_id")]
        public Guid? OrderId { get; set; }

        [Column("estimated_efinks")]
        public decimal? EstimatedEfinks { get; set; }

        [Column("custom_duration_minutes")]
        public int? CustomDurationMinutes { get; set; }

        [Column("production_planned_date")]
        public DateTime? ProductionPlannedDate { get; set; }

        [Column("jig_id")]
        public Guid? JigId { get; set; }

        [Column("production_complete")]
        public bool? ProductionComplete { get; set; }

        [Column("planned_start_time")]
        public int? PlannedStartTime { get; set; }

        [Column("planned_end_time")]
        public int? PlannedEndTime { get; set; }

        [Column("planned_duration_minutes")]
        public int? PlannedDurationMinutes { get; set; }

        [Column("break_adjustment_minutes")]
        public int? BreakAdjustmentMinutes { get; set; }

        [Column("is_in_wip")]
        public bool IsInWip { get; set; } = false;

        [Column("source_production_ids")]
        public string SourceProductionIds { get; set; } = string.Empty;

        [Column("batch_efficiency_factor")]
        public decimal BatchEfficiencyFactor { get; set; } = 0.70m;

        [Column("created_on")]
        public DateTime? CreatedOn { get; set; }

        [Column("modified_on")]
        public DateTime? ModifiedOn { get; set; }

        [ForeignKey("CustomerId")]
        public Account? Customer { get; set; }

        [ForeignKey("JigId")]
        public Jig? JigTeam { get; set; }
    }
}
