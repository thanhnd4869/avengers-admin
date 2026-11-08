import { useState } from "react";

import { FilterTabs, ListState, Pagination } from "@components/ListControls";
import { Notice, PageHeading, RefreshButton } from "@components/PageParts";
import { useApi } from "@hooks/useApi";
import { getContactMessages, updateContactMessageStatus } from "@services/adminService";
import { formatDateTime } from "@utils/format";

const STATUSES = [
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "replied", label: "Replied" },
];
const FILTERS = [{ value: "", label: "All messages" }, ...STATUSES];
const PREVIEW_LENGTH = 120;

export default function ContactMessagesPage() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [savingId, setSavingId] = useState(null);
  const [actionError, setActionError] = useState("");
  // Status changes made here, shown at once without refetching the page.
  const [overrides, setOverrides] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const { data, error, loading, refresh } = useApi(
    () => getContactMessages({ page, limit: 20, status: status || undefined }),
    `${page}|${status}`,
  );
  const messages = (data?.data ?? []).map((message) => overrides[message.id] ?? message);

  async function changeStatus(message, nextStatus) {
    setSavingId(message.id);
    setActionError("");
    try {
      const { data: updated } = await updateContactMessageStatus(message.id, nextStatus);
      setOverrides((current) => ({ ...current, [updated.id]: updated }));
    } catch (cause) {
      setActionError(cause.message || "Could not update message status.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="CUSTOMER SUPPORT"
        title="Contact messages"
        description="Review and track messages from your customers."
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
      <Notice onClose={() => setActionError("")}>{actionError}</Notice>
      <section className="panel">
        <div className="inbox-toolbar">
          <FilterTabs
            items={FILTERS}
            value={status}
            label="Filter messages"
            onChange={(value) => {
              setStatus(value);
              setPage(1);
              setOverrides({});
            }}
          />
          <span className="result-count">{data?.meta.total ?? 0} messages</span>
        </div>
        <ListState
          loading={loading}
          error={error}
          empty={messages.length === 0}
          emptyText="No messages in this view."
        />
        {!loading && messages.length > 0 ? (
          <div className="table-scroll">
            <table className="admin-table inbox-table">
              <thead>
                <tr>
                  <th>Sender</th>
                  <th>Message</th>
                  <th>Received</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((message) => {
                  const expanded = expandedId === message.id;
                  const long = message.message.length > PREVIEW_LENGTH;
                  return (
                    <tr key={message.id} className={message.status === "new" ? "unread-row" : ""}>
                      <td>
                        <a className="sender-link" href={`mailto:${message.email}`}>
                          {message.email}
                        </a>
                      </td>
                      <td>
                        <button
                          className="message-expand"
                          type="button"
                          aria-expanded={expanded}
                          onClick={() => setExpandedId(expanded ? null : message.id)}
                        >
                          {expanded || !long
                            ? message.message
                            : `${message.message.slice(0, PREVIEW_LENGTH)}…`}
                          {long ? (
                            <span className="expand-hint">{expanded ? " Less" : " More"}</span>
                          ) : null}
                        </button>
                      </td>
                      <td className="muted text-nowrap">{formatDateTime(message.createdAt)}</td>
                      <td>
                        <label className="visually-hidden" htmlFor={`status-${message.id}`}>
                          Status for {message.email}
                        </label>
                        <select
                          id={`status-${message.id}`}
                          className={`status-select status-${message.status}`}
                          value={message.status}
                          disabled={savingId === message.id}
                          onChange={(event) => changeStatus(message, event.target.value)}
                        >
                          {STATUSES.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
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
    </>
  );
}
