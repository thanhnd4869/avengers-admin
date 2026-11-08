import { useState } from "react";
import { Link, useSearchParams } from "react-router";

import { FilterTabs, ListState, Pagination, SearchBox, StatusPill } from "@components/ListControls";
import { PageHeading, RefreshButton } from "@components/PageParts";
import { useApi } from "@hooks/useApi";
import { getOrders } from "@services/adminService";
import { formatDateTime, formatMoney, ORDER_STATUS_LABELS } from "@utils/format";

const FILTERS = [
  { value: "", label: "All orders" },
  ...Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

export default function OrdersPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState(() => searchParams.get("status") ?? "");
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [page, setPage] = useState(1);
  const { data, error, loading, refresh } = useApi(
    () => getOrders({ page, status, q: search }),
    `${page}|${status}|${search}`,
  );
  const orders = data?.data ?? [];

  return (
    <>
      <PageHeading
        eyebrow="SALES"
        title="Orders"
        description="Every checkout, with its customer and payment state."
        actions={<RefreshButton onClick={refresh} disabled={loading} />}
      />
      <section className="panel">
        <div className="inbox-toolbar">
          <FilterTabs
            items={FILTERS}
            value={status}
            label="Filter orders"
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          />
          <SearchBox
            value={search}
            placeholder="Order number, email or name"
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
          />
        </div>
        <ListState
          loading={loading}
          error={error}
          empty={orders.length === 0}
          emptyText="No orders in this view."
        />
        {!loading && orders.length > 0 ? (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th className="numeric">Total</th>
                  <th>Placed</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link className="row-link mono" to={`/orders/${order.number}`}>
                        {order.number}
                      </Link>
                    </td>
                    <td>
                      {order.customer ? (
                        <Link className="row-link" to={`/users/${order.customer.id}`}>
                          {order.customer.displayName}
                          <span className="cell-sub">{order.customer.email ?? "No email"}</span>
                        </Link>
                      ) : (
                        <span className="muted">Deleted account</span>
                      )}
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
        ) : null}
        <Pagination meta={data?.meta} page={page} loading={loading} onChange={setPage} />
      </section>
    </>
  );
}
