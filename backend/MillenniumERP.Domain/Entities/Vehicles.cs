using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities
{
    [Table("cr694_vehicles")]
    public class Vehicles
    {
        /// <summary>Primary Driver</summary>
        [Column("cr694_approveddriver")]
        public Guid? Approveddriver { get; set; }

        /// <summary>COF In Order</summary>
        [Column("cr694_cofinorder")]
        public bool? Cofinorder { get; set; }

        /// <summary>License Renewal Date</summary>
        [Column("cr694_licenserenewaldate")]
        public DateTime? Licenserenewaldate { get; set; }

        /// <summary>Make</summary>
        [MaxLength(100)]
        [Column("cr694_make")]
        public string? Make { get; set; }

        /// <summary>Model</summary>
        [MaxLength(100)]
        [Column("cr694_model")]
        public string? Model { get; set; }

        /// <summary>Name</summary>
        [MaxLength(100)]
        [Column("cr694_name")]
        public string? Name { get; set; }

        /// <summary>Registration Number</summary>
        [MaxLength(100)]
        [Column("cr694_registrationnumber")]
        public string? Registrationnumber { get; set; }

        /// <summary>Vehicles</summary>
        [Key]
        [Column("cr694_vehiclesid")]
        public Guid Id { get; set; }

        /// <summary>Year Model</summary>
        [MaxLength(100)]
        [Column("cr694_yearmodel")]
        public string? Yearmodel { get; set; }

        // Audit fields
        public DateTime? CreatedOn { get; set; }
        public Guid? CreatedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public Guid? ModifiedBy { get; set; }
    }
}