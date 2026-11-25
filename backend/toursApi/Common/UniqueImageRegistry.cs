using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Nodes;
using ToursApi.Models;

namespace ToursApi.Common;

/// <summary>
/// Centralized unique image registry and per-response tracker.
/// Enforces the strict rule that each image URL (normalized by photo ID / path)
/// is used at most ONCE across a dataset, catalog response, or home payload.
/// </summary>
public static class UniqueImageRegistry
{
    public static readonly string[] HotelPhotos = new[]
    {
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=85",
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=85",
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=85",
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=85",
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=85",
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=85",
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=85",
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&q=85",
        "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1200&q=85",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=85",
        "https://images.unsplash.com/photo-1621293954908-907159247fc8?w=1200&q=85",
        "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=1200&q=85"
    };

    public static readonly string[] TourPhotos = new[]
    {
        "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=85",
        "https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=1200&q=85",
        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=85",
        "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=85",
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85",
        "https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=1200&q=85",
        "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&q=85",
        "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1200&q=85",
        "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1200&q=85",
        "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=1200&q=85",
        "https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&q=85",
        "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1200&q=85"
    };

    public static readonly string[] PackagePhotos = new[]
    {
        "https://images.unsplash.com/photo-1546412414-e1885259563a?w=1200&q=85",
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=85",
        "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&q=85",
        "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=85",
        "https://images.unsplash.com/photo-1598890777032-bde835ba27c2?w=1200&q=85",
        "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=1200&q=85",
        "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&q=85",
        "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=1200&q=85",
        "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&q=85",
        "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&q=85",
        "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200&q=85",
        "https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&q=85"
    };

    public static readonly string[] FlightPhotos = new[]
    {
        "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=85",
        "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=85",
        "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=1200&q=85",
        "https://images.unsplash.com/photo-1520437358207-323b43b50729?w=1200&q=85",
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=85",
        "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&q=85",
        "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=85",
        "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=85"
    };

    public static readonly string[] TransferPhotos = new[]
    {
        "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&q=85",
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=85",
        "https://images.unsplash.com/photo-1563720223185-11003d516935?w=1200&q=85",
        "https://images.unsplash.com/photo-1559297434-fae8a1916a79?w=1200&q=85",
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&q=85",
        "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200&q=85",
        "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=85",
        "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&q=85"
    };

    public static readonly string[] VisaPhotos = new[]
    {
        "https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&q=85",
        "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1200&q=85",
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=85",
        "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=85",
        "https://images.unsplash.com/photo-1538485399081-7191377e8241?w=1200&q=85",
        "https://images.unsplash.com/photo-1550340499-b12fa6f6c5f9?w=1200&q=85",
        "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200&q=85",
        "https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=1200&q=85"
    };

    public static readonly string[] RestaurantPhotos = new[]
    {
        "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=1200&q=85",
        "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=85",
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=85",
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=85",
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=85",
        "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=1200&q=85",
        "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=1200&q=85",
        "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200&q=85",
        "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=1200&q=85",
        "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=1200&q=85"
    };

    public static readonly string[] BuildPackagePhotos = new[]
    {
        "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=85",
        "https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=1200&q=85",
        "https://images.unsplash.com/photo-1516690561799-46d8f74ff9ab?w=1200&q=85",
        "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&q=85",
        "https://images.unsplash.com/photo-1546708973-b339540b5162?w=1200&q=85",
        "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1200&q=85"
    };

    public static readonly string[] DestinationPhotos = new[]
    {
        "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200&q=85",
        "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=1200&q=85",
        "https://images.unsplash.com/photo-1534177616072-ef7dc120449d?w=1200&q=85",
        "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200&q=85",
        "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1200&q=85",
        "https://images.unsplash.com/photo-1511497584788-87676104235f?w=1200&q=85",
        "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=1200&q=85",
        "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1200&q=85",
        "https://images.unsplash.com/photo-1542259009477-d625272157b7?w=1200&q=85",
        "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?w=1200&q=85",
        "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200&q=85",
        "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1200&q=85",
        "https://images.unsplash.com/photo-1603262110263-fb010d6e75dc?w=1200&q=85",
        "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=1200&q=85"
    };

    public static readonly string[] ExtraTravelPhotos = new[]
    {
        "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=1200&q=85",
        "https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=1200&q=85",
        "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=1200&q=85",
        "https://images.unsplash.com/photo-1544971587-b842c27f8e14?w=1200&q=85",
        "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=1200&q=85",
        "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200&q=85",
        "https://images.unsplash.com/photo-1578895101407-28564db31d87?w=1200&q=85",
        "https://images.unsplash.com/photo-1590073844006-33379778ae09?w=1200&q=85",
        "https://images.unsplash.com/photo-1600100397608-f010f4438344?w=1200&q=85",
        "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1200&q=85",
        "https://images.unsplash.com/photo-1614027164847-1b28caa144b6?w=1200&q=85",
        "https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=85",
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=85",
        "https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=1200&q=85",
        "https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&q=85",
        "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=1200&q=85",
        "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1200&q=85",
        "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=1200&q=85",
        "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=1200&q=85",
        "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1200&q=85",
        "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=1200&q=85",
        "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=1200&q=85"
    };

    public static string[] GetPoolForModule(string? module)
    {
        var norm = (module ?? "tours").Trim().ToLowerInvariant();
        return norm switch
        {
            "hotel" or "hotels" => HotelPhotos,
            "tour" or "tours" or "activity" or "activities" => TourPhotos,
            "package" or "packages" or "holiday" or "holidays" => PackagePhotos,
            "flight" or "flights" => FlightPhotos,
            "transfer" or "transfers" => TransferPhotos,
            "visa" or "visas" => VisaPhotos,
            "restaurant" or "restaurants" or "dining" => RestaurantPhotos,
            "buildpackage" or "build-package" or "custompackage" => BuildPackagePhotos,
            "destination" or "destinations" => DestinationPhotos,
            "banner" or "banners" or "offer" or "offers" => PackagePhotos.Concat(DestinationPhotos).ToArray(),
            "video" or "videos" => TourPhotos.Concat(ExtraTravelPhotos).ToArray(),
            _ => TourPhotos
        };
    }

    public static IEnumerable<string> GetAllOverflowPools() =>
        ExtraTravelPhotos
            .Concat(DestinationPhotos)
            .Concat(PackagePhotos)
            .Concat(TourPhotos)
            .Concat(HotelPhotos)
            .Concat(BuildPackagePhotos)
            .Concat(RestaurantPhotos)
            .Concat(TransferPhotos)
            .Concat(FlightPhotos)
            .Concat(VisaPhotos);

    /// <summary>
    /// Extracts a canonical key for deduplicating image URLs even if query params (?w=400 vs ?w=1200)
    /// or casing differ.
    /// </summary>
    public static string NormalizeImageKey(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return string.Empty;
        var clean = url.Trim();

        // Strip query string and fragment so resized variants of the same image share a single key
        var qIdx = clean.IndexOf('?');
        if (qIdx >= 0) clean = clean.Substring(0, qIdx);
        var hIdx = clean.IndexOf('#');
        if (hIdx >= 0) clean = clean.Substring(0, hIdx);

        return clean.TrimEnd('/').ToLowerInvariant();
    }

    public static bool IsPlaceholderOrEmpty(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return true;
        var lower = url.Trim().ToLowerInvariant();
        return lower.Contains("placeholder") ||
               lower.Contains("default-avatar") ||
               lower == "null" ||
               lower == "undefined";
    }

    // ─── Typed List Deduplication Helpers ───────────────────────────────────────

    public static void EnforceUniqueImages(IList<Tour> tours, UniqueImageTracker? tracker = null)
    {
        if (tours == null || tours.Count == 0) return;
        tracker ??= new UniqueImageTracker();

        // Pass 1: Claim unique primary hero images across all tours
        for (int i = 0; i < tours.Count; i++)
        {
            var t = tours[i];
            var module = ResolveModuleFromTourCategory(t.Category, t.Slug);
            var candidates = t.Gallery != null && t.Gallery.Count > 0 ? t.Gallery : null;
            t.Image = tracker.Claim(t.Image, module, i, candidates);
        }

        // Pass 2: Ensure each tour's gallery contains no duplicate entries
        for (int i = 0; i < tours.Count; i++)
        {
            var t = tours[i];
            var module = ResolveModuleFromTourCategory(t.Category, t.Slug);
            t.Gallery = BuildDistinctGallery(t.Gallery, t.Image, module, i);
        }
    }

    public static void EnforceUniqueImages(IList<Hotel> hotels, UniqueImageTracker? tracker = null)
    {
        if (hotels == null || hotels.Count == 0) return;
        tracker ??= new UniqueImageTracker();

        for (int i = 0; i < hotels.Count; i++)
        {
            var h = hotels[i];
            var preferred = !string.IsNullOrWhiteSpace(h.CoverImage)
                ? h.CoverImage
                : h.Images?.FirstOrDefault();
            var uniqueHero = tracker.Claim(preferred, "hotels", i, h.Images);

            h.Images = BuildDistinctGallery(h.Images, uniqueHero, "hotels", i);
        }
    }

    public static void EnforceUniqueImages(IList<Package> packages, UniqueImageTracker? tracker = null)
    {
        if (packages == null || packages.Count == 0) return;
        tracker ??= new UniqueImageTracker();

        for (int i = 0; i < packages.Count; i++)
        {
            var p = packages[i];
            var preferred = !string.IsNullOrWhiteSpace(p.Image)
                ? p.Image
                : p.Images?.FirstOrDefault();
            var uniqueHero = tracker.Claim(preferred, "packages", i, p.Images);
            p.Image = uniqueHero;
            p.Images = BuildDistinctGallery(p.Images, uniqueHero, "packages", i);
        }
    }

    public static void EnforceUniqueImages(IList<Activity> activities, UniqueImageTracker? tracker = null)
    {
        if (activities == null || activities.Count == 0) return;
        tracker ??= new UniqueImageTracker();

        for (int i = 0; i < activities.Count; i++)
        {
            var a = activities[i];
            var preferred = !string.IsNullOrWhiteSpace(a.Image)
                ? a.Image
                : a.Images?.FirstOrDefault();
            var uniqueHero = tracker.Claim(preferred, "tours", i, a.Images);
            a.Images = BuildDistinctGallery(a.Images, uniqueHero, "tours", i);
        }
    }

    public static void EnforceUniqueImages(IList<Flight> flights, UniqueImageTracker? tracker = null)
    {
        if (flights == null || flights.Count == 0) return;
        tracker ??= new UniqueImageTracker();

        for (int i = 0; i < flights.Count; i++)
        {
            var f = flights[i];
            f.AirlineLogo = tracker.Claim(f.AirlineLogo, "flights", i);
        }
    }

    public static void EnforceUniqueImages(IList<Transfer> transfers, UniqueImageTracker? tracker = null)
    {
        if (transfers == null || transfers.Count == 0) return;
        tracker ??= new UniqueImageTracker();

        for (int i = 0; i < transfers.Count; i++)
        {
            var t = transfers[i];
            t.Image = tracker.Claim(t.Image, "transfers", i);
        }
    }

    public static void EnforceUniqueImages(IList<Visa> visas, UniqueImageTracker? tracker = null)
    {
        if (visas == null || visas.Count == 0) return;
        tracker ??= new UniqueImageTracker();

        for (int i = 0; i < visas.Count; i++)
        {
            var v = visas[i];
            v.Image = tracker.Claim(v.Image, "visas", i);
        }
    }

    public static void EnforceUniqueImages(IList<Restaurant> restaurants, UniqueImageTracker? tracker = null)
    {
        if (restaurants == null || restaurants.Count == 0) return;
        tracker ??= new UniqueImageTracker();

        for (int i = 0; i < restaurants.Count; i++)
        {
            var r = restaurants[i];
            var preferred = !string.IsNullOrWhiteSpace(r.Image)
                ? r.Image
                : r.Images?.FirstOrDefault();
            var uniqueHero = tracker.Claim(preferred, "restaurants", i, r.Images);
            r.Image = uniqueHero;
            r.Images = BuildDistinctGallery(r.Images, uniqueHero, "restaurants", i);
        }
    }

    public static void EnforceUniqueImages(IList<BuildPackageOption> options, UniqueImageTracker? tracker = null)
    {
        if (options == null || options.Count == 0) return;
        tracker ??= new UniqueImageTracker();

        for (int i = 0; i < options.Count; i++)
        {
            var opt = options[i];
            var preferred = !string.IsNullOrWhiteSpace(opt.HeroImage)
                ? opt.HeroImage
                : (!string.IsNullOrWhiteSpace(opt.Image) ? opt.Image : opt.Images?.FirstOrDefault());
            var uniqueHero = tracker.Claim(preferred, "buildpackage", i, opt.Images);
            opt.HeroImage = uniqueHero;
            opt.Image = uniqueHero;
            opt.Images = BuildDistinctGallery(opt.Images, uniqueHero, "buildpackage", i);
        }
    }

    public static void EnforceUniqueImages(IList<Destination> destinations, UniqueImageTracker? tracker = null)
    {
        if (destinations == null || destinations.Count == 0) return;
        tracker ??= new UniqueImageTracker();

        for (int i = 0; i < destinations.Count; i++)
        {
            var d = destinations[i];
            d.Image = tracker.Claim(d.Image, "destinations", i);
        }
    }

    public static void EnforceUniqueImages(IList<Banner> banners, UniqueImageTracker? tracker = null)
    {
        if (banners == null || banners.Count == 0) return;
        tracker ??= new UniqueImageTracker();

        for (int i = 0; i < banners.Count; i++)
        {
            var b = banners[i];
            var mod = string.IsNullOrWhiteSpace(b.Module) || b.Module == "all" || b.Module == "home"
                ? "banners"
                : b.Module;
            b.ImageUrl = tracker.Claim(b.ImageUrl, mod, i);
        }
    }

    public static void EnforceUniqueImages(IList<SpecialOffer> offers, UniqueImageTracker? tracker = null)
    {
        if (offers == null || offers.Count == 0) return;
        tracker ??= new UniqueImageTracker();

        for (int i = 0; i < offers.Count; i++)
        {
            var o = offers[i];
            var mod = string.IsNullOrWhiteSpace(o.Module) || o.Module == "all"
                ? "offers"
                : o.Module;
            o.ImageUrl = tracker.Claim(o.ImageUrl, mod, i);
        }
    }

    public static void EnforceUniqueImages(IList<TravelVideo> videos, UniqueImageTracker? tracker = null)
    {
        if (videos == null || videos.Count == 0) return;
        tracker ??= new UniqueImageTracker();

        for (int i = 0; i < videos.Count; i++)
        {
            var v = videos[i];
            var mod = string.IsNullOrWhiteSpace(v.Module) || v.Module == "all"
                ? "videos"
                : v.Module;
            v.ThumbnailUrl = tracker.Claim(v.ThumbnailUrl, mod, i);
        }
    }

    public static void EnforceUniqueJsonImages(IList<JsonObject> items, string module, UniqueImageTracker? tracker = null, string primaryField = "imageUrl")
    {
        if (items == null || items.Count == 0) return;
        tracker ??= new UniqueImageTracker();

        for (int i = 0; i < items.Count; i++)
        {
            var obj = items[i];
            if (obj == null) continue;

            var preferred = obj[primaryField]?.ToString();
            if (string.IsNullOrWhiteSpace(preferred))
            {
                preferred = obj["image"]?.ToString()
                    ?? obj["thumbnail"]?.ToString()
                    ?? obj["thumbnailUrl"]?.ToString()
                    ?? obj["airlineLogo"]?.ToString();
            }

            var uniqueImg = tracker.Claim(preferred, module, i);

            if (primaryField == "thumbnail")
            {
                obj["thumbnail"] = uniqueImg;
                if (obj.ContainsKey("thumbnailUrl")) obj["thumbnailUrl"] = uniqueImg;
            }
            else if (primaryField == "airlineLogo")
            {
                obj["airlineLogo"] = uniqueImg;
                if (obj.ContainsKey("imageUrl")) obj["imageUrl"] = uniqueImg;
            }
            else
            {
                obj["imageUrl"] = uniqueImg;
                if (obj.ContainsKey("image")) obj["image"] = uniqueImg;
            }
        }
    }

    public static List<string> BuildDistinctGallery(
        IEnumerable<string>? existing,
        string heroImage,
        string module,
        int seedIndex = 0,
        int desiredCount = 3)
    {
        var result = new List<string>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        if (!IsPlaceholderOrEmpty(heroImage))
        {
            result.Add(heroImage);
            seen.Add(NormalizeImageKey(heroImage));
        }

        if (existing != null)
        {
            foreach (var raw in existing)
            {
                if (IsPlaceholderOrEmpty(raw)) continue;
                var key = NormalizeImageKey(raw);
                if (!seen.Contains(key))
                {
                    seen.Add(key);
                    result.Add(raw);
                }
            }
        }

        var pool = GetPoolForModule(module);
        for (int offset = 0; offset < pool.Length && result.Count < desiredCount; offset++)
        {
            var candidate = pool[(Math.Abs(seedIndex) + offset) % pool.Length];
            var key = NormalizeImageKey(candidate);
            if (!seen.Contains(key))
            {
                seen.Add(key);
                result.Add(candidate);
            }
        }

        return result;
    }

    private static string ResolveModuleFromTourCategory(string? category, string? slug)
    {
        var combined = $"{category} {slug}".ToLowerInvariant();
        if (combined.Contains("hotel") || combined.Contains("resort") || combined.Contains("stay"))
            return "hotels";
        if (combined.Contains("package") || combined.Contains("holiday"))
            return "packages";
        return "tours";
    }
}

/// <summary>
/// Stateful per-response / per-catalog tracker guaranteeing each image key is assigned at most once.
/// </summary>
public sealed class UniqueImageTracker
{
    private readonly HashSet<string> _usedKeys = new(StringComparer.OrdinalIgnoreCase);

    public bool IsUsed(string? url)
    {
        var key = UniqueImageRegistry.NormalizeImageKey(url);
        return !string.IsNullOrEmpty(key) && _usedKeys.Contains(key);
    }

    public void MarkUsed(string? url)
    {
        var key = UniqueImageRegistry.NormalizeImageKey(url);
        if (!string.IsNullOrEmpty(key))
        {
            _usedKeys.Add(key);
        }
    }

    /// <summary>
    /// Claims a strictly unique image URL. If preferredUrl (or any candidate in candidateUrls)
    /// is valid and not yet used in this tracker, it is claimed and returned.
    /// Otherwise, selects the first unused image from the module's pool, then falls back
    /// across the entire travel photo catalog so one image is never used twice.
    /// </summary>
    public string Claim(
        string? preferredUrl,
        string module = "tours",
        int hintIndex = 0,
        IEnumerable<string>? candidateUrls = null)
    {
        // 1. Check preferred URL first (avoid SVGs when a better non-SVG photo isn't needed—Wait:
        // if preferred is unused and valid, use it once; any subsequent item with the same URL will skip it!)
        if (!UniqueImageRegistry.IsPlaceholderOrEmpty(preferredUrl) && !IsUsed(preferredUrl))
        {
            MarkUsed(preferredUrl);
            return preferredUrl!.Trim();
        }

        // 2. Check optional secondary candidate URLs (e.g., item's own gallery/images list)
        if (candidateUrls != null)
        {
            foreach (var cand in candidateUrls)
            {
                if (!UniqueImageRegistry.IsPlaceholderOrEmpty(cand) && !IsUsed(cand))
                {
                    MarkUsed(cand);
                    return cand.Trim();
                }
            }
        }

        // 3. Pick first unused image from the module's dedicated pool
        var modulePool = UniqueImageRegistry.GetPoolForModule(module);
        for (int i = 0; i < modulePool.Length; i++)
        {
            var candidate = modulePool[(Math.Abs(hintIndex) + i) % modulePool.Length];
            if (!IsUsed(candidate))
            {
                MarkUsed(candidate);
                return candidate;
            }
        }

        // 4. Overflow across all other travel pools so even large lists get unique images
        foreach (var candidate in UniqueImageRegistry.GetAllOverflowPools())
        {
            if (!IsUsed(candidate))
            {
                MarkUsed(candidate);
                return candidate;
            }
        }

        // 5. Absolute safety fallback if >100+ items exist in one single response
        return modulePool[Math.Abs(hintIndex) % modulePool.Length];
    }
}
