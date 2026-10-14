"use client";

import Link from "next/link";

export default function AboutPage() {
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
              <Link href="/about" className="text-primary-600 font-semibold">
                About
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-primary-600">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-4">About Us</h1>
          <p className="text-xl text-primary-100">
            Discover our mission and story of connecting travelers with unforgettable adventures
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h2 className="text-4xl font-bold mb-6">Our Mission</h2>
              <p className="text-gray-700 text-lg mb-4">
                We believe that travel transforms people. Our mission is to make extraordinary
                travel experiences accessible to everyone by curating the world&apos;s best tours and
                connecting travelers with passionate local guides.
              </p>
              <p className="text-gray-700 text-lg">
                Since 2015, we&apos;ve been dedicated to creating unforgettable moments that inspire,
                educate, and connect people across cultures and continents.
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg h-96 flex items-center justify-center">
              <div className="text-white text-center">
                <p className="text-2xl font-semibold">Our Story</p>
                <p className="text-primary-100 mt-2">2015 - Present</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-lg">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-2xl font-bold mb-3">Global Perspective</h3>
              <p className="text-gray-600">
                We celebrate the diversity of our world and respect different cultures, traditions,
                and ways of life.
              </p>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg">
              <div className="text-4xl mb-4">💚</div>
              <h3 className="text-2xl font-bold mb-3">Sustainability</h3>
              <p className="text-gray-600">
                We&apos;re committed to responsible tourism that protects the environment and benefits
                local communities.
              </p>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg">
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="text-2xl font-bold mb-3">Excellence</h3>
              <p className="text-gray-600">
                We strive for excellence in every detail, from tour planning to customer service
                and safety.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-primary-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">50K+</div>
              <p className="text-primary-100">Happy Travelers</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">150+</div>
              <p className="text-primary-100">Destinations</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">500+</div>
              <p className="text-primary-100">Expert Guides</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">9+</div>
              <p className="text-primary-100">Years Experience</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Sarah Johnson", role: "Founder & CEO", emoji: "👩‍💼" },
              { name: "Michael Chen", role: "Head of Operations", emoji: "👨‍💼" },
              { name: "Emma García", role: "Travel Curator", emoji: "👩‍🚀" },
            ].map((member) => (
              <div key={member.name} className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="text-6xl mb-4">{member.emoji}</div>
                <h3 className="text-xl font-bold mb-2">{member.name}</h3>
                <p className="text-gray-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Your Adventure?</h2>
          <Link
            href="/explore"
            className="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100"
          >
            Explore Tours
          </Link>
        </div>
      </section>
    </main>
  );
}
