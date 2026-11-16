using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using ToursApi.Configuration;
using ToursApi.Controllers;
using ToursApi.Models;
using ToursApi.Repositories;
using ToursApi.Services;
using Xunit;

namespace ToursApi.Tests;

public class BookingWorkflowTests
{
    private readonly WebsiteConfig _site;
    private readonly Mock<IBookingRepository> _mockBookingRepo;
    private readonly Mock<IEmailOutboxService> _mockOutboxService;
    private readonly Mock<INotificationService> _mockNotificationService;
    private readonly Mock<IActionTokenService> _mockActionTokenService;
    private readonly Mock<ILogger<BookingWorkflowService>> _mockLogger;
    private readonly BookingWorkflowService _workflowService;

    public BookingWorkflowTests()
    {
        _site = WebsiteRegistry.Resolve("gujjutours")!;
        _mockBookingRepo = new Mock<IBookingRepository>();
        _mockOutboxService = new Mock<IEmailOutboxService>();
        _mockNotificationService = new Mock<INotificationService>();
        _mockActionTokenService = new Mock<IActionTokenService>();
        _mockLogger = new Mock<ILogger<BookingWorkflowService>>();

        var mockServiceProvider = new Mock<IServiceProvider>();

        _workflowService = new BookingWorkflowService(
            _mockBookingRepo.Object,
            _mockOutboxService.Object,
            _mockNotificationService.Object,
            _mockActionTokenService.Object,
            mockServiceProvider.Object,
            _mockLogger.Object
        );
    }

    [Fact]
    public async Task ProcessNewBooking_WhenApprovalRequired_SetsStatusToPending_AndEnqueuesAdminAlert()
    {
        // Arrange
        var booking = new Booking
        {
            Id = "bkg-101",
            Reference = "GT-TEST-101",
            TourName = "Dubai City Tour",
            GuestName = "Aarav Patel",
            Email = "aarav@example.com",
            TotalPrice = 5000,
            UserId = "user-101",
            Source = "mobile_app"
        };

        _mockActionTokenService
            .Setup(s => s.GenerateToken(It.IsAny<Booking>(), "approve", It.IsAny<WebsiteConfig>(), It.IsAny<TimeSpan?>()))
            .Returns("token-approve-123");
        _mockActionTokenService
            .Setup(s => s.GenerateToken(It.IsAny<Booking>(), "reject", It.IsAny<WebsiteConfig>(), It.IsAny<TimeSpan?>()))
            .Returns("token-reject-123");

        // Act
        var result = await _workflowService.ProcessNewBookingAsync(booking, _site, "https://gujjutours.com");

        // Assert
        Assert.Equal(BookingStatus.Pending, result.Status);
        Assert.Single(result.StatusHistory);
        Assert.Equal("create", result.StatusHistory[0].Action);

        // Verify saved to repository
        _mockBookingRepo.Verify(r => r.CreateAsync(booking), Times.Once);

        // Verify admin notification enqueued in outbox
        _mockOutboxService.Verify(o => o.EnqueueAsync(
            _site.WebsiteId,
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            EmailTemplateNames.AdminNewBookingAlert,
            It.IsAny<object>(),
            booking.Id,
            booking.Reference
        ), Times.AtLeastOnce);
    }

    [Fact]
    public async Task ConfirmBooking_FromPending_TransitionsToConfirmed_AndEnqueuesCustomerEmail()
    {
        // Arrange
        var booking = new Booking
        {
            Id = "bkg-202",
            Reference = "GT-CONF-202",
            Status = BookingStatus.Pending,
            TourName = "Desert Safari",
            GuestName = "Priya Shah",
            Email = "priya@example.com",
            TotalPrice = 7500,
            UserId = "user-202",
            StatusHistory = new List<BookingStatusHistoryItem>()
        };

        _mockBookingRepo
            .Setup(r => r.GetByIdAsync("bkg-202"))
            .ReturnsAsync(booking);

        // Act
        var result = await _workflowService.ConfirmBookingAsync(
            "bkg-202",
            "admin",
            "admin-1",
            "Payment verified manually",
            _site,
            "https://gujjutours.com"
        );

        // Assert
        Assert.Equal(BookingStatus.Confirmed, result.Status);
        _mockBookingRepo.Verify(r => r.UpdateAsync("bkg-202", booking), Times.Once);

        // Verify customer confirmed email enqueued
        _mockOutboxService.Verify(o => o.EnqueueAsync(
            _site.WebsiteId,
            "priya@example.com",
            "Priya Shah",
            It.Is<string>(s => s.Contains("Booking Confirmed")),
            EmailTemplateNames.CustomerBookingConfirmed,
            It.IsAny<object>(),
            booking.Id,
            booking.Reference
        ), Times.Once);

        // Verify in-app notification sent
        _mockNotificationService.Verify(n => n.CreateNotificationAsync(
            _site.WebsiteId,
            "user-202",
            "priya@example.com",
            It.IsAny<string>(),
            It.IsAny<string>(),
            "booking_status",
            BookingStatus.Confirmed,
            booking.Id,
            booking.Reference
        ), Times.Once);
    }

    [Fact]
    public async Task ConfirmBooking_WhenAlreadyConfirmed_IsIdempotent()
    {
        // Arrange
        var booking = new Booking
        {
            Id = "bkg-303",
            Reference = "GT-IDEMP-303",
            Status = BookingStatus.Confirmed,
            GuestName = "Priya Shah",
            Email = "priya@example.com"
        };

        _mockBookingRepo
            .Setup(r => r.GetByIdAsync("bkg-303"))
            .ReturnsAsync(booking);

        // Act
        var result = await _workflowService.ConfirmBookingAsync(
            "bkg-303",
            "admin",
            "admin-1",
            null,
            _site,
            "https://gujjutours.com"
        );

        // Assert: Returns same booking without re-updating repository or re-sending emails
        Assert.Equal(BookingStatus.Confirmed, result.Status);
        _mockBookingRepo.Verify(r => r.UpdateAsync(It.IsAny<string>(), It.IsAny<Booking>()), Times.Never);
        _mockOutboxService.Verify(o => o.EnqueueAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<object>(), It.IsAny<string>(), It.IsAny<string>()
        ), Times.Never);
    }

    [Fact]
    public async Task ConfirmBooking_FromCancelledState_ThrowsWorkflowTransitionException()
    {
        // Arrange: A cancelled booking cannot be confirmed directly
        var booking = new Booking
        {
            Id = "bkg-404",
            Reference = "GT-CANC-404",
            Status = BookingStatus.Cancelled,
            GuestName = "Kavita Dave",
            Email = "kavita@example.com"
        };

        _mockBookingRepo
            .Setup(r => r.GetByIdAsync("bkg-404"))
            .ReturnsAsync(booking);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<WorkflowTransitionException>(async () =>
        {
            await _workflowService.ConfirmBookingAsync(
                "bkg-404",
                "admin",
                "admin-1",
                null,
                _site,
                "https://gujjutours.com"
            );
        });

        Assert.Equal(BookingStatus.Cancelled, ex.CurrentStatus);
        Assert.Equal(BookingStatus.Confirmed, ex.TargetStatus);
    }

    [Fact]
    public async Task CancelBooking_FromConfirmedState_SucceedsWithReasonAndActor()
    {
        // Arrange
        var booking = new Booking
        {
            Id = "bkg-505",
            Reference = "GT-CANC-505",
            Status = BookingStatus.Confirmed,
            TourName = "Scuba Diving",
            GuestName = "Rohan Mehta",
            Email = "rohan@example.com",
            StatusHistory = new List<BookingStatusHistoryItem>()
        };

        _mockBookingRepo
            .Setup(r => r.GetByIdAsync("bkg-505"))
            .ReturnsAsync(booking);

        // Act
        var result = await _workflowService.CancelBookingAsync(
            "bkg-505",
            "Flight rescheduled by airline",
            "customer",
            "user-rohan",
            "User initiated cancellation",
            _site
        );

        // Assert
        Assert.Equal(BookingStatus.Cancelled, result.Status);
        Assert.Contains(result.StatusHistory, h => h.Reason == "Flight rescheduled by airline");
        _mockBookingRepo.Verify(r => r.UpdateAsync("bkg-505", booking), Times.Once);
    }

    [Fact]
    public async Task CancelBooking_WhenAlreadyCancelled_IsIdempotent()
    {
        // Arrange
        var booking = new Booking
        {
            Id = "bkg-606",
            Reference = "GT-CANC-606",
            Status = BookingStatus.Cancelled
        };

        _mockBookingRepo
            .Setup(r => r.GetByIdAsync("bkg-606"))
            .ReturnsAsync(booking);

        // Act
        var result = await _workflowService.CancelBookingAsync(
            "bkg-606",
            "Another reason",
            "admin",
            "admin-1",
            null,
            _site
        );

        // Assert
        Assert.Equal(BookingStatus.Cancelled, result.Status);
        _mockBookingRepo.Verify(r => r.UpdateAsync(It.IsAny<string>(), It.IsAny<Booking>()), Times.Never);
    }
}
