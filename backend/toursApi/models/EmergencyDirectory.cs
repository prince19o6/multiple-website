using System.Collections.Generic;

namespace ToursApi.Models
{
    public class EmergencyContactItem
    {
        public string Title { get; set; } = string.Empty;
        public string Number { get; set; } = string.Empty;
        public string Category { get; set; } = "general"; // police, medical, helpline, brand_ops, marine
        public string Description { get; set; } = string.Empty;
        public bool IsTollFree { get; set; } = false;
    }

    public class EmergencyHospitalItem
    {
        public string Name { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string EmergencyHours { get; set; } = "24/7 Emergency Trauma Center";
    }

    public class EmergencyPhraseItem
    {
        public string English { get; set; } = string.Empty;
        public string LocalScript { get; set; } = string.Empty;
        public string Phonetic { get; set; } = string.Empty;
        public string Category { get; set; } = "medical"; // medical, police, direction, lost
    }

    public class EmergencyDirectoryResponseDto
    {
        public bool Success { get; set; }
        public string SiteId { get; set; } = string.Empty;
        public string DestinationRegion { get; set; } = string.Empty;
        public string BrandHotline { get; set; } = string.Empty;
        public string BrandHotlineLabel { get; set; } = string.Empty;
        public List<EmergencyContactItem> EmergencyHotlines { get; set; } = new();
        public List<EmergencyHospitalItem> Hospitals { get; set; } = new();
        public List<EmergencyPhraseItem> SafetyPhrases { get; set; } = new();
    }
}
