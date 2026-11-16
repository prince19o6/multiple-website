using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ToursApi.Models;
using ToursApi.Services;

namespace ToursApi.Controllers
{
    [ApiController]
    [Route("api/groups")]
    public class GroupTripController : ControllerBase
    {
        private readonly IWebsiteContext _websiteContext;
        private readonly IMongoDatabaseProvider _databaseProvider;

        public GroupTripController(
            IWebsiteContext websiteContext,
            IMongoDatabaseProvider databaseProvider)
        {
            _websiteContext = websiteContext;
            _databaseProvider = databaseProvider;
        }

        [HttpGet("active")]
        public IActionResult GetActiveGroupTrip()
        {
            var siteId = _websiteContext.CurrentWebsiteId?.ToLowerInvariant() ?? "gujjutours";
            var trip = BuildBrandGroupTrip(siteId);

            return Ok(new
            {
                success = true,
                siteId,
                data = trip
            });
        }

        [HttpPost("polls/vote")]
        public async Task<IActionResult> CastPollVote([FromBody] CastVoteRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.PollId) || string.IsNullOrWhiteSpace(dto.OptionId))
            {
                return BadRequest(new
                {
                    success = false,
                    error = "PollId and OptionId are required to cast a vote."
                });
            }

            var siteId = _websiteContext.CurrentWebsiteId?.ToLowerInvariant() ?? "gujjutours";
            var trip = BuildBrandGroupTrip(siteId);
            var poll = trip.Polls.FirstOrDefault(p => p.PollId.Equals(dto.PollId, StringComparison.OrdinalIgnoreCase));

            if (poll != null)
            {
                var option = poll.Options.FirstOrDefault(o => o.OptionId.Equals(dto.OptionId, StringComparison.OrdinalIgnoreCase));
                if (option != null)
                {
                    var voterName = string.IsNullOrWhiteSpace(dto.VoterName) ? "You" : dto.VoterName.Trim();
                    if (!option.VotedMemberNames.Contains(voterName))
                    {
                        option.VotedMemberNames.Add(voterName);
                        option.VotesCount += 1;
                        poll.TotalVotes += 1;

                        // Recalculate percentages
                        foreach (var opt in poll.Options)
                        {
                            opt.VotePercent = poll.TotalVotes > 0 ? (int)Math.Round((double)opt.VotesCount / poll.TotalVotes * 100) : 0;
                        }
                    }
                }
            }

            try
            {
                using var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(2));
                var db = _databaseProvider.GetDatabase(_websiteContext.DatabaseName);
                var collection = db.GetCollection<GroupTrip>("group_trips");
                // Attempt non-fatal persistence
                await collection.UpdateOneAsync(
                    Builders<GroupTrip>.Filter.Eq(g => g.WebsiteId, siteId),
                    Builders<GroupTrip>.Update.Set(g => g.Polls, trip.Polls),
                    new UpdateOptions { IsUpsert = true },
                    cancellationToken: cts.Token
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GroupTripController] Non-fatal Mongo log failure: {ex.Message}");
            }

            return Ok(new
            {
                success = true,
                message = "Vote recorded successfully!",
                data = poll
            });
        }

        [HttpPost("gear")]
        public async Task<IActionResult> AddOrToggleGear([FromBody] CreateGearItemRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
            {
                return BadRequest(new
                {
                    success = false,
                    error = "Gear item title is required."
                });
            }

            var siteId = _websiteContext.CurrentWebsiteId?.ToLowerInvariant() ?? "gujjutours";
            var newItem = new GroupGearItemDto
            {
                ItemId = $"gear-{Guid.NewGuid().ToString("N")[..6]}",
                Title = dto.Title.Trim(),
                Category = string.IsNullOrWhiteSpace(dto.Category) ? "General" : dto.Category,
                AssignedToMemberName = string.IsNullOrWhiteSpace(dto.AssignedToMemberName) ? "Unassigned" : dto.AssignedToMemberName.Trim(),
                IsPacked = false
            };

            try
            {
                using var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(2));
                var db = _databaseProvider.GetDatabase(_websiteContext.DatabaseName);
                var collection = db.GetCollection<GroupTrip>("group_trips");
                await collection.UpdateOneAsync(
                    Builders<GroupTrip>.Filter.Eq(g => g.WebsiteId, siteId),
                    Builders<GroupTrip>.Update.Push(g => g.GearItems, newItem),
                    new UpdateOptions { IsUpsert = true },
                    cancellationToken: cts.Token
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GroupTripController] Non-fatal Mongo log failure: {ex.Message}");
            }

            return Ok(new
            {
                success = true,
                message = "Gear item registered to group checklist!",
                data = newItem
            });
        }

        private GroupTripDto BuildBrandGroupTrip(string siteId)
        {
            return siteId switch
            {
                "technoheaven" => BuildTechnoheavenGroupTrip(),
                "tripgoasia" => BuildTripGoAsiaGroupTrip(),
                _ => BuildGujjuToursGroupTrip()
            };
        }

        private GroupTripDto BuildGujjuToursGroupTrip()
        {
            return new GroupTripDto
            {
                GroupId = "grp-guj-01",
                SiteId = "gujjutours",
                GroupName = "Shah Family Sacred Saurashtra Yatra",
                Destination = "Dwarka, Somnath & Sasan Gir",
                TravelDates = "26 Oct - 31 Oct, 2026",
                InviteCode = "GUJ-SHAH-772",
                ShareableInviteUrl = "https://gujjutours.com/join-group?code=GUJ-SHAH-772",
                TotalEstimatedCost = "₹1,85,000 Total",
                PerPersonEstimatedCost = "₹30,833 / Person (6 Travelers)",
                Members = new List<GroupMemberDto>
                {
                    new GroupMemberDto
                    {
                        MemberId = "mem-1",
                        Name = "Rajesh Shah",
                        AvatarUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
                        Role = "Trip Leader",
                        DietaryTag = "Strict Jain",
                        Phone = "+91 98250 11223",
                        RsvpStatus = "Confirmed"
                    },
                    new GroupMemberDto
                    {
                        MemberId = "mem-2",
                        Name = "Meenaben Shah",
                        AvatarUrl = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
                        Role = "Co-Planner",
                        DietaryTag = "Strict Jain",
                        Phone = "+91 98250 11224",
                        RsvpStatus = "Confirmed"
                    },
                    new GroupMemberDto
                    {
                        MemberId = "mem-3",
                        Name = "Amit Shah",
                        AvatarUrl = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
                        Role = "Traveler",
                        DietaryTag = "100% Pure Veg",
                        Phone = "+91 99090 44551",
                        RsvpStatus = "Confirmed"
                    },
                    new GroupMemberDto
                    {
                        MemberId = "mem-4",
                        Name = "Pooja Shah",
                        AvatarUrl = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
                        Role = "Traveler",
                        DietaryTag = "100% Pure Veg",
                        Phone = "+91 99090 44552",
                        RsvpStatus = "Confirmed"
                    },
                    new GroupMemberDto
                    {
                        MemberId = "mem-5",
                        Name = "Dineshbhai Shah (Dad)",
                        AvatarUrl = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80",
                        Role = "Traveler",
                        DietaryTag = "Strict Jain",
                        Phone = "+91 98240 33211",
                        RsvpStatus = "Confirmed"
                    },
                    new GroupMemberDto
                    {
                        MemberId = "mem-6",
                        Name = "Hansaben Shah (Mom)",
                        AvatarUrl = "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80",
                        Role = "Traveler",
                        DietaryTag = "Strict Jain",
                        Phone = "+91 98240 33212",
                        RsvpStatus = "Confirmed"
                    }
                },
                Polls = new List<GroupPollDto>
                {
                    new GroupPollDto
                    {
                        PollId = "poll-guj-1",
                        Question = "Which Darshan Aarti in Dwarka should the family attend together?",
                        Category = "Activity",
                        TotalVotes = 6,
                        IsActive = true,
                        CreatedBy = "Rajesh Shah",
                        Options = new List<PollOptionDto>
                        {
                            new PollOptionDto
                            {
                                OptionId = "opt-1",
                                Title = "Morning Mangla & Shringaar Aarti (07:00 AM)",
                                Subtitle = "Calm atmosphere, fresh Makhan Mishri prasadam",
                                VotesCount = 4,
                                VotePercent = 67,
                                VotedMemberNames = new List<string> { "Rajesh Shah", "Dineshbhai Shah", "Hansaben Shah", "Meenaben Shah" }
                            },
                            new PollOptionDto
                            {
                                OptionId = "opt-2",
                                Title = "Evening Sandhya Aarti & Temple Light Show (07:30 PM)",
                                Subtitle = "Spectacular flag changing ceremony & temple illumination",
                                VotesCount = 2,
                                VotePercent = 33,
                                VotedMemberNames = new List<string> { "Amit Shah", "Pooja Shah" }
                            }
                        }
                    },
                    new GroupPollDto
                    {
                        PollId = "poll-guj-2",
                        Question = "Sasan Gir Jungle Safari Slot Selection",
                        Category = "Timing",
                        TotalVotes = 6,
                        IsActive = true,
                        CreatedBy = "Meenaben Shah",
                        Options = new List<PollOptionDto>
                        {
                            new PollOptionDto
                            {
                                OptionId = "opt-3",
                                Title = "Early Morning Dew Safari (06:00 AM - 09:00 AM)",
                                Subtitle = "Highest probability of spotting Asiatic Lions near waterholes",
                                VotesCount = 5,
                                VotePercent = 83,
                                VotedMemberNames = new List<string> { "Rajesh Shah", "Amit Shah", "Pooja Shah", "Meenaben Shah", "Dineshbhai Shah" }
                            },
                            new PollOptionDto
                            {
                                OptionId = "opt-4",
                                Title = "Sunset Amber Safari (03:30 PM - 06:30 PM)",
                                Subtitle = "Milder temperatures and golden photography light",
                                VotesCount = 1,
                                VotePercent = 17,
                                VotedMemberNames = new List<string> { "Hansaben Shah" }
                            }
                        }
                    }
                },
                GearItems = new List<GroupGearItemDto>
                {
                    new GroupGearItemDto
                    {
                        ItemId = "gear-1",
                        Title = "Family First-Aid Kit & Daily Prescription Medicines",
                        Category = "Medical/Safety",
                        AssignedToMemberName = "Meenaben Shah",
                        IsPacked = true
                    },
                    new GroupGearItemDto
                    {
                        ItemId = "gear-2",
                        Title = "Puja Samagri, Copper Kalash & Sacred Tulsi Beads",
                        Category = "Religious/Puja",
                        AssignedToMemberName = "Dineshbhai Shah",
                        IsPacked = true
                    },
                    new GroupGearItemDto
                    {
                        ItemId = "gear-3",
                        Title = "DSLR Camera, Telephoto Zoom Lens & Binoculars for Gir Lions",
                        Category = "Electronics",
                        AssignedToMemberName = "Amit Shah",
                        IsPacked = false
                    },
                    new GroupGearItemDto
                    {
                        ItemId = "gear-4",
                        Title = "Travel Snack Hamper: Methi Thepla, Sukha Nashta & Khakhra",
                        Category = "Snacks & Food",
                        AssignedToMemberName = "Pooja Shah",
                        IsPacked = true
                    },
                    new GroupGearItemDto
                    {
                        ItemId = "gear-5",
                        Title = "Aadhaar Card Copies & Hotel Booking Vouchers",
                        Category = "Documentation",
                        AssignedToMemberName = "Rajesh Shah",
                        IsPacked = false
                    }
                },
                DietarySummary = new List<DietarySummaryItemDto>
                {
                    new DietarySummaryItemDto
                    {
                        DietType = "Strict Jain (No Root Veg / Onion / Garlic)",
                        Count = 4,
                        MemberNames = new List<string> { "Rajesh", "Meenaben", "Dineshbhai", "Hansaben" },
                        DiningTip = "All meals pre-arranged at Shrinath Bhojanalaya & ISKCON Govinda's pure satvik hall."
                    },
                    new DietarySummaryItemDto
                    {
                        DietType = "100% Pure Vegetarian",
                        Count = 2,
                        MemberNames = new List<string> { "Amit", "Pooja" },
                        DiningTip = "Kathiyawadi Thali with Bajra Rotla and fresh Makhan confirmed."
                    }
                }
            };
        }

        private GroupTripDto BuildTripGoAsiaGroupTrip()
        {
            return new GroupTripDto
            {
                GroupId = "grp-tga-02",
                SiteId = "tripgoasia",
                GroupName = "Bangkok & Andaman Beach Holiday Squad",
                Destination = "Bangkok, Phuket & Koh Phi Phi",
                TravelDates = "02 Nov - 08 Nov, 2026",
                InviteCode = "TGA-SQD-910",
                ShareableInviteUrl = "https://tripgoasia.com/join-group?code=TGA-SQD-910",
                TotalEstimatedCost = "฿112,000 Total",
                PerPersonEstimatedCost = "฿28,000 / Person (4 Travelers)",
                Members = new List<GroupMemberDto>
                {
                    new GroupMemberDto
                    {
                        MemberId = "mem-tga-1",
                        Name = "Daniel Chen",
                        AvatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
                        Role = "Trip Leader",
                        DietaryTag = "Seafood Friendly",
                        Phone = "+65 9123 4567",
                        RsvpStatus = "Confirmed"
                    },
                    new GroupMemberDto
                    {
                        MemberId = "mem-tga-2",
                        Name = "Sarah Miller",
                        AvatarUrl = "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
                        Role = "Co-Planner",
                        DietaryTag = "Vegan",
                        Phone = "+61 412 345 678",
                        RsvpStatus = "Confirmed"
                    },
                    new GroupMemberDto
                    {
                        MemberId = "mem-tga-3",
                        Name = "Kevin Zhang",
                        AvatarUrl = "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80",
                        Role = "Traveler",
                        DietaryTag = "Halal Certified",
                        Phone = "+852 9876 5432",
                        RsvpStatus = "Confirmed"
                    },
                    new GroupMemberDto
                    {
                        MemberId = "mem-tga-4",
                        Name = "Priya Patel",
                        AvatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
                        Role = "Traveler",
                        DietaryTag = "100% Pure Veg",
                        Phone = "+44 7700 900123",
                        RsvpStatus = "Confirmed"
                    }
                },
                Polls = new List<GroupPollDto>
                {
                    new GroupPollDto
                    {
                        PollId = "poll-tga-1",
                        Question = "Maya Bay Transport: Vintage Longtail Boat vs High-Speed Catamaran?",
                        Category = "Activity",
                        TotalVotes = 4,
                        IsActive = true,
                        CreatedBy = "Daniel Chen",
                        Options = new List<PollOptionDto>
                        {
                            new PollOptionDto
                            {
                                OptionId = "opt-tga-1",
                                Title = "Chartered Longtail Boat with Floral Garland",
                                Subtitle = "Iconic aesthetic photography & private stops in Pileh lagoon",
                                VotesCount = 3,
                                VotePercent = 75,
                                VotedMemberNames = new List<string> { "Daniel Chen", "Sarah Miller", "Priya Patel" }
                            },
                            new PollOptionDto
                            {
                                OptionId = "opt-tga-2",
                                Title = "High-Speed Twin-Engine Catamaran",
                                Subtitle = "Smooth crossing, air-conditioned cabin, faster transit",
                                VotesCount = 1,
                                VotePercent = 25,
                                VotedMemberNames = new List<string> { "Kevin Zhang" }
                            }
                        }
                    }
                },
                GearItems = new List<GroupGearItemDto>
                {
                    new GroupGearItemDto
                    {
                        ItemId = "gear-tga-1",
                        Title = "30L Ocean Waterproof Dry Bags",
                        Category = "Medical/Safety",
                        AssignedToMemberName = "Daniel Chen",
                        IsPacked = true
                    },
                    new GroupGearItemDto
                    {
                        ItemId = "gear-tga-2",
                        Title = "Reef-Safe Biodegradable Sunscreen & Aloe Vera Gel",
                        Category = "Medical/Safety",
                        AssignedToMemberName = "Sarah Miller",
                        IsPacked = true
                    },
                    new GroupGearItemDto
                    {
                        ItemId = "gear-tga-3",
                        Title = "GoPro Hero 12 Black with Floating Hand Grip",
                        Category = "Electronics",
                        AssignedToMemberName = "Kevin Zhang",
                        IsPacked = false
                    }
                },
                DietarySummary = new List<DietarySummaryItemDto>
                {
                    new DietarySummaryItemDto
                    {
                        DietType = "Vegan & Gluten-Free",
                        Count = 1,
                        MemberNames = new List<string> { "Sarah" },
                        DiningTip = "Vegetarian Thai dishes prepared without fish sauce (Nam Pla)."
                    },
                    new DietarySummaryItemDto
                    {
                        DietType = "Halal Friendly",
                        Count = 1,
                        MemberNames = new List<string> { "Kevin" },
                        DiningTip = "Certified Halal Thai Muslim eateries selected in Bangkok and Phi Phi."
                    }
                }
            };
        }

        private GroupTripDto BuildTechnoheavenGroupTrip()
        {
            return new GroupTripDto
            {
                GroupId = "grp-dxb-03",
                SiteId = "technoheaven",
                GroupName = "Al-Mansoor Dubai VIP Luxury Winter Delegation",
                Destination = "Downtown Dubai & Lahbab High Red Dunes",
                TravelDates = "15 Nov - 20 Nov, 2026",
                InviteCode = "DXB-VIP-501",
                ShareableInviteUrl = "https://technoheaven.com/join-group?code=DXB-VIP-501",
                TotalEstimatedCost = "AED 45,000 Total",
                PerPersonEstimatedCost = "AED 9,000 / Person (5 Travelers)",
                Members = new List<GroupMemberDto>
                {
                    new GroupMemberDto
                    {
                        MemberId = "mem-dxb-1",
                        Name = "Tariq Al-Mansoor",
                        AvatarUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
                        Role = "Trip Leader",
                        DietaryTag = "Halal Certified",
                        Phone = "+971 50 112 3344",
                        RsvpStatus = "Confirmed"
                    },
                    new GroupMemberDto
                    {
                        MemberId = "mem-dxb-2",
                        Name = "Fatima Al-Mansoor",
                        AvatarUrl = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
                        Role = "Co-Planner",
                        DietaryTag = "Halal Certified",
                        Phone = "+971 50 112 3345",
                        RsvpStatus = "Confirmed"
                    },
                    new GroupMemberDto
                    {
                        MemberId = "mem-dxb-3",
                        Name = "Zayd Al-Mansoor",
                        AvatarUrl = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
                        Role = "Traveler",
                        DietaryTag = "Halal Certified",
                        Phone = "+971 55 443 2211",
                        RsvpStatus = "Confirmed"
                    },
                    new GroupMemberDto
                    {
                        MemberId = "mem-dxb-4",
                        Name = "Reem Al-Mansoor",
                        AvatarUrl = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
                        Role = "Traveler",
                        DietaryTag = "Nut Allergy Alert",
                        Phone = "+971 55 443 2212",
                        RsvpStatus = "Confirmed"
                    }
                },
                Polls = new List<GroupPollDto>
                {
                    new GroupPollDto
                    {
                        PollId = "poll-dxb-1",
                        Question = "Burj Khalifa Experience Selection",
                        Category = "Activity",
                        TotalVotes = 4,
                        IsActive = true,
                        CreatedBy = "Tariq Al-Mansoor",
                        Options = new List<PollOptionDto>
                        {
                            new PollOptionDto
                            {
                                OptionId = "opt-dxb-1",
                                Title = "At.mosphere Luxury High Tea on 122nd Floor",
                                Subtitle = "Gourmet pastries, caviar tasting and skyline vistas",
                                VotesCount = 3,
                                VotePercent = 75,
                                VotedMemberNames = new List<string> { "Tariq", "Fatima", "Reem" }
                            },
                            new PollOptionDto
                            {
                                OptionId = "opt-dxb-2",
                                Title = "At The Top SKY Observation Deck (Level 148)",
                                Subtitle = "Outdoor terrace at 555 meters high",
                                VotesCount = 1,
                                VotePercent = 25,
                                VotedMemberNames = new List<string> { "Zayd" }
                            }
                        }
                    }
                },
                GearItems = new List<GroupGearItemDto>
                {
                    new GroupGearItemDto
                    {
                        ItemId = "gear-dxb-1",
                        Title = "Professional Gimbal Stabilizer & 4K Camera",
                        Category = "Electronics",
                        AssignedToMemberName = "Zayd Al-Mansoor",
                        IsPacked = true
                    },
                    new GroupGearItemDto
                    {
                        ItemId = "gear-dxb-2",
                        Title = "Medical Allergy Kit (Nut-Free Protocol)",
                        Category = "Medical/Safety",
                        AssignedToMemberName = "Reem Al-Mansoor",
                        IsPacked = true
                    }
                },
                DietarySummary = new List<DietarySummaryItemDto>
                {
                    new DietarySummaryItemDto
                    {
                        DietType = "100% Halal Certified",
                        Count = 4,
                        MemberNames = new List<string> { "Tariq", "Fatima", "Zayd", "Reem" },
                        DiningTip = "All luxury partner kitchens are Grade-A Halal certified by Dubai Municipality."
                    },
                    new DietarySummaryItemDto
                    {
                        DietType = "Strict Nut Allergy Alert",
                        Count = 1,
                        MemberNames = new List<string> { "Reem" },
                        DiningTip = "Nut-free pastry and dessert trays reserved with head chef."
                    }
                }
            };
        }
    }
}
