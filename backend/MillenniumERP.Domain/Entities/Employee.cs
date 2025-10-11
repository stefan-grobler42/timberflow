using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities
{
    [Table("cr694_drivers")]
    public class Employee
    {
        /// <summary>Allow Driving</summary>
        [Column("cr694_allowdriving")]
        public bool? Allowdriving { get; set; }

        /// <summary>Drivers</summary>
        [Key]
        [Column("cr694_driversid")]
        public Guid Id { get; set; }

        /// <summary>Drivers License No.</summary>
        [MaxLength(100)]
        [Column("cr694_driverslicenseno")]
        public string Driverslicenseno { get; set; }

        /// <summary>Employee No.</summary>
        [MaxLength(100)]
        [Column("cr694_employeeno")]
        public string Employeeno { get; set; }

        /// <summary>Hourly Rate</summary>
        [Column("cr694_hourlyrate")]
        public decimal? Hourlyrate { get; set; }

        /// <summary>Hourly Rate (Base)</summary>
        [Column("cr694_hourlyrate_base")]
        public decimal? HourlyrateBase { get; set; }

        /// <summary>ID No.</summary>
        [MaxLength(100)]
        [Column("cr694_idno")]
        public string Idno { get; set; }

        /// <summary>Job Description</summary>
        [MaxLength(100)]
        [Column("cr694_jobdescription")]
        public string Jobdescription { get; set; }

        /// <summary>Display Name</summary>
        [MaxLength(100)]
        [Column("cr694_name")]
        public string Name { get; set; }

        /// <summary>PDP</summary>
        [Column("cr694_pdp")]
        public bool? Pdp { get; set; }

        /// <summary>PDP Expiry Date</summary>
        [Column("cr694_pdpexpirydate")]
        public DateTime? Pdpexpirydate { get; set; }

        /// <summary>PDP No.</summary>
        [MaxLength(100)]
        [Column("cr694_pdpno")]
        public string Pdpno { get; set; }

        /// <summary>Exchange Rate</summary>
        [Column("exchangerate")]
        public decimal? Exchangerate { get; set; }

        /// <summary>Active Employee</summary>
        [Column("new_activeemployee")]
        public bool? NewActiveemployee { get; set; }

        /// <summary>Cell No.</summary>
        [MaxLength(20)]
        [Column("new_cellno")]
        public string NewCellno { get; set; }

        /// <summary>Commission Payable</summary>
        [Column("new_commissionpayable")]
        public bool? NewCommissionpayable { get; set; }

        /// <summary>Contract On File</summary>
        [Column("new_contractonfile")]
        public bool? NewContractonfile { get; set; }

        /// <summary>Display Name (Calculated)</summary>
        [MaxLength(4000)]
        [Column("new_displaynamecalculated")]
        public string NewDisplaynamecalculated { get; set; }

        /// <summary>E-Mail Address</summary>
        [MaxLength(100)]
        [Column("new_emailaddress")]
        public string NewEmailaddress { get; set; }

        /// <summary>Income Tax Number</summary>
        [MaxLength(50)]
        [Column("new_incometaxnumber")]
        public string NewIncometaxnumber { get; set; }

        /// <summary>Start Date</summary>
        [Column("new_startdate")]
        public DateTime? NewStartdate { get; set; }

        /// <summary>Union Member </summary>
        [Column("new_unionmember")]
        public bool? NewUnionmember { get; set; }

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