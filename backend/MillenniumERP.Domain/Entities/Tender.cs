using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities
{
    /// <summary>
    /// Tenders
    /// </summary>
    [Table("cr694_tender")]
    public class Tender
    {
        /// <summary>Closing Date</summary>
        [Column("cr694_closingdate")]
        public DateTime? Closingdate { get; set; }

        /// <summary>Contact</summary>
        [Column("cr694_contact")]
        public Guid? Contact { get; set; }

        /// <summary>Customer</summary>
        [Column("cr694_customer")]
        public Guid? Customer { get; set; }

        /// <summary>Description</summary>
        [MaxLength(100)]
        [Column("cr694_description")]
        public string? Description { get; set; }

        /// <summary>Distance to site</summary>
        [Column("cr694_distancetosite")]
        public decimal? Distancetosite { get; set; }

        /// <summary>File Link</summary>
        [MaxLength(500)]
        [Column("cr694_filelink")]
        public string? Filelink { get; set; }

        /// <summary>Name</summary>
        [Required]
        [MaxLength(100)]
        [Column("cr694_name")]
        public string Name { get; set; }

        /// <summary>Quote No.</summary>
        [Column("cr694_quoteno")]
        public Guid? Quoteno { get; set; }

        /// <summary>Roof Covering - Sheeting</summary>
        [Column("cr694_roofcoveringsheeting")]
        public bool? Roofcoveringsheeting { get; set; }

        /// <summary>Roof Covering - Tiles</summary>
        [Column("cr694_roofcoveringtiles")]
        public bool? Roofcoveringtiles { get; set; }

        /// <summary>Street Address</summary>
        [MaxLength(100)]
        [Column("cr694_streetaddress")]
        public string? Streetaddress { get; set; }

        /// <summary>Tender</summary>
        [Key]
        [Column("cr694_tenderid")]
        public Guid Id { get; set; }

        /// <summary>Timber Structure</summary>
        [Column("cr694_timberstructure")]
        public bool? Timberstructure { get; set; }

        /// <summary>Total Value Excl</summary>
        [Column("cr694_totalvalueexcl")]
        public decimal? Totalvalueexcl { get; set; }

        /// <summary>Total Value Excl (Base)</summary>
        [Column("cr694_totalvalueexcl_base")]
        public decimal? TotalvalueexclBase { get; set; }

        /// <summary>Exchange Rate</summary>
        [Column("exchangerate")]
        public decimal? Exchangerate { get; set; }

        /// <summary>Designer</summary>
        [Column("new_designer")]
        public Guid? NewDesigner { get; set; }

        /// <summary>Notes</summary>
        [Column("new_notes")]
        public string? NewNotes { get; set; }

        /// <summary>Pricing Submitted</summary>
        [Column("new_pricingsubmitted")]
        public bool? NewPricingsubmitted { get; set; }

        /// <summary>Submission Date</summary>
        [Column("new_submissiondate")]
        public DateTime? NewSubmissiondate { get; set; }

        /// <summary>Tender Status</summary>
        [Column("new_tenderstatus")]
        public int? NewTenderstatus { get; set; }

        /// <summary>Currency</summary>
        [Column("transactioncurrencyid")]
        public Guid? Transactioncurrencyid { get; set; }

        // Audit fields
        public DateTime? CreatedOn { get; set; }
        public Guid? CreatedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public Guid? ModifiedBy { get; set; }
    }
}