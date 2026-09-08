'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserX,
  UserCheck,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  Lock,
} from 'lucide-react';
import AdminPhotoManager from '@/components/admin/AdminPhotoManager';

export default function AdminUsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState('');
  const [accountStatus, setAccountStatus] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ totalPages: 1, totalCount: 0 });

  // Selected user for modal inspection or action confirmation
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    user: any;
    action: 'SUSPEND' | 'UNSUSPEND' | 'BAN' | 'UNBAN' | 'DELETE' | 'ROLE_CHANGE';
    newRole?: string;
  } | null>(null);

  const [confirmReason, setConfirmReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Search Debouncing (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchUsers = async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search: debouncedSearch,
        role,
        accountStatus,
        isEmailVerified,
      });

      const res = await fetch(`/api/admin/users?${params}`, { signal });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to fetch users');

      setUsers(data.users || []);
      setPagination(data.pagination || { totalPages: 1, totalCount: 0 });
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchUsers(controller.signal);
    return () => controller.abort();
  }, [page, debouncedSearch, role, accountStatus, isEmailVerified]);

  const handleExecuteAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    setError('');

    try {
      if (actionModal.action === 'DELETE') {
        const res = await fetch(`/api/admin/users?userId=${actionModal.user.id}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Delete failed');
      } else {
        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: actionModal.user.id,
            action: actionModal.action === 'ROLE_CHANGE' ? 'UPDATE_ROLE' : actionModal.action,
            role: actionModal.newRole,
            reason: confirmReason,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Action failed');
      }

      setActionModal(null);
      setConfirmReason('');
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-600" /> Platform User Directory
            </h2>
            <p className="text-xs text-slate-500">
              Manage accounts, moderate status, update roles, review verification, and manage profile photos. Total ({pagination.totalCount})
            </p>
          </div>

          <button
            onClick={() => fetchUsers()}
            className="self-start sm:self-auto p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
            title="Reload Directory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by email, phone, ID, or name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="CUSTOMER">Customer</option>
            <option value="COMPANION">Companion</option>
            <option value="ADMIN">Admin</option>
          </select>

          <select
            value={accountStatus}
            onChange={(e) => {
              setAccountStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending OTP</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="BANNED">Banned</option>
          </select>

          <select
            value={isEmailVerified}
            onChange={(e) => {
              setIsEmailVerified(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            <option value="">All Verifications</option>
            <option value="true">Email Verified</option>
            <option value="false">Email Unverified</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl">
          {error}
        </div>
      )}

      {/* Users Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">User Info</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4">Email OTP State</th>
                <th className="py-3.5 px-4">Reg Fee</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-36"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const name = u.customerProfile?.name || u.companionProfile?.displayName || 'User';
                  const avatarUrl = u.customerProfile?.displayAvatar || u.companionProfile?.profilePhoto;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs border border-slate-200 shrink-0">
                              {name?.[0] || 'U'}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-900 block">{name}</span>
                            <span className="text-[11px] text-slate-500 block font-mono">{u.email}</span>
                            {u.phone && <span className="text-[10px] text-slate-400 font-mono block">{u.phone}</span>}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : u.role === 'COMPANION'
                              ? 'bg-brand-100 text-brand-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            u.accountStatus === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : u.accountStatus === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : u.accountStatus === 'SUSPENDED'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {u.accountStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {u.isEmailVerified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-semibold text-[11px]">
                              <XCircle className="w-3.5 h-3.5" /> Pending ({u.emailVerificationAttempts} attempts)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {u.isRegistrationFeePaid ? (
                          <span className="text-emerald-700 font-bold text-[11px]">Paid (₹399)</span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Unpaid</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Inspect Profile & Manage Photos"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {u.accountStatus === 'SUSPENDED' ? (
                            <button
                              onClick={() => setActionModal({ open: true, user: u, action: 'UNSUSPEND' })}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                              title="Unsuspend Account"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setActionModal({ open: true, user: u, action: 'SUSPEND' })}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors cursor-pointer"
                              title="Suspend Account"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {u.accountStatus === 'BANNED' ? (
                            <button
                              onClick={() => setActionModal({ open: true, user: u, action: 'UNBAN' })}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                              title="Unban Account"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setActionModal({ open: true, user: u, action: 'BAN' })}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors cursor-pointer"
                              title="Ban Account"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => setActionModal({ open: true, user: u, action: 'DELETE' })}
                            className="p-1.5 bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-400 rounded-lg transition-colors cursor-pointer"
                            title="Safe Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold disabled:opacity-50 cursor-pointer"
            >
              Previous
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold disabled:opacity-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* USER DETAIL INSPECTOR & PHOTO MANAGEMENT MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">User Inspection &amp; Photo Management</h3>
                <span className="text-xs text-slate-400 font-mono">ID: {selectedUser.id}</span>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 text-xs">
              {/* ADMIN 5-PHOTO MANAGER */}
              {(selectedUser.customerProfile || selectedUser.companionProfile) && (
                <AdminPhotoManager
                  userId={selectedUser.id}
                  userRole={selectedUser.role}
                  initialPrimaryPhoto={
                    selectedUser.customerProfile?.displayAvatar ||
                    selectedUser.companionProfile?.profilePhoto ||
                    null
                  }
                  initialGalleryPhotos={
                    selectedUser.customerProfile?.gallery ||
                    selectedUser.companionProfile?.gallery ||
                    []
                  }
                  onPhotosChange={({ primaryPhoto, galleryPhotos }) => {
                    setSelectedUser((prev: any) => {
                      if (!prev) return null;
                      if (prev.customerProfile) {
                        return {
                          ...prev,
                          customerProfile: {
                            ...prev.customerProfile,
                            displayAvatar: primaryPhoto,
                            gallery: galleryPhotos,
                          },
                        };
                      }
                      if (prev.companionProfile) {
                        return {
                          ...prev,
                          companionProfile: {
                            ...prev.companionProfile,
                            profilePhoto: primaryPhoto,
                            gallery: galleryPhotos,
                          },
                        };
                      }
                      return prev;
                    });

                    setUsers((prev) =>
                      prev.map((u) => {
                        if (u.id !== selectedUser.id) return u;
                        if (u.customerProfile) {
                          return {
                            ...u,
                            customerProfile: { ...u.customerProfile, displayAvatar: primaryPhoto, gallery: galleryPhotos },
                          };
                        }
                        if (u.companionProfile) {
                          return {
                            ...u,
                            companionProfile: { ...u.companionProfile, profilePhoto: primaryPhoto, gallery: galleryPhotos },
                          };
                        }
                        return u;
                      })
                    );
                  }}
                />
              )}

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-bold block">Email</span>
                  <span className="font-semibold text-slate-900 font-mono">{selectedUser.email}</span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block">Phone</span>
                  <span className="font-semibold text-slate-900 font-mono">{selectedUser.phone || 'N/A'}</span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block">Role</span>
                  <span className="font-bold text-brand-600">{selectedUser.role}</span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block">Account Status</span>
                  <span className="font-bold text-slate-900">{selectedUser.accountStatus}</span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block">Email Verified</span>
                  <span className="font-semibold text-slate-900">
                    {selectedUser.isEmailVerified ? 'Yes' : 'No'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block">Registration Fee</span>
                  <span className="font-semibold text-slate-900">
                    {selectedUser.isRegistrationFeePaid ? 'Paid (₹399)' : 'Unpaid'}
                  </span>
                </div>
              </div>

              {selectedUser.customerProfile && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <h4 className="font-bold text-slate-900">Customer Profile Data</h4>
                  <p>Name: <strong>{selectedUser.customerProfile.name}</strong></p>
                  <p>City: <strong>{selectedUser.customerProfile.city || 'N/A'}</strong></p>
                  <p>Age / Gender: <strong>{selectedUser.customerProfile.age} / {selectedUser.customerProfile.gender}</strong></p>
                </div>
              )}

              {selectedUser.companionProfile && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <h4 className="font-bold text-slate-900">Companion Profile Data</h4>
                  <p>Display Name: <strong>{selectedUser.companionProfile.displayName}</strong></p>
                  <p>Username: <strong>@{selectedUser.companionProfile.username}</strong></p>
                  <p>City: <strong>{selectedUser.companionProfile.city?.name || 'N/A'}</strong></p>
                  <p>Verification Status: <strong>{selectedUser.companionProfile.verificationStatus}</strong></p>
                </div>
              )}

              <div className="text-[11px] text-slate-400">
                Created: {new Date(selectedUser.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION CONFIRMATION MODAL */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-black text-slate-900">Confirm Admin Action</h3>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to <strong>{actionModal.action}</strong> the user account for{' '}
              <span className="font-mono font-bold text-slate-900">{actionModal.user.email}</span>?
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Admin Note (Optional)</label>
              <textarea
                value={confirmReason}
                onChange={(e) => setConfirmReason(e.target.value)}
                placeholder="Enter justification for audit trail..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-brand-500"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActionModal(null)}
                disabled={actionLoading}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAction}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
              >
                {actionLoading ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
