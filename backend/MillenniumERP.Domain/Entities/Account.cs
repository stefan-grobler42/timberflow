using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MillenniumERP.Domain.Entities;

[Table("accounts")]
public class Account
{
    [Key]
    [Column("accountid")]
    public Guid Id { get; set; }

    // Basic Information
    [Column("name")]
    public string? Name { get; set; }

    [Column("accountnumber")]
    public string? AccountNumber { get; set; }

    // Contact Information
    [Column("telephone1")]
    public string? Telephone1 { get; set; }

    [Column("telephone2")]
    public string? Telephone2 { get; set; }

    [Column("telephone3")]
    public string? Telephone3 { get; set; }

    [Column("fax")]
    public string? Fax { get; set; }

    [Column("emailaddress1")]
    public string? EmailAddress1 { get; set; }

    [Column("emailaddress2")]
    public string? EmailAddress2 { get; set; }

    [Column("emailaddress3")]
    public string? EmailAddress3 { get; set; }

    [Column("websiteurl")]
    public string? WebsiteUrl { get; set; }

    [Column("ftpsiteurl")]
    public string? FtpSiteUrl { get; set; }

    // Primary Address (Address 1)
    [Column("address1_addressid")]
    public Guid? Address1AddressId { get; set; }

    [Column("address1_addresstypecode")]
    public int? Address1AddressTypeCode { get; set; }

    [Column("address1_name")]
    public string? Address1Name { get; set; }

    [Column("address1_primarycontactname")]
    public string? Address1PrimaryContactName { get; set; }

    [Column("address1_line1")]
    public string? Address1Line1 { get; set; }

    [Column("address1_line2")]
    public string? Address1Line2 { get; set; }

    [Column("address1_line3")]
    public string? Address1Line3 { get; set; }

    [Column("address1_city")]
    public string? Address1City { get; set; }

    [Column("address1_stateorprovince")]
    public string? Address1StateOrProvince { get; set; }

    [Column("address1_county")]
    public string? Address1County { get; set; }

    [Column("address1_country")]
    public string? Address1Country { get; set; }

    [Column("address1_postalcode")]
    public string? Address1PostalCode { get; set; }

    [Column("address1_postofficebox")]
    public string? Address1PostOfficeBox { get; set; }

    [Column("address1_latitude")]
    public double? Address1Latitude { get; set; }

    [Column("address1_longitude")]
    public double? Address1Longitude { get; set; }

    [Column("address1_shippingmethodcode")]
    public int? Address1ShippingMethodCode { get; set; }

    [Column("address1_telephone1")]
    public string? Address1Telephone1 { get; set; }

    [Column("address1_telephone2")]
    public string? Address1Telephone2 { get; set; }

    [Column("address1_telephone3")]
    public string? Address1Telephone3 { get; set; }

    [Column("address1_fax")]
    public string? Address1Fax { get; set; }

    [Column("address1_composite")]
    public string? Address1Composite { get; set; }

    [Column("address1_upszone")]
    public string? Address1UpsZone { get; set; }

    [Column("address1_utcoffset")]
    public int? Address1UtcOffset { get; set; }

    [Column("address1_freighttermscode")]
    public int? Address1FreightTermsCode { get; set; }

    // Secondary Address (Address 2)
    [Column("address2_addressid")]
    public Guid? Address2AddressId { get; set; }

    [Column("address2_addresstypecode")]
    public int? Address2AddressTypeCode { get; set; }

    [Column("address2_name")]
    public string? Address2Name { get; set; }

    [Column("address2_primarycontactname")]
    public string? Address2PrimaryContactName { get; set; }

    [Column("address2_line1")]
    public string? Address2Line1 { get; set; }

    [Column("address2_line2")]
    public string? Address2Line2 { get; set; }

    [Column("address2_line3")]
    public string? Address2Line3 { get; set; }

    [Column("address2_city")]
    public string? Address2City { get; set; }

    [Column("address2_stateorprovince")]
    public string? Address2StateOrProvince { get; set; }

    [Column("address2_county")]
    public string? Address2County { get; set; }

    [Column("address2_country")]
    public string? Address2Country { get; set; }

    [Column("address2_postalcode")]
    public string? Address2PostalCode { get; set; }

    [Column("address2_postofficebox")]
    public string? Address2PostOfficeBox { get; set; }

    [Column("address2_latitude")]
    public double? Address2Latitude { get; set; }

    [Column("address2_longitude")]
    public double? Address2Longitude { get; set; }

    [Column("address2_shippingmethodcode")]
    public int? Address2ShippingMethodCode { get; set; }

    [Column("address2_telephone1")]
    public string? Address2Telephone1 { get; set; }

    [Column("address2_telephone2")]
    public string? Address2Telephone2 { get; set; }

    [Column("address2_telephone3")]
    public string? Address2Telephone3 { get; set; }

    [Column("address2_fax")]
    public string? Address2Fax { get; set; }

    [Column("address2_composite")]
    public string? Address2Composite { get; set; }

    [Column("address2_upszone")]
    public string? Address2UpsZone { get; set; }

    [Column("address2_utcoffset")]
    public int? Address2UtcOffset { get; set; }

    [Column("address2_freighttermscode")]
    public int? Address2FreightTermsCode { get; set; }

    // Business Information
    [Column("description")]
    public string? Description { get; set; }

    [Column("revenue")]
    public decimal? Revenue { get; set; }

    [Column("revenue_base")]
    public decimal? RevenueBase { get; set; }

    [Column("numberofemployees")]
    public int? NumberOfEmployees { get; set; }

    [Column("industrycode")]
    public int? IndustryCode { get; set; }

    [Column("sic")]
    public string? Sic { get; set; }

    [Column("tickersymbol")]
    public string? TickerSymbol { get; set; }

    [Column("stockexchange")]
    public string? StockExchange { get; set; }

    [Column("sharesoutstanding")]
    public int? SharesOutstanding { get; set; }

    [Column("marketcap")]
    public decimal? MarketCap { get; set; }

    [Column("marketcap_base")]
    public decimal? MarketCapBase { get; set; }

    // Custom Fields (Millennium-specific)
    [Column("cr694_accounttype")]
    public int? Cr694AccountType { get; set; }

    [Column("cr694_companyregistrationnumber")]
    public string? Cr694CompanyRegistrationNumber { get; set; }

    [Column("cr694_companytype")]
    public int? Cr694CompanyType { get; set; }

    [Column("cr694_vatregistrationno")]
    public string? Cr694VatRegistrationNo { get; set; }

    [Column("_cr694_businesstype_value")]
    public Guid? Cr694BusinessTypeValue { get; set; }

    [Column("_cr694_salesrepresentative_value")]
    public Guid? Cr694SalesRepresentativeValue { get; set; }

    // Account Classification
    [Column("accountcategorycode")]
    public int? AccountCategoryCode { get; set; }

    [Column("accountclassificationcode")]
    public int? AccountClassificationCode { get; set; }

    [Column("accountratingcode")]
    public int? AccountRatingCode { get; set; }

    [Column("businesstypecode")]
    public int? BusinessTypeCode { get; set; }

    [Column("customersizecode")]
    public int? CustomerSizeCode { get; set; }

    [Column("customertypecode")]
    public int? CustomerTypeCode { get; set; }

    [Column("ownershipcode")]
    public int? OwnershipCode { get; set; }

    [Column("relationshiptypecode")]
    public int? RelationshipTypeCode { get; set; }

    [Column("territorycode")]
    public int? TerritoryCode { get; set; }

    // Credit & Financial
    [Column("creditlimit")]
    public decimal? CreditLimit { get; set; }

    [Column("creditlimit_base")]
    public decimal? CreditLimitBase { get; set; }

    [Column("creditonhold")]
    public bool? CreditOnHold { get; set; }

    [Column("paymenttermscode")]
    public int? PaymentTermsCode { get; set; }

    [Column("aging30")]
    public decimal? Aging30 { get; set; }

    [Column("aging30_base")]
    public decimal? Aging30Base { get; set; }

    [Column("aging60")]
    public decimal? Aging60 { get; set; }

    [Column("aging60_base")]
    public decimal? Aging60Base { get; set; }

    [Column("aging90")]
    public decimal? Aging90 { get; set; }

    [Column("aging90_base")]
    public decimal? Aging90Base { get; set; }

    // Communication Preferences
    [Column("donotbulkemail")]
    public bool? DoNotBulkEmail { get; set; }

    [Column("donotbulkpostalmail")]
    public bool? DoNotBulkPostalMail { get; set; }

    [Column("donotemail")]
    public bool? DoNotEmail { get; set; }

    [Column("donotfax")]
    public bool? DoNotFax { get; set; }

    [Column("donotphone")]
    public bool? DoNotPhone { get; set; }

    [Column("donotpostalmail")]
    public bool? DoNotPostalMail { get; set; }

    [Column("donotsendmm")]
    public bool? DoNotSendMM { get; set; }

    [Column("followemail")]
    public bool? FollowEmail { get; set; }

    [Column("preferredcontactmethodcode")]
    public int? PreferredContactMethodCode { get; set; }

    [Column("preferredappointmentdaycode")]
    public int? PreferredAppointmentDayCode { get; set; }

    [Column("preferredappointmenttimecode")]
    public int? PreferredAppointmentTimeCode { get; set; }

    // Marketing
    [Column("marketingonly")]
    public bool? MarketingOnly { get; set; }

    [Column("lastusedincampaign")]
    public DateTime? LastUsedInCampaign { get; set; }

    // Status & Workflow
    [Column("statecode")]
    public int? StateCode { get; set; }

    [Column("statuscode")]
    public int? StatusCode { get; set; }

    [Column("participatesinworkflow")]
    public bool? ParticipatesInWorkflow { get; set; }

    [Column("merged")]
    public bool? Merged { get; set; }

    [Column("onholdtime")]
    public int? OnHoldTime { get; set; }

    [Column("lastonholdtime")]
    public DateTime? LastOnHoldTime { get; set; }

    // Relationships (Lookup GUIDs)
    [Column("ownerid")]
    public Guid? OwnerId { get; set; }

    [Column("_owningbusinessunit_value")]
    public Guid? OwningBusinessUnitValue { get; set; }

    [Column("_owninguser_value")]
    public Guid? OwningUserValue { get; set; }

    [Column("_owningteam_value")]
    public Guid? OwningTeamValue { get; set; }

    [Column("_primarycontactid_value")]
    public Guid? PrimaryContactIdValue { get; set; }

    [Column("_parentaccountid_value")]
    public Guid? ParentAccountIdValue { get; set; }

    [Column("_preferredsystemuserid_value")]
    public Guid? PreferredSystemUserIdValue { get; set; }

    [Column("_preferredserviceid_value")]
    public Guid? PreferredServiceIdValue { get; set; }

    [Column("_preferredequipmentid_value")]
    public Guid? PreferredEquipmentIdValue { get; set; }

    [Column("_defaultpricelevelid_value")]
    public Guid? DefaultPriceLevelIdValue { get; set; }

    [Column("_masterid_value")]
    public Guid? MasterIdValue { get; set; }

    [Column("_originatingleadid_value")]
    public Guid? OriginatingLeadIdValue { get; set; }

    [Column("_territoryid_value")]
    public Guid? TerritoryIdValue { get; set; }

    [Column("_transactioncurrencyid_value")]
    public Guid? TransactionCurrencyIdValue { get; set; }

    [Column("_slaid_value")]
    public Guid? SlaIdValue { get; set; }

    [Column("_slainvokedid_value")]
    public Guid? SlaInvokedIdValue { get; set; }

    // Exchange & Currency
    [Column("exchangerate")]
    public decimal? ExchangeRate { get; set; }

    // Performance Metrics
    [Column("opendeals")]
    public int? OpenDeals { get; set; }

    [Column("opendeals_date")]
    public DateTime? OpenDealsDate { get; set; }

    [Column("opendeals_state")]
    public int? OpenDealsState { get; set; }

    [Column("openrevenue")]
    public decimal? OpenRevenue { get; set; }

    [Column("openrevenue_base")]
    public decimal? OpenRevenueBase { get; set; }

    [Column("openrevenue_date")]
    public DateTime? OpenRevenueDate { get; set; }

    [Column("openrevenue_state")]
    public int? OpenRevenueState { get; set; }

    // Social
    [Column("primarysatoriid")]
    public string? PrimarySatoriId { get; set; }

    [Column("primarytwitterid")]
    public string? PrimaryTwitterId { get; set; }

    [Column("yominame")]
    public string? YomiName { get; set; }

    // Dynamics 365-specific
    [Column("msdyn_externalaccountid")]
    public string? MsdynExternalAccountId { get; set; }

    [Column("msdyn_gdproptout")]
    public bool? MsdynGdprOptOut { get; set; }

    [Column("msdyn_taxexempt")]
    public bool? MsdynTaxExempt { get; set; }

    [Column("msdyn_taxexemptnumber")]
    public string? MsdynTaxExemptNumber { get; set; }

    [Column("msdyn_travelcharge")]
    public decimal? MsdynTravelCharge { get; set; }

    [Column("msdyn_travelcharge_base")]
    public decimal? MsdynTravelChargeBase { get; set; }

    [Column("msdyn_travelchargetype")]
    public int? MsdynTravelChargeType { get; set; }

    [Column("msdyn_workorderinstructions")]
    public string? MsdynWorkOrderInstructions { get; set; }

    [Column("msdyn_primarytimezone")]
    public int? MsdynPrimaryTimezone { get; set; }

    [Column("_msdyn_salestaxcode_value")]
    public Guid? MsdynSalesTaxCodeValue { get; set; }

    [Column("_msdyn_serviceterritory_value")]
    public Guid? MsdynServiceTerritoryValue { get; set; }

    [Column("_msdyn_billingaccount_value")]
    public Guid? MsdynBillingAccountValue { get; set; }

    [Column("_msdyn_workhourtemplate_value")]
    public Guid? MsdynWorkHourTemplateValue { get; set; }

    [Column("_msdyn_preferredresource_value")]
    public Guid? MsdynPreferredResourceValue { get; set; }

    [Column("_msdyn_accountkpiid_value")]
    public Guid? MsdynAccountKpiIdValue { get; set; }

    [Column("_msdyn_salesaccelerationinsightid_value")]
    public Guid? MsdynSalesAccelerationInsightIdValue { get; set; }

    [Column("_msdyn_segmentid_value")]
    public Guid? MsdynSegmentIdValue { get; set; }

    [Column("_msa_managingpartnerid_value")]
    public Guid? MsaManagingPartnerIdValue { get; set; }

    // Workflow & Process
    [Column("processid")]
    public Guid? ProcessId { get; set; }

    [Column("stageid")]
    public Guid? StageId { get; set; }

    [Column("traversedpath")]
    public string? TraversedPath { get; set; }

    // System Fields
    [Column("createdon")]
    public DateTime CreatedOn { get; set; }

    [Column("modifiedon")]
    public DateTime? ModifiedOn { get; set; }

    [Column("_createdby_value")]
    public Guid? CreatedByValue { get; set; }

    [Column("_modifiedby_value")]
    public Guid? ModifiedByValue { get; set; }

    [Column("_createdonbehalfby_value")]
    public Guid? CreatedOnBehalfByValue { get; set; }

    [Column("_modifiedonbehalfby_value")]
    public Guid? ModifiedOnBehalfByValue { get; set; }

    [Column("CreatedBy")]
    public string? CreatedBy { get; set; }

    [Column("ModifiedBy")]
    public string? ModifiedBy { get; set; }

    [Column("overriddencreatedon")]
    public DateTime? OverriddenCreatedOn { get; set; }

    [Column("importsequencenumber")]
    public int? ImportSequenceNumber { get; set; }

    [Column("timezoneruleversionnumber")]
    public int? TimeZoneRuleVersionNumber { get; set; }

    [Column("utcconversiontimezonecode")]
    public int? UtcConversionTimeZoneCode { get; set; }

    [Column("versionnumber")]
    public long? VersionNumber { get; set; }

    [Column("teamsfollowed")]
    public int? TeamsFollowed { get; set; }

    [Column("timespentbymeonemailandmeetings")]
    public string? TimeSpentByMeOnEmailAndMeetings { get; set; }

    // Image
    [Column("entityimageid")]
    public Guid? EntityImageId { get; set; }

    [Column("entityimage_timestamp")]
    public long? EntityImageTimestamp { get; set; }

    [Column("entityimage_url")]
    public string? EntityImageUrl { get; set; }

    // Portal/ADX fields
    [Column("adx_createdbyipaddress")]
    public string? AdxCreatedByIpAddress { get; set; }

    [Column("adx_createdbyusername")]
    public string? AdxCreatedByUsername { get; set; }

    [Column("adx_modifiedbyipaddress")]
    public string? AdxModifiedByIpAddress { get; set; }

    [Column("adx_modifiedbyusername")]
    public string? AdxModifiedByUsername { get; set; }

    // External Party
    [Column("_createdbyexternalparty_value")]
    public Guid? CreatedByExternalPartyValue { get; set; }

    [Column("_modifiedbyexternalparty_value")]
    public Guid? ModifiedByExternalPartyValue { get; set; }

    [Column("shippingmethodcode")]
    public int? ShippingMethodCode { get; set; }

    // Navigation properties
    [ForeignKey("PrimaryContactIdValue")]
    public D365Contact? PrimaryContact { get; set; }

    [ForeignKey("ParentAccountIdValue")]
    public Account? ParentAccount { get; set; }

    [ForeignKey("Cr694SalesRepresentativeValue")]
    public SaleRepresentative? SalesRep { get; set; }

    // Reverse navigation properties
    public ICollection<Production> Productions { get; set; } = new List<Production>();
    public ICollection<Delivery> Deliveries { get; set; } = new List<Delivery>();
    public ICollection<D365Order> Orders { get; set; } = new List<D365Order>();
    public ICollection<D365Quote> Quotes { get; set; } = new List<D365Quote>();
    public ICollection<Tender> Tenders { get; set; } = new List<Tender>();
    public ICollection<D365Contact> Contacts { get; set; } = new List<D365Contact>();
    public ICollection<Account> ChildAccounts { get; set; } = new List<Account>();
}
