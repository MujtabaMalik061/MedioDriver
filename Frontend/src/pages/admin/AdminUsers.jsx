import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { TopBar } from "../../components/CustomComponents";
import {
  adminGetAllUsers,
  adminSuspendUser,
  adminUpdateRole,
  adminDeleteUser,
} from "../../services/admin.services";

const ROLES = ["user", "premium"];

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const LIMIT = 10;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminGetAllUsers(page, LIMIT, debouncedSearch);
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSuspend = async (e, userId) => {
    e.stopPropagation();
    try {
      const res = await adminSuspendUser(userId);
      toast.success(`User ${res.user.status === "approved" ? "unsuspended" : "suspended"}`);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, status: res.user.status } : u))
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
  };

  const handleRoleChange = async (e, userId) => {
    e.stopPropagation();
    const role = e.target.value;
    try {
      const res = await adminUpdateRole(userId, role);
      toast.success("Role updated");
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: res.user.role } : u))
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update role");
    }
  };

  const handleDelete = async (e, userId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      await adminDeleteUser(userId);
      toast.success("User deleted");
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setTotal((prev) => prev - 1);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete user");
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <>
      <TopBar title="Admin — Users" />
      <div className="admin-page">
        <div className="admin-search-bar">
          <input
            type="text"
            className="custom-input"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, maxWidth: "360px" }}
          />
          <span style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
            {total} user{total !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Credits</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--muted-foreground)" }}>
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--muted-foreground)" }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} onClick={() => navigate(`/admin/users/${user._id}`)}>
                    <td>{user.name}</td>
                    <td style={{ color: "var(--muted-foreground)", fontSize: "13px" }}>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>{user.role}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.status}`}>{user.status}</span>
                    </td>
                    <td>{user.credits ?? 0}</td>
                    <td style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                        <button
                          className={`admin-btn ${user.status === "approved" ? "admin-btn-warn" : "admin-btn-primary"}`}
                          onClick={(e) => handleSuspend(e, user._id)}
                        >
                          {user.status === "approved" ? "Suspend" : "Unsuspend"}
                        </button>
                        <select
                          className="admin-role-select"
                          value={user.role}
                          onChange={(e) => handleRoleChange(e, user._id)}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <button
                          className="admin-btn admin-btn-danger"
                          onClick={(e) => handleDelete(e, user._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="admin-pagination">
            <button
              className="admin-btn admin-btn-primary"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              className="admin-btn admin-btn-primary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminUsers;
