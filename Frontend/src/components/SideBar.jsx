import React, { useState } from "react";
import * as LucideIcons from "lucide-react";
import "../assets/style/SideBar.css";
import { IMAGES, SideBarMenu } from "../utils/constants";
import { useLocation, useNavigate } from "react-router";
import LogoutModel from "../auth/LogoutModel";
import { useAuth } from "../context/AuthContext";

const SideBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [isSideBar, setIsSideBar] = useState(false);
  const [isLogout, setIsLogout] = useState(false);

  const isAdmin = currentUser?.role === "admin";
  const menuItems = isAdmin
    ? SideBarMenu.map((item) =>
        item.route === "/upload-media"
          ? { name: "Users", icon: "Users", route: "/admin/users", activeAt: "/admin/users", startsWith: ["/admin/users"] }
          : item
      )
    : SideBarMenu;

  return (
    <>
      <div className="mobile-topbar-container">
        <img
          onClick={() => {
            navigate("/");
          }}
          src={IMAGES.SiteLogo}
          alt="TaskHive Logo"
          className="sidebar-logo"
        />
        <button
          onClick={() => {
            setIsSideBar(!isSideBar);
          }}
        >
          <LucideIcons.Menu />
        </button>
      </div>
      <aside
        className={`sidebar-container ${!isSideBar ? "sidebar-closed" : ""}`}
      >
        <div className="sidebar-header">
          <div className="landing-page-navbar-logo">
            <img
              src={IMAGES.SiteLogo}
              alt="TaskHive Logo"
              className="sidebar-logo"
            />
            <h3>
              Medio
              <span>Driver</span>
            </h3>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={() => {
              setIsSideBar(false);
            }}
          >
            <LucideIcons.X />
          </button>
        </div>

        <div className="sidebar-divider" />

        <nav className="sidebar-menu">
          {menuItems.map((item, index) => {
            const Icon = LucideIcons[item.icon];
            const isActive = (item) => {
              if (location.pathname === item.activeAt) return true;
              if (!item.startsWith) return false;

              return item.startsWith.some((path) =>
                location.pathname.startsWith(path),
              );
            };

            return (
              <div
                key={index}
                onClick={() => {
                  navigate(item.route);
                  setIsSideBar(false);
                }}
                className={`sidebar-item ${
                  isActive(item) ? "sidebar-item-active" : ""
                }`}
              >
                <Icon size={26} />
                <span className="sidebar-label">{item.name}</span>
              </div>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <button
            onClick={() => {
              setIsLogout(true);
            }}
            className="sidebar-logout-btn"
          >
            <span>
              <LucideIcons.LogOut />
            </span>
            Logout
          </button>
        </div>
        {isLogout && <LogoutModel onClose={() => setIsLogout(false)} />}
      </aside>
    </>
  );
};

export default SideBar;
