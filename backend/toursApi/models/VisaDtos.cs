using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models
{
    public class VisaRequirementDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("destinationCountry")]
        public string DestinationCountry { get; set; } = "Thailand";

        [JsonPropertyName("passportNationality")]
        public string PassportNationality { get; set; } = "India";

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Visa_Free"; // "Visa_Free" | "Visa_On_Arrival" | "eVisa" | "Sticker_Visa_Required"

        [JsonPropertyName("statusBadge")]
        public string StatusBadge { get; set; } = "60 Days Visa-Free Exemption";

        [JsonPropertyName("maxStayDays")]
        public int MaxStayDays { get; set; } = 60;

        [JsonPropertyName("processingTime")]
        public string ProcessingTime { get; set; } = "Instant at Border Immigration";

        [JsonPropertyName("estimatedFee")]
        public string EstimatedFee { get; set; } = "Free (0 THB)";

        [JsonPropertyName("passportValidityMonthsRequired")]
        public int PassportValidityMonthsRequired { get; set; } = 6;

        [JsonPropertyName("blankPagesRequired")]
        public int BlankPagesRequired { get; set; } = 2;

        [JsonPropertyName("mandatoryDocuments")]
        public List<string> MandatoryDocuments { get; set; } = new();

        [JsonPropertyName("officialPortalUrl")]
        public string OfficialPortalUrl { get; set; } = string.Empty;

        [JsonPropertyName("notes")]
        public string Notes { get; set; } = string.Empty;
    }

    public class DigitalArrivalCardDto
    {
        [JsonPropertyName("cardId")]
        public string CardId { get; set; } = string.Empty;

        [JsonPropertyName("destinationCountry")]
        public string DestinationCountry { get; set; } = "Thailand";

        [JsonPropertyName("cardName")]
        public string CardName { get; set; } = string.Empty;

        [JsonPropertyName("submissionWindow")]
        public string SubmissionWindow { get; set; } = "Within 72 hours before arrival";

        [JsonPropertyName("isMandatory")]
        public bool IsMandatory { get; set; } = true;

        [JsonPropertyName("officialSubmissionUrl")]
        public string OfficialSubmissionUrl { get; set; } = string.Empty;

        [JsonPropertyName("requiredDetails")]
        public List<string> RequiredDetails { get; set; } = new();

        [JsonPropertyName("customsDutyRules")]
        public string CustomsDutyRules { get; set; } = string.Empty;
    }

    public class EmbassyConsulateDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("homeCountry")]
        public string HomeCountry { get; set; } = "India";

        [JsonPropertyName("destinationCountry")]
        public string DestinationCountry { get; set; } = "Thailand";

        [JsonPropertyName("city")]
        public string City { get; set; } = "Bangkok";

        [JsonPropertyName("missionName")]
        public string MissionName { get; set; } = string.Empty;

        [JsonPropertyName("address")]
        public string Address { get; set; } = string.Empty;

        [JsonPropertyName("emergencyPhone")]
        public string EmergencyPhone { get; set; } = string.Empty;

        [JsonPropertyName("consularEmail")]
        public string ConsularEmail { get; set; } = string.Empty;

        [JsonPropertyName("workingHours")]
        public string WorkingHours { get; set; } = "Mon-Fri 09:00 - 17:30";

        [JsonPropertyName("lostPassportInstructions")]
        public string LostPassportInstructions { get; set; } = string.Empty;
    }

    public class PassportValidityCheckRequestDto
    {
        [JsonPropertyName("passportExpiryDate")]
        public string PassportExpiryDate { get; set; } = string.Empty;

        [JsonPropertyName("tripDepartureDate")]
        public string TripDepartureDate { get; set; } = string.Empty;

        [JsonPropertyName("destinationCountry")]
        public string DestinationCountry { get; set; } = "Thailand";
    }

    public class PassportValidityCheckResultDto
    {
        [JsonPropertyName("isValid")]
        public bool IsValid { get; set; }

        [JsonPropertyName("daysRemainingOnDeparture")]
        public int DaysRemainingOnDeparture { get; set; }

        [JsonPropertyName("monthsRemaining")]
        public double MonthsRemaining { get; set; }

        [JsonPropertyName("minimumMonthsRequired")]
        public int MinimumMonthsRequired { get; set; } = 6;

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Valid"; // "Valid" | "Warning" | "Invalid_Expired"

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("renewalRecommended")]
        public bool RenewalRecommended { get; set; }
    }

    public class VisaHubDataDto
    {
        [JsonPropertyName("siteId")]
        public string SiteId { get; set; } = string.Empty;

        [JsonPropertyName("defaultNationality")]
        public string DefaultNationality { get; set; } = "India";

        [JsonPropertyName("defaultDestination")]
        public string DefaultDestination { get; set; } = "Thailand";

        [JsonPropertyName("supportedDestinations")]
        public List<string> SupportedDestinations { get; set; } = new();

        [JsonPropertyName("supportedNationalities")]
        public List<string> SupportedNationalities { get; set; } = new();

        [JsonPropertyName("visaRequirements")]
        public List<VisaRequirementDto> VisaRequirements { get; set; } = new();

        [JsonPropertyName("arrivalCards")]
        public List<DigitalArrivalCardDto> ArrivalCards { get; set; } = new();

        [JsonPropertyName("embassies")]
        public List<EmbassyConsulateDto> Embassies { get; set; } = new();
    }
}
