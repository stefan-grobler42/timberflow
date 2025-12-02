using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities
{
    [Table("production_audit")]
    public class ProductionAudit
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Column("production_id")]
        public Guid ProductionId { get; set; }

        [Column("change_type")]
        [MaxLength(50)]
        public string ChangeType { get; set; } = string.Empty;

        [Column("field_name")]
        [MaxLength(100)]
        public string? FieldName { get; set; }

        [Column("old_value")]
        public string? OldValue { get; set; }

        [Column("new_value")]
        public string? NewValue { get; set; }

        [Column("old_jig_id")]
        public Guid? OldJigId { get; set; }

        [Column("new_jig_id")]
        public Guid? NewJigId { get; set; }

        [Column("old_planned_date")]
        public DateTime? OldPlannedDate { get; set; }

        [Column("new_planned_date")]
        public DateTime? NewPlannedDate { get; set; }

        [Column("old_start_time")]
        public int? OldStartTime { get; set; }

        [Column("new_start_time")]
        public int? NewStartTime { get; set; }

        [Column("old_end_time")]
        public int? OldEndTime { get; set; }

        [Column("new_end_time")]
        public int? NewEndTime { get; set; }

        [Column("old_duration_minutes")]
        public int? OldDurationMinutes { get; set; }

        [Column("new_duration_minutes")]
        public int? NewDurationMinutes { get; set; }

        [Column("batch_id")]
        public Guid? BatchId { get; set; }

        [Column("order_number")]
        [MaxLength(100)]
        public string? OrderNumber { get; set; }

        [Column("customer_name")]
        [MaxLength(255)]
        public string? CustomerName { get; set; }

        [Column("changed_by")]
        [MaxLength(100)]
        public string? ChangedBy { get; set; }

        [Column("changed_on")]
        public DateTime ChangedOn { get; set; }

        [Column("notes")]
        public string? Notes { get; set; }

        [ForeignKey("ProductionId")]
        public Production? Production { get; set; }

        [ForeignKey("OldJigId")]
        public Jig? OldJig { get; set; }

        [ForeignKey("NewJigId")]
        public Jig? NewJig { get; set; }
    }
}
