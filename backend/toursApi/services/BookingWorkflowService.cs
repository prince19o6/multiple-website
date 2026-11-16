using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using ToursApi.Configuration;
using ToursApi.Models;
using ToursApi.Repositories;

namespace ToursApi.Services;

public class WorkflowTransitionException : Exception
{
    public string CurrentStatus { get; }
    public string TargetStatus { get; }

    public WorkflowTransitionException(string currentStatus, string targetStatus, string message)
        : base(message)
    {
        CurrentStatus = currentStatus;
        TargetStatus = targetStatus;
    }
}

public interface IBookingWorkflowService
{
    Task<Booking> ProcessNewBookingAsync(Booking booking, WebsiteConfig site, string webAppBaseUrl);
    Task<Booking> ConfirmBookingAsync(string bookingIdOrRef, string actorRole, string actorId, string? note, WebsiteConfig site, string webAppBaseUrl);
    Task<Booking> RejectBookingAsync(string bookingIdOrRef, string reason, string actorRole, string actorId, string? note, WebsiteConfig site);
    Task<Booking> CancelBookingAsync(string bookingIdOrRef, string reason, string actorRole, string actorId, string? note, WebsiteConfig site);
    Task<Booking> ExpireBookingAsync(string bookingIdOrRef, WebsiteConfig site);
    Task<Booking> CompleteBookingAsync(string bookingIdOrRef, string actorRole, string actorId, string? note, WebsiteConfig site);
    Task<Booking> SubmitCancellationRequestAsync(string bookingIdOrRef, string reason, string guestEmail, WebsiteConfig site, string webAppBaseUrl);
    Task<Booking> ReviewCancellationRequestAsync(string bookingIdOrRef, bool approve, string? adminNote, string adminId, WebsiteConfig site, string webAppBaseUrl);
    Task<InboxCountsDto> GetInboxCountsAsync();
    Task ResendEmailAsync(string bookingIdOrRef, string? template, string? recipientOverride, WebsiteConfig site, string webAppBaseUrl);
}

public class BookingWorkflowService : IBookingWorkflowService
{
    private readonly IBookingRepository _bookingRepo;
    private readonly IEmailOutboxService _outboxService;
    private readonly INotificationService _notificationService;
    private readonly IActionTokenService _actionTokenService;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<BookingWorkflowService> _logger;

    public BookingWorkflowService(
        IBookingRepository bookingRepo,
        IEmailOutboxService outboxService,
        INotificationService notificationService,
        IActionTokenService actionTokenService,
        IServiceProvider serviceProvider,
        ILogger<BookingWorkflowService> logger)
    {
        _bookingRepo = bookingRepo;
        _outboxService = outboxService;
        _notificationService = notificationService;
        _actionTokenService = actionTokenService;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    private static bool IsValidTransition(string current, string target)
    {
        var cur = current.Trim().ToLowerInvariant();
        var tgt = target.Trim().ToLowerInvariant();

        if (cur == tgt) return true; // Idempotent same-state check handled separately

        if (cur == BookingStatus.Pending)
        {
            return tgt == BookingStatus.Confirmed ||
                   tgt == BookingStatus.Rejected ||
                   tgt == BookingStatus.Expired ||
                   tgt == BookingStatus.Cancelled;
        }

        if (cur == BookingStatus.Confirmed)
        {
            return tgt == BookingStatus.Cancelled ||
                   tgt == BookingStatus.Completed;
        }

        // Cancelled, Rejected, Expired, Completed are final states
        return false;
    }

    // ─── 1. New Booking Initialization & Workflow Dispatch ───────────────────────
    public async Task<Booking> ProcessNewBookingAsync(Booking booking, WebsiteConfig site, string webAppBaseUrl)
    {
        // Enforce approval policy: If requireApproval is true, status starts as Pending.
        // If requireApproval is false, auto-confirm immediately.
        if (site.RequireApproval)
        {
            booking.Status = BookingStatus.Pending;
        }
        else
        {
            booking.Status = BookingStatus.Confirmed;
        }

        booking.StatusHistory = new List<BookingStatusHistoryItem>
        {
            new()
            {
                Status = booking.Status,
                PreviousStatus = null,
                ChangedAt = DateTime.UtcNow,
                Action = "create",
                Note = $"Booking reservation submitted via {booking.Source}",
                ActorRole = "customer",
                ActorId = booking.UserId,
                ChangedBy = booking.GuestName
            }
        };

        await _bookingRepo.CreateAsync(booking);

        var tourTitle = booking.Snapshot?.Title ?? booking.TourName;
        var currency = booking.Snapshot?.Currency ?? site.CurrencySymbol;

        try
        {
            if (booking.Status == BookingStatus.Pending)
            {
                // A. Customer: Booking Received notification & email
                await _outboxService.EnqueueAsync(
                    websiteId: site.WebsiteId,
                    recipientEmail: booking.Email,
                    recipientName: booking.GuestName,
                    subject: $"Booking Request Received: {tourTitle} [{booking.Reference}]",
                    template: EmailTemplateNames.CustomerBookingReceived,
                    payload: new { bookingId = booking.Id, reference = booking.Reference },
                    bookingId: booking.Id,
                    bookingReference: booking.Reference
                );

                await _notificationService.CreateNotificationAsync(
                    websiteId: site.WebsiteId,
                    userId: booking.UserId,
                    userEmail: booking.Email,
                    title: "Reservation Received",
                    message: $"Your booking request for '{tourTitle}' (Ref: {booking.Reference}) is pending confirmation.",
                    type: "booking_status",
                    status: BookingStatus.Pending,
                    bookingId: booking.Id,
                    bookingReference: booking.Reference
                );

                // B. Admin: Generate single-use signed action links & enqueue admin alert
                var approveToken = _actionTokenService.GenerateToken(booking, "approve", site);
                var rejectToken = _actionTokenService.GenerateToken(booking, "reject", site);

                var cleanWebUrl = webAppBaseUrl.TrimEnd('/');
                var approveUrl = $"{cleanWebUrl}/booking-action/approve?token={Uri.EscapeDataString(approveToken)}";
                var rejectUrl = $"{cleanWebUrl}/booking-action/reject?token={Uri.EscapeDataString(rejectToken)}";

                var adminRecipients = site.AdminNotificationEmails.Count > 0
                    ? site.AdminNotificationEmails
                    : new List<string> { site.EmailFromAddress };

                foreach (var adminEmail in adminRecipients)
                {
                    if (!string.IsNullOrWhiteSpace(adminEmail))
                    {
                        await _outboxService.EnqueueAsync(
                            websiteId: site.WebsiteId,
                            recipientEmail: adminEmail,
                            recipientName: $"{site.SiteName} Operations",
                            subject: $"[ACTION REQUIRED] New Booking {booking.Reference} - {booking.GuestName} ({currency}{booking.TotalPrice:N2})",
                            template: EmailTemplateNames.AdminNewBookingAlert,
                            payload: new
                            {
                                bookingId = booking.Id,
                                reference = booking.Reference,
                                approveUrl,
                                rejectUrl
                            },
                            bookingId: booking.Id,
                            bookingReference: booking.Reference
                        );
                    }
                }
            }
            else if (booking.Status == BookingStatus.Confirmed)
            {
                // Auto-confirmed path
                await _outboxService.EnqueueAsync(
                    websiteId: site.WebsiteId,
                    recipientEmail: booking.Email,
                    recipientName: booking.GuestName,
                    subject: $"Booking Confirmed: {tourTitle} [{booking.Reference}]",
                    template: EmailTemplateNames.CustomerBookingConfirmed,
                    payload: new { bookingId = booking.Id, reference = booking.Reference, webAppBaseUrl },
                    bookingId: booking.Id,
                    bookingReference: booking.Reference
                );

                await _notificationService.CreateNotificationAsync(
                    websiteId: site.WebsiteId,
                    userId: booking.UserId,
                    userEmail: booking.Email,
                    title: "Reservation Confirmed",
                    message: $"Your booking for '{tourTitle}' (Ref: {booking.Reference}) has been confirmed! E-Ticket is ready.",
                    type: "booking_status",
                    status: BookingStatus.Confirmed,
                    bookingId: booking.Id,
                    bookingReference: booking.Reference
                );
            }
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "[BookingWorkflowService.ProcessNewBookingAsync] Failed to enqueue notifications/emails for booking {Ref}. Booking creation remains successful.", booking.Reference);
        }

        return booking;
    }

    // ─── 2. Confirm (Approve) Booking ───────────────────────────────────────────
    public async Task<Booking> ConfirmBookingAsync(
        string bookingIdOrRef,
        string actorRole,
        string actorId,
        string? note,
        WebsiteConfig site,
        string webAppBaseUrl)
    {
        var booking = await _bookingRepo.GetByIdAsync(bookingIdOrRef)
            ?? await _bookingRepo.GetByReferenceAsync(bookingIdOrRef)
            ?? throw new KeyNotFoundException($"Booking '{bookingIdOrRef}' not found.");

        // Idempotency: If already confirmed, return success without duplicating side-effects
        if (string.Equals(booking.Status, BookingStatus.Confirmed, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogInformation("[WORKFLOW-IDEMPOTENT] Booking '{Ref}' is already Confirmed.", booking.Reference);
            return booking;
        }

        if (!IsValidTransition(booking.Status, BookingStatus.Confirmed))
        {
            throw new WorkflowTransitionException(
                booking.Status,
                BookingStatus.Confirmed,
                $"Cannot confirm booking in '{booking.Status}' status. Only 'pending' bookings may be confirmed."
            );
        }

        var prevStatus = booking.Status;
        booking.Status = BookingStatus.Confirmed;
        booking.UpdatedAt = DateTime.UtcNow;

        booking.StatusHistory.Add(new BookingStatusHistoryItem
        {
            Status = BookingStatus.Confirmed,
            PreviousStatus = prevStatus,
            ChangedAt = DateTime.UtcNow,
            Action = "confirm",
            Note = note ?? "Reservation approved by administrator",
            ActorRole = actorRole,
            ActorId = actorId,
            ChangedBy = actorId
        });

        await _bookingRepo.UpdateAsync(booking.Id!, booking);

        var tourTitle = booking.Snapshot?.Title ?? booking.TourName;

        // Queue Customer Confirmed Email
        await _outboxService.EnqueueAsync(
            websiteId: site.WebsiteId,
            recipientEmail: booking.Email,
            recipientName: booking.GuestName,
            subject: $"Booking Confirmed: {tourTitle} [{booking.Reference}]",
            template: EmailTemplateNames.CustomerBookingConfirmed,
            payload: new { bookingId = booking.Id, reference = booking.Reference, webAppBaseUrl },
            bookingId: booking.Id,
            bookingReference: booking.Reference
        );

        // In-App Notification
        await _notificationService.CreateNotificationAsync(
            websiteId: site.WebsiteId,
            userId: booking.UserId,
            userEmail: booking.Email,
            title: "Booking Confirmed! 🎉",
            message: $"Your reservation for '{tourTitle}' (Ref: {booking.Reference}) is confirmed. Your e-ticket & QR check-in voucher are unlocked.",
            type: "booking_status",
            status: BookingStatus.Confirmed,
            bookingId: booking.Id,
            bookingReference: booking.Reference
        );

        _logger.LogInformation("[WORKFLOW] Booking '{Ref}' confirmed by {Actor} ({Role})", booking.Reference, actorId, actorRole);
        return booking;
    }

    // ─── 3. Reject Booking ───────────────────────────────────────────────────────
    public async Task<Booking> RejectBookingAsync(
        string bookingIdOrRef,
        string reason,
        string actorRole,
        string actorId,
        string? note,
        WebsiteConfig site)
    {
        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new ArgumentException("A rejection reason is required.", nameof(reason));
        }

        var booking = await _bookingRepo.GetByIdAsync(bookingIdOrRef)
            ?? await _bookingRepo.GetByReferenceAsync(bookingIdOrRef)
            ?? throw new KeyNotFoundException($"Booking '{bookingIdOrRef}' not found.");

        // Idempotency: If already rejected, return success
        if (string.Equals(booking.Status, BookingStatus.Rejected, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogInformation("[WORKFLOW-IDEMPOTENT] Booking '{Ref}' is already Rejected.", booking.Reference);
            return booking;
        }

        if (!IsValidTransition(booking.Status, BookingStatus.Rejected))
        {
            throw new WorkflowTransitionException(
                booking.Status,
                BookingStatus.Rejected,
                $"Cannot reject booking in '{booking.Status}' status. Only 'pending' bookings may be rejected."
            );
        }

        var prevStatus = booking.Status;
        booking.Status = BookingStatus.Rejected;
        booking.UpdatedAt = DateTime.UtcNow;

        booking.StatusHistory.Add(new BookingStatusHistoryItem
        {
            Status = BookingStatus.Rejected,
            PreviousStatus = prevStatus,
            ChangedAt = DateTime.UtcNow,
            Action = "reject",
            Reason = reason.Trim(),
            Note = note ?? $"Rejected by administrator: {reason.Trim()}",
            ActorRole = actorRole,
            ActorId = actorId,
            ChangedBy = actorId
        });

        await _bookingRepo.UpdateAsync(booking.Id!, booking);

        var tourTitle = booking.Snapshot?.Title ?? booking.TourName;

        // Queue Customer Rejected Email
        await _outboxService.EnqueueAsync(
            websiteId: site.WebsiteId,
            recipientEmail: booking.Email,
            recipientName: booking.GuestName,
            subject: $"Update regarding your reservation: {booking.Reference}",
            template: EmailTemplateNames.CustomerBookingRejected,
            payload: new { bookingId = booking.Id, reference = booking.Reference, reason = reason.Trim() },
            bookingId: booking.Id,
            bookingReference: booking.Reference
        );

        // In-App Notification
        await _notificationService.CreateNotificationAsync(
            websiteId: site.WebsiteId,
            userId: booking.UserId,
            userEmail: booking.Email,
            title: "Booking Request Update",
            message: $"Your booking for '{tourTitle}' (Ref: {booking.Reference}) could not be confirmed. Reason: {reason.Trim()}",
            type: "booking_status",
            status: BookingStatus.Rejected,
            bookingId: booking.Id,
            bookingReference: booking.Reference
        );

        _logger.LogInformation("[WORKFLOW] Booking '{Ref}' rejected by {Actor} ({Role}). Reason: {Reason}", booking.Reference, actorId, actorRole, reason);

        // Release inventory if item holds reserved capacity
        await ReleaseInventoryOnCancellationAsync(booking);

        return booking;
    }

    // ─── 4. Cancel Booking ───────────────────────────────────────────────────────
    public async Task<Booking> CancelBookingAsync(
        string bookingIdOrRef,
        string reason,
        string actorRole,
        string actorId,
        string? note,
        WebsiteConfig site)
    {
        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new ArgumentException("A cancellation reason is required.", nameof(reason));
        }

        var booking = await _bookingRepo.GetByIdAsync(bookingIdOrRef)
            ?? await _bookingRepo.GetByReferenceAsync(bookingIdOrRef)
            ?? throw new KeyNotFoundException($"Booking '{bookingIdOrRef}' not found.");

        // Idempotency: If already cancelled, return success
        if (string.Equals(booking.Status, BookingStatus.Cancelled, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogInformation("[WORKFLOW-IDEMPOTENT] Booking '{Ref}' is already Cancelled.", booking.Reference);
            return booking;
        }

        if (!IsValidTransition(booking.Status, BookingStatus.Cancelled))
        {
            throw new WorkflowTransitionException(
                booking.Status,
                BookingStatus.Cancelled,
                $"Cannot cancel booking in '{booking.Status}' status. Only 'pending' or 'confirmed' bookings may be cancelled."
            );
        }

        var prevStatus = booking.Status;
        booking.Status = BookingStatus.Cancelled;
        booking.UpdatedAt = DateTime.UtcNow;

        if (booking.CancellationRequest != null)
        {
            booking.CancellationRequest.Status = "approved";
            booking.CancellationRequest.ReviewedAt = DateTime.UtcNow;
            booking.CancellationRequest.ReviewerId = actorId;
        }

        booking.StatusHistory.Add(new BookingStatusHistoryItem
        {
            Status = BookingStatus.Cancelled,
            PreviousStatus = prevStatus,
            ChangedAt = DateTime.UtcNow,
            Action = "cancel",
            Reason = reason.Trim(),
            Note = note ?? $"Reservation cancelled: {reason.Trim()}",
            ActorRole = actorRole,
            ActorId = actorId,
            ChangedBy = actorId
        });

        await _bookingRepo.UpdateAsync(booking.Id!, booking);

        var tourTitle = booking.Snapshot?.Title ?? booking.TourName;

        // Queue Customer Cancelled Email
        await _outboxService.EnqueueAsync(
            websiteId: site.WebsiteId,
            recipientEmail: booking.Email,
            recipientName: booking.GuestName,
            subject: $"Booking Cancelled: {booking.Reference} - {site.SiteName}",
            template: EmailTemplateNames.CustomerBookingCancelled,
            payload: new { bookingId = booking.Id, reference = booking.Reference, reason = reason.Trim() },
            bookingId: booking.Id,
            bookingReference: booking.Reference
        );

        // In-App Notification
        await _notificationService.CreateNotificationAsync(
            websiteId: site.WebsiteId,
            userId: booking.UserId,
            userEmail: booking.Email,
            title: "Reservation Cancelled",
            message: $"Your booking for '{tourTitle}' (Ref: {booking.Reference}) has been cancelled.",
            type: "booking_status",
            status: BookingStatus.Cancelled,
            bookingId: booking.Id,
            bookingReference: booking.Reference
        );

        _logger.LogInformation("[WORKFLOW] Booking '{Ref}' cancelled by {Actor} ({Role}). Reason: {Reason}", booking.Reference, actorId, actorRole, reason);

        // Release inventory if item holds reserved capacity
        await ReleaseInventoryOnCancellationAsync(booking);

        return booking;
    }

    private async Task ReleaseInventoryOnCancellationAsync(Booking booking)
    {
        if (string.Equals(booking.ServiceType, "flight", StringComparison.OrdinalIgnoreCase) ||
            (booking.Items != null && booking.Items.Any(i => string.Equals(i.ServiceType, "flight", StringComparison.OrdinalIgnoreCase))))
        {
            try
            {
                var flightRepo = _serviceProvider.GetService<IFlightRepository>();
                if (flightRepo != null)
                {
                    var flightIdOrSlug = booking.Items?.FirstOrDefault(i => string.Equals(i.ServiceType, "flight", StringComparison.OrdinalIgnoreCase))?.ServiceId
                        ?? (!string.IsNullOrWhiteSpace(booking.TourSlug) ? booking.TourSlug : booking.TourId.ToString());

                    var flight = await flightRepo.GetFlightByIdAsync(flightIdOrSlug)
                        ?? await flightRepo.GetFlightBySlugAsync(flightIdOrSlug);

                    if (flight != null && !string.IsNullOrEmpty(flight.Id))
                    {
                        var seatsToRelease = booking.Travelers > 0 ? booking.Travelers : 1;
                        flight.AvailableSeats += seatsToRelease;
                        await flightRepo.UpdateFlightAsync(flight.Id, flight);
                        _logger.LogInformation("[INVENTORY] Restored {Seats} seats for flight '{FlightNumber}' on booking '{Ref}' cancellation",
                            seatsToRelease, flight.FlightNumber, booking.Reference);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[INVENTORY] Could not restore flight inventory for booking '{Ref}'", booking.Reference);
            }
        }
    }

    // ─── 5. Expire Booking (Background Job) ──────────────────────────────────────
    public async Task<Booking> ExpireBookingAsync(string bookingIdOrRef, WebsiteConfig site)
    {
        var booking = await _bookingRepo.GetByIdAsync(bookingIdOrRef)
            ?? await _bookingRepo.GetByReferenceAsync(bookingIdOrRef)
            ?? throw new KeyNotFoundException($"Booking '{bookingIdOrRef}' not found.");

        if (string.Equals(booking.Status, BookingStatus.Expired, StringComparison.OrdinalIgnoreCase))
        {
            return booking;
        }

        if (!IsValidTransition(booking.Status, BookingStatus.Expired))
        {
            throw new WorkflowTransitionException(
                booking.Status,
                BookingStatus.Expired,
                $"Cannot expire booking in '{booking.Status}' status."
            );
        }

        var prevStatus = booking.Status;
        booking.Status = BookingStatus.Expired;
        booking.UpdatedAt = DateTime.UtcNow;

        booking.StatusHistory.Add(new BookingStatusHistoryItem
        {
            Status = BookingStatus.Expired,
            PreviousStatus = prevStatus,
            ChangedAt = DateTime.UtcNow,
            Action = "expire",
            Reason = $"Request expired after {site.PendingExpiryHours} hours without approval.",
            Note = "Automated system expiry sweep",
            ActorRole = "system",
            ActorId = "system-expiry-daemon",
            ChangedBy = "system"
        });

        await _bookingRepo.UpdateAsync(booking.Id!, booking);

        var tourTitle = booking.Snapshot?.Title ?? booking.TourName;

        // Queue Customer Expired Email
        await _outboxService.EnqueueAsync(
            websiteId: site.WebsiteId,
            recipientEmail: booking.Email,
            recipientName: booking.GuestName,
            subject: $"Booking Request Expired: {booking.Reference}",
            template: EmailTemplateNames.CustomerBookingExpired,
            payload: new { bookingId = booking.Id, reference = booking.Reference },
            bookingId: booking.Id,
            bookingReference: booking.Reference
        );

        // In-App Notification
        await _notificationService.CreateNotificationAsync(
            websiteId: site.WebsiteId,
            userId: booking.UserId,
            userEmail: booking.Email,
            title: "Reservation Request Expired",
            message: $"Your pending request for '{tourTitle}' (Ref: {booking.Reference}) has expired. No charges were captured.",
            type: "booking_status",
            status: BookingStatus.Expired,
            bookingId: booking.Id,
            bookingReference: booking.Reference
        );

        _logger.LogInformation("[WORKFLOW] Booking '{Ref}' moved to Expired by system daemon.", booking.Reference);
        return booking;
    }

    // ─── 6. Complete Booking ────────────────────────────────────────────────────
    public async Task<Booking> CompleteBookingAsync(
        string bookingIdOrRef,
        string actorRole,
        string actorId,
        string? note,
        WebsiteConfig site)
    {
        var booking = await _bookingRepo.GetByIdAsync(bookingIdOrRef)
            ?? await _bookingRepo.GetByReferenceAsync(bookingIdOrRef)
            ?? throw new KeyNotFoundException($"Booking '{bookingIdOrRef}' not found.");

        if (string.Equals(booking.Status, BookingStatus.Completed, StringComparison.OrdinalIgnoreCase))
        {
            return booking;
        }

        if (!IsValidTransition(booking.Status, BookingStatus.Completed))
        {
            throw new WorkflowTransitionException(
                booking.Status,
                BookingStatus.Completed,
                $"Cannot complete booking in '{booking.Status}' status. Only 'confirmed' bookings may be completed."
            );
        }

        var prevStatus = booking.Status;
        booking.Status = BookingStatus.Completed;
        booking.UpdatedAt = DateTime.UtcNow;

        booking.StatusHistory.Add(new BookingStatusHistoryItem
        {
            Status = BookingStatus.Completed,
            PreviousStatus = prevStatus,
            ChangedAt = DateTime.UtcNow,
            Action = "complete",
            Note = note ?? "Tour completed successfully",
            ActorRole = actorRole,
            ActorId = actorId,
            ChangedBy = actorId
        });

        await _bookingRepo.UpdateAsync(booking.Id!, booking);
        _logger.LogInformation("[WORKFLOW] Booking '{Ref}' marked Completed by {Actor}", booking.Reference, actorId);
        return booking;
    }

    // ─── 7. Customer: Request Cancellation ──────────────────────────────────────
    public async Task<Booking> SubmitCancellationRequestAsync(
        string bookingIdOrRef,
        string reason,
        string guestEmail,
        WebsiteConfig site,
        string webAppBaseUrl)
    {
        var booking = await _bookingRepo.GetByIdAsync(bookingIdOrRef)
            ?? await _bookingRepo.GetByReferenceAsync(bookingIdOrRef)
            ?? throw new KeyNotFoundException($"Booking '{bookingIdOrRef}' not found.");

        if (booking.Status == BookingStatus.Cancelled ||
            booking.Status == BookingStatus.Rejected ||
            booking.Status == BookingStatus.Expired)
        {
            throw new InvalidOperationException($"Cannot request cancellation for booking already in '{booking.Status}' status.");
        }

        booking.CancellationRequest = new BookingCancellationRequest
        {
            RequestedAt = DateTime.UtcNow,
            Reason = reason.Trim(),
            RequestedByEmail = guestEmail.Trim(),
            Status = "pending"
        };
        booking.UpdatedAt = DateTime.UtcNow;

        booking.StatusHistory.Add(new BookingStatusHistoryItem
        {
            Status = booking.Status,
            PreviousStatus = booking.Status,
            ChangedAt = DateTime.UtcNow,
            Action = "request_cancellation",
            Reason = reason.Trim(),
            Note = $"Customer submitted cancellation request: {reason.Trim()}",
            ActorRole = "customer",
            ActorId = booking.UserId,
            ChangedBy = booking.GuestName
        });

        await _bookingRepo.UpdateAsync(booking.Id!, booking);

        // A. Customer notification & acknowledgement email
        await _outboxService.EnqueueAsync(
            websiteId: site.WebsiteId,
            recipientEmail: booking.Email,
            recipientName: booking.GuestName,
            subject: $"Cancellation Request Received: {booking.Reference}",
            template: EmailTemplateNames.CustomerCancellationRequestReceived,
            payload: new { bookingId = booking.Id, reference = booking.Reference, reason = reason.Trim() },
            bookingId: booking.Id,
            bookingReference: booking.Reference
        );

        await _notificationService.CreateNotificationAsync(
            websiteId: site.WebsiteId,
            userId: booking.UserId,
            userEmail: booking.Email,
            title: "Cancellation Request Logged",
            message: $"Your cancellation request for Ref {booking.Reference} has been sent to our concierge desk for review.",
            type: "cancellation",
            status: booking.Status,
            bookingId: booking.Id,
            bookingReference: booking.Reference
        );

        // B. Admin alert email
        var inboxUrl = $"{webAppBaseUrl.TrimEnd('/')}/admin/bookings";
        var adminRecipients = site.AdminNotificationEmails.Count > 0
            ? site.AdminNotificationEmails
            : new List<string> { site.EmailFromAddress };

        foreach (var adminEmail in adminRecipients)
        {
            if (!string.IsNullOrWhiteSpace(adminEmail))
            {
                await _outboxService.EnqueueAsync(
                    websiteId: site.WebsiteId,
                    recipientEmail: adminEmail,
                    recipientName: $"{site.SiteName} Operations",
                    subject: $"[CANCELLATION REQUEST] {booking.Reference} - {booking.GuestName}",
                    template: EmailTemplateNames.AdminCancellationRequestAlert,
                    payload: new { bookingId = booking.Id, reference = booking.Reference, reason = reason.Trim(), inboxUrl },
                    bookingId: booking.Id,
                    bookingReference: booking.Reference
                );
            }
        }

        return booking;
    }

    // ─── 8. Review Customer Cancellation Request ────────────────────────────────
    public async Task<Booking> ReviewCancellationRequestAsync(
        string bookingIdOrRef,
        bool approve,
        string? adminNote,
        string adminId,
        WebsiteConfig site,
        string webAppBaseUrl)
    {
        var booking = await _bookingRepo.GetByIdAsync(bookingIdOrRef)
            ?? await _bookingRepo.GetByReferenceAsync(bookingIdOrRef)
            ?? throw new KeyNotFoundException($"Booking '{bookingIdOrRef}' not found.");

        if (booking.CancellationRequest == null)
        {
            throw new InvalidOperationException("No cancellation request exists for this reservation.");
        }

        if (approve)
        {
            return await CancelBookingAsync(
                booking.Id!,
                reason: booking.CancellationRequest.Reason,
                actorRole: "admin",
                actorId: adminId,
                note: adminNote ?? "Customer cancellation request approved by admin",
                site: site
            );
        }
        else
        {
            booking.CancellationRequest.Status = "rejected";
            booking.CancellationRequest.ReviewedAt = DateTime.UtcNow;
            booking.CancellationRequest.ReviewerId = adminId;
            booking.CancellationRequest.AdminResponseNote = adminNote;
            booking.UpdatedAt = DateTime.UtcNow;

            booking.StatusHistory.Add(new BookingStatusHistoryItem
            {
                Status = booking.Status,
                PreviousStatus = booking.Status,
                ChangedAt = DateTime.UtcNow,
                Action = "reject_cancellation_request",
                Reason = adminNote ?? "Cancellation request declined as per policy",
                Note = "Admin rejected customer cancellation request",
                ActorRole = "admin",
                ActorId = adminId,
                ChangedBy = adminId
            });

            await _bookingRepo.UpdateAsync(booking.Id!, booking);

            var tourTitle = booking.Snapshot?.Title ?? booking.TourName;
            await _notificationService.CreateNotificationAsync(
                websiteId: site.WebsiteId,
                userId: booking.UserId,
                userEmail: booking.Email,
                title: "Cancellation Request Declined",
                message: $"Your cancellation request for '{tourTitle}' (Ref: {booking.Reference}) could not be approved. {adminNote}",
                type: "cancellation",
                status: booking.Status,
                bookingId: booking.Id,
                bookingReference: booking.Reference
            );

            return booking;
        }
    }

    // ─── 9. Inbox Counts per Status ─────────────────────────────────────────────
    public async Task<InboxCountsDto> GetInboxCountsAsync()
    {
        var all = (await _bookingRepo.GetAllAsync()).ToList();

        return new InboxCountsDto
        {
            Pending = all.Count(b => string.Equals(b.Status, BookingStatus.Pending, StringComparison.OrdinalIgnoreCase)),
            Confirmed = all.Count(b => string.Equals(b.Status, BookingStatus.Confirmed, StringComparison.OrdinalIgnoreCase)),
            Cancelled = all.Count(b => string.Equals(b.Status, BookingStatus.Cancelled, StringComparison.OrdinalIgnoreCase)),
            Completed = all.Count(b => string.Equals(b.Status, BookingStatus.Completed, StringComparison.OrdinalIgnoreCase)),
            Rejected = all.Count(b => string.Equals(b.Status, BookingStatus.Rejected, StringComparison.OrdinalIgnoreCase)),
            Expired = all.Count(b => string.Equals(b.Status, BookingStatus.Expired, StringComparison.OrdinalIgnoreCase)),
            CancellationRequests = all.Count(b => b.CancellationRequest != null && string.Equals(b.CancellationRequest.Status, "pending", StringComparison.OrdinalIgnoreCase)),
            Total = all.Count
        };
    }

    // ─── 10. Resend Email Action ────────────────────────────────────────────────
    public async Task ResendEmailAsync(
        string bookingIdOrRef,
        string? template,
        string? recipientOverride,
        WebsiteConfig site,
        string webAppBaseUrl)
    {
        var booking = await _bookingRepo.GetByIdAsync(bookingIdOrRef)
            ?? await _bookingRepo.GetByReferenceAsync(bookingIdOrRef)
            ?? throw new KeyNotFoundException($"Booking '{bookingIdOrRef}' not found.");

        var targetEmail = !string.IsNullOrWhiteSpace(recipientOverride) ? recipientOverride.Trim() : booking.Email;
        var chosenTemplate = !string.IsNullOrWhiteSpace(template)
            ? template.Trim()
            : (booking.Status == BookingStatus.Confirmed
                ? EmailTemplateNames.CustomerBookingConfirmed
                : EmailTemplateNames.CustomerBookingReceived);

        var tourTitle = booking.Snapshot?.Title ?? booking.TourName;
        var subject = chosenTemplate == EmailTemplateNames.CustomerBookingConfirmed
            ? $"[Resent] Booking Confirmed: {tourTitle} [{booking.Reference}]"
            : $"[Resent] Booking Update: {tourTitle} [{booking.Reference}]";

        await _outboxService.EnqueueAsync(
            websiteId: site.WebsiteId,
            recipientEmail: targetEmail,
            recipientName: booking.GuestName,
            subject: subject,
            template: chosenTemplate,
            payload: new
            {
                bookingId = booking.Id,
                reference = booking.Reference,
                webAppBaseUrl,
                reason = "Email resent by administrative request"
            },
            bookingId: booking.Id,
            bookingReference: booking.Reference
        );

        _logger.LogInformation("[WORKFLOW] Resent email template '{Tpl}' for booking '{Ref}' to '{To}'", chosenTemplate, booking.Reference, targetEmail);
    }
}
