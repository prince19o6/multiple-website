"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  fetchAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
  deleteAdminUser,
  getAdminUser,
  onAdminSessionChange,
  ADMIN_SITE_NAMES,
  getAdminSite,
  type AdminUser,
} from "@/lib/adminApi";

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Search & Role Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

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
    } catch (err: any) {
      showToast(err?.message || "Failed to load user accounts", "error");
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
  const currentBrand = ADMIN_SITE_NAMES[activeSite] || ADMIN_SITE_NAMES.website1;

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
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole as any } : u))
      );
      showToast(`User role updated to ${newRole}.`);
    } catch (err: any) {
      showToast(err?.message || "Failed to update role", "error");
    }
  };

  const handleStatusToggle = async (user: AdminUser) => {
    if (user.id === currentAdmin?.id) {
      showToast("Cannot disable your own active admin account", "error");
      return;
    }

    const nextDisabled = !user.isDisabled;
    const actionLabel = nextDisabled ? "deactivate" : "activate";
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
      showToast(`User account ${actionLabel}d.`);
    } catch (err: any) {
      showToast(err?.message || "Failed to update status", "error");
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
    } catch (err: any) {
      showToast(err?.message || "Failed to delete user", "error");
    }
  };

  return (
    <div className="space-y-6">
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
          Manage member accounts, promote administrators, and enforce security for{" "}
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
                          {u.isDisabled ? "Disabled" : "Active"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleRoleToggle(u)}
                          disabled={isCurrent}
                          className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-40 rounded-lg text-xs font-bold transition-all"
                        >
                          {isAdmin ? "Demote to User" : "Make Admin"}
                        </button>
                        <button
                          onClick={() => handleStatusToggle(u)}
                          disabled={isCurrent}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all disabled:opacity-40 ${
                            u.isDisabled
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                          }`}
                        >
                          {u.isDisabled ? "Activate" : "Disable"}
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={isCurrent}
                          className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-40 rounded-lg text-xs font-bold transition-all"
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
    </div>
  );
}