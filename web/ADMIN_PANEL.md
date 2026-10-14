# Admin Panel Documentation

## Overview
The admin panel provides a complete management interface for the Tours application. You can manage bookings, tours, users, and view analytics.

## Accessing the Admin Panel

1. **Login**: Navigate to `http://localhost:3000/admin/login`
2. **Default Admin Password**: `admin123`
3. Once logged in, you'll have access to the full admin dashboard

## Features

### 1. Dashboard
- **Overview of key metrics**:
  - Total bookings count
  - Pending bookings count
  - Total revenue from bookings
  - Total number of tours
- **Quick action links** to access different management sections
- **Database connection status** indicator

### 2. Bookings Management (`/admin/bookings`)
- **View all bookings** with full details:
  - Guest name and email
  - Tour name and booking date
  - Number of travelers
  - Total booking price
  - Booking status (Pending, Confirmed, Cancelled)
- **Filter bookings** by status
- **Search bookings** by guest name, email, or tour name
- **Update booking status** directly from the table
- **Delete bookings** as needed
- **View booking summary** statistics

### 3. Tours Management (`/admin/tours`)
- **View all available tours** as cards
- **Add new tours**:
  - Tour ID, name, description
  - Price per person
  - Duration information
  - Rating and number of reviews
  - Tour image URL
- **Edit existing tours** - click "Edit" to modify tour details
- **Delete tours** - remove tours from the system
- **Tour cards display** current tour information

### 4. Users Management (`/admin/users`)
- Coming soon - User account management features

### 5. Analytics (`/admin/analytics`)
- Coming soon - Business insights and reporting features

## How to Use

### Adding a New Tour
1. Go to **Tours Management**
2. Click **+ Add New Tour**
3. Fill in all tour details:
   - Tour ID (unique number)
   - Name of the tour
   - Description
   - Price per person
   - Duration (e.g., "5 days / 4 nights")
   - Rating (e.g., 4.8)
   - Number of reviews
   - Image URL (link to tour image)
4. Click **Add Tour**

### Managing Bookings
1. Go to **Bookings Management**
2. **Search** for a specific booking using guest name, email, or tour name
3. **Filter** by booking status (Pending, Confirmed, Cancelled)
4. **Update status** by clicking the status dropdown
5. **Delete** a booking by clicking the Delete button

### Monitoring Dashboard
- The dashboard automatically loads:
  - Real-time booking counts
  - Revenue calculations
  - Pending bookings count
- Refresh the page to get the latest statistics

## API Endpoints Used

### Bookings
- `GET /api/bookings` - Fetch all bookings
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/[id]` - Update booking
- `DELETE /api/bookings/[id]` - Delete booking

### Tours
- `GET /api/tours` - Fetch all tours
- `POST /api/tours` - Create new tour
- `PUT /api/tours/[id]` - Update tour
- `DELETE /api/tours/[id]` - Delete tour

## Database

The admin panel connects to MongoDB with the following models:

### Booking Schema
```
{
  tourId: number,
  tourName: string,
  guestName: string,
  email: string,
  phone: string,
  travelers: number,
  date: Date,
  totalPrice: number,
  status: 'pending' | 'confirmed' | 'cancelled'
}
```

### Tour Schema
```
{
  id: number,
  name: string,
  description: string,
  price: number,
  duration: string,
  rating: number,
  reviews: number,
  image: string,
  gallery: [string],
  difficulty: string,
  groupSize: string,
  bestTime: string,
  language: string,
  highlights: [string],
  included: [string]
}
```

## Security Notes

⚠️ **Important**: The current admin authentication is basic (single password). For production:
1. Implement proper user authentication
2. Use secure password hashing
3. Add role-based access control
4. Implement session management
5. Add HTTPS encryption
6. Set proper CORS policies

## Troubleshooting

### Can't log in?
- Check the default password: `admin123`
- Clear browser cache and cookies
- Try incognito mode

### Bookings not appearing?
- Ensure MongoDB is running and connected
- Check the connection string in `.env.local`
- Try visiting `/api/bookings/test` to verify database connection

### Can't add tours?
- Ensure all required fields are filled
- Check that the tour ID is unique
- Verify the image URL is valid

## Contact & Support

For issues or feature requests, contact the development team.
