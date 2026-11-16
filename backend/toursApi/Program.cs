using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MongoDB.Driver;
using ToursApi.Configuration;
using ToursApi.Middleware;
using ToursApi.Models;
using ToursApi.Repositories;
using ToursApi.Services;

// ─── CLI Command Runner (create-admin / migrate-admins-from-tours70) ─────────
if (args.Length > 0 && (args[0] == "create-admin" || args.Contains("create-admin") ||
                        args[0] == "migrate-admins-from-tours70" || args.Contains("migrate-admins-from-tours70")))
{
    await ExecuteCliCommandAsync(args);
    return;
}

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://0.0.0.0:5000");

builder.Services.AddHttpContextAccessor();

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.Converters.Add(new ToursApi.Configuration.FlexibleDateTimeConverter());
        options.JsonSerializerOptions.Converters.Add(new ToursApi.Configuration.FlexibleNullableDateTimeConverter());
    });

builder.Services.Configure<Microsoft.AspNetCore.Mvc.ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = context.ModelState
            .Where(e => e.Value?.Errors.Count > 0)
            .ToDictionary(
                kvp => JsonNamingPolicy.CamelCase.ConvertName(kvp.Key.Replace("$.", "")),
                kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
            );

        var firstError = errors.Values.SelectMany(v => v).FirstOrDefault() ?? "One or more validation errors occurred.";

        return new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(new
        {
            success = false,
            error = firstError,
            errors
        });
    };
});

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});

builder.Services.AddHttpClient("ExternalConfig", client =>
{
    client.Timeout = TimeSpan.FromSeconds(15);
});

// Multi-tenant database provider & request context
builder.Services.AddSingleton<IMongoDatabaseProvider, MongoDatabaseProvider>();
builder.Services.AddScoped<IWebsiteContext, WebsiteContext>();

// Per-request IMongoDatabase strictly scoped to the active website's database
builder.Services.AddScoped<IMongoDatabase>(sp =>
{
    var websiteContext = sp.GetRequiredService<IWebsiteContext>();
    var dbProvider = sp.GetRequiredService<IMongoDatabaseProvider>();
    var dbName = websiteContext.CurrentSite?.DatabaseName ?? "tours_gujjutours";
    return dbProvider.GetDatabase(dbName);
});

// Repositories (strictly receive per-request IMongoDatabase)
builder.Services.AddScoped<ITourRepository, TourRepository>();
builder.Services.AddScoped<IBookingRepository, BookingRepository>();
builder.Services.AddScoped<IEmailOutboxRepository, EmailOutboxRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IWebsiteConfigRepository, WebsiteConfigRepository>();
builder.Services.AddScoped<IDestinationRepository, DestinationRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IApiKeyRepository, ApiKeyRepository>();
builder.Services.AddSingleton<IApiKeyRateLimiter, ApiKeyRateLimiter>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IHotelRepository, HotelRepository>();
builder.Services.AddScoped<IPackageRepository, PackageRepository>();
builder.Services.AddScoped<IFlightRepository, FlightRepository>();
builder.Services.AddScoped<ITransferRepository, TransferRepository>();
builder.Services.AddScoped<IVisaRepository, VisaRepository>();
builder.Services.AddScoped<IRestaurantRepository, RestaurantRepository>();
builder.Services.AddScoped<IBuildPackageRepository, BuildPackageRepository>();

// Domain Services & Workflow
builder.Services.AddScoped<IUserCodeGenerator, UserCodeGenerator>();
builder.Services.AddScoped<ITourService, TourService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddSingleton<IRateLimiterService, RateLimiterService>();
builder.Services.AddScoped<IEmailOutboxService, EmailOutboxService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddSingleton<IActionTokenService, ActionTokenService>();
builder.Services.AddSingleton<IEmailTemplateRenderer, EmailTemplateRenderer>();
builder.Services.AddSingleton<IEmailSender, DevFileEmailSender>();
builder.Services.AddSingleton<IEmailSender, SmtpEmailSender>();
builder.Services.AddSingleton<IEmailSender, SendGridEmailSender>();
builder.Services.AddScoped<IBookingWorkflowService, BookingWorkflowService>();

builder.Services.AddHttpClient("SendGrid", client =>
{
    client.Timeout = TimeSpan.FromSeconds(15);
});

// Hosted background processors
builder.Services.AddHostedService<EmailOutboxBackgroundService>();
builder.Services.AddHostedService<BookingExpiryBackgroundService>();

// Dynamic per-website JWT Authentication
var httpContextAccessor = new HttpContextAccessor();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidateIssuer = true,
            ValidateAudience = true,
            ClockSkew = TimeSpan.FromMinutes(1),
            RoleClaimType = ClaimTypes.Role,
            IssuerSigningKeyResolver = (token, securityToken, kid, validationParameters) =>
            {
                var context = httpContextAccessor.HttpContext;
                var websiteContext = context?.RequestServices.GetService<IWebsiteContext>();
                if (websiteContext?.CurrentSite != null)
                {
                    return new[] { new SymmetricSecurityKey(Encoding.UTF8.GetBytes(websiteContext.CurrentSite.JwtSigningKey)) };
                }
                return Enumerable.Empty<SecurityKey>();
            },
            IssuerValidator = (issuer, securityToken, validationParameters) =>
            {
                var context = httpContextAccessor.HttpContext;
                var websiteContext = context?.RequestServices.GetService<IWebsiteContext>();
                if (websiteContext?.CurrentSite != null && string.Equals(issuer, websiteContext.CurrentSite.JwtIssuer, StringComparison.Ordinal))
                {
                    return issuer;
                }
                throw new SecurityTokenInvalidIssuerException("Invalid token issuer for this website.");
            },
            AudienceValidator = (audiences, securityToken, validationParameters) =>
            {
                var context = httpContextAccessor.HttpContext;
                var websiteContext = context?.RequestServices.GetService<IWebsiteContext>();
                if (websiteContext?.CurrentSite != null && audiences != null && audiences.Contains(websiteContext.CurrentSite.JwtAudience))
                {
                    return true;
                }
                return false;
            }
        };
    });

builder.Services.AddAuthorization();

// Swagger Documentation with JWT Bearer support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ToursApi Multi-Tenant Isolated Database API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Format: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Dynamic CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        var isDev = builder.Environment.IsDevelopment();

        policy
            .SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrWhiteSpace(origin)) return false;
                if (isDev) return true;

                try
                {
                    var uri = new Uri(origin);
                    var host = uri.Host.ToLowerInvariant();

                    // Local development hosts and ports
                    if (host == "localhost" || host == "127.0.0.1") return true;

                    // Known website origins across all registered sites
                    var isRegisteredOrigin = WebsiteRegistry.SitesById.Values.Any(site =>
                        site.CorsOrigins.Any(co =>
                        {
                            try { return new Uri(co).Host.Equals(host, StringComparison.OrdinalIgnoreCase); }
                            catch { return false; }
                        }));

                    if (isRegisteredOrigin) return true;

                    // Expo Tunnel and ngrok domains, or local network IPs allowed in Development
                    if (isDev && (
                        System.Net.IPAddress.TryParse(host, out _) ||
                        host.EndsWith(".exp.direct", StringComparison.OrdinalIgnoreCase) ||
                        host.EndsWith(".ngrok-free.app", StringComparison.OrdinalIgnoreCase) ||
                        host.EndsWith(".ngrok.io", StringComparison.OrdinalIgnoreCase)))
                    {
                        return true;
                    }

                    return false;
                }
                catch
                {
                    return false;
                }
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseResponseCompression();
app.UseStaticFiles();

app.UseCors("Frontend");

// WebsiteContextMiddleware MUST run before Authentication & Authorization
app.UseMiddleware<WebsiteContextMiddleware>();
app.UseMiddleware<ApiKeyValidationMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/", () => Results.Ok(new
{
    status = "ToursApi is running",
    architecture = "Database-Per-Website",
    tenants = WebsiteRegistry.SitesById.Keys
}));

app.Run();

// ─── CLI Implementation ───────────────────────────────────────────────────────

static async Task ExecuteCliCommandAsync(string[] args)
{
    Console.WriteLine("==================================================");
    Console.WriteLine(" ToursApi - Multi-Tenant Database CLI Tool");
    Console.WriteLine("==================================================");

    var configBuilder = new ConfigurationBuilder()
        .SetBasePath(AppContext.BaseDirectory)
        .AddJsonFile("appsettings.json", optional: true)
        .AddJsonFile("appsettings.Development.json", optional: true)
        .AddEnvironmentVariables();
    var config = configBuilder.Build();

    var connString = config.GetConnectionString("DefaultConnection")
        ?? config["MongoDb:ConnectionString"]
        ?? "mongodb+srv://developerprince70:developerprince70@tours70.1dfr1.mongodb.net/?retryWrites=true&w=majority&appName=tours70";

    var mongoClient = new MongoClient(connString);

    if (args.Contains("migrate-admins-from-tours70") || (args.Length > 0 && args[0] == "migrate-admins-from-tours70"))
    {
        await MigrateAdminsAsync(mongoClient);
        return;
    }

    // Command: create-admin
    await CreateAdminCliAsync(args, mongoClient);
}

static async Task CreateAdminCliAsync(string[] args, MongoClient mongoClient)
{
    string? site = GetArgValue(args, "--site");
    string? email = GetArgValue(args, "--email");
    string? password = GetArgValue(args, "--password");
    string? name = GetArgValue(args, "--name") ?? "Administrator";

    if (string.IsNullOrWhiteSpace(site))
    {
        Console.Write("Enter Website Tenant (gujjutours / tripgoasia / technoheaven): ");
        site = Console.ReadLine()?.Trim();
    }

    var website = WebsiteRegistry.Resolve(site ?? "");
    if (website == null)
    {
        Console.ForegroundColor = ConsoleColor.Red;
        Console.WriteLine($"[ERROR] Unknown website tenant '{site}'. Valid options: gujjutours, tripgoasia, technoheaven.");
        Console.ResetColor();
        Environment.Exit(1);
        return;
    }

    if (string.IsNullOrWhiteSpace(email))
    {
        Console.Write($"Enter Admin Email for {website.SiteName}: ");
        email = Console.ReadLine()?.Trim();
    }

    if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
    {
        Console.ForegroundColor = ConsoleColor.Red;
        Console.WriteLine("[ERROR] A valid email address is required.");
        Console.ResetColor();
        Environment.Exit(1);
        return;
    }

    if (string.IsNullOrWhiteSpace(password))
    {
        Console.Write("Enter Admin Password: ");
        var pwd = new StringBuilder();
        while (true)
        {
            var key = Console.ReadKey(true);
            if (key.Key == ConsoleKey.Enter) break;
            if (key.Key == ConsoleKey.Backspace && pwd.Length > 0)
            {
                pwd.Length--;
            }
            else if (!char.IsControl(key.KeyChar))
            {
                pwd.Append(key.KeyChar);
            }
        }
        Console.WriteLine();
        password = pwd.ToString();
    }

    if (string.IsNullOrWhiteSpace(password))
    {
        Console.ForegroundColor = ConsoleColor.Red;
        Console.WriteLine("[ERROR] Password cannot be empty.");
        Console.ResetColor();
        Environment.Exit(1);
        return;
    }

    var normalizedEmail = email.Trim().ToLowerInvariant();
    var db = mongoClient.GetDatabase(website.DatabaseName);
    var usersCollection = db.GetCollection<User>("users");
    var hasher = new PasswordHasher<User>();

    var existing = await usersCollection.Find(Builders<User>.Filter.Eq(u => u.Email, normalizedEmail)).FirstOrDefaultAsync();
    if (existing != null)
    {
        existing.Role = "Admin";
        existing.Status = "active";
        existing.IsDisabled = false;
        existing.FailedLoginAttempts = 0;
        existing.LockoutEndUtc = null;
        existing.Name = name;
        existing.PasswordHash = hasher.HashPassword(existing, password);
        existing.UpdatedAt = DateTime.UtcNow;

        await usersCollection.ReplaceOneAsync(Builders<User>.Filter.Eq(u => u.Id, existing.Id), existing);

        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine($"[SUCCESS] Admin user '{normalizedEmail}' updated successfully for website tenant '{website.WebsiteId}' in database '{website.DatabaseName}'.");
        Console.ResetColor();
    }
    else
    {
        var newUser = new User
        {
            Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
            WebsiteId = website.WebsiteId,
            Name = name,
            Email = normalizedEmail,
            Role = "Admin",
            Status = "active",
            IsDisabled = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        newUser.PasswordHash = hasher.HashPassword(newUser, password);

        await usersCollection.InsertOneAsync(newUser);

        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine($"[SUCCESS] Admin user '{normalizedEmail}' created successfully for website tenant '{website.WebsiteId}' in database '{website.DatabaseName}'.");
        Console.ResetColor();
    }
}

static async Task MigrateAdminsAsync(MongoClient mongoClient)
{
    Console.WriteLine("[INFO] Connecting to legacy shared database 'tours70'...");
    var oldDb = mongoClient.GetDatabase("tours70");
    var oldUsersColl = oldDb.GetCollection<User>("users");

    var oldAdmins = await oldUsersColl.Find(Builders<User>.Filter.Or(
        Builders<User>.Filter.Eq(u => u.Role, "Admin"),
        Builders<User>.Filter.Eq(u => u.Role, "admin"),
        Builders<User>.Filter.Eq(u => u.Role, "SuperAdmin")
    )).ToListAsync();

    Console.WriteLine($"[INFO] Found {oldAdmins.Count} admin account(s) in 'tours70'.");

    foreach (var site in WebsiteRegistry.SitesById.Values)
    {
        var targetDb = mongoClient.GetDatabase(site.DatabaseName);
        var targetUsers = targetDb.GetCollection<User>("users");
        int count = 0;

        foreach (var oldAdmin in oldAdmins)
        {
            var normalizedEmail = oldAdmin.Email.Trim().ToLowerInvariant();
            var existing = await targetUsers.Find(Builders<User>.Filter.Eq(u => u.Email, normalizedEmail)).FirstOrDefaultAsync();

            if (existing == null)
            {
                var copy = new User
                {
                    Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
                    WebsiteId = site.WebsiteId,
                    Name = oldAdmin.Name,
                    Email = normalizedEmail,
                    Phone = oldAdmin.Phone,
                    Role = "Admin",
                    Status = "active",
                    IsDisabled = false,
                    PasswordHash = oldAdmin.PasswordHash, // Preserving existing hash!
                    CreatedAt = oldAdmin.CreatedAt != default ? oldAdmin.CreatedAt : DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await targetUsers.InsertOneAsync(copy);
                count++;
            }
        }

        Console.WriteLine($"[SUCCESS] Copied {count} admin(s) into database '{site.DatabaseName}'.");
    }

    Console.ForegroundColor = ConsoleColor.Green;
    Console.WriteLine("[SUCCESS] Migration complete.");
    Console.ResetColor();
}

static string? GetArgValue(string[] args, string name)
{
    for (int i = 0; i < args.Length; i++)
    {
        if (args[i].StartsWith($"{name}=", StringComparison.OrdinalIgnoreCase))
        {
            return args[i].Substring(name.Length + 1).Trim();
        }
        if (string.Equals(args[i], name, StringComparison.OrdinalIgnoreCase) && i + 1 < args.Length)
        {
            return args[i + 1].Trim();
        }
    }
    return null;
}