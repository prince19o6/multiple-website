import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</p>
        <p className="text-gray-600 mb-8">Sorry, the page you&apos;re looking for doesn&apos;t exist.</p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700"
          >
            Go Home
          </Link>
          <Link
            href="/explore"
            className="border-2 border-primary-600 text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50"
          >
            Explore Tours
          </Link>
        </div>
      </div>
    </main>
  );
}
