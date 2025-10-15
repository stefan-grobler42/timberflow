using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities
{
    [Table("cr694_designer")]
    public class Designer
    {
        /// <summary>Cell Number</summary>
        [MaxLength(100)]
        [Column("cr694_cellnumber")]
        public string? Cellnumber { get; set; }

        /// <summary>Designer</summary>
        [Key]
        [Column("cr694_designerid")]
        public Guid Id { get; set; }

        /// <summary>E-Mail Address</summary>
        [MaxLength(100)]
        [Column("cr694_emailaddress")]
        public string? Emailaddress { get; set; }

        /// <summary>Employee No.</summary>
        [MaxLength(100)]
        [Column("cr694_employeeno")]
        public string? Employeeno { get; set; }

        /// <summary>Display Name</summary>
        [Required]
        [MaxLength(100)]
        [Column("cr694_name")]
        public string Name { get; set; }

        /// <summary>Display Name (Calculated)</summary>
        [MaxLength(100)]
        [Column("new_displaynamecalculated")]
        public string? NewDisplaynamecalculated { get; set; }

        /// <summary>Employee File</summary>
        [Column("new_employeefile")]
        public Guid? NewEmployeefile { get; set; }

        // Audit fields
        public DateTime? CreatedOn { get; set; }
        public Guid? CreatedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public Guid? ModifiedBy { get; set; }
    }
}