using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using ToursApi.Models;
using ToursApi.Services;

namespace ToursApi.Controllers
{
    [ApiController]
    [Route("api/transfers")]
    public class FlightTransferController : ControllerBase
    {
        private readonly IWebsiteContext _websiteContext;
        private readonly IMongoDatabaseProvider _databaseProvider;

        public FlightTransferController(IWebsiteContext websiteContext, IMongoDatabaseProvider databaseProvider)
        {
            _websiteContext = websiteContext;
            _databaseProvider = databaseProvider;
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveTransfer([FromQuery] string? bookingRef)
        {
            var siteId = _websiteContext.CurrentWebsiteId?.ToLowerInvariant() ?? "gujjutours";

            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(2));
                var db = _databaseProvider.GetDatabase(_websiteContext.DatabaseName);
                var collection = db.GetCollection<AirportTransfer>("airport_transfers");

                var filter = Builders<AirportTransfer>.Filter.Eq(t => t.WebsiteId, siteId);
                if (!string.IsNullOrWhiteSpace(bookingRef))
                {
                    filter = Builders<AirportTransfer>.Filter.And(
                        filter,
                        Builders<AirportTransfer>.Filter.Eq(t => t.BookingReference, bookingRef.Trim().ToUpper())
                    );
                }

                var existing = await collection.Find(filter).FirstOrDefaultAsync(cts.Token);
                if (existing != null)
                {
                    var dto = MapToDto(existing);
                    return Ok(new
                    {
                        success = true,
                        siteId,
                        data = dto
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[FlightTransferController] Non-fatal Mongo fetch exception: {ex.Message}");
            }

            var seed = GetSeedTransfer(siteId);
            return Ok(new
            {
                success = true,
                siteId,
                data = seed
            });
        }

        [HttpPost("status")]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateChauffeurStatusDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Status))
            {
                return BadRequest(new
                {
                    success = false,
                    error = "Status is required."
                });
            }

            var siteId = _websiteContext.CurrentWebsiteId?.ToLowerInvariant() ?? "gujjutours";

            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(2));
                var db = _databaseProvider.GetDatabase(_websiteContext.DatabaseName);
                var collection = db.GetCollection<AirportTransfer>("airport_transfers");

                var filter = Builders<AirportTransfer>.Filter.Eq(t => t.WebsiteId, siteId);
                var update = Builders<AirportTransfer>.Update
                    .Set(t => t.TransferStatus, dto.Status.Trim())
                    .Set(t => t.UpdatedAt, DateTime.UtcNow);

                await collection.UpdateOneAsync(filter, update, new UpdateOptions { IsUpsert = true }, cts.Token);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[FlightTransferController] Non-fatal Mongo log failure: {ex.Message}");
            }

            return Ok(new
            {
                success = true,
                message = $"Transfer status updated to: {dto.Status}",
                updatedStatus = dto.Status
            });
        }

        private static AirportTransferDto MapToDto(AirportTransfer model)
        {
            return new AirportTransferDto
            {
                TransferId = model.TransferId,
                SiteId = model.WebsiteId,
                BookingReference = model.BookingReference,
                GuestName = model.GuestName,
                Flight = model.Flight,
                ArrivalAirportName = model.ArrivalAirportName,
                PickupMeetingPoint = model.PickupMeetingPoint,
                DigitalPagingBoardText = model.DigitalPagingBoardText,
                ChauffeurName = model.ChauffeurName,
                ChauffeurPhone = model.ChauffeurPhone,
                ChauffeurAvatar = model.ChauffeurAvatar,
                ChauffeurRating = model.ChauffeurRating,
                VehicleModel = model.VehicleModel,
                VehiclePlateNumber = model.VehiclePlateNumber,
                VehicleType = model.VehicleType,
                TransferStatus = model.TransferStatus,
                WaitingBay = model.WaitingBay,
                Amenities = model.Amenities,
                EmergencyTransferHotline = model.EmergencyTransferHotline
            };
        }

        private static AirportTransferDto GetSeedTransfer(string siteId)
        {
            switch (siteId)
            {
                case "tripgoasia":
                    return new AirportTransferDto
                    {
                        TransferId = "trf-tga-hkt-01",
                        SiteId = "tripgoasia",
                        BookingReference = "TGA-EXP-9102",
                        GuestName = "Alex Carter & Squad",
                        ArrivalAirportName = "Phuket International Airport (HKT)",
                        PickupMeetingPoint = "International Arrivals Exit Gate 3 - Island Escapes Paging Column",
                        DigitalPagingBoardText = "TRIPGOASIA • WELCOME ALEX CARTER & SQUAD",
                        ChauffeurName = "Somchai Thanaporn",
                        ChauffeurPhone = "+66 81 928 3401",
                        ChauffeurAvatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
                        ChauffeurRating = 4.9,
                        VehicleModel = "Toyota Commuter VIP 10-Seater Van with Chilled Towels",
                        VehiclePlateNumber = "1-KT-8842",
                        VehicleType = "VIP Island Minivan with Luggage Rack",
                        TransferStatus = "Chauffeur Waiting at Gate",
                        WaitingBay = "Tour Van Terminal Bay 6",
                        EmergencyTransferHotline = "+66 2 712 3456",
                        Flight = new FlightDetailsDto
                        {
                            FlightNumber = "TG 215",
                            Airline = "Thai Airways",
                            AirlineLogo = "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=200&q=80",
                            OriginAirportCode = "BKK",
                            OriginCity = "Bangkok (Suvarnabhumi)",
                            DestAirportCode = "HKT",
                            DestCity = "Phuket",
                            ScheduledDeparture = "11:00 AM",
                            ScheduledArrival = "12:25 PM",
                            Status = "Boarding",
                            Terminal = "Terminal 1",
                            Gate = "Gate B4",
                            BaggageCarousel = "Carousel 5",
                            Duration = "1h 25m"
                        },
                        Amenities = new List<TerminalAmenityDto>
                        {
                            new() { Name = "Tourist 5G e-SIM Kiosk (AIS & True)", Location = "Arrival Concourse, Beside Exit 2", Badge = "Instant Activation" },
                            new() { Name = "SuperRich Currency Exchange", Location = "Level 1 Arrivals", Badge = "Best Rates" },
                            new() { Name = "Coral Executive Lounge Refresh", Location = "Domestic/Intl Concourse", Badge = "VIP Fast Track" }
                        }
                    };

                case "technoheaven":
                    return new AirportTransferDto
                    {
                        TransferId = "trf-tech-dxb-01",
                        SiteId = "technoheaven",
                        BookingReference = "DXB-VIP-7700",
                        GuestName = "His Excellency Mansoor & Delegation",
                        ArrivalAirportName = "Dubai International Airport (DXB Terminal 3)",
                        PickupMeetingPoint = "Ahlan First Class Arrivals Lounge & Marhaba Fast Track Exit",
                        DigitalPagingBoardText = "VIP EXECUTIVE DELEGATION • TECHNOHEAVEN",
                        ChauffeurName = "Tariq Al-Hashemi",
                        ChauffeurPhone = "+971 50 882 1199",
                        ChauffeurAvatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
                        ChauffeurRating = 5.0,
                        VehicleModel = "Mercedes-Benz S-Class Limousine (Wi-Fi, Evian & Dates)",
                        VehiclePlateNumber = "DXB-VIP-007",
                        VehicleType = "Presidential Luxury Limousine",
                        TransferStatus = "Chauffeur Waiting at Gate",
                        WaitingBay = "VIP Valet Arrival Lane 1",
                        EmergencyTransferHotline = "+971 4 399 2200",
                        Flight = new FlightDetailsDto
                        {
                            FlightNumber = "EK 501",
                            Airline = "Emirates",
                            AirlineLogo = "https://images.unsplash.com/photo-1520437358207-323b43b50729?auto=format&fit=crop&w=200&q=80",
                            OriginAirportCode = "LHR",
                            OriginCity = "London Heathrow",
                            DestAirportCode = "DXB",
                            DestCity = "Dubai",
                            ScheduledDeparture = "07:30 AM",
                            ScheduledArrival = "05:45 PM",
                            Status = "In Flight",
                            Terminal = "Terminal 3",
                            Gate = "Gate A-12",
                            BaggageCarousel = "Carousel 18 (Priority)",
                            Duration = "7h 15m"
                        },
                        Amenities = new List<TerminalAmenityDto>
                        {
                            new() { Name = "Marhaba VIP Fast-Track Immigration", Location = "Terminal 3 Passport Control", Badge = "Priority Escort" },
                            new() { Name = "Emirates Private Chauffeur Wing", Location = "Dedicated Chauffeur Lounge", Badge = "Exclusive" },
                            new() { Name = "Dubai Duty Free Luxury Arrivals", Location = "Before Baggage Reclaim", Badge = "Tax-Free" }
                        }
                    };

                default: // gujjutours
                    return new AirportTransferDto
                    {
                        TransferId = "trf-guj-pbd-01",
                        SiteId = "gujjutours",
                        BookingReference = "GUJ-YATRA-8841",
                        GuestName = "Shah Family & Guests",
                        ArrivalAirportName = "Porbandar / Rajkot Hirasar International (HSR)",
                        PickupMeetingPoint = "Arrivals Exit Gate 1 - Dedicated GujjuTours Paging Column",
                        DigitalPagingBoardText = "WELCOME SHAH FAMILY (GUJJUTOURS)",
                        ChauffeurName = "Rameshbhai Prajapati",
                        ChauffeurPhone = "+91 98251 44021",
                        ChauffeurAvatar = "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80",
                        ChauffeurRating = 4.95,
                        VehicleModel = "Toyota Innova Crysta ZX (AC, Pure Veg Snacks & Water onboard)",
                        VehiclePlateNumber = "GJ-11-AB-4491",
                        VehicleType = "Premium AC 7-Seater Expedition Van",
                        TransferStatus = "Chauffeur Waiting at Gate",
                        WaitingBay = "Parking Bay P-2",
                        EmergencyTransferHotline = "+91 98250 82210",
                        Flight = new FlightDetailsDto
                        {
                            FlightNumber = "6E 5214",
                            Airline = "IndiGo",
                            AirlineLogo = "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=200&q=80",
                            OriginAirportCode = "BOM",
                            OriginCity = "Mumbai",
                            DestAirportCode = "PBD",
                            DestCity = "Porbandar",
                            ScheduledDeparture = "08:15 AM",
                            ScheduledArrival = "09:40 AM",
                            Status = "On Time",
                            Terminal = "T2",
                            Gate = "Gate 18B",
                            BaggageCarousel = "Carousel 2",
                            Duration = "1h 25m"
                        },
                        Amenities = new List<TerminalAmenityDto>
                        {
                            new() { Name = "Pure Veg & Jain Refreshment Kiosk", Location = "Arrival Hall, Near Exit Gate", Badge = "Jain Food" },
                            new() { Name = "Pre-Paid Taxi & Chauffeur Desk", Location = "Pillar #3 Arrivals", Badge = "Verified" },
                            new() { Name = "Senior Citizen Wheelchair Help", Location = "Terminal Help Desk", Badge = "24/7 Available" }
                        }
                    };
            }
        }
    }
}
