using System;
using System.IO;

namespace ToursApi.Common;

public static class SeedPathHelper
{
    public static string? FindSeedFile(string siteId, string fileName)
    {
        var cleanSite = (siteId ?? "gujjutours").Trim().ToLowerInvariant();

        // 1. Try from AppContext.BaseDirectory walking up to root
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null)
        {
            var p1 = Path.Combine(dir.FullName, "seed", cleanSite, fileName);
            if (File.Exists(p1)) return p1;

            var p2 = Path.Combine(dir.FullName, "backend", "toursApi", "seed", cleanSite, fileName);
            if (File.Exists(p2)) return p2;

            var p3 = Path.Combine(dir.FullName, "web", "seed", cleanSite, fileName);
            if (File.Exists(p3)) return p3;

            var p4 = Path.Combine(dir.FullName, "seed", fileName);
            if (File.Exists(p4)) return p4;

            var p5 = Path.Combine(dir.FullName, "backend", "toursApi", "seed", fileName);
            if (File.Exists(p5)) return p5;

            var p6 = Path.Combine(dir.FullName, "web", "seed", fileName);
            if (File.Exists(p6)) return p6;

            dir = dir.Parent;
        }

        // 2. Try from Directory.GetCurrentDirectory() walking up to root
        var curDir = new DirectoryInfo(Directory.GetCurrentDirectory());
        while (curDir != null)
        {
            var p1 = Path.Combine(curDir.FullName, "seed", cleanSite, fileName);
            if (File.Exists(p1)) return p1;

            var p2 = Path.Combine(curDir.FullName, "backend", "toursApi", "seed", cleanSite, fileName);
            if (File.Exists(p2)) return p2;

            var p3 = Path.Combine(curDir.FullName, "web", "seed", cleanSite, fileName);
            if (File.Exists(p3)) return p3;

            var p4 = Path.Combine(curDir.FullName, "seed", fileName);
            if (File.Exists(p4)) return p4;

            var p5 = Path.Combine(curDir.FullName, "backend", "toursApi", "seed", fileName);
            if (File.Exists(p5)) return p5;

            var p6 = Path.Combine(curDir.FullName, "web", "seed", fileName);
            if (File.Exists(p6)) return p6;

            curDir = curDir.Parent;
        }

        return null;
    }

    public static string? FindSeedDirectory(string siteId)
    {
        var cleanSite = (siteId ?? "gujjutours").Trim().ToLowerInvariant();

        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null)
        {
            var p1 = Path.Combine(dir.FullName, "seed", cleanSite);
            if (Directory.Exists(p1)) return p1;

            var p2 = Path.Combine(dir.FullName, "backend", "toursApi", "seed", cleanSite);
            if (Directory.Exists(p2)) return p2;

            var p3 = Path.Combine(dir.FullName, "web", "seed", cleanSite);
            if (Directory.Exists(p3)) return p3;

            dir = dir.Parent;
        }

        var curDir = new DirectoryInfo(Directory.GetCurrentDirectory());
        while (curDir != null)
        {
            var p1 = Path.Combine(curDir.FullName, "seed", cleanSite);
            if (Directory.Exists(p1)) return p1;

            var p2 = Path.Combine(curDir.FullName, "backend", "toursApi", "seed", cleanSite);
            if (Directory.Exists(p2)) return p2;

            var p3 = Path.Combine(curDir.FullName, "web", "seed", cleanSite);
            if (Directory.Exists(p3)) return p3;

            curDir = curDir.Parent;
        }

        return null;
    }
}
