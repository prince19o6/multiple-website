'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
          <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-2xl bg-red-50 text-red-600 text-3xl">
            🚨
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Application Error</h1>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            A critical error occurred while initializing the application.
          </p>

          {process.env.NODE_ENV !== 'production' && error.message && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-700 text-xs font-mono text-left overflow-x-auto border border-red-100">
              {error.message}
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-sm"
            >
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
