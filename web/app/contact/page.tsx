"use client";

import Link from "next/link";
import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, send this to a backend API
    console.log("Form submitted:", formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-primary-600">
                Tours
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-700 hover:text-primary-600">
                Home
              </Link>
              <Link href="/explore" className="text-gray-700 hover:text-primary-600">
                Explore
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-primary-600">
                About
              </Link>
              <Link href="/contact" className="text-primary-600 font-semibold">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-primary-100">
            Have questions? We&apos;d love to hear from you. Get in touch with our team!
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-bold mb-8">Get in Touch</h2>

            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">📍 Address</h3>
              <p className="text-gray-600">
                123 Travel Street
                <br />
                Adventure City, AC 12345
                <br />
                United States
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">📞 Phone</h3>
              <p className="text-gray-600">
                <a href="tel:+1234567890" className="hover:text-primary-600">
                  +1 (234) 567-8900
                </a>
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">📧 Email</h3>
              <p className="text-gray-600">
                <a href="mailto:info@toursapp.com" className="hover:text-primary-600">
                  info@toursapp.com
                </a>
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">🕐 Hours</h3>
              <p className="text-gray-600">
                Monday - Friday: 9:00 AM - 6:00 PM
                <br />
                Saturday: 10:00 AM - 4:00 PM
                <br />
                Sunday: Closed
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-primary-600 hover:text-primary-700 text-2xl">
                  f
                </a>
                <a href="#" className="text-primary-600 hover:text-primary-700 text-2xl">
                  🐦
                </a>
                <a href="#" className="text-primary-600 hover:text-primary-700 text-2xl">
                  📷
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>

              {submitted && (
                <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                  ✓ Thank you! Your message has been sent successfully. We&apos;ll get back to you soon.
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
                    placeholder="Your Name"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
                    placeholder="your@email.com"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">Subject</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
                  >
                    <option value="">Select a subject</option>
                    <option value="booking">Booking Inquiry</option>
                    <option value="support">Customer Support</option>
                    <option value="partnership">Partnership</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
                    placeholder="Your message here..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
