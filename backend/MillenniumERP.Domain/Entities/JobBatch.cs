using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities
{
    [Table("job_batches")]
    public class JobBatch
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Column("jig_id")]
        public Guid? JigId { get; set; }

        [Column("batch_date")]
        public DateTime? BatchDate { get; set; }

        [Column("customer_id")]
        public Guid? CustomerId { get; set; }

        [Column("total_efinks")]
        public decimal TotalEfinks { get; set; }

        [Column("combined_duration_minutes")]
        public int? CombinedDurationMinutes { get; set; }

        [Column("planned_start_time")]
        public int? PlannedStartTime { get; set; }

        [Column("planned_end_time")]
        public int? PlannedEndTime { get; set; }

        [Column("break_adjustment_minutes")]
        public int? BreakAdjustmentMinutes { get; set; }

        [Column("created_on")]
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        [Column("modified_on")]
        public DateTime? ModifiedOn { get; set; }

        [ForeignKey("JigId")]
        public Jig? Jig { get; set; }

        [ForeignKey("CustomerId")]
        public Account? Customer { get; set; }

        public ICollection<Production>? Productions { get; set; }
    }
}
