import { useState } from "react";
import { Link, useSearchParams } from "react-router";

import FormField from "@components/FormField";
import Icon from "@components/Icon";
import { FilterTabs, ListState, Pagination, StatusPill } from "@components/ListControls";
import Modal from "@components/Modal";
import { Notice, PageHeading, RefreshButton } from "@components/PageParts";
import { useApi } from "@hooks/useApi";
import { getPayments, markPaymentRefunded, refundPaymentViaVnpay } from "@services/adminService";
import {
  formatDateTime,
  formatMoney,
  PAYMENT_STATUS_LABELS,
  paymentDisplayStatus,
} from "@utils/format";

const FILTERS = [
  { value: "", label: "All payments" },
  ...Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

export default function PaymentsPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState(() => searchParams.get("status") ?? "");
  const [page, setPage] = useState(1);
  const [overrides, setOverrides] = useState({});
  const [refunding, setRefunding] = useState(null);
  const [notice, setNotice] = useState("");
  const { data, error, loading, refresh } = useApi(
    () => getPayments({ page, status }),
    `${page}|${status}`,
  );
  const payments = (data?.data ?? []).map((payment) => ({
    ...payment,
    ...overrides[payment.id],
  }));

  return (
    <>
      <PageHeading
        eyebrow="SALES"
        title="Payments"
        description="VNPay attempts and refunds owed. Refunds can be sent to VNPay or recorded after an external refund."
        actions={
          <RefreshButton
            disabled={loading}
            onClick={() => {
              setOverrides({});
              refresh();
            }}
          />
        }
      />
      <Notice tone="success" onClose={() => setNotice("")}>
        {notice}
      </Notice>
      <section className="panel">
        <div className="inbox-toolbar">
          <FilterTabs
            items={FILTERS}
            value={status}
            label="Filter payments"
            onChange={(value) => {
              setStatus(value);
              setPage(1);
              setOverrides({});
            }}
          />
          <span className="result-count">{data?.meta.total ?? 0} payments</span>
        </div>
        <ListState
          loading={loading}
          error={error}
          empty={payments.length === 0}
          emptyText="No payments in this view."
        />
        {!loading && payments.length > 0 ? (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th className="numeric">Amount</th>
                  <th>Started</th>
                  <th>Status</th>
                  <th className="actions-col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const displayStatus = paymentDisplayStatus(payment);
                  return (
                    <tr key={payment.id}>
                      <td className="mono">
                        {payment.txnRef}
                        {payment.providerTransactionNo ? (
                          <span className="cell-sub">VNPay #{payment.providerTransactionNo}</span>
                        ) : null}
                      </td>
                      <td>
                        {payment.order ? (
                          <Link className="row-link mono" to={`/orders/${payment.order.number}`}>
                            {payment.order.number}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        {payment.customer ? (
                          <Link className="row-link" to={`/users/${payment.customer.id}`}>
                            {payment.customer.email ?? payment.customer.displayName}
                          </Link>
                        ) : (
                          <span className="muted">Deleted account</span>
                        )}
                      </td>
                      <td className="numeric">{formatMoney(payment.amount)}</td>
                      <td className="muted text-nowrap">{formatDateTime(payment.createdAt)}</td>
                      <td>
                        <StatusPill status={displayStatus} labels={PAYMENT_STATUS_LABELS} />
                        {payment.refundReason ? (
                          <span className="cell-sub">{payment.refundReason}</span>
                        ) : null}
                        {payment.refundedAt ? (
                          <span className="cell-sub">
                            {payment.refundMethod === "vnpay"
                              ? "Refunded via VNPay"
                              : "Refunded manually"}{" "}
                            {formatDateTime(payment.refundedAt)}
                            {payment.refundNote ? ` · ${payment.refundNote}` : ""}
                          </span>
                        ) : null}
                        {payment.refundProviderTransactionNo ? (
                          <span className="cell-sub">
                            Refund transaction #{payment.refundProviderTransactionNo}
                          </span>
                        ) : null}
                        {payment.refundStatus === "processing" ? (
                          <span className="cell-sub">VNPay refund processing</span>
                        ) : null}
                        {payment.refundStatus === "unknown" ? (
                          <span className="cell-sub">
                            Refund result unknown — reconcile with VNPay before retrying.
                          </span>
                        ) : null}
                        {payment.refundStatus === "failed" && payment.refundError ? (
                          <span className="cell-sub">VNPay: {payment.refundError}</span>
                        ) : null}
                        {payment.refundAttempts?.map((attempt, index) => (
                          <span
                            className="cell-sub"
                            key={`${attempt.requestId ?? attempt.method}-${index}`}
                          >
                            {attempt.method === "vnpay" ? "VNPay" : "Manual"} {attempt.status}
                            {attempt.responseCode ? ` · code ${attempt.responseCode}` : ""}
                            {attempt.error ? ` · ${attempt.error}` : ""}
                          </span>
                        ))}
                      </td>
                      <td className="actions-col">
                        {displayStatus === "refund_required" ? (
                          <button
                            type="button"
                            className="secondary-button compact"
                            onClick={() => setRefunding(payment)}
                          >
                            <Icon name="refund" size={11} /> Process refund
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
        <Pagination meta={data?.meta} page={page} loading={loading} onChange={setPage} />
      </section>
      {refunding ? (
        <RefundModal
          payment={refunding}
          onClose={() => setRefunding(null)}
          onSaved={(updated) => {
            setOverrides((current) => ({ ...current, [updated.id]: updated }));
            setRefunding(null);
            setNotice(
              updated.refundMethod === "vnpay"
                ? `VNPay refund of ${formatMoney(updated.amount)} completed.`
                : `Manual refund of ${formatMoney(updated.amount)} recorded.`,
            );
          }}
        />
      ) : null}
    </>
  );
}

function RefundModal({ payment, onClose, onSaved }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event, method = "vnpay") {
    event?.preventDefault();
    if (
      method === "manual" &&
      !window.confirm("Confirm that this payment has already been refunded outside the system?")
    ) {
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { data } =
        method === "vnpay"
          ? await refundPaymentViaVnpay(payment.id, note)
          : await markPaymentRefunded(payment.id, note);
      onSaved(data);
    } catch (cause) {
      setError(cause.message);
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Refund payment"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="secondary-button"
            disabled={saving}
            onClick={() => submit(null, "manual")}
          >
            Record manual refund
          </button>
          <button
            type="submit"
            form="refund-form"
            className="primary-button"
            disabled={
              saving ||
              !payment.providerTransactionNo ||
              !payment.paidAt ||
              ["unknown", "processing"].includes(payment.refundStatus)
            }
          >
            <Icon name="refund" size={12} /> {saving ? "Sending…" : "Refund via VNPay"}
          </button>
        </>
      }
    >
      <form id="refund-form" onSubmit={submit}>
        <Notice>{error}</Notice>
        <dl className="facts facts-compact">
          <dt>Reference</dt>
          <dd className="mono">{payment.txnRef}</dd>
          <dt>Amount</dt>
          <dd>{formatMoney(payment.amount)}</dd>
          <dt>Reason</dt>
          <dd>{payment.refundReason ?? "—"}</dd>
          <dt>VNPay transaction</dt>
          <dd className="mono">{payment.providerTransactionNo ?? "Unavailable"}</dd>
        </dl>
        <Notice tone="warning">
          VNPay will be asked to refund the full payment amount. If the request times out, check the
          VNPay merchant portal before retrying. Use the manual option only after confirming the
          refund was completed externally.
        </Notice>
        {payment.refundStatus === "unknown" || payment.refundStatus === "processing" ? (
          <Notice>
            Automatic retry is blocked while the previous result is unresolved. Reconcile this
            transaction with VNPay first.
          </Notice>
        ) : null}
        <FormField
          id="refund-note"
          label="Note"
          hint="Optional audit note. For manual refunds, include the external transaction reference."
        >
          <textarea
            id="refund-note"
            rows={3}
            maxLength={500}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </FormField>
      </form>
    </Modal>
  );
}
