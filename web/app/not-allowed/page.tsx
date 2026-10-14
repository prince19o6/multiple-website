export default function NotAllowedPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="max-w-md w-full rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
                <h1 className="text-xl font-semibold text-slate-900 mb-2">
                    Website not available
                </h1>
                <p className="text-slate-600 text-sm mb-4">
                    This hostname is not enabled on this platform.
                </p>
                <p className="text-xs text-slate-500 font-mono">
                    Allowed: gujjutours.com · tripgoasia.com · technoheaven.com
                </p>
            </div>
        </main>
    );
}