using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities
{
    /// <summary>
    /// This table contains pricing information for tender calculations
    /// </summary>
    [Table("cr694_pricingcalculation")]
    public class PricingCalculation
    {
        /// <summary>Discount</summary>
        [Column("cr694_discount")]
        public decimal? Discount { get; set; }

        /// <summary>Installed Cost</summary>
        [Column("cr694_installedcost")]
        public decimal? Installedcost { get; set; }

        /// <summary>Installed Cost (Base)</summary>
        [Column("cr694_installedcost_base")]
        public decimal? InstalledcostBase { get; set; }

        /// <summary>Pricing Calculation</summary>
        [Key]
        [Column("cr694_pricingcalculationid")]
        public Guid Id { get; set; }

        /// <summary>Product Name</summary>
        [MaxLength(100)]
        [Column("cr694_productname")]
        public string Productname { get; set; }

        /// <summary>Quantity</summary>
        [Column("cr694_quantity")]
        public int? Quantity { get; set; }

        /// <summary>Test</summary>
        [MaxLength(4000)]
        [Column("cr694_test")]
        public string Test { get; set; }

        /// <summary>Total Price</summary>
        [Column("cr694_totalprice")]
        public decimal? Totalprice { get; set; }

        /// <summary>Total Price (Base)</summary>
        [Column("cr694_totalprice_base")]
        public decimal? TotalpriceBase { get; set; }

        /// <summary>Unit Price</summary>
        [Column("cr694_unitprice")]
        public decimal? Unitprice { get; set; }

        /// <summary>Unit Price (Base)</summary>
        [Column("cr694_unitprice_base")]
        public decimal? UnitpriceBase { get; set; }

        /// <summary>Exchange Rate</summary>
        [Column("exchangerate")]
        public decimal? Exchangerate { get; set; }

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