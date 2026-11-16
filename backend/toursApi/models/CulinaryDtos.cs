using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models
{
    public class DishRecommendationDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("localName")]
        public string LocalName { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category { get; set; } = string.Empty; // "Traditional Thali", "Street Delicacy", "Royal Banquet", "Dessert", "Beverage"

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("imageUrl")]
        public string ImageUrl { get; set; } = string.Empty;

        [JsonPropertyName("dietaryBadges")]
        public List<string> DietaryBadges { get; set; } = new(); // "100% Pure Veg", "Jain Friendly", "Halal Certified", "Vegan", "Gluten-Free", "Nut-Free"

        [JsonPropertyName("spiceLevel")]
        public int SpiceLevel { get; set; } = 1; // 1 to 5 chilies

        [JsonPropertyName("estimatedPrice")]
        public string EstimatedPrice { get; set; } = string.Empty;

        [JsonPropertyName("culturalStory")]
        public string CulturalStory { get; set; } = string.Empty;

        [JsonPropertyName("bestNeighborhoodToTry")]
        public string BestNeighborhoodToTry { get; set; } = string.Empty;

        [JsonPropertyName("signaturePairing")]
        public string SignaturePairing { get; set; } = string.Empty;
    }

    public class DiningSpotDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("cuisineType")]
        public string CuisineType { get; set; } = string.Empty;

        [JsonPropertyName("destinationId")]
        public string DestinationId { get; set; } = string.Empty;

        [JsonPropertyName("destinationName")]
        public string DestinationName { get; set; } = string.Empty;

        [JsonPropertyName("rating")]
        public double Rating { get; set; } = 4.8;

        [JsonPropertyName("reviewCount")]
        public int ReviewCount { get; set; } = 150;

        [JsonPropertyName("priceTier")]
        public string PriceTier { get; set; } = "$$"; // $, $$, $$$, $$$$

        [JsonPropertyName("averageCostForTwo")]
        public string AverageCostForTwo { get; set; } = string.Empty;

        [JsonPropertyName("dietaryCertifications")]
        public List<string> DietaryCertifications { get; set; } = new();

        [JsonPropertyName("signatureDishes")]
        public List<string> SignatureDishes { get; set; } = new();

        [JsonPropertyName("address")]
        public string Address { get; set; } = string.Empty;

        [JsonPropertyName("latitude")]
        public double Latitude { get; set; }

        [JsonPropertyName("longitude")]
        public double Longitude { get; set; }

        [JsonPropertyName("openingHours")]
        public string OpeningHours { get; set; } = string.Empty;

        [JsonPropertyName("phoneNumber")]
        public string PhoneNumber { get; set; } = string.Empty;

        [JsonPropertyName("dressCode")]
        public string DressCode { get; set; } = "Casual"; // Casual, Smart Casual, Formal

        [JsonPropertyName("requiresReservation")]
        public bool RequiresReservation { get; set; } = false;

        [JsonPropertyName("atmosphere")]
        public string Atmosphere { get; set; } = string.Empty; // "Family Bhojanalaya", "Heritage Courtyard", "Sunset Waterfront", "Skyline Luxury"
    }

    public class FoodEtiquetteDto
    {
        [JsonPropertyName("dos")]
        public List<string> Dos { get; set; } = new();

        [JsonPropertyName("donts")]
        public List<string> Donts { get; set; } = new();

        [JsonPropertyName("waterSafetyGuide")]
        public string WaterSafetyGuide { get; set; } = string.Empty;

        [JsonPropertyName("streetFoodHygieneTips")]
        public List<string> StreetFoodHygieneTips { get; set; } = new();

        [JsonPropertyName("tippingGuidelines")]
        public string TippingGuidelines { get; set; } = string.Empty;
    }

    public class CulinaryTrailDto
    {
        [JsonPropertyName("destinationId")]
        public string DestinationId { get; set; } = string.Empty;

        [JsonPropertyName("destinationName")]
        public string DestinationName { get; set; } = string.Empty;

        [JsonPropertyName("tagline")]
        public string Tagline { get; set; } = string.Empty;

        [JsonPropertyName("overview")]
        public string Overview { get; set; } = string.Empty;

        [JsonPropertyName("heroImageUrl")]
        public string HeroImageUrl { get; set; } = string.Empty;

        [JsonPropertyName("dishes")]
        public List<DishRecommendationDto> Dishes { get; set; } = new();

        [JsonPropertyName("diningSpots")]
        public List<DiningSpotDto> DiningSpots { get; set; } = new();

        [JsonPropertyName("etiquette")]
        public FoodEtiquetteDto Etiquette { get; set; } = new();
    }

    public class DiningReservationRequestDto
    {
        [JsonPropertyName("guestName")]
        public string GuestName { get; set; } = string.Empty;

        [JsonPropertyName("phoneNumber")]
        public string PhoneNumber { get; set; } = string.Empty;

        [JsonPropertyName("email")]
        public string? Email { get; set; }

        [JsonPropertyName("diningSpotId")]
        public string DiningSpotId { get; set; } = string.Empty;

        [JsonPropertyName("diningSpotName")]
        public string DiningSpotName { get; set; } = string.Empty;

        [JsonPropertyName("destinationId")]
        public string DestinationId { get; set; } = string.Empty;

        [JsonPropertyName("partySize")]
        public int PartySize { get; set; } = 2;

        [JsonPropertyName("reservationDate")]
        public string ReservationDate { get; set; } = string.Empty; // "2026-10-25"

        [JsonPropertyName("timeSlot")]
        public string TimeSlot { get; set; } = string.Empty; // "19:30" or "Dinner (19:00 - 20:30)"

        [JsonPropertyName("dietaryRequests")]
        public List<string> DietaryRequests { get; set; } = new(); // ["Jain (No Root Veg)", "Nut Allergy"]

        [JsonPropertyName("specialNotes")]
        public string? SpecialNotes { get; set; }
    }

    public class DiningReservationResultDto
    {
        [JsonPropertyName("reservationReference")]
        public string ReservationReference { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Confirmed";

        [JsonPropertyName("estimatedResponseTime")]
        public string EstimatedResponseTime { get; set; } = "Instant Confirmation";

        [JsonPropertyName("confirmationMessage")]
        public string ConfirmationMessage { get; set; } = string.Empty;

        [JsonPropertyName("conciergeContact")]
        public string ConciergeContact { get; set; } = string.Empty;

        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
