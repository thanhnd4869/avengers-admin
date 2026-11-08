import { Link, useParams } from "react-router";

import { ListState, StatusPill } from "@components/ListControls";
import { ArrowLink, BackLink, PageHeading, PanelHeading, StatCard } from "@components/PageParts";
import { useApi } from "@hooks/useApi";
import { getUser } from "@services/adminService";
import { formatDate, formatDateTime, formatMoney, ORDER_STATUS_LABELS } from "@utils/format";

export default function UserDetailPage() {
  const { id } = useParams();
  const { data, error, loading } = useApi(() => getUser(id), id);
  const user = data?.data;

  return (
    <>
      <BackLink to="/users">All users</BackLink>
      <ListState loading={loading} error={error} />
      {user ? (
        <>
          <PageHeading
            eyebrow={user.role === "admin" ? "ADMINISTRATOR" : "CUSTOMER"}
            title={user.displayName}
            description={user.email ?? "No email address"}
          />

          <section className="stats-grid stats-grid-3">
            <StatCard icon="orders" tone="blue" label="Orders" value={user.orderCount} />
            <StatCard
              icon="revenue"
              tone="green"
              label="Total paid"
              value={formatMoney(user.totalSpent)}
            />
            <StatCard
              icon="user"
              tone="orange"
              label="Member since"
              value={<span className="stat-value-sm">{formatDate(user.createdAt)}</span>}
            />
          </section>

          <section className="panel detail-card section-gap">
            <h2>Account</h2>
            <dl className="facts">
              <dt>Role</dt>
              <dd className="upper">{user.role}</dd>
              <dt>Email</dt>
              <dd>{user.emailVerified ? "Verified" : "Not verified"}</dd>
              {user.pendingEmail ? (
                <>
                  <dt>Changing to</dt>
                  <dd>{user.pendingEmail}</dd>
                </>
              ) : null}
              <dt>Password</dt>
              <dd>{user.hasPassword ? "Set" : "Social sign-in only"}</dd>
            </dl>
          </section>

          <section className="panel">
            <PanelHeading title="Latest orders">
              {user.email ? (
                <ArrowLink to={`/orders?q=${encodeURIComponent(user.email)}`}>All orders</ArrowLink>
              ) : null}
            </PanelHeading>
            {user.recentOrders.length === 0 ? (
              <div className="empty-state">No orders yet.</div>
            ) : (
              <div className="table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Items</th>
                      <th className="numeric">Total</th>
                      <th>Placed</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <Link className="row-link mono" to={`/orders/${order.number}`}>
                            {order.number}
                          </Link>
                        </td>
                        <td>{order.itemCount}</td>
                        <td className="numeric">{formatMoney(order.total)}</td>
                        <td className="muted text-nowrap">{formatDateTime(order.createdAt)}</td>
                        <td>
                          <StatusPill
                            status={order.overdue ? "expired" : order.status}
                            labels={ORDER_STATUS_LABELS}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </>
  );
}
