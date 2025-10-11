using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities
{
    [Table("cr694_production")]
    public class Production
    {
        /// <summary>Customer</summary>
        [Column("cr694_customer")]
        public Guid? Customer { get; set; }

        /// <summary>Jig End</summary>
        [Column("cr694_jigend")]
        public DateTime? Jigend { get; set; }

        /// <summary>Jig - Helper 1</summary>
        [Column("cr694_jighelper1")]
        public Guid? Jighelper1 { get; set; }

        /// <summary>Jig - Helper 2</summary>
        [Column("cr694_jighelper2")]
        public Guid? Jighelper2 { get; set; }

        /// <summary>Jig - Helper 3</summary>
        [Column("cr694_jighelper3")]
        public Guid? Jighelper3 { get; set; }

        /// <summary>Jig - Helper 4</summary>
        [Column("cr694_jighelper4")]
        public Guid? Jighelper4 { get; set; }

        /// <summary>Jig - Leader</summary>
        [Column("cr694_jigleader")]
        public Guid? Jigleader { get; set; }

        /// <summary>Jig Start</summary>
        [Column("cr694_jigstart")]
        public DateTime? Jigstart { get; set; }

        /// <summary>Name</summary>
        [Required]
        [MaxLength(100)]
        [Column("cr694_name")]
        public string Name { get; set; }

        /// <summary>Order No.</summary>
        [Column("cr694_orderno")]
        public Guid? Orderno { get; set; }

        /// <summary>Pick End</summary>
        [Column("cr694_pickend")]
        public DateTime? Pickend { get; set; }

        /// <summary>Picking - Helper 1</summary>
        [Column("cr694_pickinghelper1")]
        public Guid? Pickinghelper1 { get; set; }

        /// <summary>Picking - Helper 2</summary>
        [Column("cr694_pickinghelper2")]
        public Guid? Pickinghelper2 { get; set; }

        /// <summary>Picking - Helper 3</summary>
        [Column("cr694_pickinghelper3")]
        public Guid? Pickinghelper3 { get; set; }

        /// <summary>Picking - Master</summary>
        [Column("cr694_pickingmaster")]
        public Guid? Pickingmaster { get; set; }

        /// <summary>Pick Start</summary>
        [Column("cr694_pickstart")]
        public DateTime? Pickstart { get; set; }

        /// <summary>Production Complete</summary>
        [Column("cr694_productioncomplete")]
        public bool? Productioncomplete { get; set; }

        /// <summary>Production</summary>
        [Key]
        [Column("cr694_productionid")]
        public Guid Id { get; set; }

        /// <summary>Production Planned Date</summary>
        [Column("cr694_productionplanneddate")]
        public DateTime? Productionplanneddate { get; set; }

        /// <summary>Saw End</summary>
        [Column("cr694_sawend")]
        public DateTime? Sawend { get; set; }

        /// <summary>Saw - Helper 1</summary>
        [Column("cr694_sawhelper1")]
        public Guid? Sawhelper1 { get; set; }

        /// <summary>Saw - Helper 2</summary>
        [Column("cr694_sawhelper2")]
        public Guid? Sawhelper2 { get; set; }

        /// <summary>Saw - Operator</summary>
        [Column("cr694_sawoperator")]
        public Guid? Sawoperator { get; set; }

        /// <summary>Saw Start</summary>
        [Column("cr694_sawstart")]
        public DateTime? Sawstart { get; set; }

        /// <summary>Total Cuts</summary>
        [Column("cr694_totalcuts")]
        public int? Totalcuts { get; set; }

        /// <summary>Total Timber Cubes</summary>
        [Column("cr694_totaltimbercubes")]
        public decimal? Totaltimbercubes { get; set; }

        /// <summary>Truss Cost</summary>
        [Column("cr694_trusscost")]
        public decimal? Trusscost { get; set; }

        /// <summary>Truss Selling</summary>
        [Column("cr694_trussselling")]
        public int? Trussselling { get; set; }

        /// <summary>Work Units (E-Finks)</summary>
        [Column("cr694_workunitsefinks")]
        public decimal? Workunitsefinks { get; set; }

        /// <summary>Estimated E-Finks</summary>
        [Column("new_estimatedefinks")]
        public decimal? NewEstimatedefinks { get; set; }

        // Audit fields
        public DateTime? CreatedOn { get; set; }
        public Guid? CreatedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public Guid? ModifiedBy { get; set; }
    }
}