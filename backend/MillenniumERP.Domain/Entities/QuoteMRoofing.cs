using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities
{
    [Table("cr694_quotemroofing")]
    public class QuoteMRoofing
    {
        /// <summary>Account</summary>
        [Column("cr694_account")]
        public Guid? Account { get; set; }

        /// <summary>Quote Number</summary>
        [Required]
        [MaxLength(100)]
        [Column("cr694_name")]
        public string Name { get; set; }

        /// <summary>Quote - MRoofing</summary>
        [Key]
        [Column("cr694_quotemroofingid")]
        public Guid Id { get; set; }

        // Audit fields
        public DateTime? CreatedOn { get; set; }
        public Guid? CreatedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public Guid? ModifiedBy { get; set; }
    }
}