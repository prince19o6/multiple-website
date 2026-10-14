import { ENV } from "@/lib/env";
import { ALL_SITES } from "@/lib/siteRegistry";

export const metadata = {
  title: "Environment Configuration Required | Travel Platform",
  description: "SITE_ID environment variable is missing or invalid",
};

export default function EnvErrorPage() {
  const currentSiteId = ENV.siteId || "";
  const allowedSites = ALL_SITES.map((s) => ({
    id: s.siteId,
    name: s.displayName,
    color: s.defaultAccentColor,
  }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
      <div className="max-w-xl w-full bg-slate-900 border border-red-500/30 rounded-2xl p-8 shadow-2xl">
        {/* Error Header */}
        <div className="flex items-center gap-3.5 mb-6 pb-6 border-b border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center text-2xl font-bold">
            ⚠️
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Website Not Configured
            </h1>
            <p className="text-xs text-red-400 font-medium mt-0.5">
              Missing or Invalid <code className="font-mono bg-red-950/60 px-1 py-0.5 rounded text-red-300">SITE_ID</code> in environment
            </p>
          </div>
        </div>

        {/* Diagnostic Card */}
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 mb-6 font-mono text-xs space-y-2.5">
          <div className="flex justify-between">
            <span className="text-slate-400">Required Variable:</span>
            <span className="text-amber-400 font-bold">SITE_ID</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Received Value:</span>
            <span className="text-red-400 font-bold">
              {currentSiteId ? `"${currentSiteId}"` : "<empty / undefined>"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Allowed Values:</span>
            <span className="text-emerald-400 font-bold">
              gujjutours | tripgoasia | technoheaven
            </span>
          </div>
        </div>

        {/* How to Fix Section */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            How to resolve:
          </h2>
          <ol className="list-decimal list-inside space-y-3 text-xs text-slate-300 pl-1">
            <li>
              <span>Open your environment configuration file:</span>
              <div className="mt-1 font-mono text-[11px] bg-slate-950 px-3 py-1.5 rounded border border-slate-800 text-sky-300">
                web/.env
              </div>
            </li>
            <li>
              <span>Set the desired active website:</span>
              <div className="mt-1.5 grid grid-cols-1 gap-1.5 font-mono text-[11px]">
                {allowedSites.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between bg-slate-950/80 px-3 py-2 rounded border border-slate-800 hover:border-slate-700"
                  >
                    <span className="text-slate-300">
                      SITE_ID=<strong className="text-emerald-400">{s.id}</strong>
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans">
                      {s.name}
                    </span>
                  </div>
                ))}
              </div>
            </li>
            <li>
              <span>Restart the development server:</span>
              <div className="mt-1 font-mono text-[11px] bg-slate-950 px-3 py-1.5 rounded border border-slate-800 text-amber-300">
                npm run dev
              </div>
            </li>
          </ol>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400">
            Once configured, opening <code className="text-slate-300 font-mono">http://localhost:3000</code> or your PC's LAN IP will launch your chosen site directly with no chooser.
          </p>
        </div>
      </div>
    </main>
  );
}
