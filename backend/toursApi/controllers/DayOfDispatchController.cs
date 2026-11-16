using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;
using ToursApi.Services;

namespace ToursApi.Controllers
{
    [ApiController]
    [Route("api/dispatch")]
    public class DayOfDispatchController : ControllerBase
    {
        private readonly IWebsiteContext _websiteContext;
        private readonly IMongoDatabaseProvider _databaseProvider;

        public DayOfDispatchController(
            IWebsiteContext websiteContext,
            IMongoDatabaseProvider databaseProvider)
        {
            _websiteContext = websiteContext;
            _databaseProvider = databaseProvider;
        }

        [HttpGet("today")]
        public IActionResult GetTodayDispatch([FromQuery] string? tourId, [FromQuery] string? bookingRef)
        {
            var siteId = _websiteContext.CurrentWebsiteId?.ToLowerInvariant() ?? "gujjutours";
            var dispatch = BuildBrandDispatch(siteId, tourId, bookingRef);

            return Ok(new
            {
                success = true,
                siteId,
                data = dispatch
            });
        }

        [HttpPost("announcement")]
        public async Task<IActionResult> CreateAnnouncement([FromBody] CreateAnnouncementRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Message))
            {
                return BadRequest(new
                {
                    success = false,
                    error = "Title and message are required for guide broadcast."
                });
            }

            var siteId = _websiteContext.CurrentWebsiteId?.ToLowerInvariant() ?? "gujjutours";
            var item = new GuideAnnouncement
            {
                WebsiteId = siteId,
                TourId = dto.TourId,
                Title = dto.Title.Trim(),
                Message = dto.Message.Trim(),
                Priority = string.IsNullOrWhiteSpace(dto.Priority) ? "Normal" : dto.Priority,
                SentBy = string.IsNullOrWhiteSpace(dto.SentBy) ? "Lead Tour Director" : dto.SentBy,
                CreatedAt = DateTime.UtcNow
            };

            try
            {
                using var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(2));
                var db = _databaseProvider.GetDatabase(_websiteContext.DatabaseName);
                var collection = db.GetCollection<GuideAnnouncement>("guide_announcements");
                await collection.InsertOneAsync(item, cancellationToken: cts.Token);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DayOfDispatchController] Non-fatal Mongo log failure: {ex.Message}");
            }

            return Ok(new
            {
                success = true,
                data = new GuideAnnouncementDto
                {
                    Id = Guid.NewGuid().ToString("N")[..8],
                    Title = item.Title,
                    Message = item.Message,
                    Priority = item.Priority,
                    SentBy = item.SentBy,
                    Timestamp = "Just now"
                }
            });
        }

        private DayOfDispatchDto BuildBrandDispatch(string siteId, string? tourId, string? bookingRef)
        {
            return siteId switch
            {
                "technoheaven" => BuildTechnoheavenDispatch(bookingRef),
                "tripgoasia" => BuildTripGoAsiaDispatch(bookingRef),
                _ => BuildGujjuToursDispatch(bookingRef)
            };
        }

        private DayOfDispatchDto BuildGujjuToursDispatch(string? bookingRef)
        {
            return new DayOfDispatchDto
            {
                SiteId = "gujjutours",
                TourId = "1",
                TourName = "Dwarkadhish Temple, Gomti Ghat & Bet Dwarka Sacred Odyssey",
                BookingReference = string.IsNullOrWhiteSpace(bookingRef) ? "GUJ-DWK-98421" : bookingRef,
                Destination = "Dwarka Holy Sanctum & Saurashtra Coast",
                Date = DateTime.UtcNow.ToString("dddd, dd MMM yyyy"),
                CurrentStatusSummary = "Stop 2 of 4 • Gomti Ghat Sangam Rituals & Holy Boat Ride",
                OverallProgressPercent = 45,
                EmergencyHotline = "+91 98250 12345 (24/7 Dwarka Tour Emergency Desk)",
                ConciergeDesk = "+91 2892 234418 (GujjuTours VIP Support)",
                AssignedCrew = new AssignedCrewDto
                {
                    LeadGuideName = "Jayeshbhai Trivedi",
                    GuidePhone = "+91 98251 33441",
                    GuideAvatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
                    GuideRating = 4.9,
                    DriverName = "Govindbhai Ahir",
                    DriverPhone = "+91 94280 77123",
                    VehicleModel = "Toyota Innova Crysta (Dual AC)",
                    VehiclePlateNumber = "GJ-10-DF-5812",
                    VehicleColor = "Pearl White",
                    LuggageCapacity = "4 Large Suitcases + 3 Handbags",
                    PickupLocation = "Dwarka Beach Resort Main Porch",
                    PickupTime = "07:30 AM",
                    DriverStatus = "Vehicle Sanitized & Waiting at Hotel Porch"
                },
                Stops = new List<ExpeditionStopProgressDto>
                {
                    new ExpeditionStopProgressDto
                    {
                        StopId = "dwk-stop-1",
                        OrderIndex = 1,
                        StopName = "Dwarkadhish Jagat Mandir Morning Darshan",
                        ScheduledTime = "08:00 AM - 09:45 AM",
                        EstimatedDuration = "1h 45m",
                        Status = "Completed",
                        Description = "Attend the sacred Mangla & Shringaar Aarti of Lord Krishna at the 2,200-year-old spire, offer holy tulsi garlands, and receive consecrated Dwarka Pedas.",
                        MeetingPointName = "North Moksha Dwaar Gate Pillar #3",
                        MeetingPointNotes = "Guide Jayeshbhai held footwear token bag #12. All devotees successfully attended Aarti.",
                        Latitude = 22.2376,
                        Longitude = 68.9678,
                        AudioStoryId = "story-dwarka-1",
                        AudioStoryTitle = "Spire of Moksha: The Architectural Marvel of Dwarkadhish",
                        CulinaryTip = "Accept fresh Makhan Mishri prasadam at the Sabha Mandap exit.",
                        DressCodeReminder = "Traditional attire required (Dhoti/Kurta for gents, Saree/Salwar for ladies). Footwear deposited."
                    },
                    new ExpeditionStopProgressDto
                    {
                        StopId = "dwk-stop-2",
                        OrderIndex = 2,
                        StopName = "Gomti Ghat Sangam Rituals & Holy Boat Ride",
                        ScheduledTime = "10:00 AM - 11:30 AM",
                        EstimatedDuration = "1h 30m",
                        Status = "Current",
                        Description = "Scenic wooden boat cruise along the confluence of sacred Gomti River and the Arabian Sea, visiting Chakra Tirtha and Panchnad Tirth wells.",
                        MeetingPointName = "Chakra Tirtha Ghat Chhatri Pier",
                        MeetingPointNotes = "Life vests distributed. Guide Jayeshbhai is guiding the group across the Gomti suspension bridge.",
                        Latitude = 22.2361,
                        Longitude = 68.9664,
                        AudioStoryId = "story-dwarka-2",
                        AudioStoryTitle = "Secrets of Submerged Golden Dwarka & Marine Archaeology",
                        CulinaryTip = "Fresh coconut water and nylon khaman available near Gomti promenade.",
                        DressCodeReminder = "Light breezy cottons suitable for riverside walking."
                    },
                    new ExpeditionStopProgressDto
                    {
                        StopId = "dwk-stop-3",
                        OrderIndex = 3,
                        StopName = "Okha Port to Bet Dwarka Ferry & Shankhodhar Island",
                        ScheduledTime = "12:15 PM - 02:45 PM",
                        EstimatedDuration = "2h 30m",
                        Status = "Upcoming",
                        Description = "Chauffeur transfer along Okha highway followed by private chartered ferry to Bet Dwarka island, the legendary island residence of Lord Krishna.",
                        MeetingPointName = "Okha Jetty Terminal Gate #2",
                        MeetingPointNotes = "Ferry boarding tickets and life jackets provided by GujjuTours crew.",
                        Latitude = 22.4632,
                        Longitude = 69.0711,
                        AudioStoryId = "story-betdwarka",
                        AudioStoryTitle = "Legend of Sudama: Golden Friendship on Shankhodhar Island",
                        CulinaryTip = "Kathiyawadi Thali buffet arranged at Toran Bet Dwarka Hall.",
                        DressCodeReminder = "Sunhat, sunglasses, and comfortable non-slip walking shoes for ferry boarding."
                    },
                    new ExpeditionStopProgressDto
                    {
                        StopId = "dwk-stop-4",
                        OrderIndex = 4,
                        StopName = "Rukmini Devi Mandir & Traditional Bhojanalaya Feast",
                        ScheduledTime = "03:45 PM - 05:30 PM",
                        EstimatedDuration = "1h 45m",
                        Status = "Upcoming",
                        Description = "Visit the exquisitely carved 12th-century standalone shrine of Goddess Rukmini, followed by an unlimited royal Kathiyawadi feast with freshly churned white butter.",
                        MeetingPointName = "Rukmini Temple Courtyard Banyan Tree",
                        MeetingPointNotes = "Dedicated pure vegetarian & Jain kitchen arrangements confirmed.",
                        Latitude = 22.2533,
                        Longitude = 68.9812,
                        AudioStoryId = "story-rukmini",
                        AudioStoryTitle = "The Curse of Sage Durvasa & Rukmini's Sacred Water Penance",
                        CulinaryTip = "Sev Tameta, Bajra Rotla with pure white makhan, and sweet Shrikhand.",
                        DressCodeReminder = "Modest temple dress code."
                    }
                },
                Announcements = new List<GuideAnnouncementDto>
                {
                    new GuideAnnouncementDto
                    {
                        Id = "ann-1",
                        Title = "Aarti Concluded • Moving to Gomti Ghat",
                        Message = "Jay Dwarkadhish! Morning darshan completed smoothly. Please gather by Chakra Tirtha chhatri with Guide Jayeshbhai.",
                        Timestamp = "10:05 AM",
                        Priority = "Normal",
                        SentBy = "Jayeshbhai Trivedi (Lead Guide)"
                    },
                    new GuideAnnouncementDto
                    {
                        Id = "ann-2",
                        Title = "Ferry Timing Update for Bet Dwarka",
                        Message = "Our private shuttle boat at Okha Port is scheduled for 12:45 PM departure. Please keep sea hats and sunglasses handy.",
                        Timestamp = "09:30 AM",
                        Priority = "Important",
                        SentBy = "GujjuTours Operations Desk"
                    }
                }
            };
        }

        private DayOfDispatchDto BuildTripGoAsiaDispatch(string? bookingRef)
        {
            return new DayOfDispatchDto
            {
                SiteId = "tripgoasia",
                TourId = "2",
                TourName = "Phi Phi Islands, Maya Bay & Pileh Lagoon VIP Speedboat Expedition",
                BookingReference = string.IsNullOrWhiteSpace(bookingRef) ? "TGA-BKK-88120" : bookingRef,
                Destination = "Andaman Archipelago & Maya Bay",
                Date = DateTime.UtcNow.ToString("dddd, dd MMM yyyy"),
                CurrentStatusSummary = "Stop 2 of 5 • Maya Bay The Beach Eco-Reserve Exploration",
                OverallProgressPercent = 40,
                EmergencyHotline = "+66 81 772 9988 (24/7 Marine Safety & Rescue Desk)",
                ConciergeDesk = "+66 2 770 9988 (TripGoAsia Bangkok Support)",
                AssignedCrew = new AssignedCrewDto
                {
                    LeadGuideName = "Somchai Prasert",
                    GuidePhone = "+66 81 892 4432",
                    GuideAvatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
                    GuideRating = 4.95,
                    DriverName = "Captain Boonmee",
                    DriverPhone = "+66 89 221 4455",
                    VehicleModel = "Twin-Engine Catamaran Speedboat (Andaman Wave 07)",
                    VehiclePlateNumber = "TH-ANDAMAN-07",
                    VehicleColor = "Cobalt Blue & White",
                    LuggageCapacity = "Waterproof Dry Bags + Snorkel Gear",
                    PickupLocation = "Patong Beach Resort Main Porch",
                    PickupTime = "07:15 AM",
                    DriverStatus = "Boat Moored at Maya Bay Floating Pontoon"
                },
                Stops = new List<ExpeditionStopProgressDto>
                {
                    new ExpeditionStopProgressDto
                    {
                        StopId = "tga-stop-1",
                        OrderIndex = 1,
                        StopName = "Royal Phuket Marina VIP Lounge & Briefing",
                        ScheduledTime = "08:00 AM - 08:45 AM",
                        EstimatedDuration = "45m",
                        Status = "Completed",
                        Description = "Complimentary espresso, fresh tropical fruit pastries, and marine safety briefing with snorkel gear fitting.",
                        MeetingPointName = "Marina Pier 3 VIP Boarding Gate",
                        MeetingPointNotes = "All passengers checked in and motion sickness tablets distributed.",
                        Latitude = 7.9542,
                        Longitude = 98.3965,
                        AudioStoryId = "story-phuket-1",
                        AudioStoryTitle = "Gateway of the Andaman: Sino-Portuguese Sea Routes",
                        CulinaryTip = "Fresh lemongrass iced tea and banana roti pancakes.",
                        DressCodeReminder = "Swimwear underneath casual clothes, beach slippers."
                    },
                    new ExpeditionStopProgressDto
                    {
                        StopId = "tga-stop-2",
                        OrderIndex = 2,
                        StopName = "Maya Bay The Beach Eco-Reserve Boardwalk",
                        ScheduledTime = "09:45 AM - 11:30 AM",
                        EstimatedDuration = "1h 45m",
                        Status = "Current",
                        Description = "Walk the pristine wooden boardwalk of the world-famous Maya Bay, observing baby blacktip reef sharks in their natural nursery lagoon.",
                        MeetingPointName = "National Park Ranger Station Pavilion",
                        MeetingPointNotes = "Guide Somchai is stationed at the lagoon photo point.",
                        Latitude = 7.6872,
                        Longitude = 98.7665,
                        AudioStoryId = "story-mayabay",
                        AudioStoryTitle = "Limestone Karsts & Sea Gypsies of the Andaman",
                        CulinaryTip = "Chilled fresh coconut water provided by crew.",
                        DressCodeReminder = "No swimming in Maya Bay nursery waters (strictly enforced eco-protection zone)."
                    },
                    new ExpeditionStopProgressDto
                    {
                        StopId = "tga-stop-3",
                        OrderIndex = 3,
                        StopName = "Pileh Emerald Lagoon Longtail Cruise & Swimming",
                        ScheduledTime = "11:45 AM - 01:00 PM",
                        EstimatedDuration = "1h 15m",
                        Status = "Upcoming",
                        Description = "Cruise into the soaring 100-meter limestone amphitheater of Pileh Lagoon aboard traditional wooden longtail boats with floral garlands.",
                        MeetingPointName = "Pileh Lagoon Mooring Point",
                        MeetingPointNotes = "Private longtail photo shoot with floral bow decorations included.",
                        Latitude = 7.6961,
                        Longitude = 98.7712,
                        AudioStoryId = "story-pileh",
                        AudioStoryTitle = "The Living Waters: Bird Nest Collectors of Viking Cave",
                        CulinaryTip = "Chilled tropical watermelon slices on board.",
                        DressCodeReminder = "Ready for emerald lagoon cliff swimming."
                    },
                    new ExpeditionStopProgressDto
                    {
                        StopId = "tga-stop-4",
                        OrderIndex = 4,
                        StopName = "Tonsai Bay Coastal Halal Seafood Buffet",
                        ScheduledTime = "01:15 PM - 02:30 PM",
                        EstimatedDuration = "1h 15m",
                        Status = "Upcoming",
                        Description = "Private seaside pavilion lunch overlooking Tonsai cliffs, featuring fresh grilled Andaman prawns, Pad Thai Boran, and sweet mango sticky rice.",
                        MeetingPointName = "Phi Phi Cliff Beach Club Pavilion",
                        MeetingPointNotes = "Certified Halal & vegetarian dining tables reserved.",
                        Latitude = 7.7381,
                        Longitude = 98.7709,
                        AudioStoryId = "story-tonsai",
                        AudioStoryTitle = "Tides & Trade: The Rise of Koh Phi Phi Don",
                        CulinaryTip = "Must-try authentic spicy Tom Yum Goong and sweet mango sticky rice.",
                        DressCodeReminder = "Casual resort wear."
                    }
                },
                Announcements = new List<GuideAnnouncementDto>
                {
                    new GuideAnnouncementDto
                    {
                        Id = "ann-tga-1",
                        Title = "Maya Bay Eco-Notice",
                        Message = "Sawadee khrap! Welcome to Maya Bay. Please remain on the wooden boardwalk and do not step into the lagoon waters.",
                        Timestamp = "09:50 AM",
                        Priority = "Important",
                        SentBy = "Somchai Prasert (Lead Guide)"
                    }
                }
            };
        }

        private DayOfDispatchDto BuildTechnoheavenDispatch(string? bookingRef)
        {
            return new DayOfDispatchDto
            {
                SiteId = "technoheaven",
                TourId = "3",
                TourName = "Dubai Ultimate Desert Safari, Dune Bashing & Starlit Bedouin Camp",
                BookingReference = string.IsNullOrWhiteSpace(bookingRef) ? "DXB-SAF-55410" : bookingRef,
                Destination = "Lahbab High Red Dunes & Al Khayma Oasis",
                Date = DateTime.UtcNow.ToString("dddd, dd MMM yyyy"),
                CurrentStatusSummary = "Stop 2 of 4 • Thrilling 4x4 Dune Bashing & Sandboarding on Big Red",
                OverallProgressPercent = 50,
                EmergencyHotline = "+971 4 388 9900 (24/7 Dubai Tourism & Dispatch Center)",
                ConciergeDesk = "+971 4 888 3828 (Technoheaven VIP Desk)",
                AssignedCrew = new AssignedCrewDto
                {
                    LeadGuideName = "Tariq Al-Hashimi",
                    GuidePhone = "+971 50 782 1199",
                    GuideAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
                    GuideRating = 4.98,
                    DriverName = "Marshal Tariq",
                    DriverPhone = "+971 50 782 1199",
                    VehicleModel = "Toyota Land Cruiser 4x4 V8 (Roll Cage & GPS)",
                    VehiclePlateNumber = "DXB-V-9941",
                    VehicleColor = "Champagne Gold",
                    LuggageCapacity = "6 Passenger Comfort + Chilled Refreshments",
                    PickupLocation = "Address Downtown Dubai Hotel Valet",
                    PickupTime = "03:00 PM",
                    DriverStatus = "Active on Lahbab Red Sand Dune #4"
                },
                Stops = new List<ExpeditionStopProgressDto>
                {
                    new ExpeditionStopProgressDto
                    {
                        StopId = "dxb-stop-1",
                        OrderIndex = 1,
                        StopName = "Lahbab Dune Air Release Point & Falcon Encounter",
                        ScheduledTime = "04:00 PM - 04:30 PM",
                        EstimatedDuration = "30m",
                        Status = "Completed",
                        Description = "Vehicle preparation for high-dune navigation, introduction to royal hunting falcons, and traditional Arabic coffee greeting.",
                        MeetingPointName = "Lahbab Desert Gateway Camp",
                        MeetingPointNotes = "Tire pressure deflated to 14 PSI for optimum sand grip.",
                        Latitude = 25.0412,
                        Longitude = 55.6124,
                        AudioStoryId = "story-desert-1",
                        AudioStoryTitle = "Bedouin Navigation & The Legend of the Arabian Falcon",
                        CulinaryTip = "Fresh Arabian Gahwa with plump Medjool dates.",
                        DressCodeReminder = "Breathable linen shirt, sunglasses, and closed-toe footwear for sand."
                    },
                    new ExpeditionStopProgressDto
                    {
                        StopId = "dxb-stop-2",
                        OrderIndex = 2,
                        StopName = "Thrilling 4x4 Dune Bashing & Sandboarding on Big Red",
                        ScheduledTime = "04:35 PM - 05:45 PM",
                        EstimatedDuration = "1h 10m",
                        Status = "Current",
                        Description = "Adrenaline-fueled roller-coaster maneuvers over 300-foot crimson dunes, followed by sunset sandboarding down steep golden ridges.",
                        MeetingPointName = "Big Red Dune Summit Panorama Point",
                        MeetingPointNotes = "Golden hour sunset photos underway. Sandboards waxed and ready.",
                        Latitude = 25.0215,
                        Longitude = 55.6321,
                        AudioStoryId = "story-bigred",
                        AudioStoryTitle = "Empty Quarter Whispers: The Geology of Crimson Sands",
                        CulinaryTip = "Chilled electrolyte water and sparkling fruit beverages.",
                        DressCodeReminder = "Secure all mobile phones and camera straps before boarding."
                    },
                    new ExpeditionStopProgressDto
                    {
                        StopId = "dxb-stop-3",
                        OrderIndex = 3,
                        StopName = "Al Khayma Heritage Bedouin Camp Reception",
                        ScheduledTime = "06:15 PM - 07:30 PM",
                        EstimatedDuration = "1h 15m",
                        Status = "Upcoming",
                        Description = "Camel caravan ride, Henna tattooing, traditional Kandura & Abaya photo sessions, and live wood-fire bread making.",
                        MeetingPointName = "Al Khayma Royal Majlis Entrance Gate",
                        MeetingPointNotes = "Reserved VIP carpets #4 & #5 under the Bedouin canopy.",
                        Latitude = 24.9812,
                        Longitude = 55.5921,
                        AudioStoryId = "story-bedouin",
                        AudioStoryTitle = "Hospitality of the Desert: The Code of the Bedouin Majlis",
                        CulinaryTip = "Piping hot Luqaimat with date molasses and freshly baked Khameer bread.",
                        DressCodeReminder = "Light jacket or pashmina shawl recommended as desert temperatures cool after sunset."
                    },
                    new ExpeditionStopProgressDto
                    {
                        StopId = "dxb-stop-4",
                        OrderIndex = 4,
                        StopName = "5-Star Royal BBQ Banquet & Fire / Tanoura Show",
                        ScheduledTime = "07:30 PM - 09:30 PM",
                        EstimatedDuration = "2h 00m",
                        Status = "Upcoming",
                        Description = "Sumptuous 100% Halal barbecue feast featuring slow-braised Al Machboos lamb, charcoal shish tawook, live spinning Tanoura, and mesmerizing fire show.",
                        MeetingPointName = "Main Starlit Amphitheater Stage",
                        MeetingPointNotes = "Stargazing session with high-powered telescope concludes the evening.",
                        Latitude = 24.9820,
                        Longitude = 55.5930,
                        AudioStoryId = "story-tanoura",
                        AudioStoryTitle = "Sufi Cosmos: The Sacred Geometry of the Tanoura Dance",
                        CulinaryTip = "Al Machboos Laham, Hummus with hot pita, and sweet Kunafa Nabulsiya.",
                        DressCodeReminder = "Smart casual."
                    }
                },
                Announcements = new List<GuideAnnouncementDto>
                {
                    new GuideAnnouncementDto
                    {
                        Id = "ann-dxb-1",
                        Title = "Sunset Photo Stop on Big Red",
                        Message = "Marhaba! We have reached the summit of Big Red. Golden hour light is ideal for photography. Sandboards are ready on the north slope.",
                        Timestamp = "05:15 PM",
                        Priority = "Important",
                        SentBy = "Marshal Tariq (Desert Commander)"
                    }
                }
            };
        }
    }
}
