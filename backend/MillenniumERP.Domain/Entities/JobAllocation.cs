using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities
{
    [Table("job_allocations")]
    public class JobAllocation
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Column("production_id")]
        public Guid? ProductionId { get; set; }

        [Column("team_id")]
        [Required]
        public Guid TeamId { get; set; }

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
        public decimal EstimatedEfinks { get; set; }

        [Column("estimated_duration_minutes")]
        public int EstimatedDurationMinutes { get; set; }

        [Column("span_start_date")]
        [Required]
        public DateTime SpanStartDate { get; set; }

        [Column("span_start_minutes")]
        public int SpanStartMinutes { get; set; }

        [Column("span_end_date")]
        public DateTime? SpanEndDate { get; set; }

        [Column("span_end_minutes")]
        public int? SpanEndMinutes { get; set; }

        [Column("queue_position")]
        public int QueuePosition { get; set; }

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "scheduled";

        [Column("actual_efinks")]
        public decimal? ActualEfinks { get; set; }

        [Column("actual_duration_minutes")]
        public int? ActualDurationMinutes { get; set; }

        [Column("is_complete")]
        public bool IsComplete { get; set; } = false;

        [Column("completed_on")]
        public DateTime? CompletedOn { get; set; }

        [Column("sales_order_id")]
        public Guid? SalesOrderId { get; set; }

        [Column("created_on")]
        public DateTime CreatedOn { get; set; }

        [Column("created_by")]
        public Guid? CreatedBy { get; set; }

        [Column("modified_on")]
        public DateTime? ModifiedOn { get; set; }

        [Column("modified_by")]
        public Guid? ModifiedBy { get; set; }

        [ForeignKey("ProductionId")]
        public Production? Production { get; set; }

        [ForeignKey("TeamId")]
        public Jig? Team { get; set; }

        public ICollection<JobWorkLog> WorkLogs { get; set; } = new List<JobWorkLog>();
    }
}
