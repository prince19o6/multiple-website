# Tours App Backend Documentation

## Setup Instructions

### 1. Install Dependencies
```bash
npm install mongoose dotenv bcryptjs
```

### 2. Environment Setup
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/toursapp
NEXT_PUBLIC_API_URL=http://localhost:3006
```

### 3. MongoDB Installation
You have two options:

#### Option A: Local MongoDB
- Download and install [MongoDB Community Edition](https://www.mongodb.com/try/download/community)
- Make sure MongoDB service is running

#### Option B: MongoDB Atlas (Cloud)
- Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a free account
- Create a cluster
- Get your connection string
- Replace `MONGODB_URI` with your Atlas connection string

### 4. Seed Database
Before running the app, seed the database with initial tour data:
```bash
curl -X POST http://localhost:3006/api/seed
```

## API Endpoints

### Tours
- **GET** `/api/tours` - Get all tours
- **POST** `/api/tours` - Create new tour (admin)
- **GET** `/api/tours/[id]` - Get specific tour
- **PUT** `/api/tours/[id]` - Update tour (admin)
- **DELETE** `/api/tours/[id]` - Delete tour (admin)

### Bookings
- **GET** `/api/bookings` - Get all bookings (optional: filter by email with `?email=user@example.com`)
- **POST** `/api/bookings` - Create new booking
- **GET** `/api/bookings/[id]` - Get specific booking
- **PUT** `/api/bookings/[id]` - Update booking status
- **DELETE** `/api/bookings/[id]` - Cancel booking

### Database Seed
- **POST** `/api/seed` - Populate database with sample tour data

## Request/Response Examples

### Create a Booking
```bash
curl -X POST http://localhost:3006/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "tourId": 1,
    "guestName": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "travelers": 2,
    "date": "2024-12-20"
  }'
```

### Get User's Bookings
```bash
curl http://localhost:3006/api/bookings?email=john@example.com
```

## Database Schema

### Tours Collection
```javascript
{
  id: Number,
  name: String,
  description: String,
  price: Number,
  duration: String,
  rating: Number,
  reviews: Number,
  image: String (URL),
  gallery: [String] (URLs),
  difficulty: String ('Easy' | 'Moderate' | 'Hard'),
  groupSize: String,
  bestTime: String,
  language: String,
  fullDescription: String,
  highlights: [String],
  included: [String],
  itinerary: [{day, title, description}],
  guestReviews: [{author, rating, text}],
  createdAt: Date,
  updatedAt: Date
}
```

### Bookings Collection
```javascript
{
  tourId: Number,
  tourName: String,
  guestName: String,
  email: String,
  phone: String,
  travelers: Number,
  date: Date,
  totalPrice: Number,
  status: String ('pending' | 'confirmed' | 'cancelled'),
  createdAt: Date,
  updatedAt: Date
}
```

### Users Collection
```javascript
{
  email: String (unique),
  name: String,
  password: String (hashed),
  wishlist: [Number] (Tour IDs),
  bookings: [ObjectId] (Booking IDs),
  createdAt: Date,
  updatedAt: Date
}
```

## Next Steps
1. Add user authentication (signup/login)
2. Add payment processing (Stripe/PayPal)
3. Add email notifications
4. Add admin dashboard
5. Add search and advanced filtering
