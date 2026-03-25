using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities
{
    [Table("team_work_items")]
    public class TeamWorkItem
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Column("production_id")]
        public Guid? ProductionId { get; set; }
        
        // Display fields - copied from Production on allocation, self-contained for WIP-only rollovers
        [Column("order_number")]
        [MaxLength(100)]
        public string? OrderNumber { get; set; }
        
        [Column("customer_name")]
        [MaxLength(200)]
        public string? CustomerName { get; set; }
        
        [Column("production_name")]
        [MaxLength(200)]
        public string? ProductionName { get; set; }
        
        [Column("site_address")]
        [MaxLength(500)]
        public string? SiteAddress { get; set; }
        
        [Column("estimated_efinks")]
        public decimal? EstimatedEfinks { get; set; }
        
        [Column("custom_duration_minutes")]
        public int? CustomDurationMinutes { get; set; }
        
        // Rollover chain tracking
        [Column("is_rollover_only")]
        public bool IsRolloverOnly { get; set; } = false;
        
        [Column("root_production_id")]
        public Guid? RootProductionId { get; set; }
        
        [Column("parent_production_id")]
        public Guid? ParentProductionId { get; set; }
        
        [Column("sales_order_id")]
        public Guid? SalesOrderId { get; set; }

        [Column("team_id")]
        [Required]
        public Guid TeamId { get; set; }

        [Column("work_date")]
        [Required]
        public DateTime WorkDate { get; set; }

        [Column("sequence")]
        public int Sequence { get; set; }

        [Column("planned_start_minutes")]
        public int PlannedStartMinutes { get; set; }

        [Column("planned_end_minutes")]
        public int PlannedEndMinutes { get; set; }

        [Column("planned_duration_minutes")]
        public int PlannedDurationMinutes { get; set; }

        [Column("break_adjustment_minutes")]
        public int BreakAdjustmentMinutes { get; set; }

        [Column("actual_start_time")]
        public DateTime? ActualStartTime { get; set; }

        [Column("actual_end_time")]
        public DateTime? ActualEndTime { get; set; }

        [Column("actual_duration_minutes")]
        public int? ActualDurationMinutes { get; set; }

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "scheduled";

        [Column("parent_wip_id")]
        public Guid? ParentWipId { get; set; }

        [Column("rollover_sequence")]
        public int RolloverSequence { get; set; } = 0;

        [Column("spillover_minutes")]
        public int? SpilloverMinutes { get; set; }

        [Column("overtime_enabled")]
        public bool OvertimeEnabled { get; set; } = false;

        [Column("early_overtime_enabled")]
        public bool EarlyOvertimeEnabled { get; set; } = false;

        [Column("timber_cubes")]
        public decimal? TimberCubes { get; set; }

        [Column("total_cuts")]
        public int? TotalCuts { get; set; }

        [Column("actual_efinks")]
        public decimal? ActualEfinks { get; set; }

        [Column("picking_complete")]
        public bool PickingComplete { get; set; } = false;

        [Column("sawing_complete")]
        public bool SawingComplete { get; set; } = false;

        [Column("jigging_complete")]
        public bool JiggingComplete { get; set; } = false;

        [Column("needs_verification")]
        public bool NeedsVerification { get; set; } = false;

        [Column("day_start_minutes")]
        public int? DayStartMinutes { get; set; }

        [Column("day_end_minutes")]
        public int? DayEndMinutes { get; set; }

        [Column("break_definitions")]
        public string? BreakDefinitions { get; set; }

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

        [ForeignKey("ParentWipId")]
        public TeamWorkItem? ParentWip { get; set; }
    }
}
