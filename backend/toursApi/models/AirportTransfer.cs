using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ToursApi.Models
{
    public class AirportTransfer
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("transferId")]
        public string TransferId { get; set; } = string.Empty;

        [BsonElement("websiteId")]
        public string WebsiteId { get; set; } = string.Empty;

        [BsonElement("bookingReference")]
        public string BookingReference { get; set; } = string.Empty;

        [BsonElement("guestName")]
        public string GuestName { get; set; } = string.Empty;

        [BsonElement("flight")]
        public FlightDetailsDto Flight { get; set; } = new();

        [BsonElement("arrivalAirportName")]
        public string ArrivalAirportName { get; set; } = string.Empty;

        [BsonElement("pickupMeetingPoint")]
        public string PickupMeetingPoint { get; set; } = string.Empty;

        [BsonElement("digitalPagingBoardText")]
        public string DigitalPagingBoardText { get; set; } = string.Empty;

        [BsonElement("chauffeurName")]
        public string ChauffeurName { get; set; } = string.Empty;

        [BsonElement("chauffeurPhone")]
        public string ChauffeurPhone { get; set; } = string.Empty;

        [BsonElement("chauffeurAvatar")]
        public string ChauffeurAvatar { get; set; } = string.Empty;

        [BsonElement("chauffeurRating")]
        public double ChauffeurRating { get; set; } = 4.9;

        [BsonElement("vehicleModel")]
        public string VehicleModel { get; set; } = string.Empty;

        [BsonElement("vehiclePlateNumber")]
        public string VehiclePlateNumber { get; set; } = string.Empty;

        [BsonElement("vehicleType")]
        public string VehicleType { get; set; } = "Private Premium";

        [BsonElement("transferStatus")]
        public string TransferStatus { get; set; } = "Chauffeur Waiting at Gate";

        [BsonElement("waitingBay")]
        public string WaitingBay { get; set; } = string.Empty;

        [BsonElement("amenities")]
        public List<TerminalAmenityDto> Amenities { get; set; } = new();

        [BsonElement("emergencyTransferHotline")]
        public string EmergencyTransferHotline { get; set; } = string.Empty;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
