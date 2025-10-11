using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities
{
    [Table("cr694_installationprogress")]
    public class InstallationProgress
    {
        /// <summary>Installation Progress</summary>
        [Key]
        [Column("cr694_installationprogressid")]
        public Guid Id { get; set; }

        /// <summary>Name</summary>
        [Required]
        [MaxLength(100)]
        [Column("cr694_name")]
        public string Name { get; set; }

        /// <summary>Installation Order No.</summary>
        [MaxLength(100)]
        [Column("new_installationorderno")]
        public string NewInstallationorderno { get; set; }

        /// <summary>Percentage Complete</summary>
        [Column("new_percentagecomplete")]
        public decimal? NewPercentagecomplete { get; set; }

        // Audit fields
        public DateTime? CreatedOn { get; set; }
        public Guid? CreatedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public Guid? ModifiedBy { get; set; }
    }
}