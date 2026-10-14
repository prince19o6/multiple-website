## 🎉 Backend Setup Complete!

Your tours app now has a fully functional backend with the following:

### ✅ What's Been Created:

#### **1. MongoDB Connection** (`lib/db.ts`)
- Handles MongoDB connection pooling
- Works with both local MongoDB and MongoDB Atlas
- Prevents connection issues in serverless environments

#### **2. Database Models** (`lib/models.ts`)
- **Tour Model**: Full tour information with galleries, reviews, itineraries
- **Booking Model**: Store customer bookings with pricing and status
- **User Model**: User accounts with wishlist and booking history

#### **3. API Routes**

**Tours API:**
- `GET /api/tours` - Get all tours
- `POST /api/tours` - Create new tour
- `GET /api/tours/[id]` - Get specific tour
- `PUT /api/tours/[id]` - Update tour
- `DELETE /api/tours/[id]` - Delete tour

**Bookings API:**
- `GET /api/bookings` - Get bookings (filter by email)
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/[id]` - Get specific booking
- `PUT /api/bookings/[id]` - Update booking status
- `DELETE /api/bookings/[id]` - Cancel booking

**Database Seed:**
- `POST /api/seed` - Populate with 3 sample tours

#### **4. Frontend API Utilities** (`lib/api.ts`)
- Ready-to-use functions for all API calls
- Automatic error handling
- Environment-based API URLs

### 🚀 Quick Start:

**1. Install Dependencies:**
```bash
cd c:\Users\Charmi\prince\toursapp\web
npm install
```

**2. Setup MongoDB:**
- **Option A**: Local MongoDB
  - [Download MongoDB](https://www.mongodb.com/try/download/community)
  - Start MongoDB service
  - Update `.env.local`: `MONGODB_URI=mongodb://localhost:27017/toursapp`

- **Option B**: MongoDB Atlas (Cloud - Recommended)
  - Go to https://www.mongodb.com/cloud/atlas
  - Create free account and cluster
  - Get connection string
  - Update `.env.local`: `MONGODB_URI=your_atlas_connection_string`

**3. Start Dev Server:**
```bash
npm run dev
```

**4. Seed Database:**
```bash
# Open browser and visit:
http://localhost:3006/api/seed
```

### 📝 Example: Create a Booking
```javascript
import { createBooking } from '@/lib/api';

// In a component:
const booking = await createBooking({
  tourId: 1,
  guestName: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
  travelers: 2,
  date: "2024-12-20"
});
```

### 📚 Example: Fetch Tours
```javascript
import { fetchTours } from '@/lib/api';

// In a component:
const response = await fetchTours();
const tours = response.data;
```

### 🔧 Next Steps:
1. Update the tour details page to use API instead of hardcoded data
2. Update the explore page to fetch tours from backend
3. Add user authentication (signup/login)
4. Add payment processing (Stripe/PayPal)
5. Add admin dashboard for managing tours
6. Add email notifications for bookings

### 📄 Full Documentation:
See `BACKEND_README.md` for detailed API documentation and database schemas.
