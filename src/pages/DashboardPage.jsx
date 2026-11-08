import { useState } from "react";
import { Link } from "react-router";

import Icon from "@components/Icon";
import { FilterTabs, ListState, StatusPill } from "@components/ListControls";
import {
  ArrowLink,
  Notice,
  PageHeading,
  PanelHeading,
  RefreshButton,
  StatCard,
} from "@components/PageParts";
import { useApi } from "@hooks/useApi";
import { getOverview } from "@services/adminService";
import { formatDateTime, formatMoney, formatNumber, ORDER_STATUS_LABELS } from "@utils/format";

const PERIODS = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
];

/** A count that needs a look; it turns `tone` only while it is above zero. */
function Attention({ to, icon, count, label, tone }) {
  return (
    <Link className={`attention ${count > 0 ? tone : ""}`} to={to}>
      <span className="attention-icon">
        <Icon name={icon} size={13} />
      </span>
      <strong>{count ?? "—"}</strong>
      <span>{label}</span>
    </Link>
  );
}

export default function DashboardPage() {
  const [days, setDays] = useState("30");
  const { data, error, loading, refresh } = useApi(() => getOverview(days), days);
  const overview = loading ? null : data?.data;
  const counts = overview?.orderCounts;
  const show = (value) => (overview ? value : "—");

  return (
    <>
      <PageHeading
        eyebrow="CONTROL CENTER"
        title="Overview"
        description="Your Avengers storefront, at a glance."
        actions={
          <>
            <FilterTabs items={PERIODS} value={days} label="Period" onChange={setDays} />
            <RefreshButton onClick={refresh} disabled={loading} />
          </>
        }
      />
      <Notice>{error}</Notice>

      <section className="stats-grid" aria-label="Sales">
        <StatCard
          icon="revenue"
          tone="green"
          label={`Revenue, last ${days} days`}
          value={show(formatMoney(overview?.recentRevenue))}
          hint={overview ? `${overview.recentPaidOrders} paid orders` : null}
          to="/orders?status=paid"
        />
        <StatCard
          icon="orders"
          tone="blue"
          label="Revenue, all time"
          value={show(formatMoney(overview?.revenue))}
          hint={counts ? `${formatNumber(counts.paid)} paid orders` : null}
        />
        <StatCard
          icon="pending"
          tone="orange"
          label="Awaiting payment"
          value={show(formatNumber(counts?.pending))}
          to="/orders?status=pending"
        />
        <StatCard
          icon="users"
          tone="red"
          label="Customers"
          value={show(formatNumber(overview?.users))}
          hint={overview ? `+${overview.newUsers} in ${days} days` : null}
          to="/users"
        />
      </section>

      <section className="attention-row" aria-label="Needs attention">
        <Attention
          to="/payments?status=refund_required"
          icon="refund"
          tone="alert"
          count={overview?.refundsRequired}
          label="refunds owed"
        />
        <Attention
          to="/products"
          icon="stock"
          tone="warn"
          count={overview?.lowStockVariants}
          label={`variants with ≤ ${overview?.lowStockThreshold ?? 5} keys`}
        />
        <Attention
          to="/messages"
          icon="messages"
          tone="warn"
          count={overview?.newMessages}
          label="new messages"
        />
        <Attention
          to="/products?published=false"
          icon="hidden"
          tone="info"
          count={overview ? overview.products - overview.publishedProducts : undefined}
          label="hidden games"
        />
      </section>

      <section className="panel">
        <PanelHeading eyebrow="SALES" title="Latest orders">
          <ArrowLink to="/orders">View all</ArrowLink>
        </PanelHeading>
        <ListState
          loading={loading}
          error=""
          empty={overview?.recentOrders.length === 0}
          emptyText="No orders yet."
        />
        {overview?.recentOrders.length > 0 ? (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th className="numeric">Total</th>
                  <th>Placed</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {overview.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link className="row-link mono" to={`/orders/${order.number}`}>
                        {order.number}
                      </Link>
                    </td>
                    <td>{order.customer?.email ?? order.customer?.displayName ?? "—"}</td>
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
        ) : null}
      </section>
    </>
  );
}
