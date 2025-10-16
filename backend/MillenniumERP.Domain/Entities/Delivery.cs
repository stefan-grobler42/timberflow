using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities
{
    [Table("cr694_dispatch")]
    public class Delivery
    {
        /// <summary>Activity Additional Parameters</summary>
        [Column("activityadditionalparams")]
        public string? Activityadditionalparams { get; set; }

        /// <summary>Activity</summary>
        [Key]
        [Column("activityid")]
        public Guid Id { get; set; }

        /// <summary>Activity Type</summary>
        [Column("activitytypecode")]
        public string? Activitytypecode { get; set; }

        /// <summary>Actual Duration</summary>
        [Column("actualdurationminutes")]
        public int? Actualdurationminutes { get; set; }

        /// <summary>Actual End</summary>
        [Column("actualend")]
        public DateTime? Actualend { get; set; }

        /// <summary>Actual Start</summary>
        [Column("actualstart")]
        public DateTime? Actualstart { get; set; }

        /// <summary>BCC</summary>
        [Column("bcc")]
        public string? Bcc { get; set; }

        /// <summary>CC</summary>
        [Column("cc")]
        public string? Cc { get; set; }

        /// <summary>Social Channel</summary>
        [Column("community")]
        public int? Community { get; set; }

        /// <summary>Arrival Time (Factory)</summary>
        [Column("cr694_arrivaltime")]
        public DateTime? Arrivaltime { get; set; }

        /// <summary>Arrival Time (Site)</summary>
        [Column("cr694_arrivaltimesite")]
        public DateTime? Arrivaltimesite { get; set; }

        /// <summary>From Km's</summary>
        [Column("cr694_closekms")]
        public string? Closekms { get; set; }

        /// <summary>Customer</summary>
        [Column("cr694_customer")]
        public Guid? Customer { get; set; }

        /// <summary>Trip No.</summary>
        [Column("cr694_deliveryno")]
        public string? Deliveryno { get; set; }

        /// <summary>Departure Time (Factory)</summary>
        [Column("cr694_departuretime")]
        public DateTime? Departuretime { get; set; }

        /// <summary>Departure Time (Site)</summary>
        [Column("cr694_departuretimesite")]
        public DateTime? Departuretimesite { get; set; }

        /// <summary>Dispatch Manager</summary>
        [Column("cr694_dispatchmanager")]
        public Guid? Dispatchmanager { get; set; }

        /// <summary>Driver</summary>
        [Column("cr694_driver")]
        public Guid? Driver { get; set; }

        /// <summary>Helper 4</summary>
        [Column("cr694_helper")]
        public Guid? Helper { get; set; }

        /// <summary>Helper 1</summary>
        [Column("cr694_helper1")]
        public Guid? Helper1 { get; set; }

        /// <summary>Helper 2</summary>
        [Column("cr694_helper2")]
        public Guid? Helper2 { get; set; }

        /// <summary>Helper 3</summary>
        [Column("cr694_helper3")]
        public Guid? Helper3 { get; set; }

        /// <summary>Helper 5</summary>
        [Column("cr694_helper5")]
        public Guid? Helper5 { get; set; }

        /// <summary>Loading Date</summary>
        [Column("cr694_loadingdate")]
        public DateTime? Loadingdate { get; set; }

        /// <summary>Load Master</summary>
        [Column("cr694_loadmaster")]
        public Guid? Loadmaster { get; set; }

        /// <summary>To Km's</summary>
        [Column("cr694_openkms")]
        public string? Openkms { get; set; }

        /// <summary>Order No.</summary>
        [Column("cr694_orderno")]
        public Guid? Orderno { get; set; }

        /// <summary>Part Load</summary>
        [Column("cr694_partload")]
        public bool? Partload { get; set; }

        /// <summary>Order</summary>
        [Column("cr694_salesorder")]
        public Guid? Salesorder { get; set; }

        /// <summary>Security</summary>
        [Column("cr694_security")]
        public Guid? Security { get; set; }

        /// <summary>Trailer</summary>
        [Column("cr694_trailer")]
        public Guid? Trailer { get; set; }

        /// <summary>Vehicle</summary>
        [Column("cr694_vehicle")]
        public Guid? Vehicle { get; set; }

        /// <summary>Customers</summary>
        [Column("customers")]
        public string? Customers { get; set; }

        /// <summary>Date Delivery Last Attempted</summary>
        [Column("deliverylastattemptedon")]
        public DateTime? Deliverylastattemptedon { get; set; }

        /// <summary>Delivery Priority</summary>
        [Column("deliveryprioritycode")]
        public int? Deliveryprioritycode { get; set; }

        /// <summary>Description</summary>
        [Column("description")]
        public string? Description { get; set; }

        /// <summary>Exchange Item ID</summary>
        [Column("exchangeitemid")]
        public string? Exchangeitemid { get; set; }

        /// <summary>Exchange Rate</summary>
        [Column("exchangerate")]
        public decimal? Exchangerate { get; set; }

        /// <summary>Exchange WebLink</summary>
        [Column("exchangeweblink")]
        public string? Exchangeweblink { get; set; }

        /// <summary>From</summary>
        [Column("from")]
        public string? From { get; set; }

        /// <summary>Recurring Instance Type</summary>
        [Column("instancetypecode")]
        public int? Instancetypecode { get; set; }

        /// <summary>Is Billed</summary>
        [Column("isbilled")]
        public bool? Isbilled { get; set; }

        /// <summary>Is Private</summary>
        [Column("ismapiprivate")]
        public bool? Ismapiprivate { get; set; }

        /// <summary>Is Regular Activity</summary>
        [Column("isregularactivity")]
        public bool? Isregularactivity { get; set; }

        /// <summary>Is Workflow Created</summary>
        [Column("isworkflowcreated")]
        public bool? Isworkflowcreated { get; set; }

        /// <summary>Last On Hold Time</summary>
        [Column("lastonholdtime")]
        public DateTime? Lastonholdtime { get; set; }

        /// <summary>Left Voice Mail</summary>
        [Column("leftvoicemail")]
        public bool? Leftvoicemail { get; set; }

        /// <summary>On Hold Time (Minutes)</summary>
        [Column("onholdtime")]
        public int? Onholdtime { get; set; }

        /// <summary>Optional Attendees</summary>
        [Column("optionalattendees")]
        public string? Optionalattendees { get; set; }

        /// <summary>Organizer</summary>
        [Column("organizer")]
        public string? Organizer { get; set; }

        /// <summary>Outsource Vendors</summary>
        [Column("partners")]
        public string? Partners { get; set; }

        /// <summary>Delay activity processing until</summary>
        [Column("postponeactivityprocessinguntil")]
        public DateTime? Postponeactivityprocessinguntil { get; set; }

        /// <summary>Priority</summary>
        [Column("prioritycode")]
        public int? Prioritycode { get; set; }

        /// <summary>Process</summary>
        [Column("processid")]
        public Guid? Processid { get; set; }

        /// <summary>Regarding</summary>
        [Column("regardingobjectid")]
        public Guid? Regardingobjectid { get; set; }

        [Column("regardingobjecttypecode")]
        public string? Regardingobjecttypecode { get; set; }

        /// <summary>Required Attendees</summary>
        [Column("requiredattendees")]
        public string? Requiredattendees { get; set; }

        /// <summary>Resources</summary>
        [Column("resources")]
        public string? Resources { get; set; }

        /// <summary>Scheduled Duration</summary>
        [Column("scheduleddurationminutes")]
        public int? Scheduleddurationminutes { get; set; }

        /// <summary>Due Date</summary>
        [Column("scheduledend")]
        public DateTime? Scheduledend { get; set; }

        /// <summary>Start Date</summary>
        [Column("scheduledstart")]
        public DateTime? Scheduledstart { get; set; }

        /// <summary>Sender's Mailbox</summary>
        [Column("sendermailboxid")]
        public Guid? Sendermailboxid { get; set; }

        /// <summary>Date Sent</summary>
        [Column("senton")]
        public DateTime? Senton { get; set; }

        /// <summary>Series Id</summary>
        [Column("seriesid")]
        public Guid? Seriesid { get; set; }

        /// <summary>Service</summary>
        [Column("serviceid")]
        public Guid? Serviceid { get; set; }

        /// <summary>SLA</summary>
        [Column("slaid")]
        public Guid? Slaid { get; set; }

        /// <summary>Last SLA applied</summary>
        [Column("slainvokedid")]
        public Guid? Slainvokedid { get; set; }

        /// <summary>Sort Date</summary>
        [Column("sortdate")]
        public DateTime? Sortdate { get; set; }

        /// <summary>(Deprecated) Process Stage</summary>
        [Column("stageid")]
        public Guid? Stageid { get; set; }

        /// <summary>Subject</summary>
        [Column("subject")]
        public string? Subject { get; set; }

        /// <summary>To</summary>
        [Column("to")]
        public string? To { get; set; }

        /// <summary>Currency</summary>
        [Column("transactioncurrencyid")]
        public Guid? Transactioncurrencyid { get; set; }

        /// <summary>(Deprecated) Traversed Path</summary>
        [Column("traversedpath")]
        public string? Traversedpath { get; set; }

        // Audit fields
        public DateTime? CreatedOn { get; set; }
        public Guid? CreatedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public Guid? ModifiedBy { get; set; }
    }
}