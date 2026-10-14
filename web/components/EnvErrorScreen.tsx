import React from "react";
import type { EnvValidationError } from "@/lib/env";

interface EnvErrorScreenProps {
  error: EnvValidationError | null;
}

export function EnvErrorScreen({ error }: EnvErrorScreenProps) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 font-sans">
      <div className="max-w-2xl w-full bg-slate-800 border border-red-500/30 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3 mb-6">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/20 text-red-400 text-xl font-bold">
            ⚠️
          </span>
          <div>
            <h1 className="text-xl font-bold text-red-400">
              Environment Configuration Error
            </h1>
            <p className="text-sm text-slate-400">
              The website cannot run until the required environment variables are set correctly.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-slate-950/70 rounded-xl p-5 border border-slate-700/60 mb-6 font-mono text-sm space-y-3">
            <div>
              <span className="text-slate-400">Faulty Variable: </span>
              <span className="text-red-400 font-bold">{error.variable}</span>
            </div>
            <div>
              <span className="text-slate-400">Reason: </span>
              <span className="text-slate-200">{error.message}</span>
            </div>
            {error.received && (
              <div>
                <span className="text-slate-400">Received Value: </span>
                <span className="text-amber-300 break-all">{error.received}</span>
              </div>
            )}
            {error.expected && (
              <div>
                <span className="text-slate-400">Expected Value: </span>
                <span className="text-emerald-400 break-all">{error.expected}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4 text-sm text-slate-300">
          <p className="font-semibold text-slate-200">How to fix this:</p>
          <ol className="list-decimal list-inside space-y-2 text-slate-300 pl-2">
            <li>
              Start the website for a specific brand using one of the dedicated npm scripts:
              <div className="mt-2 grid grid-cols-1 gap-2 font-mono text-xs">
                <code className="bg-slate-950 px-3 py-2 rounded-lg text-emerald-300 block">
                  npm run dev:gujjutours
                </code>
                <code className="bg-slate-950 px-3 py-2 rounded-lg text-amber-300 block">
                  npm run dev:tripgoasia
                </code>
                <code className="bg-slate-950 px-3 py-2 rounded-lg text-cyan-300 block">
                  npm run dev:technoheaven
                </code>
              </div>
            </li>
            <li className="mt-2">
              Or configure <code className="text-blue-300 font-mono">web/.env.local</code> matching{" "}
              <code className="text-blue-300 font-mono">.env.example</code>.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default EnvErrorScreen;
