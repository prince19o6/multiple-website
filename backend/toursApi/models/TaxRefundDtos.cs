using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models
{
    public class AirportRefundCounterDto
    {
        [JsonPropertyName("terminalName")]
        public string TerminalName { get; set; } = string.Empty;

        [JsonPropertyName("locationType")]
        public string LocationType { get; set; } = "Landside Before Security"; // "Landside Before Security" | "Airside After Passport Control"

        [JsonPropertyName("stepInstruction")]
        public string StepInstruction { get; set; } = string.Empty;

        [JsonPropertyName("operatingHours")]
        public string OperatingHours { get; set; } = "24/7";

        [JsonPropertyName("payoutMethods")]
        public List<string> PayoutMethods { get; set; } = new();
    }

    public class DestinationTaxRuleDto
    {
        [JsonPropertyName("countryCode")]
        public string CountryCode { get; set; } = "TH";

        [JsonPropertyName("countryName")]
        public string CountryName { get; set; } = "Thailand";

        [JsonPropertyName("taxSchemeName")]
        public string TaxSchemeName { get; set; } = "VAT Refund for Tourists (P.P.10)";

        [JsonPropertyName("vatRatePercent")]
        public double VatRatePercent { get; set; } = 7.0;

        [JsonPropertyName("estimatedRefundPercent")]
        public double EstimatedRefundPercent { get; set; } = 5.5; // Net after standard admin fee

        [JsonPropertyName("currencyCode")]
        public string CurrencyCode { get; set; } = "THB";

        [JsonPropertyName("currencySymbol")]
        public string CurrencySymbol { get; set; } = "฿";

        [JsonPropertyName("minimumSpendPerStore")]
        public double MinimumSpendPerStore { get; set; } = 2000.0;

        [JsonPropertyName("minimumTotalAirportClaim")]
        public double MinimumTotalAirportClaim { get; set; } = 5000.0;

        [JsonPropertyName("customsInspectionThreshold")]
        public double CustomsInspectionThreshold { get; set; } = 20000.0;

        [JsonPropertyName("luxuryInspectionNotice")]
        public string LuxuryInspectionNotice { get; set; } = string.Empty;

        [JsonPropertyName("claimDeadlineDays")]
        public int ClaimDeadlineDays { get; set; } = 60;

        [JsonPropertyName("airportCounters")]
        public List<AirportRefundCounterDto> AirportCounters { get; set; } = new();
    }

    public class CustomsAllowanceRuleDto
    {
        [JsonPropertyName("destinationOrHomeCountry")]
        public string DestinationOrHomeCountry { get; set; } = "India Customs (CBIC Return Allowance)";

        [JsonPropertyName("dutyFreeGeneralAllowance")]
        public string DutyFreeGeneralAllowance { get; set; } = "Up to ₹50,000 worth of new articles";

        [JsonPropertyName("alcoholAllowance")]
        public string AlcoholAllowance { get; set; } = "Up to 2 Litres of spirits, wine or beer per adult passenger";

        [JsonPropertyName("tobaccoAllowance")]
        public string TobaccoAllowance { get; set; } = "100 cigarettes OR 25 cigars OR 125g tobacco";

        [JsonPropertyName("goldJewelleryAllowanceMale")]
        public string GoldJewelleryAllowanceMale { get; set; } = "20 grams (max value ₹50,000) duty-free after 1+ year stay";

        [JsonPropertyName("goldJewelleryAllowanceFemale")]
        public string GoldJewelleryAllowanceFemale { get; set; } = "40 grams (max value ₹1,00,000) duty-free after 1+ year stay";

        [JsonPropertyName("currencyDeclarationLimit")]
        public string CurrencyDeclarationLimit { get; set; } = "Declare if foreign currency notes > USD 5,000 or total > USD 10,000";

        [JsonPropertyName("prohibitedItems")]
        public List<string> ProhibitedItems { get; set; } = new();
    }

    public class TaxRefundReceiptDto
    {
        [JsonPropertyName("claimId")]
        public string ClaimId { get; set; } = string.Empty;

        [JsonPropertyName("siteId")]
        public string SiteId { get; set; } = string.Empty;

        [JsonPropertyName("storeName")]
        public string StoreName { get; set; } = string.Empty;

        [JsonPropertyName("storeBranch")]
        public string StoreBranch { get; set; } = string.Empty;

        [JsonPropertyName("purchaseDate")]
        public string PurchaseDate { get; set; } = string.Empty;

        [JsonPropertyName("invoiceNumber")]
        public string InvoiceNumber { get; set; } = string.Empty;

        [JsonPropertyName("taxFormNumber")]
        public string TaxFormNumber { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category { get; set; } = "Shopping";

        [JsonPropertyName("purchaseAmount")]
        public double PurchaseAmount { get; set; }

        [JsonPropertyName("estimatedRefundAmount")]
        public double EstimatedRefundAmount { get; set; }

        [JsonPropertyName("currency")]
        public string Currency { get; set; } = "THB";

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Draft"; // "Draft" | "Customs_Inspected" | "Refund_Claimed"

        [JsonPropertyName("requiresPhysicalInspection")]
        public bool RequiresPhysicalInspection { get; set; }

        [JsonPropertyName("receiptImageUrl")]
        public string ReceiptImageUrl { get; set; } = string.Empty;

        [JsonPropertyName("notes")]
        public string Notes { get; set; } = string.Empty;
    }

    public class TaxRefundSummaryDto
    {
        [JsonPropertyName("totalPurchases")]
        public double TotalPurchases { get; set; }

        [JsonPropertyName("totalEstimatedRefund")]
        public double TotalEstimatedRefund { get; set; }

        [JsonPropertyName("claimedRefund")]
        public double ClaimedRefund { get; set; }

        [JsonPropertyName("pendingRefund")]
        public double PendingRefund { get; set; }

        [JsonPropertyName("totalReceiptsCount")]
        public int TotalReceiptsCount { get; set; }

        [JsonPropertyName("pendingInspectionCount")]
        public int PendingInspectionCount { get; set; }

        [JsonPropertyName("currency")]
        public string Currency { get; set; } = "THB";
    }

    public class CreateTaxReceiptRequestDto
    {
        [JsonPropertyName("storeName")]
        public string StoreName { get; set; } = string.Empty;

        [JsonPropertyName("storeBranch")]
        public string StoreBranch { get; set; } = string.Empty;

        [JsonPropertyName("purchaseDate")]
        public string PurchaseDate { get; set; } = string.Empty;

        [JsonPropertyName("invoiceNumber")]
        public string InvoiceNumber { get; set; } = string.Empty;

        [JsonPropertyName("taxFormNumber")]
        public string TaxFormNumber { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category { get; set; } = "Fashion & Apparel";

        [JsonPropertyName("purchaseAmount")]
        public double PurchaseAmount { get; set; }

        [JsonPropertyName("receiptImageUrl")]
        public string ReceiptImageUrl { get; set; } = string.Empty;

        [JsonPropertyName("notes")]
        public string Notes { get; set; } = string.Empty;
    }

    public class UpdateClaimStatusRequestDto
    {
        [JsonPropertyName("status")]
        public string Status { get; set; } = "Customs_Inspected"; // "Draft" | "Customs_Inspected" | "Refund_Claimed"

        [JsonPropertyName("notes")]
        public string? Notes { get; set; }
    }
}
