import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { TopBar } from "../../components/CustomComponents";
import {
  adminGetUser,
  adminSuspendUser,
  adminDeleteUser,
} from "../../services/admin.services";

const AdminUserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await adminGetUser(userId);
        setData(res);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to load user");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  const handleSuspend = async () => {
    try {
      const res = await adminSuspendUser(userId);
      toast.success(`User ${res.user.status === "approved" ? "unsuspended" : "suspended"}`);
      setData((prev) => ({ ...prev, user: { ...prev.user, status: res.user.status } }));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      await adminDeleteUser(userId);
      toast.success("User deleted");
      navigate("/admin/users");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete user");
    }
  };

  if (loading) {
    return (
      <>
        <TopBar title="User Detail" />
        <div className="admin-page" style={{ textAlign: "center", paddingTop: "60px", color: "var(--muted-foreground)" }}>
          Loading...
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <TopBar title="User Detail" />
        <div className="admin-page" style={{ textAlign: "center", paddingTop: "60px", color: "var(--muted-foreground)" }}>
          User not found.
        </div>
      </>
    );
  }

  const { user, mediaCount, totalApiCalls, purchases } = data;

  return (
    <>
      <TopBar title="User Detail" />
      <div className="admin-page">
        <button className="admin-back-btn" onClick={() => navigate("/admin/users")}>
          <ArrowLeft size={14} />
          Back to Users
        </button>

        {/* Profile Card */}
        <div className="admin-user-profile-card">
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "var(--primary-hover)",
              border: "2px solid var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              fontWeight: "700",
              color: "var(--primary)",
              flexShrink: 0,
            }}
          >
            {user.name?.charAt(0)?.toUpperCase() || "?"}
          </div>

          <div className="admin-user-profile-info">
            <h2>{user.name}</h2>
            <p>{user.email}</p>
            <div style={{ display: "flex", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
              <span className={`role-badge ${user.role}`}>{user.role}</span>
              <span className={`status-badge ${user.status}`}>{user.status}</span>
            </div>
            <p style={{ marginTop: "8px" }}>
              Credits: <strong>{user.credits ?? 0}</strong>
            </p>
            <p>
              Joined:{" "}
              <strong>
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
              </strong>
            </p>
          </div>

          <div className="admin-user-profile-actions">
            <button
              className={`admin-btn ${user.status === "approved" ? "admin-btn-warn" : "admin-btn-primary"}`}
              onClick={handleSuspend}
            >
              {user.status === "approved" ? "Suspend" : "Unsuspend"}
            </button>
            <button className="admin-btn admin-btn-danger" onClick={handleDelete}>
              Delete User
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="admin-stat-grid">
          <div className="admin-stat-card">
            <p>Total Media Files</p>
            <h2>{mediaCount ?? 0}</h2>
          </div>
          <div className="admin-stat-card">
            <p>Total API Calls</p>
            <h2>{totalApiCalls ?? 0}</h2>
          </div>
          <div className="admin-stat-card">
            <p>Total Purchases</p>
            <h2>{purchases?.length ?? 0}</h2>
          </div>
        </div>

        {/* Purchases Table */}
        <div>
          <p className="admin-section-title">Purchase History</p>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Credits</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {purchases?.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "30px", color: "var(--muted-foreground)" }}>
                      No purchases found.
                    </td>
                  </tr>
                ) : (
                  purchases?.map((p) => (
                    <tr key={p._id}>
                      <td style={{ fontSize: "13px" }}>
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td>{p.credits ?? "—"}</td>
                      <td>{p.price != null ? `€${p.price}` : "—"}</td>
                      <td>
                        <span className={`status-badge ${p.status}`}>{p.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminUserDetail;
