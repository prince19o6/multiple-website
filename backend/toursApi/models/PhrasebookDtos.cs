using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models
{
    public class PhraseItemDto
    {
        [JsonPropertyName("phraseId")]
        public string PhraseId { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category { get; set; } = "Essentials"; // "Essentials", "Dietary & Food", "Shopping & Bargaining", "Transport & Directions", "Temple & Etiquette", "Emergency"

        [JsonPropertyName("englishText")]
        public string EnglishText { get; set; } = string.Empty;

        [JsonPropertyName("targetScriptText")]
        public string TargetScriptText { get; set; } = string.Empty;

        [JsonPropertyName("phoneticText")]
        public string PhoneticText { get; set; } = string.Empty;

        [JsonPropertyName("culturalContextNote")]
        public string CulturalContextNote { get; set; } = string.Empty;

        [JsonPropertyName("isDietarySafe")]
        public bool IsDietarySafe { get; set; }
    }

    public class DestinationPhrasebookDto
    {
        [JsonPropertyName("siteId")]
        public string SiteId { get; set; } = string.Empty;

        [JsonPropertyName("languageName")]
        public string LanguageName { get; set; } = string.Empty;

        [JsonPropertyName("nativeLanguageName")]
        public string NativeLanguageName { get; set; } = string.Empty;

        [JsonPropertyName("regionDescription")]
        public string RegionDescription { get; set; } = string.Empty;

        [JsonPropertyName("totalPhrases")]
        public int TotalPhrases { get; set; }

        [JsonPropertyName("categories")]
        public List<string> Categories { get; set; } = new();

        [JsonPropertyName("bargainingTip")]
        public string BargainingTip { get; set; } = string.Empty;

        [JsonPropertyName("etiquetteTip")]
        public string EtiquetteTip { get; set; } = string.Empty;

        [JsonPropertyName("phrases")]
        public List<PhraseItemDto> Phrases { get; set; } = new();
    }
}
