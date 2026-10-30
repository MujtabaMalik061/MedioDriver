import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Users, LayoutDashboard, ArrowLeft } from "lucide-react";
import { IMAGES } from "../utils/constants";
import "../assets/style/Admin.css";

const AdminLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-wrap">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">
            <img src={IMAGES.SiteLogo} alt="Logo" style={{ height: "28px" }} />
          </div>
          <div className="admin-sidebar-heading">Admin Panel</div>
        </div>

        <nav className="admin-sidebar-nav">
          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `admin-nav-item${isActive ? " active" : ""}`
            }
          >
            <Users size={16} />
            Users
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <button
            className="admin-nav-item"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
