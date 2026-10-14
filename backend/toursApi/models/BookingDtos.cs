namespace ToursApi.Models;

// What the frontend POSTs to create a booking. `tourName` and
// `totalPrice` are optional: the Next.js frontend already knows both
// (from lib/toursData.ts, which lives client-side, not in this backend)
// and sends them directly. If they're missing, BookingsController falls
// back to looking the tour up in the "tours" Mongo collection instead.
public class BookingCreateDto
{
    public string Website { get; set; } = string.Empty;
    public string? WebsiteId { get; set; }
    public string? UserId { get; set; }
    public int TourId { get; set; }
    public string? TourName { get; set; }
    public string? TourImage { get; set; }
    public string? Currency { get; set; }
    public string? Location { get; set; }
    public double? TotalPrice { get; set; }
    public string GuestName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public int Travelers { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string? PaymentMethod { get; set; }
    public string? PaymentStatus { get; set; }
    public string? PaymentReference { get; set; }
}

// What the admin dashboard PUTs — today it only ever sends
// { "status": "confirmed" } etc., so every field here is optional and
// only the ones actually present get updated.
public class BookingUpdateDto
{
    public string? Status { get; set; }
    public string? PaymentStatus { get; set; }
}

public class BookingPaymentDto
{
    public string Method { get; set; } = "card";
    public string? TransactionId { get; set; }
    public string? CardLast4 { get; set; }
}