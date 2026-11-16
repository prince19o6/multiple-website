"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  fetchAdminUsers,
  fetchAdminUserBookings,
  resetAdminUserPassword,
  updateAdminUserRole,
  updateAdminUserStatus,
  deleteAdminUser,
  getAdminUser,
  onAdminSessionChange,
  ADMIN_SITE_NAMES,
  getAdminSite,
  type AdminUser,
  type AdminBooking,
} from "@/lib/adminApi";

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Search & Role Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // User Bookings Modal
  const [viewingUser, setViewingUser] = useState<AdminUser | null>(null);
  const [userBookings, setUserBookings] = useState<AdminBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Password Reset Modal
  const [resettingUser, setResettingUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const currentAdmin = getAdminUser();

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminUsers();
      setUsers(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load user accounts";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    return onAdminSessionChange(() => {
      loadUsers();
    });
  }, [loadUsers]);

  const activeSite = getAdminSite();
  const currentBrand = ADMIN_SITE_NAMES[activeSite] || ADMIN_SITE_NAMES.tripgoasia;

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole =
        roleFilter === "all" || (u.role || "").toLowerCase() === roleFilter.toLowerCase();
      const matchesSearch =
        (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, searchTerm]);

  // Open User Bookings
  const handleOpenBookings = async (user: AdminUser) => {
    setViewingUser(user);
    setLoadingBookings(true);
    try {
      const bookings = await fetchAdminUserBookings(user.id);
      setUserBookings(bookings);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load bookings";
      showToast(msg, "error");
      setUserBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Submit Password Reset
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;

    if (!newPassword || newPassword.length < 6) {
      showToast("Password must be at least 6 characters long.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    setResetSubmitting(true);
    try {
      await resetAdminUserPassword(resettingUser.id, newPassword);
      showToast(`Password reset successfully for ${resettingUser.email}`);
      setResettingUser(null);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reset password";
      showToast(msg, "error");
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleRoleToggle = async (user: AdminUser) => {
    if (user.id === currentAdmin?.id) {
      showToast("Cannot demote your own active admin account", "error");
      return;
    }

    const newRole = user.role === "Admin" ? "user" : "Admin";
    if (
      !confirm(
        `Change role for "${user.name}" (${user.email}) to "${newRole === "Admin" ? "Administrator" : "Customer"}"?`
      )
    ) {
      return;
    }

    try {
      await updateAdminUserRole(user.id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole as "Admin" | "user" } : u))
      );
      showToast(`User role updated to ${newRole}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update role";
      showToast(msg, "error");
    }
  };

  const handleStatusToggle = async (user: AdminUser) => {
    if (user.id === currentAdmin?.id) {
      showToast("Cannot disable your own active admin account", "error");
      return;
    }

    const nextDisabled = !user.isDisabled;
    const actionLabel = nextDisabled ? "lock/deactivate" : "unlock/activate";
    if (!confirm(`Are you sure you want to ${actionLabel} account for "${user.name}"?`)) {
      return;
    }

    try {
      await updateAdminUserStatus(user.id, nextDisabled);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, isDisabled: nextDisabled, status: nextDisabled ? "disabled" : "active" }
            : u
        )
      );
      showToast(`User account ${nextDisabled ? "locked" : "unlocked"}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      showToast(msg, "error");
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (user.id === currentAdmin?.id) {
      showToast("Cannot delete your own active admin account", "error");
      return;
    }

    if (!confirm(`Permanently delete user "${user.name}" (${user.email})? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteAdminUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showToast(`User account deleted.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete user";
      showToast(msg, "error");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          <span>{toast.type === "success" ? "✓" : "⚠️"}</span>
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          User Accounts & Permissions
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Manage member accounts, promote administrators, view reservations, and enforce security for{" "}
          {currentBrand.label}.
        </p>
      </div>

      {/* Search & Role Filter */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Search Users</label>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Filter by Role</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="user">Customers</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading user accounts...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            No user accounts found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">User Profile</th>
                  <th className="px-5 py-3">Assigned Role</th>
                  <th className="px-5 py-3">Account Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => {
                  const isCurrent = u.id === currentAdmin?.id;
                  const isAdmin = u.role === "Admin" || u.role === "SuperAdmin";

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                            style={{
                              backgroundColor: isAdmin ? currentBrand.color : "#64748b",
                            }}
                          >
                            {(u.name?.[0] || u.email[0]).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-1.5">
                              <span>{u.name || "Member"}</span>
                              {isCurrent && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                            isAdmin
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {u.role || "User"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                            u.isDisabled
                              ? "bg-rose-100 text-rose-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {u.isDisabled ? "Locked / Disabled" : "Active"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {/* View Bookings Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenBookings(u)}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          📅 Bookings
                        </button>

                        {/* Reset Password Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setResettingUser(u);
                            setNewPassword("");
                            setConfirmPassword("");
                          }}
                          className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          🔑 Reset Pwd
                        </button>

                        {/* Role Toggle */}
                        <button
                          type="button"
                          onClick={() => handleRoleToggle(u)}
                          disabled={isCurrent}
                          className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-40 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          {isAdmin ? "Demote" : "Promote"}
                        </button>

                        {/* Lock / Unlock Toggle */}
                        <button
                          type="button"
                          onClick={() => handleStatusToggle(u)}
                          disabled={isCurrent}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all disabled:opacity-40 cursor-pointer ${
                            u.isDisabled
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {u.isDisabled ? "Unlock" : "Lock"}
                        </button>

                        {/* Delete User */}
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          disabled={isCurrent}
                          className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-40 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── MODAL: View User Bookings ─── */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  Reservations for {viewingUser.name}
                </h3>
                <p className="text-xs text-gray-500">{viewingUser.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {loadingBookings ? (
                <div className="p-8 text-center text-gray-400 text-xs font-semibold">
                  Loading user reservations...
                </div>
              ) : userBookings.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  No bookings found for this customer on this website.
                </div>
              ) : (
                <div className="space-y-3">
                  {userBookings.map((b) => (
                    <div
                      key={b.id || b._id}
                      className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {b.reference || b.id}
                          </span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                            {b.serviceType || "tour"}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                              b.status === "confirmed"
                                ? "bg-emerald-100 text-emerald-800"
                                : b.status === "cancelled"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 mt-1">
                          {b.tourName || "Custom Reservation"}
                        </h4>
                        <p className="text-xs text-gray-400">
                          {b.travelers || 1} guest{(b.travelers || 1) > 1 ? "s" : ""} •{" "}
                          {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-gray-900">
                          ₹{(b.totalPrice || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl text-xs font-bold text-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Admin Reset Password ─── */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Reset Password</h3>
                <p className="text-xs text-gray-500">For {resettingUser.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setResettingUser(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  New Password (minimum 6 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password…"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password…"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                ⚠️ Resetting the password will unlock the account and reset any failed login attempts.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow transition-all"
                >
                  {resetSubmitting ? "Resetting…" : "Confirm Password Reset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
