import { Link, useParams } from "react-router";

import { ListState, StatusPill } from "@components/ListControls";
import { ArrowLink, BackLink, PageHeading, PanelHeading } from "@components/PageParts";
import { useApi } from "@hooks/useApi";
import { getOrder } from "@services/adminService";
import {
  formatDateTime,
  formatMoney,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  paymentDisplayStatus,
} from "@utils/format";

export default function OrderDetailPage() {
  const { number } = useParams();
  const { data, error, loading } = useApi(() => getOrder(number), number);
  const order = data?.data;

  return (
    <>
      <BackLink to="/orders">All orders</BackLink>
      <ListState loading={loading} error={error} />
      {order ? (
        <>
          <PageHeading
            eyebrow="ORDER"
            title={order.number}
            titleClassName="mono"
            description={`Placed ${formatDateTime(order.createdAt)}`}
            actions={
              <StatusPill
                status={order.overdue ? "expired" : order.status}
                labels={ORDER_STATUS_LABELS}
                className="status-pill-lg"
              />
            }
          />

          <div className="detail-grid">
            <section className="panel detail-card">
              <h2>Customer</h2>
              {order.customer ? (
                <dl className="facts">
                  <dt>Name</dt>
                  <dd>
                    <Link className="row-link" to={`/users/${order.customer.id}`}>
                      {order.customer.displayName}
                    </Link>
                  </dd>
                  <dt>Email</dt>
                  <dd>{order.customer.email ?? "—"}</dd>
                </dl>
              ) : (
                <p className="muted">This account was deleted.</p>
              )}
            </section>
            <section className="panel detail-card">
              <h2>Timeline</h2>
              <dl className="facts">
                <dt>Placed</dt>
                <dd>{formatDateTime(order.createdAt)}</dd>
                <dt>Hold until</dt>
                <dd>{formatDateTime(order.expiresAt)}</dd>
                {order.paidAt ? (
                  <>
                    <dt>Paid</dt>
                    <dd>{formatDateTime(order.paidAt)}</dd>
                  </>
                ) : null}
                {order.keysEmailedAt ? (
                  <>
                    <dt>Keys emailed</dt>
                    <dd>{formatDateTime(order.keysEmailedAt)}</dd>
                  </>
                ) : null}
                {order.cancelledAt ? (
                  <>
                    <dt>Cancelled</dt>
                    <dd>{formatDateTime(order.cancelledAt)}</dd>
                  </>
                ) : null}
                {order.expiredAt ? (
                  <>
                    <dt>Expired</dt>
                    <dd>{formatDateTime(order.expiredAt)}</dd>
                  </>
                ) : null}
              </dl>
            </section>
          </div>

          <section className="panel section-gap">
            <PanelHeading title="Items">
              <span className="result-count">{order.itemCount} keys</span>
            </PanelHeading>
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Game</th>
                    <th>Platform</th>
                    <th className="numeric">Unit price</th>
                    <th className="numeric">Qty</th>
                    <th className="numeric">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.variantId}>
                      <td>
                        <div className="product-cell">
                          <img src={item.product.image?.url} alt="" loading="lazy" />
                          <span>
                            {item.product.name}
                            <span className="cell-sub">{item.edition}</span>
                          </span>
                        </div>
                      </td>
                      <td>{item.platform?.name}</td>
                      <td className="numeric">{formatMoney(item.unitPrice)}</td>
                      <td className="numeric">{item.quantity}</td>
                      <td className="numeric">{formatMoney(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="numeric">
                      Total
                    </td>
                    <td className="numeric">
                      <strong>{formatMoney(order.total)}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <section className="panel">
            <PanelHeading title="Payments">
              {order.payments.some((p) => paymentDisplayStatus(p) === "refund_required") ? (
                <ArrowLink to="/payments?status=refund_required">Refunds owed</ArrowLink>
              ) : (
                <span className="result-count">{order.payments.length} attempts</span>
              )}
            </PanelHeading>
            {order.payments.length === 0 ? (
              <div className="empty-state">No payment was started for this order.</div>
            ) : (
              <div className="table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Provider</th>
                      <th className="numeric">Amount</th>
                      <th>Bank / code</th>
                      <th>Started</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="mono">{payment.txnRef}</td>
                        <td className="upper">{payment.provider}</td>
                        <td className="numeric">{formatMoney(payment.amount)}</td>
                        <td className="muted">
                          {[payment.bankCode, payment.responseCode].filter(Boolean).join(" / ") ||
                            "—"}
                        </td>
                        <td className="muted text-nowrap">{formatDateTime(payment.createdAt)}</td>
                        <td>
                          <StatusPill
                            status={paymentDisplayStatus(payment)}
                            labels={PAYMENT_STATUS_LABELS}
                          />
                          {payment.refundReason ? (
                            <span className="cell-sub">{payment.refundReason}</span>
                          ) : null}
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
