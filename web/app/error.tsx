'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log client-side error for telemetry/diagnostics
    console.error('Unhandled route error:', error);
  }, [error]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-slate-50">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-2xl bg-amber-50 text-amber-600 text-3xl">
          ⚠️
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          We encountered an unexpected error while loading this page. Please try again or return home.
        </p>

        {process.env.NODE_ENV !== 'production' && error.message && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-700 text-xs font-mono text-left overflow-x-auto border border-red-100">
            {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-sm"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
