"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  verifyActionToken,
  executeActionToken,
  getAdminUser,
  ADMIN_SITE_NAMES,
  getAdminSite,
  type ActionTokenVerifyResult,
} from "@/lib/adminApi";

interface PageProps {
  params: Promise<{ action: string }>;
}

export default function BookingActionPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();

  const actionParam = (resolvedParams.action || "").toLowerCase();
  const isApprove = actionParam === "approve";
  const token = searchParams.get("token") || "";

  // Token Verification State
  const [verifying, setVerifying] = useState(true);
  const [verifyResult, setVerifyResult] = useState<ActionTokenVerifyResult | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Execution State
  const [noteOrReason, setNoteOrReason] = useState("");
  const [executing, setExecuting] = useState(false);
  const [executed, setExecuted] = useState(false);
  const [executionMessage, setExecutionMessage] = useState("");
  const [executeError, setExecuteError] = useState<string | null>(null);

  const activeSite = getAdminSite();
  const currentBrand = ADMIN_SITE_NAMES[activeSite] || ADMIN_SITE_NAMES.tripgoasia;
  const adminUser = getAdminUser();

  // 1. Verify token on mount (Safe read-only GET request)
  useEffect(() => {
    if (!token) {
      setVerifyError("No action token was provided in the link.");
      setVerifying(false);
      return;
    }

    let isCancelled = false;
    setVerifying(true);
    setVerifyError(null);

    verifyActionToken(token)
      .then((res) => {
        if (isCancelled) return;
        if (res.valid) {
          setVerifyResult(res);
        } else {
          setVerifyError(
            res.reason ||
              "This action link is either expired, already used, or invalid for this website."
          );
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        setVerifyError(err instanceof Error ? err.message : "Verification request failed.");
      })
      .finally(() => {
        if (!isCancelled) setVerifying(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [token]);

  // 2. Handle Execute on Explicit User Click
  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isApprove && !noteOrReason.trim()) {
      setExecuteError("A rejection reason is mandatory to inform the customer.");
      return;
    }

    setExecuting(true);
    setExecuteError(null);

    try {
      const res = await executeActionToken(
        token,
        noteOrReason.trim(),
        isApprove ? "approve" : "reject"
      );
      setExecuted(true);
      setExecutionMessage(
        res.message ||
          `Reservation ${res.reference} has been successfully ${
            isApprove ? "confirmed" : "rejected"
          }.`
      );
    } catch (err) {
      setExecuteError(err instanceof Error ? err.message : "Action execution failed.");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Top Brand Bar */}
        <div
          className="p-6 text-white text-center"
          style={{ backgroundColor: currentBrand.color }}
        >
          <div className="text-[11px] uppercase tracking-widest font-black opacity-80 mb-1">
            {currentBrand.label} Admin Concierge
          </div>
          <h1 className="text-xl sm:text-2xl font-black">
            {isApprove ? "Approve & Confirm Reservation" : "Reject Reservation Request"}
          </h1>
        </div>

        {/* Admin Session Notice */}
        <div className="px-6 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <span>
            {adminUser ? (
              <span>
                Signed in as: <strong className="text-gray-900">{adminUser.email}</strong>
              </span>
            ) : (
              <span>Guest Admin Mode (Single-use signed token)</span>
            )}
          </span>
          <Link
            href="/admin/bookings"
            className="text-blue-600 font-bold hover:underline"
          >
            Go to Inbox →
          </Link>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8">
          {verifying ? (
            <div className="py-12 text-center space-y-3">
              <div
                className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin mx-auto"
                style={{ borderTopColor: currentBrand.color }}
              />
              <p className="text-gray-600 text-xs font-semibold">
                Verifying secure cryptographic action token…
              </p>
            </div>
          ) : verifyError ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-2xl font-black mx-auto">
                ⚠️
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900">Action Link Expired or Invalid</h2>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">{verifyError}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-600 text-left space-y-1">
                <span className="font-bold text-gray-900 block">Common reasons:</span>
                <div>• The 48-hour expiration window has elapsed.</div>
                <div>• This single-use action has already been executed.</div>
                <div>• The reservation has already been modified in the Admin Dashboard.</div>
              </div>
              <div className="pt-2">
                <Link
                  href="/admin/bookings"
                  className="inline-block w-full py-3 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs shadow text-center"
                >
                  Open Booking Confirmation Inbox
                </Link>
              </div>
            </div>
          ) : executed ? (
            /* Success Card */
            <div className="py-6 text-center space-y-5 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl font-black mx-auto">
                ✓
              </div>
              <div>
                <span className="text-xs uppercase font-extrabold text-emerald-700 tracking-wider">
                  Success
                </span>
                <h2 className="text-xl font-black text-gray-900 mt-1">Action Complete</h2>
                <p className="text-xs text-gray-600 mt-1">{executionMessage}</p>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-900 text-left space-y-1.5">
                <div className="font-bold">Next Steps Automatically Executed:</div>
                <div>• Database state updated and recorded in audit history.</div>
                <div>• Automated notification email queued in outbox for customer.</div>
                {isApprove && <div>• Customer digital boarding pass QR unlocked.</div>}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/admin/bookings"
                  className="flex-1 py-3 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs shadow text-center"
                >
                  View Booking Inbox
                </Link>
                <Link
                  href={`/booking/confirmation?ref=${encodeURIComponent(
                    verifyResult?.reference || ""
                  )}`}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-50 text-center"
                >
                  Preview Customer Ticket
                </Link>
              </div>
            </div>
          ) : (
            /* Action Confirmation Form */
            <form onSubmit={handleExecute} className="space-y-6">
              {executeError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold">
                  ⚠️ {executeError}
                </div>
              )}

              {/* Booking Summary Box */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-gray-500 font-bold uppercase tracking-wider">
                    Booking Reference
                  </span>
                  <span className="font-mono font-black text-blue-600 text-sm">
                    {verifyResult?.reference}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Lead Passenger:</span>
                  <span className="font-bold text-gray-900">{verifyResult?.guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tour Package:</span>
                  <span className="font-bold text-gray-900 text-right max-w-[60%] truncate">
                    {verifyResult?.tourTitle}
                  </span>
                </div>
                {verifyResult?.expiresAt && (
                  <div className="flex justify-between pt-1 text-[11px] text-gray-400">
                    <span>Link Expiration:</span>
                    <span>{new Date(verifyResult.expiresAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Input: Note for Approve OR Reason for Reject */}
              {isApprove ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Internal Concierge Note (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={noteOrReason}
                    onChange={(e) => setNoteOrReason(e.target.value)}
                    placeholder="e.g. VIP guide assigned, verified passport details, confirmed with hotel."
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Confirming this reservation unlocks the official QR e-ticket and notifies the
                    traveler by email immediately.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Reason for Rejection <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={noteOrReason}
                    onChange={(e) => setNoteOrReason(e.target.value)}
                    placeholder="e.g. Fully booked on requested date, seasonal maintenance closure, etc."
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <p className="text-[11px] text-rose-500 font-semibold mt-1">
                    * This explanation will be included in the email notification to the customer.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={executing}
                  className={`w-full py-3.5 px-4 rounded-xl text-white font-extrabold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 ${
                    isApprove
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : "bg-rose-600 hover:bg-rose-500"
                  }`}
                >
                  {executing
                    ? "Executing Action…"
                    : isApprove
                    ? "✓ Confirm & Issue Official E-Ticket"
                    : "✕ Confirm Rejection & Notify Guest"}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/admin/bookings")}
                  className="w-full py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 font-bold text-xs transition-all"
                >
                  Cancel / Return to Admin Dashboard
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
