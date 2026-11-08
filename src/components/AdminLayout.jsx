import { NavLink, Outlet, useNavigate } from "react-router";

import Icon from "@components/Icon";
import { Notice } from "@components/PageParts";
import { useAuth } from "@hooks/useAuth";

const NAV_GROUPS = [
  { label: "Workspace", items: [{ to: "/dashboard", icon: "overview", label: "Overview" }] },
  {
    label: "Sales",
    items: [
      { to: "/orders", icon: "orders", label: "Orders" },
      { to: "/payments", icon: "payments", label: "Payments" },
    ],
  },
  {
    label: "Store",
    items: [
      { to: "/products", icon: "products", label: "Products" },
      { to: "/users", icon: "users", label: "Users" },
      { to: "/messages", icon: "messages", label: "Contact messages" },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/banners", icon: "banners", label: "Home banners" },
      { to: "/posts", icon: "posts", label: "Blog posts" },
      { to: "/comments", icon: "comments", label: "Comments" },
    ],
  },
];

export default function AdminLayout() {
  const { user, logout, notice, clearNotice } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <NavLink className="brand" to="/dashboard">
          <span className="brand-mark">A</span>
          <span>
            AVENGERS<small>ADMIN CONSOLE</small>
          </span>
        </NavLink>
        <nav className="side-nav" aria-label="Main navigation">
          {NAV_GROUPS.map((group) => (
            <div className="nav-group" key={group.label}>
              <div className="nav-label">{group.label}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
                >
                  <span className="nav-icon">
                    <Icon name={item.icon} size={15} />
                  </span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="avatar">
            {(user?.displayName || user?.email || "A").slice(0, 1).toUpperCase()}
          </span>
          <div className="user-meta">
            <strong>{user?.displayName || "Administrator"}</strong>
            <span>{user?.email}</span>
          </div>
          <button className="icon-button" type="button" onClick={handleLogout} title="Sign out">
            <Icon name="logout" size={15} />
            <span className="visually-hidden">Sign out</span>
          </button>
        </div>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <span>
            AVENGERS <span className="topbar-divider">/</span> MANAGEMENT
          </span>
          <span className="online-indicator">
            <i /> ADMIN SESSION
          </span>
        </header>
        <div className="page-content">
          <Notice tone="warning" onClose={clearNotice}>
            {notice}
          </Notice>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
