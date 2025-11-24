using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities
{
    [Table("cr694_logistics")]
    public class Logistics
    {
        /// <summary>Delivery No.</summary>
        [Column("cr694_deliveryno")]
        public string? Deliveryno { get; set; }

        /// <summary>Description</summary>
        [Column("cr694_description")]
        public string? Description { get; set; }

        /// <summary>Dispatch Manager</summary>
        [Column("cr694_dispatchmanager")]
        public Guid? Dispatchmanager { get; set; }

        /// <summary>Driver</summary>
        [Column("cr694_driver")]
        public Guid? Driver { get; set; }

        /// <summary>Helper 1</summary>
        [Column("cr694_helper1")]
        public Guid? Helper1 { get; set; }

        /// <summary>Helper 2</summary>
        [Column("cr694_helper2")]
        public Guid? Helper2 { get; set; }

        /// <summary>Helper 3</summary>
        [Column("cr694_helper3")]
        public Guid? Helper3 { get; set; }

        /// <summary>Helper 4</summary>
        [Column("cr694_helper4")]
        public Guid? Helper4 { get; set; }

        /// <summary>Helper 5</summary>
        [Column("cr694_helper5")]
        public Guid? Helper5 { get; set; }

        /// <summary>Load Master</summary>
        [Column("cr694_loadmaster")]
        public Guid? Loadmaster { get; set; }

        /// <summary>Logistics</summary>
        [Key]
        [Column("cr694_logisticsid")]
        public Guid Id { get; set; }

        /// <summary>Planned Load Date</summary>
        [Column("cr694_plannedloaddate")]
        public DateTime? Plannedloaddate { get; set; }

        /// <summary>Security</summary>
        [Column("cr694_security")]
        public Guid? Security { get; set; }

        /// <summary>Trailer</summary>
        [Column("cr694_trailer")]
        public Guid? Trailer { get; set; }

        /// <summary>Vehicle</summary>
        [Column("cr694_vehicle")]
        public Guid? Vehicle { get; set; }

        /// <summary>Km's Travelled</summary>
        [Column("new_kmstravelled")]
        public int? NewKmstravelled { get; set; }

        /// <summary>Km's Travelled (Last Updated On)</summary>
        [Column("new_kmstravelled_date")]
        public DateTime? NewKmstravelledDate { get; set; }

        /// <summary>Km's Travelled (State)</summary>
        [Column("new_kmstravelled_state")]
        public int? NewKmstravelledState { get; set; }

        /// <summary>Load Completed </summary>
        [Column("new_loadcompleted")]
        public bool? NewLoadcompleted { get; set; }

        /// <summary>Load Duration</summary>
        [Column("new_loadduration")]
        public int? NewLoadduration { get; set; }

        /// <summary>Load Duration (Last Updated On)</summary>
        [Column("new_loadduration_date")]
        public DateTime? NewLoaddurationDate { get; set; }

        /// <summary>Load Duration (State)</summary>
        [Column("new_loadduration_state")]
        public int? NewLoaddurationState { get; set; }

        // Audit fields
        public DateTime? CreatedOn { get; set; }
        public Guid? CreatedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public Guid? ModifiedBy { get; set; }

        // Navigation properties
        [ForeignKey("Driver")]
        public Employee? DriverEmployee { get; set; }

        [ForeignKey("Helper1")]
        public Employee? Helper1Employee { get; set; }

        [ForeignKey("Helper2")]
        public Employee? Helper2Employee { get; set; }

        [ForeignKey("Helper3")]
        public Employee? Helper3Employee { get; set; }

        [ForeignKey("Helper4")]
        public Employee? Helper4Employee { get; set; }

        [ForeignKey("Helper5")]
        public Employee? Helper5Employee { get; set; }

        [ForeignKey("Loadmaster")]
        public Employee? LoadmasterEmployee { get; set; }

        [ForeignKey("Dispatchmanager")]
        public Employee? DispatchManagerEmployee { get; set; }

        [ForeignKey("Security")]
        public Employee? SecurityEmployee { get; set; }

        [ForeignKey("Vehicle")]
        public Vehicles? VehicleInfo { get; set; }

        [ForeignKey("Trailer")]
        public Vehicles? TrailerInfo { get; set; }
    }
}