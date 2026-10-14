"use client";

import Link from "next/link";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { toursBySite, Tour } from "@/lib/toursData";

const allToursList: Tour[] = Object.values(toursBySite).flat();
const tourDetailsMap: Record<string, Tour> = allToursList.reduce((acc, t) => {
  acc[String(t.id)] = t;
  return acc;
}, {} as Record<string, Tour>);

export default function TourDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const tourId = id || "1";
  const tour: Tour = tourDetailsMap[tourId] || toursBySite["website1"][0];

  const [selectedImage, setSelectedImage] = useState(tour.image);
  const [bookingStep, setBookingStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    travelers: 1,
    startDate: "",
    endDate: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      if (!formData.name || !formData.email || !formData.phone || !formData.startDate || !formData.endDate) {
        setError("Please fill in all fields");
        setLoading(false);
        return;
      }

      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        setError("Ending date cannot be before starting date");
        setLoading(false);
        return;
      }

      const bookingPayload = {
        tourId: tour.id,
        tourName: tour.name,
        totalPrice: tour.price * formData.travelers,
        guestName: formData.name,
        email: formData.email,
        phone: formData.phone,
        travelers: formData.travelers,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create booking");
      }

      alert("✓ Booking created successfully!");
      setFormData({ name: "", email: "", phone: "", travelers: 1, startDate: "", endDate: "" });
      setBookingStep(1);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = tour.price * formData.travelers;

  return (
    <main className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Image Section */}
      <section className="bg-black h-80 overflow-hidden relative md:h-96">
        <img src={selectedImage} alt={tour.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      </section>

      {/* Gallery Thumbnails */}
      <section className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {tour.gallery && tour.gallery.length > 0 ? (
              tour.gallery.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`flex-shrink-0 h-20 w-20 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                    selectedImage === img ? "border-primary-600 shadow-md" : "border-gray-300"
                  }`}
                >
                  <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))
            ) : (
              <button className="flex-shrink-0 h-20 w-20 rounded-lg overflow-hidden border-2 border-primary-600">
                <img src={tour.image} alt={tour.name} className="w-full h-full object-cover" />
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/explore" className="text-primary-600 hover:text-primary-700 font-semibold mb-6 inline-flex items-center gap-2">
          ← Back to Tours
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tour Header */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">{tour.name}</h1>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pb-6 border-b">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl mb-2">⭐</div>
                  <div className="font-bold text-xl text-primary-600">{tour.rating}</div>
                  <div className="text-sm text-gray-600">{tour.reviews} reviews</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl mb-2">📅</div>
                  <div className="font-bold text-gray-900">{tour.duration}</div>
                  <div className="text-sm text-gray-600">Duration</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl mb-2">💪</div>
                  <div className="font-bold text-gray-900">{tour.difficulty}</div>
                  <div className="text-sm text-gray-600">Level</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-3xl mb-2">👥</div>
                  <div className="font-bold text-gray-900">{tour.groupSize}</div>
                  <div className="text-sm text-gray-600">Group</div>
                </div>
                <div className="text-center p-4 bg-pink-50 rounded-lg">
                  <div className="text-3xl mb-2">🌞</div>
                  <div className="font-bold text-gray-900 text-sm">{tour.bestTime}</div>
                  <div className="text-sm text-gray-600">Best Time</div>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-3xl mb-2">🗣️</div>
                  <div className="font-bold text-gray-900 text-sm">{tour.language}</div>
                  <div className="text-sm text-gray-600">Languages</div>
                </div>
              </div>

              <p className="text-gray-700 text-lg leading-relaxed mt-6">
                {tour.fullDescription || tour.description}
              </p>
            </div>

            {/* Highlights */}
            {tour.highlights && tour.highlights.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                  <span className="text-4xl">✨</span> Tour Highlights
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tour.highlights.map((highlight: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border-l-4 border-primary-600 hover:shadow-md transition-shadow"
                    >
                      <span className="text-2xl flex-shrink-0">⭐</span>
                      <span className="text-gray-700 font-medium">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Itinerary */}
            {tour.itinerary && tour.itinerary.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                  <span className="text-4xl">📋</span> Day-by-Day Itinerary
                </h2>
                <div className="space-y-4">
                  {tour.itinerary.map((day, idx: number) => (
                    <div key={idx} className="border-l-4 border-primary-600 pl-6 py-3 hover:bg-blue-50 transition-colors rounded px-3">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-white px-3 py-1 rounded-full text-sm font-bold bg-primary-600">
                          Day {day.day}
                        </span>
                        <h3 className="font-bold text-lg text-gray-900">{day.title}</h3>
                      </div>
                      <p className="text-gray-600 leading-relaxed ml-12">{day.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* What's Included */}
            {tour.included && tour.included.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                  <span className="text-4xl">📦</span> What&apos;s Included
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tour.included.map((item: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <span className="text-green-600 text-2xl font-bold flex-shrink-0">✓</span>
                      <span className="text-gray-700 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guest Reviews */}
            {tour.guestReviews && tour.guestReviews.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                  <span className="text-4xl">💬</span> Guest Reviews
                </h2>
                <div className="space-y-4">
                  {tour.guestReviews.map((review, idx: number) => (
                    <div key={idx} className="border rounded-lg p-5 hover:shadow-lg transition-shadow bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">{review.author}</h4>
                        </div>
                        <div className="text-yellow-400 text-lg">{"⭐".repeat(review.rating)}</div>
                      </div>
                      <p className="text-gray-600 italic">&quot;{review.text}&quot;</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-8 sticky top-32">
              {/* Price Section */}
              <div className="mb-6 pb-6 border-b">
                <div className="text-5xl font-bold text-primary-600 mb-2">${tour.price}</div>
                <p className="text-gray-600 text-sm mb-4">per person</p>
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Total for <span className="font-bold">{formData.travelers} {formData.travelers === 1 ? "person" : "people"}</span>:
                  </p>
                  <p className="text-3xl font-bold text-primary-600 mt-2">${totalPrice}</p>
                </div>
              </div>

              {bookingStep === 1 && (
                <div>
                  <label className="block text-gray-900 font-bold mb-3">👥 Number of Travelers</label>
                  <div className="flex gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => setFormData({ ...formData, travelers: num })}
                        className={`flex-1 py-2 rounded-lg font-bold transition-all text-sm ${formData.travelers === num
                          ? "bg-primary-600 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  {/* Starting Date */}
                  <label className="block text-gray-900 font-bold mb-3">📅 Starting Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200"
                  />

                  {/* Ending Date */}
                  <label className="block text-gray-900 font-bold mb-3">📅 Ending Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    min={formData.startDate}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg mb-6 focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200"
                  />

                  <button
                    onClick={() => {
                      if (!formData.startDate || !formData.endDate) {
                        setError("Please select both start and end dates");
                        return;
                      }
                      if (new Date(formData.endDate) < new Date(formData.startDate)) {
                        setError("Ending date cannot be before starting date");
                        return;
                      }
                      setError("");
                      setBookingStep(2);
                    }}
                    className="w-full bg-primary-600 text-white py-4 rounded-lg font-bold hover:bg-primary-700 mb-3 text-lg shadow-lg"
                  >
                    Continue Booking →
                  </button>

                  <button className="w-full border-2 border-primary-600 text-primary-600 py-3 rounded-lg font-bold hover:bg-primary-50">
                    ❤️ Add to Wishlist
                  </button>

                  {error && (
                    <div className="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t space-y-2 text-sm text-gray-600">
                    <p className="flex items-center gap-2"><span>✓</span> Free cancellation up to 30 days</p>
                    <p className="flex items-center gap-2"><span>✓</span> Money-back guarantee</p>
                    <p className="flex items-center gap-2"><span>✓</span> Secure 256-bit encryption</p>
                  </div>
                </div>
              )}

              {bookingStep === 2 && (
                <div>
                  <h3 className="text-2xl font-bold mb-5 text-gray-900">Guest Details</h3>

                  <div className="mb-4">
                    <label className="block text-gray-900 font-bold mb-2">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-900 font-bold mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-900 font-bold mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
                      placeholder="+1 (234) 567-8900"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setBookingStep(1)}
                      className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-50"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loading ? "Processing..." : "Confirm & Pay →"}
                    </button>
                  </div>
                  {error && (
                    <div className="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}