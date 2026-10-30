import React, { useEffect, useState, useCallback } from "react";
import "../assets/style/Dashboard.css";
import "../assets/style/Admin.css";
import { Upload, Eye, HardDrive, Key, Users } from "lucide-react";
import Loader from "../components/Loader";
import { BarsChart, PiesChart } from "../components/DashboardCharts";
import {
  fallBackWeeklyUploads,
  fallBackByTypeUploads,
  getStates,
  getWeeklyUploads,
  getUploadsByType,
  getRecentUploads,
} from "../services/dashboard.services.js";
import { timeAgo, formatFileSize } from "../utils/Helper.js";
import { useAuth } from "../context/AuthContext";
import { adminGetDashboardStats, adminGetAllUsers } from "../services/admin.services";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const UserBadge = ({ user }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--primary-hover)", border: "1.5px solid var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", color: "var(--primary)", flexShrink: 0 }}>
      {user?.name?.charAt(0)?.toUpperCase() || "?"}
    </div>
    <div>
      <div style={{ fontSize: "13px", fontWeight: "500" }}>{user?.name || "—"}</div>
      <div style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>{user?.email || ""}</div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const LIMIT = 8;

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        adminGetDashboardStats(),
        adminGetAllUsers(page, LIMIT, debouncedSearch),
      ]);
      setStats(statsRes);
      setUsers(usersRes.users || []);
      setTotal(usersRes.total || 0);
    } catch (err) {
      toast.error("Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="page-container">
      <div className="dashboard-stats-row">
        <StatesCard iconBg="var(--primary-hover)" iconColor="var(--primary)" title="Total Users" value={stats?.totalUsers ?? 0} icon={Users} loading={loading} />
        <StatesCard iconBg="#eaf3fc" iconColor="#308ce8" title="Total Media" value={stats?.totalMedia ?? 0} icon={Upload} loading={loading} />
        <StatesCard iconBg="#fef1e7" iconColor="#f97415" title="Total Storage" value={stats?.totalStorage ?? "0 B"} icon={HardDrive} loading={loading} />
        <StatesCard iconBg="var(--primary-hover)" iconColor="var(--primary)" title="Total API Calls" value={stats?.totalApiCalls ?? 0} icon={Key} loading={loading} />
      </div>

      <div className="chart-container">
        <div className="chart-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>All Users ({total})</h2>
          <input type="text" className="custom-input" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: "260px" }} />
        </div>

        <div className="admin-table-wrap" style={{ marginTop: "12px" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Credits</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "var(--muted-foreground)" }}>Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "var(--muted-foreground)" }}>No users found.</td></tr>
              ) : users.map((u) => (
                <tr key={u._id} onClick={() => navigate(`/admin/users/${u._id}`)} style={{ cursor: "pointer" }}>
                  <td><UserBadge user={u} /></td>
                  <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                  <td><span className={`status-badge ${u.status}`}>{u.status}</span></td>
                  <td>{u.role === "premium" ? "∞" : u.credits ?? 0}</td>
                  <td style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="admin-pagination">
            <button className="admin-btn admin-btn-primary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <span>Page {page} of {totalPages}</span>
            <button className="admin-btn admin-btn-primary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
};

const UserDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState([]);
  const [weeklyUploads, setWeeklyUploads] = useState([]);
  const [byTypeUploads, setByTypeUploads] = useState([]);
  const [recentUploads, setRecentUploads] = useState([]);
  const limitRecentUploads = 5;

useEffect(() => {
  loadDashboardData();
}, []);

const loadDashboardData = async () => {
  try {
    setLoading(true);

    const [statesRes, weeklyUploadsRes, uploadsByTypeRes, recentUploadsRes] =
      await Promise.all([
        getStates(),
        getWeeklyUploads(),
        getUploadsByType(),
        getRecentUploads(limitRecentUploads),
      ]);

    setStates(statesRes);
    setWeeklyUploads(weeklyUploadsRes);
    setByTypeUploads(uploadsByTypeRes);
    setRecentUploads(recentUploadsRes);
  } catch (err) {
    console.error("Failed to load Dashboard Data:", err);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="page-container">
      <div className="dashboard-stats-row">
        <StatesCard
          iconBg="var(--primary-hover)"
          iconColor="var(--primary)"
          title="Total Uploads"
          value={states?.totalUploads || 0}
          icon={Upload}
          loading={loading}
        />
        <StatesCard
          iconBg="#eaf3fc"
          iconColor="#308ce8"
          title="Total Views"
          value={states?.totalViews || 0}
          icon={Eye}
          loading={loading}
        />
        <StatesCard
          iconBg="#fef1e7"
          iconColor="#f97415"
          title="Storage Used"
          value={states?.storageUsed || 0}
          icon={HardDrive}
          loading={loading}
        />
        <StatesCard
          iconBg="var(--primary-hover)"
          iconColor="var(--primary)"
          title="API Calls"
          value={states?.apiCalls || 0}
          icon={Key}
          loading={loading}
        />
      </div>
      <div className="dashboard-charts-wrapper">
        <ChartCard
          title="Uploads This Week"
          contentStyle={{ marginLeft: "-20px" }}
          loading={loading}
          chartType={BarsChart}
          ChartData={
            weeklyUploads?.length > 0 ? weeklyUploads : fallBackWeeklyUploads
          }
        />
        <ChartCard
          title="By Type"
          contentStyle={{ marginLeft: "-20px", padding: "20px" }}
          loading={loading}
          chartType={PiesChart}
          ChartData={
            byTypeUploads?.length > 0 ? byTypeUploads : fallBackByTypeUploads
          }
        />
      </div>
      <div className="chart-container">
        <div className="chart-header">
          <h2>Recent Uploads</h2>
        </div>
        <div className="recent-uploads-table-container">
          {loading ? (
            <Loader style={{ height: "300px" }} />
          ) : recentUploads?.length > 0 ? (
            <div className="media-record-table" style={{ borderRadius: "0px" }}>
              <div
                className="media-record-table-header"
                style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}
              >
                <span>Name</span>
                <span>Type</span>
                <span>Size</span>
                <span>Upload Date</span>
              </div>
              {recentUploads.slice(0, limitRecentUploads).map((upload) => (
                <div
                  className="media-record-row"
                  style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}
                  key={upload.id}
                >
                  <span className="elepsis">{upload?.name || "N/A"}</span>
                  <span>{upload?.type || "N/A"}</span>
                  <span>{formatFileSize(upload?.size) || "N/A"}</span>
                  <span>{timeAgo(upload?.createdAt) || "N/A"}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-data">No recent uploads found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { currentUser } = useAuth();
  if (currentUser?.role === "admin") return <AdminDashboard />;
  return <UserDashboard />;
};

export default Dashboard;

export const StatesCard = ({
  iconBg = "",
  iconColor = "#fff",
  title = "",
  value = "",
  icon: Icon,
  loading = false,
}) => {
  return (
    <div className="dashboard-stat-card">
      <div className="dashboard-stat-card-content">
        <p className="dashboard-stat-title">{title}</p>
        <h3 className="dashboard-stat-value">
          {loading ? <Loader size="25" stroke="2" /> : <>{value}</>}
        </h3>
      </div>
      <div style={{ background: iconBg }} className="dashboard-stat-icon">
        <Icon color={iconColor} />
      </div>
    </div>
  );
};

const ChartCard = ({
  title = "",
  chartType: Chart,
  ChartData = [],
  contentStyle = {},
  loading = false,
}) => {
  return (
    <div className="chart-container">
      <div className="chart-header">
        <h2>{title}</h2>
      </div>
      <div style={contentStyle} className="chart-content-cotainer">
        {loading ? (
          <Loader style={{ height: "300px" }} />
        ) : (
          <Chart Data={ChartData} />
        )}
      </div>
    </div>
  );
};
