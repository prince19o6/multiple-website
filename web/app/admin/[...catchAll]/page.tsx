import Link from "next/link";

export const metadata = {
  title: "Admin Page Not Found | Tours Admin",
};

export default function AdminCatchAllPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 font-sans">
      <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-3xl font-black mb-4 shadow-sm border border-amber-200">
        404
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Page Not Found</h1>
      <p className="text-sm text-gray-500 max-w-md mb-6">
        The administration screen you are trying to access does not exist or may have been relocated.
      </p>
      <Link
        href="/admin"
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-md inline-flex items-center gap-2"
      >
        <span>←</span>
        <span>Back to Dashboard</span>
      </Link>
    </div>
  );
}
