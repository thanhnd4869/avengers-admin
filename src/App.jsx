import { createBrowserRouter, Navigate, RouterProvider } from "react-router";

import AdminLayout from "@components/AdminLayout";
import AuthProvider from "@components/AuthProvider";
import RequireAdmin from "@components/RequireAdmin";
import { useAuth } from "@hooks/useAuth";
import BannersPage from "@pages/BannersPage";
import CommentsPage from "@pages/CommentsPage";
import ContactMessagesPage from "@pages/ContactMessagesPage";
import ContentCollectionPage from "@pages/ContentCollectionPage";
import DashboardPage from "@pages/DashboardPage";
import LoginPage from "@pages/LoginPage";
import OrderDetailPage from "@pages/OrderDetailPage";
import OrdersPage from "@pages/OrdersPage";
import PaymentsPage from "@pages/PaymentsPage";
import PostEditPage from "@pages/PostEditPage";
import PostsPage from "@pages/PostsPage";
import SitePagesPage from "@pages/SitePagesPage";
import ProductEditPage from "@pages/ProductEditPage";
import ProductsPage from "@pages/ProductsPage";
import UserDetailPage from "@pages/UserDetailPage";
import UsersPage from "@pages/UsersPage";

function HomeRoute() {
  const { status, user } = useAuth();

  if (status === "loading") return <div className="screen-loader">Loading Avengers Admin…</div>;
  return <Navigate to={user?.role === "admin" ? "/dashboard" : "/login"} replace />;
}

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <RequireAdmin />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: "/", element: <HomeRoute /> },
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/orders", element: <OrdersPage /> },
          { path: "/orders/:number", element: <OrderDetailPage /> },
          { path: "/payments", element: <PaymentsPage /> },
          { path: "/products", element: <ProductsPage /> },
          { path: "/products/:id", element: <ProductEditPage /> },
          { path: "/users", element: <UsersPage /> },
          { path: "/users/:id", element: <UserDetailPage /> },
          { path: "/messages", element: <ContactMessagesPage /> },
          { path: "/banners", element: <BannersPage /> },
          { path: "/posts", element: <PostsPage /> },
          { path: "/posts/:id", element: <PostEditPage /> },
          { path: "/comments", element: <CommentsPage /> },
          { path: "/site-pages", element: <SitePagesPage /> },
          { path: "/galleries", element: <ContentCollectionPage collection="galleries" /> },
          { path: "/media", element: <ContentCollectionPage collection="media" /> },
          { path: "/social-links", element: <ContentCollectionPage collection="social-links" /> },
          { path: "/platforms", element: <ContentCollectionPage collection="platforms" /> },
          {
            path: "/product-categories",
            element: <ContentCollectionPage collection="product-categories" />,
          },
          {
            path: "/post-categories",
            element: <ContentCollectionPage collection="post-categories" />,
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
