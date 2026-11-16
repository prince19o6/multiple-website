using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;
using ToursApi.Services;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/concierge")]
public class ConciergeController : ControllerBase
{
    private readonly IWebsiteContext _websiteContext;
    private readonly IMongoDatabaseProvider _databaseProvider;

    public ConciergeController(
        IWebsiteContext websiteContext,
        IMongoDatabaseProvider databaseProvider)
    {
        _websiteContext = websiteContext;
        _databaseProvider = databaseProvider;
    }

    /// <summary>
    /// Retrieves the active specialist profile tailored to the current brand.
    /// </summary>
    [HttpGet("specialist")]
    public IActionResult GetSpecialistProfile()
    {
        var site = _websiteContext.CurrentWebsiteId.ToLowerInvariant();
        var profile = BuildSpecialistProfile(site);
        return Ok(new { success = true, data = profile });
    }

    /// <summary>
    /// Processes a live inquiry message, provides an intelligent context-aware reply,
    /// and logs the lead into MongoDB in the tenant database.
    /// </summary>
    [HttpPost("inquire")]
    public async Task<IActionResult> SubmitInquiry([FromBody] ConciergeInquiryCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.GuestName) || string.IsNullOrWhiteSpace(dto.Message))
        {
            return BadRequest(new
            {
                success = false,
                error = "Guest name and inquiry message are required."
            });
        }

        var site = _websiteContext.CurrentWebsiteId.ToLowerInvariant();
        var profile = BuildSpecialistProfile(site);

        var (reply, followUps) = GenerateIntelligentReply(site, dto.Message, dto.TourName, profile.SpecialistName);

        var inquiry = new ConciergeInquiry
        {
            WebsiteId = _websiteContext.CurrentWebsiteId,
            TourId = dto.TourId,
            TourName = dto.TourName,
            GuestName = dto.GuestName.Trim(),
            Email = dto.Email?.Trim(),
            Phone = dto.Phone?.Trim(),
            Category = dto.Category ?? "general",
            Message = dto.Message.Trim(),
            SpecialistName = profile.SpecialistName,
            SpecialistReply = reply,
            Source = dto.Source ?? "app",
            Status = "answered",
            CreatedAt = DateTime.UtcNow
        };

        try
        {
            var db = _databaseProvider.GetDatabase(_websiteContext.DatabaseName);
            var collection = db.GetCollection<ConciergeInquiry>("concierge_inquiries");
            await collection.InsertOneAsync(inquiry);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[WARN] Could not persist concierge inquiry: {ex.Message}");
        }

        var encodedMsg = Uri.EscapeDataString($"Hi {profile.SpecialistName}, I am inquiring about {dto.TourName ?? "my upcoming journey"}.");
        var waUrl = $"https://wa.me/{profile.WhatsAppNumber.Replace("+", "").Replace(" ", "")}?text={encodedMsg}";

        return Ok(new
        {
            success = true,
            data = new ConciergeInquiryResponseDto
            {
                Success = true,
                InquiryId = inquiry.Id ?? Guid.NewGuid().ToString("N")[..8],
                SpecialistName = profile.SpecialistName,
                SpecialistRole = profile.Role,
                Reply = reply,
                SuggestedFollowUps = followUps,
                WhatsAppUrl = waUrl,
                SupportPhone = profile.SupportPhone,
                SupportEmail = profile.SupportEmail
            }
        });
    }

    private static ConciergeSpecialistProfileDto BuildSpecialistProfile(string site)
    {
        if (site == "tripgoasia" || site.Contains("tripgo"))
        {
            return new ConciergeSpecialistProfileDto
            {
                SpecialistName = "Nok Somchai",
                Role = "Southeast Asia Island & Rainforest Guide",
                Bio = "Certified marine naturalist and regional specialist for Thailand, Vietnam, Bali, and Singapore adventures.",
                AvatarUrl = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
                Languages = new List<string> { "ภาษาไทย (Thai)", "Tiếng Việt (Vietnamese)", "English" },
                WelcomeGreeting = "Sawatdee Khrap! Welcome to TripGoAsia. I'm Nok Somchai. Ready for tropical islands and jungle adventures? Ask me about visas, island speedboats, or weather conditions!",
                Status = "online",
                TypicalReplyTime = "Under 2 minutes",
                WhatsAppNumber = "+66812345678",
                SupportPhone = "+66 2 123 4567",
                SupportEmail = "adventures@tripgoasia.com",
                QuickInquiries = new List<string>
                {
                    "What are the visa on arrival rules for Thailand & Vietnam?",
                    "What is the best month for scuba diving in Phuket & Krabi?",
                    "Is the 5G Traveler eSIM ready on arrival?",
                    "Can we book a private speedboat island hopping day?"
                }
            };
        }

        if (site == "technoheaven" || site.Contains("techno"))
        {
            return new ConciergeSpecialistProfileDto
            {
                SpecialistName = "Alexandre Laurent",
                Role = "VIP Private Butler & Bespoke Expeditions Lead",
                Bio = "Member of 'Les Clefs d'Or'. Curating private aviation, luxury yacht charters, and bespoke private estates globally.",
                AvatarUrl = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
                Languages = new List<string> { "English", "Français", "العربية (Arabic)" },
                WelcomeGreeting = "Bonjour. Welcome to Technoheaven VIP Travel. I am Alexandre Laurent, at your service for private aviation charters, bespoke chauffeur limousines, and Michelin culinary reservations.",
                Status = "online",
                TypicalReplyTime = "Under 1 minute",
                WhatsAppNumber = "+971501234567",
                SupportPhone = "+971 4 321 0000",
                SupportEmail = "vip@technoheaven.com",
                QuickInquiries = new List<string>
                {
                    "Can we arrange a Mercedes Maybach VIP airport chauffeur?",
                    "Are private helicopter transfers available between cities?",
                    "Can you reserve a private Chef’s Table Michelin experience?",
                    "What is the policy for bespoke luxury itinerary alterations?"
                }
            };
        }

        // Default: GujjuTours
        return new ConciergeSpecialistProfileDto
        {
            SpecialistName = "Pradeep Bhai",
            Role = "Cultural Expeditions & Pilgrimage Specialist",
            Bio = "Specialized in cultural heritage, sacred Gujarat & North India darshans, and pure Jain culinary catering with 14+ years experience.",
            AvatarUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
            Languages = new List<string> { "ગુજરાતી (Gujarati)", "हिन्दी (Hindi)", "English" },
            WelcomeGreeting = "જય શ્રી કૃષ્ણ! Namaste! I am Pradeep Bhai, your personal GujjuTours concierge. How can I help customize your journey, arrange Pure Jain meals, or fast-track temple darshans today?",
            Status = "online",
            TypicalReplyTime = "Under 2 minutes",
            WhatsAppNumber = "+919825012345",
            SupportPhone = "+91 98250 12345",
            SupportEmail = "concierge@gujjutours.com",
            QuickInquiries = new List<string>
            {
                "Are 100% Pure Jain & Swaminarayan meals arranged?",
                "Can we get VIP Fast-Track temple entry passes?",
                "Do you provide Gujarati-speaking tour escorts?",
                "Can we customize dates for private family groups?"
            }
        };
    }

    private static (string Reply, List<string> FollowUps) GenerateIntelligentReply(
        string site,
        string userMessage,
        string? tourName,
        string specialistName)
    {
        var msg = userMessage.ToLowerInvariant();
        var tourRef = !string.IsNullOrWhiteSpace(tourName) ? $"for \"{tourName}\"" : "for your upcoming journey";

        if (site.Contains("gujju"))
        {
            if (msg.Contains("jain") || msg.Contains("veg") || msg.Contains("food") || msg.Contains("meal"))
            {
                return (
                    $"Jai Shri Krishna! Yes, absolutely. We take great pride in our 100% Pure Vegetarian, Jain, and Swaminarayan culinary provisions {tourRef}. Our tours travel with dedicated Maharaj chefs who prepare warm, onion-free and garlic-free satvik meals using pure ghee. You can also select our 'Pure Veg & Jain Gourmet Kit' directly in the booking add-ons!",
                    new List<string> { "What meal times are scheduled?", "Can we request special fasting food?", "Connect with Pradeep Bhai on WhatsApp" }
                );
            }

            if (msg.Contains("temple") || msg.Contains("darshan") || msg.Contains("pass") || msg.Contains("vip"))
            {
                return (
                    $"Pranam! With our VIP Temple Darshan Add-On {tourRef}, you will enjoy expedited fast-track entry escorted by local shrine coordinators, bypassing main public queues. Consecrated puja thalis and sacred prasadam are included for your family.",
                    new List<string> { "Which temples are covered?", "Is wheelchair assistance available?", "Add VIP pass to reservation" }
                );
            }

            if (msg.Contains("guide") || msg.Contains("escort") || msg.Contains("language") || msg.Contains("gujarati"))
            {
                return (
                    $"Ha, bilkul! Our Native Gujarati Tour Escorts travel with your group from airport arrival to departure. They assist senior travelers, bridge local language barriers, and narrate the profound historical stories of every sacred destination in fluent Gujarati and Hindi.",
                    new List<string> { "Is the escort dedicated to our family?", "Call Pradeep Bhai directly", "Confirm group escort details" }
                );
            }

            if (msg.Contains("family") || msg.Contains("group") || msg.Contains("custom") || msg.Contains("date"))
            {
                return (
                    $"Certainly! For families and private groups of 6 or more traveling {tourRef}, we provide private Innova Crysta or luxury tempo travellers with fully customized departure dates and customized daily itineraries.",
                    new List<string> { "Request private group quote", "Check custom available dates", "Chat on WhatsApp now" }
                );
            }

            return (
                $"Namaste! Thank you for inquiring {tourRef}. Our GujjuTours operations team is already reviewing your request. Pradeep Bhai and our senior counselors will assist you shortly. You can also reach us immediately on WhatsApp or our toll-free line.",
                new List<string> { "Ask about Jain meals", "Request VIP temple darshan", "Chat on WhatsApp" }
            );
        }

        if (site.Contains("tripgo"))
        {
            if (msg.Contains("visa") || msg.Contains("entry") || msg.Contains("passport"))
            {
                return (
                    $"Sawatdee Khrap! Travelers from over 93 countries are eligible for 60-day visa exemption or instant Visa on Arrival in Thailand. For Vietnam, simple 30-day e-Visas take only 3 business days to approve online. We provide full visa approval invitation letters upon booking {tourRef}!",
                    new List<string> { "How do I apply for Vietnam eVisa?", "What documents are required?", "Chat with Nok on WhatsApp" }
                );
            }

            if (msg.Contains("weather") || msg.Contains("season") || msg.Contains("rain") || msg.Contains("scuba") || msg.Contains("diving"))
            {
                return (
                    $"Great question! The optimal diving and island hopping season across Phuket, Krabi, and Koh Samui is November through April, when the Andaman Sea is calm with 30-meter underwater visibility. Our marine tours {tourRef} include licensed PADI divemasters.",
                    new List<string> { "Are snorkeling gears included?", "Speedboat schedule details", "Check live weather" }
                );
            }

            if (msg.Contains("esim") || msg.Contains("sim") || msg.Contains("data") || msg.Contains("5g"))
            {
                return (
                    $"Our 5G Traveler eSIM add-on gives you instant 15GB high-speed 5G data across Thailand, Vietnam, Singapore, and Malaysia. A QR code is sent to your email 24 hours before departure for zero-roaming-bill travel!",
                    new List<string> { "How to scan the eSIM QR?", "Is hotspot tethering allowed?", "Add eSIM to my booking" }
                );
            }

            return (
                $"Sawatdee Khrap! Thank you for contacting TripGoAsia {tourRef}. Nok Somchai and our Southeast Asia field guides are available 24/7 to answer your route, ferry, and excursion questions.",
                new List<string> { "Ask about island hopping", "Inquire about visas", "Connect on WhatsApp" }
            );
        }

        // Technoheaven Luxury
        if (msg.Contains("chauffeur") || msg.Contains("limousine") || msg.Contains("maybach") || msg.Contains("car") || msg.Contains("airport"))
        {
            return (
                $"Bonjour. Our white-glove VIP Chauffeur Service {tourRef} features pristine Mercedes-Maybach S-Class and Range Rover Autobiography vehicles with chilled Dom Pérignon, high-speed Wi-Fi, and tarmac tarmac-side executive meet & greet.",
                new List<string> { "Reserve Maybach Chauffeur", "Arrange private jet tarmac escort", "Contact Alexandre on WhatsApp" }
            );
        }

        if (msg.Contains("michelin") || msg.Contains("dinner") || msg.Contains("tasting") || msg.Contains("chef"))
        {
            return (
                $"An exquisite choice. Through our Les Clefs d'Or partner network, we guarantee private Chef's Table reservations at 2- and 3-Michelin-starred properties {tourRef}, including personalized custom menus designed by the Executive Chef and Grand Cru sommelier pairings.",
                new List<string> { "View Chef's Table sample menu", "Dietary preferences for tasting", "Confirm VIP reservation" }
            );
        }

        return (
            $"Bonjour. Welcome to Technoheaven VIP Concierge. Alexandre Laurent has received your priority inquiry {tourRef}. Our luxury travel directors are standing by to execute your bespoke requests to perfection.",
            new List<string> { "Arrange private chauffeur", "Book Michelin Chef's Table", "Connect with Alexandre on WhatsApp" }
        );
    }
}
