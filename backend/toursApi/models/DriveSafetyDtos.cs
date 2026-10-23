using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models
{
    public class RoadRuleItemDto
    {
        [JsonPropertyName("ruleKey")]
        public string RuleKey { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("value")]
        public string Value { get; set; } = string.Empty;

        [JsonPropertyName("icon")]
        public string Icon { get; set; } = "car-outline";

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("penaltyWarning")]
        public string PenaltyWarning { get; set; } = string.Empty;

        [JsonPropertyName("isHighRisk")]
        public bool IsHighRisk { get; set; } = false;
    }

    public class RentalScamTipDto
    {
        [JsonPropertyName("tipKey")]
        public string TipKey { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("severity")]
        public string Severity { get; set; } = "CRITICAL"; // CRITICAL, WARNING, ADVISORY

        [JsonPropertyName("icon")]
        public string Icon { get; set; } = "alert-circle-outline";

        [JsonPropertyName("actionRequired")]
        public string ActionRequired { get; set; } = string.Empty;

        [JsonPropertyName("scamExplanation")]
        public string ScamExplanation { get; set; } = string.Empty;
    }

    public class PreRideChecklistStepDto
    {
        [JsonPropertyName("stepId")]
        public string StepId { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("detail")]
        public string Detail { get; set; } = string.Empty;

        [JsonPropertyName("icon")]
        public string Icon { get; set; } = "checkmark-circle-outline";

        [JsonPropertyName("requiresPhoto")]
        public bool RequiresPhoto { get; set; } = true;
    }

    public class DriveSafetyHubDataDto
    {
        [JsonPropertyName("siteId")]
        public string SiteId { get; set; } = string.Empty;

        [JsonPropertyName("country")]
        public string Country { get; set; } = "Thailand";

        [JsonPropertyName("drivingSide")]
        public string DrivingSide { get; set; } = "LEFT (Drive on the Left Side)";

        [JsonPropertyName("idpRequirementSummary")]
        public string IdpRequirementSummary { get; set; } = string.Empty;

        [JsonPropertyName("speedLimitCity")]
        public string SpeedLimitCity { get; set; } = "50 - 60 km/h";

        [JsonPropertyName("speedLimitHighway")]
        public string SpeedLimitHighway { get; set; } = "90 - 120 km/h";

        [JsonPropertyName("bloodAlcoholLimit")]
        public string BloodAlcoholLimit { get; set; } = "0.02% (Strict Zero for Under 20/Probationary)";

        [JsonPropertyName("helmetLaw")]
        public string HelmetLaw { get; set; } = "MANDATORY for driver AND passenger. Visor recommended.";

        [JsonPropertyName("roadsideAssistanceNumber")]
        public string RoadsideAssistanceNumber { get; set; } = "1155";

        [JsonPropertyName("highwayPoliceNumber")]
        public string HighwayPoliceNumber { get; set; } = "1193";

        [JsonPropertyName("roadRules")]
        public List<RoadRuleItemDto> RoadRules { get; set; } = new();

        [JsonPropertyName("scamWarnings")]
        public List<RentalScamTipDto> ScamWarnings { get; set; } = new();

        [JsonPropertyName("preRideChecklist")]
        public List<PreRideChecklistStepDto> PreRideChecklist { get; set; } = new();
    }
}
