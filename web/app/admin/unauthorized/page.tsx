"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearAdminSession, getAdminSite, getAdminUser } from "@/lib/adminApi";

export default function AdminUnauthorizedPage() {
  const router = useRouter();
  const currentSite = getAdminSite();
  const user = getAdminUser(currentSite);

  const handleSwitchAccount = () => {
    clearAdminSession(currentSite);
    router.replace("/admin/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-8 shadow-2xl text-slate-100 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-3xl font-bold mx-auto mb-4">
          ⛔
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">403 - Access Denied</h1>
        <p className="text-sm text-slate-400 mb-4">
          Your account {user?.email ? (<strong className="text-white">({user.email})</strong>) : ""} has the role{" "}
          <span className="text-amber-400 font-semibold">&quot;{user?.role || "user"}&quot;</span>, which does not possess
          administrator permissions for this website tenant.
        </p>

        <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50 mb-6 text-xs text-slate-400 text-left">
          <p className="font-semibold text-slate-300 mb-1">To access the admin portal:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Log in using an account with an <strong className="text-slate-200">Admin</strong> role.</li>
            <li>Ensure the account belongs to the correct website database.</li>
          </ul>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleSwitchAccount}
            className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-md"
          >
            Sign In with an Admin Account
          </button>
          <Link
            href="/"
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-colors"
          >
            Return to Public Website
          </Link>
        </div>
      </div>
    </div>
  );
}
